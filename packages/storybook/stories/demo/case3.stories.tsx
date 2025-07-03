import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import {
  GridSheet,
  buildInitialCells,
  useHub,
  useTableRef,
  useStoreRef,
  clip,
  p2a,
  CellsByAddressType,
} from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Demo/Case3',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases drawing simple pictures using Excel grid paper.',
  'A 5x5 grid is provided for drawing basic shapes and patterns.',
].join('\n\n');

const HOW_IT_WORKS = [
  '1. 🎨 Use the grid cells to draw simple pictures.',
  '2. 🖌️ Change cell background colors to create shapes.',
  '3. 🎯 Perfect for pixel art and simple drawings.',
  '',
  '## Implementation Guide',
  '',
  '### 🎨 Pixel Art Drawing Interface Overview',
  'This comprehensive pixel art drawing interface demonstrates how GridSheet can be used to create creative applications beyond traditional spreadsheet use cases. The implementation includes color selection, drawing tools, data persistence, and artistic features.',
  '',
  '### 📐 Grid-Based Drawing System',
  'Implement a grid-based drawing system that treats each cell as a pixel. Create a canvas-like interface with customizable grid sizes and cell dimensions. Support both individual cell coloring and area filling operations.',
  '',
  '### 🎨 Color Palette Management',
  'Create a comprehensive color palette system with predefined colors and custom color selection. Implement color preview, selection indicators, and color history. Include accessibility features for color-blind users.',
  '',
  '### 🖌️ Drawing Tools and Operations',
  'Implement various drawing tools including single cell coloring, area filling, and selection-based operations. Support keyboard shortcuts, mouse interactions, and touch gestures. Include undo/redo functionality for drawing operations.',
  '',
  '### 💾 Data Persistence and Export',
  'Implement data persistence using localStorage to save drawing progress automatically. Create export functionality for saving drawings as images or data files. Include import capabilities for loading existing drawings.',
  '',
  '### 📦 Selection and Area Operations',
  'Create selection tools that allow users to select multiple cells for bulk operations. Implement area filling, copying, and moving operations. Include visual feedback for selection areas and operation previews.',
  '',
  '### 🎨 User Interface Design',
  'Design an intuitive drawing interface with clear tool organization and visual feedback. Include color palette, drawing tools, and canvas area. Implement responsive design that works across different screen sizes.',
  '',
  '### ⚡ Performance Optimization',
  'Optimize drawing performance for large grids and complex operations. Implement efficient rendering, memory management, and update mechanisms. Consider virtualization for very large drawing canvases.',
  '',
  '### 🎨 Drawing Patterns and Templates',
  'Provide predefined drawing patterns and templates for common pixel art subjects. Include geometric shapes, simple objects, and artistic patterns. Allow users to save and share custom templates.',
  '',
  '### ✅ Best Practices',
  '1. **User Experience**: Provide intuitive drawing tools and clear visual feedback',
  '2. **Performance**: Optimize for smooth drawing experience with large grids',
  '3. **Data Management**: Implement reliable saving and loading of drawings',
  '4. **Accessibility**: Ensure drawing tools are accessible to all users',
  '5. **Export Options**: Provide multiple export formats for sharing drawings',
  '6. **Undo/Redo**: Implement comprehensive undo/redo for all drawing operations',
  '7. **Mobile Support**: Ensure drawing works well on touch devices',
  '',
  '### 🎯 Common Use Cases',
  '- **Pixel Art Creation**: Create pixel art and digital drawings',
  '- **Educational Tools**: Teaching basic drawing and color concepts',
  '- **Prototyping**: Quick visual prototyping and mockups',
  '- **Game Development**: Creating simple game sprites and assets',
  '- **Creative Expression**: Artistic expression and digital art creation',
  '',
  '### 🚀 Advanced Features',
  '- **Layers**: Multi-layer drawing with transparency support',
  '- **Brushes**: Different brush sizes and patterns',
  '- **Filters**: Apply effects and filters to drawings',
  '- **Animation**: Create simple animated pixel art',
  '- **Collaboration**: Real-time collaborative drawing',
  '',
  '### 🎨 Drawing Application Patterns',
  '- **Canvas Management**: Efficient canvas rendering and updates',
  '- **Tool System**: Modular drawing tools and operations',
  '- **Color Management**: Advanced color selection and management',
  '- **File Operations**: Import/export and file format support',
  '- **History Management**: Undo/redo and version control',
].join('\n\n');

