import type { StoreType, AreaType, PointType } from '../types';

import { zoneToArea } from './spatial';
import type { Sheet, UserSheet } from './sheet';
import { focus } from './dom';

export const clip = (store: StoreType) => {
  const { selectingZone, choosing, editorRef, sheetReactive: sheetRef } = store;
  const sheet = sheetRef.current;

  if (!sheet) {
    return { top: 0, left: 0, bottom: 0, right: 0 };
  }

  const { y, x } = choosing;
  const selectingArea = zoneToArea(selectingZone);
  let area = selectingArea;
  if (area.left === -1) {
    area = { top: y, left: x, bottom: y, right: x };
  }
  const input = editorRef.current;
  const trimmed = sheet.trim(area);
  const tsv = sheet2csv(trimmed, {
    getter: (sheet, point) => {
      const policy = sheet.getPolicy(point);
      return policy.serializeForClipboard({ point, sheet });
    },
  });
  const html = sheet2html(trimmed, {
    getter: (sheet, point) => {
      const policy = sheet.getPolicy(point);
      return policy.serializeForClipboard({ point, sheet });
    },
  });

  if (navigator.clipboard) {
    const tsvBlob = new Blob([tsv], { type: 'text/plain' });
    const htmlBlob = new Blob([html], { type: 'text/html' });

    navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': tsvBlob,
        'text/html': htmlBlob,
      }),
    ]);
  } else if (input != null) {
    input.value = tsv;
    focus(input);
    input.select();
    document.execCommand('copy');
    input.value = '';
    input.blur();
  }
  return area;
};

export type SheetCSVProps = {
  getter?: (sheet: UserSheet, point: PointType) => string;
  filteredRowsIncluded?: boolean;
  trailingEmptyRowsOmitted?: boolean;
  separator?: string;
  newline?: string;
};

export const sheet2csv = (
  sheet: UserSheet,
  {
    getter = (sheet, point) => {
      return String(sheet.getCell(point)?.value ?? '');
    },
    filteredRowsIncluded = false,
    trailingEmptyRowsOmitted = false,
    separator = '\t',
    newline = '\n',
  }: SheetCSVProps = {},
): string => {
  const rows: { isEmpty: boolean; line: string }[] = [];
  for (let y = sheet.top; y <= sheet.bottom; y++) {
    if (sheet.isRowFiltered(y) && !filteredRowsIncluded) {
      continue;
    }
    const cols: string[] = [];
    let rowIsEmpty = true;
    for (let x = sheet.left; x <= sheet.right; x++) {
      const point: PointType = { y, x };
      const value = getter(sheet, point);
      if (value !== '') {
        rowIsEmpty = false;
      }
      if (value.indexOf('\n') !== -1) {
        cols.push(`"${value.replace(/"/g, '""')}"`);
      } else {
        cols.push(value);
      }
    }
    rows.push({ isEmpty: rowIsEmpty, line: cols.join(separator) });
  }
  if (trailingEmptyRowsOmitted) {
    while (rows.length > 0 && rows[rows.length - 1].isEmpty) {
      rows.pop();
    }
  }
  return rows.map((r) => r.line).join(newline);
};

export type SheetHTMLProps = {
  getter?: (sheet: UserSheet, point: PointType) => string;
  filteredRowsIncluded?: boolean;
  trailingEmptyRowsOmitted?: boolean;
};

export const sheet2html = (
  sheet: UserSheet,
  {
    getter = (sheet, point) => {
      return String(sheet.getCell(point)?.value ?? '');
    },
    filteredRowsIncluded = false,
    trailingEmptyRowsOmitted = false,
  }: SheetHTMLProps = {},
): string => {
  const rows: { isEmpty: boolean; html: string }[] = [];
  for (let y = sheet.top; y <= sheet.bottom; y++) {
    if (sheet.isRowFiltered(y) && !filteredRowsIncluded) {
      continue;
    }
    const cols: string[] = [];
    let rowIsEmpty = true;
    for (let x = sheet.left; x <= sheet.right; x++) {
      const point: PointType = { y, x };
      const value = getter(sheet, point);
      if (value !== '') {
        rowIsEmpty = false;
      }
      const valueEscaped = value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      cols.push(`<td>${valueEscaped}</td>`);
    }
    rows.push({ isEmpty: rowIsEmpty, html: `<tr>${cols.join('')}</tr>` });
  }
  if (trailingEmptyRowsOmitted) {
    while (rows.length > 0 && rows[rows.length - 1].isEmpty) {
      rows.pop();
    }
  }
  return `<table>${rows.map((r) => r.html).join('')}</table>`;
};
