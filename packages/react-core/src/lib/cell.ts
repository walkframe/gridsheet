import type { AsyncCache, CellType, System } from '../types';

export const filterCellFields = (cell: CellType, ignoreFields: (keyof CellType)[]): CellType => {
  if (ignoreFields.length === 0) {
    return cell;
  }
  return Object.fromEntries(
    Object.entries(cell).filter(([key]) => !ignoreFields.includes(key as keyof CellType)),
  ) as CellType;
};

/**
 * Ensure that `binding.systems[id]` exists, initialising it with sensible
 * defaults when missing.  Any keys present in `defaults` that are absent on
 * the existing System object are filled in.
 * Returns the (possibly freshly-created) `System` object.
 */
export const ensureSys = (
  binding: { systems: Record<string, System> },
  id: string,
  defaults: Partial<System> = {},
): System => {
  if (binding.systems[id] == null) {
    binding.systems[id] = {};
  }
  const sys = binding.systems[id];
  for (const key of Object.keys(defaults) as (keyof System)[]) {
    (sys as any)[key] ??= defaults[key];
  }
  return sys;
};

/**
 * Write an `AsyncCache` entry into `cell.asyncCaches[key]`, creating the
 * `asyncCaches` record if it does not yet exist.
 */
export const setAsyncCache = (cell: CellType, key: string, ac: AsyncCache): void => {
  if (!cell.asyncCaches) {
    cell.asyncCaches = {};
  }
  cell.asyncCaches[key] = ac;
};
