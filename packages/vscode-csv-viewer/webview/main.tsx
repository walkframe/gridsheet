import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  GridSheet,
  ProgressOverlay,
  embedStyle,
  buildInitialCells,
  toValueMatrix,
  toValueMatrixAsync,
  p2a,
  x2c,
  render,
  Pending,
  userActions,
  operations,
  Policy,
  type PolicyMixinType,
  ThousandSeparatorPolicyMixin,
  PercentagePolicyMixin,
  defaultColMenuDescriptors,
  updateSheet,
  type StoreHandle,
} from '@gridsheet/preact-core';

import { useSpellbook } from '@gridsheet/preact-core/spellbook';

import { makeAiFunctions, type AiEnqueue } from './aiFunctions';
import type { AiBatchResponse, AiCustomFunction, AiTask } from '../src/aiTypes';

declare function acquireVsCodeApi(): { postMessage(msg: unknown): void };

const vscodeApi = acquireVsCodeApi();

// Inject the grid stylesheet up front (idempotent) so the initial-load ProgressOverlay is
// styled/centered before any GridSheet mounts; GridSheet's own embedStyle() call is then a no-op.
embedStyle();

// ── AI batch bridge ────────────────────────────────────────────────────────
// Each =CLAUDE/=CODEX cell calls enqueueAi(); requests accumulate for one tick
// and flush as a single 'aiBatch' message. The host resolves them (grouped by
// provider+kind → few CLI calls) and replies with 'aiBatchResult', which settles
// each cell's Promise. The engine shows `gs-pending` until then.
type AiQueueItem = { task: Omit<AiTask, 'index'>; resolve: (v: unknown) => void; reject: (e: unknown) => void };
let aiQueue: AiQueueItem[] = [];
let aiFlushTimer: ReturnType<typeof setTimeout> | null = null;
let aiReqCounter = 0;
const aiPending = new Map<number, AiQueueItem[]>();

const flushAi = () => {
  aiFlushTimer = null;
  const batch = aiQueue;
  aiQueue = [];
  if (batch.length === 0) {
    return;
  }
  const id = ++aiReqCounter;
  aiPending.set(id, batch);
  const tasks: AiTask[] = batch.map((item, index) => ({ index, ...item.task }));
  vscodeApi.postMessage({ type: 'aiBatch', id, tasks });
};

const enqueueAi: AiEnqueue = (provider, kind, prompt) =>
  new Promise<string | number | boolean | string[][]>((resolve, reject) => {
    aiQueue.push({ task: { provider, kind, prompt }, resolve: resolve as (v: unknown) => void, reject });
    if (aiFlushTimer == null) {
      aiFlushTimer = setTimeout(flushAi, 60);
    }
  });

const handleAiResult = (msg: AiBatchResponse) => {
  const batch = aiPending.get(msg.id);
  if (!batch) {
    return;
  }
  aiPending.delete(msg.id);
  const settled = new Set<number>();
  for (const r of msg.results) {
    const item = batch[r.index];
    if (!item) {
      continue;
    }
    settled.add(r.index);
    if (r.ok) {
      item.resolve(r.value);
    } else {
      item.reject(new Error(r.error));
    }
  }
  batch.forEach((item, i) => {
    if (!settled.has(i)) {
      item.reject(new Error('No result returned for this cell.'));
    }
  });
  // The resolved values repaint via the engine's transmit hook. Persistence is
  // save-only, so they are written to the file on the next Cmd+S (not auto-flushed).
};

// ── Clipboard paste bridge ─────────────────────────────────────────────────
// VS Code webviews deliver an EMPTY clipboardData on native paste events, so
// GridSheet's onPaste (which reads e.clipboardData) receives nothing and paste
// looks broken — even though it works in a plain browser / Storybook. Bridge via
// the extension host: intercept Cmd/Ctrl+V while the grid is focused, fetch the
// text through vscode.env.clipboard, then replay it — as a synthetic paste event
// for grid paste, or inserted at the caret while editing a cell inline.
const gridStoreRef: { current: StoreHandle | null } = { current: null };
let pastePending = false;

document.addEventListener(
  'keydown',
  (e) => {
    if (!(e.metaKey || e.ctrlKey) || (e.key !== 'v' && e.key !== 'V')) {
      return;
    }
    const ta = gridStoreRef.current?.store?.editorRef?.current ?? null;
    if (!ta || document.activeElement !== ta) {
      return; // focus is outside the grid — leave other inputs' paste untouched
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    pastePending = true;
    vscodeApi.postMessage({ type: 'requestPaste' });
  },
  true,
);

// Ctrl/Cmd+R is "fill right" in the grid (Excel/Sheets). In a VS Code webview it also reloads the
// view, and the host decides that too early for a DOM preventDefault to stop it (the fill runs,
// then the page reloads and discards it). So fully SWALLOW the event at capture — preventDefault +
// stopImmediatePropagation — to block the reload, and run fill-right ourselves via the store. When
// a cell is being edited, swallow but don't fill (matches react-core: Ctrl+R is a no-op there).
document.addEventListener(
  'keydown',
  (e) => {
    if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey || (e.key !== 'r' && e.key !== 'R')) {
      return;
    }
    const handle = gridStoreRef.current;
    const ta = handle?.store?.editorRef?.current ?? null;
    if (!handle || !ta || document.activeElement !== ta) {
      return; // focus is outside the grid — let the host handle reload normally
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!handle.store.editingAddress) {
      handle.dispatch(userActions.fillRight(null));
    }
  },
  true,
);

const applyPaste = (text: string) => {
  if (!pastePending) {
    return;
  }
  pastePending = false;
  const store = gridStoreRef.current?.store;
  const ta = store?.editorRef?.current;
  if (!store || !ta || !text) {
    return;
  }
  ta.focus();
  if (store.editingAddress) {
    document.execCommand('insertText', false, text); // inline edit → insert at caret
    return;
  }
  // Grid paste → replay through GridSheet's own onPaste with the text attached.
  const dt = new DataTransfer();
  dt.setData('text/plain', text);
  ta.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
};

