import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import {
  GridSheet,
  buildInitialCells,
  operations,
  useHub,
  createTableRef,
  createStoreRef,
  userActions,
  clip,
  areaToZone,
  TableRef,
  p2a,
  Renderer,
  ThousandSeparatorRendererMixin,
} from '@gridsheet/react-core';
import { StoreRef } from '@gridsheet/react-core/dist/types';

const meta: Meta = {
  title: 'Demo/Case5',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases an Excel-like interface with a simplified menu bar and multiple sheet tabs.',
  'It demonstrates how to create a professional spreadsheet application with localStorage persistence and color formatting.',
  'The demo includes multiple sheets with different data types and a streamlined menu system.',
].join('\n\n');

const HOW_IT_WORKS = [
  'This shows how GridSheet can be used to create Excel-like applications with data persistence.',
  '1. 📋 Menu Bar: File (Save/Reset), Edit (Undo/Redo/Cut/Copy/Paste), and Format (Background/Text Color) menus.',
  '2. 📑 Multiple Sheets: Switch between different sheets using tabs at the bottom.',
  '3. 💾 Data Persistence: Save data to localStorage and reset to reload the page.',
  '4. ⌨️ Keyboard Shortcuts: Use Ctrl+S to save data automatically.',
  '5. 🎨 Color Formatting: Change background and text colors of cells using color picker dialogs.',
  '6. 🎯 Professional UI: Excel-like styling and layout.',
  '7. 📱 Responsive Design: Works on different screen sizes.',
  '',
  '## Implementation Guide',
  '',
  '### 📊 Excel-like Application Overview',
  'This comprehensive Excel-like application demonstrates how GridSheet can be used to create professional spreadsheet applications with advanced features. The implementation includes multiple sheets, data persistence, formatting capabilities, and a familiar user interface.',
  '',
  '### 📋 Menu Bar Implementation',
  'Create a professional menu bar with dropdown menus for common spreadsheet operations. Implement File operations (Save/Reset), Edit operations (Undo/Redo/Cut/Copy/Paste), and Format operations (Background/Text Color). Include proper event handling and user feedback.',
  '',
  '### 📑 Multiple Sheet Management',
  'Implement a multi-sheet interface with tabbed navigation at the bottom. Each sheet maintains its own data and state while sharing common functionality. Include sheet switching, data isolation, and proper state management for each sheet.',
  '',
  '### 💾 Data Persistence with localStorage',
  'Implement data persistence using browser localStorage for automatic data saving. Save sheet data, active sheet selection, and user preferences. Include error handling for storage limitations and data corruption scenarios.',
  '',
  '### ⌨️ Keyboard Shortcuts and Auto-Save',
  'Implement keyboard shortcuts for common operations including Ctrl+S for saving data. The onSave callback is automatically triggered when users press Ctrl+S, providing familiar Excel-like behavior. Include visual feedback and notifications for save operations.',
  '',
  '### 🎨 Color Formatting System',
  'Create a comprehensive color formatting system with background and text color options. Implement color picker dialogs, color preview, and undo/redo functionality for formatting changes. Include accessibility considerations for color-blind users.',
  '',
  '### 🎯 Professional UI Design',
  'Design a professional interface that mimics Excel\'s familiar layout and styling. Include proper spacing, typography, and visual hierarchy. Implement responsive design that works across different screen sizes and devices.',
  '',
  '### 📋 Clipboard Operations',
  'Implement full clipboard functionality including cut, copy, and paste operations. Handle cell ranges, multiple data types, and cross-sheet operations. Include proper error handling and user feedback for clipboard operations.',
  '',
  '### ↩️ Undo/Redo System',
  'Create a robust undo/redo system that tracks all user actions including data changes, formatting, and structural modifications. Implement efficient state management and memory optimization for large datasets.',
  '',
  '### 📊 Sheet Data Management',
  'Manage different types of sheet data including sales data, budget information, and inventory tracking. Implement appropriate formulas, formatting, and validation for each data type. Include sample data and realistic business scenarios.',
  '',
  '### ⚡ Performance Optimization',
  'Optimize performance for large datasets and multiple sheets. Implement efficient rendering, memory management, and state updates. Consider virtualization and lazy loading for better performance.',
  '',
  '### ✅ Best Practices',
  '1. **Data Integrity**: Ensure data consistency across multiple sheets and operations',
  '2. **User Experience**: Provide familiar Excel-like interactions and feedback',
  '3. **Performance**: Optimize for large datasets and multiple sheets',
  '4. **Accessibility**: Ensure all features are accessible to all users',
  '5. **Error Handling**: Implement comprehensive error handling for all operations',
  '6. **Data Persistence**: Provide reliable data saving and recovery mechanisms',
  '7. **Responsive Design**: Make the application work across different devices',
  '8. **Keyboard Shortcuts**: Implement familiar keyboard shortcuts for better UX',
  '',
  '### 🎯 Common Use Cases',
  '- **Business Applications**: Create custom business spreadsheet applications',
  '- **Data Analysis**: Build tools for data analysis and reporting',
  '- **Project Management**: Develop project tracking and management tools',
  '- **Financial Modeling**: Create financial analysis and modeling applications',
  '- **Inventory Management**: Build inventory tracking and management systems',
  '',
  '### 🚀 Advanced Features',
  '- **Formula Support**: Implement complex spreadsheet formulas and functions',
  '- **Chart Integration**: Add charting and visualization capabilities',
  '- **Collaboration**: Enable real-time collaboration features',
  '- **Export/Import**: Support various file formats for data exchange',
  '- **Custom Functions**: Allow users to create custom functions and macros',
  '',
  '### 💾 Data Management Patterns',
  '- **Multi-sheet Architecture**: Efficient management of multiple data sheets',
  '- **State Persistence**: Reliable data saving and recovery mechanisms',
  '- **Format Management**: Comprehensive styling and formatting systems',
  '- **Clipboard Integration**: Full clipboard support for data operations',
  '- **History Management**: Robust undo/redo functionality for all operations',
  '- **Auto-Save Integration**: Automatic saving with keyboard shortcuts',
].join('\n\n');

