import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { buildInitialCells, GridSheet, operations, useHub } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Formula/Lookup',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo demonstrates lookup functions (HLOOKUP and VLOOKUP) in GridSheet.',
  'The HLOOKUP example shows how to create a grading system that automatically assigns letter grades based on numerical scores.',
  'The VLOOKUP example demonstrates cross-sheet references to determine Chinese zodiac animals for different years.',
].join('\n\n');

const HOW_IT_WORKS = [
  'These functions are essential for data analysis and reference table lookups.',
  '1. HLOOKUP searches horizontally across rows to find matching values.',
  '2. VLOOKUP searches vertically down columns to find matching values.',
  '3. Cross-sheet references allow data to be shared between different sheets.',
  '4. Lookup functions enable dynamic data relationships and calculations.',
  '',
  '## Implementation Guide',
  '',
  '### Lookup Functions Overview',
  'HLOOKUP and VLOOKUP are powerful functions for finding and retrieving data from tables based on search criteria. These functions enable dynamic data relationships and are essential for building complex spreadsheet applications.',
  '',
  '### HLOOKUP Function',
  'HLOOKUP (Horizontal Lookup) searches for a value in the first row of a table and returns a value from the same column in a specified row:',
  '- **Search value**: The value to find in the first row',
  '- **Table range**: The range containing the lookup table',
  '- **Row index**: Which row to return the value from',
  '- **Range lookup**: Whether to find exact or approximate matches',
  '',
  '### VLOOKUP Function',
  'VLOOKUP (Vertical Lookup) searches for a value in the first column of a table and returns a value from the same row in a specified column:',
  '- **Search value**: The value to find in the first column',
  '- **Table range**: The range containing the lookup table',
  '- **Column index**: Which column to return the value from',
  '- **Range lookup**: Whether to find exact or approximate matches',
  '',
  '### Cross-Sheet References',
  'Lookup functions can reference data from different sheets:',
  '- **Sheet names**: Use sheet names with exclamation marks (e.g., "Sheet1!A1:B10")',
  '- **Dynamic references**: Create references that adapt to data changes',
  '- **Data sharing**: Share lookup tables across multiple sheets',
  '- **Centralized data**: Maintain lookup tables in dedicated sheets',
  '',
  '### Lookup Table Design',
  'Effective lookup tables should be designed with:',
  '- **Sorted data**: For approximate matches, data should be sorted',
  '- **Unique keys**: Search values should be unique for exact matches',
  '- **Consistent structure**: Maintain consistent column/row structure',
  '- **Clear headers**: Use descriptive headers for easy identification',
  '',
  '### Exact vs. Approximate Matching',
  'Both functions support two types of matching:',
  '- **Exact match (FALSE)**: Returns exact matches only, or error if not found',
  '- **Approximate match (TRUE)**: Returns closest match, requires sorted data',
  '',
  '### Common Use Cases',
  'Lookup functions are used for:',
  '- **Grade calculations**: Convert scores to letter grades',
  '- **Price lookups**: Find product prices based on product codes',
  '- **Employee data**: Retrieve employee information from ID numbers',
  '- **Currency conversion**: Convert between different currencies',
  '- **Category mapping**: Assign categories based on criteria',
  '',
  '### Error Handling',
  'Lookup functions handle various error conditions:',
  '- **#N/A errors**: When search value is not found',
  '- **#REF errors**: When table range is invalid',
  '- **#VALUE errors**: When parameters are incorrect',
  '- **Circular references**: Detected and prevented',
  '',
  '### Performance Considerations',
  'For optimal performance with lookup functions:',
  '- **Table size**: Smaller lookup tables are faster',
  '- **Sorting**: Sorted data improves approximate match performance',
  '- **Range optimization**: Use minimal required ranges',
  '- **Caching**: Consider caching frequently used lookup results',
  '',
  '### Best Practices',
  '1. **Use exact matches**: When possible, use exact matching for reliability',
  '2. **Validate data**: Ensure lookup tables contain valid, consistent data',
  '3. **Document tables**: Clearly document lookup table structure and purpose',
  '4. **Test thoroughly**: Test with various search values and edge cases',
  '5. **Error handling**: Include error handling for missing values',
  '6. **Maintain tables**: Keep lookup tables updated and accurate',
  '',
  '### Advanced Lookup Techniques',
  'Advanced lookup applications include:',
  '- **Multiple criteria**: Combine multiple lookup functions for complex searches',
  '- **Dynamic ranges**: Use functions to create dynamic lookup ranges',
  '- **Conditional lookups**: Apply different lookup logic based on conditions',
  '- **Array lookups**: Process multiple lookup values simultaneously',
  '',
  '### Integration with Other Functions',
  'Lookup functions work well with:',
  '- **IF functions**: Conditional logic based on lookup results',
  '- **INDEX/MATCH**: Alternative lookup methods with more flexibility',
  '- **Aggregate functions**: Process lookup results with statistical functions',
  '- **Text functions**: Manipulate lookup results with text processing',
  '',
  '### Data Validation Applications',
  'Lookup functions support data validation:',
  '- **Reference validation**: Ensure values exist in lookup tables',
  '- **Range validation**: Validate values against acceptable ranges',
  '- **Category validation**: Ensure values belong to valid categories',
  '- **Cross-reference validation**: Validate relationships between data',
  '',
  '### Troubleshooting Tips',
  'When troubleshooting lookup functions:',
  '- **Check table ranges**: Verify lookup table ranges are correct',
  '- **Validate search values**: Ensure search values exist in lookup tables',
  '- **Review data types**: Check that data types match between search and table',
  '- **Test with simple data**: Start with simple examples before complex scenarios',
  '- **Use formula auditing**: Check dependencies and precedents',
].join('\n\n');

