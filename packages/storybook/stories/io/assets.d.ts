// Vite serves a bundled asset URL for `?url` imports (e.g. a shipped sample.xlsx).
declare module '*.xlsx?url' {
  const url: string;
  export default url;
}
