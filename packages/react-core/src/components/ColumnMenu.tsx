import { type FC, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Context } from '../store';
import { setColumnMenu, setColLabel, sortRows, filterRows, clearFilterRows, insertColsLeft, insertColsRight, removeCols } from '../store/actions';
import { Fixed } from './Fixed';
import type { FilterCondition, FilterConditionMethod } from '../types';
import * as prevention from '../lib/operation';
import { x2c } from '../lib/converters';

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

export const ColumnMenu: FC = () => {
  const { store, dispatch } = useContext(Context);
  const { columnMenuState, tableReactive: tableRef, editorRef } = store;
  const table = tableRef.current;
  const [conditions, setConditions] = useState<FilterCondition[]>([{ ...DEFAULT_CONDITION }]);
  const [mode, setMode] = useState<'and' | 'or'>('or');
  const [label, setLabel] = useState('');
  const labelInputRef = useRef<HTMLInputElement>(null);

  const x = columnMenuState?.x;
  const position = columnMenuState?.position;

  // Restore conditions and label from existing state when menu opens
  useEffect(() => {
    if (x != null && table) {
      const colCell = table.getCellByPoint({ y: 0, x }, 'SYSTEM');
      const existing = colCell?.filter;
      if (existing && existing.conditions.length > 0) {
        setConditions(existing.conditions.map((c) => ({ ...c, value: [...c.value] })));
        setMode(existing.mode || 'or');
      } else {
        setConditions([{ ...DEFAULT_CONDITION, value: [''] }]);
        setMode('or');
      }
      setLabel(colCell?.label ?? '');
    }
  }, [x]);

  const handleClose = useCallback(() => {
    dispatch(setColumnMenu(null));
    editorRef.current?.focus();
  }, [dispatch, editorRef]);

  const handleApplyLabel = useCallback(() => {
    if (x == null) return;
    dispatch(setColLabel({ x, label }));
    dispatch(setColumnMenu(null));
    editorRef.current?.focus();
  }, [dispatch, x, label, editorRef]);

  const handleSortAsc = useCallback(() => {
    if (x == null) return;
    dispatch(sortRows({ x, direction: 'asc' }));
    dispatch(setColumnMenu(null));
    editorRef.current?.focus();
  }, [dispatch, x, editorRef]);

  const handleSortDesc = useCallback(() => {
    if (x == null) return;
    dispatch(sortRows({ x, direction: 'desc' }));
    dispatch(setColumnMenu(null));
    editorRef.current?.focus();
  }, [dispatch, x, editorRef]);

  const handleApplyFilter = useCallback(() => {
    if (x == null) return;
    // Build valid conditions (skip empty values for methods that need values)
    const valid = conditions.filter((c) => {
      if (NO_VALUE_METHODS.includes(c.method)) return true;
      return c.value.some((v) => v.trim() !== '');
    });
    if (valid.length === 0) {
      dispatch(clearFilterRows({ x }));
    } else {
      dispatch(
        filterRows({
          x,
          filter: { mode, conditions: valid },
        }),
      );
    }
    dispatch(setColumnMenu(null));
    editorRef.current?.focus();
  }, [dispatch, x, conditions, mode, editorRef]);

  const handleReset = useCallback(() => {
    dispatch(clearFilterRows({}));
    setConditions([{ ...DEFAULT_CONDITION, value: [''] }]);
    setMode('or');
    dispatch(setColumnMenu(null));
    editorRef.current?.focus();
  }, [dispatch, editorRef]);

  const updateCondition = useCallback(
    (index: number, patch: Partial<FilterCondition>) => {
      setConditions((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...patch };
        return next;
      });
    },
    [],
  );

  const addCondition = useCallback(() => {
    setConditions((prev) => [...prev, { ...DEFAULT_CONDITION, value: [''] }]);
  }, []);

  const removeCondition = useCallback((index: number) => {
    setConditions((prev) => {
      if (prev.length <= 1) return [{ ...DEFAULT_CONDITION, value: [''] }];
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  if (!columnMenuState || !table || x == null || !position) {
    return null;
  }

  const hasAnyFilter = table.hasActiveFilters();

  const colCell = table.getCellByPoint({ y: 0, x }, 'SYSTEM');
  const sortDisabled = prevention.hasOperation(colCell?.prevention, prevention.Sort);
  const filterDisabled = prevention.hasOperation(colCell?.prevention, prevention.Filter);
  const labelDisabled = prevention.hasOperation(colCell?.prevention, prevention.SetLabel);
  const labelPlaceholder = table.getLabel(undefined, colCell?.labeler, x) ?? x2c(x);
  const insertDisabled =
    table.maxNumCols !== -1 && table.getNumCols() + 1 > table.maxNumCols;
  const insertLeftDisabled =
    insertDisabled || prevention.hasOperation(colCell?.prevention, prevention.InsertColsLeft);
  const insertRightDisabled =
    insertDisabled || prevention.hasOperation(colCell?.prevention, prevention.InsertColsRight);
  const removeDisabled =
    (table.minNumCols !== -1 && table.getNumCols() - 1 < table.minNumCols) ||
    prevention.hasOperation(colCell?.prevention, prevention.RemoveCols);

  return (
    <Fixed
      className="gs-column-menu-modal"
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        handleClose();
        return false;
      }}
    >
      <div
        className="gs-column-menu"
        style={{ top: position.y, left: position.x }}
        onClick={(e) => e.stopPropagation()}
      >
        <ul>
          <li className={`gs-column-menu-filter${filterDisabled ? ' gs-disabled' : ''}`}>
            <div className="gs-filter-header">
              <div className="gs-menu-name">Filter</div>
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
                    onChange={(e) =>
                      updateCondition(i, {
                        method: e.target.value as FilterConditionMethod,
                      })
                    }
                  >
                    {(Object.keys(METHOD_LABELS) as FilterConditionMethod[]).map((m) => (
                      <option key={m} value={m}>
                        {METHOD_LABELS[m]}
                      </option>
                    ))}
                  </select>
                  {!NO_VALUE_METHODS.includes(cond.method) && (
                    <input
                      className="gs-filter-value-input"
                      type="text"
                      placeholder="Value"
                      value={cond.value[0] || ''}
                      disabled={filterDisabled}
                      onChange={(e) => updateCondition(i, { value: [e.target.value] })}
                      onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return;
                        if (e.key === 'Enter') handleApplyFilter();
                        if (e.key === 'Escape') handleClose();
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
              <button className="gs-filter-add-btn" onClick={addCondition} disabled={filterDisabled}>
                + ADD
              </button>
              <div className="gs-filter-actions-right">
                {hasAnyFilter && (
                  <button className="gs-filter-reset-btn" onClick={handleReset} disabled={filterDisabled}>
                    RESET
                  </button>
                )}
                <button className="gs-filter-apply-btn" onClick={handleApplyFilter} disabled={filterDisabled}>
                  APPLY
                </button>
              </div>
            </div>
          </li>
          <li className="gs-menu-divider" />
          <li
            className={sortDisabled ? 'gs-disabled' : 'gs-enabled'}
            onClick={() => { if (!sortDisabled) handleSortAsc(); }}
          >
            <div className="gs-menu-name">Sort A to Z</div>
          </li>
          <li
            className={sortDisabled ? 'gs-disabled' : 'gs-enabled'}
            onClick={() => { if (!sortDisabled) handleSortDesc(); }}
          >
            <div className="gs-menu-name">Sort Z to A</div>
          </li>
          <li className="gs-menu-divider" />
          <li className={`gs-column-menu-label${labelDisabled ? ' gs-disabled' : ''}`}>
            <div className="gs-label-input-row">
              <div className="gs-menu-name">Label:</div>
              <input
                ref={labelInputRef}
                className="gs-label-input"
                type="text"
                placeholder={labelPlaceholder}
                value={label}
                disabled={labelDisabled}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === 'Enter') handleApplyLabel();
                  if (e.key === 'Escape') handleClose();
                }}
              />
              <button className="gs-label-apply-btn" onClick={handleApplyLabel} disabled={labelDisabled}>
                UPDATE
              </button>
            </div>
          </li>
        </ul>
      </div>
    </Fixed>
  );
};