type DataMessage = {
  type: 'data';
  rows: string[][];
  delimiter: 'CSV' | 'TSV';
  readOnly?: boolean;
  evaluate?: boolean;
  eager?: boolean;
  dateFormats?: string[];
  parseNumber?: boolean;
  parseDate?: boolean;
  parseTime?: boolean;
  parseBool?: boolean;
  aiCustom?: AiCustomFunction[];
};

// View-only prevention mask. `operations.ViewOnly` (= ReadOnly | ColumnMenu) already
// covers content edits, structural changes, sort/filter, label changes and the column
// menu; it just omits RowMenu, so add it to also hide the row-header menu. Copy is not a
// prevention-enforced op, so it keeps working. (ViewOnly does block column resize.)
const READ_ONLY_PREVENTION = operations.ViewOnly | operations.RowMenu;

// Which value types the viewer coerces from text. CSV cells are TEXT; each parse is opt-in
// (settings gridsheet.viewer.parse*), off by default except numbers, because coercing changes
// what gets written back on save. See makeDefaultPolicy.
type ParseFlags = { number: boolean; date: boolean; time: boolean; bool: boolean };

// Signals "not this type" so the deserialize chain keeps the value as text.
const disableDeserialize = (): any => ({ value: undefined });

// Parse to a number ONLY when it round-trips exactly (`String(Number(v)) === v`), so a save
// stays byte-identical: `1234`/`12.5`/`-3` become numbers (numeric sort/filter), while `007`,
// `12.50`, `1e3`, oversized ints, and non-numbers stay text.
const roundTripNumberDeserialize = (value: string): any => {
  if (typeof value !== 'string' || value === '') {
    return { value: undefined };
  }
  const n = Number(value);
  return Number.isFinite(n) && String(n) === value ? { value: n } : { value: undefined };
};

// Keep the raw string for every type — used by the display-only format policies so their
// column's stored value never changes on save (formatting happens in render only).
const keepRawMixin: PolicyMixinType = { deserializeFirst: (value: any) => ({ value }) };

// The default policy for every data cell. Off types are hard-disabled (stay text); the number
// parse (when on) is the round-trip-safe one, so enabling it can never rewrite the file.
const makeDefaultPolicy = (flags: ParseFlags, extra: PolicyMixinType[] = []): Policy => {
  const mixin: PolicyMixinType = {
    deserializeNumber: flags.number ? roundTripNumberDeserialize : disableDeserialize,
  };
  if (!flags.date) {
    mixin.deserializeDate = disableDeserialize;
  }
  if (!flags.time) {
    mixin.deserializeTime = disableDeserialize;
  }
  if (!flags.bool) {
    mixin.deserializeBool = disableDeserialize;
  }
  return new Policy({ mixins: [mixin, ...extra] });
};

// Number display format (thousand / percent) for a column. Parses clean numbers (numeric
// sort/filter, round-trip-safe save) and, for text that stayed a string (e.g. `007`), still
// parses it for DISPLAY via renderNumber. Date/time/bool are not coerced in a number column.
const numFmt = (formatMixin: PolicyMixinType, extra: PolicyMixinType[] = []): Policy =>
  new Policy({
    mixins: [
      formatMixin,
      {
        deserializeNumber: roundTripNumberDeserialize,
        deserializeDate: disableDeserialize,
        deserializeTime: disableDeserialize,
        deserializeBool: disableDeserialize,
        renderString(this: Policy, props: any) {
          const value = props?.value;
          if (typeof value !== 'string' || value.trim() === '') {
            return value;
          }
          const n = Number(value);
          return isNaN(n) ? value : this.renderNumber({ ...props, value: n });
        },
      },
      ...extra,
    ],
  });

// Date display format. Keeps the raw string; for display, parses date-looking text (has a
// `- / :` separator or a letter — so bare numbers like `007` are left alone) and formats it
// with the chosen dayjs pattern. Unparseable text passes through unchanged.
const dateFmt = (fmt: string, datetimeFmt = fmt, extra: PolicyMixinType[] = []): Policy =>
  new Policy({
    mixins: [
      keepRawMixin,
      {
        dateFormat: fmt,
        datetimeFormat: datetimeFmt,
        renderString(this: Policy, props: any) {
          const value = props?.value;
          if (typeof value !== 'string') {
            return value;
          }
          const t = value.trim();
          if (!t || !/[-/:]|[A-Za-z]/.test(t)) {
            return value;
          }
          const d = new Date(t);
          return isNaN(d.getTime()) ? value : this.renderDate({ ...props, value: d });
        },
      },
      ...extra,
    ],
  });

// Stable empty default so `data.dateFormats ?? EMPTY` doesn't hand Grid a new array each
// render (which would rebuild the policy map / book unnecessarily).
const EMPTY_STRING_ARRAY: string[] = [];
const EMPTY_AI_CUSTOM: AiCustomFunction[] = [];

type FormatOption = { id: string; label: string };
type DateFormatDef = { id: string; label: string; fmt: string; datetimeFmt?: string };

// `id` doubles as the policy key ('' = clear). label shows a sample of the format.
const BUILTIN_DATE_FORMATS: DateFormatDef[] = [
  { id: 'date_iso', label: '2024-01-15', fmt: 'YYYY-MM-DD' },
  { id: 'date_us', label: '01/15/2024', fmt: 'MM/DD/YYYY' },
  { id: 'date_eu', label: '15/01/2024', fmt: 'DD/MM/YYYY' },
  { id: 'date_long', label: 'Jan 15, 2024', fmt: 'MMM D, YYYY' },
  { id: 'datetime', label: '2024-01-15 14:30:00', fmt: 'YYYY-MM-DD', datetimeFmt: 'YYYY-MM-DD HH:mm:ss' },
];

const NUMBER_FORMAT_OPTIONS: FormatOption[] = [
  { id: 'thousand', label: 'Thousands  (1,234)' },
  { id: 'percent', label: 'Percent  (0.5 → 50%)' },
];