// Menu item types
type MenuItem = {
  label: string;
  icon: string;
  action: string;
} | {
  separator: true;
};

// Menu items configuration
const MENU_ITEMS = [
  {
    name: 'File',
    items: [
      { label: 'Save (<u>S</u>)', icon: '💾', action: 'save' },
      { label: 'Reset', icon: '🔄', action: 'reset' },
    ] as MenuItem[]
  },
  {
    name: 'History',
    items: [
      { label: 'Undo (<u>Z</u>)', icon: '↶', action: 'undo' },
      { label: 'Redo (Shift+<u>Z</u>)', icon: '↷', action: 'redo' },
    ] as MenuItem[]
  },
  {
    name: 'Edit',
    items: [
      { label: 'Cut (<u>X</u>)', icon: '✂️', action: 'cut' },
      { label: 'Copy (<u>C</u>)', icon: '📋', action: 'copy' },
      { separator: true },
      { label: 'Paste (<u>V</u>)', icon: '📋', action: 'paste' },
      { label: 'Paste Values Only (Shift+<u>V</u>)', icon: '📋', action: 'pasteValues' },
    ] as MenuItem[]
  },
];

// Sample data for different sheets
const SHEET_DATA = {
  'Sales': [
    ['Product', 'Q1', 'Q2', 'Q3', 'Q4', 'Total'],
    ['Laptops', 1200, 1350, 1100, 1400, '=SUM(B2:E2)'],
    ['Monitors', 800, 950, 850, 1000, '=SUM(B3:E3)'],
    ['Keyboards', 500, 600, 550, 650, '=SUM(B4:E4)'],
    ['Mice', 300, 350, 320, 380, '=SUM(B5:E5)'],
    ['', '', '', '', '', ''],
    ['Total', '=SUM(B2:B5)', '=SUM(C2:C5)', '=SUM(D2:D5)', '=SUM(E2:E5)', '=SUM(F2:F5)'],
  ],
  'Budget': [
    ['Department', 'Budget', 'Spent', 'Remaining', 'Status'],
    ['Engineering', 50000, 42000, '=B2-C2', 'Under Budget'],
    ['Marketing', 75000, 68000, '=B3-C3', 'Under Budget'],
    ['Sales', 120000, 95000, '=B4-C4', 'Under Budget'],
    ['HR', 30000, 28000, '=B5-C5', 'Under Budget'],
    ['Finance', 45000, 52000, '=B6-C6', 'Over Budget'],
    ['Operations', 60000, 58000, '=B7-C7', 'Under Budget'],
  ],
  'Inventory': [
    ['Item', 'SKU', 'Quantity', 'Price', 'Value', 'Status'],
    ['Laptop Dell XPS', 'DLX001', 45, 1299, '=C2*D2', 'In Stock'],
    ['Monitor LG 27"', 'LGM001', 32, 299, '=C3*D3', 'In Stock'],
    ['Keyboard Logitech', 'LGT001', 78, 89, '=C4*D4', 'In Stock'],
    ['Mouse Wireless', 'MSW001', 120, 25, '=C5*D5', 'In Stock'],
    ['Headphones Sony', 'SNS001', 15, 199, '=C6*D6', 'Low Stock'],
    ['Webcam HD', 'WCH001', 8, 79, '=C7*D7', 'Out of Stock'],
  ],
};

