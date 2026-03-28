'use client';

import * as React from 'react';
import {
  GridSheet,
  buildInitialCells,
  operations,
  Policy,
  PolicyMixinType,
  RenderProps,
  Sheet,
} from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/functions';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Line chart policy
const LineChartPolicyMixin: PolicyMixinType = {
  renderSheet({ value }: RenderProps<Sheet>) {
    // =C1:F1 with resolution:'AREA' delivers the range as a Sheet.
    // Extract numeric values from the trimmed sheet.
    const matrix = value._toValueMatrix();
    const values: number[] = matrix.flatMap((row) => row.filter((v): v is number => typeof v === 'number'));

    if (values.length === 0) {
      return <span>No data</span>;
    }

    const data = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'].slice(0, values.length),
      datasets: [
        {
          label: 'Sales',
          data: values,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3498db',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#3498db',
          borderWidth: 1,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: '#7f8c8d',
            font: {
              size: 10,
            },
          },
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: '#7f8c8d',
            font: {
              size: 10,
            },
          },
        },
      },
      elements: {
        point: {
          hoverRadius: 6,
        },
      },
    };
    return (
      <div style={{ width: '100%', height: '60px' }}>
        <Line data={data} options={options} />
      </div>
    );
  },
};

export default function SalesDashboard() {
  const book = useSpellbook({
    policies: {
      lineChart: new Policy({ mixins: [LineChartPolicyMixin] }),
    },
  });

  const [sheetName1, setSheetName1] = React.useState('sales');
  const [sheetName2, setSheetName2] = React.useState('summary');

  return (
    <div
      className="App"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        margin: '0 auto',
        padding: '20px',
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
      }}
    >
      {/* Sales Data & Charts and Summary Statistics - Side by Side */}
      <div
        style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: '1fr auto',
          gridAutoRows: 'min-content',
          alignItems: 'start',
          marginBottom: '20px',
        }}
      >
        {/* Sales Data & Charts */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            minHeight: 'fit-content',
          }}
        >
          <h3
            style={{
              color: '#2c3e50',
              margin: '0 0 15px 0',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            📈 Sales Data & Charts
          </h3>
          <GridSheet
            book={book}
            sheetName={sheetName1}
            initialCells={buildInitialCells({
              matrices: {
                A1: [
                  [
                    'Widget A',
                    '=C1:F1',
                    30,
                    50,
                    78,
                    95,
                    '=SUM(C1:F1)',
                    '=IF((F1-E1)/E1>0.1,"📈 Up",IF((F1-E1)/E1<-0.1,"📉 Down","➡️ Stable"))',
                  ],
                  [
                    'Widget B',
                    '=C2:F2',
                    90,
                    88,
                    91,
                    64,
                    '=SUM(C2:F2)',
                    '=IF((F2-E2)/E2>0.1,"📈 Up",IF((F2-E2)/E2<-0.1,"📉 Down","➡️ Stable"))',
                  ],
                  [
                    'Widget C',
                    '=C3:F3',
                    70,
                    87,
                    93,
                    89,
                    '=SUM(C3:F3)',
                    '=IF((F3-E3)/E3>0.1,"📈 Up",IF((F3-E3)/E3<-0.1,"📉 Down","➡️ Stable"))',
                  ],
                  [
                    'Widget D',
                    '=C4:F4',
                    64,
                    60,
                    82,
                    91,
                    '=SUM(C4:F4)',
                    '=IF((F4-E4)/E4>0.1,"📈 Up",IF((F4-E4)/E4<-0.1,"📉 Down","➡️ Stable"))',
                  ],
                ],
              },
              cells: {
                defaultCol: { width: 120 },
                defaultRow: { height: 60 },
                A0: { width: 80, label: 'Product' },
                'A:G': {
                  alignItems: 'center',
                },
                B0: { width: 160, label: 'Chart' },
                B: {
                  policy: 'lineChart',
                  style: { backgroundColor: '#f8f9fa' },
                },
                C0: { label: 'Q1', width: 50 },
                D0: { label: 'Q2', width: 50 },
                E0: { label: 'Q3', width: 50 },
                F0: { label: 'Q4', width: 50 },
                'C:F': {
                  style: { backgroundColor: '#ecf0f1' },
                  alignItems: 'center',
                  justifyContent: 'right',
                },
                G0: {
                  width: 50,
                  label: 'Total',
                },
                G: {
                  style: { backgroundColor: '#e8f5e8', fontWeight: 'bold' },
                  //prevention: operations.Write,
                },
                H0: { width: 70, label: 'Trend' },
                H: {
                  style: { backgroundColor: '#fff3cd' },
                  prevention: operations.Write,
                },
              },
            })}
            options={{
              sheetHeight: 450,
              sheetWidth: 680,
            }}
          />
          <div style={{ marginTop: '10px' }}>
            <label
              style={{
                fontSize: '14px',
                color: '#7f8c8d',
                fontWeight: '500',
              }}
            >
              Sheet name:
            </label>
            <input
              value={sheetName1}
              onChange={(e) => setSheetName1(e.target.value)}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        {/* Summary Statistics */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            minHeight: 'fit-content',
          }}
        >
          <h3
            style={{
              color: '#2c3e50',
              margin: '0 0 15px 0',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            📊 Summary Statistics
          </h3>
          <GridSheet
            book={book}
            sheetName={sheetName2}
            initialCells={buildInitialCells({
              matrices: {
                A1: [
                  ['Total Sales', '=SUM(sales!G1:G4)'],
                  ['Average per Product', '=AVERAGE(sales!G1:G4)'],
                  ['Best Performer', '=INDEX(sales!A1:A4, MATCH(MAX(sales!G1:G4), sales!G1:G4, 0))'],
                  ['Highest Q1 Sales', '=INDEX(sales!A1:A4, MATCH(MAX(sales!C1:C4), sales!C1:C4, 0))'],
                  ['Lowest Total Sales', '=INDEX(sales!A1:A4, MATCH(MIN(sales!G1:G4), sales!G1:G4, 0))'],
                ],
              },
              cells: {
                defaultRow: { height: 40 },
                A0: { label: 'Metric', width: 150 },
                B0: { label: 'Value', width: 80 },
                'B1:B5': {
                  style: {
                    backgroundColor: '#d5f4e6',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  },
                  alignItems: 'center',
                },
              },
            })}
            options={{
              sheetHeight: 240,
              sheetWidth: 310,
            }}
          />
          <div style={{ marginTop: '10px' }}>
            <label
              style={{
                fontSize: '14px',
                color: '#7f8c8d',
                fontWeight: '500',
              }}
            >
              Sheet name:
            </label>
            <input
              value={sheetName2}
              onChange={(e) => setSheetName2(e.target.value)}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
