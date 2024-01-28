import React from "react";
import { ComponentStory } from "@storybook/react";
import { generateInitial, GridSheet } from "../../../src";
import * as protection from "../../../src/lib/protection";

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
              protection: protection.DeleteRow,
            },
            1: {
              protection: protection.Resize,
              style: { backgroundColor: "#eeeeee" },
            },
            "A:B": {
              protection: protection.AddCol | protection.DeleteCol,
              style: { backgroundColor: "#dddddd" },
            },
            A: {
              protection: protection.Resize,
              style: { backgroundColor: "#eeeeee" },
            },
            C: {
              style: {backgroundColor: "#ffffff"}
            },
            B2: {
              value: "READONLY",
              protection: protection.ReadOnly,
              style: { backgroundColor: "#aaaaaa" },
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
Protection.args = { numRows: 50, numCols: 20, defaultWidth: 50 };
