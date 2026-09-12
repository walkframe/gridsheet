import * as vscode from 'vscode';
import { parseDelimited, parseDelimitedChunked } from './parse';
import { resolveAiBatch } from './ai';
import type { AiTask } from './aiTypes';

// Notified when a grid editor gains/loses focus so a status-bar item can show
// whether the user is looking at the grid or the raw text of this file.
export interface GridModeSink {
  setGridActive(active: boolean, uri: vscode.Uri): void;
}

const decoder = new TextDecoder();
const encode = (s: string): Uint8Array => Buffer.from(s, 'utf8');
const detectEol = (text: string): '\n' | '\r\n' => (text.includes('\r\n') ? '\r\n' : '\n');

// Our custom document model. Unlike the old CustomTextEditorProvider flow there is
// no backing TextDocument: we own reading, writing, dirty state, revert and hot-exit
// backup. The webview holds the authoritative in-memory grid; `baselineText` is the
// file content as last loaded/saved, used to seed the grid and to detect real
// external changes (vs. our own writes).
class CsvDocument implements vscode.CustomDocument {
  public baselineText: string; // file content as last loaded/saved
  public readonly originalEol: '\n' | '\r\n';
  public restoredFromBackup = false;
  constructor(
    public readonly uri: vscode.Uri,
    initialText: string,
  ) {
    this.baselineText = initialText;
    this.originalEol = detectEol(initialText);
  }
  dispose(): void {}
}

// Per-open-editor state (one panel per document — supportsMultipleEditorsPerDocument
// is false). Holds the webview and the plumbing for the async serialize round-trip
// that save / saveAs / backup drive.
interface PanelState {
  document: CsvDocument;
  webview: vscode.Webview;
  panel: vscode.WebviewPanel;
  // The text the webview currently reflects (LF form). Lets an external-change event
  // skip a needless remount when the file on disk still matches what the grid shows.
  lastKnownText: string;
  // Pending serialize requests: saveId -> resolver. The webview answers a
  // `requestSave` with a `save` message carrying the same id.
  pendingSaves: Map<number, (text: string | null) => void>;
  saveSeq: number;
  disposed: boolean;
}

export class CsvEditorProvider implements vscode.CustomEditorProvider<CsvDocument> {
  private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<
    vscode.CustomDocumentContentChangeEvent<CsvDocument>
  >();
  public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

  private readonly panels = new Map<CsvDocument, PanelState>();
  // Chain serialize requests per document so at most one `requestSave` is ever
  // outstanding to a webview (save and hot-exit backup can both ask). The webview
  // then only tracks a single in-flight save.
  private readonly serializeChain = new WeakMap<CsvDocument, Promise<unknown>>();

  // Latest per-document unsaved state reported by each open grid's webview, kept for
  // the public `getUnsavedState` API (other extensions read it before overwriting a
  // file). `dirty` = manual edits, `evalDirty` = computed values not yet baked.
  private static unsavedState = new Map<string, { dirty: boolean; evalDirty: boolean }>();

