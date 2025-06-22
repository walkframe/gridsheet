import React, { type CSSProperties } from 'react';
import {
  GridSheet,
  Policy,
  PolicyOption,
  PolicyMixinType,
  CellsByAddressType,
  buildInitialCells,
  TimeDelta,
  Renderer,
} from '@gridsheet/react-core';

export const OnClip = () => {
  const maskPolicy = new Policy({
    mixins: [
      {
        onClip({ point, table }) {
          const s = table.stringify({ point }) ?? '';
          return '*'.repeat(s.length);
        },
      },
    ],
  });
  const maskRenderer = new Renderer({
    mixins: [
      {
        string({ cell }) {
          const { value } = cell;
          if (value == null) {
            return '';
          }
          return `${value.substring(0, 1)}${'*'.repeat(value.substring(1).length)}`;
        },
      },
    ],
  });

  return (
    <GridSheet
      options={{
        showFormulaBar: false,
        policies: {
          mask: maskPolicy,
        },
        renderers: {
          mask: maskRenderer,
        },
      }}
      initialCells={buildInitialCells({
        cells: {
          default: {
            policy: 'mask',
            renderer: 'mask',
            width: 150,
          },
          A1: { value: 'Hello' },
          B2: { value: 'Spread sheet' },
        },
        ensured: { numRows: 4, numCols: 3 },
      })}
    />
  );
};

export default {
  title: 'Policy',
  component: OnClip,
};
