import React from "react";
import styled from "styled-components";

import {
  DataType,
  WidthType,
  HeightType,
} from "../types";

interface Props {
  value: string;
  selecting: boolean;
};

const CellLayout = styled.div`
  overflow: hidden;
  font-size: 13px;
  textarea {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    border: none;
    background-color: transparent;
    resize: none;
    box-sizing: border-box;
    overflow: hidden;
    caret-color: transparent;

    &:read-only {
      cursor: auto;
    }
    &.editing {
      caret-color: #000000;
    }
  }
`;

export const Cell: React.FC<Props> = ({ value, selecting }) => {
  const [editing, setEditing] = React.useState(false);
  return (<CellLayout 
    className="cell"
    onDoubleClick={(e) => setEditing(true)}
    onClick={(e) => {
      setEditing(true);
    }}
  >
    {!selecting ? value : (<textarea
      autoFocus
      onFocus={(e) => {
        e.currentTarget.value = "";
        e.currentTarget.value = value;
      }}
      onKeyUp={(e) => {
        if (e.keyCode === 27) { // escape
          setEditing(false);
          return;
        }
        e.currentTarget.classList.add("editing")
      }}
      onBlur={(e) => setEditing(false)}
    >{value}</textarea>)}
  </CellLayout>);
};

