import { FC, useContext, useEffect, useState } from 'react';
import { Context } from '../store';
import { FeedbackType } from '../types';

type Props = {
  onChange?: FeedbackType;
  onSelect?: FeedbackType;
};

export const Emitter: FC<Props> = ({ onChange, onSelect }) => {
  const { store } = useContext(Context);
  const { choosing: pointing, selectingZone: zone, table } = store;

  useEffect(() => {
    table?.isInitialized &&
    onChange?.(table, {
      pointing,
      selectingFrom: { y: zone.startY, x: zone.startX },
      selectingTo: { y: zone.endY, x: zone.endX },
    });
  }, [table]);

  useEffect(() => {
    onSelect?.(table, {
      pointing,
      selectingFrom: { y: zone.startY, x: zone.startX },
      selectingTo: { y: zone.endY, x: zone.endX },
    });
  }, [pointing, zone]);
  return <></>;
};