// Build the policy map + Date submenu options, merging the built-in date formats with any
// user-configured dayjs patterns (gridsheet.viewer.dateFormats). Each custom pattern becomes
// both a registered policy and a Date option, labeled by the pattern itself.
const buildFormats = (customDateFormats: string[], parseFlags: ParseFlags, extraMixins: PolicyMixinType[] = []) => {
  const dateDefs: DateFormatDef[] = [
    ...BUILTIN_DATE_FORMATS,
    ...customDateFormats
      .map((f) => (typeof f === 'string' ? f.trim() : ''))
      .filter((f) => f.length > 0)
      .map((fmt) => ({ id: `date_custom:${fmt}`, label: fmt, fmt })),
  ];
  const policies: Record<string, Policy> = {
    // 'raw' is the default policy for all data cells — coercion limited to the parse flags.
    raw: makeDefaultPolicy(parseFlags, extraMixins),
    thousand: numFmt(ThousandSeparatorPolicyMixin, extraMixins),
    percent: numFmt(PercentagePolicyMixin, extraMixins),
  };
  for (const d of dateDefs) {
    policies[d.id] = dateFmt(d.fmt, d.datetimeFmt, extraMixins);
  }
  const dateOptions: FormatOption[] = dateDefs.map((d) => ({ id: d.id, label: d.label }));
  return { policies, numberOptions: NUMBER_FORMAT_OPTIONS, dateOptions };
};

const delimiterChar = (d: 'CSV' | 'TSV') => (d === 'TSV' ? '\t' : ',');

// Widest row length. Uses a loop, NOT `Math.max(1, ...rows.map(...))`: spreading a
// million-element array as function arguments throws "Maximum call stack size
// exceeded" past ~500k rows, which was making large files fail/stall on open.
const maxRowLength = (rows: string[][]): number => {
  let m = 1;
  for (let i = 0; i < rows.length; i++) {
    const len = rows[i].length;
    if (len > m) {
      m = len;
    }
  }
  return m;
};

// RFC-4180-ish field quoting (symmetric with src/parse.ts).
const quoteField = (v: string, delim: string) =>
  v.includes(delim) || v.includes('"') || v.includes('\n') || v.includes('\r') ? `"${v.replace(/"/g, '""')}"` : v;

// Turn the already-materialized value matrix into CSV/TSV text. With `header` on,
// the column labels (row 0) become the first line, followed by the data rows.
// Trailing all-empty rows are dropped so "extra" capacity rows don't bloat the file.
const buildText = (matrix: any[][], raw: any[][] | null, header: boolean, sheet: any, delim: string): string => {
  const cellText = (v: any, y: number, x: number): string => {
    // A still-resolving async cell (=CLAUDE/=CODEX) reads back as a Pending sentinel;
    // writing its toString() would leak "<Pending #…>" into the file. Fall back to the
    // raw formula source for those cells until they resolve.
    if (raw != null && Pending.is(v)) {
      const r = raw[y]?.[x];
      return r == null ? '' : String(r);
    }
    return v == null ? '' : String(v);
  };
  const numCols = matrix.reduce((m, r) => Math.max(m, r.length), 0);
  const lines: string[] = [];
  if (header) {
    const hdr: string[] = [];
    for (let x = 1; x <= numCols; x++) {
      const label = sheet.getCell({ y: 0, x }, { resolution: 'SYSTEM' })?.label;
      hdr.push(quoteField(label == null ? '' : String(label), delim));
    }
    lines.push(hdr.join(delim));
  }
  matrix.forEach((row, y) => {
    lines.push(row.map((v, x) => quoteField(cellText(v, y, x), delim)).join(delim));
  });
  const floor = header ? 1 : 0;
  while (lines.length > floor && lines[lines.length - 1].split(delim).every((f) => f === '')) {
    lines.pop();
  }
  return lines.join('\n');
};

// Serialize the current sheet to CSV/TSV text WITHOUT blocking the UI. Reading
// every cell lazily materializes the whole sheet (O(cells), ~hundreds of ms at a
// million rows), so we use the engine's time-sliced toValueMatrixAsync: it yields
// between chunks (letting the progress bar paint) and reports row-granular progress.
// evaluate=true writes formula results (=A1+B1 -> 30); false keeps the formula source.
const serializeAsync = async (
  sheet: any,
  header: boolean,
  delim: string,
  evaluate: boolean,
  onProgress: (done: number, total: number) => void,
  yieldControl: () => Promise<void>,
): Promise<string> => {
  const matrix: any[][] = await toValueMatrixAsync(sheet, {
    resolution: evaluate ? 'RESOLVED' : 'RAW',
    onProgress: ({ done, total }) => onProgress(done, total),
    yieldControl,
  });
  // The first pass above materialized every cell, so this fallback pass (only for
  // Pending async cells under evaluate=true) reads from cache and is cheap.
  const raw: any[][] | null = evaluate ? toValueMatrix(sheet, { resolution: 'RAW' }) : null;
  return buildText(matrix, raw, header, sheet, delim);
};

// VS Code stamps the active theme onto <body> (vscode-light / vscode-dark /
// vscode-high-contrast[-light]). GridSheet's inherit modes make it blend in.
const detectMode = (): 'inherit-light' | 'inherit-dark' => {
  const c = document.body.classList;
  const light = c.contains('vscode-light') || c.contains('vscode-high-contrast-light');
  return light ? 'inherit-light' : 'inherit-dark';
};

