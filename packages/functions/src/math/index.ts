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
};

export default mathFunctions;
