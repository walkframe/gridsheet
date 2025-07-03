# @gridsheet/svelte-core

GridSheet component for Svelte 5.

## Installation

```bash
pnpm add @gridsheet/svelte-core
```

## Usage

```svelte
<script>
  import { GridSheet } from '@gridsheet/svelte-core';

  const initialCells = {
    A1: { value: 'Hello' },
    B1: { value: 'Svelte' },
    A2: { value: 123 },
    B2: { value: 456 },
    C10: { value: '=SUM(A2:B2)' },
  };
</script>

<GridSheet
  {initialCells}
  sheetName="Sheet1"
  options={{
    mode: 'dark',
  }}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `initialCells` | `CellsByAddressType` | Yes | - | Initial cell data |
| `sheetName` | `string` | No | `''` | Name of the sheet |
| `hub` | `HubType` | No | `null` | Hub instance for cross-sheet communication |
| `tableRef` | `RefObject<TableRef \| null>` | No | `null` | Reference to the table instance |
| `options` | `OptionsType` | No | `{}` | GridSheet options |
| `className` | `string` | No | `''` | CSS class name |
| `style` | `Record<string, any>` | No | `{}` | Inline styles |

## Example

See the `example/` directory for a complete working example.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build the package
pnpm build
``` 