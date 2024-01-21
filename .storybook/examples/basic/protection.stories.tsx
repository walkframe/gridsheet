import React from "react";
import { ComponentStory } from "@storybook/react";
import { generateInitial, GridSheet } from "../../../src";
import { AddCol, Prevention, ReadOnly } from "../../../src/lib/protection";

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
        }}
        initial={generateInitial({
          cells: {
            default: { width: defaultWidth },
            4: {
              protection: Prevention.DeleteRow,
            },
            1: {
              protection: Prevention.Resize,
            },
            "A:B": {
              protection: AddCol | Prevention.DeleteCol,
            },
            A: {
              protection: Prevention.Resize,
            },
            B: {
              style: { backgroundColor: "#eeeeee" },
            },
            B2: {
              value: "b2",
              protection: ReadOnly,
            }
          },
          ensured: { numRows, numCols },
        })}
      />
    </>
  );
};

const Template: ComponentStory<typeof Sheet> = (args) => <Sheet {...args} />;

export const Protection = Template.bind({});
Protection.args = { numRows: 1000, numCols: 100, defaultWidth: 50 };
