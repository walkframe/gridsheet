// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

// Turn ```mermaid code fences into <pre class="mermaid"> so the client-side
// mermaid runtime (wired in src/components/Head.astro) can render them.
// Starlight has no built-in mermaid support.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function remarkMermaid() {
  const walk = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.map((child) => {
      if (child.type === 'code' && child.lang === 'mermaid') {
        return { type: 'html', value: `<pre class="mermaid">${esc(child.value)}</pre>` };
      }
      walk(child);
      return child;
    });
  };
  return (tree) => walk(tree);
}

// Path parity with the current Nextra build: no trailing slash, `foo.html`
// output (served extensionless on Cloudflare Pages), and out/ as the deploy dir.
export default defineConfig({
  site: 'https://gridsheet.walkframe.com',
  outDir: './out',
  trailingSlash: 'never',
  build: { format: 'file' },
  // Static/Cloudflare build: skip image optimization (no native sharp dep).
  image: { service: passthroughImageService() },
  markdown: { remarkPlugins: [remarkMermaid] },
  integrations: [
    react(),
    starlight({
      title: 'GridSheet',
      logo: { src: './public/favicon.svg', alt: 'GridSheet' },
      components: { Head: './src/components/Head.astro' },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/walkframe/gridsheet' }],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        { label: 'Introduction', link: '/' },
        {
          label: 'Getting Started',
          items: [
            { label: 'Overview', link: '/getting-started' },
            { label: 'React', link: '/getting-started/react' },
            { label: 'Vue', link: '/getting-started/vue' },
            { label: 'Svelte', link: '/getting-started/svelte' },
            { label: 'Vanilla', link: '/getting-started/vanilla' },
          ],
        },
        {
          label: 'Examples',
          items: [
            { label: 'Case 1: Sales Dashboard with Data Visualization', link: '/examples/case1' },
            { label: 'Case 2: GitHub Contributors Dashboard', link: '/examples/case2' },
            { label: 'Case 3: Pixel Art Drawing Interface', link: '/examples/case3' },
            { label: 'Case 4: Budget Management System with Policies', link: '/examples/case4' },
            { label: 'Case 5: A simplified menu with Multiple Sheets', link: '/examples/case5' },
            { label: 'Case 6: Calendar/Scheduler Interface', link: '/examples/case6' },
            { label: 'Case 7: Real-time Collaboration Interface', link: '/examples/case7' },
            { label: 'Case 8: Large Dataset Performance Demo', link: '/examples/case8' },
            { label: 'Case 9: Security & Data Protection', link: '/examples/case9' },
            { label: 'Case 10: Inventory Management with Events & Formulas', link: '/examples/case10' },
            { label: 'Case 11: GitHub Repo Comparison (Async)', link: '/examples/case11' },
            { label: 'Case 12: Filling the Parent Element (Responsive Sizing)', link: '/examples/case12' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'GridSheet Props', link: '/api-reference/props' },
            { label: 'Sheet Class', link: '/api-reference/sheet' },
            { label: 'Formula System', link: '/api-reference/formula' },
            { label: 'Policy System', link: '/api-reference/policy' },
            { label: 'Utility Functions', link: '/api-reference/utility-functions' },
          ],
        },
        {
          label: 'Development',
          items: [
            { label: 'Architecture & Design', link: '/development/architecture' },
            { label: 'Development Guide', link: '/development/development-guide' },
            { label: 'Package Structure', link: '/development/package-structure' },
          ],
        },
        {
          label: 'History',
          items: [
            { label: 'GridSheet 3.x.x', link: '/history/v3' },
            { label: 'GridSheet 2.x.x', link: '/history/v2' },
            { label: 'GridSheet 1.x.x', link: '/history/v1' },
            {
              label: 'Migration Guide',
              items: [
                { label: 'Migration from 2.x to 3.x', link: '/history/migration-guide/2to3' },
                { label: 'Migration from 1.x to 2.x', link: '/history/migration-guide/1to2' },
              ],
            },
          ],
        },
        { label: 'Contact ↗', link: 'https://www.reddit.com/user/Mundane-Muscle-647/', attrs: { target: '_blank' } },
      ],
    }),
  ],
});
