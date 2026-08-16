// Shared, type-only contract between the webview (grid/engine) and the extension
// host (CLI spawner). Imported from both bundles; erased at build time.

export type AiProvider = 'claude' | 'codex';
export type AiKind = 'text' | 'bool' | 'number';

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
