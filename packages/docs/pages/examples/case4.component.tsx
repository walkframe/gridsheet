'use client';

import * as React from 'react';
import CreatableSelect from 'react-select/creatable';
import {
  GridSheet,
  buildInitialCells,
  operations,
  useHub,
  Policy,
  PolicyMixinType,
  AutocompleteOption,
  ThousandSeparatorPolicyMixin,
  CheckboxPolicyMixin,
  makeBorder,
  FeedbackType,
  SelectProps,
} from '@gridsheet/react-core';

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

// Department selection policy
const DepartmentPolicy: PolicyMixinType = {
  getSelectOptions: (): AutocompleteOption[] => DEPARTMENT_OPTIONS,
  select: ({ next }: SelectProps) => {
    const value = next?.value;
    if (value == null) {
      return next;
    }
    const validOption = DEPARTMENT_OPTIONS.find((option) => option.value === value);
    if (!validOption) {
      return { ...next, value: 'Engineering' };
    }
    return next;
  },
};

// Budget validation policy
const BudgetPolicy: PolicyMixinType = {
  select: ({ next }: SelectProps) => {
    if (next?.value == null) {
      return next;
    }
    const value = Number(next.value);
    if (isNaN(value) || value < 0) {
      return { ...next, value: 0 };
    }
    if (value > 1000000) {
      return { ...next, value: 1000000 };
    }
    return next;
  },
};

interface StatusOption {
  value: string;
  label: string;
}

