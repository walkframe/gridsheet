import { useContext, useEffect, useRef, useCallback } from 'react';
import { Context } from '../store';
import { zoneToArea } from '../lib/spatial';
import { between } from '../lib/spatial';
import { a2p } from '../lib/coords';
import { COLOR_PALETTE } from '../lib/palette';
import { Autofill } from '../lib/autofill';
import { getCellRectPositions } from '../lib/virtualization';
import type { Table } from '../lib/table';
import type { FC } from 'react';
import type { RefPaletteType, AreaType, ModeType } from '../types';

const COLOR_POINTED = '#0077ff';
const COLOR_SELECTED = '#0077ff';
const SELECTING_FILL = 'rgba(0, 128, 255, 0.2)';
const COLOR_COPYING = '#0077ff';
const COLOR_CUTTING = '#0077ff';
const SEARCH_MATCHING_BACKGROUND = 'rgba(0, 200, 100, 0.2)';
const COLOR_SEARCH_MATCHING = '#00aa78';
const COLOR_AUTOFILL = '#444444';

const HEADER_COLORS = {
  light: {
    selecting: 'rgba(0, 0, 0, 0.1)',
    choosing: 'rgba(0, 0, 0, 0.2)',
    thSelecting: 'rgba(0, 0, 0, 0.55)',
  },
  dark: {
    selecting: 'rgba(255, 255, 255, 0.08)',
    choosing: 'rgba(255, 255, 255, 0.18)',
    thSelecting: 'rgba(255, 255, 255, 0.4)',
  },
} as const;

type Props = {
  refs?: RefPaletteType;
};

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const fillRect = (ctx: Ctx2D, x: number, y: number, width: number, height: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
};

const drawRect = (
  ctx: Ctx2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  lineWidth: number = 2,
  dashPattern: number[] = [],
  fillColor?: string,
) => {
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dashPattern);
  ctx.strokeRect(x + lineWidth / 2, y + lineWidth / 2, width - lineWidth, height - lineWidth);
  ctx.setLineDash([]);
};

// Draw an area rect in viewport coordinates (absolute coords - scroll offset, clamped to viewport)
const drawAreaRectViewport = (
  ctx: Ctx2D,
  table: Table,
  scrollTop: number,
  scrollLeft: number,
  viewW: number,
  viewH: number,
  area: AreaType,
  color: string,
  lineWidth: number = 2,
  dashPattern: number[] = [],
  fillColor?: string,
) => {
  const { top, left, bottom, right } = area;
  if (top === -1 || left === -1 || bottom === -1 || right === -1) {
    return;
  }

  const topLeft = getCellRectPositions(table, { y: top, x: left });
  const bottomRight = getCellRectPositions(table, { y: bottom, x: right });

  const x1 = topLeft.left - scrollLeft;
  const y1 = topLeft.top - scrollTop;
  const x2 = bottomRight.right - scrollLeft;
  const y2 = bottomRight.bottom - scrollTop;

  // Quick reject if entirely off-screen
  if (x2 < 0 || x1 > viewW || y2 < 0 || y1 > viewH) {
    return;
  }

  drawRect(ctx, x1, y1, x2 - x1, y2 - y1, color, lineWidth, dashPattern, fillColor);
};

