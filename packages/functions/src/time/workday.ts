import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber, Table, solveTable } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { ensureDate } from './__utils';

function buildHolidaySet(value: any): Set<string> {
  const set = new Set<string>();
  if (!value) {
    return set;
  }

  let items: any[];
  if (value instanceof Table) {
    items = solveTable({ table: value }).flat();
  } else {
    items = [value];
  }

  for (const item of items) {
    if (!item) {
      continue;
    }
    try {
      const d = ensureDate(item);
      set.add(dateKey(d));
    } catch {
      // ignore non-date values
    }
  }
  return set;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isWeekend(d: Date): boolean {
  const dow = d.getDay(); // 0=Sun, 6=Sat
  return dow === 0 || dow === 6;
}

export class WorkdayFunction extends BaseFunction {
  example = 'WORKDAY(A1, 5)';
  helpText = [
    'Returns the date that is a given number of working days (Mon–Fri) before or after a start date.',
    'Optionally excludes a list of holiday dates.',
  ];
  helpArgs: HelpArg[] = [
    { name: 'start_date', description: 'The starting date.', type: ['date'] },
    {
      name: 'days',
      description: 'The number of working days to add (positive) or subtract (negative).',
      type: ['number'],
    },
    {
      name: 'holidays',
      description: 'An optional list or range of dates to exclude as holidays.',
      optional: true,
      type: ['range', 'date'],
    },
  ];
  category: FunctionCategory = 'time';

  protected validate() {
    if (this.bareArgs.length < 2 || this.bareArgs.length > 3) {
      throw new FormulaError('#N/A', 'Number of arguments for WORKDAY is incorrect.');
    }
    this.bareArgs[1] = ensureNumber(this.bareArgs[1]);
  }

  protected main(startDate: any, days: number, holidays?: any) {
    const start = ensureDate(startDate);
    const holidaySet = buildHolidaySet(holidays);
    const step = days >= 0 ? 1 : -1;
    let remaining = Math.abs(Math.trunc(days));
    const current = new Date(start.getTime());

    while (remaining > 0) {
      current.setDate(current.getDate() + step);
      if (!isWeekend(current) && !holidaySet.has(dateKey(current))) {
        remaining--;
      }
    }

    return new Date(current.getFullYear(), current.getMonth(), current.getDate());
  }
}
