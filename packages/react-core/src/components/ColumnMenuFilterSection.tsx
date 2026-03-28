import { type FC, useContext, useState, useCallback, useEffect } from 'react';
import { Context } from '../store';
import { filterRows } from '../store/actions';
import type { FilterCondition, FilterConditionMethod } from '../types';
import * as prevention from '../lib/operation';
import { registerMenuComponent, type ColMenuSectionProps } from '../lib/menu';

const METHOD_LABELS: Record<FilterConditionMethod, string> = {
  eq: '=',
  ne: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  blank: 'Blank',
  nonblank: 'Nonblank',
  includes: 'Includes',
  excludes: 'Excludes',
};

const NO_VALUE_METHODS: FilterConditionMethod[] = ['blank', 'nonblank'];
const DEFAULT_CONDITION: FilterCondition = { method: 'eq', value: [''] };

type PendingFilter = {
  x: number;
  conditions: FilterCondition[];
  mode: 'and' | 'or';
};

const FilterSection: FC<ColMenuSectionProps> = ({ x, close, onWaiting }) => {
  const { store, dispatch } = useContext(Context);
  const { sheetReactive: sheetRef } = store;
  const sheet = sheetRef.current;

  const [conditions, setConditions] = useState<FilterCondition[]>([{ ...DEFAULT_CONDITION }]);
  const [mode, setMode] = useState<'and' | 'or'>('or');
  const [pending, setPending] = useState<PendingFilter | null>(null);

  // Auto-focus first value input when x changes
  const firstValueRef = useCallback(
    (node: HTMLInputElement | null) => {
      if (node) {
        node.focus();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [x],
  );

  // Restore conditions from existing filter on the column cell when x changes
  useEffect(() => {
    if (sheet) {
      const colCell = sheet.getCell({ y: 0, x }, { resolution: 'SYSTEM' });
      const existing = colCell?.filter;
      if (existing && existing.conditions.length > 0) {
        setConditions(existing.conditions.map((c) => ({ ...c, value: [...c.value] })));
        setMode(existing.mode || 'or');
      } else {
        setConditions([{ ...DEFAULT_CONDITION, value: [''] }]);
        setMode('or');
      }
    }
  }, [x, sheet]);

  // Escape key cancels during waiting
  const handleCancel = useCallback(() => {
    setPending(null);
    onWaiting?.(null);
    close();
  }, [close, onWaiting]);

  // Notify parent about waiting state
  useEffect(() => {
    if (pending) {
      onWaiting?.('Filtering…', handleCancel);
    }
    // Do NOT include onWaiting/handleCancel in deps to avoid re-triggering execute
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  // Execute pending filter after async formulas resolve
  useEffect(() => {
    if (!pending) {
      return;
    }
    let cancelled = false;
    const execute = () => {
      if (cancelled) {
        return;
      }
      const currentSheet = sheetRef.current;
      if (!currentSheet) {
        return;
      }
      const { x: actionX, conditions: validConditions, mode: filterMode } = pending;
      if (validConditions.length > 0) {
        dispatch(filterRows({ x: actionX, filter: { mode: filterMode, conditions: validConditions } }));
      } else {
        dispatch(filterRows({ x: actionX }));
      }
      onWaiting?.(null);
      setPending(null);
      close();
    };
    const currentSheet = sheetRef.current;
    if (currentSheet && (currentSheet.hasPendingCells() || currentSheet.registry.asyncPending.size > 0)) {
      currentSheet.waitForPending().then(execute);
    } else {
      execute();
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const updateCondition = useCallback((index: number, patch: Partial<FilterCondition>) => {
    setConditions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

  const addCondition = useCallback(() => {
    setConditions((prev) => [...prev, { ...DEFAULT_CONDITION, value: [''] }]);
  }, []);

  const removeCondition = useCallback((index: number) => {
    setConditions((prev) => {
      if (prev.length <= 1) {
        return [{ ...DEFAULT_CONDITION, value: [''] }];
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleApplyFilter = useCallback(() => {
    const valid = conditions.filter((c) => {
      if (NO_VALUE_METHODS.includes(c.method)) {
        return true;
      }
      return c.value.some((v) => v.trim() !== '');
    });
    setPending({ x, conditions: valid, mode });
  }, [x, conditions, mode]);

  const handleResetColumn = useCallback(() => {
    setPending(null);
    dispatch(filterRows({ x }));
    close();
  }, [dispatch, x, close]);

  const handleResetAll = useCallback(() => {
    setPending(null);
    dispatch(filterRows({}));
    close();
  }, [dispatch, close]);

  if (!sheet) {
    return null;
  }

  const colCell = sheet.getCell({ y: 0, x }, { resolution: 'SYSTEM' });
  const filterDisabled = prevention.hasOperation(colCell?.prevention, prevention.Filter);
  const hasAnyFilter = sheet.hasActiveFilters();

  return (
    <li className={`gs-column-menu-filter${filterDisabled ? ' gs-disabled' : ''}`}>
      <>
        <div className="gs-filter-header">
          <div className="gs-menu-name">Filter:</div>
          <button className="gs-filter-add-btn" onClick={addCondition} disabled={filterDisabled}>
            + ADD
          </button>
          <div className={`gs-filter-mode-toggle${conditions.length <= 1 ? ' gs-disabled' : ''}`}>
            <label className={mode === 'and' ? 'gs-active' : ''}>
              <input
                type="radio"
                name="gs-filter-mode"
                checked={mode === 'and'}
                onChange={() => setMode('and')}
                disabled={filterDisabled || conditions.length <= 1}
              />
              AND
            </label>
            <label className={mode === 'or' ? 'gs-active' : ''}>
              <input
                type="radio"
                name="gs-filter-mode"
                checked={mode === 'or'}
                onChange={() => setMode('or')}
                disabled={filterDisabled || conditions.length <= 1}
              />
              OR
            </label>
          </div>
        </div>
        <div className="gs-filter-conditions">
          {conditions.map((cond, i) => (
            <div className="gs-filter-condition-row" key={i}>
              <select
                className="gs-filter-method-select"
                value={cond.method}
                disabled={filterDisabled}
                tabIndex={i * 2 + 1}
                onChange={(e) => updateCondition(i, { method: e.target.value as FilterConditionMethod })}
              >
                {(Object.keys(METHOD_LABELS) as FilterConditionMethod[]).map((m) => (
                  <option key={m} value={m}>
                    {METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
              {!NO_VALUE_METHODS.includes(cond.method) && (
                <input
                  ref={i === 0 ? firstValueRef : undefined}
                  className="gs-filter-value-input"
                  type="text"
                  placeholder="Value"
                  value={cond.value[0] || ''}
                  disabled={filterDisabled}
                  tabIndex={i * 2 + 2}
                  onChange={(e) => updateCondition(i, { value: [e.target.value] })}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) {
                      return;
                    }
                    if (e.key === 'Enter') {
                      handleApplyFilter();
                    }
                    if (e.key === 'Escape') {
                      close();
                    }
                  }}
                />
              )}
              <button
                className="gs-filter-remove-btn"
                onClick={() => removeCondition(i)}
                disabled={filterDisabled}
                title="Remove condition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="gs-filter-actions">
          {hasAnyFilter && (
            <button className="gs-filter-reset-all-btn" onClick={handleResetAll}>
              RESET ALL
            </button>
          )}
          <div className="gs-filter-actions-right">
            {colCell?.filter && (
              <button className="gs-filter-reset-btn" onClick={handleResetColumn}>
                RESET
              </button>
            )}
            <button className="gs-filter-apply-btn" onClick={handleApplyFilter} disabled={filterDisabled}>
              APPLY
            </button>
          </div>
        </div>
      </>
    </li>
  );
};

registerMenuComponent('col-filter', FilterSection);
export { FilterSection };
