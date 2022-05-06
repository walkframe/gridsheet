import { AddFunction } from "./add";
import { MinusFunction } from "./minus";
import { MultiplyFunction } from "./multiply";
import { DivideFunction } from "./divide";
import { ModFunction } from "./mod";
import { SumFunction } from "./sum";
import { ConcatFunction } from "./concat";
import { ConcatenateFunction } from "./concatenate";
import { EqFunction } from "./eq";
import { NeFunction } from "./ne";
import { GtFunction } from "./gt";
import { GteFunction } from "./gte";
import { LtFunction } from "./lt";
import { LteFunction } from "./lte";
import { NowFunction } from "./now";
import { AndFunction } from "./and";
import { OrFunction } from "./or";
import { IfFunction } from "./if";
import { NotFunction } from "./not";
import { CountFunction } from "./count";
import { CountifFunction } from "./countif";
import { SumifFunction } from "./sumif";
import { VlookupFunction } from "./vlookup";
import { HlookupFunction } from "./hlookup";
import { LogFunction } from "./log";
import { Log10Function } from "./log10";
import { LnFunction } from "./ln";
import { AbsFunction } from "./abs";
import { ProductFunction } from "./product";
import { RandFunction } from "./rand";
import { PiFunction } from "./pi";
import { ExpFunction } from "./exp";
import { RadiansFunction } from "./radians";
import { PowerFunction } from "./power";
import { SqrtFunction } from "./sqrt";
import { RoundFunction } from "./round";
import { RoundupFunction } from "./roundup";
import { RounddownFunction } from "./rounddown";
import { SinFunction } from "./sin";
import { CosFunction } from "./cos";
import { TanFunction } from "./tan";
import { AsinFunction } from "./asin";
import { AcosFunction } from "./acos";
import { AtanFunction } from "./atan";
import { Atan2Function } from "./atan2";
import { CountaFunction } from "./counta";
import { AverageFunction } from "./average";
import { MaxFunction } from "./max";
import { MinFunction } from "./min";

export const mapping = {
  abs: AbsFunction,
  add: AddFunction,
  divide: DivideFunction,
  mod: ModFunction,
  minus: MinusFunction,
  multiply: MultiplyFunction,
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
  not: NotFunction,
  vlookup: VlookupFunction,
  hlookup: HlookupFunction,
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
};
