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
    <h1>GridSheet Vue Example</h1>
    <div class="grid-container">
      <GridSheet
        :hub="hub"
        :initialCells="{
          A1: { value: 'Hello' },
          B1: { value: 'Vue', style: { backgroundColor: '#448888'} },
          A2: { value: 123 },
          B2: { value: 456 },
          A3: { value: 789},
          C10: { value: '=SUM(A2:B2)' },
        }"
        :options="{
          mode: 'dark',
        }"
        sheetName="Sheet1"
      />

      <GridSheet
        :hub="hub"
        :initialCells="{
          C3: { value: '=SUM(Sheet1!A2:B3)' },
        }"
        :options="{}"
        sheetName="Sheet2"
      />
    </div>
  </main>
</template>

<script setup>
import { GridSheet, useHub } from '@gridsheet/vue-core';
const hub = useHub();
</script>
```

## Components

### GridSheet

The main spreadsheet component for Vue 3 applications.

**Props:**
- `hub` - Reactive hub for data binding and state management
- `initialCells` - Initial cell data with values, styles, and formulas
- `options` - GridSheet options (e.g., mode: 'dark')
- `sheetName` - Name of the sheet

### useHub

A Vue 3-specific composable for creating reactive hubs that can be used for data binding and state management.

## Exports

This package exports:

- All core GridSheet functionality from `@gridsheet/preact-core`
- `GridSheet` - Vue 3 component
- `useHub` - Vue 3-specific reactive hub composable

## Docs

- [GridSheet document](https://gridsheet.walkframe.com/)
- [Examples](https://gridsheet.walkframe.com/examples/case1)

## Development

```bash
# Start development server
pnpm dev

# Build the package
pnpm build

# Preview the build
pnpm preview
```

## License

Apache-2.0 