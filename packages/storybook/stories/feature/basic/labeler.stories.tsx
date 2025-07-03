import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { GridSheet, buildInitialCells, useHub } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Basic/Labeler',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'In this example, we have two labelers: "hiragana" and "katakana".',
  'The "hiragana" labeler converts numbers to corresponding hiragana characters, while the "katakana" labeler converts numbers to katakana characters.',
  'The cells in columns A to E use the "hiragana" labeler, while the cells in row 1 use the "katakana" labeler.',
].join('\n\n');

const HOW_IT_WORKS = [
  'The values in the cells are dynamically calculated, and the labelers update accordingly as the values change.',
  'This feature is useful for displaying localized or formatted data in a user-friendly manner.',
  '1. Define labelers in the `useHub` hook.',
  '2. Use the labelers in the `labeler` property of the cell definitions.',
  '3. The labelers will automatically apply to the cells based on their values.',
].join('\n\n');

export const Labeler: StoryObj = {
  render: () => {
    const hub = useHub({
      labelers: {
        hiragana: (n) => 'あいうえおかきくけこ'.slice(n - 1, n),
        katakana: (n) => 'アイウエオカキクケコ'.slice(n - 1, n),
      },
    });

    return (
      <>
        <GridSheet
          hub={hub}
          initialCells={buildInitialCells({
            cells: {
              A: { labeler: 'hiragana' },
              B: { labeler: 'hiragana' },
              C: { labeler: 'hiragana' },
              D: { labeler: 'hiragana' },
              E: { labeler: 'hiragana' },
              1: { labeler: 'katakana' },
              2: { labeler: 'katakana' },
              3: { labeler: 'katakana' },
              4: { labeler: 'katakana' },
              5: { labeler: 'katakana' },
              A1: { value: '=SUM($B1:C$1)' },
              B1: { value: 1 },
              C1: { value: 100 },
              D1: { value: 200 },
              A2: { value: '=$B2' },
              B2: { value: 2 },
            },
            ensured: { numRows: 7, numCols: 10 },
          })}
        />

        {/* How it works - Markdown */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '20px',
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
            📖 How it works
          </h3>
          <div
            style={{
              lineHeight: '1.6',
              color: '#374151',
            }}
          >
            <ReactMarkdown>{HOW_IT_WORKS}</ReactMarkdown>
          </div>
        </div>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
