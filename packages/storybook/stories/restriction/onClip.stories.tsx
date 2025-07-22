import React, { type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, Policy, buildInitialCells, Renderer, useHub } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Restriction/OnClip',
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo demonstrates how to implement data masking and privacy protection using policies.',
  'When users copy data from the grid, sensitive information is automatically masked with asterisks (*).',
  'The renderer also displays partially masked values in the grid itself, showing only the first character followed by asterisks.',

  '## How it works',
  'This is useful for applications that need to protect sensitive data while still allowing users to work with the information.',
  '1. The mask policy intercepts clipboard operations and replaces data with asterisks.',
  '2. The mask renderer displays partially masked values in the grid interface.',
  '3. This provides visual feedback while maintaining data security.',
  '4. The masking is applied both during display and clipboard operations.',
].join('\n\n');

const OnClipComponent: React.FC = () => {
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
        string({ value }) {
          if (value == null) {
            return '';
          }
          return `${value.substring(0, 1)}${'*'.repeat(value.substring(1).length)}`;
        },
      },
    ],
  });
  const hub = useHub({
    policies: {
      mask: maskPolicy,
    },
    renderers: {
      mask: maskRenderer,
    },
  });

  return (
    <GridSheet
      hub={hub}
      options={{
        showFormulaBar: false,
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

export const OnClip: StoryObj = {
  render: () => <OnClipComponent />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
