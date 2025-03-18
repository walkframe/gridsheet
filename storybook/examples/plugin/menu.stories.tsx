import React from "react";
import { ComponentStory } from "@storybook/react";
import { CellsByAddressType, constructInitialCells, GridSheet } from "@gridsheet/react-core";

import { RightMenu as RightMenuComponent } from "@gridsheet/react-right-menu";

export default {
  title: "Plugin",
};

type Props = {
  numRows: number;
  numCols: number;
  defaultWidth: number;
  initialCells?: CellsByAddressType,
};

const Sheet = ({ numRows, numCols, defaultWidth, initialCells }: Props) => {
  return (
    <div>
    <RightMenuComponent>
      <GridSheet
        options={{
          mode: "dark",
          headerWidth: 100,
          labelers: {
            raw: (n) => String(n),
          },
          sheetResize: "both",
          editingOnEnter: true,
        }}
        initialCells={constructInitialCells({
          cells: {
            default: { width: defaultWidth, labeler: "raw" },
            A1: {
              value: "A1",
            },
            B1: {
              value: "B1",
            },
            B2: {
              value: 2,
            },
            C3: {
              value: 3,
            },
            ...initialCells,
          },
          ensured: { numRows, numCols },
        })}
      />
    </RightMenuComponent>
    <br />

    <RightMenuComponent>
      <GridSheet
        options={{
          mode: "light",
          headerHeight: 50,
          headerWidth: 100,
          labelers: {
            raw: (n) => String(n),
          },
          sheetResize: "both",
          editingOnEnter: true,
        }}
        initialCells={constructInitialCells({
          ensured: { numRows: 5, numCols: 5 },
        })}
      />
    </RightMenuComponent>

    </div>

  );
};

const Template: ComponentStory<typeof Sheet> = (args) => <Sheet {...args} />;

export const RightMenu = Template.bind({});
RightMenu.args = { 
  numRows: 100, numCols: 100, defaultWidth: 50,
};
