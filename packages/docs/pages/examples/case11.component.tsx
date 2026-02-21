'use client';

import * as React from 'react';
import {
  GridSheet,
  buildInitialCells,
  BaseFunction,
  useHub,
  Renderer,
  RendererMixinType,
  RenderProps,
  ensureString,
  solveTable,
  Table,
  makeBorder,
} from '@gridsheet/react-core';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Async formula: GH_REPO(owner/repo, field) ───
// Fetches repository data from GitHub API (no auth required for public repos).
// Fields: "stars", "forks", "issues"
class GhRepoFunction extends BaseFunction {
  example = 'GH_REPO("facebook/react", "stars")';
  helpTexts = ['Fetches public repository data from GitHub API.'];
  helpArgs = [
    { name: 'repo', description: 'Repository in "owner/repo" format (e.g. "facebook/react").' },
    {
      name: 'field',
      description: 'Data field: "stars", "forks", or "issues".',
    },
  ];
  ttlMilliseconds = 60 * 1000; // 1 minute cache TTL

  protected validate() {
    const resolved: any[] = [];
    this.bareArgs.forEach((arg) => {
      if (arg instanceof Table) {
        const flat = solveTable({ table: arg }).reduce((a: any[], b: any[]) => a.concat(b));
        resolved.push(...flat);
        return;
      }
      resolved.push(arg);
    });
    this.bareArgs = resolved;
  }

  async main(repo: string, field: string) {
    const r = ensureString(repo).trim();
    const f = ensureString(field).toLowerCase().trim();

    console.log('fetching Github repo API', { repo: r, field: f });
    // Artificial delay so the pending animation is visible in this example
    await sleep(1500);
    const resp = await fetch(`https://api.github.com/repos/${encodeURI(r)}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      cache: 'force-cache',
    });
    if (!resp.ok) {
      throw new Error(`GitHub API error for ${r}: ${resp.status}`);
    }
    const data = await resp.json();

    switch (f) {
      case 'stars':
        return data.stargazers_count ?? 0;
      case 'forks':
        return data.forks_count ?? 0;
      case 'issues':
        return data.open_issues_count ?? 0;
      default:
        throw new Error(`Unknown field: "${f}". Use "stars", "forks", or "issues".`);
    }
  }
}

// ─── Custom renderers ───

const RepoRendererMixin: RendererMixinType = {
  string({ value }: RenderProps<string>) {
    return (
      <a
        href={`https://github.com/${value}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#58a6ff', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}
      >
        {value}
      </a>
    );
  },
};

const NumberRendererMixin: RendererMixinType = {
  number({ value }: RenderProps<number>) {
    return <span style={{ fontWeight: 600, fontSize: '13px', color: 'inherit' }}>{value.toLocaleString()}</span>;
  },
};

const repoRenderer = new Renderer({ mixins: [RepoRendererMixin] });
const numberRenderer = new Renderer({ mixins: [NumberRendererMixin] });

// ─── Repositories to compare ───
const REPOS = ['facebook/react', 'vuejs/core', 'sveltejs/svelte'];

export default function Case11() {
  const hub = useHub({
    additionalFunctions: {
      gh_repo: GhRepoFunction as any,
    },
  });

  const cells: Record<string, any> = {
    A: { label: 'Repository', width: 200 },
    B: { label: '⭐ Stars', width: 120 },
    C: { label: '🍴 Forks', width: 120 },
    D: { label: '🐛 Issues', width: 120 },
  };

  REPOS.forEach((repo, i) => {
    const row = i + 1;
    const rowStyle = {
      background: i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
      ...makeBorder({ all: '1px solid rgba(128,128,128,0.2)' }),
    };

    cells[`A${row}`] = { value: repo, renderer: repoRenderer, style: rowStyle };
    cells[`B${row}`] = {
      value: `=GH_REPO(A${row}, "stars")`,
      renderer: numberRenderer,
      style: rowStyle,
    };
    cells[`C${row}`] = {
      value: `=GH_REPO(A${row}, "forks")`,
      renderer: numberRenderer,
      style: rowStyle,
    };
    cells[`D${row}`] = {
      value: `=GH_REPO(A${row}, "issues")`,
      renderer: numberRenderer,
      style: rowStyle,
    };
  });

  // Summary row
  const summaryRow = REPOS.length + 1;
  const summaryStyle = {
    background: 'rgba(255,255,255,0.08)',
    fontWeight: 700 as const,
    ...makeBorder({ all: '2px solid rgba(128,128,128,0.3)' }),
  };
  cells[`A${summaryRow}`] = { value: 'Total', style: { ...summaryStyle, fontWeight: 700 } };
  cells[`B${summaryRow}`] = {
    value: `=SUM(B1:B${REPOS.length})`,
    renderer: numberRenderer,
    style: summaryStyle,
  };
  cells[`C${summaryRow}`] = {
    value: `=SUM(C1:C${REPOS.length})`,
    renderer: numberRenderer,
    style: summaryStyle,
  };
  cells[`D${summaryRow}`] = {
    value: `=SUM(D1:D${REPOS.length})`,
    renderer: numberRenderer,
    style: summaryStyle,
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <GridSheet
        hub={hub}
        sheetName="GithubRepos"
        initialCells={buildInitialCells({
          cells,
          ensured: { numRows: REPOS.length + 1, numCols: 4 },
        })}
        options={{
          sheetHeight: 450,
          mode: 'dark',
        }}
      />
      <p style={{ marginTop: '12px', fontSize: '13px', color: '#888' }}>
        💡 Data is fetched live from the GitHub API with 1-minute caching. Each cell with a <code>GH_REPO</code> formula
        shows a loading animation while the request is in flight. Try editing a repository name in column A to fetch
        data for a different repo. The bottom row uses <code>SUM</code> to total stars, forks, and issues — it stays
        pending until all async cells resolve.
      </p>
    </div>
  );
}
