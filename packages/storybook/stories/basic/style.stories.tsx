import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Basic/Style',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases comprehensive styling capabilities in GridSheet.',
  'It demonstrates various CSS properties including fonts, colors, backgrounds, borders, spacing, and layout options.',
].join('\n\n');

const StyleSheet = () => {
  return (
    <div style={{ transform: 'translate(30px, 30px)' }}>
      <GridSheet
        initialCells={buildInitialCells({
          matrices: {
            A1: [
              ['a', 'b', 'c', 'd', 'e'],
              ['aa', 'bb', 'cc', 'dd', 'ee'],
              ['aaa', 'bbb', 'ccc', 'ddd', 'eee'],
              ['aaaa', 'bbbb', 'cccc', 'dddd', 'eeee'],
              ['aaaaa', 'bbbbb', 'ccccc', 'ddddd', 'eeeee'],
            ],
          },
          cells: {
            0: {
              width: 60,
              height: 60,
            },
            A: {},
            B: {
              style: {
                backgroundColor: '#eeeeee',
                fontSize: 30,
                color: '#fff',
                fontFamily: 'fantasy',
                letterSpacing: 20,
                lineHeight: '60px',
              },
              width: 200,
            },
            C: {
              style: { backgroundColor: '#dddddd', textDecoration: 'underline' },
            },
            D: {
              style: { backgroundColor: '#cccccc' },
            },
            E: {
              style: { backgroundColor: '#bbbbbb' },
            },
            1: {
              style: { color: '#333' },
            },
            2: {
              style: { color: '#F00' },
              height: 100,
              alignItems: 'center',
              justifyContent: 'center',
            },
            3: {
              style: { color: '#0C0' },
              height: 250,
            },
            4: {
              style: { color: '#00F' },
            },
            'B5:D6': {
              style: { backgroundColor: 'green' },
            },
            '20:22': {
              style: { backgroundColor: 'blue' },
            },
            E2: {
              style: {
                borderTop: 'dashed 3px orange',
                borderLeft: 'dashed 3px orange',
                borderBottom: 'dashed 3px orange',
                borderRight: 'dashed 3px orange',
              },
            },
            E5: {
              style: {
                backgroundColor: '#F0F',
              },
            },
            F6: {
              value: 'F6',
            },
          },
          ensured: { numRows: 50, numCols: 10 },
        })}
        options={{}}
      />
    </div>
  );
};

export const Style: StoryObj = {
  render: () => <StyleSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
