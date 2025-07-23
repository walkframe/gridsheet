'use client';

import * as React from 'react';
import { GridSheet, buildInitialCellsFromOrigin, useHub, makeBorder } from '@gridsheet/react-core';

export default function LargeDatasetDemo() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [progress, setProgress] = React.useState(0);

  const hub = useHub({
    labelers: {
      value: (n: number) => 'Value',
      label: (n: number) => 'Label',
    },
  });

  // Generate large dataset efficiently
  const generateLargeDataset = React.useCallback(() => {
    const rows = 10000;
    const cols = 100;
    const cells: { [address: string]: any } = {};

    // Helper function to convert column number to letter(s)
    const getColumnLetter = (colNum: number): string => {
      let result = '';
      while (colNum > 0) {
        colNum--;
        result = String.fromCharCode(65 + (colNum % 26)) + result;
        colNum = Math.floor(colNum / 26);
      }
      return result;
    };

    // Generate header row
    for (let col = 1; col <= cols; col++) {
      const colLetter = getColumnLetter(col);
      cells[`${colLetter}1`] = {
        value: `Column ${col}`,
        style: {
          backgroundColor: '#1e40af',
          color: 'white',
          fontWeight: 'bold',
          textAlign: 'center',
          fontSize: '12px',
          ...makeBorder({ all: '1px solid #d1d5db' }),
        },
      };
    }

    // Generate data rows efficiently
    const batchSize = 1000;
    const totalBatches = Math.ceil(rows / batchSize);

    const generateBatch = (batchIndex: number) => {
      const startRow = batchIndex * batchSize + 2;
      const endRow = Math.min(startRow + batchSize - 1, rows + 1);

      for (let row = startRow; row <= endRow; row++) {
        for (let col = 1; col <= cols; col++) {
          const colLetter = getColumnLetter(col);
          const address = `${colLetter}${row}`;

          // Generate different types of data based on column
          let value: string | number;
          let style: any = {
            fontSize: '11px',
            padding: '2px',
            ...makeBorder({ all: '1px solid #e5e7eb' }),
          };

          if (col === 1) {
            // ID column
            value = row - 1;
            style = {
              ...style,
              backgroundColor: '#f8fafc',
              fontWeight: 'bold',
              textAlign: 'center',
            };
          } else if (col === 2) {
            // Name column
            const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
            value = `${names[(row - 2) % names.length]} ${Math.floor((row - 2) / names.length) + 1}`;
            style = {
              ...style,
              backgroundColor: '#f0f9ff',
              fontWeight: '500',
            };
          } else if (col === 3) {
            // Department column
            const departments = [
              'Engineering',
              'Marketing',
              'Sales',
              'HR',
              'Finance',
              'Operations',
              'Product',
              'Support',
            ];
            value = departments[(row - 2) % departments.length];
            style = {
              ...style,
              backgroundColor: '#fef3c7',
              textAlign: 'center',
              fontSize: '10px',
            };
          } else if (col === 4) {
            // Salary column
            value = Math.floor(Math.random() * 50000) + 30000;
            style = {
              ...style,
              backgroundColor: '#dbeafe',
              textAlign: 'right',
              fontWeight: '500',
            };
          } else if (col === 5) {
            // Status column
            const statuses = ['Active', 'Inactive', 'Pending', 'Terminated'];
            value = statuses[(row - 2) % statuses.length];
            style = {
              ...style,
              backgroundColor: '#f3f4f6',
              textAlign: 'center',
              fontSize: '10px',
            };
          } else if (col <= 10) {
            // Additional data columns
            value = Math.floor(Math.random() * 1000);
            style = {
              ...style,
              backgroundColor: '#f9fafb',
              textAlign: 'right',
            };
          } else {
            // Generic data for remaining columns
            value = Math.floor(Math.random() * 100);
            style = {
              ...style,
              backgroundColor: '#ffffff',
              textAlign: 'center',
            };
          }

          cells[address] = {
            value,
            style,
          };
        }
      }

      // Update progress
      const newProgress = Math.round(((batchIndex + 1) / totalBatches) * 100);
      setProgress(newProgress);

      // Schedule next batch
      if (batchIndex + 1 < totalBatches) {
        setTimeout(() => generateBatch(batchIndex + 1), 0);
      } else {
        setIsLoading(false);
      }
    };

    // Start batch generation
    generateBatch(0);
    return cells;
  }, []);

  const [initialCells, setInitialCells] = React.useState<{ [address: string]: any }>({});

  React.useEffect(() => {
    const cells = generateLargeDataset();
    setInitialCells(cells);
  }, [generateLargeDataset]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#374151' }}>
          Generating Large Dataset...
        </div>
        <div
          style={{
            width: '300px',
            height: '20px',
            backgroundColor: '#e5e7eb',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              transition: 'width 0.3s ease',
              borderRadius: '10px',
            }}
          />
        </div>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>{progress}% Complete</div>
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
          Creating 10,000 rows × 100 columns
          <br />
          Total: 1,000,000 cells
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <GridSheet
        hub={hub}
        sheetName="large-dataset"
        initialCells={initialCells}
        options={{
          sheetHeight: 600,
          sheetWidth: typeof window !== 'undefined' ? Math.min(1200, window.innerWidth - 60) : 1200,
          sheetResize: 'both',
          showAddress: true,
        }}
      />
    </div>
  );
}
