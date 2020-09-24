import React from "react";
import styled from "styled-components";

interface Props {
  value: string;
  setValue: (value: string) => void;
  select: (deltaY: number, deltaX: number) => void;
  selecting: boolean;
};

const CellLayout = styled.div`
  overflow: hidden;
  font-size: 13px;
  text-indent: 3px;
  letter-spacing: 1px;
  cursor: cell;

  .unselected {
    padding: 2px;
  }

  textarea {
    width: 100%;
    height: 100%;
    position: absolute;
    font-size: 13px;
    letter-spacing: 1px;
    top: 0;
    left: 0;
    border: none;
    background-color: transparent;
    resize: none;
    box-sizing: border-box;
    overflow: hidden;
    caret-color: transparent;
    text-indent: 3px;
    z-index: 1;
    &.editing {
      caret-color: #000000;
      background-color: #ffffff;
    }
    &:focus {
      outline: solid 2px #0077ff;
    }
  }
`;

export const Cell: React.FC<Props> = ({ value, setValue, select, selecting }) => {
  return (<CellLayout 
    className="cell"
  ><div className="unselected">{value}</div>
    {!selecting ? null : (<textarea
      autoFocus
      onDoubleClick={(e) => {
        const input = e.currentTarget;
        if (!input.classList.contains("editing")) {
          input.value = value;
          input.classList.add("editing");
        }
      }}
      onKeyDown={(e) => {
        switch (e.keyCode) {
          case 9: // TAB
            if (e.currentTarget.classList.contains("editing")) {
              setValue(e.currentTarget.value);
            }
            e.currentTarget.blur();
            select(0, 1);
            return;
          case 13: // ENTER
            if (e.currentTarget.classList.contains("editing")) {
              setValue(e.currentTarget.value);
            }
            e.currentTarget.blur();
            select(1, 0);
            return;
          case 27: // ESCAPE
            e.currentTarget.value = value;
            e.currentTarget.blur();
            return;
        };
        e.currentTarget.classList.add("editing")
      }}
      onBlur={(e) => {
        if (e.currentTarget.classList.contains("editing")) {
          setValue(e.target.value);
        }
      }}
    ></textarea>)}
  </CellLayout>);
};

