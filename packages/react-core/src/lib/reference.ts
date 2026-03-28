import { CellsByIdType, Id } from '../types';
import { Sheet } from './sheet';

export class ReferencePreserver {
  public map: { [id: Id]: Id } = {};
  private sheet: Sheet;
  private dependentIds: Set<Id> = new Set<Id>();

  constructor(sheet: Sheet) {
    this.sheet = sheet;
  }

  collectDependents(...ids: Id[]) {
    ids.forEach((id) => {
      this.sheet.registry.systems[id]?.dependents?.forEach((did) => {
        this.dependentIds.add(did);
      });
    });
  }

  /**
   * Compare two idMatrix snapshots (`before` and `after`) and populate
   * `this.map` and collect dependents for every position where the occupying
   * cell ID changed. Works for any rearrangement (sort, move, etc.).
   */
  buildMap(before: Id[], after: Id[]) {
    for (let i = 0; i < before.length; i++) {
      const prevId = before[i];
      const currId = after[i];
      if (prevId != null && currId != null && prevId !== currId) {
        this.collectDependents(prevId, currId);
        this.map[prevId] = currId;
      }
    }
  }

  resolveDependents(operation?: 'move' | 'removeRows' | 'removeCols'): CellsByIdType {
    this.sheet.clearAddressCaches();
    const diffBefore: CellsByIdType = {};
    this.dependentIds.forEach((id) => {
      const dep = this.sheet.registry.data[id];
      if (dep == null) {
        return;
      }
      diffBefore[id] = { ...dep };
      this.sheet.clearDependencies(id);
      dep.value = this.sheet.processFormula(dep.value, {
        dependency: id,
        idMap: this.map,
        operation,
      });
    });

    return diffBefore;
  }
}
