// Per-provider AI formula functions (=CLAUDE, =CODEX and their .BOOL/.NUMBER
// variants). These run inside the webview's engine; they cannot call a CLI
// directly, so main() serializes the prompt+context and hands it to `enqueue`,
// which batches requests and bridges to the extension host over postMessage.
//
// The engine treats a Promise-returning main() as async: call() returns a
// Pending sentinel immediately (cell shows `gs-pending`), dedupes identical
// calls via the async cache, and re-renders when the Promise resolves.

import { BaseFunctionAsync, type FunctionArgumentDefinition, type FunctionCategory, type FunctionMapping } from '@gridsheet/preact-core';
import type { AiCustomFunction, AiKind, AiProvider } from '../src/aiTypes';

export type AiEnqueue = (provider: AiProvider, kind: AiKind, prompt: string) => Promise<string | number | boolean>;

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
      lines.push(headers.map((h) => quote(h ?? '')).join(','));
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

const kindDesc: Record<AiKind, string> = { text: 'text', bool: 'a boolean', number: 'a number' };

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
    category: FunctionCategory = 'other';
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
    for (const kind of ['text', 'bool', 'number'] as AiKind[]) {
      const key = kind === 'text' ? provider : `${provider}.${kind}`;
      map[key] = makeAiClass(provider, kind, enqueue, {
        name: provider,
        description: `Resolve a prompt via the ${label} CLI, returning ${kindDesc[kind]}.`,
      });
    }
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
      const kind = (variant as AiKind) || 'text';
      if ((base === 'claude' || base === 'codex') && kind in kindDesc) {
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
