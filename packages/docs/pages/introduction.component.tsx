'use client';

import {
  GridSheet,
  buildInitialCells,
  BaseFunctionAsync,
  Spilling,
  FunctionArgumentDefinition,
  FormulaError,
} from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';

// ── Async Function: GH_REPO ──────────────────────────────────────────────────
// Fetches public repo stats from the GitHub API and spills [[stars, forks, open_issues]].
// Uses browser HTTP cache (cache: 'default'). Throws #ASYNC! on failure.
class GhRepoFunction extends BaseFunctionAsync {
  example = 'GH_REPO("walkframe/gridsheet")';
  description = 'Fetches public repo stats from GitHub API. Spills [[stars, forks, open_issues]].';
  defs: FunctionArgumentDefinition[] = [
    { name: 'repo', description: '"owner/repo" e.g. "walkframe/gridsheet"', acceptedTypes: ['string'] },
  ];
  ttlMilliseconds = 5 * 60 * 1000;

  async main(repo: string) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 3500));
      const resp = await fetch(`https://api.github.com/repos/${repo.trim()}`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
        cache: 'default',
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const d = await resp.json();
      return new Spilling([[d.stargazers_count ?? 0, d.forks_count ?? 0, d.open_issues_count ?? 0]]);
    } catch {
      throw new FormulaError('#ASYNC!', 'Failed to fetch GitHub data');
    }
  }
}

// ── Shared style constants ───────────────────────────────────────────────────
const cellBase = { fontSize: '12px', padding: '4px' };

const ghLabelStyle = {
  color: '#0369a1',
  textAlign: 'center' as const,
  fontSize: '11px',
  fontWeight: '600' as const,
};

// ── Component ────────────────────────────────────────────────────────────────
export default function IntroductionExample() {
  const book = useSpellbook({
    additionalFunctions: { gh_repo: GhRepoFunction as any },
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        alignItems: 'center',
        maxWidth: 'calc(100vw - 40px)',
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      <GridSheet
        book={book}
        sheetName="github-stats"
        initialCells={buildInitialCells({
          cells: {
            default: { style: cellBase },
            defaultCol: { width: 90 },
            defaultRow: { height: 34 },

            // Column labels
            A0: { label: 'Repo', style: ghLabelStyle, width: 150 },
            B0: { label: '⭐ Stars', style: ghLabelStyle },
            C0: { label: '🍴 Forks', style: ghLabelStyle },
            D0: { label: '🐛 Issues / PRs', style: ghLabelStyle },

            // Data rows — formula in B spills into C, D
            A1: {
              value: 'walkframe/gridsheet',
              style: { ...cellBase, color: '#0369a1', fontWeight: '600', fontSize: '11px' },
            },
            B1: { value: '=GH_REPO(A1)' },
            A2: {
              value: 'walkframe/covertable',
              style: { ...cellBase, color: '#0369a1', fontWeight: '600', fontSize: '11px' },
            },
            B2: { value: '=GH_REPO(A2)' },
          },
          ensured: { numRows: 2, numCols: 4 },
        })}
        options={{ sheetHeight: 150, sheetWidth: 500, sheetResize: 'both' }}
      />
    </div>
  );
}
