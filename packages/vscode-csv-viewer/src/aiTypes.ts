// Shared, type-only contract between the webview (grid/engine) and the extension
// host (CLI spawner). Imported from both bundles; erased at build time.

// 'claude' | 'codex' are built in; any other value is a user-defined custom function name
// (gridsheet.ai.custom) resolved by running its configured command.
export type AiProvider = string;
export type AiKind = 'text' | 'bool' | 'number';

/** User-defined grid functions come from two name→string settings:
 *   gridsheet.ai.alias  — value is a built-in key (`claude`/`codex`, optionally `.bool`/`.number`)
 *   gridsheet.ai.custom — value is a shell command (prompt on stdin → stdout, text only)
 * Both flatten to this shape (exactly one of alias/command set). */
export type AiCustomFunction = { name: string; alias?: string; command?: string };

/** One cell's request. `prompt` already includes any serialized context. */
export type AiTask = {
  index: number; // position within the enclosing batch message
  provider: AiProvider;
  kind: AiKind;
  prompt: string;
};

export type AiBatchRequest = {
  type: 'aiBatch';
  id: number;
  tasks: AiTask[];
};

export type AiResult =
  | { index: number; ok: true; value: string | number | boolean }
  | { index: number; ok: false; error: string };

export type AiBatchResponse = {
  type: 'aiBatchResult';
  id: number;
  results: AiResult[];
};
