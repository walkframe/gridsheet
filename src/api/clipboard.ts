import {
  AreaType, ZoneType,
  MatrixType,
  PositionType,
} from "../types";

import {
  cropMatrix,
  draggingToArea,
} from "./arrays";
import { convertArrayToTSV, convertTSVToArray} from "./converters";
import { RendererType } from "../renderers/core";

export const clip = (
  selecting: ZoneType, choosing: PositionType, matrix: MatrixType,
  clipboardRef: React.RefObject<HTMLTextAreaElement>,
  renderer: RendererType,
): ZoneType => {
  const [y, x] = choosing;
  let selectingArea = draggingToArea(selecting);
  let area = selectingArea;
  if (area[0] === -1) {
    area = [y, x, y, x];
  }
  const input = clipboardRef.current;
  const copyingRows = cropMatrix(matrix, area);
  const tsv = convertArrayToTSV(copyingRows, renderer);
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
