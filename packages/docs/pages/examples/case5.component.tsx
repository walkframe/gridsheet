'use client';

import * as React from 'react';
import {
  GridSheet,
  buildInitialCells,
  operations,
  useHub,
  useConnector,
  userActions,
  clip,
  areaToZone,
  Connector,
  Renderer,
  ThousandSeparatorRendererMixin,
} from '@gridsheet/react-core';

// Menu item types
type MenuItem =
  | {
      label: string;
      icon: string;
      action: string;
    }
  | {
      separator: true;
    };

// Menu items configuration
const MENU_ITEMS = [
  {
    name: 'File',
    items: [
      { label: 'Save (<u>S</u>)', icon: '💾', action: 'save' },
      { label: 'Reset', icon: '🔄', action: 'reset' },
    ] as MenuItem[],
  },
  {
    name: 'History',
    items: [
      { label: 'Undo (<u>Z</u>)', icon: '↶', action: 'undo' },
      { label: 'Redo (Shift+<u>Z</u>)', icon: '↷', action: 'redo' },
    ] as MenuItem[],
  },
  {
    name: 'Edit',
    items: [
      { label: 'Cut (<u>X</u>)', icon: '✂️', action: 'cut' },
      { label: 'Copy (<u>C</u>)', icon: '📋', action: 'copy' },
      { separator: true },
      { label: 'Paste (<u>V</u>)', icon: '📋', action: 'paste' },
      { label: 'Paste Values Only (Shift+<u>V</u>)', icon: '📋', action: 'pasteValues' },
    ] as MenuItem[],
  },
];

// Sample data for different sheets
const SHEET_DATA = {
  Sales: [
    ['Product', 'Q1', 'Q2', 'Q3', 'Q4', 'Total'],
    ['Laptops', 1200, 1350, 1100, 1400, '=SUM(B2:E2)'],
    ['Monitors', 800, 950, 850, 1000, '=SUM(B3:E3)'],
    ['Keyboards', 500, 600, 550, 650, '=SUM(B4:E4)'],
    ['Mice', 300, 350, 320, 380, '=SUM(B5:E5)'],
    ['', '', '', '', '', ''],
    ['Total', '=SUM(B2:B5)', '=SUM(C2:C5)', '=SUM(D2:D5)', '=SUM(E2:E5)', '=SUM(F2:F5)'],
  ],
  Budget: [
    ['Department', 'Budget', 'Spent', 'Remaining', 'Status'],
    ['Engineering', 50000, 42000, '=B2-C2', 'Under Budget'],
    ['Marketing', 75000, 68000, '=B3-C3', 'Under Budget'],
    ['Sales', 120000, 95000, '=B4-C4', 'Under Budget'],
    ['HR', 30000, 28000, '=B5-C5', 'Under Budget'],
    ['Finance', 45000, 52000, '=B6-C6', 'Over Budget'],
    ['Operations', 60000, 58000, '=B7-C7', 'Under Budget'],
  ],
  Inventory: [
    ['Item', 'SKU', 'Quantity', 'Price', 'Value', 'Status'],
    ['Laptop Dell XPS', 'DLX001', 45, 1299, '=C2*D2', 'In Stock'],
    ['Monitor LG 27"', 'LGM001', 32, 299, '=C3*D3', 'In Stock'],
    ['Keyboard Logitech', 'LGT001', 78, 89, '=C4*D4', 'In Stock'],
    ['Mouse Wireless', 'MSW001', 120, 25, '=C5*D5', 'In Stock'],
    ['Headphones Sony', 'SNS001', 15, 199, '=C6*D6', 'Low Stock'],
    ['Webcam HD', 'WCH001', 8, 79, '=C7*D7', 'Out of Stock'],
  ],
};

