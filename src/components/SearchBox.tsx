import { addressToPosition } from "../api/converters";
import React from "react";

import { Context } from "../store";
import { setSearchQuery, search } from "../store/actions";

export const SearchBox: React.FC = () => {
  const { store, dispatch } = React.useContext(Context);

  const {
    editorRef,
    searchInputRef,
    gridRef,
    searchQuery,
    matchingCellIndex,
    matchingCells,
  } = store;

  const matchingCell = matchingCells[matchingCellIndex];
  React.useEffect(() => {
    if (!matchingCell) {
      return;
    }
    const indexes = addressToPosition(matchingCell);
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
              editorRef.current?.focus();
              dispatch(setSearchQuery(undefined));
            }
            if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              return false;
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
          {matchingCells.length === 0 ? 0 : matchingCellIndex + 1} /{" "}
          {matchingCells.length}
        </div>
      </div>
      <div className="gs-search-close">
        <a onClick={() => dispatch(setSearchQuery(undefined))}>Close</a>
      </div>
    </div>
  );
};
