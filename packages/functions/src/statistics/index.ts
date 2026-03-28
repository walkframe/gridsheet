import type { FunctionMapping } from '@gridsheet/react-core';
import { AverageifFunction } from './averageif';
import { AverageifsFunction } from './averageifs';
import { MedianFunction } from './median';
import { StdevSFunction } from './stdev_s';
import { StdevPFunction } from './stdev_p';
import { VarSFunction } from './var_s';
import { VarPFunction } from './var_p';
import { PercentileIncFunction } from './percentile_inc';
import { QuartileIncFunction } from './quartile_inc';
import { RankEqFunction } from './rank_eq';
import { CorrelFunction } from './correl';
import { CovarianceSFunction } from './covariance_s';
import { CovariancePFunction } from './covariance_p';
import { ModeSnglFunction } from './mode_sngl';
import { RsqFunction } from './rsq';
import { TTestFunction } from './t_test';

export const statisticsFunctions: FunctionMapping = {
  averageif: AverageifFunction,
  averageifs: AverageifsFunction,
  median: MedianFunction,
  'stdev.s': StdevSFunction,
  'stdev.p': StdevPFunction,
  'var.s': VarSFunction,
  'var.p': VarPFunction,
  'percentile.inc': PercentileIncFunction,
  'quartile.inc': QuartileIncFunction,
  'rank.eq': RankEqFunction,
  correl: CorrelFunction,
  'covariance.s': CovarianceSFunction,
  'covariance.p': CovariancePFunction,
  'mode.sngl': ModeSnglFunction,
  rsq: RsqFunction,
  't.test': TTestFunction,
};

export default statisticsFunctions;
