// Per-provider AI formula functions (=CLAUDE, =CODEX and their .BOOL/.NUMBER
// variants). These run inside the webview's engine; they cannot call a CLI
// directly, so main() serializes the prompt+context and hands it to `enqueue`,
// which batches requests and bridges to the extension host over postMessage.
//
// The engine treats a Promise-returning main() as async: call() returns a
// Pending sentinel immediately (cell shows `gs-pending`), dedupes identical
// calls via the async cache, and re-renders when the Promise resolves.

import { BaseFunctionAsync, type FunctionArgumentDefinition, type FunctionCategory, type FunctionMapping } from '@gridsheet/preact-core';
import type { AiKind, AiProvider } from '../src/aiTypes';

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
      return headers[0] != null ? `${headers[0]}: ${v}` : v;
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

const labels: Record<AiProvider, string> = { claude: 'Claude', codex: 'Codex (OpenAI)' };
const kindDesc: Record<AiKind, string> = { text: 'text', bool: 'a boolean', number: 'a number' };

const makeAiClass = (provider: AiProvider, kind: AiKind, enqueue: AiEnqueue): typeof BaseFunctionAsync => {
  const suffix = kind === 'text' ? '' : `.${kind.toUpperCase()}`;
  return class extends BaseFunctionAsync {
    example = `${provider.toUpperCase()}${suffix}("...")`;
    description = `Resolve a prompt via the ${labels[provider]} CLI, returning ${kindDesc[kind]}.`;
    category: FunctionCategory = 'other';
    defs = defs;
    // Each cell is one independent call — never spill a matrix into many calls.
    protected broadcastDisabled = true;

    protected main(prompt: unknown, ...context: unknown[]): Promise<unknown> {
      const blocks = context.map((arg) => serializeArg(arg, (v) => this.toMatrix(v))).filter((b) => b !== '');
      const instruction = cell(prompt);
      const full = blocks.length > 0 ? `${instruction}\n\n${blocks.join('\n\n')}` : instruction;
      return enqueue(provider, kind, full);
    }
  };
};

/** Build the =CLAUDE / =CODEX function family (× text/.BOOL/.NUMBER). */
export const makeAiFunctions = (enqueue: AiEnqueue): FunctionMapping => {
  const map: FunctionMapping = {};
  for (const provider of ['claude', 'codex'] as AiProvider[]) {
    map[provider] = makeAiClass(provider, 'text', enqueue);
    map[`${provider}.bool`] = makeAiClass(provider, 'bool', enqueue);
    map[`${provider}.number`] = makeAiClass(provider, 'number', enqueue);
  }
  return map;
};
