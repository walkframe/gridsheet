'use client';

import * as React from 'react';
import {
  GridSheet,
  buildInitialCells,
  toCellObject,
  zoneToArea,
  p2a,
  operations,
  useSheetRef,
  useStoreRef,
  userActions,
  clip,
  areaToZone,
  Policy,
  ThousandSeparatorPolicyMixin,
} from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';
import { useStarlightMode } from './useStarlightMode';

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
    ['Laptops', 1200, 1350, 1100, 1400, '=SUM(B1:E1)'],
    ['Monitors', 800, 950, 850, 1000, '=SUM(B2:E2)'],
    ['Keyboards', 500, 600, 550, 650, '=SUM(B3:E3)'],
    ['Mice', 300, 350, 320, 380, '=SUM(B4:E4)'],
    ['', '', '', '', '', ''],
    ['Total', '=SUM(B1:B4)', '=SUM(C1:C4)', '=SUM(D1:D4)', '=SUM(E1:E4)', '=SUM(F1:F4)'],
  ],
  Budget: [
    ['Engineering', 50000, 42000, '=B1-C1', 'Under Budget'],
    ['Marketing', 75000, 68000, '=B2-C2', 'Under Budget'],
    ['Sales', 120000, 95000, '=B3-C3', 'Under Budget'],
    ['HR', 30000, 28000, '=B4-C4', 'Under Budget'],
    ['Finance', 45000, 52000, '=B5-C5', 'Over Budget'],
    ['Operations', 60000, 58000, '=B6-C6', 'Under Budget'],
  ],
  Inventory: [
    ['Laptop Dell XPS', 'DLX001', 45, 1299, '=C1*D1', 'In Stock'],
    ['Monitor LG 27"', 'LGM001', 32, 299, '=C2*D2', 'In Stock'],
    ['Keyboard Logitech', 'LGT001', 78, 89, '=C3*D3', 'In Stock'],
    ['Mouse Wireless', 'MSW001', 120, 25, '=C4*D4', 'In Stock'],
    ['Headphones Sony', 'SNS001', 15, 199, '=C5*D5', 'Low Stock'],
    ['Webcam HD', 'WCH001', 8, 79, '=C6*D6', 'Out of Stock'],
  ],
};

// Column labels for each sheet
const SHEET_LABELS: Record<string, Record<string, string>> = {
  Sales: { A: 'Product', B: 'Q1', C: 'Q2', D: 'Q3', E: 'Q4', F: 'Total' },
  Budget: { A: 'Department', B: 'Budget', C: 'Spent', D: 'Remaining', E: 'Status' },
  Inventory: { A: 'Item', B: 'SKU', C: 'Quantity', D: 'Price', E: 'Value', F: 'Status' },
};

