import type { PointType } from '../types';
import type { UserSheet } from './sheet';

export const getLabel = (sheet: UserSheet, label: string | undefined, point: PointType, n: number): string | null => {
  if (label != null) {
    return label;
  }
  const policy = sheet.getPolicy(point);
  return (point.x === 0 ? policy.renderRowHeaderLabel(n) : policy.renderColHeaderLabel(n)) ?? null;
};
