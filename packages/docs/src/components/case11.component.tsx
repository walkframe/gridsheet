'use client';

import * as React from 'react';
import {
  GridSheet,
  buildInitialCellsFromOrigin,
  BaseFunction,
  BaseFunctionAsync,
  Policy,
  ensureString,
  makeBorder,
} from '@gridsheet/react-core';
import type { PolicyMixinType, RenderProps } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';
import type { FunctionArgumentDefinition } from '@gridsheet/react-core';
import { Debugger } from '@gridsheet/react-dev';
import { useStarlightMode } from './useStarlightMode';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Sync formula: REPO_OWNER(owner/repo) ───
// Pure string manipulation — no I/O, so a plain BaseFunction is enough.
class RepoOwnerFunction extends BaseFunction {
  example = 'REPO_OWNER("facebook/react")';
  description = 'Returns the owner (user or organization) part of an "owner/repo" slug.';
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'repo',
      description: 'Repository in "owner/repo" format, or a github.com URL.',
      acceptedTypes: ['string'],
    },
  ];

  main(repo: string) {
    const slug = ensureString(repo)
      .trim()
      .replace(/^https?:\/\/github\.com\//, '');
    const owner = slug.split('/')[0];
    if (!owner) {
      throw new Error(`Invalid repository: "${repo}"`);
    }
    return owner;
  }
}

// ─── Async formula: GH_REPO(owner/repo) ───
// Fetches repository data from GitHub API (no auth required for public repos).
// Returns a 1×5 row [[stars, forks, issues, size, subscribers]] that spills across B–F,
// so one API call per repo fills five columns at once.
class GhRepoFunction extends BaseFunctionAsync {
  example = 'GH_REPO("facebook/react")';
  description = 'Fetches public repository data from GitHub API. Spills [[stars, forks, issues, size, subscribers]].';
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'repo',
      description: 'Repository in "owner/repo" format (e.g. "facebook/react").',
      acceptedTypes: ['string'],
    },
  ];
  ttlMilliseconds = 60 * 1000; // 1 minute cache TTL
  // autoSpilling wraps main()'s resolved matrix in a Spilling for us (async-aware), so main()
  // just returns a plain [[...]] row. broadcastDisabled keeps a scalar arg from broadcasting.
  protected autoSpilling = true;
  protected broadcastDisabled = true;

  async main(repo: string) {
    const r = ensureString(repo).trim();

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

    // Return a 1×5 row — autoSpilling spills it across B, C, D, E, F in one call.
    return [
      [
        data.stargazers_count ?? 0,
        data.forks_count ?? 0,
        data.open_issues ?? 0,
        data.size ?? 0,
        data.subscribers_count ?? 0,
      ],
    ];
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
  const inheritMode = useStarlightMode();
  const book = useSpellbook({
    additionalFunctions: {
      gh_repo: GhRepoFunction as any,
      repo_owner: RepoOwnerFunction as any,
    },
    policies: {
      repo: repoPolicy,
      number: numberPolicy,
    },
  });

  const summaryStyle = {
    background: 'rgba(0,119,255,0.08)',
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
            A: { label: 'Repository', width: 128 },
            B: { label: '⭐ Stars', width: 70, policy: 'number' },
            C: { label: '🍴 Forks', width: 64, policy: 'number' },
            D: { label: '🐛 Issues', width: 60, policy: 'number' },
            E: { label: '📦 KB', width: 82, policy: 'number' },
            F: { label: '👁 Subs', width: 60, policy: 'number' },
            G: { label: 'Owner', width: 86 },
            A1: { policy: 'repo' },
            A2: { policy: 'repo' },
            A3: { policy: 'repo' },
            G1: { value: '=REPO_OWNER(A1)' },
            G2: { value: '=REPO_OWNER(A2)' },
            G3: { value: '=REPO_OWNER(A3)' },
            A4: { style: summaryStyle },
            B4: { style: summaryStyle },
            C4: { style: summaryStyle },
            D4: { style: summaryStyle },
            E4: { style: summaryStyle },
            F4: { style: summaryStyle },
            G4: { style: summaryStyle },
          },
          ensured: { numRows: 4, numCols: 7 },
        })}
        options={{
          matrixAlignment: 'both',
          sheetWidth: '100%',
          mode: inheritMode,
        }}
      />

      <details style={{ marginTop: '12px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '14px', color: '#aaa' }}>
          Debugger (inspect async evaluation & caching)
        </summary>
        <div className="gs-debugger-wrap">
          <Debugger book={book} />
        </div>
      </details>
      <p style={{ marginTop: '12px', fontSize: '13px', color: '#888' }}>
        💡 <code>GH_REPO(repo)</code> (async) makes <strong>one API call per row</strong> and spills{' '}
        <code>[[stars, forks, issues, size, subscribers]]</code> across B–F — 3 calls instead of 15. Results are cached
        for 1 minute. <code>REPO_OWNER(repo)</code> (sync) in column G resolves instantly. Edit a repository name in
        column A to refetch; the Total row stays pending until every async cell resolves.
      </p>
    </div>
  );
}
