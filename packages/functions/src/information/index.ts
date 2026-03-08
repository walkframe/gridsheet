import type { FunctionMapping } from '@gridsheet/react-core';
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
  // @ts-expect-error iserr does not extend BaseFunction
  iserr: IserrFunction,
  // @ts-expect-error iserror does not extend BaseFunction
  iserror: IserrorFunction,
  islogical: IslogicalFunction,
  // @ts-expect-error isna does not extend BaseFunction
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
