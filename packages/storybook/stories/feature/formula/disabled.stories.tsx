import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { buildInitialCells, GridSheet, useHub } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Formula/Disabled',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases disabled formula functionality in GridSheet.',
  'It demonstrates how to disable formula evaluation for specific cells.',
  'The demo compares cells with formulas enabled and disabled to show the difference.',
].join('\n\n');

const HOW_IT_WORKS = [
  'The disableFormula option allows you to prevent formula evaluation for specific cells.',
  '1. Setting disableFormula to true prevents formula evaluation.',
  '2. Disabled formulas are treated as literal text values.',
  '3. This is useful for displaying formula syntax without calculation.',
  '4. The comparison shows how the same content behaves differently with formulas enabled/disabled.',
  '',
  '## Implementation Guide',
  '',
  '### DisableFormula Overview',
  'The disableFormula option provides fine-grained control over formula evaluation in GridSheet. When enabled for a cell, any content that would normally be treated as a formula is instead displayed as literal text, allowing users to see the formula syntax without triggering calculations.',
  '',
  '### Use Cases',
  'Disabling formulas is useful in various scenarios:',
  '- **Educational purposes**: Teaching formula syntax without calculations',
  '- **Documentation**: Creating reference sheets with formula examples',
  '- **Debugging**: Comparing formula text with calculated results',
  '- **Template creation**: Building templates with example formulas',
  '- **Data entry**: Preventing accidental formula evaluation during data input',
  '',
  '### Cell-Level Control',
  'The disableFormula option can be applied at different levels:',
  '- **Individual cells**: Disable formulas for specific cells',
  '- **Cell ranges**: Disable formulas across multiple cells',
  '- **Columns/Rows**: Disable formulas for entire columns or rows',
  '- **Conditional application**: Apply based on cell content or position',
  '',
  '### Formula Detection Behavior',
  'When disableFormula is enabled:',
  '- **Equals sign (=)**: Treated as literal text, not formula indicator',
  '- **Function names**: Displayed as text, not executed',
  '- **Cell references**: Shown as text, not resolved to values',
  '- **Operators**: Displayed literally, not used in calculations',
  '',
  '### Comparison Scenarios',
  'The feature enables useful comparisons:',
  '- **Side-by-side comparison**: Formula text vs. calculated results',
  '- **Before/after analysis**: See how formulas transform data',
  '- **Error identification**: Compare expected vs. actual results',
  '- **Learning progression**: Start with syntax, then enable calculations',
  '',
  '### Educational Applications',
  'Disabling formulas supports learning:',
  '- **Step-by-step learning**: Show syntax before enabling calculations',
  '- **Formula documentation**: Create reference materials',
  '- **Practice exercises**: Allow students to write formulas without execution',
  '- **Assessment tools**: Test formula writing skills',
  '',
  '### Template Development',
  'Useful for creating spreadsheet templates:',
  '- **Example formulas**: Show users what formulas to enter',
  '- **Placeholder content**: Provide guidance without calculations',
  '- **Documentation cells**: Include explanatory text with formula examples',
  '- **Instruction sheets**: Create step-by-step guides',
  '',
  '### Debugging and Troubleshooting',
  'Helps with formula debugging:',
  '- **Syntax verification**: Check formula syntax without execution',
  '- **Reference validation**: Verify cell references are correct',
  '- **Logic review**: Examine formula logic step by step',
  '- **Error isolation**: Identify where formula errors occur',
  '',
  '### Performance Benefits',
  'Disabling formulas can improve performance:',
  '- **Reduced calculations**: Fewer formulas to evaluate',
  '- **Faster loading**: No formula parsing for disabled cells',
  '- **Memory efficiency**: Less memory used for formula storage',
  '- **Responsive interface**: Faster user interactions',
  '',
  '### Best Practices',
  '1. **Clear labeling**: Clearly indicate which cells have disabled formulas',
  '2. **Consistent application**: Apply consistently across related cells',
  '3. **User communication**: Inform users about disabled formula behavior',
  '4. **Reversible design**: Allow easy enabling/disabling of formulas',
  '5. **Documentation**: Document why formulas are disabled in specific contexts',
  '',
  '### Integration with Other Features',
  'Works well with other GridSheet features:',
  '- **Conditional formatting**: Apply different styles to disabled formula cells',
  '- **Data validation**: Validate formula syntax without execution',
  '- **Cell protection**: Combine with cell protection for enhanced control',
  '- **Custom renderers**: Use custom renderers to highlight disabled formulas',
  '',
  '### Advanced Applications',
  'Advanced uses include:',
  '- **Formula libraries**: Create collections of example formulas',
  '- **Training materials**: Build comprehensive learning resources',
  '- **Quality assurance**: Review formulas before deployment',
  '- **Version control**: Track formula changes over time',
  '',
  '### Error Prevention',
  'Helps prevent common formula errors:',
  '- **Syntax errors**: Catch syntax issues before execution',
  '- **Reference errors**: Identify invalid cell references',
  '- **Circular references**: Detect circular dependencies',
  '- **Type mismatches**: Identify inappropriate data types',
  '',
  '### User Experience Considerations',
  'Consider user experience when using this feature:',
  '- **Visual indicators**: Clearly show which cells have disabled formulas',
  '- **Toggle controls**: Provide easy ways to enable/disable formulas',
  '- **Contextual help**: Explain why formulas are disabled',
  '- **Progressive disclosure**: Gradually enable formulas as users learn',
].join('\n\n');

export const Disabled: StoryObj = {
  render: () => {
    const hub = useHub({
      labelers: {
        disabled: (n) => {
          return 'disabled formula';
        },
      },
    });
    return (
      <>
        <GridSheet
          hub={hub}
          initialCells={buildInitialCells({
            cells: {
              A: { labeler: 'disabled', width: 150 },
              A1: { value: '=1+1', disableFormula: true },
              B1: { value: '=1+1' },
              A2: { value: "'quote", disableFormula: true },
              B2: { value: "'quote" },
              A3: { value: "'0123", disableFormula: true },
              B3: { value: "'0123" },
              A4: { value: '0123', disableFormula: true },
              B4: { value: '0123' },
              A5: { value: 123, disableFormula: true },
              B5: { value: 123 },
            },
            ensured: { numRows: 5, numCols: 5 },
          })}
        />
        
        {/* How it works - Markdown */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            color: '#2c3e50', 
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📖 How it works
          </h3>
          <div style={{
            lineHeight: '1.6',
            color: '#374151'
          }}>
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
