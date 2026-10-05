'use client';

import * as React from 'react';
import {
  GridSheet,
  buildInitialCells,
  operations,
  Policy,
  ThousandSeparatorPolicyMixin,
  CheckboxPolicyMixin,
  makeBorder,
} from '@gridsheet/react-core';
import type { PolicyMixinType, AutocompleteOption, SelectProps } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';
import { useStarlightMode } from './useStarlightMode';

const DEPARTMENT_OPTIONS: AutocompleteOption[] = [
  { value: 'Engineering', label: '🔧 Engineering', keywords: ['Engineering', 'dev', 'development'] },
  { value: 'Marketing', label: '📢 Marketing', keywords: ['Marketing', 'promotion', 'advertising'] },
  { value: 'Sales', label: '💰 Sales', keywords: ['Sales', 'revenue', 'selling'] },
  { value: 'HR', label: '👥 HR', keywords: ['HR', 'Human Resources', 'personnel'] },
  { value: 'Finance', label: '💼 Finance', keywords: ['Finance', 'accounting', 'financial'] },
  { value: 'Operations', label: '⚙️ Operations', keywords: ['Operations', 'operational', 'management'] },
  { value: 'Product', label: '🚀 Product', keywords: ['Product', 'product management', 'goods'] },
  { value: 'Support', label: '🛠️ Support', keywords: ['Support', 'help', 'assistance'] },
];

// Dropdown + fallback: unknown departments are replaced with 'Engineering'.
const DepartmentPolicy: PolicyMixinType = {
  getSelectOptions: () => DEPARTMENT_OPTIONS,
  select: ({ next }: SelectProps) => {
    if (next?.value == null) {
      return next;
    }
    const valid = DEPARTMENT_OPTIONS.some((o) => o.value === next.value);
    return valid ? next : { ...next, value: 'Engineering' };
  },
};

// Validation: clamp amounts to 0 .. 1,000,000.
const BudgetPolicy: PolicyMixinType = {
  select: ({ next }: SelectProps) => {
    if (next?.value == null) {
      return next;
    }
    const value = Number(next.value);
    if (isNaN(value) || value < 0) {
      return { ...next, value: 0 };
    }
    if (value > 1_000_000) {
      return { ...next, value: 1_000_000 };
    }
    return next;
  },
};

// Masking: show only the last 4 characters. Display-only — the stored value is
// unchanged and the cell editor still shows it in full.
const mask = (value: unknown) => {
  if (value == null || value === '') {
    return '';
  }
  const str = String(value);
  return str.length <= 4 ? str : `${'•'.repeat(str.length - 4)}${str.slice(-4)}`;
};

const MaskPolicy: PolicyMixinType = {
  renderString: ({ value }) => mask(value),
  // What Ctrl/Cmd+C puts on the clipboard (default: the raw serialized value).
  serializeForClipboard: ({ point, sheet }) => mask(sheet.getSerializedValue({ point })),
};

const INITIAL_STATUSES = ['Approved', 'Pending', 'Under Review', 'Rejected'];

