import type { FunctionMapping } from '@gridsheet/core';
import { IsformulaFunction } from './isformula';
import { IsblankFunction } from './isblank';
import { IserrFunction } from './iserr';
import { IserrorFunction } from './iserror';
import { IslogicalFunction } from './islogical';
import { IsnaFunction } from './isna';
import { IsnontextFunction } from './isnontext';
import { IstextFunction } from './istext';
import { IsrefFunction } from './isref';
import { NFunction } from './n';
import { NaFunction } from './na';
import { IsdateFunction } from './isdate';
import { IsemailFunction } from './isemail';
import { SheetsFunction } from './sheets';

export const informationFunctions: FunctionMapping = {
  isformula: IsformulaFunction,
  isblank: IsblankFunction,
  iserr: IserrFunction,
  iserror: IserrorFunction,
  islogical: IslogicalFunction,
  isna: IsnaFunction,
  isnontext: IsnontextFunction,
  istext: IstextFunction,
  isref: IsrefFunction,
  n: NFunction,
  na: NaFunction,
  isdate: IsdateFunction,
  isemail: IsemailFunction,
  sheets: SheetsFunction,
};

export default informationFunctions;
