import styled from "styled-components";

export const CellLayout = styled.div`
  overflow: hidden;
  font-size: 13px;
  letter-spacing: 1px;
  white-space: pre-wrap;
  line-height: 20px;
  cursor: auto;
  word-wrap: break-word;
  word-break: break-all;

  .rendered {
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
