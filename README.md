[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fwalkframe%2Freact-gridsheet.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fwalkframe%2Freact-gridsheet?ref=badge_shield)
[![NPM](https://nodei.co/npm/react-gridsheet.png?mini=true)](https://www.npmjs.com/package/react-gridsheet)

## Introduction

react-gridsheet is a simple yet highly functional spreadsheet component for ReactJS.

<img src="https://github.com/walkframe/react-gridsheet/raw/master/gridsheet.png" alt="gridsheet image" />

### Supporting features

- Copy & Paste
- Cut & Paste
- Add rows and columns
- Displaying formulas
- Cell styling
- Custom renderer
- Custom parser
- Undo & Redo
- Basic Shortcut keys
- Context menus
- External Data Manipulation

## Installation

```sh
$ npm install react-gridsheet --save
```

```sh
$ yarn add react-gridsheet
```
## Docs

- [ReactGridsheet document](https://docs.walkframe.com/products/react-gridsheet/)
- [Examples](https://docs.walkframe.com/products/react-gridsheet/examples/)

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

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fwalkframe%2Freact-gridsheet.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fwalkframe%2Freact-gridsheet?ref=badge_large)
