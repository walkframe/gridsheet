import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Formula/Col',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases the COL() function in GridSheet.',
  'It demonstrates how to get the column number of the current cell or a specified cell.',
  'The COL() function returns the column number (1-based) of the cell where it is used.',
].join('\n\n');

const HOW_IT_WORKS = [
  'The COL() function is useful for creating dynamic formulas that depend on column position.',
  '1. COL() without arguments returns the column number of the current cell.',
  '2. COL(cellReference) returns the column number of the specified cell.',
  '3. Column numbers are 1-based (first column is 1, not 0).',
  '4. This function is commonly used in array formulas and dynamic calculations.',
  '',
  '## Implementation Guide',
  '',
  '### COL() Function Overview',
  'The COL() function returns the column number of a cell, which is essential for creating dynamic formulas that adapt to their position in the spreadsheet. This function is particularly powerful for array formulas and automated calculations.',
  '',
  '### Function Syntax',
  'The COL() function has two forms:',
  '- **COL()**: Returns the column number of the cell where the formula is located',
  '- **COL(cellReference)**: Returns the column number of the specified cell reference',
  '',
  '### Column Numbering System',
  'GridSheet uses a 1-based column numbering system:',
  '- Column A = 1',
  '- Column B = 2',
  '- Column C = 3',
  '- And so on...',
  'This differs from zero-based indexing used in programming, making it more intuitive for spreadsheet users.',
  '',
  '### Common Use Cases',
  'The COL() function is particularly useful for:',
  '- **Array formulas**: Creating formulas that work across multiple columns',
  '- **Dynamic ranges**: Building ranges that adjust based on position',
  '- **Lookup tables**: Creating dynamic lookup references',
  '- **Sequential numbering**: Generating column-based sequences',
  '- **Conditional formatting**: Applying different logic based on column position',
  '',
  '### Array Formula Applications',
  'When combined with array formulas, COL() enables powerful dynamic calculations:',
  '- **Horizontal sequences**: Generate numbers or values across columns',
  '- **Position-based calculations**: Perform calculations that depend on column position',
  '- **Dynamic lookups**: Create lookup formulas that adapt to their position',
  '- **Cross-references**: Build formulas that reference cells based on relative position',
  '',
  '### Dynamic Range Creation',
  'COL() is essential for creating dynamic ranges that automatically adjust:',
  '- **Growing ranges**: Ranges that expand as data is added',
  '- **Position-aware formulas**: Formulas that work regardless of their location',
  '- **Template formulas**: Formulas that can be copied and work in new locations',
  '',
  '### Integration with Other Functions',
  'COL() works well with other spreadsheet functions:',
  '- **ROW()**: Often used together for 2D array operations',
  '- **INDEX()**: Creates dynamic cell references',
  '- **OFFSET()**: Builds dynamic ranges based on position',
  '- **INDIRECT()**: Creates dynamic cell references from strings',
  '',
  '### Performance Considerations',
  'When using COL() in large spreadsheets:',
  '- **Calculation frequency**: COL() is recalculated when cells change',
  '- **Dependency tracking**: The function creates dependencies on cell position',
  '- **Array formula impact**: Large array formulas with COL() can be computationally expensive',
  '',
  '### Best Practices',
  '1. **Use with array formulas**: COL() is most powerful in array formula contexts',
  '2. **Combine with ROW()**: Use both functions for 2D dynamic calculations',
  '3. **Test thoroughly**: Verify formulas work when copied to different locations',
  '4. **Document complex formulas**: Explain the logic when using COL() in complex calculations',
  '5. **Consider performance**: Be mindful of calculation overhead in large datasets',
  '',
  '### Error Handling',
  'COL() handles various scenarios:',
  '- **Invalid references**: Returns appropriate error values',
  '- **Out-of-bounds**: Handles references beyond the grid boundaries',
  '- **Circular references**: Detected and prevented by the formula engine',
  '',
  '### Advanced Applications',
  'Advanced uses of COL() include:',
  '- **Dynamic chart data**: Creating ranges that automatically adjust for charts',
  '- **Conditional calculations**: Different logic based on column position',
  '- **Data validation**: Position-based validation rules',
  '- **Automated formatting**: Styles that change based on column position',
  '- **Cross-sheet references**: Dynamic references between sheets',
  '',
  '### Debugging Tips',
  'When troubleshooting COL() formulas:',
  '- **Check cell references**: Ensure referenced cells exist and are valid',
  '- **Verify array formulas**: Make sure array formulas are entered correctly',
  '- **Test in isolation**: Test COL() in simple formulas before complex ones',
  '- **Use formula auditing**: Check dependencies and precedents',
].join('\n\n');

export const Col: StoryObj = {
  render: () => {
    return (
      <>
        <GridSheet
          initialCells={buildInitialCells({
            cells: {
              A1: { value: '=COL()' },
              A2: { value: '=COL()' },
              B1: { value: '=COL()' },
              C5: { value: '=COL()' },
              C6: { value: '=COL(A3)' },
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