export const LookUp: StoryObj = {
  render: () => {
    const hub = useHub({ historyLimit: 10 });
    return (
      <>
        <h1>HLOOKUP</h1>
        <GridSheet
          initialCells={buildInitialCells({
            cells: {
              1: { style: { backgroundColor: '#ddd' } },
              '2:3': { style: {} },
              'A:E': { width: 50 },
              'A4:C4': {
                prevention: operations.Write,
                style: {
                  backgroundColor: '#ddd',
                  borderTop: 'solid 1px black',
                  borderLeft: 'solid 1px black',
                  borderRight: 'solid 1px black',
                  borderBottom: 'double 3px black',
                  fontWeight: 'bold',
                },
              },
              'A5:C9': {
                style: {
                  borderTop: 'solid 1px black',
                  borderBottom: 'solid 1px black',
                  borderLeft: 'solid 1px black',
                  borderRight: 'solid 1px black',
                },
              },
            },
            ensured: { numRows: 10, numCols: 10 },
            matrices: {
              A1: [
                [0, '=A1+60', '=B1+10', '=C1+10', '=D1+10', '=E1+5', '', '', '', ''],
                ['E', 'D', 'C', 'B', 'A', 'S', '', '', '', ''],
                ['', '', '', '', '', '', '', '', '', ''],
                ['Name', 'Point', 'Rank', '', '', '', '', '', '', ''],
                ['apple', 50, '=HLOOKUP(B5, $A$1:$F$2, 2, true)', '', '', '', '', '', '', ''],
                ['orange', 82, '=HLOOKUP(B6, A1:F2, 2, true)', '', '', '', '', '', '', ''],
                ['grape', 75, '=HLOOKUP(B7, A1:F2, 2, true)', '', '', '', '', '', '', ''],
                ['melon', 98, '=HLOOKUP(B8, A1:F2, 2, true)', '', '', '', '', '', '', ''],
                ['banana', 65, '=HLOOKUP(B9, A1:F2, 2, true)', '', '', '', '', '', '', ''],
              ],
            },
          })}
          options={{}}
        />
        <h1>VLOOKUP</h1>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 10, width: '100%' }}>
          <div style={{ width: 160 }}>
            <GridSheet
              hub={hub}
              sheetName="eto"
              initialCells={buildInitialCells({
                cells: {
                  A: { width: 50 },
                  B: { width: 50 },
                },
                matrices: {
                  A1: [
                    [0, '子🐭'],
                    [1, '丑🐮'],
                    [2, '寅🐯'],
                    [3, '卯🐰'],
                    [4, '辰🐲'],
                    [5, '巳🐍'],
                    [6, '午🐴'],
                    [7, '未🐑'],
                    [8, '申🐵'],
                    [9, '酉🐔'],
                    [10, '戌🐶'],
                    [11, '亥🐗'],
                  ],
                },
              })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <GridSheet
              hub={hub}
              sheetName="year"
              initialCells={buildInitialCells({
                cells: {
                  A: { width: 50 },
                  B: { width: 120 },
                },
                matrices: {
                  A1: [
                    [2018, `=VLOOKUP(MOD(A1 - 4, 12), 'eto'!$A$1:$B$12, 2, false)`],
                    [2019, `=VLOOKUP(MOD(A2 - 4, 12), 'eto'!$A$1:$B$12, 2, false)`],
                    [2020, `=VLOOKUP(MOD(A3 - 4, 12), 'eto'!$A$1:$B$12, 2, false)`],
                    [2021, `=VLOOKUP(MOD(A4 - 4, 12), 'eto'!$A$1:$B$12, 2, false)`],
                    [2022, `=VLOOKUP(MOD(A5 - 4, 12), 'eto'!$A$1:$B$12, 2, false)`],
                    [2023],
                    [2024],
                    [2025],
                    [2026],
                  ],
                },
                ensured: { numRows: 12, numCols: 5 },
              })}
            />
          </div>
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
