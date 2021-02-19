import styled from "styled-components";

export const EditorLayout = styled.div`
  position: fixed;
  z-index: -1;
  .label {
    font-family: mono, serif;
    position: absolute;
    top: 0;
    right: 0;
    margin-top: -21px;
    margin-right: -2px;
    padding: 3px 5px;
    font-size: 10px;
    background-color: #0077ff;
    color: #ffffff;
  }
  textarea {
    width: 100%;
    position: absolute;
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
  }
  &.editing {
    z-index: 2;

    textarea {
      cursor: text;
      min-width: 100%;
      white-space: pre;
      outline: solid 2px #0077ff;
      height: auto;
    }
  }
`;
