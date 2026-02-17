import { type FC, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Context } from '../store';
import {
  setColumnMenu,
  sortRows,
  filterRows,
  insertColsLeft,
  insertColsRight,
  removeCols,
  setStore,
} from '../store/actions';
import { Fixed } from './Fixed';
import type { FilterCondition, FilterConditionMethod } from '../types';
import * as prevention from '../lib/operation';
import { x2c, p2a } from '../lib/coords';

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
  // Pending action: holds the action to execute after async formulas resolve
  const [pendingAction, setPendingAction] = useState<{
    type: 'sortAsc' | 'sortDesc' | 'filter';
    x: number;
    filter?: { mode: 'and' | 'or'; conditions: FilterCondition[] };
  } | null>(null);
  const waiting = pendingAction != null;

  const x = columnMenuState?.x;
  const position = columnMenuState?.position;

  // Callback ref: auto-focus the first filter value input when it mounts
  const firstValueRef = useCallback(
    (node: HTMLInputElement | null) => {
      if (node) {
        node.focus();
      }
    },
    [x],
  );

  // When a pending action is set, wait for async formulas then execute
  useEffect(() => {
    if (!pendingAction) {
      return;
    }
    let cancelled = false;
    const execute = () => {
      if (cancelled) {
        return;
      }
      const currentTable = tableRef.current;
      if (!currentTable) {
        return;
      }
      const { type, x: actionX, filter } = pendingAction;
      if (type === 'sortAsc') {
        dispatch(sortRows({ x: actionX, direction: 'asc' }));
      } else if (type === 'sortDesc') {
        dispatch(sortRows({ x: actionX, direction: 'desc' }));
      } else if (type === 'filter' && filter) {
        if (filter.conditions.length === 0) {
          dispatch(filterRows({ x: actionX }));
        } else {
          dispatch(filterRows({ x: actionX, filter }));
        }
      }
      setPendingAction(null);
      dispatch(setColumnMenu(null));
      editorRef.current?.focus();
    };
    const currentTable = tableRef.current;
    if (currentTable && (currentTable.hasPendingCells() || currentTable.wire.asyncPending.size > 0)) {
      currentTable.waitForPending().then(execute);
    } else {
      execute();
    }
    return () => {
      cancelled = true;
    };
  }, [pendingAction, dispatch, editorRef, tableRef]);

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
    if (x == null || table == null) {
      return;
    }
    const address = p2a({ y: 0, x });
    table.update({
      diff: { [address]: { label: label || undefined } },
      partial: true,
      ignoreFields: [],
      undoReflection: {
        sheetId: table.sheetId,
        selectingZone: store.selectingZone,
        choosing: store.choosing,
      },
      redoReflection: {
        sheetId: table.sheetId,
        selectingZone: store.selectingZone,
        choosing: store.choosing,
      },
    });
    dispatch(setColumnMenu(null));
    dispatch(
      setStore({
        tableReactive: { current: table },
      }),
    );
    editorRef.current?.focus();
  }, [dispatch, x, label, editorRef, table, store.selectingZone, store.choosing]);

  const handleSortAsc = useCallback(() => {
    if (x == null) {
      return;
    }
    setPendingAction({ type: 'sortAsc', x });
  }, [x]);

  const handleSortDesc = useCallback(() => {
    if (x == null) {
      return;
    }
    setPendingAction({ type: 'sortDesc', x });
  }, [x]);

  const handleApplyFilter = useCallback(() => {
    if (x == null) {
      return;
    }
    // Build valid conditions (skip empty values for methods that need values)
    const valid = conditions.filter((c) => {
      if (NO_VALUE_METHODS.includes(c.method)) {
        return true;
      }
      return c.value.some((v) => v.trim() !== '');
    });
    setPendingAction({
      type: 'filter',
      x,
      filter: { mode, conditions: valid },
    });
  }, [x, conditions, mode]);

  const handleResetColumn = useCallback(() => {
    if (x == null) {
      return;
    }
    setPendingAction(null);
    dispatch(filterRows({ x }));
    setConditions([{ ...DEFAULT_CONDITION, value: [''] }]);
    setMode('or');
    dispatch(setColumnMenu(null));
    editorRef.current?.focus();
  }, [dispatch, x, editorRef]);

  const handleResetAll = useCallback(() => {
    setPendingAction(null);
    dispatch(filterRows({}));
    setConditions([{ ...DEFAULT_CONDITION, value: [''] }]);
    setMode('or');
    dispatch(setColumnMenu(null));
    editorRef.current?.focus();
  }, [dispatch, editorRef]);

  const handleCancel = useCallback(() => {
    setPendingAction(null);
    dispatch(setColumnMenu(null));
    editorRef.current?.focus();
  }, [dispatch, editorRef]);

  // Escape key cancels pending action during waiting
  useEffect(() => {
    if (!waiting) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [waiting, handleCancel]);

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

  if (!columnMenuState || !table || x == null || !position) {
    return null;
  }

  const hasAnyFilter = table.hasActiveFilters();

  const colCell = table.getCellByPoint({ y: 0, x }, 'SYSTEM');
  const sortDisabled = prevention.hasOperation(colCell?.prevention, prevention.Sort);
  const filterDisabled = prevention.hasOperation(colCell?.prevention, prevention.Filter);
  const labelDisabled = prevention.hasOperation(colCell?.prevention, prevention.SetLabel);
  const labelPlaceholder = table.getLabel(undefined, colCell?.labeler, x) ?? x2c(x);
  const insertDisabled = table.maxNumCols !== -1 && table.getNumCols() + 1 > table.maxNumCols;
  const insertLeftDisabled = insertDisabled || prevention.hasOperation(colCell?.prevention, prevention.InsertColsLeft);
  const insertRightDisabled =
    insertDisabled || prevention.hasOperation(colCell?.prevention, prevention.InsertColsRight);
  const removeDisabled =
    (table.minNumCols !== -1 && table.getNumCols() - 1 < table.minNumCols) ||
    prevention.hasOperation(colCell?.prevention, prevention.RemoveCols);

  const waitingMessage =
    pendingAction?.type === 'filter'
      ? 'Filtering...'
      : pendingAction?.type === 'sortAsc' || pendingAction?.type === 'sortDesc'
        ? 'Sorting...'
        : 'Processing...';

  return (
    <Fixed
      className="gs-column-menu-modal"
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        if (!waiting) {
          handleClose();
        }
        return false;
      }}
    >
      {waiting ? (
        <div
          className="gs-column-menu gs-column-menu-waiting"
          style={{ top: position.y, left: position.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="gs-waiting-message">{waitingMessage}</div>
          <div className="gs-waiting-spinner" />
          <button className="gs-waiting-cancel-btn" onClick={handleCancel}>
            CANCEL
          </button>
        </div>
      ) : (
        <div
          className="gs-column-menu"
          style={{ top: position.y, left: position.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <ul>
            <li className={`gs-column-menu-filter${filterDisabled ? ' gs-disabled' : ''}`}>
              <div className="gs-filter-header">
                <div className="gs-menu-name">Filter</div>
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
                        ref={i === 0 ? firstValueRef : undefined}
                        className="gs-filter-value-input"
                        type="text"
                        placeholder="Value"
                        value={cond.value[0] || ''}
                        disabled={filterDisabled}
                        onChange={(e) => updateCondition(i, { value: [e.target.value] })}
                        onKeyDown={(e) => {
                          if (e.nativeEvent.isComposing) {
                            return;
                          }
                          if (e.key === 'Enter') {
                            handleApplyFilter();
                          }
                          if (e.key === 'Escape') {
                            handleClose();
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
            </li>
            <li className="gs-menu-divider" />
            <li
              className={sortDisabled ? 'gs-disabled' : 'gs-enabled'}
              onClick={() => {
                if (!sortDisabled) {
                  handleSortAsc();
                }
              }}
            >
              <div className="gs-menu-name">Sort A to Z</div>
            </li>
            <li
              className={sortDisabled ? 'gs-disabled' : 'gs-enabled'}
              onClick={() => {
                if (!sortDisabled) {
                  handleSortDesc();
                }
              }}
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
                    if (e.nativeEvent.isComposing) {
                      return;
                    }
                    if (e.key === 'Enter') {
                      handleApplyLabel();
                    }
                    if (e.key === 'Escape') {
                      handleClose();
                    }
                  }}
                />
                <button className="gs-label-apply-btn" onClick={handleApplyLabel} disabled={labelDisabled}>
                  UPDATE
                </button>
              </div>
            </li>
          </ul>
        </div>
      )}
    </Fixed>
  );
};
