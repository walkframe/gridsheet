import React from "react";
import { GridSheet } from "../../../src";
import { constructInitialCells } from "../../../src/lib/structs";
import { createTableRef } from "../../../src/components/Tabular";
import {HistoryType} from "../../../src/types";

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
            initialCells={constructInitialCells({
              matrices: {
                A1: [
                  [1, 2, 3, 4, 5],
                  [6, 7, 8, 9, 10],
                ],
              },
              cells: {
                default: {
                  width: 50,
                },
                E: {
                  style: { backgroundColor: "#ddf" },
                }
              },
              ensured: {
                numRows: 50,
                numCols: 50,
              },
            })}
            options={{
              sheetWidth: 300,
              sheetHeight: 300,
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
          <textarea 
            id="diff"
            style={{width: '300px', height: '100px'}}
            value={JSON.stringify(diff, null, 2)}
          ></textarea>
        </div>
        <ul className="histories">
          {histories.map((history, i) => (
            <li key={i} style={{display: 'flex', lineHeight: "20px", borderBottom: 'solid 1px #777', marginBottom: '10px'}}>
              <div style={{color: '#09a'}}>[{history.operation}]</div>
              <pre style={{margin: 0}}>{(() => {
                if (history.operation === "UPDATE") {
                  return JSON.stringify(
                    tableRef.current?.table!.getAddressesByIds(
                      history.diffAfter
                    )
                  );
                }
              })()}</pre>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
