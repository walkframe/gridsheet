import React from "react";
import styled from "styled-components";

const CellLayout = styled.div`
  overflow: hidden;
  font-size: 13px;
  letter-spacing: 1px;
  white-space: pre;
  line-height: 20px;
  cursor: auto;

  .unselected {
    padding: 2px;
  }

  textarea {
    width: 100%;
    height: 100%;
    position: absolute;
    font-size: 13px;
    line-height: 20px;
    letter-spacing: 1px;
    top: 0;
    left: 0;
    border: none;
    background-color: transparent;
    resize: none;
    box-sizing: border-box;
    overflow: hidden;
    caret-color: transparent;
    z-index: 1;
    cursor: default;
    &.editing {
      caret-color: #000000;
      background-color: #ffffff;
      cursor: text;
    }
    &:focus {
      outline: solid 2px #0077ff;
    }
  }
`;

interface Props {
  value: string;
  x: number;
  y: number;
  setValue: (value: string) => void;
  select: (nextY: number, nextX: number, breaking: boolean) => void;
  drag: (deltaY: number, deltaX: number) => void;
  selecting: boolean;
  copy: (copying: boolean, cutting: boolean) => void;
  paste: () => void;
  clear: () => void;
  blur: () => void;
};

export const Cell: React.FC<Props> = (props) => {
  const { value, setValue, select, selecting, blur } = props;
  const [editing, setEditing] = React.useState(false);
  return (<CellLayout 
    className="cell"
  ><div className="unselected">{value}</div>
    {!selecting ? null : (<textarea
      autoFocus
      className={editing ? "editing" : ""}
      onDoubleClick={(e) => {
        const input = e.currentTarget;
        if (!editing) {
          input.value = value;
          setEditing(true);
        }
      }}
      onKeyDown={handleKeyDown(props, editing, setEditing)}
      onBlur={(e) => {
        if (editing) {
          setValue(e.target.value);
        }
        setEditing(false);
        blur();
      }}
    ></textarea>)}
  </CellLayout>);
};

const handleKeyDown = (props: Props, editing: boolean, setEditing: (editing: boolean) => void) => {
  const { value, x, y, setValue, select, drag, copy, paste, clear } = props;
  return (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const input = e.currentTarget;
    console.debug(e.key, "shift:", e.shiftKey, "ctrl:", e.ctrlKey, "alt:", e.altKey, "meta:", e.metaKey);

    switch (e.key) {
      case "Tab": // TAB
        e.preventDefault();
        if (editing) {
          setValue(e.currentTarget.value);
        }
        select(y, e.shiftKey ? x - 1 : x + 1, false);
        setEditing(false);
        return false;
      case "Enter": // ENTER
        if (e.altKey) {
          input.value = `${input.value}\n`;
          input.style.height = `${input.clientHeight + 20}px`;
        } else {
          if (editing) {
            setValue(e.currentTarget.value);
          }
          select(e.shiftKey ? y - 1 : y + 1, x, true);
          setEditing(false);
          return false;
        }
      case "Backspace": // BACKSPACE
        if (!editing) {
          clear();
        }
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
        copy(false, false);
        setEditing(false);
        input.value = value;
        // e.currentTarget.blur();
        return false;
      case "ArrowLeft": // LEFT
        if (!editing) {
          e.shiftKey ? drag(0, -1) : select(y, x - 1, true);
          return false;
        }
      case "ArrowUp": // UP
        if (!editing) {
          e.shiftKey ? drag(-1, 0) : select(y - 1, x, true);
          return false;
        }
      case "ArrowRight": // RIGHT
        if (!editing) {
          e.shiftKey ? drag(0, 1) : select(y, x + 1, true);
          return false;
        }
      case "ArrowDown": // DOWN
        if (!editing) {
          e.shiftKey ? drag(1, 0) : select(y + 1, x, true);
          return false;
        }

      case "c": // C
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            e.preventDefault();
            copy(true, false);
            return false;
          }
        }
      case "x": // X
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            e.preventDefault();
            copy(true, true);
            return false;
          }
        }
      case "v": // V
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            e.preventDefault();
            paste();
            return false;
          }
        }
    };
    if (e.ctrlKey || e.metaKey) {
      return false;
    }
    setEditing(true);
  }
};