const useVscodeMode = () => {
  const [mode, setMode] = useState<'inherit-light' | 'inherit-dark'>(detectMode);
  useEffect(() => {
    const obs = new MutationObserver(() => setMode(detectMode()));
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return mode;
};

// Grid theme tokens the core ProgressOverlay reads. Supplied on the initial-load container
// (before GridSheet mounts, where the grid's own gs-root tokens aren't in scope yet) so the
// "Loading" overlay matches the in-grid save/paste overlays. Values mirror the engine themes.
const GRID_THEME_TOKENS: Record<'inherit-light' | 'inherit-dark', Record<string, string>> = {
  'inherit-dark': {
    '--gs-fg': '#e4e6e9',
    '--gs-border': '#2c2f34',
    '--gs-editor-surface': '#1c1e21',
    '--gs-accent': '#3b82f6',
  },
  'inherit-light': {
    '--gs-fg': '#1f2328',
    '--gs-border': '#e3e6ea',
    '--gs-editor-surface': '#ffffff',
    '--gs-accent': '#2563eb',
  },
};

type GridProps = {
  rows: string[][];
  header: boolean;
  extraRows: number;
  extraCols: number;
  evaluate: boolean;
  // Force eager evaluation of every formula cell (fires off-screen async cells too),
  // instead of the virtualized scroll-to-evaluate default. gridsheet.viewer.eager.
  eager: boolean;
  delimiter: 'CSV' | 'TSV';
  mode: 'inherit-light' | 'inherit-dark';
  readOnly: boolean;
  // Per-column display format: grid column index (1-based) → format policy key.
  columnFormats: Record<number, string>;
  onSetFormat: (x: number, id: string) => void;
  // Extra date output formats (dayjs patterns) from gridsheet.viewer.dateFormats settings.
  dateFormats: string[];
  // Which value types to coerce from text (gridsheet.viewer.parse*); off types stay as text.
  parseFlags: ParseFlags;
  // User-defined AI functions (gridsheet.ai.custom) → registered as =NAME(...).
  aiCustom: AiCustomFunction[];
  // Bumped by App when the user saves (Cmd+S). Serialize the sheet and persist then.
  saveSignal: number;
  onSave: (text: string) => void;
  // Fired on any in-memory grid edit so App can show the footer "unsaved" marker.
  onDirty: () => void;
  // Fired when a formula cell is registered (via the engine's onFormula hook) so App
  // can show the "computed" marker — results a save would bake into the file.
  onComputed: () => void;
};

// Remounts (via a key in App) whenever fresh data arrives, so it always starts
// from the authoritative document content plus the current header/extra-rows/cols.
const Grid = ({
  rows,
  header,
  extraRows,
  extraCols,
  evaluate,
  eager,
  delimiter,
  mode,
  readOnly,
  columnFormats,
  onSetFormat,
  dateFormats,
  parseFlags,
  aiCustom,
  saveSignal,
  onSave,
  onDirty,
  onComputed,
}: GridProps) => {
  const sheetRef = useRef<any>(null);
  const delim = delimiterChar(delimiter);

  // ── Per-cell highlight (computed / changed) ────────────────────────────────
  // A single renderCallback mixin, appended to every format policy, paints a
  // full-bleed `.backface` layer behind the value when the cell is a formula
  // ("computed", purple) or was edited since load/last save ("changed", amber).
  //
  // `changed` has no reliable per-cell engine flag (getSystem().changedTime is
  // stamped even on lazy population, so scrolling a cell into view would look
  // edited). Instead we accumulate the engine's per-operation
  // getLastChangedAddresses() into editedRef, gated by the sheet version so a
  // given op is only folded in once, and cleared on save. All cells re-render on
  // every store update (they consume the grid Context), so folding in the last
  // op during render lights the just-edited cell in the same frame.
  const editedRef = useRef<Set<string>>(new Set()); // cumulative edited addresses (p2a form)
  const lastAccVersionRef = useRef(-1); // highest sheet version already folded into editedRef
  // The engine's onChange also fires on our own repaint nudge (updateSheet), which must
  // NOT re-flag the footer "Unsaved". A real edit advances the sheet version; the nudge
  // doesn't — so only mark dirty when the version actually moved. Starts at 0 (the
  // opened, unedited version) so opening never marks dirty.
  const lastDirtyVersionRef = useRef(0);
  // Sheet version at the last save. Both markers gate on it: a manual edit stays in
  // editedRef only while the sheet has advanced past this, and a formula counts as
  // "computed" only while there are unsaved changes (version > this). Saving bakes
  // formula results into the file, so on save this jumps to the current version and
  // BOTH markers go quiet until the next edit. Starts at -1 so a freshly opened file
  // (version 0, nothing saved yet) already shows its formulas as computed.
  const clearedVersionRef = useRef(-1);

  const highlightMixin = useMemo<PolicyMixinType>(
    () => ({
      renderCallback: (rendered: any, props: any) => {
        const sheet = sheetRef.current?.sheet;
        if (!sheet) {
          return rendered;
        }
        // Fold the newest operation's changed cells into the cumulative set, once
        // per version (the first cell rendered at a new version does it; the rest
        // skip). Skip ops at/behind the last save so a saved sheet stays clean.
        const version = sheet.currentVersion ?? 0;
        if (version > lastAccVersionRef.current) {
          lastAccVersionRef.current = version;
          if (version > clearedVersionRef.current) {
            for (const a of sheet.getLastChangedAddresses?.() ?? []) {
              editedRef.current.add(a);
            }
          }
        }
        const address = p2a(props.point);
        const changed = editedRef.current.has(address);
        // A formula counts as "computed" only while there are unsaved changes — its
        // baked result isn't in the file yet. After a save (clearedVersion caught up)
        // it goes quiet until the next edit bumps the version again.
        const raw = sheet.getCell?.(props.point, { resolution: 'SYSTEM' })?.value;
        const computed = typeof raw === 'string' && raw.charAt(0) === '=' && version > clearedVersionRef.current;
        if (!changed && !computed) {
          return rendered;
        }
        // changed wins over computed (a formula you just edited reads as an edit).
        const bg = changed
          ? 'color-mix(in srgb, var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d) 20%, transparent)'
          : 'color-mix(in srgb, var(--vscode-charts-purple, #b180d7) 16%, transparent)';
        return [
          // .backface is z-index:0 via the grid CSS; inset:0 fills the whole cell
          // through the positioned gs-cell-inner-wrap ancestor.
          <div
            key="gs-hl"
            className="backface"
            style={{ position: 'absolute', inset: 0, background: bg, pointerEvents: 'none' }}
          />,
          // Wrap the value in a positioned span so it always paints ABOVE the
          // backface — a bare string would be a text node the absolute backface
          // would cover.
          <span key="gs-val" style={{ position: 'relative' }}>
            {rendered}
          </span>,
        ];
      },
    }),
    [],
  );

  // Clear both markers after a save: drop the edited set and pin the cleared version
  // to the current one so neither already-folded edits nor still-present formulas
  // re-light (the file now holds the baked results). A save doesn't bump the sheet
  // version on its own, so nudge the grid store to repaint the cells.
  const clearHighlights = useCallback(() => {
    const handle = gridStoreRef.current;
    const sheet = sheetRef.current?.sheet;
    editedRef.current = new Set();
    lastAccVersionRef.current = sheet?.currentVersion ?? 0;
    clearedVersionRef.current = sheet?.currentVersion ?? 0;
    if (handle && sheet) {
      handle.dispatch(updateSheet(sheet));
    }
  }, []);

  // Policy map + submenu options, rebuilt when the configured formats / parse flags change.
  const { policies: formatPolicies, numberOptions, dateOptions } = useMemo(
    () => buildFormats(dateFormats, parseFlags, [highlightMixin]),
    // Depend on the flag fields (stable primitives), not the freshly-built parseFlags object.
    [dateFormats, parseFlags.number, parseFlags.date, parseFlags.time, parseFlags.bool, highlightMixin],
  );

  // Save-only persistence: grid edits stay in-memory (no per-edit serialize — that
  // walks every cell and used to freeze the UI on large sheets). The file is written
  // only when the user saves; the serialize runs off the edit path via the engine's
  // time-sliced async matrix, driving the progress overlay instead of blocking.
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  // Bridge the engine's onFormula hook to the footer "Computed" marker. It fires from
  // Sheet.processFormula when a formula cell is registered — any `=…` cell, reference /
  // operator / function alike — at parse/set time (on open and on edit), NOT on solve
  // and NOT during the save serialize, so a save that bakes results (turning formulas
  // into literals) doesn't re-flag it afterwards. Guard + defer + dedupe:
  //   - evaluate off  → results aren't baked on save, so nothing to flag.
  //   - queueMicrotask → processFormula runs inside sheet.initialize() during the
  //                      initial render, so never setState synchronously from it.
  //   - computedPendingRef → a file with N formulas fires N times on open; collapse
  //                      the batch to a single onComputed().
  const computedPendingRef = useRef(false);
  const notifyComputed = useCallback(() => {
    if (!evaluate || computedPendingRef.current) {
      return;
    }
    computedPendingRef.current = true;
    queueMicrotask(() => {
      computedPendingRef.current = false;
      onComputed();
    });
  }, [evaluate, onComputed]);

  const additionalFunctions = useMemo(() => makeAiFunctions(enqueueAi, aiCustom), [aiCustom]);
  // useSpellbook (not createSpellbook) so registry.transmit is wired to a real repaint.
  // GridSheet only wires transmit for a book it owns; with our own createSpellbook the
  // async =CLAUDE/=CODEX results would land in the cache but never render until an
  // unrelated interaction (e.g. a cursor move) forced a paint.
  // useSpellbook == useBook with @gridsheet/functions' allFunctions pre-loaded; our AI
  // functions merge on top of the extended set.
  // onChange fires per in-memory edit (cheap — just flags the footer as unsaved; no serialize).
  // Gate on the version so our own repaint nudge (which fires onChange without advancing the
  // version) doesn't re-flag "Unsaved" right after a save cleared it.
  const handleChange = useCallback(() => {
    const version = sheetRef.current?.sheet?.currentVersion ?? 0;
    if (version === lastDirtyVersionRef.current) {
      return; // no real edit (e.g. the clearHighlights repaint nudge)
    }
    lastDirtyVersionRef.current = version;
    onDirty();
  }, [onDirty]);

  const book = useSpellbook({
    additionalFunctions,
    policies: formatPolicies,
    onChange: handleChange,
    onFormula: notifyComputed,
  });

  // Latest render params, read by the save routine without re-arming its effect.
  const saveArgsRef = useRef({ header, delim, evaluate, readOnly, onSave });
  saveArgsRef.current = { header, delim, evaluate, readOnly, onSave };

  // A save was requested (saveSignal changed): show the overlay. The actual
  // serialize runs in the effect below, after the overlay has painted.
  const lastSaveSignal = useRef(saveSignal);
  useEffect(() => {
    if (saveSignal === lastSaveSignal.current) {
      return;
    }
    lastSaveSignal.current = saveSignal;
    if (saveArgsRef.current.readOnly) {
      return; // read-only: never write back to the file
    }
    setProgress(0);
    setSaving(true);
  }, [saveSignal]);

  // Run the async serialize once the overlay is on screen. Two rAFs guarantee the
  // overlay has actually painted (progress visible from 0%) before the chunked work
  // starts; a macrotask yield between chunks lets the bar repaint as it advances.
  useEffect(() => {
    if (!saving) {
      return;
    }
    let cancelled = false;
    const yieldControl = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
    const raf1 = requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        if (cancelled) {
          return;
        }
        const { header, delim, evaluate, onSave } = saveArgsRef.current;
        const sheet = sheetRef.current?.sheet;
        try {
          if (sheet) {
            const text = await serializeAsync(
              sheet,
              header,
              delim,
              evaluate,
              (done, total) => {
                if (!cancelled) {
                  setProgress(total > 0 ? done / total : 1);
                }
              },
              yieldControl,
            );
            if (!cancelled) {
              onSave(text);
              clearHighlights(); // saved → nothing is "changed" or unsaved-"computed" anymore
            }
          }
        } finally {
          if (!cancelled) {
            setSaving(false);
          }
        }
      }),
    );
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
    };
  }, [saving]);

  const initialCells = useMemo(() => {
    const headerRow = header ? rows[0] : undefined;
    const dataRows = header ? rows.slice(1) : rows;
    const numCols = maxRowLength(rows) + Math.max(0, extraCols);
    const cells: Record<string, { value?: string; label?: string; prevention?: number; policy?: string }> = {};
    // Every data cell defaults to the 'raw' policy so values are never coerced from text —
    // opening and saving a CSV round-trips exactly (see keepRawMixin). Column format policies
    // below override this per column; formulas still evaluate (formula handling is separate).
    cells.default = { policy: 'raw' };
    // Assign each formatted column's policy via its column-default cell (colId, e.g. 'C').
    for (const [xStr, name] of Object.entries(columnFormats)) {
      if (name) {
        const colId = x2c(Number(xStr));
        cells[colId] = { ...cells[colId], policy: name };
      }
    }
    if (readOnly) {
      // Prevention is resolved from a different bucket per cell kind: data cells stack
      // `default`, column headers stack `defaultCol`, row headers stack `defaultRow`. The
      // Sort/Filter/label column menu and the row menu gate on the HEADER cell's
      // prevention, and row/col insert-remove check the header too — so `default` alone
      // leaves all of those editable. Put the mask on all three.
      cells.default = { ...cells.default, prevention: READ_ONLY_PREVENTION };
      cells.defaultCol = { ...cells.defaultCol, prevention: READ_ONLY_PREVENTION };
      cells.defaultRow = { ...cells.defaultRow, prevention: READ_ONLY_PREVENTION };
    }
    if (headerRow) {
      headerRow.forEach((value, x) => {
        cells[p2a({ y: 0, x: x + 1 })] = { label: value };
      });
    }
    // Pass the parsed data rows as a deferred matrix (origin A1) instead of
    // exploding them into a per-address `cells` object. buildInitialCells only
    // defers (skips eager population of every cell) when the bulk data arrives
    // via `matrices`; a raw `cells` map forces Sheet.initialize to materialize
    // all N cells up front, which is ~1.7s for 1M cells vs ~2ms deferred.
    // Header labels (y=0) and readOnly defaults stay in `cells`.
    const numRows = Math.max(1, dataRows.length) + Math.max(0, extraRows);
    return buildInitialCells({
      cells,
      matrices: { A1: dataRows },
      flattenAs: 'value',
      ensured: { numRows, numCols },
    });
  }, [rows, header, extraRows, extraCols, readOnly, columnFormats]);

  // Extend the column-header menu with a nested "Format ▸" submenu. Grouping keeps the
  // menu compact as formats grow (Number / Date / …); a check marks the column's active
  // format, and onSetFormat lives in App so the choice survives the grid remount that applies it.
  const colMenu = useMemo(() => {
    const item = (opt: FormatOption) => ({
      id: `gs-format-${opt.id || 'plain'}`,
      label: opt.label,
      checked: (_ctx: unknown, x: number) => (columnFormats[x] ?? '') === opt.id,
      onClick: (_ctx: unknown, x: number) => onSetFormat(x, opt.id),
    });
    return [
      ...defaultColMenuDescriptors,
      { type: 'divider' as const },
      {
        type: 'submenu' as const,
        id: 'gs-format',
        label: 'Format',
        children: [
          item({ id: '', label: 'Plain (no format)' }),
          { type: 'divider' as const },
          {
            type: 'submenu' as const,
            id: 'gs-format-number',
            label: 'Number',
            children: numberOptions.map(item),
          },
          { type: 'submenu' as const, id: 'gs-format-date', label: 'Date', children: dateOptions.map(item) },
        ],
      },
    ];
  }, [columnFormats, onSetFormat, numberOptions, dateOptions]);

  return (
    // Save progress goes through GridSheet's `loading` prop so its overlay renders INSIDE the
    // grid root (where the theme tokens live) and is themed correctly. The per-tick re-render
    // is cheap: the grid is virtualized and static during save (O(visible) cells).
    <GridSheet
      book={book}
      sheetRef={sheetRef}
      storeRef={gridStoreRef}
      initialCells={initialCells}
      loading={saving ? { progress, label: 'Saving' } : undefined}
      options={{
        mode,
        sheetWidth: '100%',
        sheetHeight: '100%',
        matrixAlignment: 'both',
        colMenu,
        eager,
      }}
    />
  );
};

