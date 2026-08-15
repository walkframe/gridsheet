# @gridsheet/engine

The **headless** spreadsheet model + formula resolution engine that powers
[gridsheet](https://gridsheet.walkframe.com/). It has **zero React/DOM
dependency** and can be imported on its own from a CLI, a VS Code extension
host, a CI job, or a backend to resolve formulas — including **async** ones
(e.g. `=AI(...)`) — without rendering anything.

`@gridsheet/web` (and the React/Vue/Svelte/Preact bindings built on it) depend
on this package; the dependency is one-directional (`web → engine`).

## What it provides

- **Parse + evaluate**: `Lexer` / `FormulaParser`, sync evaluation.
- **Explicit resolution** (no render side-effect): `Sheet.resolveFormulas()`,
  `Sheet.resolveAll()`, `Sheet.waitForPending()`.
- **Injectable async resolvers**: register any async function via
  `createRegistry({ additionalFunctions })` using `BaseFunctionAsync`. The
  interface is generic — `=AI()` is just one such function; the engine never
  hardcodes who resolves it.
- **Materialize values** headlessly: `toValueMatrix()` / `toValueObject()` etc.

## Headless example

```ts
import { Sheet, createRegistry, toValueMatrix, BaseFunctionAsync } from '@gridsheet/engine';

// Caller decides HOW an async function resolves (local agent / vscode.lm / cache / backend).
class AiFunction extends BaseFunctionAsync {
  main(prompt: any) {
    return myResolver(prompt); // returns a Promise
  }
}

const registry = createRegistry({ additionalFunctions: { ai: AiFunction } });
const sheet = new Sheet({ name: 'Sheet1', registry, eager: true });
sheet.initialize({ A1: { value: 'summarize' }, B1: { value: '=AI(A1)' } });
registry.contextsBySheetId[sheet.id] = { store: { sheetReactive: { current: sheet } }, dispatch: () => {} };
sheet.resolveFormulas();

sheet.resolveAll();            // fire async formulas explicitly (no render)
await sheet.waitForPending();  // await completion

const matrix = toValueMatrix(sheet, { area: { top: 1, left: 1, bottom: 1, right: 2 } });
// matrix holds the materialized values, including the resolved =AI(A1).
```

## License

Apache-2.0
