import { useContext, useEffect, useRef, useCallback, useMemo } from 'react';

import { a2p, x2c, y2r } from '../lib/coords';
import { isZoneNotSelected } from '../lib/spatial';

import { Context } from '../store';
import { setSearchQuery, search, setSearchCaseSensitive, setSearchRegex, setSearchRange } from '../store/actions';
import { smartScroll } from '../lib/virtualization';
import { SearchIcon } from './svg/SearchIcon';
import { CloseIcon } from './svg/CloseIcon';
import { focus } from '../lib/dom';

export const SearchBar = () => {
  const { store, dispatch } = useContext(Context);
  const {
    rootRef,
    editorRef,
    searchInputRef,
    tabularRef,
    searchQuery,
    searchCaseSensitive,
    searchRegex,
    searchRange,
    selectingZone,
    matchingCellIndex,
    matchingCells,
    sheetReactive: sheetRef,
  } = store;
  const sheet = sheetRef.current;

  const matchingCell = matchingCells[matchingCellIndex];
  useEffect(() => {
    if (!matchingCell || !sheet) {
      return;
    }
    const point = a2p(matchingCell);
    if (typeof point === 'undefined') {
      return;
    }
    smartScroll(sheet, tabularRef.current, point);
  }, [searchQuery, matchingCellIndex, searchCaseSensitive, searchRegex, sheet, tabularRef]);

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const input = e.currentTarget.previousSibling as HTMLInputElement;
    input?.nodeName === 'INPUT' && focus(input);
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
          focus(el);
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

  const handleRegexClick = useCallback(() => {
    dispatch(setSearchRegex(!searchRegex));
  }, [searchRegex]);

  const hasSelection = useMemo(() => {
    if (!selectingZone) {
      return false;
    }
    if (isZoneNotSelected(selectingZone)) {
      return false;
    }
    const { startY, startX, endY, endX } = selectingZone;
    return !(startY === endY && startX === endX);
  }, [selectingZone]);

  const selectionLabel = useMemo(() => {
    if (!selectingZone || !hasSelection) {
      return '';
    }
    const { startY, startX, endY, endX } = selectingZone;
    const topLeft = `${x2c(Math.min(startX, endX))}${y2r(Math.min(startY, endY))}`;
    const bottomRight = `${x2c(Math.max(startX, endX))}${y2r(Math.max(startY, endY))}`;
    return `${topLeft}:${bottomRight}`;
  }, [selectingZone, hasSelection]);

  const handleRangeClick = useCallback(() => {
    if (searchRange) {
      // Clear search range
      dispatch(setSearchRange(undefined));
    } else if (selectingZone && hasSelection) {
      // Set search range to current selection
      const { startY, startX, endY, endX } = selectingZone;
      dispatch(
        setSearchRange({
          startY: Math.min(startY, endY),
          startX: Math.min(startX, endX),
          endY: Math.max(startY, endY),
          endX: Math.max(startX, endX),
        }),
      );
    }
  }, [searchRange, selectingZone, hasSelection]);

  const searchRangeLabel = useMemo(() => {
    if (!searchRange) {
      return '';
    }
    const { startY, startX, endY, endX } = searchRange;
    const topLeft = `${x2c(startX)}${y2r(startY)}`;
    const bottomRight = `${x2c(endX)}${y2r(endY)}`;
    return `${topLeft}:${bottomRight}`;
  }, [searchRange]);

  const handleCloseClick = useCallback(() => {
    dispatch(setSearchQuery(undefined));
    focus(editorRef.current);
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
      <div className="gs-search-input-wrapper">
        <div className="gs-search-input-ghost">
          <span className="gs-search-ghost-text">{searchQuery}</span>
          {searchQuery && <span className="gs-search-ghost-hint"> ↵ Next</span>}
        </div>
        <textarea
          ref={searchInputRef}
          value={searchQuery}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          title="Press Enter to next, Shift+Enter to previous"
        ></textarea>
      </div>
      <div className="gs-search-buttons">
        {searchRange && (
          <div className="gs-search-button gs-search-range">
            <span
              className="gs-search-button-on"
              onClick={handleRangeClick}
              title={`Search range: ${searchRangeLabel}`}
            >
              in {searchRangeLabel}
            </span>
          </div>
        )}
        {!searchRange && hasSelection && (
          <div className="gs-search-button gs-search-range">
            <span onClick={handleRangeClick} title={`Limit to range: ${selectionLabel}`}>
              in {selectionLabel}
            </span>
          </div>
        )}
        <div className="gs-search-button gs-search-casesensitive">
          <span
            className={`${searchCaseSensitive ? 'gs-search-button-on' : ''}`}
            onClick={handleCaseSensitiveClick}
            title={`Case sensitive`}
          >
            Aa
          </span>
        </div>
        <div className="gs-search-button gs-search-regex">
          <span
            className={`${searchRegex ? 'gs-search-button-on' : ''}`}
            onClick={handleRegexClick}
            title={`Regular expression`}
          >
            .*
          </span>
        </div>
      </div>
      <a className="gs-search-close" onClick={handleCloseClick}>
        <CloseIcon style={{ verticalAlign: 'middle' }} />
      </a>
    </label>
  );
};
