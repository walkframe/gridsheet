# @gridsheet/vue-core

Spreadsheet component for Vue 3

## Installation

```bash
npm install @gridsheet/vue-core
```

### Peer Dependencies

This package requires the following peer dependency:

- `vue` ^3.3.0

## Usage

```vue
<template>
  <main>
    <GridSheet
      :book="book"
      :initialCells="{
        A1: { value: 'Hello' },
        B1: { value: 'Vue', style: { backgroundColor: '#448888'} },
        A2: { value: 123 },
        B2: { value: 456 },
        A3: { value: 789},
        C6: { value: '=SUM(A2:B2)' },
      }"
      :options="{
        mode: 'dark',
      }"
      sheetName="Sheet1"
    />

    <GridSheet
      :book="book"
      :initialCells="{
        C3: { value: '=SUM(Sheet1!A2:B3)' },
      }"
      :options="{}"
      sheetName="Sheet2"
    />
  </main>
</template>

<script setup>
import { GridSheet, useBook } from '@gridsheet/vue-core';
const book = useBook();
</script>
```

### With Extended Functions (Spellbook)

```vue
<script setup>
import { GridSheet } from '@gridsheet/vue-core';
import { useSpellbook } from '@gridsheet/vue-core/spellbook';
const book = useSpellbook();
</script>
```

## Components

### GridSheet

The main spreadsheet component for Vue 3 applications.

**Props:**
- `book` - Book object for cross-sheet data binding and state management
- `initialCells` - Initial cell data with values, styles, and formulas
- `options` - GridSheet options (e.g., mode: 'dark')
- `sheetName` - Name of the sheet
- `sheetRef` - Ref object to access sheet handle
- `storeRef` - Ref object to access store handle
- `className` - CSS class name
- `style` - Inline styles

### useBook

A Vue 3-specific composable for creating a reactive book. Returns a `shallowRef<BookType>`.

```js
import { useBook } from '@gridsheet/vue-core';
const book = useBook({ /* RegistryProps */ });
```

### useSpellbook

Same as `useBook` but with all extended functions (`@gridsheet/functions`) pre-loaded.

```js
import { useSpellbook } from '@gridsheet/vue-core/spellbook';
const book = useSpellbook({ /* RegistryProps */ });
```

## Exports

This package exports:

- All core GridSheet functionality from `@gridsheet/preact-core`
- `GridSheet` - Vue 3 component
- `useBook` - Vue 3-specific reactive book composable
- `@gridsheet/vue-core/spellbook` - `useSpellbook`, `createSpellbook`

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
