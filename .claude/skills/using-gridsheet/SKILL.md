---
name: using-gridsheet
description: How to build with GridSheet in an app — installing and using @gridsheet/react-core (or preact/vue/svelte), rendering a sheet, buildInitialCells, options, the shared book, custom Policies/renderers, formulas, and reading data back. Use when someone wants to embed a spreadsheet/grid, use the GridSheet component, write initialCells, add a formula function, style cells, or read/export sheet values.
---

# Building with GridSheet

GridSheet is a headless spreadsheet engine with framework bindings. This skill is for **consuming**
the published packages in an app. (For working ON this repo, see the project `CLAUDE.md`.)

Frameworks: **React** (`@gridsheet/react-core`, the reference binding — examples below use it),
**Preact** (`@gridsheet/preact-core`), **Vue** (`@gridsheet/vue-core`), **Svelte**
(`@gridsheet/svelte-core`). The API surface is the same; only the component wrapper differs.
Authoritative reference: https://docs.gridsheet.dev/ (getting-started + api-reference).

## Install

```bash
pnpm add @gridsheet/react-core @gridsheet/functions
```

Install `@gridsheet/functions` too — it provides the built-in spreadsheet functions (SUM, IF, …).
`@gridsheet/react-dev` adds a `<Debugger>` for development.

## Minimal sheet

```tsx
import { GridSheet, buildInitialCells } from '@gridsheet/react-core';

export function App() {
  return (
    <GridSheet
      initialCells={buildInitialCells({
        matrices: { A1: [['Name', 'Score'], ['Alice', 42], ['Bob', 58]] },
        cells: {
          default: { style: { fontSize: '14px' } }, // NB: width/height NOT allowed in `default`
          defaultCol: { width: 100 },                // column-header default width
          defaultRow: { height: 30 },                // row-header default height
          A: { style: { fontWeight: 600 } },         // whole column A
          B1: { value: '=SUM(B2:B3)' },              // a formula cell
        },
      })}
      options={{ sheetHeight: 300, sheetWidth: 400, showFormulaBar: true }}
    />
  );
}
```

### `buildInitialCells({ matrices, cells, ensured })`

- `matrices`: bulk data, keyed by top-left anchor address (`A1`) → 2D array. Values can be
  primitives or `'=FORMULA()'` strings.
- `cells`: per-target config keyed by address or selector. Selectors:
  - single cell `B2`, column `A`, row `3`, range `C1:H1` / `A1:B5`.
  - `default` (all cells — **no width/height**), `defaultCol` / `defaultRow` (header defaults).
  - header cells: prefer helpers **`ch('A')`** (→ column A header) and **`rh(1)`** (→ row 1 header)
    over the raw `A0` / `01` forms; the corner `0` sets header width/height.
- `ensured: { numRows, numCols }`: force a minimum grid size.

Per-cell fields include `value`, `style` (CSSProperties), `width`/`height`, `label`, `alignItems`,
`policy`, `sortFixed`/`filterFixed`. Cell data is **JSON-serializable** — persist it to a DB or
`localStorage` and restore by passing it back as `initialCells`.

> **`initialCells` is initial only.** Changes after mount are NOT reflected by editing the prop.
> To change data imperatively, go through `sheetRef` (see below), not by re-passing `initialCells`.

## Options (per sheet)

`sheetHeight` / `sheetWidth` (number = px, string = CSS like `'80vh'`), `sheetResize`,
`showFormulaBar` (default true), `editingOnEnter`, `mode: 'light' | 'dark'`,
`matrixAlignment`, and `eager` (see Async). The grid is **virtualized** — only visible cells render.

## Shared book (cross-sheet formulas)

Multiple `<GridSheet>`s that share a `book` can reference each other (`=SUM(metrics!C1:H1)`),
and the book carries custom policies. Create it with `useSpellbook`:

```tsx
import { Policy, PercentagePolicyMixin } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook'; // note the /spellbook subpath

const book = useSpellbook({
  policies: { percentage: new Policy({ mixins: [PercentagePolicyMixin] }) },
});
// then give each sheet a name + the book:
<GridSheet book={book} sheetName="metrics" initialCells={...} />
<GridSheet book={book} sheetName="dashboard" initialCells={...} />
```

## Custom rendering — Policies

A `Policy` controls how a cell (or column/row assigned that policy) renders and serializes. Assign
by name in cells (`B: { policy: 'sparkline' }`) after registering it on the book. A mixin's
`renderSheet` returns JSX:

```tsx
import { Policy, toValueMatrix } from '@gridsheet/react-core';
import type { PolicyMixinType, RenderProps, UserSheet } from '@gridsheet/react-core';

const SparklineMixin: PolicyMixinType = {
  renderSheet({ value, point }: RenderProps<UserSheet>) {
    const nums = toValueMatrix(value).flat().filter((v): v is number => typeof v === 'number');
    return <MyChart data={nums} />;
  },
};
```

## Formulas & custom functions

Formula strings start with `=` and support ranges (`C1:H1`), cross-sheet refs (`sheet!A1`),
and spilling via `ARRAYFORMULA` (`=ARRAYFORMULA(B1:B5-C1:C5)`). Built-ins come from
`@gridsheet/functions`. Register your own function through the spellbook (see
`@gridsheet/functions` docs / api-reference/formula).

## Reading data back

Bulk readers are **standalone functions** (not sheet methods) taking a `UserSheet` first:
`toValueMatrix`, `toValueObject`, `toValueRows`, `toValueCols`, `toCellMatrix`, `toCellObject`, …

```tsx
import { toValueMatrix } from '@gridsheet/react-core';
const rows = toValueMatrix(sheet); // 2D array of resolved values
```

Access the sheet imperatively via `sheetRef`:

```tsx
const sheetRef = useRef<SheetHandle | null>(null);
<GridSheet sheetRef={sheetRef} .../>
// later:
const { sheet } = sheetRef.current!;
```

Methods that mutate (`update`, `write`, `setHeaderHeight`, …) return a **new** `UserSheet` — you
must call **`.apply()`** for the UI to update. `getCell({ y, x })` reads one cell; pass
`{ resolution: 'RAW' }` to get the un-evaluated formula string.

## Async formulas

If a formula calls an async function, virtualization means **off-screen** cells don't resolve until
scrolled into view. Options:

- `options={{ eager: true }}` — resolve every async cell after each update (per-sheet; costs more).
- To read all values (e.g. before export): `await sheet.waitForPending()` then `toValueMatrix(sheet)`;
  or `sheet.resolveAll()` + `await sheet.waitForPending()` on demand.

## Gotchas checklist

- `initialCells` is initial-only; mutate via `sheetRef`, and call `.apply()` after mutating methods.
- `width`/`height` can't go in `default` — use `defaultCol`/`defaultRow` or per-cell/`ch`/`rh`.
- Keep total cells ≲ 2,000,000 for smooth perf.
- Don't rely on `instanceof` across the engine + a binding (bundlers can duplicate classes); use the
  exported type guards / duck-typing instead.
- Styles baked through `buildInitialCells` are captured once at first render — for theme-reactive
  cell tints use theme-independent `rgba(...)` / CSS `var()` tokens, not a JS `isDark` branch.
