import type { FC } from 'react';
import { useContext, useEffect, useRef } from 'react';
import { Context } from '../store';

export const Emitter: FC = () => {
  const { store } = useContext(Context);
  const { choosing: pointing, selectingZone: zone, tableReactive } = store;
  const table = tableReactive.current;

  useEffect(() => {
    if (table?.isInitialized && table.wire.onChange) {
      table.wire.onChange({
        table,
        points: {
          pointing,
          selectingFrom: { y: zone.startY, x: zone.startX },
          selectingTo: { y: zone.endY, x: zone.endX },
        },
      });
    }
  }, [tableReactive]);

  useEffect(() => {
    if (table && table.wire.onSelect) {
      table.wire.onSelect({
        table,
        points: {
          pointing,
          selectingFrom: { y: zone.startY, x: zone.startX },
          selectingTo: { y: zone.endY, x: zone.endX },
        },
      });
    }
  }, [pointing, zone]);
  return null;
};
