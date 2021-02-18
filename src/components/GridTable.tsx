import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import { Context } from "./GridSheet";
import { Editor } from "./Editor";
import { Cell } from "./Cell";
import { HorizontalHeaderCell } from "./HorizontalHeaderCell";
import { VerticalHeaderCell } from "./VerticalHeaderCell";

import { n2a } from "../api/converters";

import { choose, select } from "../store/inside";

import { GridTableLayout } from "./styles/GridTableLayout";
import { RootState } from "../store";
import { AreaType, CellOptionType, InsideState, OutsideState } from "../types";

import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../constants";

type Props = {
  numRows: number;
  numCols: number;
};

export const GridTable: React.FC<Props> = ({ numRows, numCols }) => {
  const dispatch = useDispatch();

  const { cellsOption, sheetHeight, sheetWidth } = useSelector<
    RootState,
    InsideState
  >((state) => state["inside"]);

  const { headerHeight, headerWidth } = useSelector<RootState, OutsideState>(
    (state) => state["outside"]
  );

  const {
    gridRef,
    gridOuterRef,
    verticalHeadersRef,
    horizontalHeadersRef,
  } = React.useContext(Context);

  const defaultHeight = cellsOption.default?.height || DEFAULT_HEIGHT;
  const defaultWidth = cellsOption.default?.width || DEFAULT_WIDTH;

  const sheetInnerHeight = sheetHeight - headerHeight;
  const sheetInnerWidth = sheetWidth - headerWidth;

  return (
    <GridTableLayout>
      <div className="gs-table">
        <div className="gs-row">
          <div
            className="gs-col"
            onClick={() => {
              dispatch(choose([-1, -1]));
              setTimeout(() => {
                dispatch(choose([0, 0]));
                dispatch(select([0, 0, numRows - 1, numCols - 1]));
              }, 100);
            }}
          ></div>
          <div className="gs-col">
            <List
              ref={horizontalHeadersRef}
              itemCount={numCols || 0}
              itemSize={(index) =>
                cellsOption[n2a(index + 1)]?.width || defaultWidth
              }
              layout="horizontal"
              width={gridOuterRef.current?.clientWidth || sheetInnerWidth}
              height={headerHeight}
              style={{ overflow: "hidden" }}
            >
              {HorizontalHeaderCell}
            </List>
          </div>
        </div>
        <div className="gs-row">
          <div className="gs-col" style={{ verticalAlign: "top" }}>
            <List
              ref={verticalHeadersRef}
              itemCount={numRows || 0}
              itemSize={(index) =>
                cellsOption[index + 1]?.height || defaultHeight
              }
              height={gridOuterRef.current?.clientHeight || sheetInnerHeight}
              width={headerWidth}
              style={{ overflow: "hidden" }}
            >
              {VerticalHeaderCell}
            </List>
          </div>
          <div className="gs-col">
            <div className="cells-wrapper">
              <Editor />
              <Grid
                ref={gridRef}
                style={{ marginTop: -1, marginLeft: -1 }}
                outerRef={gridOuterRef}
                columnCount={numCols || 0}
                rowCount={numRows || 0}
                width={sheetWidth - headerWidth}
                height={sheetHeight - headerHeight}
                columnWidth={(index) =>
                  cellsOption[n2a(index + 1)]?.width || defaultWidth
                }
                rowHeight={(index) =>
                  cellsOption[index + 1]?.height || defaultHeight
                }
                onScroll={(e) => {
                  verticalHeadersRef.current?.scrollTo(e.scrollTop);
                  horizontalHeadersRef.current?.scrollTo(e.scrollLeft);
                }}
              >
                {Cell}
              </Grid>
            </div>
          </div>
        </div>
      </div>
    </GridTableLayout>
  );
};
