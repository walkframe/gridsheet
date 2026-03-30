'use client';

import * as React from 'react';
import {
  GridSheet,
  makeBorder,
  buildInitialCells,
  Policy,
  PolicyMixinType,
  AutocompleteOption,
  BaseFunctionAsync,
  Spilling,
  FunctionArgumentDefinition,
  FormulaError,
} from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';

// ── Completion Policy (range slider) ────────────────────────────────────────
const CompletionPolicyMixin: PolicyMixinType = {
  renderNumber({ value, apply, sheet, point }) {
    const pct = Math.min(100, Math.max(0, Math.round(value)));
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (apply) {
        apply(sheet.write({ point, value: e.target.value }));
      }
    };
    const color = pct >= 80 ? '#059669' : pct >= 50 ? '#d97706' : '#dc2626';
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '0 6px',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={handleChange}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ flex: 1, minWidth: 0, accentColor: color }}
        />
        <span
          style={{ fontSize: '11px', fontWeight: 'bold', color, minWidth: '30px', textAlign: 'right', flexShrink: 0 }}
        >
          {pct}%
        </span>
      </div>
    );
  },
};

// ── Status Policy (autocomplete + dynamic style) ────────────────────────────
const statusColors: Record<string, { bg: string; text: string }> = {
  complete: { bg: '#dcfce7', text: '#166534' },
  'in progress': { bg: '#fef3c7', text: '#92400e' },
  pending: { bg: '#fee2e2', text: '#991b1b' },
  'not started': { bg: '#f3f4f6', text: '#374151' },
};

const StatusPolicyMixin: PolicyMixinType = {
  getSelectOptions: (): AutocompleteOption[] => [
    { value: 'Not Started', label: '⏸️ Not Started' },
    { value: 'In Progress', label: '🔄 In Progress' },
    { value: 'Pending', label: '⏳ Pending' },
    { value: 'Complete', label: '✅ Complete' },
  ],
  getSelectFallback: () => ({ value: 'Not Started' }),
  select: ({ next }: any) => {
    if (next?.value == null) {
      return next;
    }
    const c = statusColors[(next.value as string).toLowerCase()] ?? statusColors['not started'];
    return {
      ...next,
      style: {
        backgroundColor: c.bg,
        color: c.text,
        borderRadius: '12px',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 'bold',
        textAlign: 'center',
      },
    };
  },
};

// ── Category Policy (autocomplete with color badges) ────────────────────────
const categoryColors: Record<string, string> = {
  Core: '#dbeafe',
  Customize: '#fff7ed',
  Formula: '#dcfce7',
  UX: '#fce7f3',
};

const CategoryPolicyMixin: PolicyMixinType = {
  getSelectOptions: (): AutocompleteOption[] => [
    { value: 'Core', label: '🔧 Core' },
    { value: 'Customize', label: '⚙️ Customize' },
    { value: 'Formula', label: '📐 Formula' },
    { value: 'UX', label: '✨ UX' },
  ],
  select: ({ next }: any) => {
    if (next?.value == null) {
      return next;
    }
    const bg = categoryColors[next.value as string] ?? '#f9fafb';
    return {
      ...next,
      style: {
        backgroundColor: bg,
        textAlign: 'center',
        fontSize: '11px',
        fontWeight: '600',
        borderRadius: '10px',
        padding: '2px 6px',
      },
    };
  },
};

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
const border = null;

const cellBase = { fontSize: '12px', padding: '4px' };

const headerCellStyle = {
  backgroundColor: '#1e40af',
  color: 'white',
  fontWeight: 'bold' as const,
  textAlign: 'center' as const,
  fontSize: '12px',
  ...border,
};

const featureNameStyle = {
  ...cellBase,
  fontWeight: '600' as const,
  backgroundColor: '#f8fafc',
};

const sectionHeaderStyle = {
  backgroundColor: '#1f2937',
  color: '#94a3b8',
  fontSize: '11px',
  fontWeight: '600' as const,
  letterSpacing: '0.5px',
  ...border,
};

const ghStatsCellStyle = {
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  textAlign: 'center' as const,
  fontWeight: 'bold' as const,
  fontSize: '14px',
  ...border,
};

const ghLabelStyle = {
  color: '#0369a1',
  textAlign: 'center' as const,
  fontSize: '11px',
  fontWeight: '600' as const,
  ...border,
};

const categoryCellStyle = (cat: string) => ({
  ...cellBase,
  backgroundColor: categoryColors[cat] ?? '#f9fafb',
  textAlign: 'center' as const,
  fontSize: '11px',
  fontWeight: '600' as const,
});

const completionCellStyle = (pct: number) => ({
  ...cellBase,
  backgroundColor: pct >= 80 ? '#f0fdf4' : pct >= 50 ? '#fffbeb' : '#fef2f2',
});