const barStyle = {
  padding: '3px 8px',
  fontFamily: 'sans-serif',
  fontSize: 12,
  opacity: 0.9,
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap' as const,
  flex: '0 0 auto' as const,
  borderTop: '1px solid var(--vscode-panel-border, rgba(128,128,128,0.35))',
};

const btnStyle = {
  font: 'inherit',
  cursor: 'pointer',
  color: 'var(--vscode-textLink-foreground, #3794ff)',
  background: 'none',
  border: 'none',
  padding: 0,
};

const checkStyle = { display: 'flex', gap: 4, alignItems: 'center', cursor: 'pointer' };
const fieldStyle = {
  font: 'inherit',
  color: 'inherit',
  background: 'var(--vscode-input-background, transparent)',
  border: '1px solid var(--vscode-input-border, rgba(128,128,128,0.4))',
  borderRadius: 3,
  padding: '1px 4px',
};
const popoverStyle = {
  position: 'absolute' as const,
  bottom: '100%',
  right: 0,
  marginBottom: 6,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 2,
  padding: 6,
  minWidth: 168,
  background: 'var(--vscode-editorWidget-background, var(--vscode-editor-background))',
  border: '1px solid var(--vscode-widget-border, rgba(128,128,128,0.35))',
  borderRadius: 4,
  boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
  zIndex: 100000, // above GridSheet overlays (max 9999)
};
const menuItemStyle = {
  font: 'inherit',
  textAlign: 'left' as const,
  color: 'inherit',
  background: 'none',
  border: 'none',
  borderRadius: 3,
  padding: '3px 6px',
  cursor: 'pointer',
};
// Add popover: a small section label per axis + a row of placement buttons.
const addSectionLabelStyle = {
  fontSize: 10,
  fontWeight: 700 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.6,
  opacity: 0.55,
  padding: '0 2px 3px',
};
const addRowStyle = { display: 'flex', gap: 4 };
const addBtnStyle = {
  ...menuItemStyle,
  flex: 1,
  textAlign: 'center' as const,
  border: '1px solid var(--vscode-input-border, rgba(128,128,128,0.4))',
  padding: '4px 6px',
};
const sep = <span style={{ opacity: 0.35 }}>|</span>;

