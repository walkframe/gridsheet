import { StoreType, AreaType } from "../types";

import { zoneToArea } from "./matrix";
import { matrix2tsv } from "./converters";
import { solveMatrix } from "../formula/evaluator";

export const clip = (store: StoreType): AreaType => {
  const { selectingZone, choosing, editorRef, table } = store;
  const { y, x } = choosing;
  let selectingArea = zoneToArea(selectingZone);
  let area = selectingArea;
  if (area.left === -1) {
    area = { top: y, left: x, bottom: y, right: x };
  }
  const input = editorRef.current;
  const trimmed = table.trim(area);
  const matrix = solveMatrix(trimmed, table);
  const tsv = matrix2tsv(table, matrix, { y, x });
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
