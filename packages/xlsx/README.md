# @gridsheet/xlsx

xlsx ⇄ [GridSheet](https://gridsheet.walkframe.com/) converter. Headless (no DOM, no framework),
TypeScript-native. Reads and writes the OOXML parts GridSheet actually uses — it does **not** wrap
exceljs or SheetJS.

## Scope (v0)

- **Values**: string, number, boolean. Empty cells are dropped; the used range is trimmed.
- **Formulas**: round-trip as their `=...` text (read via `resolution: 'RAW'`), including
  cross-sheet references like `=SUM(Sales!D3:D5)` (quoted names such as `'Meta Data'!B3` too).
- **Multiple sheets**, in workbook order. `fromXlsx` returns `{ matrices, cells }` per sheet.
- **Cell styles on import** → GridSheet's `style`: background color, text color, bold, italic,
  underline, and horizontal/vertical alignment (`justifyContent`/`alignItems`). `cells` in the
  result carries these; `buildInitialCells` merges them with the values.
- **Dates**: written as ISO strings (no number-format support).

Not yet: **writing** styles back out (`toXlsx` emits values + formulas only), merged cells,
column widths / row heights, number formats, charts/images. Unsupported features are **ignored
gracefully** on import — a styled, merged workbook reads fine; a merged range keeps its value in
the top-left cell, and a number-formatted date comes through as its raw Excel serial number.

## Install

```bash
pnpm add @gridsheet/xlsx
# peer: @gridsheet/engine (already present with @gridsheet/react-core)
```

`fflate` (zip codec) is a normal dependency and installs automatically.

## Read: xlsx → GridSheet

`fromXlsx` returns, per sheet, an object shaped exactly like `buildInitialCells` input.

```ts
import { fromXlsx } from '@gridsheet/xlsx';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const parsed = fromXlsx(bytes); // Uint8Array | ArrayBuffer | number[]
// parsed = { Sheet1: { matrices: { A1: [[...]] } }, ... }

const initialCells = buildInitialCells(parsed.Sheet1);
// <GridSheet initialCells={initialCells} />
```

## Write: GridSheet → xlsx

`toXlsx` accepts a live sheet (read via `toCellMatrix` at RAW resolution), a cell matrix, or a plain
value matrix — one entry per output worksheet.

```ts
import { toXlsx } from '@gridsheet/xlsx';

const bytes = toXlsx({
  Sheet1: sheetRef.current, // a GridSheet UserSheet
  Totals: [
    ['name', 'total'],
    ['Apple', '=B2*C2'],
  ], // or a raw matrix
});
// bytes: Uint8Array — write to a file, or trigger a browser download
```

Formula cells are written without a cached value; the workbook is marked `fullCalcOnLoad` so Excel /
LibreOffice / Google Sheets recalculate them on open.

## License

Apache-2.0
