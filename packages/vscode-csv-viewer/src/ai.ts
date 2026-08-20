// Extension-host side of the AI functions: turn a batch of cell requests into a
// minimal number of CLI invocations, reusing the AI the user already logged into
// (Claude / Codex), and return typed results keyed back to each request.
//
// Design notes live in docs/ai-functions.md. Key choices:
//  - Tasks are grouped by (provider, kind) so each group is one homogeneous,
//    schema-typed batch → one CLI process per group.
//  - Subscription reuse: the child env has the provider's API-key var stripped,
//    so the CLI falls back to its cached OAuth login (not metered API billing).
//  - Output is parsed defensively (CLI JSON envelopes vary across versions).

// cross-spawn (not child_process.spawn) so a Windows `.cmd`/`.bat` shim — how npm installs
// `claude` / `codex` there — actually launches, with correct arg escaping for the big
// inline `--json-schema '{…}'`. It's a drop-in for spawn on macOS/Linux.
import spawn from 'cross-spawn';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import type { AiKind, AiProvider, AiResult, AiTask } from './aiTypes';

export async function resolveAiBatch(tasks: AiTask[], opts: { cwd?: string } = {}): Promise<AiResult[]> {
  // A configured working directory wins; otherwise the caller's (the file's
  // workspace folder). This is where the CLI looks for CLAUDE.md/AGENTS.md and
  // resolves relative file reads when tools are enabled.
  const cwd = config().get<string>('workingDirectory')?.trim() || opts.cwd;

  const groups = new Map<string, AiTask[]>();
  for (const t of tasks) {
    const key = `${t.provider}::${t.kind}`;
    const g = groups.get(key);
    if (g) {
      g.push(t);
    } else {
      groups.set(key, [t]);
    }
  }

  const results: AiResult[] = [];
  await Promise.all(
    [...groups.values()].map(async (group) => {
      const { provider, kind } = group[0];
      try {
        const values = await resolveGroup(provider, kind, group.map((t) => t.prompt), cwd);
        group.forEach((t, i) => results.push(coerce(t.index, kind, values[i])));
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        // eslint-disable-next-line no-console
        console.error(`[gridsheet.ai] ${provider}/${kind} batch (${group.length} cell(s)) failed:`, e);
        group.forEach((t) => results.push({ index: t.index, ok: false, error }));
      }
    }),
  );
  return results;
}

// Split a (provider, kind) group into chunks of at most `batchSize` cells, each
// resolved by one CLI call. Chunks run sequentially to avoid bursting the
// provider's rate limits with many concurrent agent processes.
async function resolveGroup(provider: AiProvider, kind: AiKind, prompts: string[], cwd?: string): Promise<unknown[]> {
  const configured = config().get<number>('batchSize');
  const size = configured != null && configured > 0 ? configured : prompts.length || 1;

  const out: unknown[] = [];
  for (let i = 0; i < prompts.length; i += size) {
    const chunk = prompts.slice(i, i + size);
    out.push(...(await resolveChunk(provider, kind, chunk, cwd)));
  }
  return out;
}

async function resolveChunk(provider: AiProvider, kind: AiKind, prompts: string[], cwd?: string): Promise<unknown[]> {
  // Custom user functions: no shared batch prompt / JSON schema (an arbitrary CLI won't honor
  // them), so run one process per cell. batchSize caps how many run at once (this chunk).
  if (provider !== 'claude' && provider !== 'codex') {
    const command = customCommand(provider);
    if (!command) {
      throw new Error(`No command configured for AI function "${provider}". Add it to gridsheet.ai.custom.`);
    }
    return Promise.all(prompts.map((p) => runCustom(command, p, cwd)));
  }
  const prompt = buildBatchPrompt(kind, prompts);
  const schema = batchSchema(kind);
  const raw = provider === 'claude' ? await runClaude(prompt, schema, cwd) : await runCodex(prompt, schema, cwd);

  const obj = extractJson(raw);
  const arr: any[] = Array.isArray(obj?.results) ? obj.results : Array.isArray(obj) ? obj : [];
  const byIndex = new Map<number, unknown>();
  arr.forEach((item, i) => {
    if (item && typeof item === 'object' && typeof item.index === 'number') {
      byIndex.set(item.index, item.value);
    } else {
      byIndex.set(i, item && typeof item === 'object' && 'value' in item ? item.value : item);
    }
  });
  return prompts.map((_, i) => byIndex.get(i));
}

