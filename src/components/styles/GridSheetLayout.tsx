import styled from "styled-components";

export const GridSheetLayout = styled.div`
  width: min-content;
  width: fit-content;
  font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN",
    "Hiragino Sans", Meiryo, sans-serif;

  &.light {
    border: solid 1px #aaaaaa;
    background-color: #f7f7f7;
    color: #000000;
    textarea {
      &.editing {
        background-color: #f5f5f5;
        color: #111111;
        caret-color: #000000;
      }
    }
    .cell {
      border-top: solid 1px #bbbbbb;
      border-left: solid 1px #bbbbbb;

      &.lower-end {
        border-bottom: solid 1px #bbbbbb;
      }
      &.right-end {
        border-right: solid 1px #bbbbbb;
      }
    }
    .header {
      background-color: #eeeeee;
      color: #666666;
      &.selecting {
        background-color: #dddddd;
      }
      &.choosing {
        background-color: #bbbbbb;
      }
      &.header-selecting {
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
    textarea {
      &.editing {
        background-color: #4f4f4f;
        color: #dddddd;
        caret-color: #dddddd;
      }
    }
    .cell {
      border-top: solid 1px #666666;
      border-left: solid 1px #666666;

      &.lower-end {
        border-bottom: solid 1px #666666;
      }
      &.right-end {
        border-right: solid 1px #666666;
      }
    }
    .header {
      background-color: #666666;
      color: #eeeeee;
      &.selecting {
        background-color: #777777;
      }
      &.choosing {
        background-color: #999999;
      }
      &.header-selecting {
        background-color: #bbbbbb;
        color: #444444;
      }
      border-color: #888888;
      border-style: solid;
      border-width: 0;
    }
  }
  .clipboard {
    width: 0;
    height: 0;
    padding: 0;
    margin: 0;
    color: transparent;
    background-color: transparent;
    position: absolute;
    top: -999999px;
    left: -999999px;
    margin-left: -9999px;
    margin-top: -9999px;
    z-index: -9999;
  }
`;
