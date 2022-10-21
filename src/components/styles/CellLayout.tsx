import styled from "styled-components";

export const CellLayout = styled.div`
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
`;
