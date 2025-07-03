import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Formula/Row',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases the ROW() function in GridSheet.',
  'It demonstrates how to get the row number of the current cell or a specified cell.',
  'The ROW() function returns the row number (1-based) of the cell where it is used.',
].join('\n\n');

const HOW_IT_WORKS = [
  'The ROW() function is useful for creating dynamic formulas that depend on row position.',
  '1. ROW() without arguments returns the row number of the current cell.',
  '2. ROW(cellReference) returns the row number of the specified cell.',
  '3. Row numbers are 1-based (first row is 1, not 0).',
  '4. This function is commonly used in array formulas and dynamic calculations.',
  '',
  '## Implementation Guide',
  '',
  '### ROW() Function Overview',
  'The ROW() function returns the row number of a cell, enabling dynamic formulas that adapt to their vertical position in the spreadsheet. This function is essential for creating flexible, position-aware calculations.',
  '',
  '### Function Syntax',
  'The ROW() function has two forms:',
  '- **ROW()**: Returns the row number of the cell where the formula is located',
  '- **ROW(cellReference)**: Returns the row number of the specified cell reference',
  '',
  '### Row Numbering System',
  'GridSheet uses a 1-based row numbering system:',
  '- Row 1 = 1',
  '- Row 2 = 2',
  '- Row 3 = 3',
  '- And so on...',
  'This intuitive numbering system matches traditional spreadsheet conventions.',
  '',
  '### Common Use Cases',
  'The ROW() function is particularly useful for:',
  '- **Array formulas**: Creating formulas that work across multiple rows',
  '- **Dynamic ranges**: Building ranges that adjust based on vertical position',
  '- **Sequential numbering**: Generating row-based sequences',
  '- **Lookup tables**: Creating dynamic lookup references',
  '- **Conditional formatting**: Applying different logic based on row position',
  '',
  '### Array Formula Applications',
  'When combined with array formulas, ROW() enables powerful vertical calculations:',
  '- **Vertical sequences**: Generate numbers or values down columns',
  '- **Position-based calculations**: Perform calculations that depend on row position',
  '- **Dynamic lookups**: Create lookup formulas that adapt to their position',
  '- **Cross-references**: Build formulas that reference cells based on relative position',
  '',
  '### Dynamic Range Creation',
  'ROW() is essential for creating dynamic ranges that automatically adjust:',
  '- **Growing ranges**: Ranges that expand as data is added vertically',
  '- **Position-aware formulas**: Formulas that work regardless of their location',
  '- **Template formulas**: Formulas that can be copied and work in new locations',
  '',
  '### Integration with Other Functions',
  'ROW() works well with other spreadsheet functions:',
  '- **COL()**: Often used together for 2D array operations',
  '- **INDEX()**: Creates dynamic cell references',
  '- **OFFSET()**: Builds dynamic ranges based on position',
  '- **INDIRECT()**: Creates dynamic cell references from strings',
  '',
  '### Performance Considerations',
  'When using ROW() in large spreadsheets:',
  '- **Calculation frequency**: ROW() is recalculated when cells change',
  '- **Dependency tracking**: The function creates dependencies on cell position',
  '- **Array formula impact**: Large array formulas with ROW() can be computationally expensive',
  '',
  '### Best Practices',
  '1. **Use with array formulas**: ROW() is most powerful in array formula contexts',
  '2. **Combine with COL()**: Use both functions for 2D dynamic calculations',
  '3. **Test thoroughly**: Verify formulas work when copied to different locations',
  '4. **Document complex formulas**: Explain the logic when using ROW() in complex calculations',
  '5. **Consider performance**: Be mindful of calculation overhead in large datasets',
  '',
  '### Error Handling',
  'ROW() handles various scenarios:',
  '- **Invalid references**: Returns appropriate error values',
  '- **Out-of-bounds**: Handles references beyond the grid boundaries',
  '- **Circular references**: Detected and prevented by the formula engine',
  '',
  '### Advanced Applications',
  'Advanced uses of ROW() include:',
  '- **Dynamic chart data**: Creating ranges that automatically adjust for charts',
  '- **Conditional calculations**: Different logic based on row position',
  '- **Data validation**: Position-based validation rules',
  '- **Automated formatting**: Styles that change based on row position',
  '- **Cross-sheet references**: Dynamic references between sheets',
  '',
  '### Vertical Data Processing',
  'ROW() is particularly useful for processing data arranged vertically:',
  '- **List processing**: Working with data in list format',
  '- **Database-style operations**: Processing records in rows',
  '- **Time series data**: Working with chronological data',
  '- **Survey responses**: Processing questionnaire data',
  '',
  '### Sequential Operations',
  'ROW() enables various sequential operations:',
  '- **Row numbering**: Automatic numbering of rows',
  '- **Progressive calculations**: Calculations that depend on position',
  '- **Running totals**: Cumulative calculations down columns',
  '- **Pattern generation**: Creating repeating patterns',
  '',
  '### Debugging Tips',
  'When troubleshooting ROW() formulas:',
  '- **Check cell references**: Ensure referenced cells exist and are valid',
  '- **Verify array formulas**: Make sure array formulas are entered correctly',
  '- **Test in isolation**: Test ROW() in simple formulas before complex ones',
  '- **Use formula auditing**: Check dependencies and precedents',
  '- **Validate results**: Verify that row numbers are as expected',
].join('\n\n');

export const Row: StoryObj = {
  render: () => {
    return (
      <>
        <GridSheet
          initialCells={buildInitialCells({
            cells: {
              A1: { value: '=ROW()' },
              A2: { value: '=ROW()' },
              B1: { value: '=ROW()' },
              C5: { value: '=ROW()' },
              C6: { value: '=ROW(A3)' },
            },
            ensured: { numRows: 100, numCols: 100 },
          })}
          options={{}}
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
