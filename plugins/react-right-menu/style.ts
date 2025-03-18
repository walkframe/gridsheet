
export const style = `

.gs-rightmenu-wrapper {
  display: flex;
}

.gs-rightmenu-main {
  z-index: 3;
  transition: width 0.5s;
  font-size: 12px;
  min-width: 130px;
}

.gs-rightmenu-main[data-mode="light"] {
  background-color: rgb(240, 240, 240);
  color: rgb(0, 0, 0);
}

.gs-rightmenu-main[data-mode="dark"] {
  background-color: rgb(50, 50, 50);
  color: rgb(255, 255, 255);
}

.gs-rightmenu-main[data-mode="dark"] input {
  color: rgb(255, 255, 255);
}

.gs-rightmenu-main[data-mode="dark"] input {
  background-color: transparent;
}

.gs-rightmenu-items {
  min-width: 100px;
  box-sizing: border-box;
}

.gs-rightmenu-item {
  margin-bottom: 20px;
}

.gs-rightmenu-header {
  padding: 5px;
  border-bottom: double 3px rgba(128, 128, 128, 0.3);
}

.gs-rightmenu-block {
  padding: 5px;
}

.gs-rightmenu-row {
  display: flex;
  margin: 5px 0;
  height: 24px;
}

.gs-rightmenu-row input[disabled] {
  opacity: 0.3;
}

.gs-rightmenu-col {
  width: 65px;
}

.gs-rightmenu-input {
  border: solid 1px #d9d9d9;
  box-sizing: border-box;

  list-style: none;
  position: relative;
  display: inline-block;
  width: 50px;

}
.gs-right-menu-btn {
  font-size: 14px;
  line-height: 24px;
  padding: 0 5px;
}
.gs-right-menu-btn {
  outline: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  text-align: center;
  background-color: #4096ff;
  border: none;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  color: #fff;
  box-sizing: border-box;
}

.gs-right-menu-btn > span {
  display: inline-flex;
}
`;