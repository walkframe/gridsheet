// Per-provider AI formula functions (=CLAUDE, =CODEX and their .BOOL/.NUMBER
// variants). These run inside the webview's engine; they cannot call a CLI
// directly, so main() serializes the prompt+context and hands it to `enqueue`,
// which batches requests and bridges to the extension host over postMessage.
//
// The engine treats a Promise-returning main() as async: call() returns a
// Pending sentinel immediately (cell shows `gs-pending`), dedupes identical
// calls via the async cache, and re-renders when the Promise resolves.

import {
  BaseFunctionAsync,
  FormulaError,
  type FunctionArgumentDefinition,
  type FunctionCategory,
  type FunctionMapping,
} from '@gridsheet/preact-core';
import type { AiCustomFunction, AiKind, AiProvider } from '../src/aiTypes';

export type AiEnqueue = (
  provider: AiProvider,
  kind: AiKind,
  prompt: string,
) => Promise<string | number | boolean | string[][]>;

const cell = (v: unknown): string => (v == null ? '' : String(v));
// RFC-4180 style quoting — safer than TSV (tabs collapse/mangle silently).
const quote = (v: string): string => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

// Duck-type a Sheet (a range/cell reference value) without importing engine internals.
const isSheetLike = (v: unknown): boolean =>
  v != null && (v as any).__gsType === 'Sheet' && typeof (v as any).getCell === 'function';

// Header label for absolute column x (row 0 holds labels in header mode). Empty
// when there's no header (header mode off, cross-file ref, or a blank label).
const headerLabel = (arg: any, x: number): string | undefined => {
  const label = arg.getCell?.({ y: 0, x }, { resolution: 'SYSTEM' })?.label;
  return label == null || label === '' ? undefined : String(label);
};

// Serialize one context argument, pairing values with their column headers so the
// model sees `id: 1` (single cell) or a header-topped CSV (range) instead of bare
// numbers. Non-reference values (literals, concatenations) and header-less columns
// fall back to raw value / header-less CSV.
const serializeArg = (arg: unknown, toMatrix: (v: unknown) => unknown[][]): string => {
  if (arg == null) {
    return '';
  }
  const matrix = toMatrix(arg);
  if (!matrix || matrix.length === 0) {
    return '';
  }
  const single = matrix.length === 1 && (matrix[0]?.length ?? 0) <= 1;

  if (isSheetLike(arg)) {
    const left = (arg as any).left as number;
    const right = (arg as any).right as number;
    const headers: (string | undefined)[] = [];
    let hasHeader = false;
    for (let x = left; x <= right; x++) {
      const h = headerLabel(arg, x);
      if (h != null) {
        hasHeader = true;
      }
      headers.push(h);
    }
    if (single) {
      const v = cell(matrix[0]?.[0]);
      // Tag the value with its column name as a leading (column "x") marker rather than an
      // inline `x: value` prefix. The prefix reads as part of the value and gets echoed into
      // the answer (e.g. translating `note: …` → `注記: …`); the parenthetical marker keeps
      // the header as pure metadata the model treats as context, not payload.
      return headers[0] != null ? `(column "${headers[0]}") ${v}` : v;
    }
    const lines: string[] = [];
    if (hasHeader) {
      // Column names as a leading `(columns: …)` metadata note — NOT a CSV header row — so the
      // model treats them as context and doesn't echo `item,description` back into the answer
      // (same reason as the single-cell `(column "x")` marker above). The batch prompt tells
      // the model these leading `(column…)` lines are context only.
      lines.push(`(columns: ${headers.map((h) => h ?? '').join(', ')})`);
    }
    for (const row of matrix) {
      lines.push(row.map((v) => quote(cell(v))).join(','));
    }
    return lines.join('\n');
  }

  if (single) {
    return cell(matrix[0]?.[0]);
  }
  return matrix.map((row) => row.map((v) => quote(cell(v))).join(',')).join('\n');
};

const defs: FunctionArgumentDefinition[] = [
  { name: 'prompt', description: 'Instruction sent to the model.', acceptedTypes: ['string', 'number'] },
  {
    name: 'context',
    description: 'Optional cell or range appended to the prompt as data.',
    acceptedTypes: ['any', 'matrix'],
    takesMatrix: true,
    variadic: true,
    optional: true,
  },
];

// The scalar kinds (one value per cell). 'array' is NOT here: it returns a whole grid and rides a
// different path (makeAiArrayClass), so it must never be reachable through the scalar makeAiClass.
type AiScalarKind = 'text' | 'bool' | 'number';
const isScalarKind = (k: string): k is AiScalarKind => k === 'text' || k === 'bool' || k === 'number';
const kindDesc: Record<AiScalarKind, string> = { text: 'text', bool: 'a boolean', number: 'a number' };

