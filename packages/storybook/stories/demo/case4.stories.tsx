import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import {
  GridSheet,
  buildInitialCells,
  buildInitialCellsOrigin,
  operations,
  useHub,
  Policy,
  PolicyMixinType,
  PolicyOption,
  Renderer,
  ThousandSeparatorRendererMixin,
  CheckboxRendererMixin,
  makeBorder,
} from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Demo/Case4',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases advanced Policy functionality for data validation and business rules.',
  'It demonstrates a comprehensive budget management system with multiple policy types including department selection, status validation, and budget constraints.',
  'The status options can be dynamically managed in a separate sheet.',
].join('\n\n');

const HOW_IT_WORKS = [
  'This shows how GridSheet can enforce business rules and data validation through policies.',
  '1. 📋 Department Policy: Dropdown selection for department names with validation.',
  '2. 🔄 Dynamic Status Policy: Predefined status options that can be updated in real-time.',
  '3. 💰 Budget Policy: Numeric validation with range constraints.',
  '4. ⚡ Real-time validation and error handling.',
  '5. 🎨 Conditional styling based on policy values.',
  '6. ⚙️ Dynamic status options management in separate sheet.',
  '7. 🖼️ Border styling using makeBorder utility for professional appearance.',
  '',
  '## Implementation Guide',
  '',
  '### 📊 Policy-Based Data Validation Overview',
  'This comprehensive budget management system demonstrates how GridSheet can implement sophisticated business rules and data validation through policies. The system enforces data integrity, provides user-friendly interfaces, and maintains consistency across complex business processes.',
  '',
  '### 📋 Department Selection Policy',
  'Implement dropdown-based department selection with comprehensive validation. This policy provides predefined department options with icons and keywords for search functionality. Include validation logic to ensure only valid departments can be selected.',
  '',
  '### 🔄 Dynamic Status Policy',
  'Create dynamic status policies that can be updated in real-time. These policies manage predefined status options that can be modified through a separate interface. Implement proper state management and validation for status changes.',
  '',
  '### 💰 Budget Validation Policy',
  'Implement numeric validation policies for budget amounts with range constraints. These policies ensure budget values fall within acceptable ranges and handle edge cases like negative values or excessive amounts. Provide automatic correction for invalid inputs.',
  '',
  '### 🖼️ Border Styling with makeBorder',
  'Implement professional border styling using the makeBorder utility function. This utility provides a clean API for applying consistent border styles across cells and ranges. The makeBorder function accepts options for individual sides (top, right, bottom, left) or applies uniform styling to all sides.',
  '',
  '### 🔧 makeBorder Utility Function',
  'The makeBorder utility generates CSSProperties objects with individual border styles. It supports both uniform border application using the "all" option and selective side styling. The function avoids outputting the shorthand "border" property, ensuring compatibility with existing styles and preventing unintentional style overrides.',
  '',
  '### 📏 Default Border Implementation',
  'Apply consistent default borders to all cells using makeBorder({ all: "1px solid #000000" }). This creates a professional grid appearance with uniform black borders that match traditional spreadsheet applications. Default borders provide visual structure and improve data readability.',
  '',
  '### ⬇️ Special Border Patterns',
  'Implement special border patterns for emphasis and visual hierarchy. Use double borders (makeBorder({ bottom: "4px double #000000" })) to separate summary sections like totals. Double borders create clear visual breaks and indicate important data boundaries.',
  '',
  '### 🎨 Border Style Options',
  'Utilize various border styles including solid, dashed, and double borders. Apply different border widths and colors to create visual emphasis. Use border styling to highlight important data, separate sections, and improve overall grid readability.',
  '',
  '### ⚡ Real-time Validation',
  'Implement real-time validation that provides immediate feedback to users. Validate data as users type and provide clear error messages for invalid inputs. Include visual indicators for validation status.',
  '',
  '### 🎨 Conditional Styling',
  'Apply conditional styling based on policy values and validation status. Use color coding to indicate different statuses, validation errors, and data categories. Create visual hierarchy that helps users quickly understand data state.',
  '',
  '### ⚙️ Dynamic Options Management',
  'Create interfaces for managing policy options dynamically. Allow users to add, remove, or modify status options through a separate management interface. Implement proper state synchronization between management and main interfaces.',
  '',
  '### 📱 Responsive Design',
  'Design the interface to work across different screen sizes and devices. Implement responsive layouts that adapt to mobile and desktop environments. Ensure all policy controls remain accessible on smaller screens.',
  '',
  '### ⚠️ Error Handling',
  'Implement comprehensive error handling for policy validation failures. Provide meaningful error messages, fallback values, and recovery mechanisms. Handle edge cases and unexpected data scenarios gracefully.',
  '',
  '### ⚡ Performance Optimization',
  'Optimize policy validation performance for large datasets. Implement efficient validation algorithms, minimize unnecessary re-validations, and use proper caching strategies. Consider batch validation for bulk operations.',
  '',
  '### ✅ Best Practices',
  '1. **Data Integrity**: Ensure all policies maintain data consistency and integrity',
  '2. **User Experience**: Provide clear feedback and intuitive interfaces for policy interactions',
  '3. **Validation Logic**: Implement robust validation that handles all edge cases',
  '4. **Performance**: Optimize validation performance for large datasets',
  '5. **Accessibility**: Ensure all policy controls are accessible to all users',
  '6. **Documentation**: Document policy rules and validation logic clearly',
  '7. **Testing**: Thoroughly test all policy scenarios and edge cases',
  '8. **Border Consistency**: Use makeBorder for consistent border styling across the application',
  '9. **Visual Hierarchy**: Apply appropriate border styles to create clear data sections',
  '',
  '### 🎯 Common Use Cases',
  '- **Budget Management**: Enforce budget constraints and approval workflows',
  '- **HR Systems**: Validate employee data and policy compliance',
  '- **Inventory Management**: Enforce stock limits and category rules',
  '- **Project Management**: Validate project parameters and resource allocation',
  '- **Financial Systems**: Enforce accounting rules and compliance requirements',
  '- **Spreadsheet Applications**: Create professional grid interfaces with consistent styling',
  '',
  '### 🚀 Advanced Features',
  '- **Conditional Policies**: Policies that change based on other field values',
  '- **Multi-level Validation**: Hierarchical validation with different rule sets',
  '- **Audit Trails**: Track policy changes and validation history',
  '- **Integration**: Connect policies with external validation systems',
  '- **Workflow Integration**: Integrate policies with business process workflows',
  '- **Custom Border Patterns**: Create sophisticated border designs for special use cases',
  '',
  '### 📋 Policy Management Patterns',
  '- **Centralized Policy Management**: Single source of truth for all policies',
  '- **Dynamic Policy Updates**: Real-time policy modification capabilities',
  '- **Policy Inheritance**: Hierarchical policy structures with inheritance',
  '- **Policy Templates**: Reusable policy templates for common scenarios',
  '- **Policy Versioning**: Track policy changes and maintain version history',
  '',
  '### 🖼️ Border Management Patterns',
  '- **Default Border Application**: Consistent border styling across all cells',
  '- **Section Border Design**: Special borders for headers, totals, and important sections',
  '- **Border Style Variation**: Different border styles for different purposes',
  '- **Responsive Border Design**: Adaptive border styling for different screen sizes',
  '- **Border Performance**: Efficient border rendering for large datasets',
].join('\n\n');

