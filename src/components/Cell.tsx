import React from "react";
import styled from "styled-components";

import {
  DataType,
  WidthType,
  HeightType,
} from "../types";

interface Props {
  value: string;
};

const CellLayout = styled.div`
  textarea {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    border: none;
    background-color: transparent;
    resize: none;
    box-sizing: border-box;
    overflow: hidden;

    &:read-only {
      cursor: auto;
    }
  }
`;

export const Cell: React.FC<Props> = ({value}) => {
  return (<CellLayout className="cell">
    <textarea
      readOnly
      defaultValue={value}
      onDoubleClick={(e) => e.currentTarget.removeAttribute("readOnly")}
      onBlur={(e) => e.currentTarget.setAttribute("readOnly", "readOnly")}
    ></textarea>
  </CellLayout>);
};

