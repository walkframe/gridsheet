# @gridsheet/preact-core

Spreadsheet component for Preact

## Installation

```bash
npm install @gridsheet/preact-core
```

### Peer Dependencies

This package requires the following peer dependencies:

- `preact` ^10.26.6
- `dayjs` ^1.11.13

## Usage

### Basic Preact Component

```tsx
import { GridSheet } from '@gridsheet/preact-core';

// Your Preact component
function App() {
  return (
    <GridSheet />
  );
}

render(<App />, document.getElementById('app'));
```

### Vanilla JavaScript Integration

```javascript
import { GridSheet, h, render } from '@gridsheet/preact-core';

// Create a container element
const container = document.getElementById('gridsheet');

// Render GridSheet directly
render(
  h(GridSheet, {
    initialCells: {
      A1: { value: 'Hello' },
      B1: { value: 'Vanilla JS', style: { backgroundColor: '#448888'} },
      A2: { value: 123 },
      B2: { value: 456 },
      C10: { value: '=SUM(A2:B2)' },
    },
    options: {
      mode: 'dark',
    },
    sheetName: 'Sheet1'
  }),
  container
);
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
