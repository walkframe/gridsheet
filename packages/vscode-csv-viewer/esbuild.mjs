import { build, context } from 'esbuild';

const watch = process.argv.includes('--watch');

const common = {
  bundle: true,
  sourcemap: true,
  minify: !watch,
  logLevel: 'info',
};

// 1) Extension host (Node, CommonJS). `vscode` is provided by the runtime.
const extensionOpts = {
  ...common,
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.js',
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  external: ['vscode'],
};

// 2) Webview (browser). Bundle React + GridSheet + everything it pulls in.
const webviewOpts = {
  ...common,
  entryPoints: ['webview/main.tsx'],
  outfile: 'dist/webview.js',
  platform: 'browser',
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  jsxImportSource: 'preact',
  // preact-core externalizes dayjs without declaring it, so under pnpm's layout
  // esbuild can't resolve dayjs from preact-core's dir. Fall back to this
  // package's own node_modules (dayjs + preact are declared here).
  nodePaths: ['node_modules'],
  define: { 'process.env.NODE_ENV': watch ? '"development"' : '"production"' },
};

if (watch) {
  const [ext, web] = await Promise.all([context(extensionOpts), context(webviewOpts)]);
  await Promise.all([ext.watch(), web.watch()]);
  console.log('watching…');
} else {
  await Promise.all([build(extensionOpts), build(webviewOpts)]);
  console.log('build complete');
}
