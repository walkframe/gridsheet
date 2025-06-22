import type { ZoneType } from './types';

export const DEFAULT_HISTORY_LIMIT = 20;

export const DEFAULT_HEIGHT = 24;
export const DEFAULT_WIDTH = 90;

export const SHEET_HEIGHT = 500;
export const SHEET_WIDTH = 1000;

export const HEADER_HEIGHT = 24;
export const HEADER_WIDTH = 50;

export const MIN_WIDTH = 5;
export const MIN_HEIGHT = 5;

export const OVERSCAN_X = 5;
export const OVERSCAN_Y = 10;

export const DEFAULT_ALPHABET_CACHE_SIZE = 1000;

export class Special {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }
}

export const SECONDS_IN_DAY = 86400;
export const FULLDATE_FORMAT_UTC = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

export const RESET_ZONE: ZoneType = {
  startY: -1,
  startX: -1,
  endY: -1,
  endX: -1,
};