function buildBatchPrompt(kind: AiKind, prompts: string[]): string {
  const typeHint =
    kind === 'bool'
      ? 'a JSON boolean (true or false)'
      : kind === 'number'
        ? 'a JSON number'
        : kind === 'array'
          ? 'a JSON 2D array of strings — an array of rows, each row an array of cell strings (choose the number of rows and columns that best fits the answer)'
          : 'a concise plain-text string';
  const requests = prompts.map((p, i) => `### Request ${i}\n${p}`).join('\n\n');
  return [
    `You are resolving ${prompts.length} independent request(s) taken from spreadsheet cells.`,
    `Treat each request separately. Each request may have an "Instruction:" line followed by "Data:"; apply the instruction TO the data, and never answer or translate the instruction text itself. A leading (column "x") or (columns: a, b, …) line names the source column(s) for context only — never repeat those names or a header row in the answer.`,
    `For each, the answer must be ${typeHint}.`,
    `Respond with ONLY a JSON object {"results":[{"index":<request number>,"value":<answer>}, ...]} — one entry per request, no extra prose.`,
    '',
    requests,
  ].join('\n');
}

function batchSchema(kind: AiKind): Record<string, unknown> {
  const value =
    kind === 'bool'
      ? { type: 'boolean' }
      : kind === 'number'
        ? { type: 'number' }
        : kind === 'array'
          ? { type: 'array', items: { type: 'array', items: { type: 'string' } } }
          : { type: 'string' };
  // Codex's --output-schema feeds OpenAI strict structured output, which rejects any
  // object schema that omits `additionalProperties: false` (and requires every property
  // to be listed in `required`). Set it on both object levels. Claude's --json-schema
  // accepts the same schema, so one shape serves both providers.
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: { index: { type: 'integer' }, value },
          required: ['index', 'value'],
        },
      },
    },
    required: ['results'],
  };
}

function config() {
  return vscode.workspace.getConfiguration('gridsheet.ai');
}

// Look up the shell command for a user-defined function (gridsheet.ai.custom is a name→command
// map) by its name (matched case-insensitively — the grid registers `=NAME` as a lowercase key).
function customCommand(name: string): string | undefined {
  const map = (config().get<Record<string, string>>('custom', {}) ?? {}) as Record<string, string>;
  for (const key of Object.keys(map)) {
    if (key.trim().toLowerCase() === name) {
      const cmd = map[key]?.trim();
      return cmd ? cmd : undefined;
    }
  }
  return undefined;
}

// Split a command string into bin + args, honoring single/double quotes (no shell needed).
function splitCommand(cmd: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cmd)) !== null) {
    tokens.push(m[1] ?? m[2] ?? m[3] ?? '');
  }
  return tokens;
}

// Run a custom function's command for one cell: prompt (with context) on stdin, stdout trimmed
// as the result. No key stripping — a custom CLI may legitimately need its own API-key env.
async function runCustom(command: string, prompt: string, cwd?: string): Promise<string> {
  const tokens = splitCommand(command);
  if (tokens.length === 0) {
    throw new Error('Empty command for custom AI function (gridsheet.ai.custom).');
  }
  const [bin, ...args] = tokens;
  const out = await spawnCapture(bin, args, prompt, 'custom', cwd);
  return out.trim();
}

