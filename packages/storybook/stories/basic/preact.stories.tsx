import React from 'react';
import { constructInitialCells, GridSheet as PreactGridSheet, h, render as preactRender } from '@gridsheet/preact-core';

export default {
  title: 'Basic',
};

const GridSheet = (props: any) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) {
      preactRender(h(PreactGridSheet, props), ref.current);
    }
  }, [props]);

  return <div ref={ref} />;
};

export const Preact = () => {
  const [width, setWidth] = React.useState(500);
  React.useEffect(() => {
    const id = window.setInterval(() => {
      setWidth(width - 50);
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <GridSheet
        initialCells={constructInitialCells({
          cells: {
            A1: { value: '=SUM($B$1:B2)' },
            B1: { value: 1 },
            B2: { value: 2 },
          },
          ensured: { numRows: 10, numCols: 10 },
        })}
        options={{
          sheetWidth: width,
        }}
      />
    </>
  );
};
