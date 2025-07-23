# ⚠️ DEPRECATION NOTICE

**@gridsheet/react-right-menu is deprecated and will no longer be maintained.**

- Do not use this package for new projects.
- Please consider using the core package (`@gridsheet/react-core`) or other alternatives for right-click menu functionality.

---

![unittest workflow](https://github.com/walkframe/gridsheet/actions/workflows/unittest.yaml/badge.svg?branch=master)
![e2e workflow](https://github.com/walkframe/gridsheet/actions/workflows/e2e.yaml/badge.svg?branch=master)

![gridsheet-right-menu](https://github.com/walkframe/gridsheet/raw/master/packages/react-right-menu/gridsheet-right-menu.png)

## Installation

```sh
$ npm install @gridsheet/react-right-menu --save
```

## Usage

```jsx
import { GridSheet } from "@gridsheet/react-core";
import { RightMenu } from '@gridsheet/react-right-menu';

const Component => () => {
  return (
    <RightMenu>
      <GridSheet
        initialCells={{
          cells: {
            A1: { value: 1 },
            B1: { value: 2 },
            C1: { value: 3 },
            A2: { value: 4 },
            B2: { value: 5 },
            C2: { value: 6 },
          }
        }}
      />
    </RightMenu>
  );
};
```