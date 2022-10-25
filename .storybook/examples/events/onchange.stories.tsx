import React from "react";
import { GridSheet, HistoryType } from "../../../src";
import { generateInitial } from "../../../src/api/structs";
import { createTableRef } from "../../../src/components/GridTable";

export default {
  title: "Table operations",
};

export const SheetOnChange = () => {
  const [diff, setDiff] = React.useState<Record<string, any>>({});
  const [histories, setHistories] = React.useState<HistoryType[]>([]);
  const tableRef = createTableRef();

  return (
    <>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <GridSheet
            tableRef={tableRef}
            initial={generateInitial({
              matrixes: {
                A1: [
                  [1, 2, 3, 4, 5],
                  [6, 7, 8, 9, 10],
                ],
              },
              cells: {},
              ensured: {
                numRows: 50,
                numCols: 50,
              },
            })}
            options={{
              sheetWidth: 500,
              onChange: (table, positions) => {
                setDiff(
                  table.getObjectFlatten({
                    filter: (cell) =>
                      !!cell?.changedAt &&
                      cell.changedAt > table.lastChangedAt!,
                  })
                );
                const histories = table.getHistories();
                setHistories(histories);
                const h = histories[histories.length - 1];
                if (h?.operation === "UPDATE") {
                  console.log(
                    "histories",
                    table.getAddressesByIds(h.diffAfter)
                  );
                }
              },
            }}
          />
          <div>Diff:</div>
          <pre id="diff">{JSON.stringify(diff)}</pre>
        </div>
        <ul className="histories">
          {histories.map((history, i) => (
            <li key={i}>
              [{history.operation}]
              {(() => {
                if (history.operation === "UPDATE") {
                  return JSON.stringify(
                    tableRef.current?.table!.getAddressesByIds(
                      history.diffAfter
                    )
                  );
                }
              })()}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
