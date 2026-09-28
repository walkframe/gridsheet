# @gridsheet/xlsx

xlsx ⇄ [GridSheet](https://gridsheet.walkframe.com/) converter. Headless (no DOM, no framework),
TypeScript-native. Reads and writes the OOXML parts GridSheet actually uses — it does **not** wrap
exceljs or SheetJS.

## Scope (v0)

- **Values**: string, number, boolean. Empty cells are dropped; the used range is trimmed.
- **Formulas**: round-trip as their `=...` text (read via `resolution: 'RAW'`).
- **Multiple sheets**, in workbook order.
- **Dates**: written as ISO strings (v0 has no number-format support).

Not yet: styles, merged cells, column widths / row heights, number formats, charts/images.

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