export default function BudgetManagement() {
  const inheritMode = useStarlightMode();

  // Status options are editable at runtime. The policy reads them through a ref,
  // so it always sees the latest list without being recreated.
  const [statuses, setStatuses] = React.useState<string[]>(INITIAL_STATUSES);
  const [draft, setDraft] = React.useState('');
  const statusesRef = React.useRef(statuses);
  React.useEffect(() => {
    statusesRef.current = statuses;
  }, [statuses]);

  const policies = React.useMemo(() => {
    const StatusPolicy: PolicyMixinType = {
      getSelectOptions: () => statusesRef.current.map((s) => ({ value: s })),
      select: ({ current, next }: SelectProps) => {
        if (next?.value == null || next.value === '') {
          return next;
        }
        // Reject unknown statuses: keep the previous value.
        return statusesRef.current.includes(next.value) ? next : { ...next, value: current?.value };
      },
    };
    return {
      department: new Policy({ mixins: [DepartmentPolicy] }),
      status: new Policy({ mixins: [StatusPolicy] }),
      budget: new Policy({ mixins: [BudgetPolicy, ThousandSeparatorPolicyMixin] }),
      thousand_separator: new Policy({ mixins: [ThousandSeparatorPolicyMixin] }),
      checkbox: new Policy({ mixins: [CheckboxPolicyMixin] }),
      mask: new Policy({ mixins: [MaskPolicy] }),
    };
  }, []);

  const book = useSpellbook({ policies });

  const addStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const s = draft.trim();
    if (s && !statuses.includes(s)) {
      setStatuses([...statuses, s]);
    }
    setDraft('');
  };

  // Theme-independent tints/borders: styles inside buildInitialCells are baked once.
  const structBorder = 'rgba(127, 127, 127, 0.55)';

  return (
    <div style={{ padding: '8px 0' }}>
      <GridSheet
        book={book}
        sheetName="budget"
        initialCells={buildInitialCells({
          matrices: {
            A1: [
              ['Engineering', 'AC-4410-2981', 50000, 42000, '=C1-D1', 'Approved', true],
              ['Marketing', 'AC-4410-3307', 75000, 68000, '=C2-D2', 'Approved', true],
              ['Sales', 'AC-4410-5126', 120000, 95000, '=C3-D3', 'Under Review', false],
              ['HR', 'AC-4410-0764', 30000, 28000, '=C4-D4', 'Pending', false],
              ['Finance', 'AC-4410-8853', 45000, 52000, '=C5-D5', 'Rejected', false],
              ['', '', '', '', '', '', ''],
              ['Total', '', '=SUM(C1:C5)', '=SUM(D1:D5)', '=SUM(E1:E5)', '', '=COUNTIF(G1:G5,true)'],
            ],
          },
          cells: {
            defaultRow: { height: 36 },
            A: {
              label: 'Department',
              width: 100,
              style: { borderRight: `double 3px ${structBorder}` },
              policy: 'department',
            },
            B: {
              label: 'Account 🔒',
              width: 92,

              policy: 'mask',
            },
            C: {
              label: 'Budget',
              width: 72,
              style: { backgroundColor: 'rgba(39, 174, 96, 0.15)' },
              policy: 'budget',
            },
            D: {
              label: 'Spent',
              width: 72,
              style: { backgroundColor: 'rgba(230, 126, 34, 0.15)' },
              policy: 'budget',
            },
            E: {
              label: 'Remaining',
              width: 72,
              style: { backgroundColor: 'rgba(52, 152, 219, 0.15)', fontWeight: 'bold' },
              prevention: operations.Write,
              policy: 'thousand_separator',
            },
            F: {
              label: 'Status',
              width: 118,
              policy: 'status',
            },
            G: {
              label: 'Done',
              width: 50,
              policy: 'checkbox',
              alignItems: 'center',
              justifyContent: 'center',
            },
            // Double border above the Total row
            'A6:G6': { style: { ...makeBorder({ bottom: `4px double ${structBorder}` }) } },
            '7': {
              style: { fontWeight: 'bold' },
              prevention: operations.Write,
            },
            C7: { style: { backgroundColor: '#27ae60', color: 'white' } },
            D7: { style: { backgroundColor: '#e67e22', color: 'white' } },
            E7: { style: { backgroundColor: '#3498db', color: 'white' } },
            G7: { style: { backgroundColor: '#9b59b6', color: 'white' } },
            '07': { sortFixed: true, filterFixed: true },
          },
        })}
        options={{
          sheetWidth: '100%',
          mode: inheritMode,
        }}
      />

      {/* Status options editor (plain React; feeds the Status policy via a ref) */}
      <div style={{ marginTop: 16, fontSize: 14, color: 'var(--sl-color-text)' }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Status options</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {statuses.map((s) => (
            <span
              key={s}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 4px 2px 10px',
                borderRadius: 999,
                background: 'var(--sl-color-gray-6)',
                border: '1px solid var(--sl-color-gray-5)',
              }}
            >
              {s}
              <button
                type="button"
                aria-label={`Remove ${s}`}
                onClick={() => setStatuses(statuses.filter((x) => x !== s))}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: '0 4px',
                  fontSize: 14,
                }}
              >
                ×
              </button>
            </span>
          ))}
          <form onSubmit={addStatus} style={{ display: 'inline-flex', gap: 4 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="New status…"
              style={{
                padding: '3px 8px',
                borderRadius: 4,
                border: '1px solid var(--sl-color-gray-5)',
                background: 'var(--sl-color-bg)',
                color: 'var(--sl-color-text)',
                width: 130,
              }}
            />
            <button
              type="submit"
              style={{
                padding: '3px 10px',
                borderRadius: 4,
                border: '1px solid var(--sl-color-gray-5)',
                background: 'var(--sl-color-gray-6)',
                color: 'var(--sl-color-text)',
                cursor: 'pointer',
              }}
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