export const CellStateOverlay: FC<Props> = ({ refs = {} }) => {
  const { store } = useContext(Context);
  const {
    tableReactive,
    tabularRef,
    choosing,
    selectingZone,
    matchingCells,
    matchingCellIndex,
    autofillDraggingTo,
    topHeaderSelecting,
    leftHeaderSelecting,
    mode,
    dragging,
  } = store;
  const table = tableReactive.current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafIdRef = useRef<number>(0);
  const storeRef = useRef(store);
  storeRef.current = store;

  const drawCanvas = useCallback(() => {
    if (!table || !tabularRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const container = tabularRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // Resize canvas to viewport
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const { wire } = table;
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;
    const headerW = table.headerWidth;
    const headerH = table.headerHeight;

    // Clip cell-area drawing to exclude header region
    ctx.save();
    ctx.beginPath();
    ctx.rect(headerW, headerH, w - headerW, h - headerH);
    ctx.clip();

    // 1. Selecting zone (border + fill)
    const selectingArea = zoneToArea(selectingZone);
    drawAreaRectViewport(ctx, table, scrollTop, scrollLeft, w, h, selectingArea, COLOR_SELECTED, 1, [], SELECTING_FILL);

    // 2. Autofill dragging
    if (autofillDraggingTo) {
      const autofill = new Autofill(storeRef.current, autofillDraggingTo);
      drawAreaRectViewport(ctx, table, scrollTop, scrollLeft, w, h, autofill.wholeArea, COLOR_AUTOFILL, 1, [5, 5]);
    }

    // 3. Choosing (pointed cell)
    {
      const { y, x } = choosing;
      if (y !== -1 && x !== -1) {
        const pos = getCellRectPositions(table, { y, x });
        const vx = pos.left - scrollLeft;
        const vy = pos.top - scrollTop;
        drawRect(ctx, vx, vy, pos.width, pos.height, COLOR_POINTED, 2, []);
      }
    }

    // 4. Copying/Cutting zone
    const { copyingSheetId, copyingZone, cutting } = wire;
    if (table.sheetId === copyingSheetId) {
      const copyingArea = zoneToArea(copyingZone);
      const color = cutting ? COLOR_CUTTING : COLOR_COPYING;
      const dashPattern = cutting ? [4, 4] : [6, 4];
      drawAreaRectViewport(ctx, table, scrollTop, scrollLeft, w, h, copyingArea, color, 2.5, dashPattern);
    }

    // 5. Formula references (from palette)
    Object.entries(refs).forEach(([ref, i]) => {
      const palette = COLOR_PALETTE[i % COLOR_PALETTE.length];
      try {
        const refArea = table.rangeToArea(ref);
        drawAreaRectViewport(ctx, table, scrollTop, scrollLeft, w, h, refArea, palette, 2, [5, 5]);
      } catch (e) {
        // Invalid reference, skip
      }
    });

    // 6. Search matching cells
    matchingCells.forEach((address, index) => {
      const { y, x } = a2p(address);
      const pos = getCellRectPositions(table, { y, x });
      const vx = pos.left - scrollLeft;
      const vy = pos.top - scrollTop;

      // Skip if off-screen
      if (vx + pos.width < 0 || vx > w || vy + pos.height < 0 || vy > h) {
        return;
      }

      const isCurrentMatch = index === matchingCellIndex;
      drawRect(
        ctx,
        vx,
        vy,
        pos.width,
        pos.height,
        isCurrentMatch ? COLOR_SEARCH_MATCHING : 'transparent',
        isCurrentMatch ? 2 : 0,
        [],
        SEARCH_MATCHING_BACKGROUND,
      );
    });

    // Restore full canvas for header drawing
    ctx.restore();

    // 7. Header highlights (top and left) — using metadata O(1) lookup
    const headerColors = HEADER_COLORS[mode] || HEADER_COLORS.light;
    const numCols = table.getNumCols();
    const numRows = table.getNumRows();

    // Top headers
    for (let x = 1; x <= numCols; x++) {
      let color: string | null = null;
      if (between({ start: selectingZone.startX, end: selectingZone.endX }, x)) {
        color = topHeaderSelecting ? headerColors.thSelecting : headerColors.selecting;
      }
      if (choosing.x === x) {
        color = headerColors.choosing;
      }
      if (!color) {
        continue;
      }

      const pos = getCellRectPositions(table, { y: 1, x });
      const left = pos.left - scrollLeft;
      if (left + pos.width < headerW || left > w) {
        continue;
      }
      // Prevent drawing into the (0,0) corner
      const drawLeft = Math.max(left, headerW);
      const drawWidth = Math.min(left + pos.width, w) - drawLeft;
      if (drawWidth > 0) {
        fillRect(ctx, drawLeft, 0, drawWidth, headerH, color);
      }
    }

    // Left headers
    for (let y = 1; y <= numRows; y++) {
      if (table.isRowFiltered(y)) {
        continue;
      }
      let color: string | null = null;
      if (between({ start: selectingZone.startY, end: selectingZone.endY }, y)) {
        color = leftHeaderSelecting ? headerColors.thSelecting : headerColors.selecting;
      }
      if (choosing.y === y) {
        color = headerColors.choosing;
      }
      if (!color) {
        continue;
      }

      const pos = getCellRectPositions(table, { y, x: 1 });
      const top = pos.top - scrollTop;
      if (top + pos.height < headerH || top > h) {
        continue;
      }
      // Prevent drawing into the (0,0) corner
      const drawTop = Math.max(top, headerH);
      const drawHeight = Math.min(top + pos.height, h) - drawTop;
      if (drawHeight > 0) {
        fillRect(ctx, 0, drawTop, headerW, drawHeight, color);
      }
    }
  }, [
    table,
    tabularRef,
    choosing,
    selectingZone,
    matchingCells,
    matchingCellIndex,
    autofillDraggingTo,
    topHeaderSelecting,
    leftHeaderSelecting,
    mode,
    dragging,
    refs,
  ]);

  // Schedule a draw on the next animation frame (for state changes)
  const scheduleDrawCanvas = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(drawCanvas);
  }, [drawCanvas]);

  // Draw synchronously on scroll to avoid 1-frame lag
  const handleScroll = useCallback(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    scheduleDrawCanvas();
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [scheduleDrawCanvas]);

  useEffect(() => {
    const container = tabularRef.current;
    if (!container) {
      return;
    }
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [tabularRef, handleScroll]);

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <canvas
        ref={canvasRef}
        className="gs-cell-state-overlay"
        style={{
          pointerEvents: 'none',
          display: 'block',
        }}
      />
    </div>
  );
};
