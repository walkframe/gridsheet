import styled from "styled-components";

export const CurrentLayout = styled.div`
  position: fixed;
  .label {
    font-family: mono, serif;
    position: absolute;
    top: 0;
    right: 0;
    margin-top: -20px;
    margin-right: -2px;
    padding: 3px 5px;
    font-size: 10px;
    background-color: #0077ff;
    color: #ffffff;
    z-index: 2;
  }
  textarea {
    width: 100%;
    position: absolute;
    z-index: -1;
    font-size: 13px;
    line-height: 20px;
    letter-spacing: 1px;
    top: 0;
    left: 0;
    border: none;
    outline: none;
    background-color: transparent;
    resize: none;
    box-sizing: border-box;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    overflow: hidden;
    caret-color: transparent;
    cursor: default;
    &.editing {
      z-index: 2;
      cursor: text;
      min-width: 100%;
      white-space: pre;
      outline: solid 2px #0077ff;
      height: auto;
    }
  }
`;
