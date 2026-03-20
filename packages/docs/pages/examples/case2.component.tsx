'use client';

import * as React from 'react';
import { request } from '@octokit/request';
import {
  GridSheet,
  oa2aa,
  Policy,
  PolicyMixinType,
  MatrixType,
  buildInitialCellsFromOrigin,
  ThousandSeparatorPolicyMixin,
  useHub,
  type RenderProps,
} from '@gridsheet/react-core';

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

const LinkPolicyMixin: PolicyMixinType = {
  renderString({ value }: RenderProps<string>) {
    if (value == null || value === '') {
      return <span style={{ color: '#999', fontStyle: 'italic' }}>No URL</span>;
    }
    return (
      <a
        target="_blank"
        href={value}
        style={{
          color: '#3498db',
          textDecoration: 'none',
          fontWeight: '500',
          transition: 'all 0.3s ease',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          border: '1px solid rgba(52, 152, 219, 0.2)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(52, 152, 219, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {value}
      </a>
    );
  },
};

export default function GitHubContributors() {
  const fields = ['id', 'avatar_url', 'login', 'html_url', 'contributions'];
  const [data, setData] = React.useState<MatrixType>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await request('GET /repos/{owner}/{repo}/contributors', {
          owner: 'facebook',
          repo: 'react',
        });
        setData(oa2aa(response.data as { [s: string]: any }[], fields));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hub = useHub({
    policies: {
      thousand_separator: new Policy({ mixins: [ThousandSeparatorPolicyMixin] }),
      image: new Policy({ mixins: [ImagePolicyMixin] }),
      link: new Policy({ mixins: [LinkPolicyMixin] }),
      id: new Policy({ mixins: [{ renderColHeaderLabel: () => 'ID' }] }),
      avatar: new Policy({ mixins: [ImagePolicyMixin, { renderColHeaderLabel: () => 'Avatar' }] }),
      user: new Policy({ mixins: [{ renderColHeaderLabel: () => 'user' }] }),
      url: new Policy({ mixins: [LinkPolicyMixin, { renderColHeaderLabel: () => 'URL' }] }),
      contributions: new Policy({
        mixins: [ThousandSeparatorPolicyMixin, { renderColHeaderLabel: () => 'Contributions' }],
      }),
    },
  });

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
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px',
            fontSize: '18px',
            color: '#666',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span>Loading contributors data...</span>
          </div>
        </div>
      ) : (
        <GridSheet
          hub={hub}
          sheetName="contributors"
          initialCells={buildInitialCellsFromOrigin({
            matrix: data,
            cells: {
              default: {
                height: 80,
              },
              A: {
                policy: 'id',
                width: 80,
                justifyContent: 'right',
                alignItems: 'center',
                style: {
                  backgroundColor: 'rgba(52, 152, 219, 0.1)',
                  fontWeight: '600',
                  color: '#ffffff',
                },
              },
              B: {
                policy: 'avatar',
                alignItems: 'center',
                style: {
                  backgroundColor: 'rgba(52, 152, 219, 0.05)',
                },
              },
              C: {
                policy: 'user',
                width: 150,
                alignItems: 'center',
                style: {
                  backgroundColor: 'rgba(52, 152, 219, 0.1)',
                  fontWeight: '500',
                  color: '#ffffff',
                },
              },
              D: {
                policy: 'url',
                width: 230,
                alignItems: 'center',
                style: {
                  backgroundColor: 'rgba(52, 152, 219, 0.05)',
                },
              },
              E: {
                policy: 'contributions',
                alignItems: 'center',
                justifyContent: 'right',
                style: {
                  backgroundColor: 'rgba(46, 204, 113, 0.15)',
                  fontWeight: '600',
                  color: '#2ecc71',
                },
              },
            },
          })}
          options={{
            mode: 'dark',
            sheetHeight: 500,
            sheetWidth: 1000,
            minNumCols: 5,
            maxNumCols: 5,
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
