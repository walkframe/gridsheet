import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { cellToIndexes } from "../api/arrays";
import { Context } from "./GridSheet";
import { setSearchQuery, search } from "../store/inside";

import { RootState } from "../store";
import { InsideState } from "../types";

export const SearchBox: React.FC = () => {
  const dispatch = useDispatch();

  const { searchInputRef, gridRef } = React.useContext(Context);
  const { searchQuery, matchingCellIndex, matchingCells } = useSelector<
    RootState,
    InsideState
  >((state) => state["inside"]);

  const matchingCell = matchingCells[matchingCellIndex];
  React.useEffect(() => {
    if (!matchingCell) {
      return;
    }
    const indexes = cellToIndexes(matchingCell);
    if (typeof indexes === "undefined") {
      return;
    }
    const [rowIndex, columnIndex] = indexes;
    gridRef.current?.scrollToItem({ rowIndex, columnIndex, align: "auto" });
  }, [matchingCell]);

  if (typeof searchQuery === "undefined") {
    return null;
  }
  return (
    <div className="gs-search">
      <div
        className="gs-searchbox"
        title={"Press 'Enter' to next, 'Enter + Shift' to previos."}
      >
        <input
          type="text"
          ref={searchInputRef}
          value={searchQuery}
          placeholder="Search"
          autoFocus
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              dispatch(setSearchQuery(undefined));
            }
            if (e.key !== "Enter") {
              return true;
            }
            dispatch(search(e.shiftKey ? -1 : 1));
            return false;
          }}
        />
        <div
          className="gs-search-progress"
          onClick={(e) => {
            const input = e.currentTarget.previousSibling as HTMLInputElement;
            input?.nodeName === "INPUT" && input.focus();
          }}
        >
          {matchingCellIndex + 1} / {matchingCells.length}
        </div>
      </div>
      <div className="gs-search-close">
        <a onClick={() => dispatch(setSearchQuery(undefined))}>Close</a>
      </div>
    </div>
  );
};
