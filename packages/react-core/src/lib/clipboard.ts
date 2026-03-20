import type { StoreType, AreaType, PointType } from '../types';

import { zoneToArea } from './spatial';
import type { Table, UserTable } from './table';
import { focus } from './dom';

export const clip = (store: StoreType) => {
  const { selectingZone, choosing, editorRef, tableReactive: tableRef } = store;
  const table = tableRef.current;

  if (!table) {
    return { top: 0, left: 0, bottom: 0, right: 0 };
  }

  const { y, x } = choosing;
  const selectingArea = zoneToArea(selectingZone);
  let area = selectingArea;
  if (area.left === -1) {
    area = { top: y, left: x, bottom: y, right: x };
  }
  const input = editorRef.current;
  const trimmed = table.trim(area);
  const tsv = table2csv(trimmed, {
    getter: (table, point) => {
      const policy = table.getPolicyByPoint(point);
      return policy.serializeForClipboard({ point, table });
    },
  });
  const html = table2html(trimmed, {
    getter: (table, point) => {
      const policy = table.getPolicyByPoint(point);
      return policy.serializeForClipboard({ point, table });
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

export type TableCSVProps = {
  getter?: (table: UserTable, point: PointType) => string;
  filteredRowsIncluded?: boolean;
  trailingEmptyRowsOmitted?: boolean;
  separator?: string;
  newline?: string;
};

export const table2csv = (
  table: UserTable,
  {
    getter = (table, point) => {
      return String(table.getCellByPoint(point)?.value ?? '');
    },
    filteredRowsIncluded = false,
    trailingEmptyRowsOmitted = false,
    separator = '\t',
    newline = '\n',
  }: TableCSVProps = {},
): string => {
  const rows: { isEmpty: boolean; line: string }[] = [];
  for (let y = table.top; y <= table.bottom; y++) {
    if (table.isRowFiltered(y) && !filteredRowsIncluded) {
      continue;
    }
    const cols: string[] = [];
    let rowIsEmpty = true;
    for (let x = table.left; x <= table.right; x++) {
      const point: PointType = { y, x };
      const value = getter(table, point);
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

export type TableHTMLProps = {
  getter?: (table: UserTable, point: PointType) => string;
  filteredRowsIncluded?: boolean;
  trailingEmptyRowsOmitted?: boolean;
};

export const table2html = (
  table: UserTable,
  {
    getter = (table, point) => {
      return String(table.getCellByPoint(point)?.value ?? '');
    },
    filteredRowsIncluded = false,
    trailingEmptyRowsOmitted = false,
  }: TableHTMLProps = {},
): string => {
  const rows: { isEmpty: boolean; html: string }[] = [];
  for (let y = table.top; y <= table.bottom; y++) {
    if (table.isRowFiltered(y) && !filteredRowsIncluded) {
      continue;
    }
    const cols: string[] = [];
    let rowIsEmpty = true;
    for (let x = table.left; x <= table.right; x++) {
      const point: PointType = { y, x };
      const value = getter(table, point);
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