// Flags whose NEXT token is a value (so removing the flag must remove the value too),
// and tokens that are required for the batch contract and can never be stripped.
const CLAUDE_VALUE_FLAGS = new Set(['--output-format', '--permission-mode', '--disallowedTools', '--json-schema', '--model']);
const CLAUDE_PROTECTED = new Set(['-p']);
const CODEX_VALUE_FLAGS = new Set(['--sandbox', '--output-schema', '-o', '--model']);
const CODEX_PROTECTED = new Set(['exec', '-', '-o']);

// Remove flags the user listed in <provider>.omitArgs from OUR auto-built command,
// dropping a value-taking flag's value alongside it. This is the escape hatch for a CLI
// version that rejects a flag we pass — the user disables it from settings, no extension
// update needed. Required tokens are protected. The user's extraArgs are appended after
// this, so they are never stripped.
function stripArgs(args: string[], omit: string[] | undefined, valueFlags: Set<string>, protectedTokens: Set<string>): string[] {
  const omitSet = new Set((omit ?? []).map((s) => s.trim()).filter((t) => t.length > 0 && !protectedTokens.has(t)));
  if (omitSet.size === 0) {
    return args;
  }
  const result: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (omitSet.has(args[i])) {
      if (valueFlags.has(args[i])) {
        i++; // also skip this flag's value
      }
      continue;
    }
    result.push(args[i]);
  }
  return result;
}

async function runClaude(prompt: string, schema: Record<string, unknown>, cwd?: string): Promise<string> {
  const cfg = config();
  const bin = cfg.get<string>('claude.path')?.trim() || 'claude';
  const model = cfg.get<string>('claude.model')?.trim();
  const permissionMode = cfg.get<string>('claude.permissionMode')?.trim() || 'dontAsk';
  const extraArgs = cfg.get<string[]>('claude.extraArgs') ?? [];

  // Each tool is opt-in via its own gridsheet.ai.claude.tools.<x> boolean (all OFF by
  // default = sandboxed to the prompt). Everything the user did NOT allow is passed to
  // --disallowedTools. `Read` is the one that gates repository access.
  const toolFlags: Array<[string, string]> = [
    ['read', 'Read'],
    ['webSearch', 'WebSearch'],
    ['webFetch', 'WebFetch'],
    ['bash', 'Bash'],
    ['edit', 'Edit'],
    ['write', 'Write'],
  ];
  const disallowedTools = toolFlags
    .filter(([key]) => !(cfg.get<boolean>(`claude.tools.${key}`) ?? false))
    .map(([, name]) => name);

  // Default flags. Any of these can be dropped via claude.omitArgs (except -p); extra
  // flags are added via claude.extraArgs.
  const args = ['-p', '--no-session-persistence', '--output-format', 'json', '--permission-mode', permissionMode];
  if (disallowedTools.length > 0) {
    args.push('--disallowedTools', disallowedTools.join(' '));
  }
  args.push('--json-schema', JSON.stringify(schema));
  if (model) {
    args.push('--model', model);
  }
  const final = stripArgs(args, cfg.get<string[]>('claude.omitArgs'), CLAUDE_VALUE_FLAGS, CLAUDE_PROTECTED);
  final.push(...extraArgs);
  return spawnCapture(bin, final, prompt, 'claude', cwd);
}