export default function AdvancedFeatures() {
  const [activeSheet, setActiveSheet] = React.useState('Sales');
  const [sheets, setSheets] = React.useState(['Sales', 'Budget', 'Inventory']);
  const [activeMenuGroup, setActiveMenuGroup] = React.useState<'File' | 'History' | 'Edit' | null>(null);
  const loadedSheetsRef = React.useRef<Set<string>>(new Set());

  // Create connectors for all possible sheets at component level - always create the same number
  const salesConnector = useConnector();
  const budgetConnector = useConnector();
  const inventoryConnector = useConnector();
  const sheet4Connector = useConnector();
  const sheet5Connector = useConnector();
  const sheet6Connector = useConnector();
  const sheet7Connector = useConnector();
  const sheet8Connector = useConnector();
  const sheet9Connector = useConnector();
  const sheet10Connector = useConnector();

  // Map sheet names to connectors
  const connectors = React.useMemo(
    () => ({
      Sales: salesConnector,
      Budget: budgetConnector,
      Inventory: inventoryConnector,
      Sheet4: sheet4Connector,
      Sheet5: sheet5Connector,
      Sheet6: sheet6Connector,
      Sheet7: sheet7Connector,
      Sheet8: sheet8Connector,
      Sheet9: sheet9Connector,
      Sheet10: sheet10Connector,
    }),
    [
      salesConnector,
      budgetConnector,
      inventoryConnector,
      sheet4Connector,
      sheet5Connector,
      sheet6Connector,
      sheet7Connector,
      sheet8Connector,
      sheet9Connector,
      sheet10Connector,
    ],
  );

  // Load most recent saved data for sheets/activeSheet
  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const allKeys = Object.keys(localStorage).filter((key) => key.startsWith('gridsheet_demo5.'));
      if (allKeys.length > 0) {
        let mostRecentData: any = null;
        let mostRecentTime = 0;
        allKeys.forEach((key) => {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.timestamp) {
              const time = new Date(data.timestamp).getTime();
              if (time > mostRecentTime) {
                mostRecentTime = time;
                mostRecentData = data;
              }
            }
          } catch {}
        });
        if (mostRecentData) {
          if (mostRecentData.sheets) {
            setSheets(mostRecentData.sheets);
          }
          if (mostRecentData.activeSheet) {
            setActiveSheet(mostRecentData.activeSheet);
          }
        }
      }
    } catch {}
  }, []);

  const hub = useHub({
    renderers: {
      thousand_separator: new Renderer({ mixins: [ThousandSeparatorRendererMixin] }),
    },
    onSave: () => handleMenuAction('save'),
  });

  // Memoize the initial cells for each sheet to prevent hook count issues
  const initialCellsForSheets = React.useMemo(() => {
    const cellsMap: Record<string, any> = {};

    // Always process all possible sheets to maintain consistent hook count
    const allPossibleSheets = [
      'Sales',
      'Budget',
      'Inventory',
      'Sheet4',
      'Sheet5',
      'Sheet6',
      'Sheet7',
      'Sheet8',
      'Sheet9',
      'Sheet10',
    ];

    allPossibleSheets.forEach((sheetName) => {
      const currentSheet = sheetName;
      let data: any[][] = [];
      let savedCells: any = {};
      let loadedFromStorage = false;

      // Only process if the sheet is in the current sheets array
      if (sheets.includes(sheetName)) {
        try {
          if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem(`gridsheet_demo5.${currentSheet}`);
            if (savedData) {
              const parsedData = JSON.parse(savedData);
              if (parsedData.matrixData && parsedData.matrixData.length > 0) {
                data = parsedData.matrixData.map((row: any[], rowIndex: number) =>
                  row.map((cell: any, colIndex: number) => {
                    if (cell && typeof cell === 'object') {
                      const { value, style, ...otherProps } = cell;
                      const address = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
                      if (style || Object.keys(otherProps).length > 0) {
                        savedCells[address] = { style, ...otherProps };
                      }
                      return value || '';
                    }
                    return cell || '';
                  }),
                );
                loadedFromStorage = true;
              } else {
                data = SHEET_DATA[currentSheet as keyof typeof SHEET_DATA] || SHEET_DATA['Sales'];
              }
            } else {
              data = SHEET_DATA[currentSheet as keyof typeof SHEET_DATA] || SHEET_DATA['Sales'];
            }
          } else {
            data = SHEET_DATA[currentSheet as keyof typeof SHEET_DATA] || SHEET_DATA['Sales'];
          }
        } catch {
          data = SHEET_DATA[currentSheet as keyof typeof SHEET_DATA] || SHEET_DATA['Sales'];
        }

        if (loadedFromStorage && typeof window !== 'undefined' && !loadedSheetsRef.current.has(currentSheet)) {
          loadedSheetsRef.current.add(currentSheet);
        }
      } else {
        // Use default data for sheets that aren't currently active
        data = SHEET_DATA[currentSheet as keyof typeof SHEET_DATA] || SHEET_DATA['Sales'];
      }

      cellsMap[sheetName] = buildInitialCells({
        matrices: {
          A1: data,
        },
        cells: {
          default: {
            height: 35,
            style: {
              borderBottom: '1px solid #e0e0e0',
              borderRight: '1px solid #e0e0e0',
            },
          },
          '1': {
            style: {
              backgroundColor: '#6c757d',
              color: '#ffffff',
              fontWeight: 'bold',
              textAlign: 'center',
              borderBottom: '2px solid #dee2e6',
            },
          },
          A: { width: 150 },
          B: {
            width: 100,
            renderer: 'thousand_separator',
          },
          C: {
            width: 100,
            renderer: 'thousand_separator',
          },
          D: {
            width: 100,
            renderer: 'thousand_separator',
          },
          E: {
            width: 100,
            renderer: 'thousand_separator',
          },
          F: {
            width: 100,
            renderer: 'thousand_separator',
            ...(currentSheet === 'Sales' && {
              style: {
                borderLeft: '3px double #000',
              },
            }),
          },
          ...(currentSheet === 'Sales' && {
            '7': {
              style: {
                backgroundColor: '#f8f9fa',
                color: '#495057',
                fontWeight: 'bold',
                borderTop: '3px double #000',
              },
            },
          }),
          ...savedCells,
        },
      });
    });

    return cellsMap;
  }, [sheets]); // Only recalculate when sheets array changes

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

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'insertSheet': {
        const newSheetName = `Sheet${sheets.length + 1}`;
        const updatedSheets = [...sheets, newSheetName];
        setSheets(updatedSheets);
        setActiveSheet(newSheetName);
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
          timestamp: new Date().toISOString(),
        };
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`gridsheet_demo5.${newSheetName}`, JSON.stringify(newSheetData));
          }
        } catch {}
        showNotification(`New sheet "${newSheetName}" created`);
        break;
      }
      case 'save': {
        const connector = connectors[activeSheet]?.current;
        if (connector) {
          const { tableManager } = connector;
          const { table } = tableManager;
          const matrixData = table.getMatrix({ refEvaluation: 'RAW' });
          const cleanMatrixData = matrixData.map((row: any[]) =>
            row.map((cell: any) => {
              if (cell && typeof cell === 'object') {
                const { system, ...cleanCell } = cell;
                return cleanCell;
              }
              return cell;
            }),
          );
          const saveData = {
            matrixData: cleanMatrixData,
            activeSheet,
            sheets,
            timestamp: new Date().toISOString(),
          };
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem(`gridsheet_demo5.${activeSheet}`, JSON.stringify(saveData));
            }
            showNotification('Data saved to localStorage successfully');
          } catch {}
        }
        break;
      }
      case 'reset': {
        sheets.forEach((sheetName) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`gridsheet_demo5.${sheetName}`);
          }
        });
        showNotification('Data reset successfully. Reloading...');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 1000);
        break;
      }
      case 'undo': {
        const connector = connectors[activeSheet]?.current;
        if (connector) {
          const { storeManager } = connector;
          const { store, sync } = storeManager;
          sync(userActions.undo(null));
          showNotification('Undo action performed');
        }
        break;
      }
      case 'redo': {
        const connector = connectors[activeSheet]?.current;
        if (connector) {
          const { storeManager } = connector;
          const { store, sync } = storeManager;
          sync(userActions.redo(null));
          showNotification('Redo action performed');
        }
        break;
      }
      case 'cut': {
        const connector = connectors[activeSheet]?.current;
        if (connector) {
          const { storeManager } = connector;
          const { store, sync } = storeManager;
          const area = clip(store);
          sync(userActions.cut(areaToZone(area)));
          showNotification('Cut to clipboard');
        }
        break;
      }
      case 'copy': {
        const connector = connectors[activeSheet]?.current;
        if (connector) {
          const { storeManager } = connector;
          const { store, sync } = storeManager;
          const area = clip(store);
          sync(userActions.copy(areaToZone(area)));
          showNotification('Copied to clipboard');
        }
        break;
      }
      case 'paste': {
        const connector = connectors[activeSheet]?.current;
        if (connector) {
          const { storeManager } = connector;
          const { store, sync } = storeManager;
          sync(userActions.paste({ matrix: [], onlyValue: false }));
          showNotification('Pasted from clipboard');
        }
        break;
      }
      case 'pasteValues': {
        const connector = connectors[activeSheet]?.current;
        if (connector) {
          const { storeManager } = connector;
          const { store, sync } = storeManager;
          sync(userActions.paste({ matrix: [], onlyValue: true }));
          showNotification('Pasted values only');
        }
        break;
      }
      default:
        showNotification(`Action "${action}" executed`);
        break;
    }
  };

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f8f9fa',
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '0',
          display: 'flex',
          alignItems: 'stretch',
          flexWrap: 'wrap',
        }}
      >
        {/* Menu Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            width: '100%',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          {MENU_ITEMS.map((menuGroup, index) => (
            <div key={menuGroup.name} style={{ position: 'relative' }}>
              <button
                onClick={() =>
                  setActiveMenuGroup(
                    activeMenuGroup === menuGroup.name ? null : (menuGroup.name as 'File' | 'History' | 'Edit'),
                  )
                }
                style={{
                  padding: '8px 16px',
                  backgroundColor: activeMenuGroup === menuGroup.name ? '#007acc' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeMenuGroup === menuGroup.name ? 'white' : '#495057',
                  transition: 'all 0.2s ease',
                  borderRight: index < MENU_ITEMS.length - 1 ? '1px solid #e0e0e0' : 'none',
                  minWidth: '100px',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (activeMenuGroup !== menuGroup.name) {
                    e.currentTarget.style.backgroundColor = '#e9ecef';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeMenuGroup !== menuGroup.name) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {menuGroup.name}
              </button>

              {/* Dropdown Menu */}
              {activeMenuGroup === menuGroup.name && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '0 0 4px 4px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    minWidth: '320px',
                    padding: '4px 0',
                  }}
                >
                  {menuGroup.items.map((item, index) => (
                    <div key={index}>
                      {'separator' in item ? (
                        <div
                          style={{
                            height: '1px',
                            backgroundColor: '#e0e0e0',
                            margin: '4px 12px',
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => {
                            if ('action' in item) {
                              handleMenuAction(item.action);
                              setActiveMenuGroup(null);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#2c3e50',
                            transition: 'background-color 0.15s ease',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span style={{ fontSize: '14px', width: '16px', textAlign: 'center' }}>
                            {'icon' in item ? item.icon : ''}
                          </span>
                          <span dangerouslySetInnerHTML={{ __html: 'label' in item ? item.label : '' }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Main Content */}
      <div
        style={{
          padding: '0 20px 20px 20px',
        }}
      >
        {/* Sheet Container */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* GridSheet */}
          <div
            style={{
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            {sheets.map((sheet) => (
              <div
                key={sheet}
                style={{
                  display: activeSheet === sheet ? 'block' : 'none',
                }}
              >
                {activeSheet === sheet && (
                  <GridSheet
                    connector={connectors[sheet]}
                    hub={hub}
                    sheetName={sheet}
                    initialCells={initialCellsForSheets[sheet]}
                    style={{
                      width: '100%',
                      fontSize: '14px',
                    }}
                    options={{}}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Sheet Tabs */}
          <div
            style={{
              backgroundColor: '#f8f9fa',
              borderTop: '1px solid #e0e0e0',
              padding: '0 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              minHeight: '40px',
            }}
          >
            {sheets.map((sheet) => (
              <button
                key={sheet}
                onClick={() => setActiveSheet(sheet)}
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
                  marginTop: '8px',
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
                marginLeft: '8px',
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
    </div>
  );
}
