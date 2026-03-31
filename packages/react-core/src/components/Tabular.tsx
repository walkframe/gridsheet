import { useEffect, useContext, useState, useCallback } from 'react';

import { Cell } from './Cell';
import { HeaderCellTop } from './HeaderCellTop';
import { HeaderCellLeft } from './HeaderCellLeft';
import { CellStateOverlay } from './CellStateOverlay';

import { Context } from '../store';
import { choose, select, setContextMenuPosition } from '../store/actions';

import type { RefPaletteType, Virtualization } from '../types';
import { virtualize } from '@gridsheet/core';
import { p2a, stripAddressAbsolute } from '@gridsheet/core';
import { Lexer, stripSheetName } from '@gridsheet/core';
import { ScrollHandle } from './ScrollHandle';
import { preventSafariBounce } from '@gridsheet/core';

export const Tabular = () => {
  const [palette, setPalette] = useState<RefPaletteType>({});
  const { store, dispatch } = useContext(Context);
  const {
    sheetReactive,
    choosing,
    editingAddress,
    tabularRef,
    mainRef,
    sheetWidth,
    sheetHeight,
    inputting,
    leftHeaderSelecting,
    topHeaderSelecting,
    contextMenu,
  } = store;
  const sheet = sheetReactive.current;

  const [virtualized, setVirtualized] = useState<Virtualization | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (sheet) {
        setVirtualized(virtualize(sheet, e.currentTarget));
      }
    },
    [sheetReactive],
  );

  const handleSelectAllClick = useCallback(() => {
    if (!sheet) {
      return;
    }
    dispatch(choose({ y: -1, x: -1 }));
    requestAnimationFrame(() => {
      dispatch(choose({ y: 1, x: 1 }));
      dispatch(
        select({
          startY: 1,
          startX: 1,
          endY: sheet.numRows,
          endX: sheet.numCols,
        }),
      );
    });
  }, [sheetReactive]);

  useEffect(() => {
    if (!sheet) {
      return;
    }
    const formulaEditing = editingAddress && inputting.startsWith('=');
    if (!formulaEditing) {
      setPalette({});
      sheet.registry.paletteBySheetName = {};
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
    sheet.registry.paletteBySheetName = paletteBySheetName;
  }, [store.inputting, store.editingAddress, sheetReactive]);

  useEffect(() => {
    if (!sheet) {
      return;
    }
    sheet.registry.choosingAddress = p2a(choosing);
    sheet.registry.choosingSheetId = sheet.id;
  }, [choosing]);

  useEffect(() => {
    if (!sheet) {
      return;
    }
    setVirtualized(virtualize(sheet, tabularRef.current));
  }, [tabularRef.current, sheetReactive, mainRef.current?.clientHeight, mainRef.current?.clientWidth]);

  useEffect(() => {
    const el = tabularRef.current;
    if (!el) {
      return;
    }
    return preventSafariBounce(el);
  }, [sheetReactive]);

  const mergedRefs: RefPaletteType = {
    ...palette,
    ...(sheet ? sheet.registry.paletteBySheetName[sheet.name] : {}),
  };

  if (!sheet || !sheet.registry.ready) {
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
            width: sheet.totalWidth + 1,
            height: sheet.totalHeight + 1,
          }}
        >
          <CellStateOverlay refs={mergedRefs} />
          <table className={`gs-table`}>
            <thead className="gs-thead" style={{ height: sheet.headerHeight }}>
              <tr className="gs-row">
                <th
                  className="gs-th gs-th-left gs-th-top"
                  style={{ position: 'sticky', width: sheet.headerWidth, height: sheet.headerHeight }}
                  onClick={handleSelectAllClick}
                >
                  <div className="gs-th-inner">
                    <ScrollHandle
                      className={leftHeaderSelecting || topHeaderSelecting ? 'gs-hidden' : ''}
                      style={{ position: 'absolute' }}
                      horizontal={leftHeaderSelecting ? 0 : -1}
                      vertical={topHeaderSelecting ? 0 : -1}
                    />
                    {contextMenu.length > 0 && (
                      <button
                        className="gs-menu-btn gs-corner-menu-btn"
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

            <tbody className="gs-sheet-body-adjuster">
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

            <tbody className="gs-sheet-body-data">
              {virtualized?.ys?.map((y) => {
                return (
                  <tr key={y} className={`gs-row ${y % 2 === 0 ? 'gs-row-even' : 'gs-row-odd'}`}>
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