// Department selection policy
const DepartmentPolicy: PolicyMixinType = {
  getOptions: (): PolicyOption[] => [
    { value: 'Engineering', label: '🔧 Engineering', keywords: ['Engineering', 'dev', 'development'] } as any,
    { value: 'Marketing', label: '📢 Marketing', keywords: ['Marketing', 'promotion', 'advertising'] } as any,
    { value: 'Sales', label: '💰 Sales', keywords: ['Sales', 'revenue', 'selling'] } as any,
    { value: 'HR', label: '👥 HR', keywords: ['HR', 'Human Resources', 'personnel'] } as any,
    { value: 'Finance', label: '💼 Finance', keywords: ['Finance', 'accounting', 'financial'] } as any,
    { value: 'Operations', label: '⚙️ Operations', keywords: ['Operations', 'operational', 'management'] } as any,
    { value: 'Product', label: '🚀 Product', keywords: ['Product', 'product management', 'goods'] } as any,
    { value: 'Support', label: '🛠️ Support', keywords: ['Support', 'help', 'assistance'] } as any,
  ],
  getDefault: (props: any) => {
    return { value: 'Engineering' };
  },
  validate: (props: any) => {
    const { patch } = props;
    if (patch?.value == null) return patch;
    
    const options = DepartmentPolicy.getOptions!();
    const validOption = options.find(option => option.value === patch?.value);
    if (!validOption) {
      return { ...patch, value: 'Engineering' };
    }
    return patch;
  },
};

// Budget validation policy
const BudgetPolicy: PolicyMixinType = {
  validate: (props: any) => {
    const { patch } = props;
    if (patch?.value == null) return patch;
    
    const value = Number(patch.value);
    if (isNaN(value) || value < 0) {
      return { ...patch, value: 0 };
    }
    if (value > 1000000) {
      return { ...patch, value: 1000000 };
    }
    return patch;
  },
};

