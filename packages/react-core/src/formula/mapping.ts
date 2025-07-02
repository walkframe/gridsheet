import { AddFunction } from './functions/add';
import { MinusFunction } from './functions/minus';
import { MultiplyFunction } from './functions/multiply';
import { DivideFunction } from './functions/divide';
import { ModFunction } from './functions/mod';
import { SumFunction } from './functions/sum';
import { ConcatFunction } from './functions/concat';
import { ConcatenateFunction } from './functions/concatenate';
import { EqFunction } from './functions/eq';
import { NeFunction } from './functions/ne';
import { GtFunction } from './functions/gt';
import { GteFunction } from './functions/gte';
import { LtFunction } from './functions/lt';
import { LteFunction } from './functions/lte';
import { NowFunction } from './functions/now';
import { AndFunction } from './functions/and';
import { OrFunction } from './functions/or';
import { IfFunction } from './functions/if';
import { IfErrorFunction } from './functions/iferror';
import { NotFunction } from './functions/not';
import { CountFunction } from './functions/count';
import { CountifFunction } from './functions/countif';
import { SumifFunction } from './functions/sumif';
import { VlookupFunction } from './functions/vlookup';
import { HlookupFunction } from './functions/hlookup';
import { IndexFunction } from './functions/index';
import { MatchFunction } from './functions/match';
import { LogFunction } from './functions/log';
import { Log10Function } from './functions/log10';
import { LnFunction } from './functions/ln';
import { AbsFunction } from './functions/abs';
import { ProductFunction } from './functions/product';
import { RandFunction } from './functions/rand';
import { PiFunction } from './functions/pi';
import { ExpFunction } from './functions/exp';
import { RadiansFunction } from './functions/radians';
import { PowerFunction } from './functions/power';
import { SqrtFunction } from './functions/sqrt';
import { RoundFunction } from './functions/round';
import { RoundupFunction } from './functions/roundup';
import { RounddownFunction } from './functions/rounddown';
import { SinFunction } from './functions/sin';
import { CosFunction } from './functions/cos';
import { TanFunction } from './functions/tan';
import { AsinFunction } from './functions/asin';
import { AcosFunction } from './functions/acos';
import { AtanFunction } from './functions/atan';
import { Atan2Function } from './functions/atan2';
import { CountaFunction } from './functions/counta';
import { AverageFunction } from './functions/average';
import { MaxFunction } from './functions/max';
import { MinFunction } from './functions/min';
import { LenFunction } from './functions/len';
import { LenbFunction } from './functions/lenb';
import { UminusFunction } from './functions/uminus';
import { RowFunction } from './functions/row';
import { ColFunction } from './functions/col';
import type { FunctionMapping } from './functions/__base';

export const functions: FunctionMapping = {
  abs: AbsFunction,
  add: AddFunction,
  divide: DivideFunction,
  mod: ModFunction,
  minus: MinusFunction,
  uminus: UminusFunction,
  multiply: MultiplyFunction,
  pow: PowerFunction,
  power: PowerFunction,
  sqrt: SqrtFunction,
  sum: SumFunction,
  sumif: SumifFunction,
  max: MaxFunction,
  min: MinFunction,
  average: AverageFunction,
  count: CountFunction,
  counta: CountaFunction,
  countif: CountifFunction,
  product: ProductFunction,
  concat: ConcatFunction,
  concatenate: ConcatenateFunction,
  eq: EqFunction,
  ne: NeFunction,
  gt: GtFunction,
  gte: GteFunction,
  lt: LtFunction,
  lte: LteFunction,
  and: AndFunction,
  or: OrFunction,
  round: RoundFunction,
  rounddown: RounddownFunction,
  roundup: RoundupFunction,
  if: IfFunction,
  // @ts-expect-error iferror does not extends BaseFunction
  iferror: IfErrorFunction,
  not: NotFunction,
  vlookup: VlookupFunction,
  hlookup: HlookupFunction,
  index: IndexFunction,
  match: MatchFunction,
  row: RowFunction,
  col: ColFunction,
  column: ColFunction,
  now: NowFunction,
  rand: RandFunction,
  log: LogFunction,
  log10: Log10Function,
  ln: LnFunction,
  exp: ExpFunction,
  pi: PiFunction,
  radians: RadiansFunction,
  sin: SinFunction,
  cos: CosFunction,
  tan: TanFunction,
  asin: AsinFunction,
  acos: AcosFunction,
  atan: AtanFunction,
  atan2: Atan2Function,
  len: LenFunction,
  lenb: LenbFunction,
};
