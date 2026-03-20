import { identifyFormula } from '../formula/evaluator';
import { CellsByIdType, Id } from '../types';
import { Sheet } from './sheet';

export class ReferencePreserver {
  public map: { [id: Id]: Id } = {};
  private sheet: Sheet;
  private dependentIds: Set<Id> = new Set<Id>();

  constructor(sheet: Sheet) {
    this.sheet = sheet;
  }

  addTheDependents(...ids: Id[]) {
    ids.forEach((id) => {
      this.sheet.registry.systems[id]?.dependents?.forEach((did) => {
        this.dependentIds.add(did);
      });
    });
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
      dep.value = identifyFormula(dep.value, {
        dependency: id,
        sheet: this.sheet,
        idMap: this.map,
        operation,
      });
    });

    return diffBefore;
  }
}
