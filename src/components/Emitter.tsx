import React from "react";

import { Context } from "../store";
import { Feedback } from "../types";

import { rerenderCells } from "../api/arrays";

type Props = {
  onChange?: Feedback;
  onSelect?: Feedback;
};

export const Emitter: React.FC<Props> = ({ onChange, onSelect }) => {
  const { store, dispatch } = React.useContext(Context);
  const { matrix, cellsOption, choosing: pointing, selectingZone: zone } = store;
  React.useEffect(() => {
    rerenderCells({
      ...store,
      rows: [0, matrix.length],
      cols: [0, matrix[0]?.length || 0],
    });
  }, [matrix, cellsOption]);
  React.useEffect(() => {
    onChange && onChange(matrix, cellsOption, {pointing, selectingFrom: [zone[0], zone[1]], selectingTo: [zone[2], zone[3]]});
  }, [onChange, matrix, cellsOption]);
  React.useEffect(() => {
    onSelect && onSelect(matrix, cellsOption, {pointing, selectingFrom: [zone[0], zone[1]], selectingTo: [zone[2], zone[3]]});
  }, [onSelect, pointing, zone]);
  return <></>;
};
