import styled from "styled-components";

export const ContextMenuLayout = styled.div`
  z-index: 3;
  position: absolute;
  background-color: #ffffff;
  padding: 5px 0;
  border-radius: 5px;
  box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
    rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;

  ul {
    min-width: 250px;
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

      &.gs-menu-divider {
        background-color: #aaaaaa;
        margin: 10px 0;
        padding: 0;
        height: 1px;
      }

      display: flex;

      .gs-menu-name {
        flex: 1;
        font-size: 15px;
        letter-spacing: 1px;
      }

      .gs-menu-shortcut {
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

        .gs-menu-underline {
          text-decoration: underline;
        }
      }
    }
  }
`;
