import { parseXml, child, children, type XmlNode } from './xml';
import type { CSSPropertiesLike } from '@gridsheet/engine';

/**
 * Reads the subset of xl/styles.xml GridSheet can represent as CSS: fill
 * (background), font color / weight / style / underline, and text alignment.
 * Number formats, borders, and other xf properties are intentionally ignored.
 */

type FontStyle = {
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

type Xf = {
  fontId: number;
  fillId: number;
  applyFont: boolean;
  applyFill: boolean;
  horizontal?: string;
  vertical?: string;
};

export type CellStyle = {
  style?: CSSPropertiesLike;
  justifyContent?: string;
  alignItems?: string;
};

// Legacy indexed color palette (indices 0..63); 64/65 are system fg/bg (auto).
const INDEXED: Record<number, string> = {
  0: '000000',
  1: 'FFFFFF',
  2: 'FF0000',
  3: '00FF00',
  4: '0000FF',
  5: 'FFFF00',
  6: 'FF00FF',
  7: '00FFFF',
  8: '000000',
  9: 'FFFFFF',
  10: 'FF0000',
  11: '00FF00',
  12: '0000FF',
  13: 'FFFF00',
  14: 'FF00FF',
  15: '00FFFF',
  16: '800000',
  17: '008000',
  18: '000080',
  19: '808000',
  20: '800080',
  21: '008080',
  22: 'C0C0C0',
  23: '808080',
  24: '9999FF',
  25: '993366',
  26: 'FFFFCC',
  27: 'CCFFFF',
  28: '660066',
  29: 'FF8080',
  30: '0066CC',
  31: 'CCCCFF',
  32: '000080',
  33: 'FF00FF',
  34: 'FFFF00',
  35: '00FFFF',
  36: '800080',
  37: '800000',
  38: '008080',
  39: '0000FF',
  40: '00CCFF',
  41: 'CCFFFF',
  42: 'CCFFCC',
  43: 'FFFF99',
  44: '99CCFF',
  45: 'FF99CC',
  46: 'CC99FF',
  47: 'FFCC99',
  48: '3366FF',
  49: '33CCCC',
  50: '99CC00',
  51: 'FFCC00',
  52: 'FF9900',
  53: 'FF6600',
  54: '666699',
  55: '969696',
  56: '003366',
  57: '339966',
  58: '003300',
  59: '333300',
  60: '993300',
  61: '993366',
  62: '333399',
  63: '333333',
};

// Default Office theme colors as interpreted by styles.xml (0/1 = light1/dark1, etc.).
const THEME = ['FFFFFF', '000000', 'E7E6E6', '44546A', '4472C4', 'ED7D31', 'A5A5A5', 'FFC000', '5B9BD5', '70AD47'];

const applyTint = (hex: string, tint: number): string => {
  if (!tint) {
    return hex;
  }
  const chan = (h: string) => {
    let v = parseInt(h, 16);
    v = tint < 0 ? Math.round(v * (1 + tint)) : Math.round(v * (1 - tint) + 255 * tint);
    return Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
  };
  return chan(hex.slice(0, 2)) + chan(hex.slice(2, 4)) + chan(hex.slice(4, 6));
};

const readColor = (node: XmlNode | undefined): string | undefined => {
  if (!node) {
    return undefined;
  }
  const { rgb, indexed, theme, tint } = node.attrs;
  let hex: string | undefined;
  if (rgb) {
    hex = rgb.length === 8 ? rgb.slice(2) : rgb; // strip ARGB alpha
  } else if (indexed != null) {
    hex = INDEXED[parseInt(indexed, 10)];
  } else if (theme != null) {
    hex = THEME[parseInt(theme, 10)];
  }
  if (!hex) {
    return undefined;
  }
  if (tint) {
    hex = applyTint(hex, parseFloat(tint));
  }
  return `#${hex.toUpperCase()}`;
};

const alignToJustify: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
const alignToItems: Record<string, string> = { top: 'flex-start', center: 'center', bottom: 'flex-end' };

export class StyleTable {
  private fonts: FontStyle[] = [];
  private fills: (string | undefined)[] = [];
  private xfs: Xf[] = [];

  constructor(xml: string | undefined) {
    if (!xml) {
      return;
    }
    const root = parseXml(xml);

    for (const f of children(child(root, 'fonts'), 'font')) {
      this.fonts.push({
        color: readColor(child(f, 'color')),
        bold: child(f, 'b') != null,
        italic: child(f, 'i') != null,
        underline: child(f, 'u') != null,
      });
    }

    for (const fill of children(child(root, 'fills'), 'fill')) {
      const pattern = child(fill, 'patternFill');
      const type = pattern?.attrs['patternType'];
      // Only solid fills carry a usable background color for CSS.
      this.fills.push(type === 'solid' ? readColor(child(pattern, 'fgColor')) : undefined);
    }

    for (const xf of children(child(root, 'cellXfs'), 'xf')) {
      const alignment = child(xf, 'alignment');
      this.xfs.push({
        fontId: parseInt(xf.attrs['fontId'] ?? '0', 10),
        fillId: parseInt(xf.attrs['fillId'] ?? '0', 10),
        applyFont: xf.attrs['applyFont'] === '1',
        applyFill: xf.attrs['applyFill'] === '1',
        horizontal: alignment?.attrs['horizontal'],
        vertical: alignment?.attrs['vertical'],
      });
    }
  }

  /** Resolve a cell's `s` (xf index) into GridSheet style fields, or undefined if nothing maps. */
  resolve(sAttr: string | undefined): CellStyle | undefined {
    if (sAttr == null) {
      return undefined;
    }
    const xf = this.xfs[parseInt(sAttr, 10)];
    if (!xf) {
      return undefined;
    }
    const style: CSSPropertiesLike = {};
    // Excel writers often omit applyFont/applyFill; honor the referenced record when it has content.
    const font = this.fonts[xf.fontId];
    if (font) {
      if (font.color) {
        style.color = font.color;
      }
      if (font.bold) {
        style.fontWeight = 'bold';
      }
      if (font.italic) {
        style.fontStyle = 'italic';
      }
      if (font.underline) {
        style.textDecoration = 'underline';
      }
    }
    const bg = this.fills[xf.fillId];
    if (bg) {
      style.backgroundColor = bg;
    }
    const result: CellStyle = {};
    if (Object.keys(style).length > 0) {
      result.style = style;
    }
    const justify = xf.horizontal ? alignToJustify[xf.horizontal] : undefined;
    if (justify) {
      result.justifyContent = justify;
    }
    const items = xf.vertical ? alignToItems[xf.vertical] : undefined;
    if (items) {
      result.alignItems = items;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }
}
