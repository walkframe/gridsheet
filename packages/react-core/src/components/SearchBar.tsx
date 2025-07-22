import { useContext, useEffect, useRef, useCallback } from 'react';

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
    tableReactive: tableRef,
  } = store;
  const table = tableRef.current;

  const matchingCell = matchingCells[matchingCellIndex];
  useEffect(() => {
    if (!matchingCell || !table) {
      return;
    }
    const point = a2p(matchingCell);
    if (typeof point === 'undefined') {
      return;
    }
    smartScroll(table, tabularRef.current, point);
  }, [searchQuery, matchingCellIndex, searchCaseSensitive, table, tabularRef]);

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const input = e.currentTarget.previousSibling as HTMLInputElement;
    input?.nodeName === 'INPUT' && input.focus();
  }, []);

  const handleSearchClick = useCallback(() => {
    dispatch(search(1));
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setSearchQuery(e.currentTarget.value));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    },
    [editorRef],
  );

  const handleCaseSensitiveClick = useCallback(() => {
    dispatch(setSearchCaseSensitive(!searchCaseSensitive));
  }, [searchCaseSensitive]);

  const handleCloseClick = useCallback(() => {
    dispatch(setSearchQuery(undefined));
    editorRef.current?.focus();
  }, [editorRef]);

  if (typeof searchQuery === 'undefined') {
    return null;
  }
  if (rootRef.current === null) {
    return null;
  }
  return (
    <label className={`gs-search-bar ${matchingCells.length > 0 ? 'gs-search-found' : ''}`}>
      <div className="gs-search-progress" onClick={handleProgressClick}>
        {matchingCells.length === 0 ? 0 : matchingCellIndex + 1} / {matchingCells.length}
      </div>
      <div className="gs-search-bar-icon" onClick={handleSearchClick}>
        <SearchIcon style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
      </div>
      <textarea ref={searchInputRef} value={searchQuery} onChange={handleChange} onKeyDown={handleKeyDown}></textarea>
      <div className={`gs-search-casesensitive`}>
        <span
          className={`${searchCaseSensitive ? 'gs-search-casesensitive-on' : ''}`}
          onClick={handleCaseSensitiveClick}
        >
          Aa
        </span>
      </div>
      <a className="gs-search-close" onClick={handleCloseClick}>
        <CloseIcon style={{ verticalAlign: 'middle' }} />
      </a>
    </label>
  );
};
