# Change Log

All notable changes to the **CSV Spreadsheet — GridSheet** extension.

## 0.3.4 — 2026-09-13

- Precise per-cell **Evaluated** highlight: a formula cell now lights only when its
  result is actually unsaved — including when a cell it *references* changes
  (dependency-aware) and when its `=CLAUDE()` / `=CODEX()` result lands (async-aware,
  cells that share one in-flight call for a duplicate prompt included). Unrelated,
  already-saved formulas stay dark.
- Fix: an autofilled range of formulas now tints immediately (the renderer reads the
  current sheet, not a render-behind reference).
- Add a `formulas.csv` example exercising dependency chains, `SUM`/`ROUND`, and async
  `=CLAUDE` cells.

## 0.3.3 — 2026-09-12

- Migrate to a `CustomEditorProvider` document model: the tab shows the native
  unsaved-changes dot, closing an unsaved grid **prompts to save**, unsaved edits
  survive a window restart (hot-exit backup), and native **Ctrl/Cmd+S** saves
  (serializing only on save). The custom save command/keybinding is removed.
- With `saveEvaluated` on, unbaked formula results count as unsaved — closing prompts
  to save them.
- Footer redesign: one **●** plus the pending kind(s) — **Changed** (amber, manual
  edits) and/or **Evaluated** (purple, formula/AI results).
- Rename the setting `gridsheet.viewer.evaluateFormulas` → **`gridsheet.viewer.saveEvaluated`**
  (aligns with the ● Evaluated marker); the cell tint also respects it.

## 0.3.2 — 2026-09-09

- Per-cell background highlight for unsaved **Changed** (edited) and **Evaluated**
  (formula/AI computed) cells, so you can see what a save would change.

## 0.3.1 — 2026-09-09

- Footer **Computed** marker: flags that the grid holds formula/AI results not yet
  written to the file (baked in on save when `evaluateFormulas` is on).

## 0.3.0 — 2026-09-09

- **`gridsheet.viewer.eager`** (default on): evaluate every formula cell on open —
  off-screen `=CLAUDE()` / `=CODEX()` / custom AI cells fire without scrolling.
- **`gridsheet.ai.concurrency`** (default 10): cap concurrent AI CLI processes so
  opening a file with many AI cells doesn't burst provider rate limits.

## 0.2.0 — 2026-08-21

- Extended function library preloaded (via `useSpellbook`).
- User-defined AI functions: `gridsheet.ai.alias` and `gridsheet.ai.custom`.
- Per-column display formatting (Number / Date submenu) and large-file performance
  improvements.
- Marketplace metadata (name, icon, keywords, repository).

## 0.1.0 — 2026-08-20

- Initial release: open and edit `.csv` / `.tsv` files as an interactive GridSheet
  grid, with formulas and `=CLAUDE()` / `=CODEX()` AI functions.
