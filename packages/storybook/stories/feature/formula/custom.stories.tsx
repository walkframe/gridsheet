import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { BaseFunction, useHub } from '@gridsheet/react-core';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Formula/Custom',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases custom functions in GridSheet.',
  'It demonstrates how to create and use custom functions that extend the formula capabilities.',
  'The example shows two custom functions: HOPE() and test().',
].join('\n\n');

const HOW_IT_WORKS = [
  'Custom functions allow you to extend GridSheet with your own formula logic.',
  '1. Create custom functions by extending the BaseFunction class.',
  '2. Implement the main() method to define the function logic.',
  '3. Register functions in the additionalFunctions option.',
  '4. Use custom functions in formulas just like built-in functions.',
  '',
  '## Implementation Guide',
  '',
  '### Custom Function Overview',
  "Custom functions extend GridSheet's formula capabilities by allowing you to create your own functions that can be used in formulas. These functions can perform complex calculations, data processing, or integrate with external services.",
  '',
  '### Function Structure',
  'Custom functions are created by extending the BaseFunction class and implementing the main() method. The main() method receives the function arguments and should return the calculated result.',
  '',
  '### Function Registration',
  'Custom functions are registered in the hub configuration using the additionalFunctions option. Each function is given a name that can be used in formulas, and the function class is provided as the implementation.',
  '',
  '### Parameter Handling',
  'Custom functions can accept various types of parameters:',
  '- **Numbers**: Mathematical calculations and numeric processing',
  '- **Strings**: Text manipulation and string operations',
  '- **Booleans**: Logical operations and conditional processing',
  '- **Arrays**: Processing multiple values at once',
  '- **Mixed types**: Functions that handle different parameter types',
  '',
  '### Return Types',
  'Custom functions can return various data types:',
  '- **Numbers**: For mathematical calculations',
  '- **Strings**: For text processing results',
  '- **Booleans**: For logical operations',
  '- **Arrays**: For multi-value results',
  '- **Objects**: For complex data structures',
  '',
  '### Error Handling',
  'Custom functions should include proper error handling:',
  '- **Parameter validation**: Check that parameters are of expected types',
  '- **Range validation**: Ensure parameters are within acceptable ranges',
  '- **Graceful failures**: Return meaningful error messages or fallback values',
  '- **Input sanitization**: Clean and validate input data',
  '',
  '### Performance Considerations',
  'When creating custom functions:',
  '- **Efficient algorithms**: Use optimized algorithms for calculations',
  '- **Memory management**: Avoid memory leaks in complex functions',
  '- **Caching**: Consider caching for expensive calculations',
  '- **Batch processing**: Handle multiple values efficiently',
  '',
  '### Common Function Categories',
  'Custom functions can be categorized by their purpose:',
  '- **Mathematical functions**: Advanced calculations and formulas',
  '- **Text processing**: String manipulation and formatting',
  '- **Date/time functions**: Date calculations and formatting',
  '- **Business logic**: Domain-specific calculations',
  '- **Data validation**: Input validation and verification',
  '- **External integrations**: API calls and external data processing',
  '',
  '### Best Practices',
  '1. **Clear naming**: Use descriptive function names that indicate their purpose',
  '2. **Documentation**: Document function parameters, return values, and behavior',
  '3. **Testing**: Thoroughly test functions with various input types and edge cases',
  '4. **Error handling**: Provide clear error messages for invalid inputs',
  '5. **Performance**: Optimize functions for speed and efficiency',
  "6. **Maintainability**: Write clean, readable code that's easy to maintain",
  '',
  '### Function Examples by Category',
  'Custom functions can serve various purposes:',
  '- **Financial functions**: Interest calculations, loan payments, depreciation',
  '- **Statistical functions**: Advanced statistical analysis and modeling',
  '- **Engineering functions**: Unit conversions, engineering calculations',
  '- **Date functions**: Working days, business days, date arithmetic',
  '- **Text functions**: Advanced string manipulation and formatting',
  '',
  '### Integration with Built-in Functions',
  'Custom functions work seamlessly with built-in functions:',
  '- **Nested calls**: Custom functions can call built-in functions',
  '- **Parameter passing**: Built-in functions can use custom function results',
  '- **Array operations**: Custom functions can process arrays of values',
  '- **Formula composition**: Complex formulas combining multiple function types',
  '',
  '### Advanced Features',
  'Custom functions can implement advanced features:',
  '- **Recursive calculations**: Functions that call themselves',
  '- **State management**: Functions that maintain state across calls',
  '- **External APIs**: Functions that fetch data from external sources',
  '- **File operations**: Functions that read or write files',
  '- **Database queries**: Functions that interact with databases',
  '',
  '### Security Considerations',
  'When creating custom functions:',
  '- **Input validation**: Validate all input parameters',
  '- **Sanitization**: Clean input data to prevent injection attacks',
  '- **Resource limits**: Set limits on resource usage',
  '- **Error exposure**: Avoid exposing sensitive information in error messages',
  '',
  '### Debugging Custom Functions',
  'When troubleshooting custom functions:',
  '- **Parameter logging**: Log input parameters for debugging',
  '- **Step-by-step execution**: Break complex functions into smaller parts',
  '- **Error tracking**: Implement comprehensive error tracking',
  '- **Performance monitoring**: Monitor function execution time',
  '- **Unit testing**: Create comprehensive test suites',
].join('\n\n');

export const CustomFunction: StoryObj = {
  render: () => {
    const hub = useHub({
      additionalFunctions: {
        hope: class HopeFunction extends BaseFunction {
          main(text: string) {
            return `😸${text}😸`;
          }
        },
        test: class TestFunction extends BaseFunction {
          main() {
            return 'てすとだよ';
          }
        },
      },
    });
    return (
      <>
        <GridSheet
          hub={hub}
          initialCells={buildInitialCells({
            cells: {
              default: { width: 200 },
              B2: { value: '=HOPE("WORLD PEACE") & "!"' },
              A3: { value: '=test()' },
            },
            ensured: {
              numRows: 10,
              numCols: 10,
            },
          })}
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
