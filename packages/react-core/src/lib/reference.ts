import { identifyFormula } from '../formula/evaluator';
import { CellsByIdType, Id } from '../types';
import { Table } from './table';

export class ReferencePreserver {
  public map: { [id: Id]: Id } = {};
  private table: Table;
  private dependentIds: Set<Id> = new Set<Id>();

  constructor(table: Table) {
    this.table = table;
  }

  addTheDependents(...ids: Id[]) {
    ids.forEach((id) => {
      const cell = this.table.wire.data[id];
      cell?.system?.dependents?.forEach((did) => {
        this.dependentIds.add(did);
      });
    });
  }

  resolveDependents(operation?: 'move' | 'removeRows' | 'removeCols'): CellsByIdType {
    this.table.clearAddressCaches();
    const diffBefore: CellsByIdType = {};
    this.dependentIds.forEach((id) => {
      const dep = this.table.wire.data[id];
      if (dep == null) {
        return;
      }
      diffBefore[id] = { ...dep };
      dep.value = identifyFormula(dep.value, {
        dependency: id,
        table: this.table,
        idMap: this.map,
        operation,
      });
    });

    return diffBefore;
  }
}