export const Case4: StoryObj = {
  render: () => {
    const [statusOptions, setStatusOptions] = React.useState<[string, string][]>([
      ['Approved', '✅ Approved'],
      ['Pending', '⏳ Pending'],
      ['Under Review', '🔍 Under Review'],
      ['Rejected', '❌ Rejected'],
      ['On Hold', '⏸️ On Hold'],
    ]);

    const [isMobile, setIsMobile] = React.useState(false);

    // Check screen width on mount and resize
    React.useEffect(() => {
      const checkScreenWidth = () => {
        setIsMobile(window.innerWidth <= 900);
      };
      
      checkScreenWidth();
      window.addEventListener('resize', checkScreenWidth);
      
      return () => window.removeEventListener('resize', checkScreenWidth);
    }, []);

    // Dynamic status policy
    const StatusPolicy = React.useMemo(
      () => ({
        getOptions: (): PolicyOption[] => {
          return statusOptions.map(([value, label]) => ({ value, label }));
        },
        getDefault: (props: any) => {
          return { value: 'Pending' };
        },
        validate: (props: any) => {
          const { patch } = props;
          if (patch?.value == null) return patch;
          
          const options = statusOptions.map(([value]) => value);
          const validOption = options.includes(patch?.value);
          if (!validOption) {
            return { ...patch, value: 'Pending' };
          }
          return patch;
        },
      }),
      [statusOptions],
    );

    const hub = useHub({
      renderers: {
        thousand_separator: new Renderer({ mixins: [ThousandSeparatorRendererMixin] }),
        checkbox: new Renderer({ mixins: [CheckboxRendererMixin] }),
      },
      policies: {
        department: new Policy({ mixins: [DepartmentPolicy] }),
        status: new Policy({ mixins: [StatusPolicy] }),
        budget: new Policy({ mixins: [BudgetPolicy] }),
      },
      labelers: {
        value: (n: number) => 'Value',
        label: (n: number) => 'Label',
      },
    });

    // Force re-render when statusOptions change
    React.useEffect(() => {
      // This will trigger a re-render of the grid when statusOptions change
    }, [statusOptions]);

    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ 
            color: '#2c3e50', 
            margin: '0 0 10px 0',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            💰 Budget Management System
          </h1>
          <p style={{ 
            color: '#7f8c8d', 
            margin: '0',
            fontSize: '16px'
          }}>
            Advanced policy-based data validation with dynamic status options
          </p>
        </div>

        {/* Main Budget Grid and Status Options - Side by Side */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {/* Main Budget Grid */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            flex: isMobile ? 'none' : 1,
            flexShrink: 0,
            width: isMobile ? '100%' : 'auto'
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
              📊 Budget Overview
            </h3>
            <GridSheet
              hub={hub}
              sheetName="budget"
              initialCells={buildInitialCells({
                matrices: {
                  A1: [
                    ['Department', 'Budget Request', 'Actual Spent', 'Remaining', 'Status', 'Done'],
                    ['Engineering', 50000, 42000, '=B2-C2', 'Approved', true],
                    ['Marketing', 75000, 68000, '=B3-C3', 'Approved', true],
                    ['Sales', 120000, 95000, '=B4-C4', 'Under Review', false],
                    ['HR', 30000, 28000, '=B5-C5', 'Pending', false],
                    ['Finance', 45000, 52000, '=B6-C6', 'Rejected', false],
                    ['Operations', 60000, 58000, '=B7-C7', 'Approved', true],
                    ['Product', 40000, 38000, '=B8-C8', 'On Hold', false],
                    ['Support', 25000, 22000, '=B9-C9', 'Approved', true],
                    ['', '', '', '', '', ''],
                    ['Total Budget', '=SUM(B2:B9)', '=SUM(C2:C9)', '=SUM(D2:D9)', '', '=COUNTIF(F2:F9,true)'],
                  ],
                },
                cells: {
                  default: { 
                    width: 100, 
                    height: 40,
                    style: {
                      ...makeBorder({ all: '1px solid #000000' }),
                    },
                  },
                  1: { height: 50 },
                  'A1:F1': {
                    style: {
                      backgroundColor: '#2c3e50',
                      color: 'white',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    },
                    prevention: operations.Write,
                  },
                  'A': { 
                    width: 100,
                    style: {
                      borderRight: 'double 3px #000000',
                    },
                    policy: 'department',
                  },
                  'B': { 
                    width: 80,
                    style: { 
                      backgroundColor: '#e8f5e8',
                    },
                    policy: 'budget',
                    renderer: 'thousand_separator',
                  },
                  'C': { 
                    width: 80,
                    style: { 
                      backgroundColor: '#fff3cd',
                    },
                    policy: 'budget',
                    renderer: 'thousand_separator',
                  },
                  'D': { 
                    width: 80,
                    style: { 
                      backgroundColor: '#d1ecf1',
                      fontWeight: 'bold',
                    },
                    prevention: operations.Write,
                    renderer: 'thousand_separator',
                  },
                  'E': { 
                    width: 90,
                    policy: 'status',
                  },
                  'F': { 
                    width: 50,
                    renderer: 'checkbox',
                    style: {
                      backgroundColor: '#f8f9fa',
                    },
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  // Double border above Total row
                  'A10:F10': {
                    style: {
                      ...makeBorder({ 
                        bottom: '4px double #000000',
                      }),
                    },
                  },
                  '11': {
                    style: {
                      // backgroundColor: '#34495e',
                      // color: 'white',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    },
                    prevention: operations.Write,
                  },
                  'B11': {
                    style: {
                      backgroundColor: '#27ae60',
                      color: 'white',
                      fontWeight: 'bold',
                    },
                  },
                  'C11': {
                    style: {
                      backgroundColor: '#e67e22',
                      color: 'white',
                      fontWeight: 'bold',
                    },
                  },
                  'D11': {
                    style: {
                      backgroundColor: '#3498db',
                      color: 'white',
                      fontWeight: 'bold',
                    },
                  },
                  'F11': {
                    style: {
                      backgroundColor: '#9b59b6',
                      color: 'white',
                      fontWeight: 'bold',
                    },
                    prevention: operations.Write,
                  },
                  // Conditional styling for status
                  'E2': { 
                    style: { 
                      backgroundColor: '#d4edda', 
                      color: '#155724',
                    } 
                  },
                  'E3': { 
                    style: { 
                      backgroundColor: '#d4edda', 
                      color: '#155724',
                    } 
                  },
                  'E4': { 
                    style: { 
                      backgroundColor: '#fff3cd', 
                      color: '#856404',
                    } 
                  },
                  'E5': { 
                    style: { 
                      backgroundColor: '#f8d7da', 
                      color: '#721c24',
                    } 
                  },
                  'E6': { 
                    style: { 
                      backgroundColor: '#f8d7da', 
                      color: '#721c24',
                    } 
                  },
                  'E7': { 
                    style: { 
                      backgroundColor: '#d4edda', 
                      color: '#155724',
                    } 
                  },
                  'E8': { 
                    style: { 
                      backgroundColor: '#e2e3e5', 
                      color: '#383d41',
                    } 
                  },
                  'E9': { 
                    style: { 
                      backgroundColor: '#d4edda', 
                      color: '#155724',
                    } 
                  },
                },
              })}
              options={{
                sheetHeight: 500,
                sheetWidth: 700,
              }}
            />
          </div>

          {/* Status Options Management */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            width: isMobile ? '100%' : '300px',
            minWidth: 0
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
              ⚙️ Status Options
            </h3>
            <GridSheet
              hub={hub}
              sheetName="status-options"
              initialCells={buildInitialCellsOrigin({
                matrix: statusOptions,
                cells: {
                  A: {
                    labeler: 'value',
                    width: 100,
                    style: { backgroundColor: '#f8f9fa' },
                  },
                  B: {
                    labeler: 'label',
                    width: 100,
                    style: { backgroundColor: '#f8f9fa' },
                  },
                  default: {
                    prevention: operations.InsertCols,
                  },
                },
              })}
              options={{
                sheetHeight: 300,
                onChange: (table) => {
                  try {
                    const matrix = table.getFieldMatrix() as [string, string][];
                    if (matrix && matrix.length > 0) {
                      // Filter out empty rows
                      const validMatrix = matrix.filter(row => row[0] && row[1]);
                      setStatusOptions(validMatrix);
                    }
                  } catch (error) {
                    console.error('Error updating status options:', error);
                  }
                },
              }}
            />
            <p style={{ 
              color: '#7f8c8d', 
              margin: '0 0 15px 0',
              fontSize: '14px'
            }}>
              Edit status options. Changes reflect immediately.
            </p>
          </div>
        </div>

        {/* Policy Information */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
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
            🔧 Policy Features
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>📋 Department Policy</h4>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                Dropdown selection for department names with validation. Only valid departments can be selected.
              </p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>📊 Dynamic Status Policy</h4>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                Status options can be dynamically updated in real-time. Changes in the status options sheet immediately reflect in the budget grid.
              </p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>💰 Budget Policy</h4>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                Numeric validation with range constraints (0 - 1,000,000). Prevents invalid budget entries.
              </p>
            </div>
          </div>
        </div>

        {/* How it works - Markdown */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
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
      </div>
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