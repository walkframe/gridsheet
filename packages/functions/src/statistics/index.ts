import type { FunctionMapping } from '@gridsheet/react-core';
import { SumifFunction } from './sumif';
import { CountifFunction } from './countif';

export const statisticsFunctions: FunctionMapping = {
  sumif: SumifFunction,
  countif: CountifFunction,
};

export default statisticsFunctions;
