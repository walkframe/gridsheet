'use client';

import * as React from 'react';
import {
  GridSheet,
  buildInitialCells,
  BaseFunction,
  operations,
  useHub,
  Renderer,
  RendererMixinType,
  RenderProps,
  Table,
} from '@gridsheet/react-core';
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

// Bar chart renderer
const BarChartRendererMixin: RendererMixinType = {
  number({ value }) {
    const maxValue = 100;
    const percentage = Math.min((value / maxValue) * 100, 100);

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
        }}
      >
        <progress
          value={percentage}
          max="100"
          style={{
            width: '80px',
            height: '16px',
            borderRadius: '8px',
            backgroundColor: '#ecf0f1',
            border: 'none',
          }}
        />
        <span
          style={{
            fontWeight: 'bold',
            color: percentage > 80 ? '#27ae60' : percentage > 60 ? '#f39c12' : '#e74c3c',
          }}
        >
          {value}
        </span>
      </div>
    );
  },
};

// Line chart renderer
const LineChartRendererMixin: RendererMixinType = {
  table({ value: table }: RenderProps<Table>) {
    try {
      // Extract values from the table using getFieldMatrix
      const matrix = table.getFieldMatrix();

      // Flatten the matrix to get all values
      const values: number[] = [];
      for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
          const value = matrix[row][col];
          if (typeof value === 'number') {
            values.push(value);
          }
        }
      }

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
    } catch (error) {
      return <span>Error: {error instanceof Error ? error.message : String(error)}</span>;
    }
  },
};

