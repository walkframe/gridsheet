# GridSheet CSV/TSV Viewer

A VS Code extension that opens and **edits** **`.csv` / `.tsv`** files in an
interactive [GridSheet](https://gridsheet.walkframe.com/) grid instead of raw
text — scrollable, with row/column headers, selection, and copy.

## Usage

- Right-click a `.csv` / `.tsv` file → **Open With…** → **GridSheet CSV/TSV Viewer**, or
- run the command **“Open with GridSheet CSV/TSV Viewer”** from the palette while the file is focused, or
- click the **table icon** in the editor title bar of an open `.csv`/`.tsv` text file.

The grid live-updates when the file changes on disk. Delimiter is chosen by
extension (`.tsv`/`.tab` → tab, otherwise comma); quoted fields and escaped
quotes (`""`) are handled.

### Editing

- Edit cells directly; changes are written back to the document, so the tab
  shows the unsaved-changes dot and **Ctrl+S** saves through VS Code's normal flow.
- **First row as header** — promote the first row to editable column labels
  (double-click a header to rename it).
- **Evaluate formulas on save** (default **on**) — write formula *results*
  (`=A1+B1` → `30`); turn off to keep the formula source. Literal cells are
  unaffected.
- **Add N rows at the bottom** — extend the sheet with empty capacity rows
  (trailing empty rows are trimmed on save, so they don't bloat the file).
- **Open as text ⇄** — one click switches back to the plain text editor; the
  editor-title table icon switches back to the grid.

It **follows the active VS Code theme**: the webview detects light/dark from the
`vscode-*` body class and uses GridSheet's `inherit-light` / `inherit-dark`
modes, so the grid is transparent and blends into the editor background
(`--vscode-editor-background`), updating live when you switch themes.

## Develop

```bash
pnpm install
pnpm build          # bundles dist/extension.js + dist/webview.js via esbuild
```

Then press **F5** in VS Code (with this folder open) to launch an Extension
Development Host, and open a `.csv`/`.tsv` file with the viewer.

> The webview bundles Preact + `@gridsheet/preact-core` (much smaller than a
> React bundle, and self-contained since the webview is an isolated host); the
> extension host code keeps `vscode` external. `pnpm watch` rebuilds on change.

## How it works

- `src/CsvEditorProvider.ts` — a `CustomTextEditorProvider` that parses the
  document (`src/parse.ts`) and posts the rows to the webview; it re-posts on
  every document change.
- `webview/main.tsx` — a React app that renders the rows with `<GridSheet>`.

## License

Apache-2.0
