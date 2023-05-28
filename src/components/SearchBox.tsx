import { a2p } from "../lib/converters";
import React from "react";

import { Context } from "../store";
import { setSearchQuery, search } from "../store/actions";
import {smartScroll} from "../lib/virtualization";

export const SearchBox: React.FC = () => {
  const { store, dispatch } = React.useContext(Context);

  const {
    editorRef,
    searchInputRef,
    gridOuterRef,
    searchQuery,
    matchingCellIndex,
    matchingCells,
    table,
  } = store;

  const matchingCell = matchingCells[matchingCellIndex];
  React.useEffect(() => {
    if (!matchingCell) {
      return;
    }
    const point = a2p(matchingCell);
    if (typeof point === "undefined") {
      return;
    }
    if (gridOuterRef.current) {
      smartScroll(table, gridOuterRef.current, point);
    }
  }, [searchQuery, matchingCellIndex]);

  if (typeof searchQuery === "undefined") {
    return null;
  }
  return (
    <div className="gs-search">
      <div
        className="gs-searchbox"
        title={"Press 'Enter' to next, 'Enter + Shift' to previous."}
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