const makeAiClass = (
  provider: AiProvider,
  kind: AiKind,
  enqueue: AiEnqueue,
  opts: { name: string; description: string },
): typeof BaseFunctionAsync => {
  const suffix = kind === 'text' ? '' : `.${kind.toUpperCase()}`;
  const fn = `${opts.name.toUpperCase()}${suffix}`;
  // A realistic example per kind: a prompt, a per-row range, and a $-locked cell (shared
  // instruction/criterion pinned so it doesn't shift when the formula is filled down).
  const example =
    kind === 'bool'
      ? `${fn}("Is it urgent?", B2:B100, $C$1)`
      : kind === 'number'
        ? `${fn}("Rate urgency 1-5", B2:B100, $C$1)`
        : `${fn}("Summarize each issue", B2:B100, $C$1)`;
  return class extends BaseFunctionAsync {
    example = example;
    description = opts.description;
    category: FunctionCategory = 'ai';
    defs = defs;
    // Each cell is one independent call — never spill a matrix into many calls.
    protected broadcastDisabled = true;

    protected main(prompt: unknown, ...context: unknown[]): Promise<unknown> {
      const blocks = context.map((arg) => serializeArg(arg, (v) => this.toMatrix(v))).filter((b) => b !== '');
      const instruction = cell(prompt);
      // Label the two parts so the model applies the instruction TO the data instead of
      // treating the instruction text itself as the payload (e.g. translating "翻訳して"
      // into "Translate" rather than translating the referenced cell).
      const full = blocks.length > 0 ? `Instruction: ${instruction}\n\nData:\n${blocks.join('\n\n')}` : instruction;
      return enqueue(provider, kind, full);
    }
  };
};

// Column headers for a sheet-like range arg, indexed by RELATIVE column (0 = leftmost).
const rangeHeaders = (arg: any): (string | undefined)[] => {
  const left = arg.left as number;
  const right = arg.right as number;
  const headers: (string | undefined)[] = [];
  for (let x = left; x <= right; x++) {
    headers.push(headerLabel(arg, x));
  }
  return headers;
};

// Pad ragged rows to a rectangle so the spill footprint is well-defined.
const rectangularize = (matrix: unknown[][]): unknown[][] => {
  const cols = matrix.reduce((max, row) => Math.max(max, row.length), 0);
  return matrix.map((row) => (row.length === cols ? row : [...row, ...Array(cols - row.length).fill('')]));
};

// =CLAUDE.ARRAY / =CODEX.ARRAY — a spilling AI function with two modes, chosen by the input shape:
//
//  • per-cell map (deterministic) — when the multi-cell range args all share one shape. Each cell
//    position is one independent call (corresponding cells across ranges zipped into one prompt),
//    and the output spills at exactly that shape. Best for "translate/classify every cell".
//
//  • AI-grid (AI decides the size) — when there is no range, or the ranges differ in shape. One
//    call takes all context, and a schema-enforced string[][] comes back; the spill size is
//    whatever the model returns (#SPILL! guards obstruction, like a dynamic array). Best for
//    "split into columns", "build a summary table", "list N items".
//
// autoSpilling wraps main()'s resolved matrix in a Spilling (async-aware since __base.ts _main),
// so main() just returns Promise<matrix>; broadcastDisabled keeps the engine from expanding us.
const makeAiArrayClass = (
  provider: AiProvider,
  enqueue: AiEnqueue,
  opts: { name: string; description: string },
): typeof BaseFunctionAsync => {
  const fn = `${opts.name.toUpperCase()}.ARRAY`;
  const example = `${fn}("Translate to English", B2:C100)`;
  return class extends BaseFunctionAsync {
    example = example;
    description = opts.description;
    category: FunctionCategory = 'ai';
    defs = defs;
    // We produce one matrix ourselves; autoSpilling turns it into a spill.
    protected broadcastDisabled = true;
    protected autoSpilling = true;

    protected async main(prompt: unknown, ...context: unknown[]): Promise<unknown[][]> {
      const instruction = cell(prompt);

      // Classify context: multi-cell ranges drive the shape; single cells/literals are shared
      // context appended to every prompt (a $C$1 criterion never forces AI-grid mode).
      const ranges: { arg: unknown; matrix: unknown[][]; headers: (string | undefined)[] }[] = [];
      const sharedBlocks: string[] = [];
      for (const arg of context) {
        const m = this.toMatrix(arg);
        if (m && (m.length > 1 || (m[0]?.length ?? 0) > 1)) {
          ranges.push({ arg, matrix: m, headers: isSheetLike(arg) ? rangeHeaders(arg) : [] });
        } else {
          const block = serializeArg(arg, (v) => this.toMatrix(v));
          if (block !== '') {
            sharedBlocks.push(block);
          }
        }
      }

      const rows = ranges[0]?.matrix.length ?? 0;
      const cols = ranges[0]?.matrix[0]?.length ?? 0;
      const sameShape =
        ranges.length > 0 &&
        ranges.every((r) => r.matrix.length === rows && (r.matrix[0]?.length ?? 0) === cols);

      // AI-grid: no range, or ranges disagree on shape → one call, AI-decided size.
      if (!sameShape) {
        const blocks = [...ranges.map((r) => serializeArg(r.arg, (v) => this.toMatrix(v))), ...sharedBlocks].filter(
          (b) => b !== '',
        );
        const data = blocks.length > 0 ? `\n\nData:\n${blocks.join('\n\n')}` : '';
        const full = `Instruction: ${instruction}${data}`;
        const grid = (await enqueue(provider, 'array', full)) as unknown[][];
        return Array.isArray(grid) && grid.length > 0 ? rectangularize(grid) : [['']];
      }

      // per-cell map: one call per cell position, zipping the corresponding cell of each range.
      // A failed call becomes a #AI! error in that cell (never rejects the whole spill); a position
      // that is empty across every range resolves to '' without spending a call.
      const resolveCell = async (r: number, c: number): Promise<unknown> => {
        const cellBlocks: string[] = [];
        for (const range of ranges) {
          const v = cell(range.matrix[r]?.[c]);
          if (v === '') {
            continue;
          }
          cellBlocks.push(range.headers[c] != null ? `(column "${range.headers[c]}") ${v}` : v);
        }
        if (cellBlocks.length === 0) {
          return '';
        }
        const full = `Instruction: ${instruction}\n\nData:\n${[...cellBlocks, ...sharedBlocks].join('\n\n')}`;
        try {
          return await enqueue(provider, 'text', full);
        } catch (e: any) {
          return new FormulaError('#AI!', e?.message ?? String(e), e instanceof Error ? e : undefined);
        }
      };

      return Promise.all(
        Array.from({ length: rows }, (_, r) => Promise.all(Array.from({ length: cols }, (_, c) => resolveCell(r, c)))),
      );
    }
  };
};

