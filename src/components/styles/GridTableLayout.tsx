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
      border-right: solid 1px #777777;
      .resizer {
        top: 0;
        right: 0;
        width: 9px;
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
      border-bottom: solid 1px #777777;
      .resizer {
        left: 0;
        bottom: 0;
        height: 9px;
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
    }
    .cell-wrapper-inner {
      display: table-cell;
    }
  }
`;
