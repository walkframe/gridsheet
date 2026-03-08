import type { FunctionMapping } from '@gridsheet/react-core';
import { VlookupFunction } from './vlookup';
import { HlookupFunction } from './hlookup';
import { IndexFunction } from './indexFn';
import { MatchFunction } from './match';
import { RowFunction } from './row';
import { ColFunction } from './col';
import { SheetFunction } from './sheet';
import { ColumnsFunction } from './columns';
import { RowsFunction } from './rows';

export const lookupFunctions: FunctionMapping = {
  vlookup: VlookupFunction,
  hlookup: HlookupFunction,
  index: IndexFunction,
  match: MatchFunction,
  row: RowFunction,
  col: ColFunction,
  column: ColFunction,
  sheet: SheetFunction,
  columns: ColumnsFunction,
  rows: RowsFunction,
};

export default lookupFunctions;
