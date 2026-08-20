# Changelog

All notable changes to the GridSheet library packages (`@gridsheet/engine`, `@gridsheet/web`,
`@gridsheet/react-core`, `@gridsheet/preact-core`, `@gridsheet/vue-core`, `@gridsheet/svelte-core`,
`@gridsheet/functions`) are documented here. The versions above are released together.

The `csv-gridsheet` VS Code extension is versioned and released separately, so its features
(the CSV/TSV viewer, `=CLAUDE`/`=CODEX` AI functions, `=CLAUDE.ARRAY`, lossless text-mode save)
are not listed here.

This project adheres to [Semantic Versioning](https://semver.org/) and the format is based on
[Keep a Changelog](https://keepachangelog.com/).

## [3.4.0] — 2026-08-21

### Added

- **Large-file rendering (scroll-remap).** Physical scroll height is capped below `2^24` px and
  mapped to the virtual sheet space, so sheets with millions of rows scroll and render without
  exceeding the browser's scroll-container limit. Rendering cost stays proportional to the visible
  rows, not the total row count. (`@gridsheet/web`)
- **Deferred loading & lazy materialization.** The initial matrix is held without materializing
  every cell; far references resolve through a watermark scan (`getPointById`) instead of building
  all rows. `peekRawValue` reads a cell without materializing it, and an `_hasExplicitCells` flag
  skips per-cell address-string work on sheets that have none. (`@gridsheet/engine`)
- **`toValueMatrixAsync`** — a non-blocking, progress-reporting matrix export that yields between
  chunks. (`@gridsheet/engine`)
- **`ProgressOverlay` component and a GridSheet `loading` prop** (`LoadingState = boolean |
  { progress, label }`) so loading / saving / pending states render consistently from core; the
  grid stylesheet injector `embedStyle` is re-exported so an app can style an overlay shown before
  a grid mounts. (`@gridsheet/react-core`)
- **Native submenu support in menus** (`MenuNodes`, `MenuSubmenuItem`), with viewport-edge flip and
  clamp for the flyout. (`@gridsheet/react-core`)
- **`autoSpilling` now works with async functions.** An async `main()` may return
  `Promise<matrix>`; the resolved matrix is wrapped in a `Spilling` (previously the flag wrapped the
  Promise itself, which never spilled). (`@gridsheet/engine`)
- **`FunctionCategory` is now an open type** (`… | (string & {})`), so a downstream package can
  define its own function category without an engine change. (`@gridsheet/engine`)

### Changed

- **`Ctrl+R` is now Fill Right** (Excel/Sheets convention). Redo remains on `Ctrl+Shift+Z` and
  `Ctrl+Y`. (`@gridsheet/react-core`)

### Fixed

- **Autofill off-sheet range references.** Filling a formula so a range argument slides off-sheet
  now degrades it to a stable `#REF!` instead of dropping the argument entirely (which corrupted the
  formula's arity). (`@gridsheet/engine`)
- **Scroll-anchoring feedback loop.** `overflow-anchor: none` on the grid stops the browser from
  fighting the virtualization spacer (the "auto-scrolls down on its own" behavior). (`@gridsheet/web`)
- **Editor focus after autofill / async-op commit** is restored, so the keyboard keeps working
  immediately after a fill or a chunked operation. (`@gridsheet/react-core`)

## [3.3.0] — 2026-08-17

### Added

- **Headless `@gridsheet/engine` package.** The formula engine was extracted so formulas resolve
  with no DOM/`window` dependency (CLI / extension-host / backend / CI use cases). The former
  `core` package was renamed to `@gridsheet/web`. (`@gridsheet/engine`, `@gridsheet/web`)

### Changed

- **`@gridsheet/functions` now depends on `@gridsheet/engine`.** Quoted sheet references containing
  dots (e.g. `'sub/data.csv'!A1`) tokenize as cross-sheet references rather than being mistaken for
  a partial function name. (`@gridsheet/engine`, `@gridsheet/functions`)

### Fixed

- **Row-height cache** stays in sync on resize. (`@gridsheet/engine`)
