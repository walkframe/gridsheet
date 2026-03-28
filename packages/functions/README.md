# @gridsheet/functions

Extended formula functions for [@gridsheet/react-core](https://www.npmjs.com/package/@gridsheet/react-core).

## Installation

```bash
npm install @gridsheet/functions
# or
pnpm add @gridsheet/functions
```

## Usage

### `useSpellbook` — recommended

Drop-in replacement for `useBook` with all extended functions pre-loaded.

```tsx
import { GridSheet } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/functions';

export default function App() {
  const book = useSpellbook();
  return <GridSheet book={book} />;
}
```

Custom functions are merged on top of the built-ins:

```tsx
const book = useSpellbook({
  additionalFunctions: {
    double: MyDoubleFunction,
  },
});
```

### `createSpellbook` — for non-hook contexts

Same as `useSpellbook` but usable outside of React components (e.g. SSR, server-side initialization).

```ts
import { createSpellbook } from '@gridsheet/functions';

const book = createSpellbook();
```

### `allFunctions` — manual registration

If you prefer to register functions yourself via `useBook` / `createBook`:

```tsx
import { useBook } from '@gridsheet/react-core';
import { allFunctions } from '@gridsheet/functions';

const book = useBook({
  additionalFunctions: allFunctions,
});
```

Or import only the category you need:

```ts
import { mathFunctions } from '@gridsheet/functions/math';
import { textFunctions } from '@gridsheet/functions/text';
import { lookupFunctions } from '@gridsheet/functions/lookup';
import { statisticsFunctions } from '@gridsheet/functions/statistics';
import { timeFunctions } from '@gridsheet/functions/time';
import { logicalFunctions } from '@gridsheet/functions/logical';
```

## License

Apache-2.0
