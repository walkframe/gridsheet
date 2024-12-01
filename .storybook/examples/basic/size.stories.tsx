import React from "react";
import { ComponentStory } from "@storybook/react";
import { CellsByAddressType, constructInitialCells, GridSheet } from "../../../src";
import { TimeDelta } from "../../../src/lib/time";

export default {
  title: "Basic",
};

type Props = {
  numRows: number;
  numCols: number;
  defaultWidth: number;
  initialCells?: CellsByAddressType,
};

const Sheet = ({ numRows, numCols, defaultWidth, initialCells }: Props) => {
  return (
    <>
      <GridSheet
        options={{
          // mode: "dark",
          headerHeight: 50,
          headerWidth: 150,
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
            A4: {
              value: new Date("2022-03-05T12:34:56+09:00")
            },
            B4: {
              value: TimeDelta.create(11, 11, 11),
            },
            C4: {
              value: "=A4+B4",
            },
            A5: {
              value: "=A4-13/24",
            },
            ...initialCells,
          },
          ensured: { numRows, numCols },
        })}
      />
    </>
  );
};

const Template: ComponentStory<typeof Sheet> = (args) => <Sheet {...args} />;

export const Small = Template.bind({});
Small.args = { numRows: 5, numCols: 3, defaultWidth: 100 };

export const Large = Template.bind({});
Large.args = { 
  numRows: 1000, numCols: 100, defaultWidth: 50,
  initialCells: {A500: {value: "aa"}, A1000: {value: "aaa"}, CV1000: {value: "aaaa"}},
};
