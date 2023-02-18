export const DUMMY_IMG = document.createElement("img");
DUMMY_IMG.src =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export const HISTORY_LIMIT = 10;

export const DEFAULT_HEIGHT = 24;
export const DEFAULT_WIDTH = 90;

export const SHEET_HEIGHT = 500;
export const SHEET_WIDTH = 1000;

export const HEADER_HEIGHT = 20;
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
