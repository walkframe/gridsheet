import React from "react";
import styled from "styled-components";

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

interface Props {
  value: string;
  setValue: (value: string) => void;
  select: (deltaY: number, deltaX: number) => void;
  selecting: boolean;
  copy: (copying: boolean) => void;
  cut: (cutting: boolean) => void;
  paste: () => void;
};

export const Cell: React.FC<Props> = (props) => {
  const { value, setValue, select, selecting, copy } = props;
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
      onKeyDown={handleKeyDown(props)}
      onBlur={(e) => {
        if (e.currentTarget.classList.contains("editing")) {
          setValue(e.target.value);
        }
      }}
    ></textarea>)}
  </CellLayout>);
};

const handleKeyDown = (props: Props) => {
  const { value, setValue, select, copy, paste } = props;
  return (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    console.debug(e.key, "shift:", e.shiftKey, "ctrl:", e.ctrlKey, "alt:", e.altKey, "meta:", e.metaKey);

    switch (e.key) {
      case "Tab": // TAB
        e.preventDefault();
        if (e.currentTarget.classList.contains("editing")) {
          setValue(e.currentTarget.value);
        }
        select(0, e.shiftKey ? -1 : 1);
        return false;
      case "Enter": // ENTER
        if (e.currentTarget.classList.contains("editing")) {
          setValue(e.currentTarget.value);
        }
        select(e.shiftKey ? -1 : 1, 0);
        return false;
      case "Shift": // SHIFT
        return false;
      case "Control": // CTRL
        return false;
      case "Alt": // OPTION
        return false;
      case "Meta": // COMMAND
        return false;
      case "NumLock": // NUMLOCK
        return false;
      case "Escape": // ESCAPE
        copy(false);
        e.currentTarget.value = value;
        // e.currentTarget.blur();
        return false;
      case "ArrowLeft": // LEFT
        select(0, -1);
        return false;
      case "ArrowUp": // UP
        select(-1, 0);
        return false;
      case "ArrowRight": // RIGHT
        select(0, 1);
        return false;
      case "ArrowDown": // DOWN
        select(1, 0);
        return false;

      case "c": // C
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          copy(true);
          return false;
        }
      case "v": // V
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          paste();
          return false;
        }
    };
    if (e.ctrlKey || e.metaKey) {
      return false;
    }
    e.currentTarget.classList.add("editing");
  }
};
