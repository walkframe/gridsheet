import React from "react";
import { ComponentStory } from "@storybook/react";
import { GridSheet, constructInitialCells, createTableRef, HistoryType } from "@gridsheet/react-core";

export default {
  title: "Table operations",
};

type Props = {
  x: number;
  y: number;
  value: string;
};

const Sheet = ({ x, y, value }: Props) => {
  const tableRef = createTableRef();
  React.useEffect(() => {
    if (tableRef?.current == null) {
      return;
    }
    const { table, dispatch } = tableRef.current;
    dispatch(table.write({ point: { y, x }, value }));
  }, [x, y, value, tableRef]);

  return (
    <>
      <GridSheet
        tableRef={tableRef}
        initialCells={constructInitialCells({
          cells: {},
          ensured: {
            numRows: 50,
            numCols: 50,
          },
        })}
      />
    </>
  );
};

const Template: ComponentStory<typeof Sheet> = (args) => <Sheet {...args} />;

export const Write = Template.bind({});
Write.args = { y: 1, x: 1, value: "something" };
