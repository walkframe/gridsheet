import type { Address, PointType, ExtraPointType } from '../types';
import { DEFAULT_ALPHABET_CACHE_SIZE } from '../constants';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const N2C_CACHE = new Map<number, string>();
const C2N_CACHE = new Map<string, number>();

const getColumnLetterFromNumber = (key: number, cacheSize = DEFAULT_ALPHABET_CACHE_SIZE): string => {
  const cached = N2C_CACHE.get(--key);
  if (cached != null) {
    return cached;
  }
  if (key === 0) {
    return '';
  }
  let num = key;
  let result = '';
  do {
    result = ALPHABET[--num % 26] + result;
    num = Math.floor(num / 26);
  } while (num > 0);

  N2C_CACHE.set(key, result);
  const it = N2C_CACHE.keys();
  for (let st = it.next(); N2C_CACHE.size > cacheSize; st = it.next()) {
    // @ts-ignore
    N2C_CACHE.delete(st.value);
  }
  return result;
};

const getNumberFromColumnLetter = (key: string, cacheSize = DEFAULT_ALPHABET_CACHE_SIZE): number => {
  const cached = C2N_CACHE.get(key);
  if (cached != null) {
    return cached;
  }
  if (key === '') {
    return 0;
  }
  const alpha = key;
  let result = 0;
  for (let digit = 0; digit < alpha.length; digit++) {
    const a = alpha[alpha.length - digit - 1];
    const num = ALPHABET.indexOf(a) + 1;
    result += ALPHABET.length ** digit * num;
  }
  C2N_CACHE.set(key, result);
  const it = C2N_CACHE.keys();
  for (let st = it.next(); C2N_CACHE.size > cacheSize; st = it.next()) {
    // @ts-ignore
    C2N_CACHE.delete(st.value);
  }
  return result;
};

export const x2c = (x: number): string => {
  if (x === 0) {
    return '';
  }
  const c = getColumnLetterFromNumber(x + 1);
  return x < 0 ? `$${c}` : c;
};

export const c2x = (col: string, absolute = false): number => {
  const n = getNumberFromColumnLetter(col);
  return absolute ? -n : n;
};

export const y2r = (y: number) => {
  if (y === 0) {
    return '';
  }
  return y < 0 ? `$${y}` : String(y);
};

export const r2y = (row: number | string, absolute = false) => {
  if (typeof row === 'string') {
    row = parseInt(row, 10);
  }
  return absolute ? -row : row;
};

export const p2a = ({ y, x, absX, absY }: ExtraPointType) => {
  if (x === 0 && y === 0) {
    return '0';
  }
  if (x === -1 && y === -1) {
    return '?';
  }
  return `${absX ? '$' : ''}${x2c(x)}${absY ? '$' : ''}${y2r(y)}`;
};

export const a2p = (address: Address): ExtraPointType => {
  const m = address.match(/(\$)?([A-Z]*)(\$)?([0-9]*)/);
  if (m == null) {
    console.error('invalid address', address);
    return { y: -1, x: -1 };
  }
  const [, _absX, col, _absY, row] = m.slice();
  const [absX, absY] = [_absX != null, _absY != null];
  if (col === '' && row === '') {
    return { y: -1, x: -1, absX: false, absY: false };
  }
  return { y: r2y(row) || 0, x: c2x(col) || 0, absX, absY };
};

export const grantAddressAbsolute = (address: Address, absCol: boolean, absRow: boolean) => {
  const m = address.match(/([A-Z]*)([0-9]*)/);
  if (m == null) {
    return;
  }
  const [, col, row] = m.slice();
  return `${absCol ? '$' : ''}${col}${absRow ? '$' : ''}${row}`;
};

export const stripAddressAbsolute = (address: Address) => {
  return address.replace(/\$/g, '');
};
