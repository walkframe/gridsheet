import React from "react";
import { ComponentStory } from "@storybook/react";
import { constructInitialCells, GridSheet, SheetProvider } from "../../../src";

export default {
  title: "Basic",
};

type Props = {
  numRows: number;
  numCols: number;
  defaultWidth: number;
};

const Sheets = ({ numRows, numCols, defaultWidth }: Props) => {
  const [sheet1, setSheet1] = React.useState("Sheet1");
  const [sheet2, setSheet2] = React.useState("Sheet2");
  const [sheet3, setSheet3] = React.useState("Sheet 3");
  return (
    <SheetProvider>
      <GridSheet
        sheetName={sheet1}
        initialCells={constructInitialCells({
          cells: {
            default: { width: defaultWidth },
            A1: {
              value: "=Sheet2!A1+100"
            },
            A2: {
              value: "=SUM(Sheet2!B2:B4)"
            },
            A3: {
              value: "='Sheet 3'!A1 + 1000",
            },
            B1: {
              value: "=SUM('Invalid Sheet'!B2:B3)"
            },
            C1: {
              value: 333,
            },
            C2: {
              value: "=C1+100"
            }
          },
          ensured: { numRows, numCols },
        })}
      />
      <br />
      <input id="input1" value={sheet1} onChange={(e) => setSheet1(e.target.value)} />
      <hr />
      <GridSheet
        sheetName={sheet2}
        initialCells={constructInitialCells({
          cells: {
            A1: {value: 50},
            B1: {value: 999},
            B2: {value: 1200},
            B3: {value: 30},
          },
          ensured: { numRows, numCols },
        })}
        options={{
          sheetResize: "both",
        }}
      />
      <br />
      <input id="input2" value={sheet2} onChange={(e) => setSheet2(e.target.value)} />
      <hr />

      <GridSheet
        sheetName={sheet3}
        initialCells={constructInitialCells({
          cells: {
            A1: {value: 555},
          },
          ensured: { numRows, numCols },
        })}
      />
      <br />
      <input id="input3" value={sheet3} onChange={(e) => setSheet3(e.target.value)} />


    </SheetProvider>
  );
};

const Template: ComponentStory<typeof Sheets> = (args) => <Sheets {...args} />;

export const MultipleSheet = Template.bind({});
MultipleSheet.args = { numRows: 5, numCols: 3, defaultWidth: 100 };
