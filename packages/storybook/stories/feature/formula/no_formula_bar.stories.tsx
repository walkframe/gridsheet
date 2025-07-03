import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Formula/NoFormulaBar',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases GridSheet without the formula bar.',
  'It demonstrates how to hide the formula bar for a cleaner interface.',
  'The grid functions normally but without the formula input area at the top.',
].join('\n\n');

const HOW_IT_WORKS = [
  'The showFormulaBar option controls the visibility of the formula bar.',
  '1. Setting showFormulaBar to false hides the formula input area.',
  '2. Users can still edit cells by double-clicking or pressing F2.',
  '3. Formulas still work normally in the background.',
  '4. This creates a more compact interface for certain use cases.',
  '',
  '## Implementation Guide',
  '',
  '### ShowFormulaBar Overview',
  'The showFormulaBar option provides control over the visibility of the formula input bar at the top of the GridSheet component. When disabled, the formula bar is hidden, creating a more compact interface while maintaining full editing functionality through alternative methods.',
  '',
  '### Interface Impact',
  'Hiding the formula bar affects the user interface:',
  '- **Reduced height**: The grid takes up less vertical space',
  '- **Cleaner appearance**: Less visual clutter in the interface',
  '- **Compact design**: Better for space-constrained applications',
  '- **Focus on data**: Users focus on cell content rather than formula input',
  '',
  '### Alternative Editing Methods',
  'When the formula bar is hidden, users can still edit cells through:',
  '- **Double-click editing**: Double-click any cell to enter edit mode',
  '- **F2 key**: Press F2 to edit the currently selected cell',
  '- **Direct typing**: Type directly into selected cells',
  '- **Context menus**: Use right-click context menus for editing options',
  '',
  '### Use Cases',
  'Hiding the formula bar is beneficial for:',
  '- **Data entry applications**: Focus on data input rather than formulas',
  '- **Read-only displays**: Show data without editing capabilities',
  '- **Embedded grids**: Integrate grids into existing interfaces',
  '- **Mobile applications**: Save screen space on smaller devices',
  '- **Dashboard displays**: Create compact data visualizations',
  '',
  '### User Experience Considerations',
  'Consider user experience when hiding the formula bar:',
  '- **User training**: Ensure users know alternative editing methods',
  '- **Accessibility**: Maintain accessibility for users with disabilities',
  '- **Consistency**: Apply consistently across similar interfaces',
  '- **Feedback**: Provide clear feedback when editing is available',
  '',
  '### Performance Benefits',
  'Hiding the formula bar can provide performance improvements:',
  '- **Reduced DOM elements**: Fewer elements to render and manage',
  '- **Faster rendering**: Less complex layout calculations',
  '- **Memory efficiency**: Reduced memory usage for UI components',
  '- **Responsive interface**: Faster response to user interactions',
  '',
  '### Integration with Other Features',
  'The showFormulaBar option works well with other GridSheet features:',
  '- **Custom toolbars**: Replace formula bar with custom editing controls',
  '- **Inline editing**: Enable direct cell editing for better UX',
  '- **Keyboard shortcuts**: Provide keyboard-based editing alternatives',
  '- **Context menus**: Use context menus for advanced editing options',
  '',
  '### Best Practices',
  '1. **Clear communication**: Inform users about available editing methods',
  '2. **Consistent behavior**: Apply the setting consistently across your application',
  '3. **Alternative controls**: Provide clear alternative ways to edit cells',
  '4. **User testing**: Test the interface with actual users',
  '5. **Documentation**: Document the editing workflow for users',
  '',
  '### Accessibility Considerations',
  'Ensure accessibility when hiding the formula bar:',
  '- **Keyboard navigation**: Maintain full keyboard accessibility',
  '- **Screen readers**: Ensure screen readers can access editing functionality',
  '- **Focus management**: Proper focus handling for editing modes',
  '- **Alternative text**: Provide alternative ways to access formula editing',
  '',
  '### Custom Editing Solutions',
  'When hiding the formula bar, consider custom editing solutions:',
  '- **Modal dialogs**: Use modal dialogs for complex formula editing',
  '- **Side panels**: Create side panels for formula input',
  '- **Toolbar buttons**: Add toolbar buttons for common editing actions',
  '- **Keyboard shortcuts**: Implement comprehensive keyboard shortcuts',
  '',
  '### Mobile and Touch Considerations',
  'For mobile and touch interfaces:',
  '- **Touch-friendly editing**: Ensure editing works well on touch devices',
  '- **Virtual keyboards**: Consider virtual keyboard interactions',
  '- **Gesture support**: Implement touch gestures for editing',
  '- **Responsive design**: Adapt editing interface for different screen sizes',
  '',
  '### Advanced Applications',
  'Advanced uses include:',
  '- **Embedded dashboards**: Integrate grids into dashboard applications',
  '- **Data visualization**: Create compact data display interfaces',
  '- **Form integration**: Embed grids in form-based applications',
  '- **Real-time displays**: Show real-time data without editing distractions',
  '',
  '### Configuration Options',
  'The showFormulaBar option can be configured:',
  '- **Global setting**: Apply to entire grid component',
  '- **Dynamic control**: Toggle visibility based on user preferences',
  '- **Conditional display**: Show/hide based on user role or context',
  '- **Responsive behavior**: Adapt based on screen size or device type',
  '',
  '### Troubleshooting',
  'Common issues and solutions:',
  '- **User confusion**: Provide clear instructions for alternative editing methods',
  '- **Accessibility issues**: Ensure all editing methods are accessible',
  '- **Performance problems**: Monitor performance impact of custom editing solutions',
  '- **Consistency issues**: Maintain consistent editing behavior across the application',
].join('\n\n');

export const NoFormulaBar: StoryObj = {
  render: () => {
    return (
      <>
        <GridSheet
          initialCells={buildInitialCells({
            matrices: {},
            cells: {
              default: {
                width: 50,
              },
            },
            ensured: { numRows: 10, numCols: 10 },
          })}
          options={{
            sheetHeight: 600,
            showFormulaBar: false,
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
