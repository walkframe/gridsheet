import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { ensureDate } from './__utils';

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isWeekend(d: Date): boolean {
  const dow = d.getDay(); // 0=Sun, 6=Sat
  return dow === 0 || dow === 6;
}

const description = `Returns the date that is a given number of working days (Mon–Fri) before or after a start date.
Optionally excludes a list of holiday dates.`;

export class WorkdayFunction extends BaseFunction {
  example = 'WORKDAY(A1, 5)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'start_date', description: 'The starting date.', acceptedTypes: ['date'] },
    {
      name: 'days',
      description: 'The number of working days to add (positive) or subtract (negative).',
      acceptedTypes: ['number', 'string'],
    },
    {
      name: 'holidays',
      description: 'An optional list or range of dates to exclude as holidays.',
      optional: true,
      takesMatrix: true,
      acceptedTypes: ['matrix', 'date'],
    },
  ];
  category: FunctionCategory = 'time';

  protected main(startDate: any, days: number, holidays?: any) {
    const start = ensureDate(startDate);
    const holidaySet = new Set<string>();
    if (holidays != null) {
      this.eachMatrix(holidays, (v: any) => {
        if (!v) {
          return;
        }
        try {
          holidaySet.add(dateKey(ensureDate(v)));
        } catch {
          // ignore non-date values
        }
      });
    }
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
