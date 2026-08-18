import * as vscode from 'vscode';
import { CsvEditorProvider, type GridModeSink } from './CsvEditorProvider';

const isDelimited = (path: string) => /\.(csv|tsv|tab)$/i.test(path);

// A single status-bar ("footer") item that always tells you which view of a
// CSV/TSV file is in front — the GridSheet grid or the raw text — and switches
// to the other when clicked. VS Code can't rename a custom editor's tab, so this
// is the reliable at-a-glance mode indicator.
class ModeStatus implements GridModeSink {
  private readonly item: vscode.StatusBarItem;
  // The document shown by the currently-active grid, if a grid is active.
  private gridUri: vscode.Uri | null = null;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  }

  setGridActive(active: boolean, uri: vscode.Uri): void {
    if (active) {
      this.gridUri = uri;
    } else if (this.gridUri?.toString() === uri.toString()) {
      // Only clear if the grid losing focus is the one we were tracking; when
      // switching between two grids the newly-active one sets itself right after.
      this.gridUri = null;
    }
    this.render();
  }

  render(): void {
    if (this.gridUri) {
      this.item.text = '$(table) GridSheet grid';
      this.item.tooltip = 'Showing the GridSheet grid — click to open the raw text instead';
      this.item.command = 'gridsheet.openAsText';
      this.item.show();
      return;
    }
    const ed = vscode.window.activeTextEditor;
    if (ed && isDelimited(ed.document.uri.path)) {
      this.item.text = '$(list-flat) Raw CSV';
      this.item.tooltip = 'Showing raw text — click to open with the GridSheet grid';
      this.item.command = 'gridsheet.openCsvViewer';
      this.item.show();
      return;
    }
    this.item.hide();
  }

  currentGridUri(): vscode.Uri | null {
    return this.gridUri;
  }

  dispose(): void {
    this.item.dispose();
  }
}

export function activate(context: vscode.ExtensionContext) {
  const status = new ModeStatus();

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider('gridsheet.csv', new CsvEditorProvider(context, ',', status), {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: false,
    }),
    vscode.window.registerCustomEditorProvider('gridsheet.tsv', new CsvEditorProvider(context, '\t', status), {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: false,
    }),
  );

  // Command: open a file with the grid viewer. Accepts a resource uri (from the
  // editor-title button / explorer) and falls back to the active text editor.
  context.subscriptions.push(
    vscode.commands.registerCommand('gridsheet.openCsvViewer', async (resource?: vscode.Uri) => {
      const uri = resource ?? vscode.window.activeTextEditor?.document.uri;
      if (!uri) {
        vscode.window.showInformationMessage('Open a .csv or .tsv file first.');
        return;
      }
      const viewType = /\.(tsv|tab)$/i.test(uri.path) ? 'gridsheet.tsv' : 'gridsheet.csv';
      await vscode.commands.executeCommand('vscode.openWith', uri, viewType);
    }),
  );

  // Command: save the active grid. Bound to Ctrl/Cmd+S while a grid is focused
  // (see the keybinding in package.json). Routes the save into the webview so the
  // sheet is serialized only now — never on every edit — with a progress overlay.
  // Falls back to the built-in save if, somehow, no grid is the active handler.
  context.subscriptions.push(
    vscode.commands.registerCommand('gridsheet.save', async () => {
      if (!CsvEditorProvider.saveActiveGrid()) {
        await vscode.commands.executeCommand('workbench.action.files.save');
      }
    }),
  );

  // Command: reopen the active grid's file in the plain text editor. Mirrors the
  // grid footer's "Open as text ⇄", but reachable from the status-bar indicator.
  context.subscriptions.push(
    vscode.commands.registerCommand('gridsheet.openAsText', async () => {
      const uri = status.currentGridUri();
      if (!uri) {
        return;
      }
      await vscode.commands.executeCommand('vscode.openWith', uri, 'default');
    }),
  );

  // Keep the indicator in sync as the user moves between text editors. Grid focus
  // changes are pushed in by the editor provider via setGridActive().
  context.subscriptions.push(
    status,
    vscode.window.onDidChangeActiveTextEditor(() => status.render()),
  );
  status.render();
}

export function deactivate() {}
