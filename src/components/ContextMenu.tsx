import React from "react";
import { useDispatch, useSelector } from 'react-redux';

import { n2a } from "../api/converters";
import { clip } from "../api/clipboard";
import { Renderer as DefaultRenderer } from "../renderers/core";
import { Parser as DefaultParser } from "../parsers/core";


import {
  InsideState,
  blur,
  clear,
  escape,
  choose, reChoose,
  select, drag,
  setEditingCell,
  undo, redo,
  arrow, walk, write,
  copy, cut, paste,
} from "../store/inside";
import {
  OutsideState,
  setContextMenuPosition,
} from "../store/outside"
import {
  ContextMenuLayout,
} from "./styles/ContextMenuLayout";

import {
  AreaType,
  CellOptionType,
} from "../types";

import { RootState } from "../store";

type Props = {
  clipboardRef: React.RefObject<HTMLTextAreaElement>;
};

export const ContextMenu: React.FC<Props> = ({ clipboardRef }) => {
  const dispatch = useDispatch();

  const {
    renderers,
    parsers,
    onSave,
    contextMenuPosition,
  } = useSelector<RootState, OutsideState>(
      state => state["outside"]);

  const {
    matrix,
    cellsOption,
    copyingZone,
    cutting,
    choosing,
    selectingZone,
    horizontalHeadersSelecting,
    verticalHeadersSelecting,
  } = useSelector<RootState, InsideState>(state => state["inside"]);

  const [y, x] = choosing;
  const rowId = `${ y + 1 }`;
  const colId = n2a(x + 1);
  const cellId = `${colId}${rowId}`;

  const defaultOption: CellOptionType = cellsOption.default || {};
  const rowOption: CellOptionType = cellsOption[rowId] || {};
  const colOption: CellOptionType = cellsOption[colId] || {};
  const cellOption: CellOptionType = cellsOption[cellId] || {};

  const renderer = cellOption.renderer || colOption.renderer || rowOption.renderer || defaultOption.renderer;
  const parser = cellOption.parser || colOption.parser || rowOption.parser || defaultOption.parser;

  const Renderer = renderers[renderer || ""] || DefaultRenderer;
  const Parser = parsers[parser || ""] || DefaultParser;

  const [top, left] = contextMenuPosition;
  if (top === -1) {
    return null;
  }

  return (<ContextMenuLayout
    style={{
      top,
      left,
    }}
  >
    <ul>
      <li onClick={(e) => {
        const area = clip(selectingZone, choosing, matrix, clipboardRef, Renderer);
        dispatch(cut(area));
        dispatch(setContextMenuPosition([-1, -1]));
      }}>
        <div className="name">Cut</div>
        <div className="shortcut"><span className="underline">X</span></div>
      </li>
      <li onClick={(e) => {
        const area = clip(selectingZone, choosing, matrix, clipboardRef, Renderer);
        dispatch(copy(area));
        dispatch(setContextMenuPosition([-1, -1]));
      }}>
        <div className="name">Copy</div>
        <div className="shortcut"><span className="underline">C</span></div>
      </li>
      <li onClick={async (e) => {
        const text = await navigator.clipboard.readText();
        dispatch(paste({ text, Parser }));
        dispatch(setContextMenuPosition([-1, -1]));
      }}>
        <div className="name">Paste</div>
        <div className="shortcut"><span className="underline">V</span></div>
      </li>

      <li className="divider" />

      <li onClick={async (e) => {
        dispatch(undo());
        dispatch(setContextMenuPosition([-1, -1]));
      }}>
        <div className="name">Undo</div>
        <div className="shortcut"><span className="underline">Z</span></div>
      </li>
      <li onClick={async (e) => {
        dispatch(redo());
        dispatch(setContextMenuPosition([-1, -1]));
      }}>
        <div className="name">Redo</div>
        <div className="shortcut"><span className="underline">R</span></div>
      </li>
    </ul>
  </ContextMenuLayout>);
};