// Color palette
const COLORS = [
  '#FF0000',
  '#FF4500',
  '#FFA500',
  '#FFFF00',
  '#32CD32',
  '#00FF00',
  '#00FFFF',
  '#0000FF',
  '#8A2BE2',
  '#FF00FF',
  '#FF69B4',
  '#FFC0CB',
  '#FFFFFF',
  '#C0C0C0',
  '#808080',
  '#000000',
  '#8B4513',
  '#A0522D',
  '#CD853F',
  '#F4A460',
];

export const Case3: StoryObj = {
  render: () => {
    const tableRef = useTableRef();
    const storeRef = useStoreRef();
    const [selectedColor, setSelectedColor] = React.useState('#FF0000');

    // Load data from localStorage
    const loadSavedData = React.useCallback(() => {
      try {
        const savedData = localStorage.getItem('demo3');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData.cells && tableRef.current) {
            const { table, dispatch } = tableRef.current;
            const updatedTable = table.update({ diff: parsedData.cells });
            dispatch(updatedTable);
          }
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }, []);

    const saveData = React.useCallback(() => {
      try {
        if (tableRef.current) {
          const { table } = tableRef.current;
          const cells = table.getObject();

          // Extract only cells with colors
          const coloredCells: { [key: string]: string } = {};
          Object.keys(cells).forEach((address) => {
            const cell = cells[address];
            if (cell?.style?.backgroundColor) {
              coloredCells[address] = cell.style.backgroundColor;
            }
          });

          const dataToSave = {
            cells: coloredCells,
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem('demo3', JSON.stringify(dataToSave));
        }
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }, []);

    // Reset data
    const resetData = () => {
      if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        localStorage.removeItem('demo3');
        window.location.reload();
      }
    };

    // Get saved data
    const getSavedData = () => {
      try {
        const savedData = localStorage.getItem('demo3');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          const savedCells = parsedData.cells || {};

          // Convert saved color data to cell format
          const cellData: { [key: string]: any } = {};
          Object.keys(savedCells).forEach((address) => {
            cellData[address] = {
              style: { backgroundColor: savedCells[address] },
            };
          });

          console.log('Loaded saved data:', savedCells);
          return cellData;
        }
      } catch (error) {
        console.error('Error getting saved data:', error);
      }
      return myHeart;
    };

    // Load initial data
    React.useEffect(() => {
      loadSavedData();
    }, []);

    const initialCells = buildInitialCells({
      cells: {
        default: { width: 20, height: 20 },
        ...getSavedData(),
      },
      ensured: {
        numRows: 50,
        numCols: 50,
      },
    });

    // Function to fill selected cells
    const fillSelectedCells = () => {
      if (!tableRef.current || !storeRef.current) return;

      const { table, dispatch } = tableRef.current;
      const { store } = storeRef.current;

      // Get current selection area
      const area = clip(store);
      if (!area) return;

      const diff: any = {};

      // Fill all cells in the selection area
      for (let row = area.top; row <= area.bottom; row++) {
        for (let col = area.left; col <= area.right; col++) {
          const cellAddress = p2a({ y: row, x: col });
          diff[cellAddress] = {
            style: { backgroundColor: selectedColor },
          };
        }
      }

      const updatedTable = table.update({ diff });
      dispatch(updatedTable);
    };

    return (
      <div style={{ padding: '10px' }}>
        {/* Color palette */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: '8px',
              maxWidth: '400px',
              marginBottom: '10px',
            }}
          >
            {COLORS.map((color, index) => (
              <button
                key={index}
                onClick={() => setSelectedColor(color)}
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: color,
                  border: selectedColor === color ? '3px solid #333' : '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                title={color}
              />
            ))}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <span>Selected Color: </span>
            <span
              style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                backgroundColor: selectedColor,
                border: '1px solid #ccc',
                verticalAlign: 'middle',
                marginLeft: '5px',
              }}
            ></span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={fillSelectedCells}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Fill Selected Cells
            </button>
            <button
              onClick={resetData}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              🔄 Reset
            </button>
          </div>
        </div>

        <GridSheet
          tableRef={tableRef}
          storeRef={storeRef}
          initialCells={initialCells}
          options={{
            onChange: saveData,
            sheetResize: 'both',
            showAddress: false,
            showFormulaBar: false,
          }}
          style={{ width: '400px', height: '400px' }}
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