export default function SalesDashboard() {
  const hub = useHub({
    renderers: {
      barChart: new Renderer({ mixins: [BarChartRendererMixin] }),
      lineChart: new Renderer({ mixins: [LineChartRendererMixin] }),
    },
  });

  const [sheetName1, setSheetName1] = React.useState('sales');
  const [sheetName2, setSheetName2] = React.useState('summary');
  const [sheetName3, setSheetName3] = React.useState('trends');
  const salesConnector = React.useRef<any>(null);

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
      {/* Sales Dashboard - Full Width */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
          hub={hub}
          sheetName={sheetName1}
          connector={salesConnector}
          initialCells={buildInitialCells({
            matrices: {
              A1: [
                ['Product', 'Chart', 'Q1 Sales', 'Q2 Sales', 'Q3 Sales', 'Q4 Sales', 'Total', 'Trend'],
                [
                  'Widget A',
                  '=C2:F2',
                  30,
                  50,
                  78,
                  95,
                  '=SUM(C2:F2)',
                  '=IF((F2-E2)/E2>0.1,"📈 Up",IF((F2-E2)/E2<-0.1,"📉 Down","➡️ Stable"))',
                ],
                [
                  'Widget B',
                  '=C3:F3',
                  90,
                  88,
                  91,
                  64,
                  '=SUM(C3:F3)',
                  '=IF((F3-E3)/E3>0.1,"📈 Up",IF((F3-E3)/E3<-0.1,"📉 Down","➡️ Stable"))',
                ],
                [
                  'Widget C',
                  '=C4:F4',
                  70,
                  87,
                  93,
                  89,
                  '=SUM(C4:F4)',
                  '=IF((F4-E4)/E4>0.1,"📈 Up",IF((F4-E4)/E4<-0.1,"📉 Down","➡️ Stable"))',
                ],
                [
                  'Widget D',
                  '=C5:F5',
                  64,
                  60,
                  82,
                  91,
                  '=SUM(C5:F5)',
                  '=IF((F5-E5)/E5>0.1,"📈 Up",IF((F5-E5)/E5<-0.1,"📉 Down","➡️ Stable"))',
                ],
              ],
            },
            cells: {
              default: { width: 120, height: 60 },
              1: { height: 25 },
              'A1:H1': {
                style: {
                  backgroundColor: '#2c3e50',
                  color: 'white',
                  fontWeight: 'bold',
                  textAlign: 'center',
                },
                prevention: operations.Write,
              },
              A: { width: 80 },
              'A:G': {
                alignItems: 'center',
              },
              B: {
                width: 200,
                renderer: 'lineChart',
                style: { backgroundColor: '#f8f9fa' },
              },
              'C:F': {
                style: { backgroundColor: '#ecf0f1' },
                renderer: 'barChart',
              },
              G: {
                width: 60,
                style: { backgroundColor: '#e8f5e8', fontWeight: 'bold' },
                prevention: operations.Write,
              },
              H: {
                width: 80,
                style: { backgroundColor: '#fff3cd' },
                prevention: operations.Write,
              },
            },
          })}
          options={{
            sheetHeight: 450,
            sheetWidth: typeof window !== 'undefined' ? Math.min(1200, window.innerWidth - 60) : 1200,
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

      {/* Summary and Trends - Side by Side */}
      <div
        style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gridAutoRows: 'min-content',
          alignItems: 'start',
        }}
      >
        {/* Summary Statistics */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
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
            hub={hub}
            sheetName={sheetName2}
            initialCells={buildInitialCells({
              matrices: {
                A1: [
                  ['Metric', 'Value', 'Status'],
                  ['Total Sales', '=SUM(sales!G2:G5)', '=IF(B2>350, "🎉 Excellent", "📊 Good")'],
                  ['Average per Product', '=AVERAGE(sales!G2:G5)', '=IF(B3>85, "✅ Above Target", "⚠️ Below Target")'],
                  ['Best Performer', '=INDEX(sales!A2:A5, MATCH(MAX(sales!G2:G5), sales!G2:G5, 0))', '🏆 Top Seller'],
                  ['Highest Q1 Sales', '=INDEX(sales!A2:A5, MATCH(MAX(sales!C2:C5), sales!C2:C5, 0))', '🔥 Q1 Leader'],
                  [
                    'Lowest Total Sales',
                    '=INDEX(sales!A2:A5, MATCH(MIN(sales!G2:G5), sales!G2:G5, 0))',
                    '⚠️ Needs Support',
                  ],
                ],
              },
              cells: {
                default: { width: 120, height: 40 },
                1: { height: 25 },
                'A1:C1': {
                  style: {
                    backgroundColor: '#34495e',
                    color: 'white',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  },
                  alignItems: 'center',
                },
                'B2:B6': {
                  style: {
                    backgroundColor: '#d5f4e6',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  },
                  alignItems: 'center',
                  prevention: operations.Write,
                },
                'C2:C6': {
                  style: {
                    backgroundColor: '#fef9e7',
                    textAlign: 'center',
                  },
                  alignItems: 'center',
                  prevention: operations.Write,
                },
              },
            })}
            options={{
              sheetHeight: 200,
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

        {/* Trend Analysis */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
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
            🎯 Trend Analysis
          </h3>
          <GridSheet
            hub={hub}
            sheetName={sheetName3}
            initialCells={buildInitialCells({
              matrices: {
                A1: [
                  ['Trend Type', 'Count', 'Status'],
                  [
                    'Upward Trends',
                    '=COUNTIF(sales!H2:H5, "📈 Up")',
                    '=IF(B2>0, "📈 " & B2 & " products growing", "No growth")',
                  ],
                  [
                    'Stable Trends',
                    '=COUNTIF(sales!H2:H5, "➡️ Stable")',
                    '=IF(B3>0, "➡️ " & B3 & " products stable", "No stable")',
                  ],
                  [
                    'Downward Trends',
                    '=COUNTIF(sales!H2:H5, "📉 Down")',
                    '=IF(B4>0, "📉 " & B4 & " products declining", "No decline")',
                  ],
                ],
              },
              cells: {
                default: { width: 120, height: 40 },
                1: { height: 25 },
                'A1:C1': {
                  style: {
                    backgroundColor: '#3498db',
                    color: 'white',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '14px',
                  },
                  alignItems: 'center',
                },
                'B2:B4': {
                  style: {
                    backgroundColor: '#e8f5e8',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  },
                  alignItems: 'center',
                  prevention: operations.Write,
                },
                'C2:C4': {
                  style: {
                    backgroundColor: '#fff3cd',
                    textAlign: 'center',
                  },
                  alignItems: 'center',
                  prevention: operations.Write,
                },
              },
            })}
            options={{
              sheetHeight: 200,
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
              value={sheetName3}
              onChange={(e) => setSheetName3(e.target.value)}
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
