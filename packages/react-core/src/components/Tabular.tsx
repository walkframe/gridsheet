import { useEffect, useContext, useState, useCallback } from 'react';

import { Cell } from './Cell';
import { HeaderCellTop } from './HeaderCellTop';
import { HeaderCellLeft } from './HeaderCellLeft';
import { CellStateOverlay } from './CellStateOverlay';

import { Context } from '../store';
import { choose, select, setContextMenuPosition } from '../store/actions';

import type { RefPaletteType, Virtualization } from '../types';
import { virtualize } from '../lib/virtualization';
import { p2a, stripAddressAbsolute } from '../lib/coords';
import { Lexer, stripSheetName } from '../formula/evaluator';
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
    contextMenuItems,
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

  const mergedRefs: RefPaletteType = {
    ...palette,
    ...(table ? table.wire.paletteBySheetName[table.sheetName] : {}),
  };

  if (!table || !table.wire.ready) {
    return null;
  }

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
          <CellStateOverlay refs={mergedRefs} />
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
                    {contextMenuItems.length > 0 && (
                      <button
                        className="gs-menu-btn gs-corner-menu-btn"
                        title="Menu"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          (e.currentTarget as HTMLElement).dataset.pressX = String(e.clientX);
                          (e.currentTarget as HTMLElement).dataset.pressY = String(e.clientY);
                        }}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                          const btn = e.currentTarget as HTMLElement;
                          const pressX = Number(btn.dataset.pressX ?? e.clientX);
                          const pressY = Number(btn.dataset.pressY ?? e.clientY);
                          const moved = Math.abs(e.clientX - pressX) > 4 || Math.abs(e.clientY - pressY) > 4;
                          if (moved) {
                            return;
                          }
                          const rect = btn.getBoundingClientRect();
                          dispatch(setContextMenuPosition({ y: rect.bottom, x: rect.left }));
                        }}
                      >
                        ⋮
                      </button>
                    )}
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
                    {virtualized?.xs?.map((x) => <Cell key={x} y={y} x={x} />)}
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
