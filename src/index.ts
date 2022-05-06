export { GridSheet } from "./components/GridSheet";
export { Renderer } from "./renderers/core";
export { Parser } from "./parsers/core";
export { oa2aa, aa2oa, matrixIntoCells } from "./api/matrix";
export { n2a, a2n, x2c, y2r, xy2cell, tsv2matrix } from "./api/converters";
export {
  MatrixType,
  DataType,
  CellType,
  Feedback,
  OptionsType,
  WriterType,
  CellsType,
} from "./types";
export { ThousandSeparatorRenderer } from "./renderers/thousand_separator";
export { BaseFunction } from "./formula/functions/__base";

import pkg from "../package.json";
console.debug(`react-gridsheet@${pkg.version} is working.`);
