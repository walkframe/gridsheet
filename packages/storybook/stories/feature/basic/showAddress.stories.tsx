import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Basic/ShowAddress',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo demonstrates the address display functionality in GridSheet.',
  'Toggle the checkbox to show or hide cell addresses (like A1, B2, etc.) in the grid.',
].join('\n\n');

const HOW_IT_WORKS = [
  'This feature is useful for debugging, teaching spreadsheet concepts, or providing users with clear cell location references.',
  '1. The showAddress prop controls the visibility of cell addresses.',
  '2. Addresses are displayed in the format of column letter + row number (e.g., A1, B2).',
  '3. This can be toggled dynamically to help users understand cell locations.',
  '4. The address display is particularly helpful for educational and debugging purposes.',
  '',
  '## Implementation Guide',
  '',
  '### Basic Setup',
  'To implement address display functionality, import the necessary components and set up state management for the showAddress option. Configure the GridSheet component with the showAddress option to control address visibility.',
  '',
  '### Toggle Control',
  'Create a simple checkbox control that allows users to toggle the address display on and off. This provides an intuitive way for users to control when they want to see cell addresses.',
  '',
  '### Advanced Toggle with State Management',
  'Implement more sophisticated state management for address display control. This includes proper state initialization, effect handling for prop changes, and comprehensive UI controls for managing the address display feature.',
  '',
  '### Custom Address Display',
  'Create custom labelers for enhanced address display functionality. These labelers can provide additional context for empty cells or combine cell values with address information for better debugging and educational purposes.',
  '',
  '### Educational Use Case',
  'Build comprehensive educational interfaces that combine address display with other learning features. This includes multiple toggle controls for different educational modes and structured data that demonstrates spreadsheet concepts.',
  '',
  '### Debugging Use Case',
  'Implement debugging interfaces that provide comprehensive debugging capabilities. This includes visual indicators for debug mode, enhanced styling for debugging, and integrated debugging features that work together with address display.',
  '',
  '### Best Practices',
  '1. **Educational Context**: Enable by default when teaching spreadsheet concepts',
  '2. **Debugging**: Use in development to understand cell references',
  '3. **User Experience**: Provide toggle controls for user preference',
  '4. **Performance**: Minimal performance impact when enabled',
  '5. **Accessibility**: Helps users with visual impairments understand cell locations',
  '6. **Integration**: Works well with other debugging features like formula display',
  '',
  '### Common Use Cases',
  '- **Spreadsheet Tutorials**: Show addresses to explain cell references',
  '- **Data Validation**: Help users identify specific cells for validation rules',
  '- **Formula Debugging**: Combine with formula display for troubleshooting',
  '- **User Training**: Assist new users in understanding spreadsheet navigation',
  '- **Documentation**: Create screenshots with visible addresses for documentation',
].join('\n\n');

type Props = {
  initialShowAddress: boolean;
};

export const ShowAddress: StoryObj<Props> = {
  args: {
    initialShowAddress: false,
  },
  render: ({ initialShowAddress }) => {
    const [showAddress, setShowAddress] = useState(initialShowAddress);
    useEffect(() => {
      setShowAddress(initialShowAddress);
    }, [initialShowAddress]);
    return (
      <>
        <label>
          <input type="checkbox" checked={showAddress} onChange={(e) => setShowAddress(e.target.checked)} />
          Show Address
        </label>
        <GridSheet
          initialCells={buildInitialCells({
            ensured: { numRows: 100, numCols: 100 },
          })}
          options={{ showAddress }}
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
