import type { StoreType, AreaType, PointType } from '../types';

import { zoneToArea } from './structs';
import type { Table } from './table';

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
  const tsv = table2tsv(trimmed);
  const html = table2html(trimmed);

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
    input.focus();
    input.select();
    document.execCommand('copy');
    input.value = '';
    input.blur();
  }
  return area;
};

const table2tsv = (table: Table): string => {
  const lines: string[] = [];
  for (let y = table.top; y <= table.bottom; y++) {
    const cols: string[] = [];
    for (let x = table.left; x <= table.right; x++) {
      const point: PointType = { y, x };
      const policy = table.getPolicyByPoint(point);
      const value = policy.onClip({ point, table });
      if (value.indexOf('\n') !== -1) {
        cols.push(`"${value.replace(/"/g, '""')}"`);
      } else {
        cols.push(value);
      }
    }
    lines.push(cols.join('\t'));
  }
  return lines.join('\n');
};

const table2html = (table: Table): string => {
  const lines: string[] = [];
  for (let y = table.top; y <= table.bottom; y++) {
    const cols: string[] = [];
    for (let x = table.left; x <= table.right; x++) {
      const point: PointType = { y, x };
      const policy = table.getPolicyByPoint(point);
      const value = policy.onClip({ point, table });
      const valueEscaped = value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      cols.push(`<td>${valueEscaped}</td>`);
    }
    lines.push(`<tr>${cols.join('')}</tr>`);
  }
  return `<table>${lines.join('')}</table>`;
};
