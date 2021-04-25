import styled from "styled-components";

export const GridSheetLayout = styled.div`
  overflow: hidden;
  position: relative;

  font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN",
    "Hiragino Sans", Meiryo, sans-serif;

  &.light {
    border: solid 1px #aaaaaa;
    background-color: #f7f7f7;
    color: #000000;
    .gs-editor {
      &.gs-editing {
        textarea {
          background-color: #f5f5f5;
          color: #111111;
          caret-color: #000000;
        }
      }
    }
    .gs-cell {
      border-top: solid 1px #bbbbbb;
      border-left: solid 1px #bbbbbb;

      &.gs-cell-top-end {
        border-top: none;
      }
      &.gs-cell-left-end {
        border-left: none;
      }
      &.gs-cell-lower-end {
        border-bottom: solid 1px #bbbbbb;
      }
      &.gs-cell-right-end {
        border-right: solid 1px #bbbbbb;
      }
    }
    .gs-header {
      background-color: #eeeeee;
      color: #666666;
      &.gs-selecting {
        background-color: #dddddd;
      }
      &.gs-choosing {
        background-color: #bbbbbb;
      }
      &.gs-header-selecting {
        background-color: #555555;
        color: #ffffff;
      }
      border-color: #bbbbbb;
      border-style: solid;
      border-width: 0;
    }
  }

  &.dark {
    background-color: #4a4a4a;
    color: #eeeeee;

    .gs-editor {
      &.gs-editing {
        textarea {
          background-color: #4f4f4f;
          color: #dddddd;
          caret-color: #dddddd;
        }
      }
    }
    .gs-cell {
      border-top: solid 1px #666666;
      border-left: solid 1px #666666;

      &.gs-cell-top-end {
        border-top: none;
      }
      &.gs-cell-left-end {
        border-left: none;
      }
      &.gs-cell-lower-end {
        border-bottom: solid 1px #666666;
      }
      &.gs-cell-right-end {
        border-right: solid 1px #666666;
      }
    }
    .gs-header {
      background-color: #666666;
      color: #eeeeee;
      &.gs-selecting {
        background-color: #777777;
      }
      &.gs-choosing {
        background-color: #999999;
      }
      &.gs-header-selecting {
        background-color: #bbbbbb;
        color: #444444;
      }
      border-color: #888888;
      border-style: solid;
      border-width: 0;
    }
  }
`;
