import { Pending, Sentinel } from '../../sentinels';
import { FormulaError } from '../evaluator';
import { ensureSys, setAsyncCache } from '../../lib/cell';
import type { Wire } from '../../lib/hub';
import type { CellType, PointType } from '../../types';

/**
 * Sentinel value to distinguish cache miss from user-returned undefined/null.
 * Since user functions can return undefined or null, we need a special marker
 * to indicate "no cache entry found" vs "cache entry is undefined".
 */
export const asyncCacheMiss = new Sentinel('asyncCacheMiss');

/** Returns true if any element of `args` is a Pending sentinel. */
export const hasPendingArg = (args: any[]): boolean => {
  return args.some((v) => Pending.is(v));
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
    if (Pending.is(value)) {
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
  useInflight: boolean = false,
): any => {
  const cellId = table.getId(origin);
  const wire = table.wire;
  const cell: CellType | undefined = wire.data[cellId];

  if (cell == null) {
    return asyncCacheMiss;
  }

  const sys = ensureSys(cell, { tmpAsyncCaches: {} });

  // Check for a cached result from a previous async run
  if (cell.asyncCaches != null) {
    const ac = cell.asyncCaches[key];
    if (ac != null) {
      // Check expiry
      if (ac.expireTime == null || Date.now() < ac.expireTime) {
        sys.tmpAsyncCaches![key] = ac;
        return ac.value;
      }
      // Expired — will not be copied to tmpAsyncCaches
    }
  }

  const compositeKey = `${cellId}:${key}`;

  // Check if there is already a pending promise for this cell+key
  if (wire.asyncPending.has(compositeKey)) {
    return wire.asyncPending.get(compositeKey)!;
  }

  // If useInflight is enabled, check for an in-flight promise with the same cache key
  if (useInflight && wire.asyncInflight?.has(key)) {
    const inflight = wire.asyncInflight.get(key)!;
    // Track for this cell+key to prevent duplicate `.then` attachment and correctly yield the pending sentinel
    wire.asyncPending.set(compositeKey, inflight.pending);

    // Chain to the shared promise to populate this cell's cache when it resolves
    inflight.pending.promise
      .then((result: any) => {
        const c = wire.data[cellId];
        if (c != null) {
          setAsyncCache(c, key, { value: result, expireTime: inflight.expireTime });
        }
      })
      .catch((error: any) => {
        const errValue = new FormulaError(
          '#ASYNC!',
          error?.message ?? String(error),
          error instanceof Error ? error : undefined,
        );
        const c = wire.data[cellId];
        if (c != null) {
          setAsyncCache(c, key, { value: errValue, expireTime: inflight.expireTime });
        }
      })
      .finally(() => {
        wire.asyncPending.delete(compositeKey);
      });

    return inflight.pending;
  }

  return asyncCacheMiss;
};

/**
 * Handle an async (Promise) result returned by BaseFunction.main().
 *
 * Cache is stored per-cell in cell.asyncCache.
 * In-flight tracking uses Wire.asyncPending (keyed by cell ID).
 * If useInflight is true, also tracks by cache key in Wire.asyncInflight.
 *
 * Flow:
 * 1. If cell has asyncCache and the key matches (inputs unchanged) and not expired → return cached value
 * 2. If there is already an in-flight promise for this cell → return its Pending
 * 3. If useInflight is true and there is an in-flight promise for this key → return its Pending
 * 4. Otherwise start the async work, return a new Pending, and on completion
 *    write the result into cell.asyncCache and trigger a re-render.
 *
 * @param ttlMilliseconds - Cache time-to-live in **milliseconds**. undefined = never expires.
 * @param useInflight - If true, reuse the same promise for matching cache keys across different cells.
 */
export const awaitAndSave = (
  promise: Promise<any>,
  table: { wire: Wire; getId: (p: PointType) => string },
  origin: PointType,
  key: string,
  ttlMilliseconds?: number,
  useInflight: boolean = false,
): Pending => {
  const cellId = table.getId(origin);
  const wire = table.wire;

  // Compute expireTime from ttl (ms)
  const expireTime = ttlMilliseconds != null ? Date.now() + ttlMilliseconds : undefined;

  const compositeKey = `${cellId}:${key}`;

  // Start the async computation
  const pending = new Pending(promise);
  wire.asyncPending.set(compositeKey, pending);

  // If useInflight is enabled, also track by cache key
  if (useInflight) {
    if (!wire.asyncInflight) {
      wire.asyncInflight = new Map();
    }
    wire.asyncInflight.set(key, { pending, expireTime });
  }

  promise
    .then((result: any) => {
      const c = wire.data[cellId];
      if (c != null) {
        setAsyncCache(c, key, { value: result, expireTime });
      }
    })
    .catch((error: any) => {
      const errValue = new FormulaError(
        '#ASYNC!',
        error?.message ?? String(error),
        error instanceof Error ? error : undefined,
      );
      const c = wire.data[cellId];
      if (c != null) {
        setAsyncCache(c, key, { value: errValue, expireTime });
      }
    })
    .finally(() => {
      wire.asyncPending.delete(compositeKey);
      // If useInflight was enabled, also remove from asyncInflight
      if (useInflight) {
        if (wire.asyncInflight) {
          wire.asyncInflight.delete(key);
        }
      }
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
