import React from "react";
import { ComponentStory } from "@storybook/react";
import { constructInitialCells, GridSheet } from "../../../src";

export default {
  title: "Basic",
};

type Props = {
  numRows: number;
  numCols: number;
  defaultWidth: number;
};

const Sheet = ({ numRows, numCols, defaultWidth }: Props) => {
  return (
    <>
      <GridSheet
        options={{
          headerHeight: 50,
          headerWidth: 150,
          labelers: {
            raw: (n) => String(n),
          },
          sheetResize: "both",
        }}
        initialCells={constructInitialCells({
          cells: {
            default: { width: defaultWidth, labeler: "raw" },
            A1: {
              value: "A1",
            },
            B2: {
              value: "b2",
            }
          },
          ensured: { numRows, numCols },
        })}
      />
    </>
  );
};

const Template: ComponentStory<typeof Sheet> = (args) => <Sheet {...args} />;

export const Large = Template.bind({});
Large.args = { numRows: 1000, numCols: 100, defaultWidth: 50 };

export const Small = Template.bind({});
Small.args = { numRows: 5, numCols: 3, defaultWidth: 100 };
