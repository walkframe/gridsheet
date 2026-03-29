# @gridsheet/preact-core

Spreadsheet component for Preact

## Installation

```bash
npm install @gridsheet/preact-core @gridsheet/functions
```

### Peer Dependencies

This package requires the following peer dependencies:

- `preact` ^10.26.6
- `dayjs` ^1.11.13

## Usage

```tsx
import { GridSheet } from '@gridsheet/preact-core';
import { useSpellbook } from '@gridsheet/preact-core/spellbook'; // requires @gridsheet/functions

function App() {
  const book = useSpellbook();
  return (
    <>
      <GridSheet
        book={book}
        initialCells={{
          A1: { value: 'Hello' },
          B1: { value: 'Preact', style: { backgroundColor: '#448888' } },
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
      <GridSheet
        book={book}
        initialCells={{
          C3: { value: '=SUM(Sheet1!A2:B3)' },
        }}
        options={{}}
        sheetName="Sheet2"
      />
    </>
  );
}
```

## Exports

This package exports all the core GridSheet functionality along with Preact compatibility layer. It includes:

- All React compatibility exports from `preact/compat`
- Core GridSheet components and utilities
- Preact-specific exports (`h`, `render`)

## Docs

- [GridSheet document](https://gridsheet.walkframe.com/)
- [Examples](https://gridsheet.walkframe.com/examples/case1)

## Development

```bash
# Build the package
pnpm build
```

## License

Apache-2.0