/**
 * Build the AI function family: the built-in =CLAUDE / =CODEX (× text/.BOOL/.NUMBER), plus any
 * user-defined =NAME functions (gridsheet.ai.custom) — text-only, since an arbitrary CLI can't
 * be held to a typed JSON schema. A custom name that collides with a built-in is ignored.
 */
export const makeAiFunctions = (enqueue: AiEnqueue, custom: AiCustomFunction[] = []): FunctionMapping => {
  const map: FunctionMapping = {};
  const builtinLabels: Record<string, string> = { claude: 'Claude', codex: 'Codex (OpenAI)' };
  for (const provider of ['claude', 'codex']) {
    const label = builtinLabels[provider];
    for (const kind of ['text', 'bool', 'number'] as AiScalarKind[]) {
      const key = kind === 'text' ? provider : `${provider}.${kind}`;
      map[key] = makeAiClass(provider, kind, enqueue, {
        name: provider,
        description: `Resolve a prompt via the ${label} CLI, returning ${kindDesc[kind]}.`,
      });
    }
    map[`${provider}.array`] = makeAiArrayClass(provider, enqueue, {
      name: provider,
      description:
        `Spill a grid from a prompt via the ${label} CLI. Same-shaped range(s) map cell-by-cell ` +
        `(same-shape output); otherwise the model returns a grid of its own size.`,
    });
  }
  for (const def of custom) {
    const name = def?.name?.trim();
    if (!name) {
      continue;
    }
    const key = name.toLowerCase();
    if (map[key]) {
      continue; // don't shadow a built-in (claude/codex) or a duplicate
    }
    if (def.alias) {
      // Alias a built-in (+ optional .bool/.number kind), so this custom-named function rides
      // the schema-typed batch path. e.g. alias "claude.bool" → claude/bool.
      const [base, variant] = def.alias.trim().toLowerCase().split('.');
      const kind = variant || 'text';
      // Only scalar kinds ride the alias path — an alias to `.array` is rejected (isScalarKind).
      if ((base === 'claude' || base === 'codex') && isScalarKind(kind)) {
        map[key] = makeAiClass(base, kind, enqueue, {
          name,
          description: `${name} — alias for ${def.alias} (returns ${kindDesc[kind]}).`,
        });
      }
      continue;
    }
    if (def.command) {
      // Custom CLI: text only (an arbitrary CLI can't be held to a JSON schema). Show the
      // command in the description since there's no per-function description field.
      map[key] = makeAiClass(key, 'text', enqueue, { name, description: `Runs: ${def.command.trim()}` });
    }
  }
  return map;
};
