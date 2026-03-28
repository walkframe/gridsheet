import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/functions';
import { Debugger } from '@gridsheet/react-dev';

const meta: Meta = {
  title: 'Formula/Matrix',
};
export default meta;

const MatrixFunctions: React.FC = () => {
  const book = useSpellbook();

  // ---- MMULT: A(2×2) × B(2×2) → 2×2 result spills from E2 ----
  const mmultCells = buildInitialCells({
    cells: {
      A: { width: 90 },
      B: { width: 90 },
      C: { width: 90 },
      D: { width: 90 },
      E: { width: 90 },
      F: { width: 90 },
      G: { width: 90 },
      H: { width: 90 },
      A1: { value: 'Matrix A', style: { fontWeight: 'bold' } },
      A2: { value: 1 },
      B2: { value: 2 },
      A3: { value: 3 },
      B3: { value: 4 },
      C1: { value: 'Matrix B', style: { fontWeight: 'bold' } },
      C2: { value: 5 },
      D2: { value: 6 },
      C3: { value: 7 },
      D3: { value: 8 },
      F1: { value: '=MMULT(A2:B3, C2:D3)', formulaEnabled: false, style: { fontWeight: 'bold' } },
      F2: { value: '=MMULT(A2:B3, C2:D3)' },
    },
    ensured: { numRows: 6, numCols: 8 },
  });

  // ---- TRANSPOSE: 2×3 matrix → 3×2 result spills from E2 ----
  const transposeCells = buildInitialCells({
    cells: {
      A: { width: 90 },
      B: { width: 90 },
      C: { width: 90 },
      D: { width: 90 },
      E: { width: 90 },
      F: { width: 90 },
      G: { width: 90 },
      H: { width: 90 },
      A1: { value: 'Matrix (2×3)', style: { fontWeight: 'bold' } },
      A2: { value: 1 },
      B2: { value: 2 },
      C2: { value: 3 },
      A3: { value: 4 },
      B3: { value: 5 },
      C3: { value: 6 },
      E1: { value: '=TRANSPOSE(A2:C3)', formulaEnabled: false, style: { fontWeight: 'bold' } },
      E2: { value: '=TRANSPOSE(A2:C3)' },
    },
    ensured: { numRows: 7, numCols: 8 },
  });

  // ---- MINVERSE: 3×3 invertible matrix → 3×3 result spills from E2 ----
  const minverseCells = buildInitialCells({
    cells: {
      A: { width: 90 },
      B: { width: 90 },
      C: { width: 90 },
      D: { width: 90 },
      E: { width: 90 },
      F: { width: 90 },
      G: { width: 90 },
      H: { width: 90 },
      I: { width: 90 },
      A1: { value: 'Matrix C (3×3)', style: { fontWeight: 'bold' } },
      A2: { value: 1 },
      B2: { value: 2 },
      C2: { value: 3 },
      A3: { value: 0 },
      B3: { value: 1 },
      C3: { value: 4 },
      A4: { value: 5 },
      B4: { value: 6 },
      C4: { value: 0 },
      E1: { value: '=MINVERSE(A2:C4)', formulaEnabled: false, style: { fontWeight: 'bold' } },
      E2: { value: '=MINVERSE(A2:C4)' },
    },
    ensured: { numRows: 7, numCols: 9 },
  });

  // ---- MDETERM: 3×3 matrix → scalar ----
  const mdetermCells = buildInitialCells({
    cells: {
      A: { width: 90 },
      B: { width: 90 },
      C: { width: 90 },
      D: { width: 90 },
      E: { width: 90 },
      F: { width: 90 },
      G: { width: 90 },
      H: { width: 90 },
      A1: { value: 'Matrix C (3×3)', style: { fontWeight: 'bold' } },
      A2: { value: 1 },
      B2: { value: 2 },
      C2: { value: 3 },
      A3: { value: 0 },
      B3: { value: 1 },
      C3: { value: 4 },
      A4: { value: 5 },
      B4: { value: 6 },
      C4: { value: 0 },
      E1: { value: '=MDETERM(A2:C4)', formulaEnabled: false, style: { fontWeight: 'bold' } },
      E2: { value: '=MDETERM(A2:C4)' },
    },
    ensured: { numRows: 7, numCols: 8 },
  });

  // ---- SUMPRODUCT: dot product of two 3-element vectors ----
  const sumproductCells = buildInitialCells({
    cells: {
      A: { width: 90 },
      B: { width: 90 },
      C: { width: 90 },
      D: { width: 90 },
      E: { width: 90 },
      F: { width: 90 },
      G: { width: 90 },
      H: { width: 90 },
      A1: { value: 'Array A', style: { fontWeight: 'bold' } },
      A2: { value: 1 },
      A3: { value: 2 },
      A4: { value: 3 },
      B1: { value: 'Array B', style: { fontWeight: 'bold' } },
      B2: { value: 4 },
      B3: { value: 5 },
      B4: { value: 6 },
      D1: { value: '=SUMPRODUCT(A2:A4, B2:B4)', formulaEnabled: false, style: { fontWeight: 'bold' } },
      D2: { value: '=SUMPRODUCT(A2:A4, B2:B4)' },
    },
    ensured: { numRows: 7, numCols: 8 },
  });

  const sheetStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.4rem' };
  const labelStyle: React.CSSProperties = { margin: 0, fontSize: '1rem' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={sheetStyle}>
        <h3 style={labelStyle}>MMULT — Matrix product</h3>
        <GridSheet book={book} sheetName="MMULT" initialCells={mmultCells} options={{ sheetHeight: 180 }} />
      </div>
      <div style={sheetStyle}>
        <h3 style={labelStyle}>TRANSPOSE — Matrix transpose</h3>
        <GridSheet book={book} sheetName="TRANSPOSE" initialCells={transposeCells} options={{ sheetHeight: 210 }} />
      </div>
      <div style={sheetStyle}>
        <h3 style={labelStyle}>MINVERSE — Matrix inverse</h3>
        <GridSheet book={book} sheetName="MINVERSE" initialCells={minverseCells} options={{ sheetHeight: 210 }} />
      </div>
      <div style={sheetStyle}>
        <h3 style={labelStyle}>MDETERM — Matrix determinant</h3>
        <GridSheet book={book} sheetName="MDETERM" initialCells={mdetermCells} options={{ sheetHeight: 210 }} />
      </div>
      <div style={sheetStyle}>
        <h3 style={labelStyle}>SUMPRODUCT — Sum of element-wise products</h3>
        <GridSheet book={book} sheetName="SUMPRODUCT" initialCells={sumproductCells} options={{ sheetHeight: 210 }} />
      </div>
      <Debugger book={book} />
    </div>
  );
};

export const Default: StoryObj = {
  render: () => <MatrixFunctions />,
  name: 'Matrix Functions',
};
