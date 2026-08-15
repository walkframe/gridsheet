import * as vscode from 'vscode';
import { parseDelimited } from './parse';

export class CsvEditorProvider implements vscode.CustomTextEditorProvider {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly delimiter: string,
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
    webview.html = this.getHtml(webview);

    const postData = () => {
      const rows = parseDelimited(document.getText(), this.delimiter);
      webview.postMessage({ type: 'data', rows, delimiter: this.delimiter === '\t' ? 'TSV' : 'CSV' });
    };

    // Text we last wrote into the document from a webview edit. Used to tell our
    // own change apart from an external one (file edited elsewhere, git, etc.).
    let lastAppliedText: string | null = null;

    // Apply a grid edit back into the TextDocument. This marks the document dirty
    // (tab shows ●) and Ctrl+S then saves it through VS Code's normal flow.
    const updateDocument = async (text: string) => {
      if (text === document.getText()) {
        return;
      }
      lastAppliedText = text;
      const edit = new vscode.WorkspaceEdit();
      const fullRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(document.lineCount, 0));
      edit.replace(document.uri, fullRange, text);
      await vscode.workspace.applyEdit(edit);
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
      // Our own edit round-tripped through the document: the webview already
      // shows this state, so don't push it back (which would remount the grid
      // and drop the caret/selection mid-edit). Only re-sync on external changes.
      if (e.document.getText() === lastAppliedText) {
        return;
      }
      if (!webviewPanel.active) {
        needsSync = true;
        return;
      }
      postData();
    });
    const viewSub = webviewPanel.onDidChangeViewState(() => {
      if (webviewPanel.active && needsSync) {
        needsSync = false;
        postData();
      }
    });
    webviewPanel.onDidDispose(() => {
      changeSub.dispose();
      viewSub.dispose();
    });

    webview.onDidReceiveMessage((msg: { type?: string; text?: string }) => {
      if (msg?.type === 'ready' || msg?.type === 'requestData') {
        postData();
      } else if (msg?.type === 'edit' && typeof msg.text === 'string') {
        void updateDocument(msg.text);
      } else if (msg?.type === 'openAsText') {
        void vscode.commands.executeCommand('vscode.openWith', document.uri, 'default');
      }
    });
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
