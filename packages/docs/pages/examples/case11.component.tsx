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

// ─── API response cache (shared across all GH_REPO calls) ───
const repoCache = new Map<string, Record<string, any>>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Async formula: GH_REPO(owner/repo, field) ───
// Fetches repository data from GitHub API (no auth required for public repos).
// Fields: "stars", "forks", "issues", "language", "license", "description", "name", "updated"
class GhRepoFunction extends BaseFunction {
  example = 'GH_REPO("facebook/react", "stars")';
  helpTexts = ['Fetches public repository data from GitHub API.'];
  helpArgs = [
    { name: 'repo', description: 'Repository in "owner/repo" format (e.g. "facebook/react").' },
    {
      name: 'field',
      description: 'Data field: "stars", "forks", "issues", "language", "license", "description", "name", "updated".',
    },
  ];

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

    // Artificial delay so the pending animation is visible in this example
    await sleep(2000);

    let data = repoCache.get(r);
    if (!data) {
      const resp = await fetch(`https://api.github.com/repos/${encodeURI(r)}`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      if (!resp.ok) {
        throw new Error(`GitHub API error for ${r}: ${resp.status}`);
      }
      data = await resp.json();
      repoCache.set(r, data);
    }

    switch (f) {
      case 'stars':
        return data.stargazers_count ?? 0;
      case 'forks':
        return data.forks_count ?? 0;
      case 'issues':
        return data.open_issues_count ?? 0;
      case 'language':
        return data.language ?? 'N/A';
      case 'license':
        return data.license?.spdx_id ?? 'N/A';
      case 'description':
        return data.description ?? '';
      case 'name':
        return data.full_name ?? r;
      case 'updated':
        return data.updated_at ? new Date(data.updated_at).toLocaleDateString() : 'N/A';
      default:
        throw new Error(
          `Unknown field: "${f}". Use "stars", "forks", "issues", "language", "license", "description", "name", or "updated".`,
        );
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

const LanguageRendererMixin: RendererMixinType = {
  string({ value }: RenderProps<string>) {
    const colors: Record<string, string> = {
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      Python: '#3572a5',
      Java: '#b07219',
      Go: '#00add8',
      Rust: '#dea584',
      'C++': '#f34b7d',
      C: '#555555',
      Ruby: '#701516',
    };
    const color = colors[value] ?? '#666';
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: color,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        {value}
      </span>
    );
  },
};

const repoRenderer = new Renderer({ mixins: [RepoRendererMixin] });
const numberRenderer = new Renderer({ mixins: [NumberRendererMixin] });
const languageRenderer = new Renderer({ mixins: [LanguageRendererMixin] });

// ─── Repositories to compare ───
const REPOS = ['facebook/react', 'vuejs/core', 'sveltejs/svelte'];

export default function Case11() {
  const hub = useHub({
    additionalFunctions: {
      gh_repo: GhRepoFunction as any,
    },
  });

  const cells: Record<string, any> = {
    A: { label: 'Repository', width: 180 },
    B: { label: '⭐ Stars', width: 100 },
    C: { label: '🍴 Forks', width: 100 },
    D: { label: '🐛 Issues', width: 100 },
    E: { label: '💻 Language', width: 130 },
    F: { label: '📜 License', width: 100 },
    G: { label: '🔄 Updated', width: 120 },
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
    cells[`E${row}`] = {
      value: `=GH_REPO(A${row}, "language")`,
      renderer: languageRenderer,
      style: rowStyle,
    };
    cells[`F${row}`] = {
      value: `=GH_REPO(A${row}, "license")`,
      style: rowStyle,
    };
    cells[`G${row}`] = {
      value: `=GH_REPO(A${row}, "updated")`,
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
          ensured: { numRows: REPOS.length + 1, numCols: 7 },
        })}
        options={{
          sheetHeight: 450,
          mode: 'dark',
        }}
      />
      <p style={{ marginTop: '12px', fontSize: '13px', color: '#888' }}>
        💡 Data is fetched live from the GitHub API. Each cell with a <code>GH_REPO</code> formula shows a loading
        animation while the request is in flight. Try editing a repository name in column A to fetch data for a
        different repo. The bottom row uses <code>SUM</code> to total stars, forks, and issues — it stays pending until
        all async cells resolve.
      </p>
    </div>
  );
}
