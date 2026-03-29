import { useState, useEffect } from 'preact/hooks';
import { GridSheet, Policy } from '@gridsheet/preact-core';
import { useSpellbook } from '@gridsheet/preact-core/spellbook';

export function App() {
  const [enableDecimalLabeler, setEnableDecimalLabeler] = useState(false);

  const bookProps = {
    policies: {},
  };
  const book = useSpellbook(bookProps);

  useEffect(() => {
    bookProps.policies.decimal = enableDecimalLabeler
      ? new Policy({ mixins: [{ renderRowHeaderLabel: (n) => String(n) }] })
      : null;
    book.registry.transmit(bookProps);
  }, [enableDecimalLabeler]);

  setTimeout(() => {
    console.log('Current policies:', book.registry);
  }, 5000);

  return (
    <main>
      <div class="grid-container">
        <GridSheet
          book={book}
          initialCells={{
            A1: { value: 'Hello' },
            B1: { value: 'Preact', style: { backgroundColor: '#6F51A1' } },
            A2: { value: 123 },
            B2: { value: 456 },
            A3: { value: 789 },
            C6: { value: '=SUM(A2:B2)' },
          }}
          options={{
            mode: 'dark',
          }}
          sheetName="Sheet1"
        />
        <br />
        <GridSheet
          book={book}
          initialCells={{
            C3: { value: '=SUM(Sheet1!A2:B3)' },
            defaultCol: { policy: 'decimal' },
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
