import { Pending, Special } from '../../constants';
import type { Wire } from '../../lib/hub';
import type { CellType, PointType } from '../../types';

/**
 * Lightweight error class used inside async formula error handling.
 * Mirrors FormulaError's shape so the renderer can display it identically.
 * We define it here rather than importing FormulaError to keep the
 * dependency graph clean.
 */
export class AsyncFormulaError {
  public code: string;
  public message: string;
  public error?: Error;
  constructor(code: string, message: string, error?: Error) {
    this.code = code;
    this.message = message;
    this.error = error;
  }
}

/**
 * Sentinel value to distinguish cache miss from user-returned undefined/null.
 * Since user functions can return undefined or null, we need a special marker
 * to indicate "no cache entry found" vs "cache entry is undefined".
 */
export const asyncCacheMiss = new Special('asyncCacheMiss');

/** Returns true if any element of `args` is a Pending sentinel. */
export const hasPendingArg = (args: any[]): boolean => {
  return args.some((v) => v instanceof Pending);
};

/** Duck-type check for Table instances (avoids importing Table to prevent circular deps). */
const isTable = (v: any): boolean => v != null && typeof v === 'object' && 'sheetId' in v && 'wire' in v;

/**
 * cyrb53 – a fast, high-quality 53-bit string hash.
 * Returns a non-negative integer that fits safely in a JS Number.
 */
const cyrb53 = (str: string, seed = 0): number => {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

/**
 * Build a cache key from function name + hashed serialised arguments.
 *
 * Format: `funcName:length:hash1-hash2-...`
 *   - length: byte length of the JSON-serialised args
 *   - hash:   cyrb53 hash of the JSON string, repeated hashPrecision times with different seeds
 *
 * When a Table appears as an argument its trimmed area is converted to a
 * value matrix (`any[][]`) via `getFieldMatrix()` so the key reflects the
 * actual cell values the function will operate on.
 */
export const buildAsyncCacheKey = (funcName: string, bareArgs: any[], hashPrecision: number = 1): string => {
  const argsJson = JSON.stringify(bareArgs, (_key, value) => {
    if (isTable(value)) {
      return value.getFieldMatrix();
    }
    if (value instanceof Pending) {
      return null;
    }
    return value;
  });
  const hashes = Array.from({ length: hashPrecision }, (_, i) => cyrb53(argsJson, i).toString(36));
  return `${funcName}:${argsJson.length}:${hashes.join('-')}`;
};

/**
 * Try to retrieve a cached or pending async result for the given cache key.
 *
 * Returns:
 * - Cached value if present, valid, and not expired
 * - Pending if there is an in-flight promise for this cell
 * - asyncCacheMiss if no cache/pending exists (distinguishes from user-returned undefined/null)
 */
export const getAsyncCache = (
  table: { wire: Wire; getId: (p: PointType) => string },
  origin: PointType,
  key: string,
): any => {
  const cellId = table.getId(origin);
  const wire = table.wire;
  const cell: CellType | undefined = wire.data[cellId];

  // Check for a cached result from a previous async run
  if (cell?.system?.asyncCache != null) {
    const ac = cell.system.asyncCache;
    if (ac.key === key) {
      // Check expiry
      if (ac.expireTime == null || Date.now() < ac.expireTime) {
        return ac.value;
      }
      // Expired — clear and re-fetch below
      cell.system.asyncCache = undefined;
    } else {
      // Key changed (inputs changed) — invalidate
      cell.system.asyncCache = undefined;
    }
  }

  // Check if there is already a pending promise for this cell
  if (wire.asyncPending.has(cellId)) {
    return wire.asyncPending.get(cellId)!;
  }
  return asyncCacheMiss;
};

/**
 * Handle an async (Promise) result returned by BaseFunction.main().
 *
 * Cache is stored per-cell in cell.system.asyncCache.
 * In-flight tracking uses Wire.asyncPending (keyed by cell ID).
 *
 * Flow:
 * 1. If cell has asyncCache and the key matches (inputs unchanged) and not expired → return cached value
 * 2. If there is already an in-flight promise for this cell → return its Pending
 * 3. Otherwise start the async work, return a new Pending, and on completion
 *    write the result into cell.system.asyncCache and trigger a re-render.
 *
 * @param ttlMilliseconds - Cache time-to-live in **milliseconds**. undefined = never expires.
 */
export const getOrSaveAsyncCache = (
  promise: Promise<any>,
  table: { wire: Wire; getId: (p: PointType) => string },
  origin: PointType,
  key: string,
  ttlMilliseconds?: number,
): any => {
  const cellId = table.getId(origin);
  const wire = table.wire;

  // Compute expireTime from ttl (ms)
  const expireTime = ttlMilliseconds != null ? Date.now() + ttlMilliseconds : undefined;

  // Start the async computation
  const pending = new Pending(promise);
  wire.asyncPending.set(cellId, pending);

  promise
    .then((result: any) => {
      const c = wire.data[cellId];
      if (c?.system) {
        c.system.asyncCache = { value: result, key, expireTime };
      }
    })
    .catch((error: any) => {
      const errValue = new AsyncFormulaError('#ASYNC!', error?.message ?? String(error), error);
      const c = wire.data[cellId];
      if (c?.system) {
        c.system.asyncCache = { value: errValue, key, expireTime };
      }
    })
    .finally(() => {
      wire.asyncPending.delete(cellId);
      // Clear solvedCaches so dependent formulas re-evaluate
      wire.solvedCaches.clear();
      // Trigger re-render of all sheets
      wire.transmit();
    });

  return pending;
};

/**
 * Create a Pending sentinel that resolves immediately.
 * Used when an argument is already pending — the result is propagated.
 */
export const createPropagatedPending = (): Pending => {
  return new Pending(Promise.resolve());
};
