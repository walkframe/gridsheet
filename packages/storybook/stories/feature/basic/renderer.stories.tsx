import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import {
  buildInitialCells,
  GridSheet,
  Renderer,
  RendererMixinType,
  CheckboxRendererMixin,
  RenderProps,
  p2a,
  useHub,
} from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Basic/Renderer',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases custom renderers in GridSheet.',
  'It demonstrates how to create custom rendering logic for different data types.',
  'The example shows a kanji renderer that converts numbers to Japanese kanji characters.',
].join('\n\n');

const HOW_IT_WORKS = [
  'Custom renderers allow you to control how different data types are displayed.',
  '1. Renderer mixins define how specific data types should be rendered.',
  '2. The kanji renderer converts Arabic numerals to Japanese kanji characters.',
  '3. Null values are handled with custom styling to show cell addresses.',
  '4. Custom renderers can be applied to specific cells or as default renderers.',
  '',
  '## Implementation Guide',
  '',
  '### Basic Renderer Setup',
  'Custom renderers are created by extending the Renderer class and defining mixins that handle specific data types. Each mixin contains methods for rendering different data types and converting values back to strings for editing.',
  '',
  '### Renderer Mixin Structure',
  'Renderer mixins contain methods for different data types:',
  '- **string()**: Handles string values',
  '- **number()**: Handles numeric values',
  '- **boolean()**: Handles boolean values',
  '- **date()**: Handles date objects',
  '- **array()**: Handles array values',
  '- **object()**: Handles object values',
  '- **null()**: Handles null/undefined values',
  '- **stringify()**: Converts any value back to string for editing',
  '',
  '### Data Type Handling',
  'Each data type method receives a RenderProps object containing the cell value, cell object, and point coordinates. The method should return either a React element for rendering or a string for simple display.',
  '',
  '### Null Value Handling',
  'Null values can be handled specially to show cell addresses or other debugging information. This is useful for educational purposes or debugging spreadsheets.',
  '',
  '### String Conversion',
  'The stringify method is crucial for converting complex data types back to strings when users edit cells. This ensures that the editing experience remains consistent.',
  '',
  '### Applying Renderers',
  'Renderers can be applied at different levels:',
  '- **Default renderer**: Applied to all cells unless overridden',
  '- **Column renderer**: Applied to entire columns',
  '- **Row renderer**: Applied to entire rows',
  '- **Cell-specific renderer**: Applied to individual cells',
  '- **Range renderer**: Applied to cell ranges',
  '',
  '### Hub Configuration',
  'Custom renderers are registered in the hub configuration alongside parsers and labelers. This creates a complete data processing pipeline from input to display.',
  '',
  '### Performance Considerations',
  'When creating custom renderers:',
  '- Keep rendering logic efficient for large datasets',
  '- Avoid complex calculations in render methods',
  '- Use memoization for expensive operations',
  '- Consider the impact on scrolling performance',
  '',
  '### Common Use Cases',
  '- **Number formatting**: Currency, percentages, scientific notation',
  '- **Date/time display**: Custom date formats, relative dates',
  '- **Data visualization**: Progress bars, sparklines, icons',
  '- **Status indicators**: Color-coded status, badges, icons',
  '- **Complex data**: JSON objects, arrays, nested structures',
  '- **Localization**: Language-specific number and date formats',
  '',
  '### Best Practices',
  '1. **Consistency**: Ensure stringify methods produce valid input for parsers',
  '2. **Error Handling**: Handle edge cases and invalid data gracefully',
  '3. **Accessibility**: Provide meaningful text alternatives for visual elements',
  '4. **Performance**: Optimize rendering for large datasets',
  '5. **Testing**: Test with various data types and edge cases',
  '6. **Documentation**: Document expected data formats and behavior',
  '',
  '### Integration with Parsers',
  'Renderers work best when paired with compatible parsers. The parser converts user input to the appropriate data type, and the renderer displays it correctly. This creates a seamless editing experience.',
  '',
  '### Advanced Features',
  '- **Conditional rendering**: Different displays based on cell values',
  '- **Interactive elements**: Clickable elements within cells',
  '- **Dynamic styling**: Styles that change based on data',
  '- **Multi-format support**: Handling multiple input/output formats',
  '- **Real-time updates**: Rendering that updates with data changes',
].join('\n\n');

const kanjiMap: { [s: string]: string } = {
  '0': '〇',
  '1': '一',
  '2': '二',
  '3': '三',
  '4': '四',
  '5': '五',
  '6': '六',
  '7': '七',
  '8': '八',
  '9': '九',
  '.': '.',
};

export const RenderToKanji: StoryObj = {
  render: () => {
    const hub = useHub({
      renderers: {
        kanji: new Renderer({
          mixins: [
            {
              string({ value }: RenderProps<string>): string {
                return value!;
              },
              number({ value }: RenderProps<number>) {
                const minus = value! < 0;
              
                let kanji = '';
                let [int, fraction] = String(Math.abs(value!)).split('.');
                for (let i = 0; i < int.length; i++) {
                  const j = int.length - i;
                  if (j % 3 === 0 && i !== 0) {
                    kanji += ',';
                  }
                  kanji += kanjiMap[int[i]];
                }
                if (fraction == null) {
                  return minus ? <span>{kanji}</span> : <span>{kanji}</span>;
                }
                kanji += '.';
                for (let i = 0; i < fraction.length; i++) {
                  kanji += kanjiMap[fraction[i]];
                }
                return minus ? <span>{kanji}</span> : <span>{kanji}</span>;
              },
            },
            {
              null({ cell, point }: RenderProps<null>) {
                return <span style={{ opacity: 0.3 }}>{p2a(point!)}</span>;
              },
            },
          ],
        }),
      },
    });

    return (
      <>
        <GridSheet
          hub={hub}
          initialCells={buildInitialCells({
            matrices: {
              A1: [[true, false, 64]],
              B3: [[100], [200, 300], [400, 500, 600], [800, 900, 1000, 1100]],
            },
            cells: {
              default: {
                renderer: 'kanji',
              },
              B10: {
                value: '=B6+10000',
              },
            },
            ensured: { numRows: 30, numCols: 20 },
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
