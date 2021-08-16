import { ZoneType, MatrixType, PositionType, CellsOptionType, Renderers } from "../types";

import { cropMatrix, zoneToArea } from "./arrays";
import { matrix2tsv } from "./converters";

export const clip = (
  selecting: ZoneType,
  choosing: PositionType,
  matrix: MatrixType,
  clipboardRef: React.RefObject<HTMLTextAreaElement>,
  cellsOption: CellsOptionType,
  renderers: Renderers,
): ZoneType => {
  const [y, x] = choosing;
  let selectingArea = zoneToArea(selecting);
  let area = selectingArea;
  if (area[0] === -1) {
    area = [y, x, y, x];
  }
  const input = clipboardRef.current;
  const copyingRows = cropMatrix(matrix, area);
  const tsv = matrix2tsv(y, x, copyingRows, cellsOption, renderers);
  if (input != null) {
    input.value = tsv;
    input.focus();
    input.select();
    document.execCommand("copy");
    input.value = "";
    input.blur();
  }
  return area;
};
