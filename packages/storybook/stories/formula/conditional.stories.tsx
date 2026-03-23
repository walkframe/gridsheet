import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  buildInitialCells,
  GridSheet,
  BaseFunctionAsync,
  FormulaError,
  type FunctionArgumentDefinition,
} from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/functions';

class DelayNaFunction extends BaseFunctionAsync {
  example = 'DELAY_NA()';
  description = 'Returns #N/A after a short async delay.';
  defs: FunctionArgumentDefinition[] = [];
  category = 'information' as const;

  async main() {
    await new Promise((resolve) => setTimeout(resolve, 750));
    throw new FormulaError('#N/A', 'Delayed N/A');
  }
}

const meta: Meta = {
  title: 'Formula/Conditional',
};
export default meta;

// ---------------------------------------------------------------------------
// IF / IFS / IFNA stories
// ---------------------------------------------------------------------------

/** Basic IF demo */
const IfSheet: React.FC = () => {
  const book = useSpellbook();
  return (
    <GridSheet
      book={book}
      sheetName="IfDemo"
      initialCells={buildInitialCells({
        cells: {
          default: { width: 200 },
          // Labels
          A1: { value: 'score' },
          B1: { value: 'IF pass/fail' },
          C1: { value: 'IF with no false branch' },
          D1: { value: 'nested IF' },
          // Data
          A2: { value: 90 },
          A3: { value: 50 },
          A4: { value: 0 },
          // IF: simple pass/fail
          B2: { value: '=IF(A2>=60,"Pass","Fail")' },
          B3: { value: '=IF(A3>=60,"Pass","Fail")' },
          B4: { value: '=IF(A4>=60,"Pass","Fail")' },
          // IF: no false branch → returns FALSE when condition is false
          C2: { value: '=IF(A2>=60,"Pass")' },
          C3: { value: '=IF(A3>=60,"Pass")' },
          C4: { value: '=IF(A4>=60,"Pass")' },
          // nested IF: grade
          D2: { value: '=IF(A2>=90,"A",IF(A2>=70,"B",IF(A2>=60,"C","F")))' },
          D3: { value: '=IF(A3>=90,"A",IF(A3>=70,"B",IF(A3>=60,"C","F")))' },
          D4: { value: '=IF(A4>=90,"A",IF(A4>=70,"B",IF(A4>=60,"C","F")))' },
        },
        ensured: { numRows: 10, numCols: 6 },
      })}
      options={{ sheetHeight: 300 }}
    />
  );
};

/** IFS demo */
const IfsSheet: React.FC = () => {
  const book = useSpellbook();
  return (
    <GridSheet
      book={book}
      sheetName="IfsDemo"
      initialCells={buildInitialCells({
        cells: {
          default: { width: 220 },
          A1: { value: 'score' },
          B1: { value: 'IFS grade' },
          A2: { value: 95 },
          A3: { value: 75 },
          A4: { value: 55 },
          A5: { value: 35 },
          B2: { value: '=IFS(A2>=90,"A",A2>=70,"B",A2>=50,"C",A2>=0,"F")' },
          B3: { value: '=IFS(A3>=90,"A",A3>=70,"B",A3>=50,"C",A3>=0,"F")' },
          B4: { value: '=IFS(A4>=90,"A",A4>=70,"B",A4>=50,"C",A4>=0,"F")' },
          B5: { value: '=IFS(A5>=90,"A",A5>=70,"B",A5>=50,"C",A5>=0,"F")' },
        },
        ensured: { numRows: 10, numCols: 4 },
      })}
      options={{ sheetHeight: 300 }}
    />
  );
};

/** IFNA demo */
const IfnaSheet: React.FC = () => {
  const book = useSpellbook();
  return (
    <GridSheet
      book={book}
      sheetName="IfnaDemo"
      initialCells={buildInitialCells({
        cells: {
          default: { width: 240 },
          A1: { value: 'formula' },
          B1: { value: 'IFNA result' },
          // Direct NA formula
          A2: { value: '=NA()' },
          B2: { value: '=IFNA(A2,"was N/A")' },
          // Non-NA value → returned as-is
          A3: { value: 42 },
          B3: { value: '=IFNA(A3,"was N/A")' },
          // Error other than #N/A is NOT caught
          A4: { value: '=1/0' },
          B4: { value: '=IFNA(A4,"was N/A")' },
          // VLOOKUP miss → #N/A → caught by IFNA
          A6: { value: 'lookup key' },
          B6: { value: 'value' },
          A7: { value: 'apple' },
          B7: { value: 100 },
          A8: { value: 'banana' },
          B8: { value: 200 },
          A10: { value: 'search' },
          B10: { value: '=IFNA(VLOOKUP(A11,$A$7:$B$8,2,false),"Not found")' },
          B11: { value: '=IFNA(VLOOKUP(A12,$A$7:$B$8,2,false),"Not found")' },
          A11: { value: 'apple' },
          A12: { value: 'cherry' },
        },
        ensured: { numRows: 15, numCols: 4 },
      })}
      options={{ sheetHeight: 400 }}
    />
  );
};

// ---------------------------------------------------------------------------
// IFNA + DELAY_NA (async custom function) stories
// ---------------------------------------------------------------------------

