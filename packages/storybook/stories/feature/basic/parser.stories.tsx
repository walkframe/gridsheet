import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { CellType, buildInitialCells, GridSheet, Parser, Renderer, RenderProps, useHub } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Basic/Parser',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases custom parsers in GridSheet.',
  'It demonstrates how to create custom parsing logic for converting user input into structured data.',
  'The example shows a list parser that converts text input into arrays.',
].join('\n\n');

const HOW_IT_WORKS = [
  'Custom parsers allow you to control how user input is converted into data structures.',
  '1. Parser mixins define how text input should be converted to data types.',
  '2. The list parser splits text by newlines to create arrays.',
  '3. Custom renderers work together with parsers to display and edit data.',
  '4. This enables complex data types like arrays to be edited as simple text.',
  '',
  '## Implementation Guide',
  '',
  '### Basic Parser Setup',
  'To create custom parsers, import the necessary classes and set up a hub configuration. Custom parsers are created by extending the Parser class and defining mixins that handle specific data types and conversion logic.',
  '',
  '### Advanced Parser with Validation',
  'Implement parsers with comprehensive validation logic. This includes input validation, format checking, and error handling. Advanced parsers can validate data types, ranges, and formats while providing meaningful error messages.',
  '',
  '### JSON Parser Example',
  'Create parsers for complex data structures like JSON objects. These parsers handle JSON parsing, validation, and error handling. They work with corresponding renderers to display and edit JSON data in a user-friendly format.',
  '',
  '### Date Parser with Format Support',
  'Implement date parsers that support multiple date formats. These parsers can handle various date input formats and convert them to standardized date objects. They include format detection and validation for different date representations.',
  '',
  '### Number Parser with Locale Support',
  'Create number parsers that handle locale-specific number formats. These parsers can process numbers with different thousand separators, decimal separators, and formatting conventions. They normalize numbers for consistent processing.',
  '',
  '### CSV Parser for Complex Data',
  'Implement parsers for CSV (Comma-Separated Values) data. These parsers handle quoted values, escape characters, and complex CSV formatting. They can process multi-field data and convert it to structured arrays.',
  '',
  '### Parser with Error Handling',
  'Build robust parsers with comprehensive error handling. These parsers include try-catch blocks, fallback values, and graceful error recovery. They provide meaningful error messages and handle edge cases gracefully.',
  '',
  '### Applying Parsers to Cells',
  'Configure parsers to work with specific cells, columns, or ranges. Apply different parsers to different data types and create a comprehensive data processing pipeline. This allows for flexible and powerful data handling.',
  '',
  '### Best Practices',
  '1. **Error Handling**: Always include proper error handling in parser functions',
  '2. **Validation**: Validate input data before processing',
  '3. **Performance**: Keep parser functions efficient for large datasets',
  '4. **User Feedback**: Provide clear error messages for invalid input',
  '5. **Fallbacks**: Include fallback values for failed parsing',
  '6. **Testing**: Test parsers with various input formats and edge cases',
  '7. **Documentation**: Document expected input formats for custom parsers',
  '',
  '### Common Parser Patterns',
  '- **Text Processing**: String manipulation, regex matching, format conversion',
  '- **Data Validation**: Type checking, range validation, format validation',
  '- **Data Transformation**: Unit conversion, encoding/decoding, normalization',
  '- **Complex Parsing**: JSON, XML, CSV, custom formats',
  '- **Localization**: Number formats, date formats, currency formats',
].join('\n\n');

class ListRenderer extends Renderer {

}


export const ParseAsList: StoryObj = {
  render: () => {
    const hub = useHub({
      renderers: {
        list: new Renderer({ mixins: [
          {
            array({ value }: RenderProps<any[]>) {
              return (
                <ul>
                  {value!.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              );
            },
            stringify(cell: CellType): string {
              const value = cell.value;
              if (Array.isArray(value)) {
                return value.join('\n');
              }
              return value == null ? '' : String(value);
            }
          },
        ]}),
      },
      parsers: {
        list: new Parser({ mixins: [
          {
            functions: [(value: string) => value.split(/\n/g)],
          },
          
        ] }),
      },
    });

    return (
      <>
        <GridSheet
          hub={hub}
          initialCells={buildInitialCells({
            matrices: {
              A1: [
                [
                  [1, 2, 3],
                  [4, 5, 6],
                  [7, 8, 9],
                ],
                [
                  [10, 11, 12],
                  [13, 14, 15],
                  [16, 17, 18],
                ],
                [
                  [19, 20, 21],
                  [22, 23, 24],
                  [25, 26, 27],
                ],
              ],
            },
            cells: {
              default: {
                height: 100,
                renderer: 'list',
                parser: 'list',
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
