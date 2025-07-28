'use client';

import * as React from 'react';
import {
  GridSheet,
  buildInitialCells,
  useHub,
  Renderer,
  RendererMixinType,
  RenderProps,
  makeBorder,
  operations,
  type UserTable,
} from '@gridsheet/react-core';

// Stock level renderer
const StockRendererMixin: RendererMixinType = {
  number({ value }: RenderProps<number>) {
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
        <span style={{ fontSize: '9px', color: '#666' }}>({status})</span>
      </div>
    );
  },
};

// Category renderer
const CategoryRendererMixin: RendererMixinType = {
  string({ value }: RenderProps<string>) {
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

// Delete button renderer
const DeleteButtonRendererMixin: RendererMixinType = {
  null({ value, point, sync, table }: RenderProps<string>) {
    // Only show delete button for product rows
    const shouldShowButton = point.y >= 2;

    // Get product name for tooltip
    let productName = 'Unknown';
    try {
      const fieldRows = table.getFieldRows();
      //console.log('Field rows:', fieldRows, 'Row:', point.y);
      //console.log('Row data at', point.y, ':', fieldRows[point.y]);
      //console.log('All field rows:', JSON.stringify(fieldRows, null, 2));
      // Try to get product name from the field rows
      const rowData = fieldRows[point.y];
      if (rowData && rowData[1]) {
        productName = String(rowData[1]);
        console.log('Found product name:', productName);
      } else {
        // at row', point.y, 'column 1');
      }
    } catch (error) {
      console.error('Error getting product name:', error);
      // Fallback to unknown
    }

    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {shouldShowButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Trigger row deletion with product name
              if (sync) {
                // Create a custom event to pass product name
                const deleteEvent = new CustomEvent('productDelete', {
                  detail: { row: point.y, productName: productName },
                });
                document.dispatchEvent(deleteEvent);
                sync(table.removeRows({ y: point.y, numRows: 1 }));
              }
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
            title={`Delete ${productName} (row ${point.y})`}
          >
            ×
          </button>
        )}
      </div>
    );
  },
};

