import styled from "styled-components";

export const GridSheetLayout = styled.div`
.gridsheet {
  overflow: hidden;
  position: relative;
  box-sizing: content-box;
  -webkit-box-sizing: content-box;
  -moz-box-sizing: content-box;

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
      &.gs-cell-bottom-end {
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
      &.gs-cell-bottom-end {
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
  
  .gs-tabular {
    display: table;
    table-layout: fixed;
    border-collapse: collapse;
  }
  .gs-tabular-row {
    display: table-row;
  }
  .gs-tabular-col {
    display: table-cell;
  }
  .gs-header {
    z-index: 3;
    font-size: 13px;
    font-weight: normal;
    box-sizing: border-box;
    vertical-align: top;

    .gs-resizer {
      position: absolute;
      border-color: transparent;
      box-sizing: border-box;
      border-width: 2px;
      z-index: 2;
      &:hover {
        border-color: #0077ff;
      }
    }

    &.gs-horizontal {
      top: -1px;
      min-height: 20px;
      border-left-width: 1px !important;
      border-bottom-width: 1px !important;
      &:last-child {
        border-right-width: 1px !important;
      }
      .gs-resizer {
        top: 0;
        right: 0;
        width: 3px;
        cursor: e-resize;
        border-right-style: solid;

        &.gs-dragging {
          border-right-style: dotted;
          height: 1000000px !important;
          cursor: e-resize;
        }
      }
    }
    &.gs-vertical {
      left: -1px;
      overflow: hidden;
      min-width: 30px;
      border-top-width: 1px !important;
      border-right-width: 1px !important;
      &:last-child {
        border-bottom-width: 1px !important;
      }
      .gs-resizer {
        left: 0;
        bottom: 0;
        height: 3px;
        cursor: n-resize;
        border-bottom-style: solid;

        &.gs-dragging {
          border-bottom-style: dotted;
          width: 1000000px !important;
          cursor: n-resize;
        }
      }
    }
    .gs-header-inner {
      box-sizing: border-box;
      vertical-align: middle;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .gs-search {
    width: 300px;
    box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
      rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
    display: flex;
    background-color: #fdfdfd;
    border: solid 2px #eeeeee;
    border-radius: 5px;
    padding: 10px;
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 5;

    .gs-searchbox {
      display: flex;
      position: relative;
      border: solid 2px #0077ff;
      border-radius: 5px;
      flex: 1;
      input[type="text"] {
        padding: 5px;
        background-color: transparent;
        border: none;
        outline: 0;
        z-index: 1;
        flex: 1;
      }
      .gs-search-progress {
        color: #999999;
        padding: 6px 3px;
        font-size: 13px;
        text-align: right;
      }
    }

    .gs-search-close {
      margin: 6px 5px;
      cursor: pointer;
      color: #dddddd;
      width: 50px;
      text-align: center;
    }
  }
  
  .gs-cell {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    position: relative;
    &.gs-copying {
      textarea:focus {
        outline: solid 1px #0077ff;
      }
    }
    .formula-error-triangle {
      position: absolute;
      top: 0;
      right: 0;
      border-top: 3px solid rgba(200, 0, 0, 0.9);
      border-right: 3px solid rgba(200, 0, 0, 0.9);
      border-bottom: 3px solid transparent;
      border-left: 3px solid transparent;
      z-index: 1;
    }
    .gs-cell-label {
      font-family: mono, serif;
      position: absolute;
      top: 0;
      right: 0;
      font-size: 8px;
      font-weight: normal;
      font-style: normal;
      background-color: rgba(0, 128, 255, 0.2);
      color: rgba(255, 255, 255, 0.6);
      padding: 0 2px;
      display: none;
      opacity: 0.7;
      font-weight: normal;
    }
    .gs-cell-rendered-wrapper-outer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      box-sizing: border-box;
      &.gs-selected {
        background-color: rgba(0, 128, 255, 0.2);
        .gs-cell-label {
          display: block;
        }
      }
      &.gs-pointed {
        border: solid 1px #0077ff;
        box-sizing: content-box;
        margin-top: -1px;
        margin-left: -1px;
        z-index: 1;
  
        &.gs-editing {
          border: none;
        }
        .gs-cell-label {
          display: block;
        }
      }
      &.gs-matching {
        background-color: rgba(0, 200, 100, 0.2);
      }
      &.gs-searching {
        border: solid 2px rgb(0, 170, 120);
      }
    }
    .gs-cell-rendered-wrapper-inner {
      display: table-cell;
    }
  
    .gs-cell-rendered {
      overflow: hidden;
      font-size: 13px;
      letter-spacing: 1px;
      white-space: pre-wrap;
      line-height: 20px;
      cursor: auto;
      word-wrap: break-word;
      word-break: break-all;
      padding: 0 2px;
      & > * {
        z-index: 2;
        position: relative;
      }
      & > .backface {
        z-index: 0;
      }
    }
  }
  
}
`;
