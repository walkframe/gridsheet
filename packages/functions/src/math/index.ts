import type { FunctionMapping } from '@gridsheet/react-core';
import { ModFunction } from './mod';
import { SqrtFunction } from './sqrt';
import { ProductFunction } from './product';
import { RoundFunction } from './round';
import { RounddownFunction } from './rounddown';
import { RoundupFunction } from './roundup';
import { LogFunction } from './log';
import { Log10Function } from './log10';
import { LnFunction } from './ln';
import { ExpFunction } from './exp';
import { PiFunction } from './pi';
import { RadiansFunction } from './radians';
import { SinFunction } from './sin';
import { CosFunction } from './cos';
import { TanFunction } from './tan';
import { AsinFunction } from './asin';
import { AcosFunction } from './acos';
import { AtanFunction } from './atan';
import { Atan2Function } from './atan2';
import { RandFunction } from './rand';
import { UnaryPercentFunction } from './unaryPercent';
import { UplusFunction } from './uplus';
import { SumifsFunction } from './sumifs';
import { AverageifsFunction } from './averageifs';
import { CountifsFunction } from './countifs';
import { FactFunction } from './fact';
import { IntFunction } from './int';
import { IsevenFunction } from './iseven';
import { IsoddFunction } from './isodd';
import { LcmFunction } from './lcm';
import { OddFunction } from './odd';
import { EvenFunction } from './even';
import { SignFunction } from './sign';
import { SumsqFunction } from './sumsq';
import { TruncFunction } from './trunc';
import { BaseConvFunction } from './base';

export const mathFunctions: FunctionMapping = {
  mod: ModFunction,
  sqrt: SqrtFunction,
  product: ProductFunction,
  round: RoundFunction,
  rounddown: RounddownFunction,
  roundup: RoundupFunction,
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
  rand: RandFunction,
  unary_percent: UnaryPercentFunction,
  uplus: UplusFunction,
  sumifs: SumifsFunction,
  averageifs: AverageifsFunction,
  countifs: CountifsFunction,
  fact: FactFunction,
  int: IntFunction,
  iseven: IsevenFunction,
  isodd: IsoddFunction,
  lcm: LcmFunction,
  odd: OddFunction,
  even: EvenFunction,
  sign: SignFunction,
  sumsq: SumsqFunction,
  trunc: TruncFunction,
  base: BaseConvFunction,
};

export default mathFunctions;