async function runCodex(prompt: string, schema: Record<string, unknown>, cwd?: string): Promise<string> {
  const cfg = config();
  const bin = cfg.get<string>('codex.path')?.trim() || 'codex';
  const model = cfg.get<string>('codex.model')?.trim();
  const sandbox = cfg.get<string>('codex.sandbox')?.trim() || 'read-only';
  const ignoreUserConfig = cfg.get<boolean>('codex.ignoreUserConfig') ?? true;
  const extraArgs = cfg.get<string[]>('codex.extraArgs') ?? [];

  const dir = await mkdtemp(path.join(os.tmpdir(), 'gridsheet-ai-'));
  const schemaFile = path.join(dir, 'schema.json');
  const outFile = path.join(dir, 'out.json');
  try {
    await writeFile(schemaFile, JSON.stringify(schema), 'utf8');
    // Default flags. Any of these can be dropped via codex.omitArgs (except exec/-/-o);
    // extra flags are added via codex.extraArgs.
    const args = ['exec', '-', '--ephemeral', '--sandbox', sandbox, '--skip-git-repo-check'];
    if (ignoreUserConfig) {
      args.push('--ignore-user-config');
    }
    args.push('--output-schema', schemaFile, '-o', outFile);
    if (model) {
      args.push('--model', model);
    }
    const final = stripArgs(args, cfg.get<string[]>('codex.omitArgs'), CODEX_VALUE_FLAGS, CODEX_PROTECTED);
    final.push(...extraArgs);
    await spawnCapture(bin, final, prompt, 'codex', cwd);
    return await readFile(outFile, 'utf8');
  } finally {
    void rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function spawnCapture(bin: string, args: string[], stdin: string, provider: AiProvider, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env } as NodeJS.ProcessEnv;
    // Reuse the user's subscription login: without an API key in the env, the
    // CLI uses its cached OAuth credentials instead of metered API billing.
    if (provider === 'claude') {
      delete env.ANTHROPIC_API_KEY;
    } else if (provider === 'codex') {
      delete env.OPENAI_API_KEY;
    }
    // Custom functions keep the env intact — their CLI may need its own API-key variable.
    // Windows env keys are case-insensitive (`Path` vs `PATH`); update the real key in
    // place so the augmented PATH actually reaches the child.
    const pathKey = Object.keys(env).find((k) => k.toLowerCase() === 'path') ?? 'PATH';
    env[pathKey] = augmentPath(env[pathKey]);

    try {
      const child = spawn(bin, args, { env, cwd: cwd || undefined });
      let out = '';
      let err = '';
      child.stdout.on('data', (d) => (out += d.toString()));
      child.stderr.on('data', (d) => (err += d.toString()));
      child.on('error', (e: NodeJS.ErrnoException) => {
        const hint = e.code === 'ENOENT' ? ` — is "${bin}" installed and on PATH?` : '';
        // eslint-disable-next-line no-console
        console.error(`[gridsheet.ai] failed to spawn ${bin} ${args.join(' ')}\n`, e);
        reject(new Error(`Failed to run ${bin}${hint}: ${e.message}`));
      });
      child.on('close', (code) => {
        if (code === 0) {
          resolve(out);
          return;
        }
        // The cell tooltip only gets the concise reason (cliErrorDetail); dump the FULL
        // command + stdout + stderr to the Extension Host log so a version-specific
        // failure can be diagnosed in full. View via "Developer: Show Logs… → Extension Host".
        // eslint-disable-next-line no-console
        console.error(
          `[gridsheet.ai] ${bin} exited with code ${code}\n` +
            `  command: ${bin} ${args.join(' ')}\n` +
            `  cwd: ${cwd || process.cwd()}\n` +
            `--- stderr ---\n${err}\n--- stdout ---\n${out}`,
        );
        const detail = cliErrorDetail(err, out);
        reject(new Error(`${bin} exited with code ${code}${detail ? `: ${detail}` : ''}`));
      });
      child.stdin.end(stdin);
    } catch (e) {
      reject(e);
    }
  });
}