/** IFNA with async DELAY_NA demo */
const IfnaDelayNaSheet: React.FC = () => {
  const book = useSpellbook({
    additionalFunctions: {
      delay_na: DelayNaFunction,
    },
  });
  return (
    <GridSheet
      book={book}
      sheetName="IfnaDelayNaDemo"
      initialCells={buildInitialCells({
        cells: {
          default: { width: 280 },
          A1: { value: 'pattern' },
          B1: { value: 'formula' },
          C1: { value: 'result' },
          // Pattern 1: inline — pass DELAY_NA() directly as IFNA argument
          A2: { value: 'inline' },
          B2: { value: '=IFNA(DELAY_NA(),"caught #N/A (inline)")' },
          // Pattern 2: store DELAY_NA() result in a separate cell, then reference it
          A4: { value: 'stored cell' },
          B4: { value: '=DELAY_NA()' },
          C4: { value: '<- raw DELAY_NA() result' },
          A5: { value: 'ref to B4' },
          B5: { value: '=IFNA(B4,"caught #N/A (via ref)")' },
        },
        ensured: { numRows: 8, numCols: 4 },
      })}
      options={{ sheetHeight: 280 }}
    />
  );
};

/** IFERROR vs IFNA side-by-side demo */
const IferrorIfnaSheet: React.FC = () => {
  const book = useSpellbook();
  return (
    <GridSheet
      book={book}
      sheetName="IferrorIfnaDemo"
      initialCells={buildInitialCells({
        cells: {
          default: { width: 220 },
          A1: { value: 'input' },
          B1: { value: 'IFERROR result' },
          C1: { value: 'IFNA result' },
          // #DIV/0!: IFERROR catches it, IFNA does not
          A2: { value: '=1/0' },
          B2: { value: '=IFERROR(A2,"div/0 caught")' },
          C2: { value: '=IFNA(A2,"was N/A")' },
          // Normal value: neither catches
          A3: { value: 42 },
          B3: { value: '=IFERROR(A3,"err")' },
          C3: { value: '=IFNA(A3,"was N/A")' },
          // #N/A: both catch it
          A4: { value: '=NA()' },
          B4: { value: '=IFERROR(A4,"all errors")' },
          C4: { value: '=IFNA(A4,"was N/A")' },
        },
        ensured: { numRows: 8, numCols: 4 },
      })}
      options={{ sheetHeight: 260 }}
    />
  );
};

export const IferrorIfna: StoryObj = {
  render: () => <IferrorIfnaSheet />,
  parameters: {
    docs: {
      description: {
        story: [
          '`IFERROR` catches **all** errors; `IFNA` catches **only** `#N/A`.',
          '',
          '| input | IFERROR | IFNA |',
          '|-------|---------|------|',
          '| `=1/0` (#DIV/0!) | `"div/0 caught"` | `#DIV/0!` (not caught) |',
          '| `42` | `42` | `42` |',
          '| `=NA()` (#N/A) | `"all errors"` | `"was N/A"` |',
        ].join('\n'),
      },
    },
  },
};

export const IfnaDelayNa: StoryObj = {
  render: () => <IfnaDelayNaSheet />,
  parameters: {
    docs: {
      description: {
        story: [
          '`DELAY_NA()` — a custom async function that returns `#N/A` after a 750 ms delay.',
          '',
          '**Pattern 1 – inline**: `=IFNA(DELAY_NA(),"caught #N/A (inline)")` — pass `DELAY_NA()` directly as the first argument of `IFNA`.',
          '',
          '**Pattern 2 – via ref**: store `=DELAY_NA()` in B4, then evaluate it with `=IFNA(B4,"caught #N/A (via ref)")` in B5.',
        ].join('\n'),
      },
    },
  },
};

export const If: StoryObj = {
  render: () => <IfSheet />,
  parameters: {
    docs: {
      description: {
        story: [
          '`IF(condition, value_if_true, value_if_false)` — the fundamental conditional.',
          '',
          '- score 90 → `Pass`, grade `A`',
          '- score 50 → `Fail`, grade `F`',
          '- score  0 → `Fail`, grade `F`',
          '- When no false branch given and condition is FALSE → returns `FALSE`',
        ].join('\n'),
      },
    },
  },
};

export const Ifs: StoryObj = {
  render: () => <IfsSheet />,
  parameters: {
    docs: {
      description: {
        story: [
          '`IFS(cond1, val1, cond2, val2, …)` — evaluates multiple conditions in order.',
          '',
          'Returns the value paired with the first TRUE condition.',
          'If no condition is met, `#N/A` is returned.',
        ].join('\n'),
      },
    },
  },
};

export const Ifna: StoryObj = {
  render: () => <IfnaSheet />,
  parameters: {
    docs: {
      description: {
        story: [
          '`IFNA(value, value_if_na)` — catches `#N/A` errors only (not other errors like `#DIV/0!`).',
          '',
          '- `=NA()` → caught → `"was N/A"`',
          '- Scalar 42 → returned as-is → `42`',
          '- `=1/0` (`#DIV/0!`) → NOT caught → `#DIV/0!`',
          '- `VLOOKUP` miss → `#N/A` → caught → `"Not found"`',
        ].join('\n'),
      },
    },
  },
};
