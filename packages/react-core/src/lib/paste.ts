import React, { type CSSProperties } from 'react';
import type { RawCellType } from '../types';
export const parseHTML = (html: string, onlyValue = false): RawCellType[][] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const results: RawCellType[][] = [];

  const processTable = (table: HTMLTableElement) => {
    const spans = new Set<string>();
    const rows = table.querySelectorAll('tr,caption');
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.tagName === 'CAPTION') {
        const caption = row.textContent?.trim() ?? '';
        if (caption) {
          results.push([{ value: caption }]);
        }
        continue;
      }
      const cells = Array.from(row.querySelectorAll('td, th'));
      const result: RawCellType[] = [];
      let j = 0;
      for (const cell of cells) {
        const value = cell.textContent?.trim() ?? '';
        const style: CSSProperties | undefined = onlyValue
          ? undefined
          : (() => {
              const childStyle = parseStyleString(cell.firstElementChild);
              const parentStyle = parseStyleString(cell);
              return { ...parentStyle, ...childStyle };
            })();
        while (spans.has(`${i}-${++j}`)) {
          result.push({ value: '', style, skip: true });
        }
        result.push({ value, style });

        const rowSpan = parseInt(cell.getAttribute('rowspan') ?? '1', 10);
        const colSpan = parseInt(cell.getAttribute('colspan') ?? '1', 10);
        for (let r = 0; r < rowSpan; r++) {
          for (let c = 0; c < colSpan; c++) {
            spans.add(`${i + r}-${j + c}`);
          }
        }
      }
      results.push(result);
    }
  };

  const processNodeSequentially = (node: Node, currentLine: RawCellType[] = []) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName;

      if (tagName === 'TABLE') {
        if (currentLine.length > 0) {
          results.push(currentLine.slice());
          currentLine.length = 0;
        }
        processTable(el as HTMLTableElement);
      } else if (tagName === 'BR') {
        results.push(currentLine.slice());
        currentLine.length = 0;
      } else if (blockTags.has(tagName)) {
        if (currentLine.length > 0) {
          results.push(currentLine.slice());
          currentLine.length = 0;
        }
        el.childNodes.forEach((child) => processNodeSequentially(child, currentLine));
        if (currentLine.length > 0) {
          results.push(currentLine.slice());
          currentLine.length = 0;
        }
      } else {
        el.childNodes.forEach((child) => processNodeSequentially(child, currentLine));
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          currentLine.push({ value: trimmed });
        }
      }
    }
  };

  const currentLine: RawCellType[] = [];
  doc.body.childNodes.forEach((node) => processNodeSequentially(node, currentLine));
  if (currentLine.length > 0) {
    results.push(currentLine);
  }

  return results;
};

function parseStyleString(element: Element | null): React.CSSProperties | undefined {
  if (!element) {
    return undefined;
  }
  const styleString = element.getAttribute('style') ?? '';
  const styleObj: React.CSSProperties = {};

  styleString.split(';').forEach((d) => {
    let [rawKey, rawValue] = d.split(':');
    if (!rawKey || !rawValue) {
      return;
    }
    rawKey = rawKey.trim();
    if (rawKey === 'height' || rawKey === 'width') {
      return;
    }
    const key = rawKey.trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (key === 'float' || key === 'display' || key.startsWith('padding')) {
      return;
    }
    if (key === 'border') {
      Object.assign(styleObj, {
        borderTop: rawValue,
        borderRight: rawValue,
        borderBottom: rawValue,
        borderLeft: rawValue,
      });
      return;
    }
    if (key === 'borderColor') {
      Object.assign(styleObj, {
        borderTopColor: rawValue,
        borderRightColor: rawValue,
        borderBottomColor: rawValue,
        borderLeftColor: rawValue,
      });
      return;
    }
    if (key === 'borderStyle') {
      Object.assign(styleObj, {
        borderTopStyle: rawValue,
        borderRightStyle: rawValue,
        borderBottomStyle: rawValue,
        borderLeftStyle: rawValue,
      });
      return;
    }
    if (key === 'borderWidth') {
      Object.assign(styleObj, {
        borderTopWidth: rawValue,
        borderRightWidth: rawValue,
        borderBottomWidth: rawValue,
        borderLeftWidth: rawValue,
      });
      return;
    }
    const value = rawValue.trim();
    (styleObj as any)[key] = value;
  });

  return styleObj;
}

export const parseText = (tsv: string, sep = '\t'): RawCellType[][] => {
  tsv = tsv.replace(/""/g, '\x00');
  const rows: RawCellType[][] = [[]];
  let row = rows[0];
  let entering = false;
  let word = '';
  for (let i = 0; i < tsv.length; i++) {
    const s = tsv[i];
    if (s === '\n' && !entering) {
      row.push({ value: restoreDoubleQuote(word) });
      word = '';
      row = [];
      rows.push(row);
      continue;
    }
    if (s === sep) {
      row.push({ value: restoreDoubleQuote(word) });
      word = '';
      continue;
    }
    if (s === '"' && !entering && word === '') {
      entering = true;
      continue;
    }
    if (s === '"' && entering) {
      entering = false;
      continue;
    }
    word += s;
  }
  if (word) {
    row.push({ value: restoreDoubleQuote(word) });
  }
  return rows;
};

const restoreDoubleQuote = (text: string) => text.replace(/\x00/g, '"');

const blockTags = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'DETAILS',
  'DIALOG',
  'DD',
  'DIV',
  'DL',
  'DT',
  'FIELDSET',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'FORM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HR',
  'LI',
  'MAIN',
  'NAV',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'UL',
]);
