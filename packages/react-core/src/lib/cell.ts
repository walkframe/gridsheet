import type { CellType } from '../types';

export const filterCellFields = (cell: CellType, ignoreFields: (keyof CellType)[]): CellType => {
  if (ignoreFields.length === 0) {
    return cell;
  }
  return Object.fromEntries(
    Object.entries(cell).filter(([key]) => !ignoreFields.includes(key as keyof CellType)),
  ) as CellType;
};
