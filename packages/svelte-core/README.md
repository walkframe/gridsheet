# @gridsheet/svelte-core

Spreadsheet component for Svelte 5

## Installation

```bash
npm install @gridsheet/svelte-core @gridsheet/functions
```

### Peer Dependencies

This package requires the following peer dependency:

- `svelte` ^5.0.0

## Usage

```svelte
<script>
  import { GridSheet } from '@gridsheet/svelte-core';
  import { useSpellbook } from '@gridsheet/svelte-core/spellbook'; // requires @gridsheet/functions
  const book = useSpellbook();
</script>

<GridSheet
  {book}
  initialCells={{
    A1: { value: 'Hello' },
    B1: { value: 'Svelte', style: { backgroundColor: '#448888' } },
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
  {book}
  initialCells={{
    C3: { value: '=SUM(Sheet1!A2:B3)' },
  }}
  options={{}}
  sheetName="Sheet2"
/>
```

## Components

### GridSheet

The main spreadsheet component for Svelte 5 applications.

**Props:**
- `book` - Writable store for cross-sheet data binding and state management
- `initialCells` - Initial cell data with values, styles, and formulas
- `options` - GridSheet options (e.g., mode: 'dark')
- `sheetName` - Name of the sheet
- `sheetRef` - Ref object to access sheet handle
- `storeRef` - Ref object to access store handle
- `className` - CSS class name
- `style` - Inline styles

### useSpellbook

Creates a reactive book with all extended functions (`@gridsheet/functions`) pre-loaded. Returns a `Writable<BookType>`.

```js
import { useSpellbook } from '@gridsheet/svelte-core/spellbook'; // requires @gridsheet/functions
const book = useSpellbook({ /* RegistryProps */ });
```

### useBook

Same as `useSpellbook` but without extended functions.

```js
import { useBook } from '@gridsheet/svelte-core';
const book = useBook({ /* RegistryProps */ });
```

## Exports

This package exports:

- All core GridSheet functionality from `@gridsheet/preact-core`
- `GridSheet` - Svelte 5 component
- `useBook` - Svelte-specific reactive book using writable store
- `@gridsheet/svelte-core/spellbook` - `useSpellbook`, `createSpellbook`

## Docs

- [GridSheet document](https://gridsheet.walkframe.com/)
- [Examples](https://gridsheet.walkframe.com/examples/case1)

## Development

```bash
# Start development server
pnpm dev

# Build the package
pnpm build
```

## License

Apache-2.0