export const Case5: StoryObj = {
  render: () => {
    const [activeSheet, setActiveSheet] = React.useState<string>('Sales');
    const [sheets, setSheets] = React.useState(['Sales', 'Budget', 'Inventory']);
    const loadedSheetsRef = React.useRef<Set<string>>(new Set());

    // Create refs for each sheet
    const tableRefs = React.useRef<{[s: string]: React.RefObject<TableRef | null>}>({});
    const storeRefs = React.useRef<{[s: string]: React.RefObject<StoreRef | null>}>({});

    React.useEffect(() => {
      // Initialize refs for each sheet
      sheets.forEach(sheet => {
        if (!tableRefs.current[sheet]) {
          tableRefs.current[sheet] = createTableRef();
        }
        if (!storeRefs.current[sheet]) {
          storeRefs.current[sheet] = createStoreRef();
        }
      });
    }, [sheets])

    const hub = useHub({
      renderers: {
        thousand_separator: new Renderer({ mixins: [ThousandSeparatorRendererMixin] }),
      },
      labelers: {
        value: (n: number) => 'Value',
        label: (n: number) => 'Label',
      },
    });

    // Get current active refs
    const getActiveRefs = () => {
      return {
        tableRef: tableRefs.current[activeSheet]?.current,
        storeRef: storeRefs.current[activeSheet]?.current
      };
    };

    // Load saved data from localStorage on mount only
    React.useEffect(() => {
      try {
        // Try to load the most recent saved data to get sheets list
        const allKeys = Object.keys(localStorage).filter(key => key.startsWith('gridsheet_demo5.'));
        if (allKeys.length > 0) {
          // Get the most recent saved data
          let mostRecentData: any = null;
          let mostRecentTime = 0;
          
          allKeys.forEach(key => {
            try {
              const data = JSON.parse(localStorage.getItem(key) || '{}');
              if (data.timestamp) {
                const time = new Date(data.timestamp).getTime();
                if (time > mostRecentTime) {
                  mostRecentTime = time;
                  mostRecentData = data;
                }
              }
            } catch (error) {
              console.error('Error parsing saved data:', error);
            }
          });
          
          if (mostRecentData) {
            if (mostRecentData.sheets) {
              setSheets(mostRecentData.sheets);
            }
            if (mostRecentData.activeSheet) {
              setActiveSheet(mostRecentData.activeSheet);
            }
            console.log('Loaded saved data from localStorage');
          }
        }
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    }, []); // Empty dependency array - only run on mount

    // Show notification function
    const showNotification = (message: string) => {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
      `;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 2000);
    };

    // Handle menu actions
    const handleMenuAction = (action: string) => {
      console.log('Menu action:', action);
      
      switch (action) {
        case 'insertSheet':
          const newSheetName = `Sheet${sheets.length + 1}`;
          const updatedSheets = [...sheets, newSheetName];
          setSheets(updatedSheets);
          setActiveSheet(newSheetName);
          
          // Create refs for the new sheet
          tableRefs.current[newSheetName] = createTableRef();
          storeRefs.current[newSheetName] = createStoreRef();
          
          // Save initial data for the new sheet
          const newSheetData = {
            matrixData: [
              ['New Sheet', '', '', '', ''],
              ['', '', '', '', ''],
              ['', '', '', '', ''],
              ['', '', '', '', ''],
              ['', '', '', '', ''],
            ],
            activeSheet: newSheetName,
            sheets: updatedSheets,
            timestamp: new Date().toISOString()
          };
          
          try {
            localStorage.setItem(`gridsheet_demo5.${newSheetName}`, JSON.stringify(newSheetData));
            console.log('Initial data saved for new sheet:', newSheetName);
          } catch (error) {
            console.error('Failed to save initial data for new sheet:', error);
          }
          
          showNotification(`New sheet "${newSheetName}" created`);
          break;
        case 'save':
          handleSave();
          break;
        case 'reset':
          try {
            // Remove all saved data for all sheets
            sheets.forEach(sheetName => {
              localStorage.removeItem(`gridsheet_demo5.${sheetName}`);
            });
            showNotification('Data reset successfully. Reloading...');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } catch (error: any) {
            showNotification('Failed to reset data: ' + (error?.message || 'Unknown error'));
          }
          break;
        case 'undo':
          const { storeRef: undoStoreRef } = getActiveRefs();
          if (undoStoreRef) {
            const { store, dispatch } = undoStoreRef;
            dispatch(userActions.undo(null));
            showNotification('Undo action performed');
          }
          break;
        case 'redo':
          const { storeRef: redoStoreRef } = getActiveRefs();
          if (redoStoreRef) {
            const { store, dispatch } = redoStoreRef;
            dispatch(userActions.redo(null));
            showNotification('Redo action performed');
          }
          break;
        case 'cut':
          const { storeRef: cutStoreRef } = getActiveRefs();
          if (cutStoreRef) {
            const { store, dispatch } = cutStoreRef;
            // Get current selection or use A1 cell
            const area = clip(store);
            dispatch(userActions.cut(areaToZone(area)));
            showNotification('Cut to clipboard');
          }
          break;
        case 'copy':
          const { storeRef: copyStoreRef } = getActiveRefs();
          if (copyStoreRef) {
            const { store, dispatch } = copyStoreRef;
            // Get current selection or use A1 cell
            const area = clip(store);
            dispatch(userActions.copy(areaToZone(area)));
            showNotification('Copied to clipboard');
          }
          break;
        case 'paste':
          const { storeRef: pasteStoreRef } = getActiveRefs();
          if (pasteStoreRef) {
            const { store, dispatch } = pasteStoreRef;
            // Paste at current position (A1)
            dispatch(userActions.paste({ matrix: [], onlyValue: false }));
            showNotification('Pasted from clipboard');
          }
          break;
        case 'pasteValues':
          const { storeRef: pasteValuesStoreRef } = getActiveRefs();
          if (pasteValuesStoreRef) {
            const { store, dispatch } = pasteValuesStoreRef;
            // Paste values only at current position (A1)
            dispatch(userActions.paste({ matrix: [], onlyValue: true }));
            showNotification('Pasted values only');
          }
          break;
        default:
          showNotification(`Action "${action}" executed`);
          break;
      }
    };

    // Handle save functionality
    const handleSave = React.useCallback(() => {
      const { tableRef, storeRef } = getActiveRefs();
      if (tableRef && storeRef) {
        const { table } = tableRef;
        const { store } = storeRef;
        
        // Get cell matrix data and remove system properties
        const matrixData = table.getMatrix({ refEvaluation: 'raw' });
        const cleanMatrixData = matrixData.map((row: any[]) => 
          row.map((cell: any) => {
            if (cell && typeof cell === 'object') {
              const { system, ...cleanCell } = cell;
              return cleanCell;
            }
            return cell;
          })
        );
        
        const saveData = {
          matrixData: cleanMatrixData,
          activeSheet,
          sheets,
          timestamp: new Date().toISOString()
        };
        console.log('Saving data:', saveData);
        
        try {
          localStorage.setItem(`gridsheet_demo5.${activeSheet}`, JSON.stringify(saveData));
          showNotification('Data saved to localStorage successfully');
        } catch (error: any) {
          console.error('Failed to save data:', error);
          showNotification('Failed to save data: ' + (error?.message || 'Unknown error'));
        }
      } else {
        showNotification('Table not ready for saving');
      }
    }, [activeSheet, sheets]);

    // Function to build initial cells for a specific sheet
    const buildInitialCellsForSheet = (sheetName: string) => {
      const currentSheet = sheetName;
      
      // Try to load saved data from localStorage
      let data: any[][] = [];
      let savedCells: any = {};
      let loadedFromStorage = false;
      
      try {
        const savedData = localStorage.getItem(`gridsheet_demo5.${currentSheet}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData.matrixData && parsedData.matrixData.length > 0) {
            // Separate values and cell properties
            data = parsedData.matrixData.map((row: any[], rowIndex: number) =>
              row.map((cell: any, colIndex: number) => {
                if (cell && typeof cell === 'object') {
                  const { value, style, ...otherProps } = cell;
                  const address = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
                  
                  // Store non-value properties in cells object
                  if (style || Object.keys(otherProps).length > 0) {
                    savedCells[address] = { style, ...otherProps };
                  }
                  
                  return value || '';
                }
                return cell || '';
              })
            );
            loadedFromStorage = true;
          } else {
            // Fallback to default data
            data = SHEET_DATA[currentSheet as keyof typeof SHEET_DATA] || SHEET_DATA['Sales'];
          }
        } else {
          // No saved data, use default
          data = SHEET_DATA[currentSheet as keyof typeof SHEET_DATA] || SHEET_DATA['Sales'];
        }
      } catch (error) {
        console.error('Error loading saved data for sheet:', currentSheet, error);
        // Fallback to default data
        data = SHEET_DATA[currentSheet as keyof typeof SHEET_DATA] || SHEET_DATA['Sales'];
      }
      
      // Only log once per sheet when data is actually loaded from localStorage
      if (loadedFromStorage && !loadedSheetsRef.current.has(currentSheet)) {
        console.log('Loaded saved data from localStorage for sheet:', currentSheet);
        loadedSheetsRef.current.add(currentSheet);
      }
      
      return buildInitialCells({
        matrices: {
          A1: data,
        },
        cells: {
          default: {
            height: 35,
            style: {
              borderBottom: '1px solid #e0e0e0',
              borderRight: '1px solid #e0e0e0',
            }
          },
          '1': {
            style: {
              backgroundColor: '#6c757d',
              color: '#ffffff',
              fontWeight: 'bold',
              textAlign: 'center',
              borderBottom: '2px solid #dee2e6',
            }
          },
          'A': { width: 150 },
          'B': { 
            width: 100,
            renderer: 'thousand_separator',
          },
          'C': { 
            width: 100,
            renderer: 'thousand_separator',
          },
          'D': { 
            width: 100,
            renderer: 'thousand_separator',
          },
          'E': { 
            width: 100,
            renderer: 'thousand_separator',
          },
          'F': { 
            width: 100,
            renderer: 'thousand_separator',
            ...(currentSheet === 'Sales' && {
              style: {
                borderLeft: '3px double #000',
              }
            }),
          },
          // Total row styling (for Sales sheet - row 7)
          ...(currentSheet === 'Sales' && {
            '7': {
              style: {
                backgroundColor: '#f8f9fa',
                color: '#495057',
                fontWeight: 'bold',
                borderTop: '3px double #000',
              }
            },
          }),
          // Add saved cell properties
          ...savedCells,
        },
      });
    };

    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <p style={{ 
            color: '#7f8c8d', 
            margin: '0',
            fontSize: '16px'
          }}>
            Spreadsheet interface with menu bar and sheet tabs
          </p>
        </div>

        {/* Menu Bar */}
        <div style={{
          backgroundColor: '#f8f9fa',
          borderBottom: 'none',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          {/* File Group */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e0e0e0'
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#6c757d',
              marginRight: '4px'
            }}>
              File:
            </span>
            {MENU_ITEMS[0].items.map((item, index) => (
              <button
                key={index}
                onClick={() => 'action' in item ? handleMenuAction(item.action) : undefined}
                style={{
                  padding: '6px 12px',
                  height: '28px',
                  backgroundColor: 'transparent',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#2c3e50',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e3f2fd';
                  e.currentTarget.style.borderColor = '#3498db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              >
                <span style={{ fontSize: '14px' }}>{'icon' in item ? item.icon : ''}</span>
                <span 
                  dangerouslySetInnerHTML={{ __html: 'label' in item ? item.label : '' }}
                />
              </button>
            ))}
          </div>

          {/* History Group */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e0e0e0'
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#6c757d',
              marginRight: '4px'
            }}>
              History:
            </span>
            {MENU_ITEMS[1].items.map((item, index) => (
              <button
                key={index}
                onClick={() => 'action' in item ? handleMenuAction(item.action) : undefined}
                style={{
                  padding: '6px 12px',
                  height: '28px',
                  backgroundColor: 'transparent',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#2c3e50',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e3f2fd';
                  e.currentTarget.style.borderColor = '#3498db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              >
                <span style={{ fontSize: '14px' }}>{'icon' in item ? item.icon : ''}</span>
                <span 
                  dangerouslySetInnerHTML={{ __html: 'label' in item ? item.label : '' }}
                />
              </button>
            ))}
          </div>

          {/* Edit Group */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e0e0e0'
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#6c757d',
              marginRight: '4px'
            }}>
              Edit:
            </span>
            {MENU_ITEMS[2].items.map((item, index) => (
              <div key={index}>
                {'separator' in item ? (
                  <div style={{ 
                    width: '1px',
                    height: '20px',
                    backgroundColor: '#e0e0e0',
                    margin: '0 4px'
                  }} />
                ) : (
                  <button
                    onClick={() => 'action' in item ? handleMenuAction(item.action) : undefined}
                    style={{
                      padding: '6px 12px',
                      height: '28px',
                      backgroundColor: 'transparent',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#2c3e50',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e3f2fd';
                      e.currentTarget.style.borderColor = '#3498db';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = '#e0e0e0';
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>{'icon' in item ? item.icon : ''}</span>
                    <span 
                      dangerouslySetInnerHTML={{ __html: 'label' in item ? item.label : '' }}
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          padding: '0 20px 20px 20px',
          //minHeight: 'calc(100vh - 200px)'
        }}>
          {/* Sheet Container */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {/* GridSheet */}
            <div style={{
              borderBottom: '1px solid #e0e0e0'
            }}>
            {sheets.map((sheet) => (
              <div
                key={sheet}
                style={{
                  display: activeSheet === sheet ? 'block' : 'none'
                }}
              >
                <GridSheet
                  key={sheet}
                  tableRef={tableRefs.current[sheet]}
                  storeRef={storeRefs.current[sheet]}
                  hub={hub}
                  sheetName={sheet}
                  initialCells={buildInitialCellsForSheet(sheet)}
                  style={{
                    width: '100%',
                    //height: '100%',
                    fontSize: '14px'
                }}
                  options={{
                    onSave: handleSave
                  }}
                />
              </div>
            ))}
          </div>

            {/* Sheet Tabs */}
          <div style={{
              backgroundColor: '#f8f9fa',
              borderTop: '1px solid #e0e0e0',
              padding: '0 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              minHeight: '40px'
            }}>
              {sheets.map((sheet) => (
                <button
                  key={sheet}
                  onClick={() => {
                    console.log('Tab clicked:', sheet, 'Current activeSheet:', activeSheet);
                    setActiveSheet(sheet);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: activeSheet === sheet ? 'white' : 'transparent',
                    border: activeSheet === sheet ? '1px solid #e0e0e0' : '1px solid transparent',
                    borderBottom: activeSheet === sheet ? '1px solid white' : '1px solid transparent',
                    borderRadius: '4px 4px 0 0',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: activeSheet === sheet ? '600' : '400',
                    color: activeSheet === sheet ? '#2c3e50' : '#6c757d',
                    minWidth: '100px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSheet !== sheet) {
                      e.currentTarget.style.backgroundColor = '#e9ecef';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSheet !== sheet) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {sheet}
                </button>
              ))}
              
              {/* Add Sheet Button */}
              <button
                onClick={() => handleMenuAction('insertSheet')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: '1px dashed #6c757d',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#6c757d',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '8px',
                  marginLeft: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                  e.currentTarget.style.borderColor = '#495057';
                  e.currentTarget.style.color = '#495057';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#6c757d';
                  e.currentTarget.style.color = '#6c757d';
                }}
                title="Add new sheet"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* How it works - Markdown */}
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          margin: '20px',
          borderRadius: '8px',
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