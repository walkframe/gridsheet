import type { FunctionMapping } from '@gridsheet/react-core';
import { TodayFunction } from './today';
import { DateFunction } from './date';
import { TimeFunction } from './time';
import { DaysFunction } from './days';
import { DayFunction } from './day';
import { MonthFunction } from './month';
import { YearFunction } from './year';
import { HourFunction } from './hour';
import { MinuteFunction } from './minute';
import { SecondFunction } from './second';
import { WorkdayFunction } from './workday';

export const timeFunctions: FunctionMapping = {
  today: TodayFunction,
  date: DateFunction,
  time: TimeFunction,
  days: DaysFunction,
  day: DayFunction,
  month: MonthFunction,
  year: YearFunction,
  hour: HourFunction,
  minute: MinuteFunction,
  second: SecondFunction,
  workday: WorkdayFunction,
};

export default timeFunctions;
