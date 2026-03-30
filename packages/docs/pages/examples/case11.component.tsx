'use client';

import * as React from 'react';
import {
  GridSheet,
  buildInitialCellsFromOrigin,
  BaseFunctionAsync,
  Policy,
  PolicyMixinType,
  RenderProps,
  ensureString,
  makeBorder,
  Spilling,
} from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';
import { FunctionArgumentDefinition } from '@gridsheet/react-core';
import { Debugger } from '@gridsheet/react-dev';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Async formula: GH_REPO(owner/repo) ───
// Fetches repository data from GitHub API (no auth required for public repos).
// Returns a 1×3 spill array: [[stars, forks, open_issues]]
// This means one API call per repo fills Stars, Forks, and Issues columns at once.
class GhRepoFunction extends BaseFunctionAsync {
  example = 'GH_REPO("facebook/react")';
  description =
    'Fetches public repository data from GitHub API. Spills [[stars, forks, issues, size, subscribers, watchers]].';
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'repo',
      description: 'Repository in "owner/repo" format (e.g. "facebook/react").',
      acceptedTypes: ['string'],
    },
  ];
  ttlMilliseconds = 60 * 1000; // 1 minute cache TTL

  async main(repo: string) {
    const r = ensureString(repo).trim();

    console.log('fetching Github repo API', { repo: r });
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

    // Return a 1×6 spill array — fills B, C, D, E, F, G in one call.
    // NOTE: autoSpilling wraps the Promise itself (not the resolved value), so
    // we construct Spilling manually from the resolved data instead.
    return new Spilling([
      [
        data.stargazers_count ?? 0,
        data.forks_count ?? 0,
        data.open_issues ?? 0,
        data.size ?? 0,
        data.subscribers_count ?? 0,
      ],
    ]);
  }
}

// ─── Custom renderers ───

const RepoRendererMixin: PolicyMixinType = {
  renderString({ value }: RenderProps<string>) {
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

const NumberRendererMixin: PolicyMixinType = {
  renderNumber({ value }: RenderProps<number>) {
    return <span style={{ fontWeight: 600, fontSize: '13px', color: 'inherit' }}>{value.toLocaleString()}</span>;
  },
};

const repoPolicy = new Policy({ mixins: [RepoRendererMixin] });
const numberPolicy = new Policy({ mixins: [NumberRendererMixin] });

export default function Case11() {
  const book = useSpellbook({
    additionalFunctions: {
      gh_repo: GhRepoFunction as any,
    },
    policies: {
      repo: repoPolicy,
      number: numberPolicy,
    },
  });

  const summaryStyle = {
    background: 'rgba(255,255,255,0.08)',
    fontWeight: 700 as const,
    ...makeBorder({ all: '2px solid rgba(128,128,128,0.3)' }),
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <GridSheet
        book={book}
        sheetName="GithubRepos"
        initialCells={buildInitialCellsFromOrigin({
          matrix: [
            ['facebook/react', '=GH_REPO(A1)'],
            ['vuejs/core', '=GH_REPO(A2)'],
            ['sveltejs/svelte', '=GH_REPO(A3)'],
            ['Total', '=SUM(B1:B3)', '=SUM(C1:C3)', '=SUM(D1:D3)', '=SUM(E1:E3)', '=SUM(F1:F3)'],
          ],
          cells: {
            A: { label: 'Repository', width: 200 },
            B: { label: '⭐ Stars', width: 120, policy: 'number' },
            C: { label: '🍴 Forks', width: 120, policy: 'number' },
            D: { label: '🐛 Issues', width: 120, policy: 'number' },
            E: { label: '📦 Size (KB)', width: 120, policy: 'number' },
            F: { label: '👁 Subscribers', width: 120, policy: 'number' },
            A1: { policy: 'repo' },
            A2: { policy: 'repo' },
            A3: { policy: 'repo' },
            A4: { style: summaryStyle },
            B4: { style: summaryStyle },
            C4: { style: summaryStyle },
            D4: { style: summaryStyle },
            E4: { style: summaryStyle },
            F4: { style: summaryStyle },
          },
          ensured: { numRows: 4, numCols: 6 },
        })}
        options={{
          sheetHeight: 450,
          mode: 'dark',
        }}
      />

      <details style={{ marginTop: '12px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '14px', color: '#aaa' }}>Debugger (inspect async evaluation & caching)</summary>
        <div className="gs-debugger-wrap">
          <Debugger book={book} />
        </div>
      </details>
      <p style={{ marginTop: '12px', fontSize: '13px', color: '#888' }}>
        💡 Data is fetched live from the GitHub API with 1-minute caching. <code>GH_REPO(repo)</code> makes{' '}
        <strong>one API call per row</strong> and spills <code>[[stars, forks, issues, size, subscribers]]</code> across
        columns B–F automatically — 3 calls total instead of 18. Try editing a repository name in column A to fetch data
        for a different repo. The bottom row uses <code>SUM</code> to total all columns — it stays pending until all
        async cells resolve.
      </p>
    </div>
  );
}
