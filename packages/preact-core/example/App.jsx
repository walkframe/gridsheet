import { useState, useRef } from 'preact/hooks';
import { GridSheet, Policy } from '@gridsheet/preact-core';
import { useSpellbook } from '@gridsheet/preact-core/spellbook';

export function App() {
  const [enableDecimalLabeler, setEnableDecimalLabeler] = useState(false);

  const bookPropsRef = useRef({ policies: {} });
  const book = useSpellbook(bookPropsRef.current);

  const handleToggle = (e) => {
    const checked = e.target.checked;
    setEnableDecimalLabeler(checked);
    bookPropsRef.current.policies.decimal = checked
      ? new Policy({ mixins: [{ renderColHeaderLabel: (n) => String(n) }] })
      : null;
    book.registry.transmit(bookPropsRef.current);
  };

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
            onChange={handleToggle}
          />
          Enable Decimal Labeler for Sheet2
        </label>
      </div>
    </main>
  );
}

export default App;
