import React from "react";
import { ComponentStory } from "@storybook/react";
import { generateInitial, GridSheet, prevention } from "../../../src";

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
        initialCells={generateInitial({
          cells: {
            default: { width: defaultWidth },
            4: {
              prevention: prevention.DeleteRow,
            },
            1: {
              prevention: prevention.Resize,
              style: { backgroundColor: "#eeeeee" },
            },
            "A:B": {
              prevention: prevention.AddCol | prevention.DeleteCol,
              style: { backgroundColor: "#dddddd" },
            },
            A: {
              prevention: prevention.Resize,
              style: { backgroundColor: "#eeeeee" },
            },
            C: {
              style: {backgroundColor: "#ffffff"}
            },
            B2: {
              value: "READONLY",
              prevention: prevention.ReadOnly,
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

export const Prevention = Template.bind({});
Prevention.args = { numRows: 50, numCols: 20, defaultWidth: 50 };
