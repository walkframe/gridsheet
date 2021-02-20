import styled from "styled-components";

export const GridTableLayout = styled.div`
  .gs-table {
    display: table;
    table-layout: fixed;
    border-collapse: collapse;
  }
  .gs-row {
    display: table-row;
  }
  .gs-col {
    display: table-cell;
  }
  .header {
    z-index: 3;
    font-size: 13px;
    font-weight: normal;
    box-sizing: border-box;
    vertical-align: top;
    &.sticky {
      position: sticky;
      position: -webkit-sticky;
    }
    .resizer {
      position: absolute;
      border-color: transparent;
      box-sizing: border-box;
      border-width: 3px;
      z-index: 2;
      &:hover {
        border-color: #0077ff;
      }
    }

    &.horizontal {
      top: -1px;
      min-height: 20px;
      border-right-width: 1px !important;
      border-bottom-width: 1px !important;
      &:first-child {
        border-left-width: 1px !important;
      }
      .resizer {
        top: 0;
        right: 0;
        width: 8px;
        cursor: e-resize;
        border-right-style: solid;

        &.dragging {
          border-right-style: dotted;
          height: 1000000px !important;
          cursor: e-resize;
        }
      }
    }
    &.vertical {
      left: -1px;
      overflow: hidden;
      min-width: 30px;
      border-bottom-width: 1px !important;
      border-right-width: 1px !important;
      &:first-child {
        border-top-width: 1px !important;
      }
      .resizer {
        left: 0;
        bottom: 0;
        height: 8px;
        cursor: n-resize;
        border-bottom-style: solid;

        &.dragging {
          border-bottom-style: dotted;
          width: 1000000px !important;
          cursor: n-resize;
        }
      }
    }
    .header-inner {
      box-sizing: border-box;
      vertical-align: middle;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .cell {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    position: relative;
    &.copying {
      textarea:focus {
        outline: solid 1px #0077ff;
      }
    }
    .label {
      font-family: mono, serif;
      position: absolute;
      top: 0;
      right: 0;
      font-size: 8px;
      font-weight: normal;
      font-style: normal;
      background-color: rgba(0, 128, 255, 0.3);
      color: #ffffff;
      padding: 0 2px;
      display: none;
      opacity: 0.7;
      font-weight: normal;
    }
    .cell-wrapper-outer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      box-sizing: border-box;
      &.selected {
        background-color: rgba(0, 128, 255, 0.2);
        .label {
          display: block;
        }
      }
      &.pointed {
        border: solid 2px #0077ff;
        &.editing {
          overflow: visible;
          border: none;
        }
        .label {
          display: block;
        }
      }
      &.gs-matching {
        background-color: rgba(0, 255, 128, 0.2);
      }
      &.gs-searching {
        border: solid 2px #00ff77;
      }
    }
    .cell-wrapper-inner {
      display: table-cell;
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

    button {
      padding: 2px;
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
