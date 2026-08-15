import * as vscode from 'vscode';
import { CsvEditorProvider } from './CsvEditorProvider';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider('gridsheet.csv', new CsvEditorProvider(context, ','), {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: false,
    }),
    vscode.window.registerCustomEditorProvider('gridsheet.tsv', new CsvEditorProvider(context, '\t'), {
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
}

export function deactivate() {}