// Pull the human-meaningful reason out of a failed CLI run. These CLIs print a large
// startup banner (workdir/model/session…) and echo the whole prompt BEFORE any error,
// so slicing the head just shows boilerplate. The real reason is either a structured API
// error (OpenAI/Anthropic `"message": "..."`) or the tail of the output.
function cliErrorDetail(err: string, out: string): string {
  const text = `${err}\n${out}`.trim();
  // Prefer the last explicit API error message — clearest, and version-independent
  // (e.g. a schema/auth/model error survives CLI flag churn).
  const messages = [...text.matchAll(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
  if (messages.length > 0) {
    return messages[messages.length - 1][1].replace(/\\"/g, '"').replace(/\\n/g, ' ').slice(0, 500);
  }
  // Otherwise the failure reason is almost always at the END, not the banner at the top.
  return text.slice(-500);
}

// GUI-launched VS Code often lacks the user's shell PATH, so common install
// locations for the CLIs are appended.
function augmentPath(current?: string): string {
  const home = os.homedir();
  const extra =
    process.platform === 'win32'
      ? [
          // npm global bin (claude.cmd / codex.cmd live here) + winget/Store shims.
          path.join(process.env.APPDATA ?? path.join(home, 'AppData', 'Roaming'), 'npm'),
          path.join(
            process.env.LOCALAPPDATA ?? path.join(home, 'AppData', 'Local'),
            'Microsoft',
            'WindowsApps',
          ),
          path.join(home, '.local', 'bin'),
        ]
      : [
          path.join(home, '.local', 'bin'),
          '/usr/local/bin',
          '/opt/homebrew/bin',
          path.join(home, '.npm-global', 'bin'),
        ];
  const parts = (current ?? '').split(path.delimiter).filter(Boolean);
  for (const dir of extra) {
    if (dir && !parts.includes(dir)) {
      parts.push(dir);
    }
  }
  return parts.join(path.delimiter);
}

// CLI stdout may be a raw JSON object, a provider envelope wrapping it, or JSON
// embedded in surrounding text. Unwrap known envelopes, else scan for a JSON body.
function extractJson(raw: string): any {
  const parse = (s: string): any => {
    try {
      return JSON.parse(s);
    } catch {
      return undefined;
    }
  };
  const unwrap = (o: any): any => {
    if (o && typeof o === 'object' && !Array.isArray(o)) {
      if (o.results) {
        return o; // already our shape
      }
      if (o.structured_output != null) {
        return o.structured_output;
      }
      for (const field of ['result', 'response', 'text', 'content'] as const) {
        if (typeof o[field] === 'string') {
          const inner = parse(o[field]);
          if (inner !== undefined) {
            return unwrap(inner);
          }
        }
      }
    }
    return o;
  };

  const top = parse(raw.trim());
  if (top !== undefined) {
    return unwrap(top);
  }
  const match = raw.match(/[{[][\s\S]*[}\]]/);
  if (match) {
    const found = parse(match[0]);
    if (found !== undefined) {
      return unwrap(found);
    }
  }
  return undefined;
}

function coerce(index: number, kind: AiKind, value: unknown): AiResult {
  if (value === undefined || value === null) {
    return { index, ok: false, error: 'Model returned no answer for this cell.' };
  }
  if (kind === 'bool') {
    const b = typeof value === 'boolean' ? value : /^\s*(true|yes|1)\s*$/i.test(String(value));
    return { index, ok: true, value: b };
  }
  if (kind === 'number') {
    const n = typeof value === 'number' ? value : Number(String(value).trim().replace(/[,\s]/g, ''));
    if (!Number.isFinite(n)) {
      return { index, ok: false, error: `Expected a number, got: ${String(value).slice(0, 80)}` };
    }
    return { index, ok: true, value: n };
  }
  if (kind === 'array') {
    if (!Array.isArray(value)) {
      return { index, ok: false, error: `Expected a 2D array, got: ${String(value).slice(0, 80)}` };
    }
    // Normalize to string[][]: wrap a flat row, coerce each cell to a string. The webview
    // rectangularizes (pads ragged rows) before spilling.
    const rows: string[][] = value.map((row) =>
      Array.isArray(row) ? row.map((c) => (c == null ? '' : String(c))) : [row == null ? '' : String(row)],
    );
    return { index, ok: true, value: rows };
  }
  return { index, ok: true, value: typeof value === 'string' ? value : JSON.stringify(value) };
}
