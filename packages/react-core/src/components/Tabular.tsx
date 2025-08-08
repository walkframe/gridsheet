import { useEffect, useContext, useRef, useState, createRef, useCallback, RefObject } from 'react';

import { Cell } from './Cell';
import { HeaderCellTop } from './HeaderCellTop';
import { HeaderCellLeft } from './HeaderCellLeft';

import { Context } from '../store';
import { choose, select, updateTable } from '../store/actions';

import type { RefPaletteType, PointType, StoreType, Connector, Virtualization } from '../types';
import { virtualize } from '../lib/virtualization';
import { a2p, p2a, stripAddressAbsolute } from '../lib/converters';
import { zoneToArea } from '../lib/structs';
import { Lexer, stripSheetName } from '../formula/evaluator';
import { COLOR_PALETTE } from '../lib/palette';
import { Autofill } from '../lib/autofill';
import { ScrollHandle } from './ScrollHandle';

export const Tabular = () => {
  const [palette, setPalette] = useState<RefPaletteType>({});
  const { store, dispatch } = useContext(Context);
  const {
    tableReactive,
    choosing,
    editingAddress,
    tabularRef,
    mainRef,
    sheetWidth,
    sheetHeight,
    inputting,
    leftHeaderSelecting,
    topHeaderSelecting,
  } = store;
  const table = tableReactive.current;

  const [virtualized, setVirtualized] = useState<Virtualization | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (table) {
        setVirtualized(virtualize(table, e.currentTarget));
      }
    },
    [tableReactive],
  );

  const handleSelectAllClick = useCallback(() => {
    if (!table) {
      return;
    }
    dispatch(choose({ y: -1, x: -1 }));
    requestAnimationFrame(() => {
      dispatch(choose({ y: 1, x: 1 }));
      dispatch(
        select({
          startY: 1,
          startX: 1,
          endY: table.getNumRows(),
          endX: table.getNumCols(),
        }),
      );
    });
  }, [tableReactive]);

  useEffect(() => {
    if (!table) {
      return;
    }
    const formulaEditing = editingAddress && inputting.startsWith('=');
    if (!formulaEditing) {
      setPalette({});
      table.wire.paletteBySheetName = {};
      return;
    }
    const palette: RefPaletteType = {};
    const paletteBySheetName: { [sheetName: string]: RefPaletteType } = {};
    const lexer = new Lexer(inputting.substring(1));
    lexer.tokenize();

    let i = 0;
    for (const token of lexer.tokens) {
      if (token.type === 'REF' || token.type === 'RANGE') {
        const normalizedRef = stripAddressAbsolute(token.stringify());
        const splitterIndex = normalizedRef.indexOf('!');
        if (splitterIndex !== -1) {
          const sheetName = normalizedRef.substring(0, splitterIndex);
          const ref = normalizedRef.substring(splitterIndex + 1);
          const stripped = stripSheetName(sheetName);
          const upperRef = ref.toUpperCase();
          if (paletteBySheetName[stripped] == null) {
            paletteBySheetName[stripped] = {};
          }
          if (paletteBySheetName[stripped][upperRef] == null) {
            paletteBySheetName[stripped][upperRef] = i++;
          }
        } else {
          const upperRef = normalizedRef.toUpperCase();
          if (palette[upperRef] == null) {
            palette[upperRef] = i++;
          }
        }
      }
    }
    setPalette(palette);
    table.wire.paletteBySheetName = paletteBySheetName;
  }, [store.inputting, store.editingAddress, tableReactive]);

  useEffect(() => {
    if (!table) {
      return;
    }
    table.wire.choosingAddress = p2a(choosing);
  }, [choosing]);

  useEffect(() => {
    if (!table) {
      return;
    }
    setVirtualized(virtualize(table, tabularRef.current));
  }, [tabularRef.current, tableReactive, mainRef.current?.clientHeight, mainRef.current?.clientWidth]);

  if (!table || !table.wire.ready) {
    return null;
  }

  const operationStyles = useOperationStyles(store, {
    ...palette,
    ...table.wire.paletteBySheetName[table.sheetName],
  });

  return (
    <>
      <div
        className="gs-tabular"
        style={{
          width: sheetWidth === -1 ? undefined : sheetWidth,
          height: sheetHeight === -1 ? undefined : sheetHeight,
        }}
        ref={tabularRef}
        onMouseMove={handleMouseMove}
        onScroll={handleScroll}
      >
        <div
          className={'gs-tabular-inner'}
          style={{
            width: table.totalWidth + 1,
            height: table.totalHeight + 1,
          }}
        >
          <table className={`gs-table`}>
            <thead className="gs-thead" style={{ height: table.headerHeight }}>
              <tr className="gs-row">
                <th
                  className="gs-th gs-th-left gs-th-top"
                  style={{ position: 'sticky', width: table.headerWidth, height: table.headerHeight }}
                  onClick={handleSelectAllClick}
                >
                  <div className="gs-th-inner">
                    <ScrollHandle
                      className={leftHeaderSelecting || topHeaderSelecting ? 'gs-hidden' : ''}
                      style={{ position: 'absolute' }}
                      horizontal={leftHeaderSelecting ? 0 : -1}
                      vertical={topHeaderSelecting ? 0 : -1}
                    />
                  </div>
                </th>
                <th
                  className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-left"
                  style={{ width: virtualized?.adjuster?.left ?? 1 }}
                ></th>
                {virtualized?.xs?.map?.((x) => <HeaderCellTop x={x} key={x} />)}
                <th
                  className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-right"
                  style={{ width: virtualized?.adjuster?.right }}
                ></th>
              </tr>
            </thead>

            <tbody className="gs-table-body-adjuster">
              <tr className="gs-row">
                <th
                  className={`gs-adjuster gs-adjuster-horizontal gs-adjuster-vertical`}
                  style={{ height: virtualized?.adjuster?.top ?? 1 }}
                ></th>
                <td className="gs-adjuster gs-adjuster-vertical"></td>
                {virtualized?.xs?.map((x) => <td className="gs-adjuster gs-adjuster-vertical" key={x}></td>)}
                <th className={`gs-adjuster gs-adjuster-horizontal gs-adjuster-vertical`}></th>
              </tr>
            </tbody>

            <tbody className="gs-table-body-data">
              {virtualized?.ys?.map((y) => {
                return (
                  <tr key={y} className="gs-row">
                    <HeaderCellLeft y={y} />
                    <td className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-left" />
                    {virtualized?.xs?.map((x) => (
                      <Cell key={x} y={y} x={x} operationStyle={operationStyles[p2a({ y, x })]} />
                    ))}
                    <td className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-right" />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const BORDER_POINTED = 'solid 2px #0077ff';
const BORDER_SELECTED = 'solid 1px #0077ff';
const BORDER_CUTTING = 'dotted 2px #0077ff';
const BORDER_COPYING = 'dashed 2px #0077ff';
const SEARCH_MATCHING_BACKGROUND = 'rgba(0,200,100,.2)';
const SEARCH_MATCHING_BORDER = 'solid 2px #00aa78';
const AUTOFILL_BORDER = 'dashed 1px #444444';

const useOperationStyles = (store: StoreType, refs: RefPaletteType) => {
  const cellStyles: { [key: string]: React.CSSProperties } = {};
  const updateStyle = (point: PointType, style: React.CSSProperties) => {
    const address = p2a(point);
    cellStyles[address] = cellStyles[address] || {};
    Object.assign(cellStyles[address], style);
  };
  const {
    choosing,
    selectingZone,
    matchingCells,
    matchingCellIndex,
    tableReactive,
    autofillDraggingTo,
    editingAddress,
  } = store;
  const table = tableReactive.current;
  if (!table) {
    return {};
  }
  const { wire } = table;
  const { copyingSheetId, copyingZone, cutting } = wire;
  const editingAnywhere = !!(wire.editingAddress || editingAddress);

  {
    // selecting
    const { top, left, bottom, right } = zoneToArea(selectingZone);
    if (!editingAnywhere) {
      for (let y = top; y <= bottom; y++) {
        updateStyle({ y, x: left - 1 }, { borderRight: BORDER_SELECTED });
        updateStyle({ y, x: left }, { borderLeft: BORDER_SELECTED });
        updateStyle({ y, x: right }, { borderRight: BORDER_SELECTED });
        updateStyle({ y, x: right + 1 }, { borderLeft: BORDER_SELECTED });
      }
      for (let x = left; x <= right; x++) {
        updateStyle({ y: top - 1, x }, { borderBottom: BORDER_SELECTED });
        updateStyle({ y: top, x }, { borderTop: BORDER_SELECTED });
        updateStyle({ y: bottom, x }, { borderBottom: BORDER_SELECTED });
        updateStyle({ y: bottom + 1, x }, { borderTop: BORDER_SELECTED });
      }
    }
  }
  if (autofillDraggingTo) {
    const autofill = new Autofill(store, autofillDraggingTo);
    const { top, left, bottom, right } = autofill.wholeArea;
    for (let y = top; y <= bottom; y++) {
      updateStyle({ y, x: left - 1 }, { borderRight: AUTOFILL_BORDER });
      updateStyle({ y, x: left }, { borderLeft: AUTOFILL_BORDER });
      updateStyle({ y, x: right }, { borderRight: AUTOFILL_BORDER });
      updateStyle({ y, x: right + 1 }, { borderLeft: AUTOFILL_BORDER });
    }
    for (let x = left; x <= right; x++) {
      updateStyle({ y: top - 1, x }, { borderBottom: AUTOFILL_BORDER });
      updateStyle({ y: top, x }, { borderTop: AUTOFILL_BORDER });
      updateStyle({ y: bottom, x }, { borderBottom: AUTOFILL_BORDER });
      updateStyle({ y: bottom + 1, x }, { borderTop: AUTOFILL_BORDER });
    }
  }
  {
    // choosing
    const { y, x } = choosing;
    updateStyle(
      { y, x },
      {
        borderLeft: BORDER_POINTED,
        borderRight: BORDER_POINTED,
        borderTop: BORDER_POINTED,
        borderBottom: BORDER_POINTED,
      },
    );
    updateStyle({ y, x: x - 1 }, { borderRight: BORDER_POINTED });
    updateStyle({ y, x: x + 1 }, { borderLeft: BORDER_POINTED });
    updateStyle({ y: y - 1, x }, { borderBottom: BORDER_POINTED });
    updateStyle({ y: y + 1, x }, { borderTop: BORDER_POINTED });
  }
  if (table.sheetId === copyingSheetId) {
    // copying
    const borderStyle = cutting ? BORDER_CUTTING : BORDER_COPYING;
    const { top, left, bottom, right } = zoneToArea(copyingZone);
    for (let y = top; y <= bottom; y++) {
      updateStyle({ y, x: left - 1 }, { borderRight: borderStyle });
      updateStyle({ y, x: left }, { borderLeft: borderStyle });
      updateStyle({ y, x: right }, { borderRight: borderStyle });
      updateStyle({ y, x: right + 1 }, { borderLeft: borderStyle });
    }
    for (let x = left; x <= right; x++) {
      updateStyle({ y: top - 1, x }, { borderBottom: borderStyle });
      updateStyle({ y: top, x }, { borderTop: borderStyle });
      updateStyle({ y: bottom, x }, { borderBottom: borderStyle });
      updateStyle({ y: bottom + 1, x }, { borderTop: borderStyle });
    }
  }

  Object.entries(refs).forEach(([ref, i]) => {
    const palette = COLOR_PALETTE[i % COLOR_PALETTE.length];
    const borderStyle = `dashed 2px ${palette}`;
    const { top, left, bottom, right } = table.rangeToArea(ref);
    for (let y = top; y <= bottom; y++) {
      updateStyle({ y, x: left - 1 }, { borderRight: borderStyle });
      updateStyle({ y, x: left }, { borderLeft: borderStyle });
      updateStyle({ y, x: right }, { borderRight: borderStyle });
      updateStyle({ y, x: right + 1 }, { borderLeft: borderStyle });
    }
    for (let x = left; x <= right; x++) {
      updateStyle({ y: top - 1, x }, { borderBottom: borderStyle });
      updateStyle({ y: top, x }, { borderTop: borderStyle });
      updateStyle({ y: bottom, x }, { borderBottom: borderStyle });
      updateStyle({ y: bottom + 1, x }, { borderTop: borderStyle });
    }
  });
  matchingCells.forEach((address) => {
    const { y, x } = a2p(address);
    updateStyle({ y, x }, { backgroundColor: SEARCH_MATCHING_BACKGROUND });
  });
  if (matchingCells.length > 0) {
    const { y, x } = a2p(matchingCells[matchingCellIndex]);
    updateStyle(
      { y, x },
      {
        borderLeft: SEARCH_MATCHING_BORDER,
        borderRight: SEARCH_MATCHING_BORDER,
        borderTop: SEARCH_MATCHING_BORDER,
        borderBottom: SEARCH_MATCHING_BORDER,
      },
    );
    updateStyle({ y, x: x - 1 }, { borderRight: SEARCH_MATCHING_BORDER });
    updateStyle({ y, x: x + 1 }, { borderLeft: SEARCH_MATCHING_BORDER });
    updateStyle({ y: y - 1, x }, { borderBottom: SEARCH_MATCHING_BORDER });
    updateStyle({ y: y + 1, x }, { borderTop: SEARCH_MATCHING_BORDER });
  }
  return cellStyles;
};
