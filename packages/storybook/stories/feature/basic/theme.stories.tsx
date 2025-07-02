import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { buildInitialCells, GridSheet, ModeType } from '@gridsheet/react-core';

type Props = {
  mode: ModeType;
};

const Sheet = ({ mode }: Props) => {
  return (
    <>
      <GridSheet
        initialCells={buildInitialCells({
          ensured: { numRows: 10, numCols: 10 },
        })}
        options={{ mode }}
      />
      
      {/* How it works - Markdown */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          color: '#2c3e50', 
          margin: '0 0 15px 0',
          fontSize: '18px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📖 How it works
        </h3>
        <div style={{
          lineHeight: '1.6',
          color: '#374151'
        }}>
          <ReactMarkdown>{HOW_IT_WORKS}</ReactMarkdown>
        </div>
      </div>
    </>
  );
};

const meta: Meta<typeof Sheet> = {
  title: 'Feature/Basic/Theme',
  component: Sheet,
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases the dark theme mode of the GridSheet component.',
  'The grid automatically applies dark styling with appropriate contrast for better visibility in low-light environments.',
].join('\n\n');

const HOW_IT_WORKS = [
  'This is useful for applications that need to support multiple theme preferences or provide a modern dark interface option.',
  '1. The mode prop controls the theme appearance of the grid.',
  '2. Dark theme provides better contrast and reduced eye strain in low-light conditions.',
  '3. Theme switching can be done dynamically by changing the mode prop.',
  '4. The grid maintains all functionality while adapting its visual appearance.',
].join('\n\n');

export const Dark: StoryObj<typeof Sheet> = {
  args: { mode: 'dark' },
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
