import type { StoreType, AreaType } from '../types';

import { zoneToArea } from './structs';
import { solveTable } from '../formula/solver';
import { Table } from './table';

export const clip = (store: StoreType): AreaType => {
  const { selectingZone, choosing, editorRef, table } = store;
  const { y, x } = choosing;
  const selectingArea = zoneToArea(selectingZone);
  let area = selectingArea;
  if (area.left === -1) {
    area = { top: y, left: x, bottom: y, right: x };
  }
  const input = editorRef.current;
  const trimmed = table.trim(area);
  const tsv = table2tsv(trimmed);

  if (navigator.clipboard) {
    navigator.clipboard.writeText(tsv);
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
  const matrix = solveTable({ table, raise: false });
  matrix.forEach((row, i) => {
    const x = table.left + i;
    const cols: string[] = [];
    row.forEach((col, j) => {
      const y = table.top + j;
      const value = table.stringify({ y, x }, col);
      if (value.indexOf('\n') !== -1) {
        cols.push(`"${value.replace(/"/g, '""')}"`);
      } else {
        cols.push(value);
      }
    });
    lines.push(cols.join('\t'));
  });
  return lines.join('\n');
};
