import styled from "styled-components";

export const GridTableLayout = styled.div`
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
        width: 8px;
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
        height: 8px;
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
`;
