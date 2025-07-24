import { useState, useEffect } from 'preact/hooks';
import { GridSheet, useHub } from '@gridsheet/preact-core';

function App() {
  const [enableDecimalLabeler, setEnableDecimalLabeler] = useState(false);

  const hubProps = {};
  const hub = useHub(hubProps);

  useEffect(() => {
    // Update hub props when enableDecimalLabeler changes
    if (enableDecimalLabeler) {
      hubProps.labelers = {
        decimal: (n) => String(n)
      };
    } else {
      hubProps.labelers = {
        decimal: undefined,
      };
    }
    hub.wire.transmit(hubProps);
  }, [enableDecimalLabeler]);

  return (
    <main>
      <h1>GridSheet Preact Example</h1>
      
      <div class="grid-container">
        <GridSheet
          hub={hub}
          initialCells={{
            A1: { value: 'Hello' },
            B1: { value: 'Preact', style: { backgroundColor: '#448888'} },
            A2: { value: 123 },
            B2: { value: 456 },
            A3: { value: 789},
            C10: { value: '=SUM(A2:B2)' },
          }}
          options={{
            mode: 'dark',
          }}
          sheetName="Sheet1"
        />

        <GridSheet
          hub={hub}
          initialCells={{
            C3: { value: '=SUM(Sheet1!A2:B3)' },
            default: { labeler: 'decimal' },
          }}
          options={{}}
          sheetName="Sheet2"
        />
      </div>

      {/* Labeler Control */}
      <div class="labeler-control">
        <label>
          <input 
            type="checkbox" 
            checked={enableDecimalLabeler}
            onChange={(e) => setEnableDecimalLabeler(e.target.checked)}
          />
          Enable Decimal Labeler for Sheet2
        </label>
      </div>
    </main>
  );
}

export default App; 