import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import { Cell } from "./Cell";
import { HorizontalHeaderCell } from "./HorizontalHeaderCell";
import { VerticalHeaderCell } from "./VerticalHeaderCell";

import { n2a } from "../api/converters";
import { makeSequence } from "../api/arrays";

import { choose, select } from "../store/inside";

import { GridTableLayout } from "./styles/GridTableLayout";
import { RootState } from "../store";
import { AreaType, CellOptionType, InsideState, OutsideState } from "../types";

const gridRef = React.createRef<HTMLDivElement>();
const verticalHeadersRef = React.createRef<List>();
const horizontalHeadersRef = React.createRef<List>();

type Props = {
  clipboardRef: React.RefObject<HTMLTextAreaElement>;
  numRows: number;
  numCols: number;
};

export const GridTable: React.FC<Props> = ({
  clipboardRef,
  numRows,
  numCols,
}) => {
  const dispatch = useDispatch();

  const {
    matrix,
    cellsOption,
    editingCell,
    choosing,
    selectingZone,
    horizontalHeadersSelecting,
    verticalHeadersSelecting,
    copyingZone,
    cutting,
  } = useSelector<RootState, InsideState>((state) => state["inside"]);

  const {
    defaultHeight,
    defaultWidth,
    headerHeight,
    headerWidth,
  } = useSelector<RootState, OutsideState>((state) => state["outside"]);

  return (
    <GridTableLayout>
      <table>
        <thead>
          <th></th>
          <th>
            <List
              ref={horizontalHeadersRef}
              itemCount={numCols || 0}
              itemSize={(index) =>
                parseInt(cellsOption[n2a(index + 1)]?.width || defaultWidth)
              }
              layout="horizontal"
              width={gridRef.current?.clientWidth || 0}
              height={parseInt(headerHeight, 10)}
              style={{ overflow: "hidden" }}
            >
              {HorizontalHeaderCell}
            </List>
          </th>
        </thead>
        <tbody>
          <th>
            <List
              ref={verticalHeadersRef}
              itemCount={numRows || 0}
              itemSize={(index) =>
                parseInt(cellsOption[index + 1]?.height || defaultHeight)
              }
              height={gridRef.current?.clientHeight || 0}
              width={parseInt(headerWidth, 10)}
              style={{ overflow: "hidden" }}
            >
              {VerticalHeaderCell}
            </List>
          </th>
          <td>
            <Grid
              outerRef={gridRef}
              columnCount={numCols || 0}
              rowCount={numRows || 0}
              width={1000}
              height={500}
              columnWidth={(index) =>
                parseInt(cellsOption[n2a(index + 1)]?.width || defaultWidth)
              }
              rowHeight={(index) =>
                parseInt(cellsOption[index + 1]?.height || defaultHeight)
              }
              onScroll={(e) => {
                //console.log(gridRef.current);
                verticalHeadersRef.current?.scrollTo(e.scrollTop);
                horizontalHeadersRef.current?.scrollTo(e.scrollLeft);
              }}
            >
              {Cell}
            </Grid>
          </td>
        </tbody>
      </table>
    </GridTableLayout>
  );
};
