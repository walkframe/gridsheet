import { ZoneType, StoreType } from "../types";

import { zoneToArea } from "./matrix";
import { matrix2tsv } from "./converters";
import { solveMatrix } from "../formula/evaluator";

export const clip = (store: StoreType): ZoneType => {
  const { selectingZone, choosing, editorRef, table } = store;
  const [y, x] = choosing;
  let selectingArea = zoneToArea(selectingZone);
  let area = selectingArea;
  if (area[0] === -1) {
    area = [y, x, y, x];
  }
  const input = editorRef.current;
  const target = table.trim(area);
  const matrix = solveMatrix(target, table);
  const tsv = matrix2tsv(store, y, x, matrix);
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
