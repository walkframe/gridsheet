![unittest workflow](https://github.com/walkframe/gridsheet/actions/workflows/unittest.yaml/badge.svg?branch=master)
[![NPM](https://nodei.co/npm/@gridsheet/react-core.png?mini=true)](https://www.npmjs.com/package/@gridsheet/react-core)

## Introduction

@gridsheet/react-core is a simple yet highly functional spreadsheet component for ReactJS.

![gridsheet](https://github.com/walkframe/gridsheet/raw/master/gridsheet.png)


### Supporting features

- Copy & Paste
- Cut & Paste
- Undo & Redo
- Add rows and columns
- Displaying formulas
- Cell styling
- Custom renderer
- Custom parser
- Basic shortcut keys
- Context menu
- External data manipulation
- Autofill
- Protection

## Installation

```sh
$ npm install @gridsheet/react-core --save
```

## Docs

- [ReactGridsheet document](https://docs.walkframe.com/products/gridsheet/react/)
- [Examples](https://docs.walkframe.com/products/gridsheet/examples/)

## History

- 0.3.x
  - BREAKING CHANGE: `renderers` and `parsers` in options got to receive theirs instances.
    - See examples for details.

- 0.4.x:
  - BREAKING CHANGE: dropped `stickyHeaders` option.

- 0.5.x:
  - Quit using redux.

- 0.6.x:

  - Change data structure.

    - data prop was dropped.

- 0.7.x
  - Support formula.

- 0.8.x
  - Improve ref handling on formula.
    - Add and absolute ref.
  - Change table operation.
    - Get/Set data through tableRef.
    - Dropped changes option.

- 0.9.x
  - Add addRowsAndUpdate and addColsAndUpdate method on UserTable.
  - Drop styled-components

- 0.10.x
  - Drop react-window
  - Add tests.
  - BREAKING CHANGE:
      - cell.verticalAlign -> cell.alignItems.
      - constructInitialCells's arg matrixes -> matrices.

- 0.11.x
  - Support Autofill.
  - Support renderer mixin and parser mixin.
  - Add TimeDelta class.
  - Renaming to https://www.npmjs.com/package/@gridsheet/react-core 

- 0.12.x
  - Renamed from https://www.npmjs.com/package/react-gridsheet

- 0.13.x
  - Support Protection.

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fwalkframe%2Freact-gridsheet.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fwalkframe%2Freact-gridsheet?ref=badge_large)
