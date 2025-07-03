import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { buildInitialCells, GridSheet, useHub } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Basic/Large',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases GridSheet performance with large datasets.',
  'It demonstrates a 2000x100 grid with various data types and calculations to test scalability and rendering performance.',
].join('\n\n');

const HOW_IT_WORKS = [
  'This large grid is useful for testing performance characteristics and memory management.',
  '1. The grid contains 200,000 cells (2000 rows x 100 columns).',
  '2. Various data types including numbers, text, dates, and formulas.',
  '3. Performance optimizations like virtualization ensure smooth scrolling.',
  '4. Memory efficient rendering for large datasets.',
  '',
  '## Implementation Guide',
  '',
  '### Basic Setup',
  'To create a large dataset grid, start by importing the necessary components and setting up a hub with appropriate labelers. The hub configuration allows you to customize how data is displayed and processed.',
  '',
  '### Performance Optimization Options',
  'Configure the GridSheet with performance-focused options including sheet dimensions, header sizes, and resize capabilities. These settings help manage memory usage and ensure smooth scrolling performance with large datasets.',
  '',
  '### Data Generation Strategy',
  'Implement efficient data generation by creating structured arrays with headers and systematically generating rows. Use appropriate data types and consider memory usage when creating large datasets. The generation process should be optimized for speed and memory efficiency.',
  '',
  '### Column-Specific Styling',
  'Apply different styling to columns based on their data type and purpose. Use width settings, background colors, and other CSS properties to create visual distinction between different types of data. This helps users quickly identify and understand the data structure.',
  '',
  '### Performance Best Practices',
  '1. **Virtual Scrolling**: Enabled by default for large datasets',
  "2. **Efficient Labelers**: Use simple labelers like 'raw' for better performance",
  '3. **Column Widths**: Set appropriate widths to avoid layout calculations',
  '4. **Memory Management**: Limit visible area with sheetHeight/sheetWidth',
  '5. **Data Types**: Use appropriate data types (numbers vs strings)',
  '6. **Styling**: Apply styles efficiently using column/row ranges',
  '',
  '### Monitoring Performance',
  'Implement performance monitoring to track data generation and rendering times. Use browser performance APIs to measure execution time and identify bottlenecks in large dataset operations.',
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

export const Sheet: StoryObj = {
  render: () => {
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
            headerHeight: 50,
            headerWidth: 100,
            sheetResize: 'both',
          }}
        />

        {/* How it works - Markdown */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
            📖 How it works
          </h3>
          <div
            style={{
              lineHeight: '1.6',
              color: '#374151',
            }}
          >
            <ReactMarkdown>{HOW_IT_WORKS}</ReactMarkdown>
          </div>
        </div>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
