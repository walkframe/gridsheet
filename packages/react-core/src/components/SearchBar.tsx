
import { createContext, ReactNode } from 'react';
import { useContext, useEffect, useState, useRef, useReducer } from 'react';

import { a2p } from '../lib/converters';


import { Context } from '../store';
import { setSearchQuery, search, setSearchCaseSensitive } from '../store/actions';
import { smartScroll } from '../lib/virtualization';
import { SearchIcon } from './svg/SearchIcon';
import { CloseIcon } from './svg/CloseIcon';

export const SearchBar = () => {
  const { store, dispatch } = useContext(Context);
  const {
    rootRef,
    editorRef,
    searchInputRef,
    tabularRef,
    searchQuery,
    searchCaseSensitive,
    matchingCellIndex,
    matchingCells,
    table,
  } = store;

  const matchingCell = matchingCells[matchingCellIndex];
  useEffect(() => {
    if (!matchingCell) {
      return;
    }
    const point = a2p(matchingCell);
    if (typeof point === 'undefined') {
      return;
    }
    smartScroll(table, tabularRef.current, point);
  }, [searchQuery, matchingCellIndex, searchCaseSensitive]);

  if (typeof searchQuery === 'undefined') {
    return null;
  }
  if (rootRef.current === null) {
    return null;
  }
  return (
    <label className={`gs-search-bar ${matchingCells.length > 0 ? 'gs-search-found' : ''}`}>
      <div
        className="gs-search-progress"
        onClick={(e) => {
          const input = e.currentTarget.previousSibling as HTMLInputElement;
          input?.nodeName === 'INPUT' && input.focus();
        }}
      >
        {matchingCells.length === 0 ? 0 : matchingCellIndex + 1} / {matchingCells.length}
      </div>
      <div className="gs-search-bar-icon" onClick={() => dispatch(search(1))}>
        <SearchIcon style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
      </div>
      <textarea
        ref={searchInputRef}
        value={searchQuery}
        onChange={(e) => dispatch(setSearchQuery(e.currentTarget.value))}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            const el = editorRef?.current;
            if (el) {
              el.focus();
            }
            dispatch(setSearchQuery(undefined));
          }
          if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            return false;
          }
          if (e.key === 'Enter') {
            dispatch(search(e.shiftKey ? -1 : 1));
            e.preventDefault();
            return false;
          }
          return true;
        }}
      ></textarea>
      <div className={`gs-search-casesensitive`}>
        <span
          className={`${searchCaseSensitive ? 'gs-search-casesensitive-on' : ''}`}
          onClick={() => dispatch(setSearchCaseSensitive(!searchCaseSensitive))}
        >
          Aa
        </span>
      </div>
      <a
        className="gs-search-close"
        onClick={() => {
          dispatch(setSearchQuery(undefined));
          editorRef.current?.focus();
        }}
      >
        <CloseIcon style={{ verticalAlign: 'middle' }} />
      </a>
    </label>
  );
};
