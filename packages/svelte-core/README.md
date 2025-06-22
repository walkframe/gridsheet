# @gridsheet/svelte-core

Spreadsheet component for Svelte

## Installation

```bash
npm install @gridsheet/svelte-core
```

## Peer Dependencies

This package requires the following peer dependency:

- `svelte` ^4.0.0

## Usage

```svelte
<script>
import { GridSheet, useHubReactive } from '@gridsheet/svelte-core';
const hubReactiveStore = useHubReactive();
</script>

<main>
  <h1>GridSheet Svelte Example</h1>
  <div class="grid-container">
    <GridSheet
      hubReactive={$hubReactiveStore}
      initialCells={{
        A1: { value: 'Hello' },
        B1: { value: 'Svelte', style: { backgroundColor: '#FF8800'} },
        A2: { value: 123 },
        B2: { value: 456 },
        A3: { value: 789},
        C10: { value: '=SUM(A2:B2)' },
      }}
      sheetName="Sheet1"
    />
    <GridSheet
      hubReactive={$hubReactiveStore}
      initialCells={{
        C3: { value: '=SUM(Sheet1!A2:B3)' },
      }}
      options={{
        mode: 'dark',
      }}
      sheetName="Sheet2"
    />
  </div>
</main>
```

## Components

### GridSheet

The main spreadsheet component for Svelte applications.

**Props:**
- `hubReactive` - Reactive hub store for data binding and state management
- `initialCells` - Initial cell data with values, styles, and formulas
- `options` - GridSheet options (e.g., mode: 'dark')
- `sheetName` - Name of the sheet

### useHubReactive

A Svelte-specific hook for creating reactive hubs that can be used for data binding and state management. Returns a Svelte store.

## Exports

This package exports:

- All core GridSheet functionality from `@gridsheet/preact-core`
- `GridSheet` - Svelte component
- `useHubReactive` - Svelte-specific reactive hub hook

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