const memoStyle = {
  ...cellBase,
  color: '#6b7280',
  fontSize: '10px',
  fontStyle: 'italic' as const,
  padding: '2px 6px',
};

// ── Component ────────────────────────────────────────────────────────────────
export default function IntroductionExample() {
  const book = useSpellbook({
    additionalFunctions: { gh_repo: GhRepoFunction as any },
    policies: {
      completion: new Policy({ mixins: [CompletionPolicyMixin] }),
      status: new Policy({ mixins: [StatusPolicyMixin] }),
      category: new Policy({ mixins: [CategoryPolicyMixin] }),
    },
  });

  const sectionLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const sheetWrapperStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    width: 'fit-content',
    maxWidth: '100%',
  };

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
      {/* ── Sheet 1: Live GitHub Stats (async spill) ──────────────────────── */}
      <div style={sheetWrapperStyle}>
        <div style={sectionLabelStyle}>
          <span>🌐</span> Live Data — Async formula fetches GitHub API
        </div>
        <GridSheet
          book={book}
          sheetName="github-stats"
          initialCells={buildInitialCells({
            cells: {
              default: { style: cellBase },
              defaultCol: { width: 110 },
              defaultRow: { height: 34 },

              // Column labels
              A0: { label: 'Repo', style: ghLabelStyle, width: 180 },
              B0: { label: '⭐ Stars', style: ghLabelStyle },
              C0: { label: '🍴 Forks', style: ghLabelStyle },
              D0: { label: '🐛 Issues / PRs', style: ghLabelStyle },

              // Data rows — formula in B spills into C, D
              A1: {
                value: 'walkframe/gridsheet',
                style: { ...cellBase, color: '#0369a1', fontWeight: '600', fontSize: '11px' },
              },
              B1: { value: '=GH_REPO(A1)' },
            },
            ensured: { numRows: 1, numCols: 4 },
          })}
          options={{ sheetHeight: 150, sheetWidth: 500, sheetResize: 'both' }}
        />
      </div>

      {/* ── Sheet 2: Feature Matrix ────────────────────────────────────────── */}
      <div style={sheetWrapperStyle}>
        <div style={sectionLabelStyle}>
          <span>📊</span> Feature Matrix — Custom renderers, formulas & autocomplete
        </div>
        <GridSheet
          book={book}
          sheetName="features"
          initialCells={buildInitialCells({
            cells: {
              default: { style: cellBase },
              defaultCol: { width: 90 },
              defaultRow: { height: 34 },
              A0: { width: 175, label: 'Feature', style: headerCellStyle },
              B0: { width: 105, label: 'Category', style: headerCellStyle },
              C0: { width: 130, label: 'Completion', style: headerCellStyle },
              D0: { width: 220, label: 'Memo', style: { ...headerCellStyle, textAlign: 'left' as const } },

              // ── Core ──
              A1: { value: 'Virtualization', style: featureNameStyle },
              A2: { value: 'Keyboard Shortcut', style: featureNameStyle },
              A3: { value: 'Undo / Redo', style: featureNameStyle },
              A4: { value: 'Context Menu', style: featureNameStyle },

              // ── Customize ──
              A5: { value: 'Custom Renderer', style: featureNameStyle },
              A6: { value: 'Custom Serializer', style: featureNameStyle },
              A7: { value: 'Custom Deserializer', style: featureNameStyle },
              A8: { value: 'Sheet API', style: featureNameStyle },
              A9: { value: 'Event Handler', style: featureNameStyle },

              // ── Formula ──
              A10: { value: 'Formula Engine', style: featureNameStyle },
              A11: { value: 'Formula Functions', style: featureNameStyle },
              A12: { value: 'Formula Spill', style: featureNameStyle },
              A13: { value: 'Async Formula', style: featureNameStyle },
              A14: { value: 'Async Formula Cache', style: featureNameStyle },
              A15: { value: 'Async Formula Inflight', style: featureNameStyle },
              A16: { value: 'Absolute Reference', style: featureNameStyle },

              // ── UX ──
              A17: { value: 'Autocomplete', style: featureNameStyle },
              A18: { value: 'Cross-sheet Reference', style: featureNameStyle },
              A19: { value: 'Sort', style: featureNameStyle },
              A20: { value: 'Filter', style: featureNameStyle },
              A21: { value: 'Search', style: featureNameStyle },

              // Category column
              B1: { value: 'Core', policy: 'category', style: categoryCellStyle('Core') },
              B2: { value: 'Core', policy: 'category', style: categoryCellStyle('Core') },
              B3: { value: 'Core', policy: 'category', style: categoryCellStyle('Core') },
              B4: { value: 'Core', policy: 'category', style: categoryCellStyle('Core') },
              B5: { value: 'Customize', policy: 'category', style: categoryCellStyle('Customize') },
              B6: { value: 'Customize', policy: 'category', style: categoryCellStyle('Customize') },
              B7: { value: 'Customize', policy: 'category', style: categoryCellStyle('Customize') },
              B8: { value: 'Customize', policy: 'category', style: categoryCellStyle('Customize') },
              B9: { value: 'Customize', policy: 'category', style: categoryCellStyle('Customize') },
              B10: { value: 'Formula', policy: 'category', style: categoryCellStyle('Formula') },
              B11: { value: 'Formula', policy: 'category', style: categoryCellStyle('Formula') },
              B12: { value: 'Formula', policy: 'category', style: categoryCellStyle('Formula') },
              B13: { value: 'Formula', policy: 'category', style: categoryCellStyle('Formula') },
              B14: { value: 'Formula', policy: 'category', style: categoryCellStyle('Formula') },
              B15: { value: 'Formula', policy: 'category', style: categoryCellStyle('Formula') },
              B16: { value: 'Formula', policy: 'category', style: categoryCellStyle('Formula') },
              B17: { value: 'UX', policy: 'category', style: categoryCellStyle('UX') },
              B18: { value: 'UX', policy: 'category', style: categoryCellStyle('UX') },
              B19: { value: 'UX', policy: 'category', style: categoryCellStyle('UX') },
              B20: { value: 'UX', policy: 'category', style: categoryCellStyle('UX') },
              B21: { value: 'UX', policy: 'category', style: categoryCellStyle('UX') },

              // Completion column
              'C1:C21': { policy: 'completion' },
              C1: { value: 95, policy: 'completion', style: completionCellStyle(95) },
              C2: { value: 95, policy: 'completion', style: completionCellStyle(95) },
              C3: { value: 80, policy: 'completion', style: completionCellStyle(80) },
              C4: { value: 80, policy: 'completion', style: completionCellStyle(80) },
              C5: { value: 100, policy: 'completion', style: completionCellStyle(100) },
              C6: { value: 100, policy: 'completion', style: completionCellStyle(100) },
              C7: { value: 100, policy: 'completion', style: completionCellStyle(100) },
              C8: { value: 80, policy: 'completion', style: completionCellStyle(80) },
              C9: { value: 70, policy: 'completion', style: completionCellStyle(70) },
              C10: { value: 80, policy: 'completion', style: completionCellStyle(80) },
              C11: { value: 30, policy: 'completion', style: completionCellStyle(30) },
              C12: { value: 100, policy: 'completion', style: completionCellStyle(100) },
              C13: { value: 100, policy: 'completion', style: completionCellStyle(100) },
              C14: { value: 100, policy: 'completion', style: completionCellStyle(100) },
              C15: { value: 100, policy: 'completion', style: completionCellStyle(100) },
              C16: { value: 100, policy: 'completion', style: completionCellStyle(100) },
              C17: { value: 90, policy: 'completion', style: completionCellStyle(90) },
              C18: { value: 70, policy: 'completion', style: completionCellStyle(70) },
              C19: { value: 100, policy: 'completion', style: completionCellStyle(100) },
              C20: { value: 90, policy: 'completion', style: completionCellStyle(90) },
              C21: { value: 100, policy: 'completion', style: completionCellStyle(100) },

              // Memo column
              D2: { value: 'Want to implement F4 to cycle absolute reference', style: memoStyle },
              D4: { value: 'Not enough customizability', style: memoStyle },
              D8: { value: 'History-related APIs are lacking', style: memoStyle },
              D10: {
                value: 'Temporary refs like LET planned for future. Array literals {} not yet supported',
                style: memoStyle,
              },
              D11: { value: 'Of ~500 functions, ~140 are currently supported', style: memoStyle },
              D18: { value: 'Plan to sync column count / width across sheets in the future', style: memoStyle },

              // Summary
              A22: {
                value: 'Avg Completion',
                style: {
                  ...cellBase,
                  backgroundColor: '#1f2937',
                  color: 'white',
                  fontWeight: 'bold',
                  textAlign: 'right' as const,
                },
              },
              B22: {
                value: '=COUNTA(A1:A21)&" features"',
                style: {
                  ...cellBase,
                  backgroundColor: '#1f2937',
                  color: '#94a3b8',
                  textAlign: 'center' as const,
                  fontSize: '11px',
                },
              },
              C22: {
                value: '=ROUND(AVERAGE(C1:C21),1)&"%"',
                style: {
                  ...cellBase,
                  backgroundColor: '#059669',
                  color: 'white',
                  fontWeight: 'bold',
                  textAlign: 'center' as const,
                },
              },
              D22: { style: { backgroundColor: '#1f2937' } },
              '022': { sortFixed: true, filterFixed: true },
            },
            ensured: { numRows: 22, numCols: 4 },
          })}
          options={{ sheetHeight: 400, sheetWidth: 500, sheetResize: 'both' }}
        />
      </div>
    </div>
  );
}
