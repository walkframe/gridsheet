import type { CellType, CSSPropertiesLike } from '@gridsheet/engine';

/**
 * Builds xl/styles.xml from GridSheet cell styles — the inverse of styles.ts.
 * Interns fonts, solid fills, and cell formats (xf) so each distinct combination
 * of background/color/weight/italic/underline + alignment gets one xf index.
 */

const MAIN_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

// CSS color → OOXML ARGB ("FFRRGGBB"). Handles #rgb, #rrggbb, and rgb()/rgba().
export const cssColorToArgb = (color: string): string | undefined => {
  const c = color.trim().toLowerCase();
  let hex: string | undefined;
  if (c[0] === '#') {
    const h = c.slice(1);
    if (h.length === 3) {
      hex = h
        .split('')
        .map((ch) => ch + ch)
        .join('');
    } else if (h.length === 6 || h.length === 8) {
      hex = h.length === 8 ? h.slice(2) : h; // ignore leading alpha in #aarrggbb-ish input
    }
  } else {
    const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(c);
    if (m) {
      hex = [m[1], m[2], m[3]]
        .map((n) =>
          Math.max(0, Math.min(255, parseInt(n, 10)))
            .toString(16)
            .padStart(2, '0'),
        )
        .join('');
    }
  }
  return hex ? `FF${hex.toUpperCase()}` : undefined;
};

const justifyToHorizontal: Record<string, string> = {
  'flex-start': 'left',
  center: 'center',
  'flex-end': 'right',
};
const itemsToVertical: Record<string, string> = {
  'flex-start': 'top',
  center: 'center',
  'flex-end': 'bottom',
};

const isBold = (weight: unknown): boolean => {
  if (weight == null) {
    return false;
  }
  if (typeof weight === 'number') {
    return weight >= 600;
  }
  const w = String(weight).toLowerCase();
  return w === 'bold' || w === 'bolder' || Number(w) >= 600;
};

export class StyleSheetBuilder {
  // Index 0 is the default in each collection; fills reserve 0 (none) and 1 (gray125).
  private fonts: string[] = ['<font><sz val="11"/><name val="Calibri"/></font>'];
  private fills: string[] = [
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
  ];
  private xfs: string[] = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
  private fontKeys = new Map<string, number>();
  private fillKeys = new Map<string, number>();
  private xfKeys = new Map<string, number>();

  private internFont(style: CSSPropertiesLike): number {
    const parts: string[] = [];
    if (isBold(style.fontWeight)) {
      parts.push('<b/>');
    }
    if (String(style.fontStyle).toLowerCase() === 'italic') {
      parts.push('<i/>');
    }
    if (
      String(style.textDecoration ?? '')
        .toLowerCase()
        .includes('underline')
    ) {
      parts.push('<u/>');
    }
    const argb = typeof style.color === 'string' ? cssColorToArgb(style.color) : undefined;
    if (argb) {
      parts.push(`<color rgb="${argb}"/>`);
    }
    if (parts.length === 0) {
      return 0;
    }
    const xml = `<font>${parts.join('')}<sz val="11"/><name val="Calibri"/></font>`;
    let id = this.fontKeys.get(xml);
    if (id === undefined) {
      id = this.fonts.length;
      this.fonts.push(xml);
      this.fontKeys.set(xml, id);
    }
    return id;
  }

  private internFill(color: string): number {
    const argb = cssColorToArgb(color);
    if (!argb) {
      return 0;
    }
    const xml = `<fill><patternFill patternType="solid"><fgColor rgb="${argb}"/></patternFill></fill>`;
    let id = this.fillKeys.get(xml);
    if (id === undefined) {
      id = this.fills.length;
      this.fills.push(xml);
      this.fillKeys.set(xml, id);
    }
    return id;
  }

  /** Intern a cell's style and return its xf index (0 = default, no styling). */
  xfFor(cell: CellType | null | undefined): number {
    if (!cell) {
      return 0;
    }
    const style = (cell.style ?? {}) as CSSPropertiesLike;
    const fontId = this.internFont(style);
    const fillId = typeof style.backgroundColor === 'string' ? this.internFill(style.backgroundColor) : 0;
    const horizontal = cell.justifyContent ? justifyToHorizontal[cell.justifyContent] : undefined;
    const vertical = cell.alignItems ? itemsToVertical[cell.alignItems] : undefined;
    if (fontId === 0 && fillId === 0 && !horizontal && !vertical) {
      return 0;
    }
    const key = `${fontId}:${fillId}:${horizontal ?? ''}:${vertical ?? ''}`;
    let id = this.xfKeys.get(key);
    if (id === undefined) {
      const attrs = ['numFmtId="0"', `fontId="${fontId}"`, `fillId="${fillId}"`, 'borderId="0"', 'xfId="0"'];
      if (fontId !== 0) {
        attrs.push('applyFont="1"');
      }
      if (fillId !== 0) {
        attrs.push('applyFill="1"');
      }
      let xf: string;
      if (horizontal || vertical) {
        const align = [horizontal && `horizontal="${horizontal}"`, vertical && `vertical="${vertical}"`]
          .filter(Boolean)
          .join(' ');
        xf = `<xf ${attrs.join(' ')} applyAlignment="1"><alignment ${align}/></xf>`;
      } else {
        xf = `<xf ${attrs.join(' ')}/>`;
      }
      id = this.xfs.length;
      this.xfs.push(xf);
      this.xfKeys.set(key, id);
    }
    return id;
  }

  build(): string {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      `<styleSheet xmlns="${MAIN_NS}">` +
      `<fonts count="${this.fonts.length}">${this.fonts.join('')}</fonts>` +
      `<fills count="${this.fills.length}">${this.fills.join('')}</fills>` +
      '<borders count="1"><border/></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      `<cellXfs count="${this.xfs.length}">${this.xfs.join('')}</cellXfs>` +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>'
    );
  }
}
