// @gridsheet/web — the web/DOM rendering layer: the DOM, input, popup,
// virtualization, and style helpers the framework bindings need, built on top
// of @gridsheet/engine. The full engine API is re-exported here too, so a
// binding can pull both the model and the DOM helpers from @gridsheet/web.

// --- Headless model + formula engine ---
export * from '@gridsheet/engine';

// --- DOM ---
export { focus, preventSafariBounce } from './lib/dom';

// --- Input ---
export {
  handleFormulaQuoteAutoClose,
  insertTextAtCursor,
  isFocus,
  insertRef,
  isRefInsertable,
  expandInput,
  resetInput,
} from './lib/input';

// --- Virtualization ---
export { smartScroll, virtualize, getAreaInTabular, getCellRectPositions } from './lib/virtualization';

// --- Popup ---
export { calcBelowPosition, clampLeft, calcSideStyle, clampPopup, hAlignTransform } from './lib/popup';
export type { HAlign, VAlign, PopupPosition, SideStyle } from './lib/popup';

// --- Styles ---
export { embedStyle } from './styles/embedder';
