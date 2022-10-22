import { StoreType, AreaType } from "../types";

import { zoneToArea } from "./structs";
import { matrix2tsv } from "./converters";
import { solveTable } from "../formula/evaluator";

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
  const matrix = solveTable(trimmed);
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