const myHeart: CellsByAddressType = {
  C3: { style: { backgroundColor: 'red' } },
  D3: { style: { backgroundColor: 'red' } },
  O3: { style: { backgroundColor: 'red' } },
  N3: { style: { backgroundColor: 'red' } },

  B4: { style: { backgroundColor: 'red' } },
  E4: { style: { backgroundColor: 'red' } },
  M4: { style: { backgroundColor: 'red' } },
  P4: { style: { backgroundColor: 'red' } },

  A5: { style: { backgroundColor: 'red' } },
  F5: { style: { backgroundColor: 'red' } },
  L5: { style: { backgroundColor: 'red' } },
  Q5: { style: { backgroundColor: 'red' } },

  A6: { style: { backgroundColor: 'red' } },
  G6: { style: { backgroundColor: 'red' } },
  K6: { style: { backgroundColor: 'red' } },
  Q6: { style: { backgroundColor: 'red' } },

  A7: { style: { backgroundColor: 'red' } },
  H7: { style: { backgroundColor: 'red' } },
  J7: { style: { backgroundColor: 'red' } },
  Q7: { style: { backgroundColor: 'red' } },

  A8: { style: { backgroundColor: 'red' } },
  I8: { style: { backgroundColor: 'red' } },
  Q8: { style: { backgroundColor: 'red' } },

  B9: { style: { backgroundColor: 'red' } },
  P9: { style: { backgroundColor: 'red' } },

  C10: { style: { backgroundColor: 'red' } },
  O10: { style: { backgroundColor: 'red' } },

  D11: { style: { backgroundColor: 'red' } },
  N11: { style: { backgroundColor: 'red' } },

  E12: { style: { backgroundColor: 'red' } },
  M12: { style: { backgroundColor: 'red' } },

  F13: { style: { backgroundColor: 'red' } },
  L13: { style: { backgroundColor: 'red' } },

  G14: { style: { backgroundColor: 'red' } },
  K14: { style: { backgroundColor: 'red' } },

  H15: { style: { backgroundColor: 'red' } },
  J15: { style: { backgroundColor: 'red' } },

  I16: { style: { backgroundColor: 'red' } },

  // B5 - B8
  B5: { style: { backgroundColor: 'pink' } },
  B6: { style: { backgroundColor: 'pink' } },
  B7: { style: { backgroundColor: 'pink' } },
  B8: { style: { backgroundColor: 'pink' } },

  // C4 - C9
  C4: { style: { backgroundColor: 'pink' } },
  C5: { style: { backgroundColor: 'pink' } },
  C6: { style: { backgroundColor: 'pink' } },
  C7: { style: { backgroundColor: 'pink' } },
  C8: { style: { backgroundColor: 'pink' } },
  C9: { style: { backgroundColor: 'pink' } },

  // D4 - D10
  D4: { style: { backgroundColor: 'pink' } },
  D5: { style: { backgroundColor: 'pink' } },
  D6: { style: { backgroundColor: 'pink' } },
  D7: { style: { backgroundColor: 'pink' } },
  D8: { style: { backgroundColor: 'pink' } },
  D9: { style: { backgroundColor: 'pink' } },
  D10: { style: { backgroundColor: 'pink' } },

  // E5 - E11
  E5: { style: { backgroundColor: 'pink' } },
  E6: { style: { backgroundColor: 'pink' } },
  E7: { style: { backgroundColor: 'pink' } },
  E8: { style: { backgroundColor: 'pink' } },
  E9: { style: { backgroundColor: 'pink' } },
  E10: { style: { backgroundColor: 'pink' } },
  E11: { style: { backgroundColor: 'pink' } },

  // F6 - F12
  F6: { style: { backgroundColor: 'pink' } },
  F7: { style: { backgroundColor: 'pink' } },
  F8: { style: { backgroundColor: 'pink' } },
  F9: { style: { backgroundColor: 'pink' } },
  F10: { style: { backgroundColor: 'pink' } },
  F11: { style: { backgroundColor: 'pink' } },
  F12: { style: { backgroundColor: 'pink' } },

  // G7 - G13
  G7: { style: { backgroundColor: 'pink' } },
  G8: { style: { backgroundColor: 'pink' } },
  G9: { style: { backgroundColor: 'pink' } },
  G10: { style: { backgroundColor: 'pink' } },
  G11: { style: { backgroundColor: 'pink' } },
  G12: { style: { backgroundColor: 'pink' } },
  G13: { style: { backgroundColor: 'pink' } },

  // H8 - H14
  H8: { style: { backgroundColor: 'pink' } },
  H9: { style: { backgroundColor: 'pink' } },
  H10: { style: { backgroundColor: 'pink' } },
  H11: { style: { backgroundColor: 'pink' } },
  H12: { style: { backgroundColor: 'pink' } },
  H13: { style: { backgroundColor: 'pink' } },
  H14: { style: { backgroundColor: 'pink' } },

  // I9 - I15
  I9: { style: { backgroundColor: 'pink' } },
  I10: { style: { backgroundColor: 'pink' } },
  I11: { style: { backgroundColor: 'pink' } },
  I12: { style: { backgroundColor: 'pink' } },
  I13: { style: { backgroundColor: 'pink' } },
  I14: { style: { backgroundColor: 'pink' } },
  I15: { style: { backgroundColor: 'pink' } },

  // J8 - J14
  J8: { style: { backgroundColor: 'pink' } },
  J9: { style: { backgroundColor: 'pink' } },
  J10: { style: { backgroundColor: 'pink' } },
  J11: { style: { backgroundColor: 'pink' } },
  J12: { style: { backgroundColor: 'pink' } },
  J13: { style: { backgroundColor: 'pink' } },
  J14: { style: { backgroundColor: 'pink' } },

  // K7 - K13
  K7: { style: { backgroundColor: 'pink' } },
  K8: { style: { backgroundColor: 'pink' } },
  K9: { style: { backgroundColor: 'pink' } },
  K10: { style: { backgroundColor: 'pink' } },
  K11: { style: { backgroundColor: 'pink' } },
  K12: { style: { backgroundColor: 'pink' } },
  K13: { style: { backgroundColor: 'pink' } },

  // L6 - L12
  L6: { style: { backgroundColor: 'pink' } },
  L7: { style: { backgroundColor: 'pink' } },
  L8: { style: { backgroundColor: 'pink' } },
  L9: { style: { backgroundColor: 'pink' } },
  L10: { style: { backgroundColor: 'pink' } },
  L11: { style: { backgroundColor: 'pink' } },
  L12: { style: { backgroundColor: 'pink' } },

  // M5 - M11
  M5: { style: { backgroundColor: 'pink' } },
  M6: { style: { backgroundColor: 'pink' } },
  M7: { style: { backgroundColor: 'pink' } },
  M8: { style: { backgroundColor: 'pink' } },
  M9: { style: { backgroundColor: 'pink' } },
  M10: { style: { backgroundColor: 'pink' } },
  M11: { style: { backgroundColor: 'pink' } },

  // N4 - N10
  N4: { style: { backgroundColor: 'pink' } },
  N5: { style: { backgroundColor: 'pink' } },
  N6: { style: { backgroundColor: 'pink' } },
  N7: { style: { backgroundColor: 'pink' } },
  N8: { style: { backgroundColor: 'pink' } },
  N9: { style: { backgroundColor: 'pink' } },
  N10: { style: { backgroundColor: 'pink' } },

  // O4 - O9
  O4: { style: { backgroundColor: 'pink' } },
  O5: { style: { backgroundColor: 'pink' } },
  O6: { style: { backgroundColor: 'pink' } },
  O7: { style: { backgroundColor: 'pink' } },
  O8: { style: { backgroundColor: 'pink' } },
  O9: { style: { backgroundColor: 'pink' } },

  // P5 - P8
  P5: { style: { backgroundColor: 'pink' } },
  P6: { style: { backgroundColor: 'pink' } },
  P7: { style: { backgroundColor: 'pink' } },
  P8: { style: { backgroundColor: 'pink' } },
};
