import {
  Sheet,
  createRegistry,
  toValueMatrix,
  Lexer,
  BaseFunctionAsync,
  type FunctionArgumentDefinition,
  type FunctionCategory,
} from './index';

// A quoted sheet name may contain dots (a file path like 'sub/data.csv'). The
// tokenizer must treat 'name'!A1 as a cross-sheet REF, not mistake the dot for a
// partial function name (which produced #NAME? and broke path-based references).
describe('sheet-reference tokenization', () => {
  const typesOf = (formula: string) => {
    const lexer = new Lexer(formula);
    lexer.tokenize();
    return lexer.tokens.map((t) => t.type);
  };

  it("tokenizes 'a.csv'!A1 as a REF (not INVALID_REF)", () => {
    const types = typesOf("'a.csv'!A1");
    expect(types).toContain('REF');
    expect(types).not.toContain('INVALID_REF');
  });

  it("tokenizes 'sub/data.csv'!B2 as a REF", () => {
    const types = typesOf("'sub/data.csv'!B2");
    expect(types).toContain('REF');
    expect(types).not.toContain('INVALID_REF');
  });

  it('still treats a dotted bareword before "(" as a function, not a ref', () => {
    // e.g. a namespaced function call shouldn't be misread as a reference.
    const types = typesOf('NS.FN(1)');
    expect(types).toContain('FUNCTION');
    expect(types).not.toContain('REF');
  });
});

/**
 * Headless resolution — no UI, no DOM.
 *
 * These tests run under Jest's default `node` environment (NOT jsdom), so there
 * is genuinely no `document`/`window`. They prove that `@gridsheet/engine`
 * resolves formulas — both plain sync ones and async ones backed by an injected
 * resolver (the `=AI()` shape) — without ever rendering a component. This is the
 * CLI / extension-host / backend / CI use case: build a Sheet, resolve it
 * explicitly, read the materialized values.
 *
 * The DOM guard below is the load-bearing assertion: if someone reintroduces a
 * top-level DOM dependency into the engine, this file fails.
 */

it('runs with no DOM globals (guards the headless contract)', () => {
  expect(typeof (globalThis as any).document).toBe('undefined');
  expect(typeof (globalThis as any).window).toBe('undefined');
});

describe('headless formula resolution (no UI)', () => {
  // An async function whose result is produced by a caller-injected resolver.
  // The engine never hardcodes who resolves it — this is the generic `=AI()`
  // injection point, usable for a local agent, vscode.lm, a cache, or a backend.
  const makeAiFunction = (resolver: (prompt: any) => Promise<any>) =>
    class AiFunction extends BaseFunctionAsync {
      example = 'AI("prompt")';
      description = 'Resolves a prompt via an injected async resolver.';
      category: FunctionCategory = 'other';
      defs: FunctionArgumentDefinition[] = [
        { name: 'prompt', description: 'prompt', acceptedTypes: ['string', 'number'] },
      ];
      protected broadcastDisabled = true;
      protected main(prompt: any): Promise<any> {
        return resolver(prompt);
      }
    };

  // Wire a bare Sheet into its Registry the way a framework store would, so
  // sheet-qualified references resolve outside a live UI.
  const headlessSheet = (registry: ReturnType<typeof createRegistry>, cells: any) => {
    const sheet = new Sheet({ name: 'Sheet1', registry, eager: true });
    sheet.initialize(cells);
    registry.contextsBySheetId[sheet.id] = {
      store: { sheetReactive: { current: sheet } },
      dispatch: () => {},
    } as any;
    sheet.resolveFormulas();
    return sheet;
  };

  it('evaluates a sync formula without any resolve()/render trigger', () => {
    const registry = createRegistry();
    const sheet = headlessSheet(registry, {
      A1: { value: 10 },
      A2: { value: 20 },
      B1: { value: '=A1+A2' },
      B2: { value: '=SUM(A1:A2)*2' },
    });
    // Sync formulas resolve on read — no async, no render needed.
    const matrix = toValueMatrix(sheet, { area: { top: 1, left: 2, bottom: 2, right: 2 } });
    expect(matrix[0][0]).toBe(30); // B1
    expect(matrix[1][0]).toBe(60); // B2
  });

  it('resolves an async =AI() formula via an injected resolver, then materializes it', async () => {
    const calls: any[] = [];
    const resolver = async (prompt: any) => {
      calls.push(prompt);
      return `AI(${prompt}) => 42`;
    };
    const registry = createRegistry({ additionalFunctions: { ai: makeAiFunction(resolver) } });
    const sheet = headlessSheet(registry, {
      A1: { value: 'summarize sales' },
      B1: { value: '=AI(A1)' },
      C1: { value: '=A1' }, // sync alongside async
    });

    // Nothing has fired yet: no render happened.
    expect(calls).toHaveLength(0);

    // Explicit resolution — the whole point: caller triggers it, not a render.
    const visited = sheet.resolveAll();
    expect(visited).toBe(1); // exactly the one async cell
    expect(calls).toEqual(['summarize sales']); // injected resolver was called

    // Await async completion explicitly, then read the materialized values.
    await sheet.waitForPending();
    const matrix = toValueMatrix(sheet, { area: { top: 1, left: 2, bottom: 1, right: 3 } });
    expect(matrix[0][0]).toBe('AI(summarize sales) => 42'); // B1 (async)
    expect(matrix[0][1]).toBe('summarize sales'); // C1 (sync)
  });

  it('lets the caller swap resolvers per context (no-op vs real)', async () => {
    // e.g. a CI/no-op context returns a placeholder; a real context calls a backend.
    const noop = async () => '(unresolved)';
    const registry = createRegistry({ additionalFunctions: { ai: makeAiFunction(noop) } });
    const sheet = headlessSheet(registry, { A1: { value: 'x' }, B1: { value: '=AI(A1)' } });
    sheet.resolveAll();
    await sheet.waitForPending();
    const matrix = toValueMatrix(sheet, { area: { top: 1, left: 2, bottom: 1, right: 2 } });
    expect(matrix[0][0]).toBe('(unresolved)');
  });
});
