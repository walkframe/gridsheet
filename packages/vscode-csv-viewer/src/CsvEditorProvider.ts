import * as vscode from 'vscode';
import { parseDelimited, parseDelimitedChunked } from './parse';
import { resolveAiBatch } from './ai';
import type { AiTask } from './aiTypes';

// Notified when a grid editor gains/loses focus so a status-bar item can show
// whether the user is looking at the grid or the raw text of this file.
export interface GridModeSink {
  setGridActive(active: boolean, uri: vscode.Uri): void;
}

export class CsvEditorProvider implements vscode.CustomTextEditorProvider {
  // The currently-focused grid's "ask the webview to serialize + save" trigger.
  // Cmd+S is intercepted (see the `gridsheet.save` keybinding) and routed here so a
  // large sheet serializes only on save — never on every edit. Null when no grid is
  // focused, in which case the save command falls back to the default save.
  private static activeSave: (() => void) | null = null;

  /** Invoked by the `gridsheet.save` command. Returns false if no grid is focused. */
  public static saveActiveGrid(): boolean {
    if (CsvEditorProvider.activeSave == null) {
      return false;
    }
    CsvEditorProvider.activeSave();
    return true;
  }

  // Latest per-document unsaved state reported by each open grid's webview. The
  // grid keeps edits (and computed values) in memory until the user saves, so the
  // TextDocument itself stays clean — this map is the only signal of pending
  // changes. Keyed by document URI string; entries are removed when the grid
  // closes. Read via `getUnsavedState` by other extensions (e.g. the PICT
  // generator) before they overwrite the file.
  private static unsavedState = new Map<string, { dirty: boolean; evalDirty: boolean }>();

