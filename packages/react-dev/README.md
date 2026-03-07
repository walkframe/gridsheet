# @gridsheet/react-dev

Development tools for [GridSheet](https://github.com/walkframe/gridsheet).

## Overview

`@gridsheet/react-dev` provides a `Debugger` component that gives you real-time visibility into the internal state of a GridSheet instance. It is intended for use during development only and should **not** be included in production builds.

## Installation

```bash
npm install --save-dev @gridsheet/react-dev
# or
pnpm add -D @gridsheet/react-dev
```

## Usage

Pass a `hub` object (created via `createConnector` from `@gridsheet/react-core`) to the `Debugger` component.

```tsx
import React from 'react';
import { GridSheet, createConnector } from '@gridsheet/react-core';
import { Debugger } from '@gridsheet/react-dev';

const hub = createConnector();

export default function App() {
  return (
    <>
      <GridSheet hub={hub} />
      <Debugger hub={hub} />
    </>
  );
}
```

## Props

### `Debugger`

| Prop         | Type      | Default | Description                                           |
|--------------|-----------|---------|-------------------------------------------------------|
| `hub`        | `HubType` | —       | The hub object connected to a `GridSheet` instance.   |
| `intervalMs` | `number`  | `500`   | Polling interval (ms) for refreshing the state view.  |

## Panel Layout

The `Debugger` renders a resizable panel divided into two rows:

### Top row (resizable height)

| Panel                  | Description                                                            |
|------------------------|------------------------------------------------------------------------|
| **Wire State**         | Snapshot of the shared wire state (choosing address, history, etc.).   |
| **Cell**               | Data of the currently selected cell (value, style, meta, etc.).        |
| **Formula Expressions**| Parsed AST of the formula in the selected cell (if any).               |
| **Formula Tokens**     | Tokenized result of the formula lexer for the selected cell (if any).  |

### Sheet tabs

Tabs to switch which sheet's internal data is shown in the bottom row.

### Bottom row (resizable height)

| Panel          | Description                                      |
|----------------|--------------------------------------------------|
| **Table Data** | Raw table instance data for the selected sheet.  |
| **Store Data** | Internal store state for the selected sheet.     |

Both rows can be resized by dragging the divider between them. Heights are persisted in `sessionStorage`.

## License

Apache-2.0
