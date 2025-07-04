'use client';

import * as React from 'react';
import {
  GridSheet,
  useHub,
  makeBorder,
  buildInitialCellsFromOrigin,
  Renderer,
  RendererMixinType,
  Policy,
  PolicyMixinType,
  PolicyOption,
} from '@gridsheet/react-core';

// Star rating renderer
const StarRatingRendererMixin: RendererMixinType = {
  number({ value, sync, table, point }) {
    const stars = Math.round(value);

    const handleStarClick = (clickedStar: number) => {
      if (sync) {
        sync(table.write({ point, value: clickedStar.toString() }));
      }
    };

    return (
      <div
        style={{
          color: '#fbbf24',
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => (
          <span
            key={starIndex}
            onClick={() => handleStarClick(starIndex)}
            style={{
              cursor: 'pointer',
              transition: 'transform 0.1s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {starIndex <= stars ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  },
};

// Status Policy with dynamic styling
const StatusPolicy: PolicyMixinType = {
  getOptions: (): PolicyOption[] => [
    { value: 'Not Started', label: '⏸️ Not Started' },
    { value: 'In Progress', label: '🔄 In Progress' },
    { value: 'Pending', label: '⏳ Pending' },
    { value: 'Complete', label: '✅ Complete' },
  ],
  getDefault: (props: any) => {
    return { value: 'Not Started' };
  },
  validate: (props: any) => {
    const { patch } = props;
    if (patch?.value == null) {
      return patch;
    }

    const options = StatusPolicy.getOptions!();
    const validOption = options.find((option) => option.value === patch?.value);
    if (!validOption) {
      return { ...patch, value: 'Not Started' };
    }

    // Add dynamic styling based on status
    const getStatusStyle = (status: string) => {
      switch (status.toLowerCase()) {
        case 'complete':
          return {
            backgroundColor: '#dcfce7',
            color: '#166534',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 'bold',
          };
        case 'in progress':
          return {
            backgroundColor: '#fef3c7',
            color: '#92400e',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 'bold',
          };
        case 'pending':
          return {
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 'bold',
          };
        case 'not started':
          return {
            backgroundColor: '#f3f4f6',
            color: '#374151',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 'bold',
          };
        default:
          return {
            backgroundColor: '#f3f4f6',
            color: '#374151',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 'bold',
          };
      }
    };

    return {
      ...patch,
      style: getStatusStyle(patch.value),
    };
  },
};

export default function IntroductionExample() {
  const hub = useHub({
    renderers: {
      starRating: new Renderer({ mixins: [StarRatingRendererMixin] }),
    },
    policies: {
      status: new Policy({ mixins: [StatusPolicy] }),
    },
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <GridSheet
        hub={hub}
        sheetName="intro-example"
        initialCells={buildInitialCellsFromOrigin({
          matrix: [
            ['Task', 'Priority', 'Rate', 'Cost', 'Rating', 'Status'],
            ['Design UI', 'High', 50, '=C2*8', 4, 'Complete'],
            ['Backend API', 'High', 60, '=C3*12', 5, 'In Progress'],
            ['Database Setup', 'Medium', 45, '=C4*6', 3, 'Complete'],
            ['Testing', 'Medium', 55, '=C5*10', 4, 'In Progress'],
            ['Total:', '', '', '=SUM(D2:D5)', '=AVERAGE(E2:E5)', ''],
            ['Max:', '', '', '=MAX(D2:D5)', '=MAX(E2:E5)', ''],
          ],
          cells: {
            default: {
              width: 90,
              height: 35,
              style: {
                ...makeBorder({ all: '1px solid #d1d5db' }),
                fontSize: '12px',
                padding: '4px',
              },
            },
            'A1:F1': {
              style: {
                backgroundColor: '#1e40af',
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: '13px',
              },
            },
            A: {
              width: 110,
            },
            'A2:A5': {
              style: {
                backgroundColor: '#f8fafc',
                fontWeight: '600',
                fontSize: '12px',
              },
            },
            'A6:A7': {
              style: {
                backgroundColor: '#1f2937',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px',
              },
            },
            'A6:F6': {
              style: {
                borderTop: '3px double #d1d5db',
              },
            },
            'B2:B5': {
              style: {
                backgroundColor: '#fef3c7',
                textAlign: 'center',
                fontWeight: '500',
                fontSize: '11px',
              },
            },
            C: {
              width: 70,
            },
            'C2:C5': {
              style: {
                backgroundColor: '#dbeafe',
                textAlign: 'right',
                fontWeight: '500',
              },
            },
            D: {
              width: 70,
            },
            'D2:D5': {
              style: {
                backgroundColor: '#f0f9ff',
                fontWeight: 'bold',
                textAlign: 'right',
              },
            },
            'E2:E5': {
              width: 80,
              renderer: 'starRating',
              style: { backgroundColor: '#fef7ff' },
            },
            F: {
              width: 120,
            },
            'F2:F5': {
              policy: 'status',
            },
            F2: {
              style: {
                backgroundColor: '#dcfce7',
                color: '#166534',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 'bold',
              },
              policy: 'status',
            },
            F3: {
              style: {
                backgroundColor: '#fef3c7',
                color: '#92400e',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 'bold',
              },
              policy: 'status',
            },
            F4: {
              style: {
                backgroundColor: '#dcfce7',
                color: '#166534',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 'bold',
              },
              policy: 'status',
            },
            F5: {
              style: {
                backgroundColor: '#fef3c7',
                color: '#92400e',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 'bold',
              },
              policy: 'status',
            },
            'C6:D7': {
              style: {
                backgroundColor: '#f0f9ff',
                color: '#1f2937',
                fontWeight: 'bold',
                textAlign: 'right',
                fontSize: '12px',
              },
            },
            D6: {
              style: {
                backgroundColor: '#059669',
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'right',
                fontSize: '13px',
              },
            },
            E6: {
              style: {
                backgroundColor: '#f59e0b',
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: '13px',
              },
            },
            D7: {
              style: {
                backgroundColor: '#7c3aed',
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'right',
                fontSize: '13px',
              },
            },
            E7: {
              style: {
                backgroundColor: '#ef4444',
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: '13px',
              },
            },
          },
        })}
        options={{
          sheetHeight: 280,
          sheetWidth: 560,
          sheetResize: 'both',
        }}
      />
    </div>
  );
}
