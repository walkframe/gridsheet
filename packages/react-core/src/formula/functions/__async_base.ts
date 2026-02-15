import { Pending } from '../../constants';
import type { Wire } from '../../lib/hub';

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

/** Returns true if any element of `args` is a Pending sentinel. */
export const hasPendingArg = (args: any[]): boolean => {
  return args.some((v) => v instanceof Pending);
};

/** Duck-type check for Table instances (avoids importing Table to prevent circular deps). */
const isTable = (v: any): boolean => v != null && typeof v === 'object' && 'sheetId' in v && 'wire' in v;

/** Build a cache key from function name + serialised arguments. */
export const buildAsyncCacheKey = (funcName: string, bareArgs: any[]): string => {
  const argsKey = JSON.stringify(bareArgs, (_key, value) => {
    if (isTable(value)) {
      return `__table__${value.sheetId}`;
    }
    if (value instanceof Pending) {
      return '__pending__';
    }
    if (value === undefined) {
      return '__undefined__';
    }
    return value;
  });
  return `${funcName}:${argsKey}`;
};

/**
 * Handle an async (Promise) result returned by BaseFunction.main().
 *
 * If a cached result already exists for the given key, returns it.
 * If there is already an in-flight promise, returns its Pending sentinel.
 * Otherwise starts the async work and returns a new Pending sentinel,
 * then caches the result and triggers a re-render when done.
 */
export const handleAsyncResult = (promise: Promise<any>, wire: Wire, key: string): any => {
  // Check for a cached result from a previous async run
  const cached = wire.asyncCaches.get(key);
  if (cached !== undefined) {
    return cached;
  }

  // Check if there is already a pending promise for this key
  if (wire.asyncPending.has(key)) {
    return wire.asyncPending.get(key)!;
  }

  // Start the async computation
  const pending = new Pending(promise);
  wire.asyncPending.set(key, pending);

  promise
    .then((result: any) => {
      wire.asyncCaches.set(key, result);
    })
    .catch((error: any) => {
      wire.asyncCaches.set(key, new AsyncFormulaError('#ASYNC!', error?.message ?? String(error), error));
    })
    .finally(() => {
      wire.asyncPending.delete(key);
      // Trigger re-render of all sheets
      wire.solvedCaches.clear();
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
