'use client';

import * as React from 'react';
import {
  GridSheet,
  buildInitialCells,
  Policy,
  PolicyMixinType,
  PercentagePolicyMixin,
  RenderProps,
  UserSheet,
  toValueMatrix,
} from '@gridsheet/react-core';
import { Debugger } from '@gridsheet/react-dev';
import { useSpellbook } from '@gridsheet/react-core/spellbook';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ── Sparkline chart policy ───────────────────────────────────────────────────
const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

const SparklinePolicyMixin: PolicyMixinType = {
  renderSheet({ value, point }: RenderProps<UserSheet>) {
    const matrix = toValueMatrix(value);
    const values: number[] = matrix.flatMap((row) => row.filter((v): v is number => typeof v === 'number'));
    if (values.length === 0) {
      return <span style={{ color: '#94a3b8' }}>—</span>;
    }

    const c = colors[(point.y - 1) % colors.length];
    return (
      <div style={{ width: '100%', height: '100%', padding: '4px 0' }}>
        <Line
          data={{
            labels: values.map((_, i) => `M${i + 1}`),
            datasets: [
              {
                data: values,
                borderColor: c,
                backgroundColor: c + '18',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: c,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
            scales: {
              y: { display: false, beginAtZero: true },
              x: { display: false },
            },
          }}
        />
      </div>
    );
  },
};

// ── Styles ───────────────────────────────────────────────────────────────────
const headerStyle = {
  backgroundColor: '#0f172a',
  color: '#e2e8f0',
  fontWeight: 'bold' as const,
  textAlign: 'center' as const,
  fontSize: '11px',
  letterSpacing: '0.5px',
};

const nameStyle = {
  fontWeight: '600' as const,
  fontSize: '12px',
  color: '#1e293b',
};

const numStyle = {
  textAlign: 'right' as const,
  fontSize: '12px',
  color: '#334155',
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
};

const growthUp = {
  textAlign: 'center' as const,
  fontSize: '11px',
  fontWeight: '600' as const,
  color: '#059669',
  backgroundColor: '#ecfdf5',
};

const metricLabelStyle = {
  fontSize: '12px',
  fontWeight: '500' as const,
  color: '#475569',
};

const metricValueStyle = {
  fontSize: '13px',
  fontWeight: 'bold' as const,
  textAlign: 'center' as const,
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
};

// ── Label ────────────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#64748b',
  marginBottom: '8px',
  letterSpacing: '0.3px',
};

const hintStyle: React.CSSProperties = {
  fontWeight: 400,
  color: '#94a3b8',
  marginLeft: '8px',
};

const sheetNameStyle: React.CSSProperties = {
  marginTop: '6px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  color: '#94a3b8',
};

const sheetNameInputStyle: React.CSSProperties = {
  padding: '2px 6px',
  border: '1px solid #e2e8f0',
  borderRadius: '4px',
  fontSize: '12px',
  color: '#475569',
  background: '#f8fafc',
  width: '100px',
};

export default function SalesDashboard() {
  const book = useSpellbook({
    policies: {
      sparkline: new Policy({ mixins: [SparklinePolicyMixin] }),
      percentage: new Policy({ mixins: [PercentagePolicyMixin] }),
    },
  });

  const [sheetName1, setSheetName1] = React.useState('metrics');
  const [sheetName2, setSheetName2] = React.useState('dashboard');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* ── Sheet 1: Monthly Metrics ──────────────────────────────────────── */}
      <section>
        <div style={labelStyle}>
          Monthly Metrics
          <span style={hintStyle}>— sparkline rendered from range formula via custom policy</span>
        </div>
        <GridSheet
          book={book}
          sheetName={sheetName1}
          initialCells={buildInitialCells({
            matrices: {
              A1: [
                ['Revenue', '=C1:H1', 42, 51, 48, 67, 73, 89, '=ROUND((H1-C1)/C1,3)'],
                ['New Users', '=C2:H2', 120, 185, 210, 340, 295, 410, '=ROUND((H2-C2)/C2,3)'],
                ['Churn Rate', '=C3:H3', 5.2, 4.8, 4.1, 3.9, 3.5, 2.8, '=ROUND((H3-C3)/C3,3)'],
                ['NPS Score', '=C4:H4', 32, 38, 41, 45, 52, 58, '=ROUND((H4-C4)/C4,3)'],
                ['MRR (k)', '=C5:H5', 18, 22, 25, 31, 38, 47, '=ROUND((H5-C5)/C5,3)'],
              ],
            },
            cells: {
              defaultCol: { width: 55 },
              defaultRow: { height: 50 },
              A0: { width: 90, label: 'Metric', style: headerStyle },
              B0: { width: 140, label: 'Trend', style: headerStyle },
              C0: { label: 'Jan', style: headerStyle },
              D0: { label: 'Feb', style: headerStyle },
              E0: { label: 'Mar', style: headerStyle },
              F0: { label: 'Apr', style: headerStyle },
              G0: { label: 'May', style: headerStyle },
              H0: { label: 'Jun', style: headerStyle },
              I0: { width: 65, label: 'Growth', style: headerStyle },
              A: { style: nameStyle },
              B: { policy: 'sparkline', style: { backgroundColor: '#fafbfc' } },
              'C:H': { style: numStyle, alignItems: 'center' },
              I: { style: growthUp, alignItems: 'center', policy: 'percentage' },

              // Summary row — per-metric averages
              A6: { value: 'Average', style: { ...headerStyle, textAlign: 'right' as const } },
              B6: { value: '=C6:H6', policy: 'sparkline', style: { backgroundColor: '#0f172a' } },
              C6: { value: '=ROUND(AVERAGE(C1:C5),1)', style: { ...headerStyle, fontWeight: 'bold' as const } },
              D6: { value: '=ROUND(AVERAGE(D1:D5),1)', style: { ...headerStyle, fontWeight: 'bold' as const } },
              E6: { value: '=ROUND(AVERAGE(E1:E5),1)', style: { ...headerStyle, fontWeight: 'bold' as const } },
              F6: { value: '=ROUND(AVERAGE(F1:F5),1)', style: { ...headerStyle, fontWeight: 'bold' as const } },
              G6: { value: '=ROUND(AVERAGE(G1:G5),1)', style: { ...headerStyle, fontWeight: 'bold' as const } },
              H6: { value: '=ROUND(AVERAGE(H1:H5),1)', style: { ...headerStyle, fontWeight: 'bold' as const } },
              I6: { value: '=ROUND(AVERAGE(I1:I5),3)', style: { ...growthUp, fontWeight: 'bold' as const } },
              '06': { sortFixed: true, filterFixed: true },
              '6': { style: { borderTop: '3px double #000000' } },
            },
          })}
          options={{ sheetHeight: 360, sheetWidth: 720, sheetResize: 'both' }}
        />
        <div style={sheetNameStyle}>
          sheet:
          <input value={sheetName1} onChange={(e) => setSheetName1(e.target.value)} style={sheetNameInputStyle} />
        </div>
      </section>

      {/* ── Sheet 2: Dashboard (cross-sheet + ARRAYFORMULA spill) ─────────── */}
      <section>
        <div style={labelStyle}>
          Dashboard
          <span style={hintStyle}>— cross-sheet formulas + ARRAYFORMULA / IF spill status &amp; gap columns</span>
        </div>
        <div className="dashboard-striped">
          <style>{`
          .dashboard-striped .gs-row-even .gs-cell { background-color: #2d2024; }
        `}</style>
          <GridSheet
            book={book}
            sheetName={sheetName2}
            initialCells={buildInitialCells({
              matrices: {
                A1: [
                  ['Total Revenue', '=SUM(metrics!C1:H1)', 350],
                  ['Total New Users', '=SUM(metrics!C2:H2)', 1500],
                  ['Avg Churn Rate', '=ROUND(AVERAGE(metrics!C3:H3),1)', 4.0],
                  ['Avg NPS', '=ROUND(AVERAGE(metrics!C4:H4),0)', 45],
                  ['Total MRR (k)', '=SUM(metrics!C5:H5)', 170],
                ],
              },
              cells: {
                //defaultRow: { height: 36 },

                // ── Header row ──
                A0: { label: 'KPI', width: 150 },
                B0: { label: 'Value', width: 90 },
                C0: { label: 'Target', width: 80 },
                D0: { label: 'Status', width: 110 },
                E0: { label: 'Gap', width: 80 },

                // ── Column styles ──

                'B1:B5': {
                  alignItems: 'center',
                },
                C: {
                  style: { ...metricValueStyle, color: 'blue' },
                  alignItems: 'center',
                },

                // ── Spill: ARRAYFORMULA + IF for Status ──
                D1: {
                  value: '=ARRAYFORMULA(IF(B1:B5>=C1:C5,"✓ On Track","✗ Behind"))',
                },

                // ── Spill: ARRAYFORMULA for Gap ──
                E1: {
                  value: '=ARRAYFORMULA(B1:B5-C1:C5)',
                },
              },
              ensured: { numRows: 5, numCols: 5 },
            })}
            options={{ sheetHeight: 340, sheetWidth: 580, sheetResize: 'both', mode: 'dark' }}
          />
        </div>
        <div style={sheetNameStyle}>
          sheet:
          <input value={sheetName2} onChange={(e) => setSheetName2(e.target.value)} style={sheetNameInputStyle} />
        </div>
      </section>
    </div>
  );
}
