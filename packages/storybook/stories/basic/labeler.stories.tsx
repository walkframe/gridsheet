import React from 'react';
import { constructInitialCells, GridSheet } from '@gridsheet/react-core';

export default {
  title: 'Basic',
};

export const Labeler = () => {
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
            A: { labeler: 'hiragana' },
            B: { labeler: 'hiragana' },
            C: { labeler: 'hiragana' },
            D: { labeler: 'hiragana' },
            E: { labeler: 'hiragana' },
            1: { labeler: 'katakana' },
            2: { labeler: 'katakana' },
            3: { labeler: 'katakana' },
            4: { labeler: 'katakana' },
            5: { labeler: 'katakana' },
            A1: { value: '=SUM($B$1:B2)' },
          },
          ensured: { numRows: 100, numCols: 100 },
        })}
        options={{
          labelers: {
            hiragana: (n) => 'あいうえおかきくけこ'.slice(n - 1, n),
            katakana: (n) => 'アイウエオカキクケコ'.slice(n - 1, n),
          },
          sheetWidth: width,
        }}
      />
    </>
  );
};