  /**
   * Whether the grid showing `uri` has unsaved changes. Returns undefined when the
   * file isn't open in a grid.
   */
  public static getUnsavedState(uri: string): { dirty: boolean; evalDirty: boolean } | undefined {
    return CsvEditorProvider.unsavedState.get(uri);
  }

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly delimiter: string,
    private readonly mode?: GridModeSink,
  ) {}

  // ── CustomEditorProvider: document lifecycle ───────────────────────────────

  async openCustomDocument(
    uri: vscode.Uri,
    openContext: { readonly backupId?: string },
    _token: vscode.CancellationToken,
  ): Promise<CsvDocument> {
    // Hot-exit restore: when a backupId is present it points at our backup file
    // (the unsaved grid content). Load that instead of the on-disk original, and
    // flag the document so resolveCustomEditor marks it dirty.
    const source = openContext.backupId ? vscode.Uri.parse(openContext.backupId) : uri;
    let text = '';
    try {
      text = decoder.decode(await vscode.workspace.fs.readFile(source));
    } catch {
      text = '';
    }
    const doc = new CsvDocument(uri, text);
    doc.restoredFromBackup = openContext.backupId != null;
    return doc;
  }

  // ── CustomEditorProvider: save / revert / backup ───────────────────────────

  saveCustomDocument(document: CsvDocument, _cancellation: vscode.CancellationToken): Thenable<void> {
    return this.writeFile(document, document.uri);
  }

  saveCustomDocumentAs(
    document: CsvDocument,
    destination: vscode.Uri,
    _cancellation: vscode.CancellationToken,
  ): Thenable<void> {
    return this.writeFile(document, destination);
  }

  async revertCustomDocument(document: CsvDocument, _cancellation: vscode.CancellationToken): Promise<void> {
    let text = '';
    try {
      text = decoder.decode(await vscode.workspace.fs.readFile(document.uri));
    } catch {
      text = '';
    }
    document.baselineText = text;
    const st = this.panels.get(document);
    if (st && !st.disposed) {
      st.lastKnownText = text;
      await this.postData(st);
    }
  }

  async backupCustomDocument(
    document: CsvDocument,
    context: vscode.CustomDocumentBackupContext,
    _cancellation: vscode.CancellationToken,
  ): Promise<vscode.CustomDocumentBackup> {
    // Silent serialize (visible = false): a hot-exit backup must NOT run the grid's
    // save flow — that would flash the "Saving" overlay and clear the footer / cell
    // highlights even though the user never saved.
    const serialized = await this.requestSerialize(document, false);
    const text = serialized ?? document.baselineText;
    await vscode.workspace.fs.writeFile(context.destination, encode(this.applyEol(document, text)));
    return {
      id: context.destination.toString(),
      delete: async () => {
        try {
          await vscode.workspace.fs.delete(context.destination);
        } catch {
          /* already gone */
        }
      },
    };
  }

  // Serialize the current grid (via the webview) and write it to `target`, applying
  // the configured line ending. A null serialize result (read-only, or the panel is
  // gone) writes nothing.
  private async writeFile(document: CsvDocument, target: vscode.Uri): Promise<void> {
    const text = await this.requestSerialize(document, true);
    if (text == null) {
      return;
    }
    await vscode.workspace.fs.writeFile(target, encode(this.applyEol(document, text)));
    const st = this.panels.get(document);
    if (st) {
      st.lastKnownText = text;
    }
    // Only the primary file becomes the new baseline (Save As writes a copy).
    if (target.toString() === document.uri.toString()) {
      document.baselineText = text;
    }
  }

  // Ask the webview to serialize its sheet and return the text (LF-joined). Resolves
  // null when there is no live panel or the grid is read-only (nothing to write).
  // `visible` picks the webview flow: a real save ('requestSave') shows the progress
  // overlay and clears the grid's dirty/highlight state; a backup ('requestSerialize')
  // is silent and leaves that state untouched. Both answer with a 'save' message.
  private requestSerialize(document: CsvDocument, visible: boolean): Promise<string | null> {
    const st = this.panels.get(document);
    if (!st || st.disposed) {
      return Promise.resolve(null);
    }
    const prev = this.serializeChain.get(document) ?? Promise.resolve();
    const next = prev.then(
      () =>
        new Promise<string | null>((resolve) => {
          if (st.disposed) {
            return resolve(null);
          }
          const id = ++st.saveSeq;
          st.pendingSaves.set(id, resolve);
          st.webview.postMessage({ type: visible ? 'requestSave' : 'requestSerialize', saveId: id });
        }),
    );
    this.serializeChain.set(
      document,
      next.catch(() => {}),
    );
    return next;
  }

  // Resolve the serialized text to the target line ending: LF/CRLF force it, `auto`
  // keeps the file's original ending. The grid always serializes with '\n'.
  private applyEol(document: CsvDocument, text: string): string {
    const pref = vscode.workspace.getConfiguration('gridsheet.viewer').get<string>('eol', 'auto');
    const eol = pref === 'CRLF' ? '\r\n' : pref === 'LF' ? '\n' : document.originalEol;
    return eol === '\n' ? text : text.replace(/\n/g, '\r\n');
  }

  // ── CustomEditorProvider: the editor UI ────────────────────────────────────

  resolveCustomEditor(
    document: CsvDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): void {
    const webview = webviewPanel.webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')],
    };
    webviewPanel.iconPath = {
      light: vscode.Uri.joinPath(this.context.extensionUri, 'media', 'grid-light.svg'),
      dark: vscode.Uri.joinPath(this.context.extensionUri, 'media', 'grid-dark.svg'),
    };
    webview.html = this.getHtml(webview);

    const st: PanelState = {
      document,
      webview,
      panel: webviewPanel,
      lastKnownText: document.baselineText,
      pendingSaves: new Map(),
      saveSeq: 0,
      disposed: false,
    };
    this.panels.set(document, st);

    const setActive = (active: boolean) => this.mode?.setGridActive(active, document.uri);

    // Watch the file for EXTERNAL changes (another editor, git, etc.). Our own
    // writes land with the same signature as what the grid shows, so they are
    // filtered out and don't cause a remount.
    const dir = vscode.Uri.joinPath(document.uri, '..');
    const base = document.uri.path.split('/').pop() ?? '';
    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(dir, base));
    let needsSync = false;
    const onExternal = async () => {
      let text = '';
      try {
        text = decoder.decode(await vscode.workspace.fs.readFile(document.uri));
      } catch {
        return;
      }
      if (this.sig(text) === this.sig(st.lastKnownText)) {
        return; // the grid already reflects this (e.g. our own save)
      }
      document.baselineText = text;
      if (!webviewPanel.active) {
        needsSync = true;
        return; // defer — remounting a background grid would steal focus
      }
      await this.postData(st);
    };
    watcher.onDidChange(onExternal);
    watcher.onDidCreate(onExternal);

    const viewSub = webviewPanel.onDidChangeViewState(() => {
      setActive(webviewPanel.active);
      if (webviewPanel.active && needsSync) {
        needsSync = false;
        void this.postData(st);
      }
    });
    const cfgSub = vscode.workspace.onDidChangeConfiguration(() => {
      // readOnly / eol are read at save time; nothing to push to an open grid.
    });

    setActive(webviewPanel.active);
    webviewPanel.onDidDispose(() => {
      st.disposed = true;
      setActive(false);
      // Fail any in-flight serialize so a pending save/backup promise never hangs.
      for (const resolve of st.pendingSaves.values()) {
        resolve(null);
      }
      st.pendingSaves.clear();
      watcher.dispose();
      viewSub.dispose();
      cfgSub.dispose();
      this.panels.delete(document);
      CsvEditorProvider.unsavedState.delete(document.uri.toString());
    });

    webview.onDidReceiveMessage(async (msg: IncomingMessage) => {
      if (msg?.type === 'ready' || msg?.type === 'requestData') {
        await this.postData(st);
        // A backup-restored grid opens with unsaved content — flag it dirty once the
        // webview is up so VS Code shows the ● and prompts on close.
        if (msg?.type === 'ready' && document.restoredFromBackup) {
          document.restoredFromBackup = false;
          this._onDidChangeCustomDocument.fire({ document });
        }
      } else if (msg?.type === 'dirtyState') {
        CsvEditorProvider.unsavedState.set(document.uri.toString(), {
          dirty: !!msg.dirty,
          evalDirty: !!msg.evalDirty,
        });
        // Drive VS Code's dirty state (tab ●, close prompt) from what a save would
        // change on disk: manual edits always, and unbaked computed values only when
        // Save Evaluated is on (off saves the formula source verbatim, so a
        // computed value is no diff). The content-change model can only set dirty;
        // it's cleared when saveCustomDocument resolves.
        if (msg.dirty || (msg.evalDirty && msg.evaluate)) {
          this._onDidChangeCustomDocument.fire({ document });
        }
      } else if (msg?.type === 'save' && typeof msg.saveId === 'number') {
        const resolve = st.pendingSaves.get(msg.saveId);
        if (resolve) {
          st.pendingSaves.delete(msg.saveId);
          resolve(msg.skipped ? null : typeof msg.text === 'string' ? msg.text : null);
        }
      } else if (msg?.type === 'requestPaste') {
        const text = await vscode.env.clipboard.readText();
        webview.postMessage({ type: 'paste', text });
      } else if (msg?.type === 'openSettings') {
        void vscode.commands.executeCommand('workbench.action.openSettings', 'gridsheet');
      } else if (msg?.type === 'aiBatch' && typeof msg.id === 'number' && Array.isArray(msg.tasks)) {
        const { id, tasks } = msg;
        const cwd =
          vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath ??
          vscode.Uri.joinPath(document.uri, '..').fsPath;
        try {
          const results = await resolveAiBatch(tasks, { cwd });
          webview.postMessage({ type: 'aiBatchResult', id, results });
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e);
          webview.postMessage({
            type: 'aiBatchResult',
            id,
            results: tasks.map((t) => ({ index: t.index, ok: false, error })),
          });
        }
      }
    });
  }

  // Parse the current baseline text and push it to the webview (initial load,
  // external change, revert, or a view-param change that requests a rebuild).
  private async postData(st: PanelState): Promise<void> {
    st.lastKnownText = st.document.baselineText;
    const viewerCfg = () => vscode.workspace.getConfiguration('gridsheet.viewer');
    const aiCfg = () => vscode.workspace.getConfiguration('gridsheet.ai');
    const rows = await parseDelimitedChunked(
      st.document.baselineText,
      this.delimiter,
      (ratio) => st.webview.postMessage({ type: 'loadProgress', ratio }),
      () => new Promise<void>((r) => setImmediate(r)),
    );
    st.webview.postMessage({
      type: 'data',
      rows,
      delimiter: this.delimiter === '\t' ? 'TSV' : 'CSV',
      readOnly: viewerCfg().get<boolean>('readOnly', false),
      evaluate: viewerCfg().get<boolean>('saveEvaluated', true),
      eager: viewerCfg().get<boolean>('eager', true),
      dateFormats: viewerCfg().get<string[]>('dateFormats', []),
      parseNumber: viewerCfg().get<boolean>('parseNumber', true),
      parseDate: viewerCfg().get<boolean>('parseDate', false),
      parseTime: viewerCfg().get<boolean>('parseTime', false),
      parseBool: viewerCfg().get<boolean>('parseBool', false),
      aiCustom: [
        ...Object.entries((aiCfg().get('alias', {}) ?? {}) as Record<string, string>).map(([name, alias]) => ({
          name,
          alias,
        })),
        ...Object.entries((aiCfg().get('custom', {}) ?? {}) as Record<string, string>).map(([name, command]) => ({
          name,
          command,
        })),
      ],
    });
  }

  // Canonical signature of delimited text: parse to rows, drop trailing empty fields
  // per row and trailing all-empty rows. Two texts with the same signature describe
  // the SAME grid — they differ only in things the grid can't/shouldn't round-trip
  // byte-for-byte (ragged vs. padded rows, a final newline, CRLF vs LF, extra blank
  // rows). Used to tell a real external change apart from our own save.
  private sig(s: string): string {
    const rows = parseDelimited(s, this.delimiter);
    const trimmed = rows.map((r) => {
      let end = r.length;
      while (end > 0 && r[end - 1] === '') {
        end--;
      }
      return r.slice(0, end);
    });
    let n = trimmed.length;
    while (n > 0 && trimmed[n - 1].length === 0) {
      n--;
    }
    return JSON.stringify(trimmed.slice(0, n));
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js'));
    // GridSheet injects its own <style> tags at runtime, so allow inline styles.
    const csp = [
      `default-src 'none'`,
      `img-src ${webview.cspSource} data:`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource} data:`,
      `script-src 'nonce-${nonce}'`,
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body, #root { height: 100%; margin: 0; padding: 0; }
    body { background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
  </style>
  <title>GridSheet CSV/TSV Viewer</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

type IncomingMessage = {
  type?: string;
  text?: string;
  saveId?: number;
  skipped?: boolean;
  id?: number;
  tasks?: AiTask[];
  dirty?: boolean;
  evalDirty?: boolean;
  evaluate?: boolean;
};

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
