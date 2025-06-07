import React from 'react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

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
        initialCells={buildInitialCells({
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
            A1: { value: '=SUM($B1:C$1)' },
            B1: { value: 1 },
            C1: { value: 100 },
            D1: { value: 200 },
            A2: { value: '=$B2'},
            B2: { value: 2 },
          },
          ensured: { numRows: 10, numCols: 10 },
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
