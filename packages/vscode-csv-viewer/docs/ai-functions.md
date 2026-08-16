# AI functions (`=CLAUDE`, `=CODEX`) — design memo

Status: v1 in progress. This doc is a design note, not committed API docs.

## Goal

Spreadsheet formula functions that resolve a prompt through the AI CLI the user
**already** has logged in — not an LLM we host or bill. v1 ships **Claude** and
**Codex** (OpenAI) adapters. Gemini is deferred (see "Deferred").

## Function set (6)

| Function | signature | returns |
| --- | --- | --- |
| `CLAUDE` / `CODEX` | `(prompt, [context...])` | text (string) |
| `CLAUDE.BOOL` / `CODEX.BOOL` | `(prompt, [context...])` | boolean |
| `CLAUDE.NUMBER` / `CODEX.NUMBER` | `(prompt, [context...])` | number |

- `prompt` is a plain string/number, so `=CLAUDE("classify: "&A2)` (concatenation)
  works with no context args.
- `context...` is variadic + optional (`takesMatrix: true`), for feeding ranges.
  Values are **paired with their column headers** so the model sees meaning, not
  bare numbers: a single cell → `id: 1`; a range → a header-topped quoted **CSV**.
  Headers come from row 0 labels via the reference Sheet (`trim()` shares the
  parent's data at absolute coords, so `arg.getCell({y:0,x}).label` works). No
  header (header mode off / cross-file ref / blank label) → falls back to raw
  value / header-less CSV. Appended after the prompt (option ① "append").
- `.BOOL` / `.NUMBER` exist because they change the **return type** (downstream
  `IF`/`SUM` depend on it). `.CHOICE` was dropped: its result is still a string
  (a *constraint*, not a type), so "instruct the choices in the prompt" suffices.
  Reintroduce later as constrained-text (enum schema) if labels drift in practice.

## Why per-provider functions (not `=AI` + a setting)

Provider *plumbing* differences (schema vs parse, ephemeral, auth) are hidden by
the `AiProvider` abstraction and are **not** the reason. The real reasons: models
give different answers (users want to choose/compare), availability differs per
user, and cost/limits differ. Per-provider functions are thin fronts over ONE
backend — do not duplicate batch/cache/bridge logic per provider.

## Architecture

The grid runs in the **webview** (`@gridsheet/preact-core`); CLIs can only be
spawned from the **extension host**. Bridge over `postMessage`:

```
webview (engine)                         extension host
  CLAUDE(...) main()  ──enqueue──▶ debounce/flush
        │                                  │  postMessage {type:'aiBatch', id, tasks}
        │  returns Promise (Pending)       ▼
   gs-pending shown            group by (provider,kind) → spawn CLI once per group
        ▲                                  │  parse JSON, coerce per kind
        └────── postMessage {type:'aiBatchResult', id, results} ◀──┘
   resolve() → asyncCaches → transmit re-render
```

- GOTCHA: the webview must build its book with `useBook`, NOT `createBook`.
  `registry.transmit()` (fired when an async result resolves) is only wired to a
  repaint by `useBook`; with a bare `createBook` the result lands in `asyncCaches`
  but the cell stays "running" until an unrelated interaction forces a paint.
- GOTCHA: serialization + a pending cell. In evaluate mode a still-resolving cell
  reads back as a `Pending` sentinel; writing its `toString()` leaks `<Pending #…>`
  into the file. `serialize()` substitutes the RAW formula for pending cells. And
  because async resolution repaints via `transmit` but does NOT fire `onChange`
  (the Emitter only reacts to `sheetReactive` edits), the resolved value is persisted
  by an `aiPersist` hook the AI-result handler calls once per resolved batch (on the
  next frame, so the cache is filled), deduped against the last posted text.
  DO NOT persist on every `transmit`/`[book]` change — running `serialize` (a full
  RESOLVED re-evaluation) per repaint jams drag-select and stuck the cursor.
- GOTCHA: `GridSheet`'s `sheetRef.current` is a `SheetHandle` (`{ sheet, apply }`),
  NOT the `Sheet`. `onChange` hands you the real `Sheet`; anything reading the ref
  (the `aiPersist` hook) must use `sheetRef.current.sheet` or `serialize` fails
  silently and nothing persists.
- Paste: VS Code webviews deliver EMPTY `clipboardData` on native paste, so
  GridSheet's `onPaste` receives nothing. Bridge Cmd/Ctrl+V through the host
  (`vscode.env.clipboard.readText()`), then replay it — a synthetic `paste`
  ClipboardEvent for grid paste, or `execCommand('insertText')` while editing a cell
  inline. `storeRef` provides the editor textarea + `editingAddress`. Text-only (no
  HTML); only intercept when the grid editor is the focused element.
- Engine async is first-class: `BaseFunctionAsync.main()` may return a Promise;
  `call()` returns a `Pending` sentinel immediately, dedupes identical calls via
  `useInflight`, caches results in `cell.asyncCaches`, and re-renders on resolve.
  So `main()` = "enqueue into batch, return a Promise that resolves on host reply".
- **Batching**: `main()` never fires a request directly; it pushes to a queue and
  a short debounce flushes the whole tick's cells in one message. Grouped by
  `(provider, kind)` host-side so each group is a homogeneous, schema-typed batch.
- **Cache**: `buildAsyncCacheKey(name, args, ...)` keys on resolved arg values, so
  editing a referenced cell re-fires; unchanged cells never re-spend within a
  session. NOTE: `asyncCaches` are in-memory only → reopening the file re-spends.
  (Follow-up: optional result persistence.)

## CLI invocation (verified against installed versions)

**Claude** (v2.1.81) — prompt on stdin:
```
claude -p --no-session-persistence --output-format json \
  --permission-mode dontAsk --disallowedTools "Bash Edit Write Read WebSearch WebFetch" \
  [--json-schema <schema>] [--model <m>]
```
- `--no-session-persistence` → never written to `~/.claude/projects`, no `/resume` clutter.
- Do **NOT** use `--bare`: it forces `ANTHROPIC_API_KEY` and bypasses the OAuth
  subscription. Non-bare + no `ANTHROPIC_API_KEY` in the child env = subscription.
- `--json-schema` enforces boolean/number/enum output.

**Codex** (v0.137.0) — prompt on stdin (`-`), schema + output as temp files:
```
codex exec - --ephemeral --sandbox read-only --skip-git-repo-check \
  --ignore-user-config --output-schema <schema.json> -o <out.json>
```
- `--ephemeral` → no rollout on disk, no `codex exec resume` clutter.
- Reuses `codex login` (ChatGPT) as long as `OPENAI_API_KEY` is not in the child env.
- ⚠️ Known bug: `--output-schema` is ignored when MCP/tools are active
  (openai/codex#15451) → keep tools out (`--ignore-user-config`) + parse defensively.

**Common auth rule**: to reuse the subscription, strip the provider's API-key env
var from the spawned child. (API-key mode = the opposite: pass it. Config toggle.)

**Configurable (settings), protocol flags stay fixed**: only the batch-contract
flags above are hardcoded (`-p`/`exec -`, `--output-format json`/`--output-schema`,
`--json-schema`, `--no-session-persistence`/`--ephemeral`). Everything else is a
setting: `claude.permissionMode`, `claude.tools.*` (per-tool opt-in booleans →
`--disallowedTools` is built from the ones left off), `codex.sandbox`,
`codex.ignoreUserConfig`, per-provider `extraArgs` (appended verbatim), and
`workingDirectory`. cwd defaults to the file's workspace folder. **Repo-aware mode**:
turn on `claude.tools.read` (or relax `codex.sandbox`) so the CLI can
read files under cwd + load CLAUDE.md/AGENTS.md — at the cost of going agentic
(slower, more usage, typed output can weaken; tools can also drop `--output-schema`).

## Billing risk to remember

`claude -p` on subscription: the June 15 2026 split (separate monthly Agent SDK
credit) was **paused** — currently `claude -p` still draws from the Pro/Max
subscription. But it is a *pause*, not a cancellation. Keep the API-key fallback
path so a re-split doesn't strand users. Codex (ChatGPT) and Gemini (free tier)
limits move too. Surface usage from CLI JSON (`total_cost_usd` / `usage` / `stats`).

## Deferred

- **Gemini**: no native output schema (must prompt+parse) and no ephemeral flag
  (must clean `~/.gemini/tmp/.../chats`). Keep interface seams
  (`supportsSchema`, `needsPostCleanup`) so it's an added adapter, not a redesign.
- **`.CHOICE`** as constrained-text (enum).
- Manual "resolve AI cells" gate + result persistence to avoid re-spend on reopen.
