# @gridsheet/react-dev

Development tools for [GridSheet](https://github.com/walkframe/gridsheet).

> **Note:** Intended for use during development only. Do not include in production builds.

## Installation

```bash
npm install --save-dev @gridsheet/react-dev
# or
pnpm add -D @gridsheet/react-dev
```

## Usage

Pass a `book` object (created via `useBook` from `@gridsheet/react-core`) to the `Debugger` component.

```tsx
import React from 'react';
import { GridSheet, useBook } from '@gridsheet/react-core';
import { Debugger } from '@gridsheet/react-dev';

export default function App() {
  const book = useBook();
  return (
    <>
      <GridSheet book={book} />
      <Debugger book={book} />
    </>
  );
}
```

## Props

### `Debugger`

| Prop         | Type       | Default | Description                                          |
|--------------|------------|---------|------------------------------------------------------|
| `book`       | `BookType` | —       | The book object connected to a `GridSheet` instance. |
| `intervalMs` | `number`   | `500`   | Polling interval (ms) for refreshing the state view. |

## License

Apache-2.0
