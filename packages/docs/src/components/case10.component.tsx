'use client';

import * as React from 'react';
import {
  GridSheet,
  buildInitialCells,
  Policy,
  makeBorder,
  toValueMatrix,
  operations,
  x2c,
} from '@gridsheet/react-core';
import type { PolicyMixinType, RenderProps, UserSheet } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';
import { useStarlightMode } from './useStarlightMode';

// Currency formatting policy mixin
const CurrencyPolicyMixin: PolicyMixinType = {
  renderNumber({ value }: RenderProps<number>) {
    return (
      <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
        ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    );
  },
};

// Stock level policy mixin
const StockPolicyMixin: PolicyMixinType = {
  renderNumber({ value }: RenderProps<number>) {
    const color = value <= 10 ? '#e74c3c' : value <= 50 ? '#f39c12' : '#27ae60';
    const status = value <= 10 ? 'LOW' : value <= 50 ? 'MEDIUM' : 'GOOD';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
        <span style={{ fontWeight: 'bold', color }}>{value}</span>
        <span style={{ fontSize: '9px', color: 'var(--gs-muted-fg)' }}>({status})</span>
      </div>
    );
  },
};

// Category policy mixin
const CategoryPolicyMixin: PolicyMixinType = {
  renderString({ value }: RenderProps<string>) {
    const colors = {
      Electronics: '#3498db',
      Clothing: '#e67e22',
      Books: '#9b59b6',
      Home: '#1abc9c',
      Sports: '#e74c3c',
    };
    const color = colors[value as keyof typeof colors] || '#95a5a6';

    return (
      <span
        style={{
          backgroundColor: color,
          color: 'white',
          padding: '1px 6px',
          borderRadius: '8px',
          fontSize: '9px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        }}
      >
        {value}
      </span>
    );
  },
};

// A row is a "product row" unless it is one of the summary rows, which are
// marked `sortFixed` on their row header (A0-column cell, e.g. '022'). Deriving
// it from the sheet keeps working after rows are inserted or removed.
const isProductRow = (sheet: UserSheet, y: number) => y >= 1 && !sheet.getCell({ y, x: 0 })?.sortFixed;

type DeleteHandler = (args: {
  sheet: UserSheet;
  y: number;
  productName: string;
  apply: (s: UserSheet) => void;
}) => void;

// Delete button policy mixin: renderNull draws a button into the empty column-A
// cells and hands the click straight to a callback supplied by the component.
const makeDeleteButtonMixin = (onDelete: DeleteHandler): PolicyMixinType => ({
  renderNull({ point, apply, sheet }: RenderProps<null | undefined>) {
    if (!apply || !isProductRow(sheet, point.y)) {
      return null;
    }
    const productName = String(sheet.getCell({ y: point.y, x: 2 })?.value ?? '');
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete({ sheet, y: point.y, productName, apply });
          }}
          style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            width: '20px',
            height: '20px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
          title={`Delete ${productName || 'row'} (row ${point.y})`}
        >
          ×
        </button>
      </div>
    );
  },
});

// TSV conversion utility function
const convertToTSV = (sheet: UserSheet, evaluates: boolean = true): string => {
  if (!sheet) {
    return '';
  }
  const matrix = toValueMatrix(sheet, { resolution: evaluates ? 'RESOLVED' : 'RAW' });
  if (!matrix || matrix.length === 0) {
    return '';
  }
  return matrix
    .map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) {
            return '';
          }
          const cellStr = String(cell);
          if (cellStr.includes('\t') || cellStr.includes('\n')) {
            return cellStr.replace(/\t/g, ' ').replace(/\n/g, ' ');
          }
          return cellStr;
        })
        .join('\t'),
    )
    .join('\n');
};

const headerStyle = {
  backgroundColor: '#2c3e50',
  color: '#ffffff',
  fontWeight: 'bold' as const,
  fontSize: '11px',
};

