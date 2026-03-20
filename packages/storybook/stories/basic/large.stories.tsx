import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { buildInitialCells, GridSheet, useBook, Policy } from '@gridsheet/react-core';
import { allFunctions } from '@gridsheet/functions';

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
  const rawPolicy = new Policy({
    mixins: [{ renderColHeaderLabel: (n) => String(n), renderRowHeaderLabel: (n) => String(n) }],
  });
  const book = useBook({
    additionalFunctions: allFunctions,
    policies: { raw: rawPolicy },
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
        book={book}
        initialCells={buildInitialCells({
          matrices: {
            A1: largeData,
          },
          cells: {
            default: {
              width: 120,
              height: 24,
              policy: 'raw',
            },
            A: { width: 60, label: 'ID' },
            B: { width: 150, label: 'Name' },
            C: {
              width: 100,
              label: 'Date',
              style: { backgroundColor: '#f8f9fa' },
            },
            D: {
              width: 80,
              label: 'Status',
              style: { backgroundColor: '#e8f5e8' },
            },
            E: {
              width: 60,
              label: 'Category',
              style: { backgroundColor: '#fff3cd' },
            },
            F: {
              width: 60,
              label: 'Score',
              style: { backgroundColor: '#f8d7da' },
            },
            G: {
              width: 200,
              label: 'Notes',
              style: { backgroundColor: '#f8f9fa' },
            },
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
