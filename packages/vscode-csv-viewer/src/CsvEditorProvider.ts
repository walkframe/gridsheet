import * as vscode from 'vscode';
import { parseDelimited } from './parse';
import { resolveAiBatch } from './ai';
import type { AiTask } from './aiTypes';

// Notified when a grid editor gains/loses focus so a status-bar item can show
// whether the user is looking at the grid or the raw text of this file.
export interface GridModeSink {
  setGridActive(active: boolean, uri: vscode.Uri): void;
}

export class CsvEditorProvider implements vscode.CustomTextEditorProvider {
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

    const postData = () => {
      lastKnownText = document.getText();
      const rows = parseDelimited(document.getText(), this.delimiter);
      webview.postMessage({
        type: 'data',
        rows,
        delimiter: this.delimiter === '\t' ? 'TSV' : 'CSV',
        // Initial defaults for this grid; readOnly is then owned per-file by the footer
        // toggle, and evaluateFormulas is a settings-only save policy.
        readOnly: viewerCfg().get<boolean>('readOnly', false),
        evaluate: viewerCfg().get<boolean>('evaluateFormulas', true),
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
      this.mode?.setGridActive(webviewPanel.active, document.uri);
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
    this.mode?.setGridActive(webviewPanel.active, document.uri);
    webviewPanel.onDidDispose(() => {
      this.mode?.setGridActive(false, document.uri);
      changeSub.dispose();
      viewSub.dispose();
      cfgSub.dispose();
    });

    webview.onDidReceiveMessage(
      async (msg: { type?: string; text?: string; id?: number; tasks?: AiTask[] }) => {
        if (msg?.type === 'ready' || msg?.type === 'requestData') {
          postData();
        } else if (msg?.type === 'edit' && typeof msg.text === 'string') {
          // The webview only posts edits when its (per-file, footer-controlled) read-only
          // toggle is off, so trust it here.
          void updateDocument(msg.text);
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