export default function AdvancedFeatures() {
  const inheritMode = useStarlightMode();
  const isDark = inheritMode === 'inherit-dark';
  // Theme-aware chrome palette. Light values reproduce the original hardcoded
  // look exactly; dark values give a coherent dark desktop-app UI.
  const appBg = isDark ? '#0d1117' : '#fff';
  const appFg = isDark ? '#e4e6e9' : '#000';
  const barBg = isDark ? '#161b22' : '#f8f9fa'; // menu/tab bars, toolbar strips
  const panelBg = isDark ? '#161b22' : 'white'; // dropdown menus, header surface
  const borderCol = isDark ? '#30363d' : '#e0e0e0'; // dividers / borders
  const dividerCol = isDark ? '#30363d' : '#ccc'; // toolbar separators
  const menuFg = isDark ? '#c9d1d9' : '#495057';
  const itemFg = isDark ? '#c9d1d9' : '#2c3e50';
  const mutedFg = isDark ? '#8b949e' : '#6c757d';
  const hoverBg = isDark ? '#21262d' : '#f8f9fa';
  const hoverBg2 = isDark ? '#21262d' : '#e9ecef';
  const accent = isDark ? '#3b82f6' : '#007acc'; // active-menu highlight
  const btnBg = isDark ? '#21262d' : 'white'; // toolbar buttons, selects
  const btnBorder = isDark ? '#30363d' : '#999';
  const btnFg = isDark ? '#c9d1d9' : '#333';
  const gutterBg = isDark ? '#0d1117' : '#ddd'; // grid gutter behind sheet
  const activeTabBg = isDark ? '#0d1117' : 'white';
  const structBorder = isDark ? '#5a6069' : '#000'; // structural double borders
  const [activeSheet, setActiveSheet] = React.useState('Sales');
  const [sheets, setSheets] = React.useState(['Sales', 'Budget', 'Inventory']);
  const [activeMenuGroup, setActiveMenuGroup] = React.useState<'File' | 'History' | 'Edit' | null>(null);
  // Create sheetRefs and storeRefs for all possible sheets at component level
  const salesSheetRef = useSheetRef();
  const salesStoreRef = useStoreRef();
  const budgetSheetRef = useSheetRef();
  const budgetStoreRef = useStoreRef();
  const inventorySheetRef = useSheetRef();
  const inventoryStoreRef = useStoreRef();
  const sheet4SheetRef = useSheetRef();
  const sheet4StoreRef = useStoreRef();
  const sheet5SheetRef = useSheetRef();
  const sheet5StoreRef = useStoreRef();
  const sheet6SheetRef = useSheetRef();
  const sheet6StoreRef = useStoreRef();
  const sheet7SheetRef = useSheetRef();
  const sheet7StoreRef = useStoreRef();
  const sheet8SheetRef = useSheetRef();
  const sheet8StoreRef = useStoreRef();
  const sheet9SheetRef = useSheetRef();
  const sheet9StoreRef = useStoreRef();
  const sheet10SheetRef = useSheetRef();
  const sheet10StoreRef = useStoreRef();

  // Map sheet names to refs
  const sheetRefs = React.useMemo(
    () => ({
      Sales: salesSheetRef,
      Budget: budgetSheetRef,
      Inventory: inventorySheetRef,
      Sheet4: sheet4SheetRef,
      Sheet5: sheet5SheetRef,
      Sheet6: sheet6SheetRef,
      Sheet7: sheet7SheetRef,
      Sheet8: sheet8SheetRef,
      Sheet9: sheet9SheetRef,
      Sheet10: sheet10SheetRef,
    }),
    [
      salesSheetRef,
      budgetSheetRef,
      inventorySheetRef,
      sheet4SheetRef,
      sheet5SheetRef,
      sheet6SheetRef,
      sheet7SheetRef,
      sheet8SheetRef,
      sheet9SheetRef,
      sheet10SheetRef,
    ],
  );

  const storeRefs = React.useMemo(
    () => ({
      Sales: salesStoreRef,
      Budget: budgetStoreRef,
      Inventory: inventoryStoreRef,
      Sheet4: sheet4StoreRef,
      Sheet5: sheet5StoreRef,
      Sheet6: sheet6StoreRef,
      Sheet7: sheet7StoreRef,
      Sheet8: sheet8StoreRef,
      Sheet9: sheet9StoreRef,
      Sheet10: sheet10StoreRef,
    }),
    [
      salesStoreRef,
      budgetStoreRef,
      inventoryStoreRef,
      sheet4StoreRef,
      sheet5StoreRef,
      sheet6StoreRef,
      sheet7StoreRef,
      sheet8StoreRef,
      sheet9StoreRef,
      sheet10StoreRef,
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

  const book = useSpellbook({
    policies: {
      thousand_separator: new Policy({ mixins: [ThousandSeparatorPolicyMixin] }),
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

      // Try to restore from localStorage
      let savedCells: any = null;
      if (sheets.includes(sheetName)) {
        try {
          if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem(`gridsheet_demo5.${currentSheet}`);
            if (savedData) {
              const parsedData = JSON.parse(savedData);
              if (parsedData.cells) {
                savedCells = parsedData.cells;
              }
            }
          }
        } catch {}
      }

      if (savedCells) {
        // Restore directly from saved cells
        cellsMap[sheetName] = savedCells;
      } else {
        // Build from default data
        const data = SHEET_DATA[currentSheet as keyof typeof SHEET_DATA] || SHEET_DATA['Sales'];
        cellsMap[sheetName] = buildInitialCells({
          matrices: {
            A1: data,
          },
          cells: {
            default: {
              style: {
                borderBottom: `1px solid ${borderCol}`,
                borderRight: `1px solid ${borderCol}`,
              },
              ...(currentSheet === 'Sales' && { alignItems: 'center' }),
            },
            ...(currentSheet === 'Sales' && { defaultRow: { height: 36 } }),
            A0: { width: 150, label: (SHEET_LABELS[currentSheet] || SHEET_LABELS['Sales'])['A'] },
            B0: { width: 100, label: (SHEET_LABELS[currentSheet] || SHEET_LABELS['Sales'])['B'] },
            B: { policy: 'thousand_separator', justifyContent: 'right' },
            C0: { width: 100, label: (SHEET_LABELS[currentSheet] || SHEET_LABELS['Sales'])['C'] },
            C: { policy: 'thousand_separator', justifyContent: 'right' },
            D0: { width: 100, label: (SHEET_LABELS[currentSheet] || SHEET_LABELS['Sales'])['D'] },
            D: { policy: 'thousand_separator', justifyContent: 'right' },
            E0: { width: 100, label: (SHEET_LABELS[currentSheet] || SHEET_LABELS['Sales'])['E'] },
            E: { policy: 'thousand_separator', justifyContent: 'right' },
            F0: { width: 100, label: (SHEET_LABELS[currentSheet] || SHEET_LABELS['Sales'])['F'] },
            F: {
              policy: 'thousand_separator',
              justifyContent: 'right',
              ...(currentSheet === 'Sales' && {
                style: {
                  borderLeft: `3px double ${structBorder}`,
                },
              }),
            },
            ...(currentSheet === 'Sales' && {
              '6': {
                style: {
                  backgroundColor: 'rgba(127, 127, 127, 0.10)',
                  color: menuFg,
                  fontWeight: 'bold',
                  borderTop: `3px double ${structBorder}`,
                },
              },
              '06': { sortFixed: true, filterFixed: true },
            }),
          },
        });
      }
    });

    return cellsMap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheets, isDark]); // Recalculate when sheets array or theme changes

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

  const applyStyleToSelection = (style: React.CSSProperties) => {
    const sheetHandle = sheetRefs[activeSheet]?.current;
    const storeHandle = storeRefs[activeSheet]?.current;
    if (!sheetHandle || !storeHandle) {
      return;
    }
    const { sheet, apply } = sheetHandle;
    const { store } = storeHandle;
    const { selectingZone, choosing } = store;
    const hasSelection = selectingZone.endY >= 0 && selectingZone.endX >= 0;
    const area = hasSelection
      ? zoneToArea(selectingZone)
      : { top: choosing.y, left: choosing.x, bottom: choosing.y, right: choosing.x };
    const diff: Record<string, { style: React.CSSProperties }> = {};
    for (let y = area.top; y <= area.bottom; y++) {
      for (let x = area.left; x <= area.right; x++) {
        const current = sheet.getCell({ y, x });
        diff[p2a({ y, x })] = { style: { ...current?.style, ...style } };
      }
    }
    apply(sheet.update({ diff }));
  };

  const applyCellPropToSelection = (props: Record<string, any>) => {
    const sheetHandle = sheetRefs[activeSheet]?.current;
    const storeHandle = storeRefs[activeSheet]?.current;
    if (!sheetHandle || !storeHandle) {
      return;
    }
    const { sheet, apply } = sheetHandle;
    const { store } = storeHandle;
    const { selectingZone, choosing } = store;
    const hasSelection = selectingZone.endY >= 0 && selectingZone.endX >= 0;
    const area = hasSelection
      ? zoneToArea(selectingZone)
      : { top: choosing.y, left: choosing.x, bottom: choosing.y, right: choosing.x };
    const diff: Record<string, any> = {};
    for (let y = area.top; y <= area.bottom; y++) {
      for (let x = area.left; x <= area.right; x++) {
        diff[p2a({ y, x })] = { ...props };
      }
    }
    apply(sheet.update({ diff }));
  };

  const toggleStyle = (prop: keyof React.CSSProperties, on: string, off: string = '') => {
    const sheetHandle = sheetRefs[activeSheet]?.current;
    const storeHandle = storeRefs[activeSheet]?.current;
    if (!sheetHandle || !storeHandle) {
      return;
    }
    const { sheet } = sheetHandle;
    const { store } = storeHandle;
    const { selectingZone, choosing } = store;
    const hasSelection = selectingZone.endY >= 0 && selectingZone.endX >= 0;
    const point = hasSelection ? { y: selectingZone.startY, x: selectingZone.startX } : choosing;
    const current = sheet.getCell(point);
    const isOn = (current?.style as any)?.[prop] === on;
    applyStyleToSelection({ [prop]: isOn ? off : on } as any);
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'insertSheet': {
        const newSheetName = `Sheet${sheets.length + 1}`;
        const updatedSheets = [...sheets, newSheetName];
        setSheets(updatedSheets);
        setActiveSheet(newSheetName);
        showNotification(`New sheet "${newSheetName}" created`);
        break;
      }
      case 'save': {
        const sheetHandle = sheetRefs[activeSheet]?.current;
        if (sheetHandle) {
          const { sheet } = sheetHandle;
          const cells = toCellObject(sheet, {
            resolution: 'SYSTEM',
            ignoreFields: ['asyncCaches'],
            area: { top: 0, left: 0, bottom: sheet.bottom, right: sheet.right },
          });
          const saveData = {
            cells,
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
        const storeHandle = storeRefs[activeSheet]?.current;
        if (storeHandle) {
          storeHandle.dispatch(userActions.undo(null));
          showNotification('Undo action performed');
        }
        break;
      }
      case 'redo': {
        const storeHandle = storeRefs[activeSheet]?.current;
        if (storeHandle) {
          storeHandle.dispatch(userActions.redo(null));
          showNotification('Redo action performed');
        }
        break;
      }
      case 'cut': {
        const storeHandle = storeRefs[activeSheet]?.current;
        if (storeHandle) {
          const { store, dispatch } = storeHandle;
          const area = clip(store);
          dispatch(userActions.cut(areaToZone(area)));
          showNotification('Cut to clipboard');
        }
        break;
      }
      case 'copy': {
        const storeHandle = storeRefs[activeSheet]?.current;
        if (storeHandle) {
          const { store, dispatch } = storeHandle;
          const area = clip(store);
          dispatch(userActions.copy(areaToZone(area)));
          showNotification('Copied to clipboard');
        }
        break;
      }
      case 'paste': {
        const storeHandle = storeRefs[activeSheet]?.current;
        if (storeHandle) {
          const { dispatch } = storeHandle;
          dispatch(userActions.paste({ matrix: [], onlyValue: false }));
          showNotification('Pasted from clipboard');
        }
        break;
      }
      case 'pasteValues': {
        const storeHandle = storeRefs[activeSheet]?.current;
        if (storeHandle) {
          const { dispatch } = storeHandle;
          dispatch(userActions.paste({ matrix: [], onlyValue: true }));
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
        color: appFg,
        backgroundColor: appBg,
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: panelBg,
          borderBottom: `1px solid ${borderCol}`,
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
            backgroundColor: barBg,
            borderBottom: `1px solid ${borderCol}`,
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
                  backgroundColor: activeMenuGroup === menuGroup.name ? accent : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeMenuGroup === menuGroup.name ? 'white' : menuFg,
                  transition: 'all 0.2s ease',
                  borderRight: index < MENU_ITEMS.length - 1 ? `1px solid ${borderCol}` : 'none',
                  minWidth: '100px',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (activeMenuGroup !== menuGroup.name) {
                    e.currentTarget.style.backgroundColor = hoverBg2;
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
                    backgroundColor: panelBg,
                    border: `1px solid ${borderCol}`,
                    borderRadius: '0 0 4px 4px',
                    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.15)',
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
                            backgroundColor: borderCol,
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
                            color: itemFg,
                            transition: 'background-color 0.15s ease',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = hoverBg;
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
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          backgroundColor: barBg,
          borderBottom: `1px solid ${borderCol}`,
          flexWrap: 'wrap',
        }}
      >
        {/* Undo */}
        <button
          onClick={() => handleMenuAction('undo')}
          style={{
            width: '28px',
            height: '28px',
            border: `1px solid ${btnBorder}`,
            borderRadius: '4px',
            backgroundColor: btnBg,
            cursor: 'pointer',
            fontSize: '16px',
            color: btnFg,
          }}
        >
          ↶
        </button>
        {/* Redo */}
        <button
          onClick={() => handleMenuAction('redo')}
          style={{
            width: '28px',
            height: '28px',
            border: `1px solid ${btnBorder}`,
            borderRadius: '4px',
            backgroundColor: btnBg,
            cursor: 'pointer',
            fontSize: '16px',
            color: btnFg,
          }}
        >
          ↷
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: dividerCol }} />

        {/* Bold */}
        <button
          onClick={() => toggleStyle('fontWeight', 'bold', 'normal')}
          style={{
            width: '28px',
            height: '28px',
            border: `1px solid ${btnBorder}`,
            borderRadius: '4px',
            backgroundColor: btnBg,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            color: btnFg,
          }}
        >
          B
        </button>
        {/* Italic */}
        <button
          onClick={() => toggleStyle('fontStyle', 'italic', 'normal')}
          style={{
            width: '28px',
            height: '28px',
            border: `1px solid ${btnBorder}`,
            borderRadius: '4px',
            backgroundColor: btnBg,
            cursor: 'pointer',
            fontStyle: 'italic',
            fontSize: '14px',
            color: btnFg,
          }}
        >
          I
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: dividerCol }} />

        {/* Font Size */}
        <select
          onChange={(e) => applyStyleToSelection({ fontSize: e.target.value })}
          defaultValue=""
          style={{
            height: '28px',
            border: `1px solid ${btnBorder}`,
            borderRadius: '4px',
            backgroundColor: btnBg,
            fontSize: '13px',
            color: btnFg,
            cursor: 'pointer',
          }}
        >
          <option value="" disabled>
            Size
          </option>
          {[10, 12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
            <option key={size} value={`${size}px`}>
              {size}
            </option>
          ))}
        </select>

        <div style={{ width: '1px', height: '20px', backgroundColor: dividerCol }} />

        {/* Text Alignment */}
        {[
          { align: 'left' as const, label: '\u25C0' },
          { align: 'center' as const, label: '\u25C6' },
          { align: 'right' as const, label: '\u25B6' },
        ].map(({ align, label }) => (
          <button
            key={align}
            onClick={() => applyStyleToSelection({ textAlign: align })}
            style={{
              width: '28px',
              height: '28px',
              border: `1px solid ${btnBorder}`,
              borderRadius: '4px',
              backgroundColor: btnBg,
              cursor: 'pointer',
              fontSize: '10px',
              color: btnFg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {label}
          </button>
        ))}

        <div style={{ width: '1px', height: '20px', backgroundColor: dividerCol }} />

        {/* Vertical Alignment */}
        {[
          { align: 'start', label: '⬆', title: 'Top' },
          { align: 'center', label: '⬌', title: 'Middle' },
          { align: 'end', label: '⬇', title: 'Bottom' },
        ].map(({ align, label, title }) => (
          <button
            key={`v-${align}`}
            onClick={() => applyCellPropToSelection({ alignItems: align })}
            title={title}
            style={{
              width: '28px',
              height: '28px',
              border: `1px solid ${btnBorder}`,
              borderRadius: '4px',
              backgroundColor: btnBg,
              cursor: 'pointer',
              fontSize: '10px',
              color: btnFg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {label}
          </button>
        ))}

        <div style={{ width: '1px', height: '20px', backgroundColor: dividerCol }} />

        {/* Text Color */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '12px' }}>Text</span>
          <input
            type="color"
            defaultValue="#000000"
            onChange={(e) => applyStyleToSelection({ color: e.target.value })}
            style={{ width: '24px', height: '24px', border: 'none', cursor: 'pointer', padding: 0 }}
          />
        </label>

        {/* Background Color */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '12px' }}>Fill</span>
          <input
            type="color"
            defaultValue="#ffffff"
            onChange={(e) => applyStyleToSelection({ backgroundColor: e.target.value })}
            style={{ width: '24px', height: '24px', border: 'none', cursor: 'pointer', padding: 0 }}
          />
        </label>
      </div>
      {/* Main Content */}
      <div
        style={{
          backgroundColor: gutterBg,
        }}
      >
        {/* Sheet Container */}
        <div
          style={{
            backgroundColor: gutterBg,
            borderRadius: '0',
            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* GridSheet */}
          <div
            style={{
              borderBottom: `1px solid ${borderCol}`,
            }}
          >
            {sheets.map((sheet) => (
              <div
                key={sheet}
                style={{
                  display: activeSheet === sheet ? 'block' : 'none',
                  textAlign: 'center',
                }}
              >
                <GridSheet
                  sheetRef={sheetRefs[sheet]}
                  storeRef={storeRefs[sheet]}
                  book={book}
                  sheetName={sheet}
                  initialCells={initialCellsForSheets[sheet]}
                  style={{
                    width: '100%',
                    fontSize: '14px',
                  }}
                  options={{
                    matrixAlignment: 'both',
                    sheetResize: 'both',
                    mode: inheritMode,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Sheet Tabs */}
          <div
            style={{
              backgroundColor: barBg,
              borderTop: `1px solid ${borderCol}`,
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
                  backgroundColor: activeSheet === sheet ? activeTabBg : 'transparent',
                  border: activeSheet === sheet ? `1px solid ${borderCol}` : '1px solid transparent',
                  borderBottom: activeSheet === sheet ? `1px solid ${activeTabBg}` : '1px solid transparent',
                  borderRadius: '4px 4px 0 0',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeSheet === sheet ? '600' : '400',
                  color: activeSheet === sheet ? itemFg : mutedFg,
                  minWidth: '100px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '8px',
                }}
                onMouseEnter={(e) => {
                  if (activeSheet !== sheet) {
                    e.currentTarget.style.backgroundColor = hoverBg2;
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
                border: `1px dashed ${mutedFg}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '20px',
                color: mutedFg,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '8px',
                marginLeft: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverBg2;
                e.currentTarget.style.borderColor = menuFg;
                e.currentTarget.style.color = menuFg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = mutedFg;
                e.currentTarget.style.color = mutedFg;
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
