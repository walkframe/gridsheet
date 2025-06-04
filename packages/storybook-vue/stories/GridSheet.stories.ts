import type { Meta, StoryObj } from '@storybook/vue3';
import { CellsByAddressType, GridSheet, OptionsType } from '@gridsheet/vue-core';

const meta = {
  title: 'Components/GridSheet',
  component: GridSheet,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GridSheet>;

export default meta;
type Story = StoryObj<typeof GridSheet>;

export const Basic: Story = {
  render: () => ({
    components: { GridSheet },
    data: () => {
      const initialCells: CellsByAddressType = {
        A1: { value: 'Hello' },
        B1: { value: 'World', style: { backgroundColor: '#448888'} },
        A2: { value: 123 },
        B2: { value: 456 },
        C10: { value: '=SUM(A2:B2)' },

      };
      const options: OptionsType = {
        mode: 'dark',
      };
      return {
        initialCells,
        options,
      };
    },
    template: `
      <GridSheet
        :initialCells="initialCells"
        :options="options"
      />
    `
  }),
};
