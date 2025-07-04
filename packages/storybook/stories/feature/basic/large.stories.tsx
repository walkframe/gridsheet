import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { buildInitialCells, GridSheet, useHub } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Basic/Large',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases GridSheet performance with large datasets.',
  'It demonstrates a 2000x100 grid with various data types and calculations to test scalability and rendering performance.',
].join('\n\n');

// Generate large dataset
const generateLargeData = () => {
  const data: any[][] = [];

  // Header row
  const headers = ['ID', 'Name', 'Date', 'Status', 'Category', 'Score', 'Notes'];
  data.push(headers);

  // Generate 2000 rows of data
  for (let i = 1; i <= 2000; i++) {
    const row = [
      i, // ID
      `Item ${i}`, // Name
      new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1), // Date
      ['Active', 'Inactive', 'Pending'][Math.floor(Math.random() * 3)], // Status
      ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)], // Category
      Math.floor(Math.random() * 100), // Score
      `Note for item ${i}`, // Notes
    ];
    data.push(row);
  }

  return data;
};

const LargeSheet = () => {
  const hub = useHub({
    labelers: {
      raw: (n) => String(n),
    },
  });

  const largeData = generateLargeData();

  return (
    <>
      <div style={{ marginBottom: '10px' }}>
        <h3>Large Dataset Performance Test</h3>
        <p>Grid size: 2000 rows × 100 columns (200,000 cells)</p>
        <p>This demonstrates GridSheet's ability to handle large datasets efficiently.</p>
      </div>

      <GridSheet
        hub={hub}
        initialCells={buildInitialCells({
          matrices: {
            A1: largeData,
          },
          cells: {
            default: {
              width: 120,
              height: 30,
              labeler: 'raw',
            },
            'A1:G1': {
              style: {
                backgroundColor: '#2c3e50',
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
              },
              height: 40,
            },
            A: { width: 60 }, // ID column
            B: { width: 150 }, // Name column
            C: {
              width: 100,
              style: { backgroundColor: '#f8f9fa' },
            }, // Date column
            D: {
              width: 80,
              style: { backgroundColor: '#e8f5e8' },
            }, // Status column
            E: {
              width: 60,
              style: { backgroundColor: '#fff3cd' },
            }, // Category column
            F: {
              width: 60,
              style: { backgroundColor: '#f8d7da' },
            }, // Score column
            G: {
              width: 200,
              style: { backgroundColor: '#f8f9fa' },
            }, // Notes column
          },
          ensured: { numRows: 2000, numCols: 100 },
        })}
        options={{
          sheetHeight: 400,
          sheetWidth: 1000,
          sheetResize: 'both',
        }}
      />
    </>
  );
};

export const Sheet: StoryObj = {
  render: () => <LargeSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