export default function BudgetManagement() {
  // Use state for tags management
  const [tags, setTags] = React.useState<StatusOption[]>([
    { value: 'Approved', label: '✅ Approved' },
    { value: 'Pending', label: '⏳ Pending' },
    { value: 'Under Review', label: '🔍 Under Review' },
  ]);

  const [isMobile, setIsMobile] = React.useState(false);
  const [eventLogs, setEventLogs] = React.useState<string[]>([]);

  const addEventLog = (message: string) => {
    setEventLogs((prev) => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Check screen width on mount and resize
  React.useEffect(() => {
    const checkScreenWidth = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 900);
      }
    };

    checkScreenWidth();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkScreenWidth);
      return () => window.removeEventListener('resize', checkScreenWidth);
    }
  }, []);

  // Convert tags to statusOptionsRef format for the policy
  const statusOptionsRef = React.useRef<[string, string][]>([]);

  React.useEffect(() => {
    statusOptionsRef.current = tags.map((tag) => [tag.value, tag.label]);
  }, [tags]);

  // Dynamic status policy using ref for real-time updates
  const StatusPolicy = React.useMemo(
    () => ({
      getSelectOptions: (): AutocompleteOption[] => {
        return statusOptionsRef.current.map(([value, label]) => ({ value, label }));
      },
      select: ({ next }: SelectProps) => {
        if (next?.value == null) {
          return next;
        }
        const options = statusOptionsRef.current.map(([value]) => value);
        const validOption = options.includes(next.value);
        if (!validOption) {
          return { ...next, value: 'Pending' };
        }
        return next;
      },
    }),
    [tags],
  );

  const hub = useHub({
    policies: {
      department: new Policy({ mixins: [DepartmentPolicy] }),
      status: new Policy({ mixins: [StatusPolicy] }),
      budget: new Policy({ mixins: [BudgetPolicy, ThousandSeparatorPolicyMixin] }),
      thousand_separator: new Policy({ mixins: [ThousandSeparatorPolicyMixin] }),
      checkbox: new Policy({ mixins: [CheckboxPolicyMixin] }),
    },
    // Event handlers for budget monitoring
    onSave: ({ table, points }) => {
      addEventLog(`Budget data saved at ${Array.isArray(points) ? points.length : 1} position(s)`);
    },
    onChange: ({ table, points }) => {
      addEventLog(`Budget data changed at ${Array.isArray(points) ? points.length : 1} position(s)`);
    },
    onSelect: ({ table, points }) => {
      addEventLog(`Selected ${Array.isArray(points) ? points.length : 1} cell(s)`);
    },
    onRemoveRows: ({ table, ys }) => {
      addEventLog(`Removed ${ys.length} row(s): ${ys.join(', ')}`);
    },
    onRemoveCols: ({ table, xs }) => {
      addEventLog(`Removed ${xs.length} column(s): ${xs.join(', ')}`);
    },
    onInsertRows: ({ table, y, numRows }) => {
      addEventLog(`Inserted ${numRows} row(s) at position ${y}`);
    },
    onInsertCols: ({ table, x, numCols }) => {
      addEventLog(`Inserted ${numCols} column(s) at position ${x}`);
    },
    onKeyUp: ({ e, points }) => {
      addEventLog(`Key pressed: ${e.key}`);
    },
    onInit: ({ table }) => {
      addEventLog(`Budget table initialized: ${table.sheetName}`);
    },
  });

  // Handle CreatableSelect change
  const handleSelectChange = (selectedOptions: StatusOption[] | null) => {
    if (selectedOptions) {
      setTags(selectedOptions);
    }
  };

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        margin: '0 auto',
        padding: '20px',
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
      }}
    >
      {/* Main Budget Grid */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        }}
      >
        <h3
          style={{
            color: '#2c3e50',
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📊 Budget Overview
        </h3>
        <GridSheet
          hub={hub}
          sheetName="budget"
          initialCells={buildInitialCells({
            matrices: {
              A1: [
                ['Engineering', 50000, 42000, '=B1-C1', 'Approved', true],
                ['Marketing', 75000, 68000, '=B2-C2', 'Approved', true],
                ['Sales', 120000, 95000, '=B3-C3', 'Under Review', false],
                ['HR', 30000, 28000, '=B4-C4', 'Pending', false],
                ['Finance', 45000, 52000, '=B5-C5', 'Rejected', false],
                ['', '', '', '', '', ''],
                ['Total Budget', '=SUM(B1:B5)', '=SUM(C1:C5)', '=SUM(D1:D5)', '', '=COUNTIF(F1:F5,true)'],
              ],
            },
            cells: {
              default: {
                width: 100,
                height: 40,
                style: {
                  ...makeBorder({ all: '1px solid #000000' }),
                },
              },
              A: {
                label: 'Department',
                width: 100,
                style: {
                  borderRight: 'double 3px #000000',
                },
                policy: 'department',
              },
              B: {
                label: 'Budget Request',
                width: 80,
                style: {
                  backgroundColor: '#e8f5e8',
                },
                policy: 'budget',
              },
              C: {
                label: 'Actual Spent',
                width: 80,
                style: {
                  backgroundColor: '#fff3cd',
                },
                policy: 'budget',
              },
              D: {
                label: 'Remaining',
                width: 80,
                style: {
                  backgroundColor: '#d1ecf1',
                  fontWeight: 'bold',
                },
                prevention: operations.Write,
                policy: 'thousand_separator',
              },
              E: {
                label: 'Status',
                width: 90,
                policy: 'status',
              },
              F: {
                label: 'Done',
                width: 50,
                policy: 'checkbox',
                style: {
                  backgroundColor: '#f8f9fa',
                },
                alignItems: 'center',
                justifyContent: 'center',
              },
              // Double border above Total row
              'A6:F6': {
                style: {
                  ...makeBorder({
                    bottom: '4px double #000000',
                  }),
                },
              },
              '7': {
                style: {
                  fontWeight: 'bold',
                  textAlign: 'center',
                },
                prevention: operations.Write,
              },
              B7: {
                style: {
                  backgroundColor: '#27ae60',
                  color: 'white',
                  fontWeight: 'bold',
                },
              },
              C7: {
                style: {
                  backgroundColor: '#e67e22',
                  color: 'white',
                  fontWeight: 'bold',
                },
              },
              D7: {
                style: {
                  backgroundColor: '#3498db',
                  color: 'white',
                  fontWeight: 'bold',
                },
              },
              F7: {
                style: {
                  backgroundColor: '#9b59b6',
                  color: 'white',
                  fontWeight: 'bold',
                },
                prevention: operations.Write,
              },
              // Conditional styling for status
              E1: {
                style: {
                  backgroundColor: '#d4edda',
                  color: '#155724',
                },
              },
              E2: {
                style: {
                  backgroundColor: '#d4edda',
                  color: '#155724',
                },
              },
              E3: {
                style: {
                  backgroundColor: '#fff3cd',
                  color: '#856404',
                },
              },
              E4: {
                style: {
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                },
              },
              E5: {
                style: {
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                },
              },
            },
          })}
          options={{
            sheetHeight: 500,
            sheetWidth: typeof window !== 'undefined' ? Math.min(700, window.innerWidth - 60) : 700,
          }}
        />

        {/* Dynamic Status Options Display */}
        <div style={{ marginTop: '20px' }}>
          <h4
            style={{
              color: '#2c3e50',
              margin: '0 0 10px 0',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            ⚙️ Available Status Options
          </h4>
          <div
            style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
            }}
          >
            <CreatableSelect
              options={tags}
              value={tags}
              onChange={handleSelectChange}
              isMulti
              isClearable
              placeholder="Add new status option..."
              onCreateOption={(inputValue: string) => {
                const newOption = { value: inputValue, label: `🆕 ${inputValue}` };
                setTags((prevTags) => [...prevTags, newOption]);
              }}
            />
            <p
              style={{
                color: '#6c757d',
                margin: '10px 0 0 0',
                fontSize: '14px',
                fontStyle: 'italic',
              }}
            >
              These status options are dynamically managed and used in the Status column above.
            </p>
          </div>
        </div>
      </div>

      {/* Global CSS for react-select */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .react-select__control {
            border: 1px solid #d1d5db !important;
            border-radius: 6px !important;
            min-height: 40px !important;
            box-shadow: none !important;
          }

          .react-select__control:hover {
            border-color: #9ca3af !important;
          }

          .react-select__control--is-focused {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 1px #3b82f6 !important;
          }

          .react-select__multi-value {
            background-color: #3b82f6 !important;
            border-radius: 16px !important;
            margin: 2px !important;
          }

          .react-select__multi-value__label {
            color: white !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            padding: 4px 8px !important;
          }

          .react-select__multi-value__remove {
            color: white !important;
            background: none !important;
            border: none !important;
            padding: 4px 8px !important;
            cursor: pointer !important;
          }

          .react-select__multi-value__remove:hover {
            color: #fecaca !important;
          }

          .react-select__placeholder {
            color: #6b7280 !important;
          }

          .react-select__input-container {
            color: #374151 !important;
          }
        `,
        }}
      />
    </div>
  );
}