// TSV conversion utility function
const convertToTSV = (table: UserTable, evaluates: boolean = true): string => {
  if (!table) {
    return '';
  }
  const matrix = table.getFieldMatrix({ refEvaluation: evaluates ? 'COMPLETE' : 'RAW' });
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

export default function InventoryManagement() {
  const [activityLogs, setActivityLogs] = React.useState<string[]>([]);
  const [pendingDeleteInfo, setPendingDeleteInfo] = React.useState<{ row: number; productName: string } | null>(null);
  const [tsv, setTsv] = React.useState<string>('');
  // Remove tableForTsv state and related useEffect

  const addActivityLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  // Listen for product delete events
  React.useEffect(() => {
    const handleProductDelete = (event: CustomEvent) => {
      setPendingDeleteInfo(event.detail);
    };

    document.addEventListener('productDelete', handleProductDelete as EventListener);
    return () => {
      document.removeEventListener('productDelete', handleProductDelete as EventListener);
    };
  }, []);

  const hub = useHub({
    renderers: {
      stock: new Renderer({ mixins: [StockRendererMixin] }),
      category: new Renderer({ mixins: [CategoryRendererMixin] }),
      delete: new Renderer({ mixins: [DeleteButtonRendererMixin] }),
    },
    onSave: ({ table, points }) => {
      const posInfo = Array.isArray(points)
        ? points.map((p) => `(${p.pointing.y},${p.pointing.x})`).join(', ')
        : `(${points.pointing.y},${points.pointing.x})`;
      addActivityLog(`💾 Inventory data saved at ${Array.isArray(points) ? points.length : 1} position(s): ${posInfo}`);
    },
    onEdit: ({ table }: { table: UserTable }) => {
      const { top, left, bottom, right } = table;
      addActivityLog(`✏️ Inventory edited. (onEdit) Range: [${top},${left}] - [${bottom},${right}]`);
    },
    onRemoveRows: ({ table, ys }: { table: UserTable; ys: number[] }) => {
      ys.forEach((y, i) => {
        if (pendingDeleteInfo && pendingDeleteInfo.row === i) {
          const productName = pendingDeleteInfo.productName;
          setPendingDeleteInfo(null);
          addActivityLog(`🗑️ Removed product: row ${y} (${productName})`);
        } else {
          const fieldRows = table.getFieldRows();
          const productName = fieldRows[i]?.['B'] ?? 'Unknown';
          addActivityLog(`🗑️ Removed product: row ${y} (${productName})`);
        }
      });
    },
    onRemoveCols: ({ table, xs }: { table: UserTable; xs: number[] }) => {
      const colInfo = xs.map((x) => `col ${String.fromCharCode(65 + x)}`).join(', ');
      addActivityLog(`🗑️ Removed ${xs.length} column(s) from inventory: ${colInfo}`);
    },
    onInsertRows: ({ table, y, numRows }: { table: UserTable; y: number; numRows: number }) => {
      addActivityLog(`➕ Added ${numRows} new product(s) to inventory at row ${y}`);
    },
    onInsertCols: ({ table, x, numCols }: { table: UserTable; x: number; numCols: number }) => {
      const colName = String.fromCharCode(65 + x);
      addActivityLog(`➕ Added ${numCols} new column(s) to inventory at column ${colName}`);
    },
    onInit: ({ table }) => {
      addActivityLog(`📦 Inventory management system initialized`);
    },
    onChange: ({ table }) => {
      setTsv(convertToTSV(table));
    },
  });

  const initialCells = buildInitialCells({
    matrices: {
      A1: [
        [null, 'Product Name', 'Stock Level', 'Unit Price'],
        [null, 'Laptop Pro X1', 15, 1299.99],
        [null, 'Wireless Mouse', 45, 29.99],
        [null, 'Cotton T-Shirt', 8, 19.99],
        [null, 'Programming Book', 22, 49.99],
        [null, 'Coffee Maker', 5, 89.99],
        [null, 'Yoga Mat', 35, 39.99],
        [null, 'Bluetooth Headphones', 12, 79.99],
        [null, 'USB Cable', 67, 9.99],
        [null, 'Notebook', 23, 15.99],
        [null, 'Desk Lamp', 7, 45.99],
        [null, 'Water Bottle', 89, 12.99],
        [null, 'Phone Case', 34, 24.99],
        [null, 'Power Bank', 18, 59.99],
        [null, 'Keyboard', 9, 89.99],
        [null, 'Mouse Pad', 56, 8.99],
        [null, 'Monitor Stand', 3, 129.99],
        [null, 'Cable Organizer', 41, 6.99],
        [null, 'Desk Mat', 28, 19.99],
        [null, 'Webcam', 14, 69.99],
        [null, 'Microphone', 6, 149.99],
        [null, 'Gaming Mouse', 11, 79.99],
      ],
    },
    cells: {
      default: {
        width: 120,
        height: 32,
        style: {
          ...makeBorder({ all: '1px solid #e0e0e0' }),
          fontSize: '11px',
        },
      },
      A: { width: 40, renderer: 'delete' },
      B: { width: 140 },
      C: { width: 100, renderer: 'stock' },
      D: { width: 90 },
      '1': {
        style: {
          backgroundColor: '#f8f9fa',
          fontWeight: 'bold',
          textAlign: 'center',
        },
        prevention: operations.Write,
      },
      A1: {
        style: {
          backgroundColor: '#f8f9fa',
          fontWeight: 'bold',
          textAlign: 'center',
        },
        prevention: operations.Write,
      },
    },
  });

  return (
    <div
      style={{
        height: 500,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        margin: '0 auto',
        padding: '20px',
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
      }}
    >
      {/* Inventory Management Dashboard */}
      <div style={{ display: 'flex', gap: '20px', padding: 10 }}>
        <GridSheet
          hub={hub}
          sheetName="inventory-management"
          initialCells={initialCells}
          style={{ border: '1px solid #ccc' }}
          options={{
            sheetHeight: 250,
          }}
        />

        {/* Activity Logs */}
        <div style={{ flex: 1, maxWidth: '300px', maxHeight: 250, overflow: 'auto' }}>
          <div
            ref={(el) => {
              if (el && activityLogs.length > 0) {
                el.scrollTop = 0;
              }
            }}
            style={{
              overflowY: 'auto',
              border: '1px solid var(--nextra-border-color, #ccc)',
              padding: '10px',
              backgroundColor: 'var(--nextra-bg-color, #f8f9fa)',
              fontFamily: 'monospace',
              fontSize: '10px',
              lineHeight: '1.4',
            }}
          >
            {activityLogs.length === 0 ? (
              <div style={{ color: 'var(--nextra-text-color, #333)', fontStyle: 'italic' }}>
                No activity logged yet. Try adding/removing products or editing inventory data.
              </div>
            ) : (
              activityLogs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '5px',
                    wordBreak: 'break-all',
                    color: 'var(--nextra-text-color, #333)',
                    borderBottom: 'solid 1px #aaa',
                  }}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* TSV Dump */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>TSV Dump:</div>
        <textarea style={{ width: '100%', height: 120, fontFamily: 'monospace', fontSize: 12 }} value={tsv} readOnly />
      </div>
    </div>
  );
}
