import React from "react";
import { ComponentStory } from "@storybook/react";
import { generateInitial, GridSheet, SheetProvider } from "../../../src";

export default {
  title: "Sheets",
};

type Props = {
  numRows: number;
  numCols: number;
  defaultWidth: number;
};

const Sheets = ({ numRows, numCols, defaultWidth }: Props) => {
  const [sheet1, setSheet1] = React.useState("Sheet1");
  const [sheet2, setSheet2] = React.useState("Sheet2");
  return (
    <SheetProvider>
      <GridSheet
        sheetName={sheet1}
        options={{
          headerHeight: 50,
          headerWidth: 150,
          labelers: {
            raw: (n) => String(n),
          },
          sheetResize: "both",
        }}
        initial={generateInitial({
          cells: {
            default: { width: defaultWidth, labeler: "raw" },
            B2: {
              value: "b2",
            }
          },
          ensured: { numRows, numCols },
        })}
      />
      <input value={sheet1} onChange={(e) => setSheet1(e.target.value)} />
      <hr />
      <GridSheet
        sheetName={sheet2}
        options={{
          headerHeight: 50,
          headerWidth: 150,
          sheetResize: "both",
        }}
        initial={generateInitial({
          cells: {
          },
          ensured: { numRows, numCols },
        })}
      />
      <input value={sheet2} onChange={(e) => setSheet2(e.target.value)} />
    </SheetProvider>
  );
};

const Template: ComponentStory<typeof Sheets> = (args) => <Sheets {...args} />;

export const MultipleSheet = Template.bind({});
MultipleSheet.args = { numRows: 5, numCols: 3, defaultWidth: 100 };
