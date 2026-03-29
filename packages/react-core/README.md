[![NPM](https://nodei.co/npm/@gridsheet/react-core.png?mini=true)](https://www.npmjs.com/package/@gridsheet/react-core)

![unittest workflow](https://github.com/walkframe/gridsheet/actions/workflows/unittest.yaml/badge.svg?branch=master)
![e2e workflow](https://github.com/walkframe/gridsheet/actions/workflows/e2e.yaml/badge.svg?branch=master)

## Introduction

@gridsheet/react-core is a lightweight and extensible spreadsheet component for React with formula support, custom rendering, and real-time updates.

![gridsheet](https://github.com/walkframe/gridsheet/raw/master/gridsheet.png)


## Installation

```sh
npm install @gridsheet/react-core @gridsheet/functions
```

## Usage

```tsx
import { GridSheet } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook'; // requires @gridsheet/functions

function App() {
  const book = useSpellbook();
  return (
    <>
      <GridSheet
        book={book}
        initialCells={{
          A1: { value: 'Hello' },
          B1: { value: 'React', style: { backgroundColor: '#61DBFB' } },
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
        book={book}
        initialCells={{
          C3: { value: '=SUM(Sheet1!A2:B3)' },
        }}
        options={{}}
        sheetName="Sheet2"
      />
    </>
  );
}
```

## Docs

- [GridSheet document](https://gridsheet.walkframe.com/)
- [Examples](https://gridsheet.walkframe.com/examples/case1)

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fwalkframe%2Freact-gridsheet.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fwalkframe%2Freact-gridsheet?ref=badge_large)

