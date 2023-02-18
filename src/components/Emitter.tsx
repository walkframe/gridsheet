import React from "react";

import { Context } from "../store";
import { FeedbackType } from "../types";

type Props = {
  onChange?: FeedbackType;
  onSelect?: FeedbackType;
};

export const Emitter: React.FC<Props> = ({ onChange, onSelect }) => {
  const { store } = React.useContext(Context);
  const {
    choosing: pointing,
    selectingZone: zone,
    table,
    tableInitialized,
  } = store;

  React.useEffect(() => {
    tableInitialized &&
      table &&
      onChange &&
      onChange(table, {
        pointing,
        selectingFrom: { y: zone.startY, x: zone.startX },
        selectingTo: { y: zone.endY, x: zone.endX },
      });
  }, [table]);

  React.useEffect(() => {
    onSelect &&
      onSelect(table, {
        pointing,
        selectingFrom: { y: zone.startY, x: zone.startX },
        selectingTo: { y: zone.endY, x: zone.endX },
      });
  }, [pointing, zone]);
  return <></>;
};
