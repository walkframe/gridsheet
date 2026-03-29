/**
 * lib/popup.ts
 *
 * Utility functions for computing the position of floating UI elements
 * (tooltips, dropdowns, autocomplete lists, function guides, etc.)
 * so they don't overflow the viewport.
 */

const MARGIN = 8; // px gap from the viewport edge

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HAlign = 'left' | 'right';
export type VAlign = 'top' | 'bottom';

export type PopupPosition = {
  x: number;
  y: number;
  hAlign: HAlign;
};

// ---------------------------------------------------------------------------
// calcBelowPosition
//
// Places a popup BELOW an anchor rect.
// Prefers aligning the popup's RIGHT edge to rect.right (hAlign='right'),
// but falls back to aligning its LEFT edge to rect.left (hAlign='left')
// when there is not enough room on the left side of the viewport.
//
// In the 'right' case the caller should apply  translateX(-100%) to shift the
// popup leftward so its right edge lands at x.
// In the 'left' case x is the desired left edge directly.
//
// Usage: error triangle tooltip, any anchored-to-element popup.
// ---------------------------------------------------------------------------
export const calcBelowPosition = (rect: DOMRect, maxWidth = 260, margin = MARGIN): PopupPosition => {
  if (rect.right - maxWidth >= margin) {
    return { x: rect.right, y: rect.bottom, hAlign: 'right' };
  }
  return { x: Math.max(rect.left, margin), y: rect.bottom, hAlign: 'left' };
};

// ---------------------------------------------------------------------------
// clampLeft
//
// Given the desired left position of a popup and its rendered width,
// returns an adjusted left value that keeps the popup within the viewport.
//
// Usage: EditorOptions dropdown, FunctionGuide floating panel.
// ---------------------------------------------------------------------------
export const clampLeft = (left: number, width: number, margin = MARGIN): number => {
  const rightEdge = left + width;
  const overflow = rightEdge - (window.innerWidth - margin);
  return overflow > 0 ? left - overflow : left;
};

// ---------------------------------------------------------------------------
// calcSidePosition
//
// Places a popup to the LEFT or RIGHT of an anchor element.
// Prefers the right side; falls back to the left side if the right side
// overflows the viewport.
//
// Resets the element to the preferred (right-side) position BEFORE measuring,
// so that stale styles from a previous render don't corrupt the measurement.
//
// Applies the final styles directly to the element and also returns them.
//
// Usage: FunctionGuide guide1 (option tooltip panel).
// ---------------------------------------------------------------------------
export type SideStyle = { left: string; right: string };

export const calcSideStyle = (el: HTMLElement, gap = MARGIN): SideStyle => {
  // 1. Reset to preferred position so getBoundingClientRect reflects the right side.
  el.style.left = `calc(100% + ${gap}px)`;
  el.style.right = 'auto';

  // 2. Measure after reset.
  const rect = el.getBoundingClientRect();
  if (rect.right > window.innerWidth - MARGIN) {
    const flipped: SideStyle = { left: 'auto', right: `calc(100% + ${gap}px)` };
    el.style.left = flipped.left;
    el.style.right = flipped.right;
    return flipped;
  }
  return { left: `calc(100% + ${gap}px)`, right: 'auto' };
};

// ---------------------------------------------------------------------------
// clampPopup
//
// Adjusts a rendered popup element's position so it stays within the viewport.
// Applies left/top corrections directly as inline styles to avoid re-renders.
// Call this inside useLayoutEffect with no dependency array so it runs after
// every render (content changes may change the popup dimensions).
//
// Usage: ContextMenu, FunctionGuide guide2, any popup that can change size.
// ---------------------------------------------------------------------------
export const clampPopup = (el: HTMLElement): void => {
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (rect.right > vw - MARGIN) {
    el.style.left = `${parseFloat(el.style.left || '0') - (rect.right - (vw - MARGIN))}px`;
  }
  if (rect.bottom > vh - MARGIN) {
    el.style.top = `${parseFloat(el.style.top || '0') - (rect.bottom - (vh - MARGIN))}px`;
  }
};

// ---------------------------------------------------------------------------
// hAlignTransform
//
// Returns the CSS transform string for a popup based on its horizontal alignment.
// 'right' → shift left by full width so the popup's right edge sits at x.
// 'left'  → no transform needed.
// ---------------------------------------------------------------------------
export const hAlignTransform = (hAlign: HAlign): string => (hAlign === 'right' ? 'translateX(-100%)' : 'none');
