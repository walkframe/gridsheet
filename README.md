[![NPM](https://nodei.co/npm/@gridsheet/react-core.png?mini=true)](https://www.npmjs.com/package/@gridsheet/react-core)

![unittest workflow](https://github.com/walkframe/gridsheet/actions/workflows/unittest.yaml/badge.svg?branch=master)
![e2e workflow](https://github.com/walkframe/gridsheet/actions/workflows/e2e.yaml/badge.svg?branch=master)

## Introduction

@gridsheet/react-core is a simple yet highly functional spreadsheet component for ReactJS.

![gridsheet](https://github.com/walkframe/gridsheet/raw/master/gridsheet.png)


### Supporting features

- Copy & Paste
- Cut & Paste
- Undo & Redo
- Add rows and columns
- Calculating formula
  - Refer to separate sheets.
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


- 1.0.0
  - It is now possible to refer to another sheet.
  - Formula bar.
  - Add E2E tests.

- 1.0.1
  - Bugfix: Cells referenced by formulas do not revert to their original state with undo.

- 1.0.2
  - Bugfix: AutoFill overwrites protected cells.

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fwalkframe%2Freact-gridsheet.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fwalkframe%2Freact-gridsheet?ref=badge_large)
