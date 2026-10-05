'use client';

import * as React from 'react';
import { request } from '@octokit/request';
import { GridSheet, oa2aa, Policy, buildInitialCellsFromOrigin, p2a } from '@gridsheet/react-core';
import type { PolicyMixinType, MatrixType, RenderProps } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';
import { useStarlightMode } from './useStarlightMode';

// Policy mixin that overlays the cell address in the top-right corner
const AddressOverlayMixin: PolicyMixinType = {
  renderCallback(rendered: any, { point }: RenderProps) {
    const address = p2a(point);
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 4,
            fontSize: '9px',
            color: 'var(--gs-muted-fg)',
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none',
            fontFamily: 'monospace',
          }}
        >
          {address}
        </span>
        {rendered}
      </div>
    );
  },
};

const ImagePolicyMixin: PolicyMixinType = {
  renderString({ value }: RenderProps<string>) {
    return (
      <div
        className="backface"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60px',
          height: '60px',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundImage: `url(${value})`,
          borderRadius: '50%',
          border: '3px solid #3498db',
          boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)',
        }}
      />
    );
  },
};

const ContributionsBarMixin: PolicyMixinType = {
  renderNumber({ value }: RenderProps<number>) {
    const LOG_MAX = Math.log(15000 + 1);
    const ratio = Math.log((value || 0) + 1) / LOG_MAX;
    const pct = Math.min(ratio * 100, 100);
    const formatted = (value || 0).toLocaleString();
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 2,
            bottom: 2,
            width: `${pct}%`,
            backgroundColor: 'rgba(46, 204, 113, 0.3)',
            borderRadius: '2px',
          }}
        />
        <span style={{ position: 'relative', marginLeft: 'auto', paddingRight: 4 }}>{formatted}</span>
      </div>
    );
  },
};

const UserLinkMixin: PolicyMixinType = {
  renderString({ value }: RenderProps<string>) {
    if (value == null || value === '') {
      return <span style={{ color: 'var(--gs-muted-fg)', fontStyle: 'italic' }}>-</span>;
    }
    return (
      <a
        target="_blank"
        href={`https://github.com/${value}`}
        style={{
          color: '#3498db',
          textDecoration: 'none',
          fontWeight: '500',
        }}
      >
        {value}
      </a>
    );
  },
};

const fields = ['avatar_url', 'login', 'contributions'];

const describeError = (error: any): string => {
  const status = error?.status;
  const remaining = error?.response?.headers?.['x-ratelimit-remaining'];
  if ((status === 403 || status === 429) && (remaining === '0' || /rate limit/i.test(String(error?.message)))) {
    return 'GitHub API rate limit exceeded (60 requests/hour for unauthenticated clients). Please try again later.';
  }
  return `Failed to fetch contributors from the GitHub API${status ? ` (HTTP ${status})` : ''}: ${error?.message ?? error}`;
};

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '16px',
  height: '400px',
  padding: '0 24px',
  textAlign: 'center',
  fontSize: '16px',
  color: 'var(--sl-color-gray-2)',
  border: '1px dashed var(--sl-color-hairline-shade)',
  borderRadius: '8px',
};

export default function GitHubContributors() {
  const inheritMode = useStarlightMode();
  const [data, setData] = React.useState<MatrixType>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await request('GET /repos/{owner}/{repo}/contributors', {
        owner: 'facebook',
        repo: 'react',
      });
      setData(oa2aa(response.data as { [s: string]: any }[], fields));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(describeError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const book = useSpellbook({
    policies: {
      avatar: new Policy({ mixins: [ImagePolicyMixin, { renderColHeaderLabel: () => 'Avatar' }, AddressOverlayMixin] }),
      user: new Policy({ mixins: [UserLinkMixin, { renderColHeaderLabel: () => 'User' }, AddressOverlayMixin] }),
      contributions: new Policy({
        mixins: [ContributionsBarMixin, { renderColHeaderLabel: () => 'Contributions' }, AddressOverlayMixin],
      }),
    },
  });

  let content: React.ReactNode;
  if (loading) {
    content = (
      <div style={panelStyle}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--sl-color-hairline)',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span>Loading contributors data...</span>
      </div>
    );
  } else if (error || data.length === 0) {
    content = (
      <div style={panelStyle} role="alert" className="case2-error">
        <span style={{ fontSize: '28px' }}>⚠️</span>
        <span style={{ color: 'var(--sl-color-white)', fontWeight: 600 }}>Could not load contributors</span>
        <span style={{ fontSize: '14px', maxWidth: 520 }}>{error ?? 'The GitHub API returned no contributors.'}</span>
        <button
          onClick={load}
          style={{
            padding: '6px 16px',
            borderRadius: '4px',
            border: '1px solid var(--sl-color-hairline-shade)',
            background: 'var(--sl-color-bg-nav)',
            color: 'var(--sl-color-white)',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  } else {
    content = (
      <GridSheet
        book={book}
        sheetName="contributors"
        initialCells={buildInitialCellsFromOrigin({
          matrix: data,
          cells: {
            defaultRow: {
              height: 80,
            },
            A0: { width: 80 },
            A: {
              policy: 'avatar',
              alignItems: 'center',
              style: {
                backgroundColor: 'rgba(52, 152, 219, 0.05)',
              },
            },
            B0: { width: 160 },
            B: {
              policy: 'user',
              alignItems: 'center',
              style: {
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fontWeight: '500',
              },
            },
            C0: { width: 250 },
            C: {
              policy: 'contributions',
              alignItems: 'center',
              justifyContent: 'right',
              style: {
                backgroundColor: 'rgba(46, 204, 113, 0.15)',
                fontWeight: '600',
              },
            },
          },
        })}
        options={{
          matrixAlignment: 'both',
          mode: inheritMode,
          sheetHeight: 500,
          limits: { minCols: 3, maxCols: 3 },
        }}
      />
    );
  }

  return (
    <div
      className="example-app"
      style={{
        margin: '0 auto',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
      }}
    >
      {content}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