  /**
   * Whether the grid showing `uri` has unsaved changes. `dirty` = manual edits,
   * `evalDirty` = computed (formula/function) values not yet written. Returns
   * undefined when the file isn't open in a grid.
   */
  public static getUnsavedState(uri: string): { dirty: boolean; evalDirty: boolean } | undefined {
    return CsvEditorProvider.unsavedState.get(uri);
  }

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly delimiter: string,
    private readonly mode?: GridModeSink,
  ) {}

  public resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): void {
    const webview = webviewPanel.webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')],
    };
    // Override the tab icon so a grid tab is visually distinct from the raw-text
    // tab (which keeps the icon theme's .csv icon). `light` is shown on light
    // themes (dark strokes), `dark` on dark themes (light strokes).
    webviewPanel.iconPath = {
      light: vscode.Uri.joinPath(this.context.extensionUri, 'media', 'grid-light.svg'),
      dark: vscode.Uri.joinPath(this.context.extensionUri, 'media', 'grid-dark.svg'),
    };
    webview.html = this.getHtml(webview);

    // Canonical signature of delimited text: parse to rows, then drop trailing
    // empty fields per row and trailing all-empty rows. Two texts with the same
    // signature describe the SAME grid — they differ only in things that carry no
    // cell content and that the grid can't (or shouldn't) round-trip byte-for-byte:
    //   - ragged rows vs. the full rectangle the grid serializes (short rows gain
    //     `,,,` padding),
    //   - a final newline (files.insertFinalNewline) or CRLF vs LF (parse swallows \r),
    //   - extra trailing blank rows.
    // We compare signatures — not end-trimmed strings — so none of the above echoes
    // back as a spurious remount (which drops selection/scroll/resizes) or needlessly
    // re-dirties the file. A real cell-content change flips the signature and syncs.
    const sig = (s: string): string => {
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
    };

    // The document text the webview currently reflects — updated whenever we push
    // data to it or apply a grid edit. A change that matches this is one the grid
    // already shows, so it must NOT trigger a remount (which would drop transient
    // state: selection, scroll, and row/column resizes — none of which are stored
    // in the CSV/TSV file).
    let lastKnownText = document.getText();

    const viewerCfg = () => vscode.workspace.getConfiguration('gridsheet.viewer');
    const aiCfg = () => vscode.workspace.getConfiguration('gridsheet.ai');

    const postData = async () => {
      lastKnownText = document.getText();
      // Parse in chunks so a large file (~0.5s at 60MB) doesn't block the extension
      // host and the webview can show a load progress bar instead of a frozen "Loading…".
      const rows = await parseDelimitedChunked(
        lastKnownText,
        this.delimiter,
        (ratio) => webview.postMessage({ type: 'loadProgress', ratio }),
        () => new Promise<void>((r) => setImmediate(r)),
      );
      webview.postMessage({
        type: 'data',
        rows,
        delimiter: this.delimiter === '\t' ? 'TSV' : 'CSV',
        // Initial defaults for this grid; readOnly is then owned per-file by the footer
        // toggle, and evaluateFormulas is a settings-only save policy.
        readOnly: viewerCfg().get<boolean>('readOnly', false),
        evaluate: viewerCfg().get<boolean>('evaluateFormulas', true),
        eager: viewerCfg().get<boolean>('eager', true),
        dateFormats: viewerCfg().get<string[]>('dateFormats', []),
        parseNumber: viewerCfg().get<boolean>('parseNumber', true),
        parseDate: viewerCfg().get<boolean>('parseDate', false),
        parseTime: viewerCfg().get<boolean>('parseTime', false),
        parseBool: viewerCfg().get<boolean>('parseBool', false),
        // User functions come from two name→string maps: gridsheet.ai.alias (value = built-in
        // key) and gridsheet.ai.custom (value = command). Flatten both to [{ name, alias|command }].
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
    };

    // Apply the configured line ending (gridsheet.viewer.eol). `auto` keeps the
    // file's existing EOL; otherwise normalize the whole buffer via setEndOfLine
    // (applied alone — combining it with a content edit historically wiped content).
    const applyEolSetting = async () => {
      const pref = vscode.workspace.getConfiguration('gridsheet.viewer').get<string>('eol', 'auto');
      if (pref !== 'LF' && pref !== 'CRLF') {
        return;
      }
      const target = pref === 'CRLF' ? vscode.EndOfLine.CRLF : vscode.EndOfLine.LF;
      if (document.eol !== target) {
        const edit = new vscode.WorkspaceEdit();
        edit.set(document.uri, [vscode.TextEdit.setEndOfLine(target)]);
        await vscode.workspace.applyEdit(edit);
      }
    };

    // Apply a grid edit back into the TextDocument. This marks the document dirty
    // (tab shows ●) and Ctrl+S then saves it through VS Code's normal flow. A
    // serialization that carries the same cell content as the document (a pure
    // resize, entering an empty margin cell, or ragged->rectangle padding) is
    // skipped so it doesn't needlessly dirty the file.
    const updateDocument = async (text: string) => {
      if (sig(text) === sig(document.getText())) {
        return;
      }
      lastKnownText = text;
      const edit = new vscode.WorkspaceEdit();
      const fullRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(document.lineCount, 0));
      edit.replace(document.uri, fullRange, text);
      await vscode.workspace.applyEdit(edit);
      await applyEolSetting();
    };

    // Route Cmd+S for THIS grid: ask the webview to serialize the current sheet and
    // post it back as a 'save' message. Registered as the active handler while this
    // panel is focused (below), so the global `gridsheet.save` command reaches it.
    const requestSave = () => webview.postMessage({ type: 'requestSave' });
    const setActive = (active: boolean) => {
      this.mode?.setGridActive(active, document.uri);
      if (active) {
        CsvEditorProvider.activeSave = requestSave;
      } else if (CsvEditorProvider.activeSave === requestSave) {
        CsvEditorProvider.activeSave = null;
      }
    };

    // When the grid isn't the active editor (e.g. after "Open as text"), defer
    // external re-syncs. Otherwise remounting the grid re-runs the cell editor's
    // autoFocus and steals focus from whatever editor the user is typing in. We
    // sync once the grid becomes active again.
    let needsSync = false;
    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() !== document.uri.toString()) {
        return;
      }
      // The webview already reflects this content (its own edit, or a save-time
      // tweak like a final newline / EOL normalization) — don't remount. Only
      // re-sync on a real external change to cell content.
      if (sig(e.document.getText()) === sig(lastKnownText)) {
        return;
      }
      if (!webviewPanel.active) {
        needsSync = true;
        return;
      }
      postData();
    });
    const viewSub = webviewPanel.onDidChangeViewState(() => {
      setActive(webviewPanel.active);
      if (webviewPanel.active && needsSync) {
        needsSync = false;
        postData();
      }
    });
    // Apply the EOL preference immediately when it changes (not only on next edit).
    const cfgSub = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('gridsheet.viewer.eol')) {
        void applyEolSetting();
      }
      // readOnly is only the initial default; the per-file footer toggle owns it after
      // open, so a settings change does not disturb (or remount) an already-open grid.
    });
    // The panel is active the moment it resolves.
    setActive(webviewPanel.active);
    webviewPanel.onDidDispose(() => {
      setActive(false);
      changeSub.dispose();
      viewSub.dispose();
      cfgSub.dispose();
      CsvEditorProvider.unsavedState.delete(document.uri.toString());
    });

    webview.onDidReceiveMessage(
      async (msg: {
        type?: string;
        text?: string;
        id?: number;
        tasks?: AiTask[];
        dirty?: boolean;
        evalDirty?: boolean;
      }) => {
        if (msg?.type === 'ready' || msg?.type === 'requestData') {
          postData();
        } else if (msg?.type === 'dirtyState') {
          // The webview reports its unsaved state (edits / computed values) so the
          // host can expose it to other extensions before they overwrite the file.
          CsvEditorProvider.unsavedState.set(document.uri.toString(), {
            dirty: !!msg.dirty,
            evalDirty: !!msg.evalDirty,
          });
        } else if (msg?.type === 'edit' && typeof msg.text === 'string') {
          // The webview only posts edits when its (per-file, footer-controlled) read-only
          // toggle is off, so trust it here.
          void updateDocument(msg.text);
        } else if (msg?.type === 'save' && typeof msg.text === 'string') {
          // Save-only flow: the webview serialized the sheet in response to Cmd+S.
          // Apply the fresh text (dirties the doc iff cell content actually changed),
          // then persist. updateDocument no-ops when the signature matches, so an
          // unchanged grid just saves whatever is already on disk.
          await updateDocument(msg.text);
          await vscode.workspace.save(document.uri);
        } else if (msg?.type === 'requestPaste') {
          // Webview clipboard events arrive empty; read the OS clipboard host-side.
          const text = await vscode.env.clipboard.readText();
          webview.postMessage({ type: 'paste', text });
        } else if (msg?.type === 'openSettings') {
          void vscode.commands.executeCommand('workbench.action.openSettings', 'gridsheet');
        } else if (msg?.type === 'aiBatch' && typeof msg.id === 'number' && Array.isArray(msg.tasks)) {
          const { id, tasks } = msg;
          // Default the CLI working directory to this file's workspace folder (or its
          // own directory for a loose file), so CLAUDE.md/AGENTS.md and relative file
          // reads resolve when the user has enabled repo access.
          const cwd =
            vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath ??
            vscode.Uri.joinPath(document.uri, '..').fsPath;
          try {
            const results = await resolveAiBatch(tasks, { cwd });
            webview.postMessage({ type: 'aiBatchResult', id, results });
          } catch (e) {
            const error = e instanceof Error ? e.message : String(e);
            webview.postMessage({ type: 'aiBatchResult', id, results: tasks.map((t) => ({ index: t.index, ok: false, error })) });
          }
        }
      },
    );
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
    /* Saving overlay (shown while the sheet is serialized on Cmd+S). The spinner
       animates via a compositor-driven transform, so it keeps turning even when a
       serialize chunk briefly holds the main thread between progress ticks. */
    .gridsheet-saving-overlay {
      position: fixed; inset: 0; z-index: 99999;
      display: flex; align-items: center; justify-content: center;
      background: color-mix(in srgb, var(--vscode-editor-background, #1e1e1e) 55%, transparent);
      font-family: sans-serif;
    }
    .gridsheet-saving-box {
      min-width: 240px; padding: 18px 20px; border-radius: 8px;
      background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
      border: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.35));
      box-shadow: 0 6px 24px rgba(0,0,0,0.35);
      display: flex; flex-direction: column; gap: 10px;
    }
    .gridsheet-saving-head {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: var(--vscode-foreground, #ccc);
    }
    .gridsheet-saving-spinner {
      width: 15px; height: 15px; border-radius: 50%;
      border: 2px solid color-mix(in srgb, var(--vscode-foreground, #ccc) 25%, transparent);
      border-top-color: var(--vscode-progressBar-background, #3794ff);
      animation: gridsheet-spin 0.8s linear infinite;
    }
    @keyframes gridsheet-spin { to { transform: rotate(360deg); } }
    .gridsheet-saving-track {
      height: 6px; border-radius: 3px; overflow: hidden;
      background: color-mix(in srgb, var(--vscode-foreground, #ccc) 15%, transparent);
    }
    .gridsheet-saving-fill {
      height: 100%; border-radius: 3px;
      background: var(--vscode-progressBar-background, #3794ff);
      transition: width 0.1s linear;
    }
    .gridsheet-saving-pct {
      font-size: 11px; text-align: right; opacity: 0.7;
      color: var(--vscode-foreground, #ccc);
    }
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

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
