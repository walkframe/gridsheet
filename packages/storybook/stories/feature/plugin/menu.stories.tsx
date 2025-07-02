import type { Meta, StoryObj } from '@storybook/react';
import { CellsByAddressType, buildInitialCells, GridSheet, useHub } from '@gridsheet/react-core';
import { RightMenu as RightMenuComponent } from '@gridsheet/react-right-menu';

const meta: Meta = {
  title: 'Feature/Plugin/Menu',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo showcases the RightMenu plugin for GridSheet.',
  'The plugin adds a context menu that appears when right-clicking on the grid.',
  'It demonstrates how plugins can extend GridSheet functionality with custom UI components.',
  
  '## How it works',
  'The demo shows both light and dark theme versions of the menu plugin.',
  '1. Plugins allow you to extend the core functionality with custom components.',
  '2. The RightMenu plugin provides context-sensitive menu options.',
  '3. Plugins can be wrapped around GridSheet components.',
  '4. This enhances the user experience with additional interactive features.',

].join('\n\n');

export const RightMenu: StoryObj = {
  render: () => {
    const hub = useHub({
      labelers: {
        raw: (n) => String(n),
      }
    });

    return (
      <div>
        <RightMenuComponent>
          <GridSheet
            hub={hub}
            options={{
              mode: 'light',
              headerHeight: 50,
              headerWidth: 100,

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
              headerWidth: 100,
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
  },
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
