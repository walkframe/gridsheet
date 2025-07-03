import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Formula/Simple',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases basic formula calculations in GridSheet.',
  'It demonstrates various mathematical operations including addition, subtraction, multiplication, division, exponentiation, string concatenation, and comparison operators.',
].join('\n\n');

const HOW_IT_WORKS = [
  'The grid shows both the formula syntax and calculated results, making it easy to understand how formulas work in the spreadsheet.',
  '1. Basic arithmetic operations (+, -, *, /, ^) are supported.',
  '2. String concatenation using the & operator.',
  '3. Comparison operators (=, <>, >, <, >=, <=) return boolean values.',
  '4. Built-in functions like MOD() for mathematical operations.',
  '',
  '## Implementation Guide',
  '',
  '### Formula Basics',
  'Formulas in GridSheet start with an equals sign (=) and can contain mathematical operations, cell references, functions, and text concatenation. The formula engine automatically calculates and updates results when referenced cells change.',
  '',
  '### Arithmetic Operations',
  'Supported arithmetic operators include addition, subtraction, multiplication, division, and exponentiation. These operators follow standard mathematical precedence rules and can be combined with parentheses to control calculation order.',
  '',
  '### Cell References',
  'Formulas can reference other cells using their addresses. This includes single cell references, range references, absolute references, and mixed references. Cell references enable dynamic calculations that update automatically when source data changes.',
  '',
  '### String Operations',
  'Text can be manipulated using concatenation operators and text literals. String operations allow you to combine text with numbers and other data types, creating dynamic text output based on cell values.',
  '',
  '### Comparison Operators',
  'Boolean logic operators return true/false values for conditional logic. These operators include equality checks, inequality checks, and relational comparisons. They are essential for building conditional formulas and logical expressions.',
  '',
  '### Built-in Functions',
  'GridSheet includes various mathematical and utility functions for common calculations. These functions provide pre-built logic for complex operations and can be combined to create sophisticated formulas.',
  '',
  '### Formula Display Options',
  'Users can choose how formulas are displayed in the grid. Options include showing the actual formula text, displaying calculated values, or toggling between formula and result views for debugging and verification.',
  '',
  '### Error Handling',
  'Formulas handle various error conditions gracefully. This includes circular reference detection, invalid reference handling, division by zero protection, and type mismatch resolution. Error handling ensures robust formula execution.',
  '',
  '### Performance Considerations',
  'Formula calculation performance depends on several factors including the number of formulas, complexity of calculations, dependency chains, and range sizes. Optimizing these factors ensures responsive spreadsheet performance.',
  '',
  '### Best Practices',
  '1. **Use cell references**: Reference cells instead of hardcoding values',
  '2. **Keep formulas simple**: Break complex calculations into multiple cells',
  '3. **Use absolute references**: When copying formulas that should reference fixed cells',
  '4. **Test thoroughly**: Verify formulas work with various data types',
  '5. **Document complex formulas**: Add comments or documentation for complex logic',
  '6. **Optimize performance**: Avoid unnecessary calculations in large datasets',
  '',
  '### Common Formula Patterns',
  '- **Conditional calculations**: Using IF-like logic with comparisons',
  '- **Lookup formulas**: Finding values in tables using functions',
  '- **Date calculations**: Working with dates and time periods',
  '- **Statistical analysis**: Using aggregate functions for data analysis',
  '- **Text processing**: Manipulating and formatting text data',
  '',
  '### Formula Validation',
  'GridSheet provides validation features for formula syntax, reference validation, type checking, and error highlighting. These features help users create correct and efficient formulas.',
  '',
  '### Advanced Features',
  '- **Array formulas**: Process multiple values at once',
  '- **Nested functions**: Combine multiple functions in one formula',
  '- **Dynamic ranges**: Use functions to create dynamic cell ranges',
  '- **Cross-sheet references**: Reference cells in other sheets',
  '- **External data**: Reference data from external sources',
].join('\n\n');

export const SimpleCalculation: StoryObj = {
  render: () => {
    return (
      <>
        <GridSheet
          initialCells={buildInitialCells({
            matrices: {
              A1: [
                ["'=100 + 5", "'=A2 - 60", "'=B2 * A2"],
                ['=100 + 5', '=A2-60', '=B2 * A2'],
              ],
              A4: [
                ["'=100 / 5", "'=A5 ^ 3", "'=B5 * -4"],
                ['=100 / 5', '=A5 ^ 3', '=B5 * -4'],
              ],
              A7: [
                ["'=(10 + 4) * 5", "'=A8 - 14 / 2", "'=(A8 - 14) / 2"],
                ['=(10 + 4) * 5', '=A8 - 14 / 2', '=(A8 - 14) / 2'],
              ],
              A10: [
                [`'=500 * 10 ^ 12 & "円"`, `'=A11 & "ほしい！"`, `'="とても" & B11`],
                [`=500 * 10 ^ 12 & "円"`, `=A11 & "ほしい！"`, `="とても" & B11`],
              ],
              A13: [
                [`'=100 = 100`, `'=100 = 200`, `'=100 <> 100`, `'=100 <> 200`],
                [`=100 = 100`, `=100 = 200`, `=100 <> 100`, `=100 <> 200`],
              ],
              A16: [
                [`'=100 > 99`, `'=100 > 101`, `'=100 >= 100`, `'=100 >= 101`],
                [`=100 > 99`, `=100 > 101`, `=100 >= 100`, `=100 >= 101`],
              ],
              A19: [
                [`'=100 < 99`, `'=100 < 101`, `'=100 <= 100`, `'=100 <= 99`],
                [`=100 < 99`, `=100 < 101`, `=100 <= 100`, `=100 <= 99`],
              ],
              A22: [
                [`'=MOD(8, 3)`, `'=MOD(8, 2)`, `'=MOD(8, 10)`, `'=MOD(-8, 3)`, `'=MOD(8, -3)`],
                [`=MOD(8, 3)`, `=MOD(8, 2)`, `=MOD(8, 10)`, `=MOD(-8, 3)`, `=MOD(8, -3)`],
              ],
            },
            cells: {
              default: {
                width: 250,
              },
            },
            ensured: { numRows: 100, numCols: 100 },
          })}
          options={{
            sheetHeight: 600,
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
