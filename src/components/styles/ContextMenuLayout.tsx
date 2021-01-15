import styled from "styled-components";

export const ContextMenuLayout = styled.div`
  z-index: 3;
  position: absolute;
  background-color: #ffffff;
  padding: 5px 0;
  border-radius: 5px;

  ul {
    min-width: 200px;
    color: #555555;
    margin: 0;
    padding: 0;

    li {
      padding: 5px 10px;
      list-style-type: none;
      cursor: pointer;
      &:hover {
        background-color: #eeeeee;
      }

      &.divider {
        background-color: #aaaaaa;
        margin: 10px 0;
        padding: 0;
        height: 1px;
      }

      display: flex;
      
      .name {
        flex: 1;
        font-size: 15px;
        letter-spacing: 1px;
      }

      .shortcut {
        font-size: 10px;
        line-height: 15px;
        color: #999999;
        width: 15px;

        &:before {
          content: "(";
        }
        &:after {
          content: ")";
        }

        .underline {
          text-decoration: underline;
        }
      }
    }
  }

`;
