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

export const mapping = {
  add: AddFunction,
  divide: DivideFunction,
  mod: ModFunction,
  minus: MinusFunction,
  multiply: MultiplyFunction,
  sum: SumFunction,
  concat: ConcatFunction,
  concatenate: ConcatenateFunction,
  eq: EqFunction,
  ne: NeFunction,
  gt: GtFunction,
  gte: GteFunction,
  lt: LtFunction,
  lte: LteFunction,
  now: NowFunction,
};
