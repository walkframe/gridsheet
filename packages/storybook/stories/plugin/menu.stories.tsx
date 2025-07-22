import type { Meta, StoryObj } from '@storybook/react';
import { CellsByAddressType, buildInitialCells, GridSheet, useHub } from '@gridsheet/react-core';
import { RightMenu as RightMenuComponent } from '@gridsheet/react-right-menu';

const meta: Meta = {
  title: 'Plugin/Menu',
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo showcases the RightMenu plugin for GridSheet.',
  'The plugin adds a context menu that appears when right-clicking on the grid.',
  'It demonstrates how plugins can extend GridSheet functionality with custom UI components.',
].join('\n\n');

const RightMenuSheet = () => {
  const hub = useHub({
    labelers: {
      raw: (n) => String(n),
    },
  });

  return (
    <div>
      <RightMenuComponent>
        <GridSheet
          hub={hub}
          options={{
            mode: 'light',
            sheetResize: 'both',
            editingOnEnter: true,
          }}
          initialCells={buildInitialCells({
            ensured: { numRows: 5, numCols: 5 },
          })}
        />
      </RightMenuComponent>
      <br />

      <RightMenuComponent>
        <GridSheet
          hub={hub}
          options={{
            mode: 'dark',
            sheetResize: 'both',
            editingOnEnter: true,
          }}
          initialCells={buildInitialCells({
            cells: {
              default: { labeler: 'raw' },
              A1: {
                value: 'A1',
              },
              B1: {
                value: 'B1',
              },
              B2: {
                value: 2,
              },
              C3: {
                value: 3,
              },
            },
            ensured: { numRows: 5, numCols: 5 },
          })}
        />
      </RightMenuComponent>
    </div>
  );
};

export const RightMenu: StoryObj = {
  render: () => <RightMenuSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
