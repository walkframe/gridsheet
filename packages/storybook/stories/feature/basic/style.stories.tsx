import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Basic/Style',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases comprehensive styling capabilities in GridSheet.',
  'It demonstrates various CSS properties including fonts, colors, backgrounds, borders, spacing, and layout options.',
].join('\n\n');

const HOW_IT_WORKS = [
  'The grid shows how different styling can be applied to individual cells, ranges, rows, and columns to create visually appealing and functional spreadsheets.',
  '1. Individual cells can have custom styles applied directly.',
  '2. Ranges of cells can be styled together for consistent appearance.',
  '3. Rows and columns can have uniform styling applied.',
  '4. CSS properties like fonts, colors, borders, and spacing are fully supported.',
  '',
  '## Implementation Guide',
  '',
  '### Basic Styling Setup',
  'To implement styling in GridSheet, import the necessary components and configure the initialCells with your styling requirements. The cells configuration object allows you to define styles for different elements of the grid.',
  '',
  '### Default Cell Styling',
  'Set default styles that apply to all cells unless overridden. This includes typography settings, background colors, and text colors. Default styles provide a consistent base appearance for the entire grid.',
  '',
  '### Column-Specific Styling',
  'Apply unique styles to entire columns using column identifiers. This includes typography settings, background colors, font families, and spacing properties. Column-specific styling helps create visual hierarchy and improve data readability.',
  '',
  '### Row-Specific Styling',
  'Apply styles to entire rows using row numbers. This includes text colors, heights, and alignment properties. Row-specific styling is useful for creating alternating row colors or highlighting specific data rows.',
  '',
  '### Range-Based Styling',
  'Apply styles to cell ranges using range notation. This includes both cell ranges (like B5:D6) and row ranges (like 20:22). Range-based styling allows for efficient application of styles to multiple cells at once.',
  '',
  '### Individual Cell Styling',
  'Apply unique styles to individual cells using their cell references. This includes border styles, background colors, and other specific properties. Individual cell styling provides the most granular control over appearance.',
  '',
  '### Available CSS Properties',
  'GridSheet supports a wide range of CSS properties including typography settings (font size, family, weight, style, decoration, letter spacing, line height), colors and backgrounds, borders (with various styles and colors), layout properties (text alignment, vertical alignment), and spacing (padding, margin).',
  '',
  '### Layout Properties',
  'Configure layout properties for cells including flexbox alignment, justification, height, and width settings. These properties control how content is positioned and sized within each cell.',
  '',
  '### Styling Best Practices',
  '1. **Use Default Styles**: Set common styles in the default cell configuration',
  '2. **Column/Row Styling**: Apply consistent styles to entire columns or rows',
  '3. **Range Styling**: Use cell ranges for grouped styling',
  '4. **Individual Overrides**: Apply specific styles to individual cells when needed',
  '5. **CSS Units**: Use appropriate units (px, %, em, rem) for different properties',
  '6. **Color Consistency**: Use a consistent color palette throughout your grid',
  '7. **Performance**: Avoid overly complex styles that might impact rendering',
  '',
  '### Conditional Styling Example',
  'Implement conditional styling by creating functions that return different styles based on cell values. Apply these functions during data generation to create dynamic styling that responds to data content.',
].join('\n\n');

export const Style: StoryObj = {
  render: () => {
    return (
      <>
        <div style={{ transform: 'translate(50px, 50px)' }}>
          <GridSheet
            initialCells={buildInitialCells({
              matrices: {
                A1: [
                  ['a', 'b', 'c', 'd', 'e'],
                  ['aa', 'bb', 'cc', 'dd', 'ee'],
                  ['aaa', 'bbb', 'ccc', 'ddd', 'eee'],
                  ['aaaa', 'bbbb', 'cccc', 'dddd', 'eeee'],
                  ['aaaaa', 'bbbbb', 'ccccc', 'ddddd', 'eeeee'],
                ],
              },
              cells: {
                default: {
                  value: 'DEFAULT',
                  style: {
                    fontStyle: 'italic',
                    backgroundColor: '#000',
                    color: '#777',
                  },
                },
                A: {},
                B: {
                  style: {
                    backgroundColor: '#eeeeee',
                    fontSize: 30,
                    color: '#fff',
                    fontFamily: 'fantasy',
                    letterSpacing: 20,
                    lineHeight: '60px',
                  },
                  width: 200,
                },
                C: {
                  style: { backgroundColor: '#dddddd', textDecoration: 'underline' },
                },
                D: {
                  style: { backgroundColor: '#cccccc' },
                },
                E: {
                  style: { backgroundColor: '#bbbbbb' },
                },
                1: {
                  style: { color: '#333' },
                },
                2: {
                  style: { color: '#F00' },
                  height: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                3: {
                  style: { color: '#0C0' },
                  height: 250,
                },
                4: {
                  style: { color: '#00F' },
                },
                'B5:D6': {
                  style: { backgroundColor: 'green' },
                },
                '20:22': {
                  style: { backgroundColor: 'blue' },
                },
                E2: {
                  style: {
                    borderTop: 'dashed 3px orange',
                    borderLeft: 'dashed 3px orange',
                    borderBottom: 'dashed 3px orange',
                    borderRight: 'dashed 3px orange',
                  },
                },
                E5: {
                  style: {
                    backgroundColor: '#F0F',
                  },
                },
                F6: {
                  value: 'F6',
                },
              },
              ensured: { numRows: 50, numCols: 10 },
            })}
            options={{}}
          />
        </div>

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
