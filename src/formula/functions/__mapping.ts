import { AddFunction } from "./add";
import { MinusFunction } from "./minus";
import { MultiplyFunction } from "./multiply";
import { DivideFunction } from "./divide";
import { SumFunction } from "./sum";

export const mapping = {
  add: AddFunction,
  divide: DivideFunction,
  minus: MinusFunction,
  multiply: MultiplyFunction,
  sum: SumFunction,
};