// A table with a filled top row = "first row is the header".
const HeaderIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" style={{ display: 'block' }}>
    <rect x="2" y="3" width="12" height="10" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <rect x="2.6" y="3.6" width="10.8" height="2.7" fill="currentColor" />
    <path d="M8 6.3v6.4M2.6 9.6h10.8" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
  </svg>
);

// Padlock — open shackle when editable, closed when read-only.
const LockIcon = ({ open }: { open: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" style={{ display: 'block' }}>
    <rect x="3.5" y="7" width="9" height="6.3" rx="1.3" fill="currentColor" />
    <path
      d={open ? 'M6 7V5.1a2.4 2.4 0 0 1 4.7-0.7' : 'M5.7 7V5.1a2.3 2.3 0 0 1 4.6 0V7'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

// Footer icon-toggle (replaces the native checkboxes): the icon + label light up in the
// theme's active-option colors when on, and dim when off.
const Toggle = ({ on, onClick, title, children }: { on: boolean; onClick: () => void; title: string; children: any }) => (
  <button
    type="button"
    className="gs-toggle"
    title={title}
    aria-pressed={on}
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      font: 'inherit',
      cursor: 'pointer',
      padding: '2px 6px',
      borderRadius: 4,
      lineHeight: 1,
      border: `1px solid ${on ? 'var(--vscode-inputOption-activeBorder, #3794ff)' : 'transparent'}`,
      background: on ? 'var(--vscode-inputOption-activeBackground, rgba(55,148,255,0.2))' : 'transparent',
      color: on ? 'var(--vscode-inputOption-activeForeground, inherit)' : 'inherit',
      opacity: on ? 1 : 0.6,
    }}
  >
    {children}
  </button>
);

const App = () => {
  const [data, setData] = useState<DataMessage | null>(null);
  const [rev, setRev] = useState(0);
  const [header, setHeader] = useState(true);
  const [extraRows, setExtraRows] = useState(0);
  const [extraCols, setExtraCols] = useState(0);
  const [addN, setAddN] = useState(1000);
  const [addOpen, setAddOpen] = useState(false);
  // Per-file, footer-controlled. Initialized once from the settings default the host
  // sends in the first 'data' message; the footer toggle owns it afterward.
  const [readOnly, setReadOnly] = useState<boolean | null>(null);
  // Per-column display formats (session-only): grid column index → policy id.
  const [columnFormats, setColumnFormats] = useState<Record<number, string>>({});
  // Bumped each time the host asks us to save (Cmd+S is intercepted extension-side
  // and routed here as a 'requestSave' message); <Grid> serializes on the change.
  const [saveSignal, setSaveSignal] = useState(0);
  // Footer "unsaved" marker: set on any in-memory grid edit, cleared once a save is
  // serialized+posted. (The native tab ● can't be driven without editing the TextDocument
  // on every change, which is exactly the freeze we removed — so we show our own marker.)
  const [dirty, setDirty] = useState(false);
  const onDirty = useCallback(() => setDirty(true), []);
  // Distinct from the user-edit `dirty` above: set when function/AI *evaluation*
  // produces values not yet written to the file (baked on save when
  // evaluateFormulas is on). Shown as its own footer marker so a user can tell
  // "I typed this" apart from "a formula / AI computed this".
  const [evalDirty, setEvalDirty] = useState(false);
  const onComputed = useCallback(() => setEvalDirty(true), []);
  // Latest `evaluate` flag, readable from the mount-time message handler closure.
  const evaluateRef = useRef(true);
  // 0..1 while the host chunk-parses the file on open; null once data has arrived.
  const [loadProgress, setLoadProgress] = useState<number | null>(null);
  const mode = useVscodeMode();

  // Set/clear a column's display format, then rebuild from the authoritative document
  // (like the header / read-only toggles) so the new policy is applied on remount.
  const onSetFormat = useCallback((x: number, id: string) => {
    setColumnFormats((prev) => {
      const next = { ...prev };
      if (id) {
        next[x] = id;
      } else {
        delete next[x];
      }
      return next;
    });
    vscodeApi.postMessage({ type: 'requestData' });
  }, []);

  // Close the Add popover on an outside click.
  const addRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!addOpen) {
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) {
        setAddOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [addOpen]);

  // "at end" grows the empty margin (view-only, trimmed on save); "at selection"
  // is a real structural insert at the selected cell (shifts data, persists).
  const doAdd = (target: 'rows' | 'cols', where: 'end' | 'selection') => {
    const n = Math.max(1, addN);
    if (where === 'selection') {
      const handle = gridStoreRef.current;
      if (handle) {
        const { y, x } = handle.store.choosing;
        handle.dispatch(
          target === 'rows'
            ? userActions.insertRowsAbove({ y, numRows: n })
            : userActions.insertColsLeft({ x, numCols: n }),
        );
      }
    } else if (target === 'rows') {
      setExtraRows((v) => v + n);
    } else {
      setExtraCols((v) => v + n);
    }
    setAddOpen(false);
  };

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as
        | DataMessage
        | AiBatchResponse
        | { type: 'paste'; text?: string }
        | { type: 'requestSave' }
        | { type: 'loadProgress'; ratio: number };
      if (msg?.type === 'aiBatchResult') {
        handleAiResult(msg);
        // Resolved formula/AI values are new content that a save will bake in
        // (evaluateFormulas on) — flag it as evaluation-dirty, kept separate from
        // the user-edit marker so the footer can show the two distinctly.
        if (evaluateRef.current) {
          setEvalDirty(true);
        }
        return;
      }
      if (msg?.type === 'requestSave') {
        setSaveSignal((s) => s + 1); // ask the active <Grid> to serialize + persist
        return;
      }
      if (msg?.type === 'loadProgress') {
        setLoadProgress(msg.ratio); // drives the open-time progress bar
        return;
      }
      if (msg?.type === 'paste') {
        applyPaste(msg.text ?? '');
        return;
      }
      if (msg?.type === 'data') {
        setData(msg);
        setRev((r) => r + 1); // remount <Grid> with the fresh, authoritative content
        setReadOnly((prev) => (prev === null ? !!msg.readOnly : prev)); // seed once from the setting
        setDirty(false); // fresh authoritative content ⇒ nothing unsaved
        setEvalDirty(false); // …and nothing pending from evaluation
        setLoadProgress(null); // parsing done — hide the load bar
      }
    };
    window.addEventListener('message', handler);
    vscodeApi.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', handler);
  }, []);

  // When a view param changes (header / extra rows), pull the latest document so
  // the remount rebuilds from authoritative content — never from stale local rows.
  const firstParams = useRef(true);
  useEffect(() => {
    if (firstParams.current) {
      firstParams.current = false;
      return;
    }
    vscodeApi.postMessage({ type: 'requestData' });
  }, [header, extraRows, extraCols]);

  // Report unsaved state to the host whenever it changes, so other extensions can
  // check it (via the extension API) before overwriting the file.
  useEffect(() => {
    vscodeApi.postMessage({ type: 'dirtyState', dirty, evalDirty });
  }, [dirty, evalDirty]);

  // Save-only: the serialized text is sent (and the file written) just on save.
  // Clearing dirty here is optimistic (the extension performs the actual write).
  const onSave = (text: string) => {
    vscodeApi.postMessage({ type: 'save', text });
    setDirty(false);
    setEvalDirty(false); // save serializes evaluated values too, so both clear
  };

  if (!data) {
    // Same overlay as save/paste (core ProgressOverlay). GridSheet isn't mounted yet, so its
    // theme tokens aren't in scope here — supply the ones ProgressOverlay needs, per VS Code
    // theme (mode), on this positioned full-height container.
    return (
      <div style={{ position: 'relative', height: '100%', ...GRID_THEME_TOKENS[mode] }}>
        <ProgressOverlay progress={loadProgress ?? null} label="Loading" />
      </div>
    );
  }

  const rows = data.rows;
  const cols = maxRowLength(rows);
  const ro = readOnly ?? !!data.readOnly;
  const evaluate = data.evaluate ?? true;
  evaluateRef.current = evaluate; // keep the handler closure's view current
  const eager = data.eager ?? true;
  const dateFormats = data.dateFormats ?? EMPTY_STRING_ARRAY;
  const aiCustom = data.aiCustom ?? EMPTY_AI_CUSTOM;
  // Only number parsing defaults on (round-trip-safe); date/time/bool are opt-in because
  // coercing them changes what's written back on save. Grid memoizes on the fields, not this
  // object, so building it inline each render is fine.
  const parseFlags: ParseFlags = {
    number: data.parseNumber ?? true,
    date: data.parseDate ?? false,
    time: data.parseTime ?? false,
    bool: data.parseBool ?? false,
  };
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '1 1 auto', minHeight: 0 }}>
        <Grid
          key={rev}
          rows={rows}
          header={header}
          extraRows={extraRows}
          extraCols={extraCols}
          evaluate={evaluate}
          eager={eager}
          delimiter={data.delimiter}
          mode={mode}
          readOnly={ro}
          columnFormats={columnFormats}
          onSetFormat={onSetFormat}
          dateFormats={dateFormats}
          parseFlags={parseFlags}
          aiCustom={aiCustom}
          saveSignal={saveSignal}
          onSave={onSave}
          onDirty={onDirty}
          onComputed={onComputed}
        />
      </div>

      <div style={barStyle}>
        <style>{`.gs-toggle:hover{background:var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.18)) !important;opacity:1 !important}`}</style>
        <span style={{ opacity: 0.6 }}>
          {data.delimiter} · {rows.length}×{cols}
        </span>
        {!ro && dirty && (
          <span
            title="Unsaved edits — press Cmd/Ctrl+S to write them to the file"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d)' }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>●</span>
            Unsaved
          </span>
        )}
        {!ro && evalDirty && (
          <span
            title="Computed values (formulas / AI) not yet written — press Cmd/Ctrl+S to bake them into the file"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--vscode-charts-purple, #b180d7)' }}
          >
            <span style={{ fontSize: 13, lineHeight: 1, fontStyle: 'italic', fontWeight: 700 }}>ƒ</span>
            Computed
          </span>
        )}
        {sep}
        <Toggle on={header} onClick={() => setHeader((v) => !v)} title="Use the first row as column labels">
          <HeaderIcon />
          Header row
        </Toggle>
        <Toggle
          on={ro}
          title="View-only: block edits and never write back to the file (per file). Default is gridsheet.viewer.readOnly."
          onClick={() => {
            setReadOnly(!ro);
            // Rebuild from the authoritative document (which already has any edits made
            // in editable mode) so toggling never remounts from stale local rows.
            vscodeApi.postMessage({ type: 'requestData' });
          }}
        >
          <LockIcon open={!ro} />
          Read-only
        </Toggle>
        {sep}
        <button
          style={btnStyle}
          title="Open GridSheet settings (line ending, =CLAUDE / =CODEX models, tools, repo access)"
          onClick={() => vscodeApi.postMessage({ type: 'openSettings' })}
        >
          ⚙ Settings
        </button>
        <span style={{ flex: 1 }} />
        {!ro && (
        <div ref={addRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button style={{ ...btnStyle, fontWeight: 700 }} title="Add rows or columns" onClick={() => setAddOpen((o) => !o)}>
            ＋ Add ▾
          </button>
          {addOpen && (
            <div style={{ ...popoverStyle, minWidth: 200 }}>
              <style>{`.gs-add-item:hover{background:var(--vscode-list-hoverBackground, rgba(128,128,128,0.18)) !important}`}</style>
              <label style={{ ...checkStyle, cursor: 'default', justifyContent: 'space-between', padding: '0 2px 4px' }}>
                Count
                <input
                  type="number"
                  min={1}
                  value={addN}
                  onInput={(e) => setAddN(Math.max(1, Number((e.target as HTMLInputElement).value) || 1))}
                  style={{ ...fieldStyle, width: 84 }}
                />
              </label>
              <div style={{ height: 1, background: 'var(--vscode-widget-border, rgba(128,128,128,0.35))', margin: '2px 0 5px' }} />
              {/* Rows first — adding rows is the common case. */}
              <div style={addSectionLabelStyle}>Rows</div>
              <div style={addRowStyle}>
                <button className="gs-add-item" style={addBtnStyle} onClick={() => doAdd('rows', 'end')}>
                  At end
                </button>
                <button className="gs-add-item" style={addBtnStyle} onClick={() => doAdd('rows', 'selection')}>
                  At selection
                </button>
              </div>
              <div style={{ ...addSectionLabelStyle, paddingTop: 8 }}>Columns</div>
              <div style={addRowStyle}>
                <button className="gs-add-item" style={addBtnStyle} onClick={() => doAdd('cols', 'end')}>
                  At end
                </button>
                <button className="gs-add-item" style={addBtnStyle} onClick={() => doAdd('cols', 'selection')}>
                  At selection
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

render(<App />, document.getElementById('root')!);