export default function InventoryManagement() {
  const inheritMode = useStarlightMode();
  // Chrome outside the grid uses Starlight's --sl-* vars so it follows the
  // theme. The summary-row style goes through buildInitialCells, which bakes
  // styles once at the initial (light) render — so its tint/border must be
  // theme-INDEPENDENT semi-transparent rgba that reads over both.
  const summaryStyle = {
    backgroundColor: 'rgba(127, 127, 127, 0.12)',
    fontWeight: 'bold' as const,
    fontSize: '11px',
    ...makeBorder({ top: '3px double rgba(127, 127, 127, 0.55)' }),
  };
  const [activityLogs, setActivityLogs] = React.useState<string[]>([]);
  const [tsv, setTsv] = React.useState<string>('');

  const addActivityLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  // Called directly by the delete button: log the product name (still readable
  // before removal), then commit the removal. onRemoveRows fires right after.
  const handleDelete: DeleteHandler = ({ sheet, y, productName, apply }) => {
    addActivityLog(`🗑️ Delete button: "${productName}" (row ${y})`);
    apply(sheet.removeRows({ y, numRows: 1 }));
  };

  const book = useSpellbook({
    policies: {
      stock: new Policy({ mixins: [StockPolicyMixin] }),
      category: new Policy({ mixins: [CategoryPolicyMixin] }),
      delete: new Policy({ mixins: [makeDeleteButtonMixin(handleDelete)] }),
      currency: new Policy({ mixins: [CurrencyPolicyMixin] }),
    },
    onChange: ({ sheet }: { sheet: UserSheet }) => {
      const addresses = sheet.getLastChangedAddresses();
      if (addresses.length > 0) {
        addActivityLog(`✏️ Cells changed: ${addresses.join(', ')} (onChange)`);
      }
      setTsv(convertToTSV(sheet));
    },
    onRemoveRows: ({ ys }: { sheet: UserSheet; ys: number[] }) => {
      addActivityLog(`🗑️ Removed row(s) ${ys.join(', ')} (onRemoveRows)`);
    },
    onInsertRows: ({ y, numRows }: { sheet: UserSheet; y: number; numRows: number }) => {
      addActivityLog(`➕ Inserted ${numRows} row(s) at row ${y} (onInsertRows)`);
    },
    onRemoveCols: ({ xs }: { sheet: UserSheet; xs: number[] }) => {
      addActivityLog(`🗑️ Removed column(s) ${xs.map(x2c).join(', ')} (onRemoveCols)`);
    },
    onInsertCols: ({ x, numCols }: { sheet: UserSheet; x: number; numCols: number }) => {
      addActivityLog(`➕ Inserted ${numCols} column(s) at ${x2c(x)} (onInsertCols)`);
    },
    onInit: ({ sheet }: { sheet: UserSheet }) => {
      addActivityLog('📦 Sheet initialized (onInit)');
      setTsv(convertToTSV(sheet));
    },
  });

  const initialCells = buildInitialCells({
    matrices: {
      A1: [
        [null, 'Laptop Pro X1', 'Electronics', 15, 1299.99, '=D1*E1'],
        [null, 'Wireless Mouse', 'Electronics', 45, 29.99, '=D2*E2'],
        [null, 'Cotton T-Shirt', 'Clothing', 8, 19.99, '=D3*E3'],
        [null, 'Programming Book', 'Books', 22, 49.99, '=D4*E4'],
        [null, 'Coffee Maker', 'Home', 5, 89.99, '=D5*E5'],
        [null, 'Yoga Mat', 'Sports', 35, 39.99, '=D6*E6'],
        [null, 'Bluetooth Headphones', 'Electronics', 12, 79.99, '=D7*E7'],
        [null, 'USB Cable', 'Electronics', 67, 9.99, '=D8*E8'],
        [null, 'Notebook', 'Books', 23, 15.99, '=D9*E9'],
        [null, 'Desk Lamp', 'Home', 7, 45.99, '=D10*E10'],
        [null, 'Water Bottle', 'Sports', 89, 12.99, '=D11*E11'],
        [null, 'Phone Case', 'Electronics', 34, 24.99, '=D12*E12'],
        [null, 'Power Bank', 'Electronics', 18, 59.99, '=D13*E13'],
        [null, 'Keyboard', 'Electronics', 9, 89.99, '=D14*E14'],
        [null, 'Mouse Pad', 'Home', 56, 8.99, '=D15*E15'],
        [null, 'Monitor Stand', 'Home', 3, 129.99, '=D16*E16'],
        [null, 'Cable Organizer', 'Home', 41, 6.99, '=D17*E17'],
        [null, 'Desk Mat', 'Home', 28, 19.99, '=D18*E18'],
        [null, 'Webcam', 'Electronics', 14, 69.99, '=D19*E19'],
        [null, 'Microphone', 'Electronics', 6, 149.99, '=D20*E20'],
        [null, 'Gaming Mouse', 'Electronics', 11, 79.99, '=D21*E21'],
      ],
      B22: [['TOTAL', '', '=SUM(D1:D21)', '', '=SUM(F1:F21)']],
      B23: [['Items', '', '=COUNTA(B1:B21)']],
      B24: [['Low Stock', '', '=COUNTIF(D1:D21,"<=10")']],
    },
    cells: {
      default: {
        style: {
          fontSize: '11px',
        },
      },
      // Row height / column width can't go on `default`; use defaultRow / defaultCol.
      defaultRow: { height: 32 },
      // Header row styling
      A0: { width: 40, style: headerStyle },
      B0: { width: 150, label: 'Product Name', style: headerStyle },
      C0: { width: 100, label: 'Category', style: headerStyle },
      D0: { width: 100, label: 'Stock', style: headerStyle },
      E0: { width: 100, label: 'Unit Price', style: headerStyle },
      F0: { width: 120, label: 'Total Value', style: headerStyle },
      // Column policies
      A: { policy: 'delete' },
      C: { policy: 'category' },
      D: { policy: 'stock' },
      E: { policy: 'currency' },
      F: { policy: 'currency', prevention: operations.Write },
      // Summary rows (fixed during sort/filter)
      '022': { sortFixed: true, filterFixed: true },
      '023': { sortFixed: true, filterFixed: true },
      '024': { sortFixed: true, filterFixed: true },
      B22: { style: { ...summaryStyle, fontWeight: 'bold' } },
      C22: { style: summaryStyle },
      D22: { style: summaryStyle, policy: 'stock' },
      E22: { style: summaryStyle },
      F22: { style: summaryStyle, policy: 'currency', prevention: operations.Write },
      B23: { style: summaryStyle },
      C23: { style: summaryStyle },
      D23: { style: summaryStyle, prevention: operations.Write },
      E23: { style: summaryStyle },
      F23: { style: summaryStyle },
      B24: { style: summaryStyle },
      C24: { style: summaryStyle },
      D24: { style: summaryStyle, prevention: operations.Write },
      E24: { style: summaryStyle },
      F24: { style: summaryStyle },
    },
  });

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
      {/* Inventory Management Dashboard */}
      <div style={{ padding: 10 }}>
        <GridSheet
          book={book}
          sheetName="inventory-management"
          initialCells={initialCells}
          options={{
            matrixAlignment: 'both',
            sheetWidth: '100%',
            sheetHeight: 350,
            showFormulaBar: true,
            mode: inheritMode,
          }}
        />
      </div>

      {/* Activity Log */}
      <div style={{ padding: '0 10px', marginTop: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--sl-color-gray-2)', marginBottom: 4 }}>Activity Log:</div>
        <div
          style={{
            maxHeight: 150,
            overflowY: 'auto',
            border: '1px solid var(--sl-color-hairline)',
            borderRadius: 4,
            padding: '10px',
            backgroundColor: 'var(--sl-color-bg-nav)',
            color: 'var(--sl-color-white)',
            fontFamily: 'monospace',
            fontSize: '10px',
            lineHeight: '1.4',
          }}
        >
          {activityLogs.length === 0 ? (
            <div style={{ color: 'var(--sl-color-gray-3)', fontStyle: 'italic' }}>
              No activity logged yet. Try editing a cell, deleting a product, or inserting rows via the context menu.
            </div>
          ) : (
            activityLogs.map((log, index) => (
              <div
                key={index}
                className="case10-log-entry"
                style={{
                  marginBottom: '5px',
                  paddingBottom: '3px',
                  wordBreak: 'break-all',
                  borderBottom: '1px solid var(--sl-color-hairline)',
                }}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
      {/* TSV Dump */}
      <div style={{ padding: '0 10px', marginTop: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--sl-color-gray-2)', marginBottom: 4 }}>
          TSV Export (toValueMatrix):
        </div>
        <textarea
          style={{
            width: '100%',
            height: 120,
            fontFamily: 'monospace',
            fontSize: 12,
            color: 'var(--sl-color-white)',
            backgroundColor: 'var(--sl-color-bg-nav)',
            border: '1px solid var(--sl-color-hairline)',
            borderRadius: 4,
          }}
          value={tsv}
          readOnly
        />
      </div>
    </div>
  );
}
