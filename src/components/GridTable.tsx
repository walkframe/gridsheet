import React from "react";
import { useDispatch, useSelector } from 'react-redux';

import { Cell } from "./Cell";
import { HorizontalHeaderCell } from "./HorizontalHeaderCell";
import { VerticalHeaderCell } from "./VerticalHeaderCell";

import {
  makeSequence,
} from "../api/arrays";

import {
  choose,
  select,
} from "../store/inside";

import {
  OutsideState,
} from "../store/outside"
import {
  GridTableLayout,
} from "./styles/GridTableLayout";

import { RootState } from "../store";

type Props = {
  clipboardRef: React.RefObject<HTMLTextAreaElement>;
};

export const GridTable: React.FC<Props> = ({ clipboardRef }) => {
  const dispatch = useDispatch();
  const {
    numRows,
    numCols,
  } = useSelector<RootState, OutsideState>(state => state["outside"]);

  return (<GridTableLayout>
    <table>
      <thead>
        <tr>
          <th className="vertical horizontal" onClick={(e) => {
            dispatch(choose([-1, -1]));
            setTimeout(() => {
              dispatch(choose([0, 0]));
              dispatch(select([0, 0, numRows - 1, numCols - 1]));
            }, 100);
          }} />
          {makeSequence(0, numCols).map((x) => {
            return (<HorizontalHeaderCell
              key={x}
              x={x}
            />);
          })
        }
        </tr>
      </thead>
      <tbody>{makeSequence(0, numRows).map((y) => {
        return (<tr key={y}>
          <VerticalHeaderCell
            key={y}
            y={y}
          />
          {makeSequence(0, numCols).map((x) => {
            return (<Cell
                key={`${y}-${x}`}
                y={y}
                x={x}
                clipboardRef={clipboardRef}
            />);
          })}
        </tr>);
      })
      }</tbody>
    </table>
  </GridTableLayout>);
};
