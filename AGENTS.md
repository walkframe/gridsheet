# GridSheet monorepo — agent guide

Guidance for AI coding agents working in this repo. This is the canonical file (the cross-tool
`AGENTS.md` standard); `CLAUDE.md` just imports it.

Headless spreadsheet engine + framework bindings (React/Preact/Vue/Svelte) + a VSCode CSV
extension. GitHub org: `walkframe`. Docs site deployed to Cloudflare Pages.

## Package manager & tooling

- **pnpm** (workspaces, `pnpm-workspace.yaml` → `packages/*` + `e2e/`). Not npm/yarn.
- No monorepo tool (no turbo/nx/lerna) — orchestration is hand-rolled root `package.json` scripts.
- Each package builds with **Vite**; unit tests with **Jest**; e2e with **Playwright**.
- Node 24 (`.tool-versions`).

## Packages (dependency order)

`engine → web → {react-core, preact-core, functions}; engine → xlsx; preact-core → vue-core; react-core → react-dev`

| dir | package | what |
|---|---|---|
| engine | `@gridsheet/engine` | Headless, DOM-free model + formula engine. Single source of the shared classes. |
| web | `@gridsheet/web` | DOM rendering layer (input, popup, virtualization, styles). Re-exports engine. |
| react-core | `@gridsheet/react-core` | Main React binding (`GridSheet`, hooks, store). |
| preact-core | `@gridsheet/preact-core` | Preact build via react→preact/compat alias; `.d.ts` copied from react-core. |
| vue-core | `@gridsheet/vue-core` | Vue wrapper around preact-core. |
| svelte-core | `@gridsheet/svelte-core` | Svelte implementation. |
| react-dev | `@gridsheet/react-dev` | Dev tools for React (`Debugger`). peerDep on web. |
| functions | `@gridsheet/functions` | Extended formula functions. peerDep on web. |
| xlsx | `@gridsheet/xlsx` | xlsx ⇄ GridSheet converter (values + formulas). Headless. peerDep on engine; deps `fflate`. |
| docs | `@gridsheet/docs` (private) | Astro + Starlight docs site. |
| storybook | `@gridsheet/storybook` (private) | Stories; **the e2e target** (served on :5233). |
| vscode-csv-viewer | `csv-gridsheet` (private) | VSCode extension "CSV Spreadsheet — GridSheet". |

**Why the engine split**: all packages must share ONE copy of the model classes. Duplicated
copies broke `instanceof` across bindings (e.g. `SUM` returned 0 for Preact). Keep model
classes only in `engine`.

## Common commands (from repo root)

```bash
pnpm install
pnpm build:all            # ordered build of all publishable packages
pnpm build:engine         # (or :web :react-core :preact-core :functions :vue-core :svelte-core :react-dev)
pnpm dev                  # Storybook on :5233
pnpm doc                  # docs (Astro) on :5244
pnpm typecheck:all        # engine + react-core only; others: `pnpm --filter <pkg> typecheck`
pnpm lint                 # eslint; pnpm lint:fix = eslint --fix + prettier
pnpm jest                 # unit tests (engine + functions)
pnpm e2e                  # Playwright (builds/serves storybook)
pnpm test                 # jest + e2e
```

## Testing policy

- **Playwright (`e2e/`) is the default** for feature/component/interaction tests. Specs drive the
  built Storybook; navigate with `go(page, 'basic-simple--sheet')`, select via `[data-address='A1']`
  / `.gs-cell-rendered`.
- **Jest is only for `packages/functions`, `packages/engine`, and `packages/xlsx`.** Every formula
  function needs a Jest `*.spec.ts` (colocated in `src/`); xlsx conversion is likewise headless and
  Jest-tested (round-trip + interop specs in `src/`).

## Conventions & gotchas

- CSS class prefix is **`gs-`** (`.gs-cell-rendered`, `.gs-editor`, `.gs-row-even`). Cells carry
  `data-address` attributes.
- Vite `external` and `peerDependencies` are **always paired** — if you externalize a dep, add it as
  a peerDep so consumers get install warnings. `@gridsheet/web` is a normal dep for react/preact-core
  but a peerDep for functions/react-dev.
- Preact reuses react-core's compiled `.d.ts` (rsync), not its own typegen.
- Legacy leftovers: root `next.config.mjs` and a "Build Next.js app" label in the docs deploy
  workflow — docs are Astro now.
- Authoritative internal docs live in `packages/docs/src/content/docs/development/`
  (`architecture`, `development-guide`, `package-structure`).

## Docs examples (`packages/docs/`)

Each example is a **pair**:
- `packages/docs/src/components/caseN.component.tsx` — the live React component (`client:visible`).
- `packages/docs/src/content/docs/examples/caseN.mdx` — imports it, then a **"View Source Code"**
  `<a>` link + an Implementation Guide.

**The View Source link must point to** `https://github.com/walkframe/gridsheet/tree/master/packages/docs/src/components/caseN.component.tsx` — note `packages/docs/`, NOT `packages/docs-astro/` (that dir was renamed; stale links 404).

## Releasing

Two independent tracks; publishing happens in GitHub Actions, not locally.

- **npm packages** (`@gridsheet/*`, all share one version): `pnpm set-version <ver>`
  (`scripts/set-version.mjs`) bumps every publishable package, rewrites cross-deps, commits, and
  creates `v<ver>/<pkg>` tags. **Push to `master`** triggers `.github/workflows/release.yaml`
  (npm OIDC trusted publishing, dependency-ordered; `-` prerelease → `--tag next`).
- **VSCode extension** (`csv-gridsheet`, versioned independently, skipped by `set-version`): bump
  `packages/vscode-csv-viewer/package.json` by hand, then push a `v<ver>/csv-gridsheet` tag →
  `.github/workflows/release-vscode.yaml` (verifies tag==version, publishes to VS Marketplace + Open VSX).
- The `origin` remote is SSH and fails here — **push commits/tags over https (via `gh`)**, not SSH.

## Using GridSheet in an app (consumer API)

For embedding the library in an app: `pnpm add @gridsheet/react-core @gridsheet/functions`, render
`<GridSheet initialCells={buildInitialCells({ matrices, cells })} options={{...}} />`. `initialCells`
is initial-only — mutate via `sheetRef` and call `.apply()` after mutating methods; read data back
with standalone `toValueMatrix(sheet)` etc.; `useSpellbook` (from `@gridsheet/react-core/spellbook`)
builds a shared `book` for cross-sheet formulas and custom `Policy` renderers. Full reference:
https://docs.gridsheet.dev/ and `packages/docs/src/content/docs/{getting-started,api-reference}/`.

## Task playbooks

Detailed step-by-step guides for specific tasks live as plain-markdown `SKILL.md` files. **When a
task below matches, open and follow the linked file** before acting. (In Claude Code these auto-load
as skills; every other agent can read the same files directly — the content is not Claude-specific.)

| When you are… | Read |
|---|---|
| cutting a release / bumping the version / publishing to npm or the VSCode Marketplace | [.claude/skills/release/SKILL.md](.claude/skills/release/SKILL.md) |
| helping someone embed GridSheet in an app (GridSheet component, `initialCells`, formulas, policies, reading data) | [.claude/skills/using-gridsheet/SKILL.md](.claude/skills/using-gridsheet/SKILL.md) |

To add a playbook, drop a new `.claude/skills/<name>/SKILL.md` (a description in its front-matter,
the steps in the body) and add a row here so non-Claude agents discover it too.
