import { Sheet, createRegistry, toValueMatrix } from '../index';
import { FormulaError } from './formula-error';

const evaluate = (formulas: string[]) => {
  const registry = createRegistry({});
  const sheet = new Sheet({ name: 'Sheet1', registry, eager: true });
  sheet.initialize(Object.fromEntries(formulas.map((f, i) => [`A${i + 1}`, { value: f }])));
  registry.contextsBySheetId[sheet.id] = {
    store: { sheetReactive: { current: sheet } },
    dispatch: () => {},
  } as any;
  sheet.resolveFormulas();
  const values = toValueMatrix(sheet, { area: { top: 1, left: 1, bottom: formulas.length, right: 1 } });
  return values.map((row) => row[0]);
};

const cases: [string, any][] = [
  // https://github.com/walkframe/gridsheet/issues/163
  ['=10 + -2 * 3', 4],
  ['=10 + -2 ^ 2', 14],
  ['=2 * -3 ^ 2', 18],
  ['=-2 ^ 2', 4],
  ['=0 + -2 ^ 2', 4],
  // negation binds tighter than ^, but subtraction does not
  ['=0 - 2 ^ 2', -4],
  ['=2 ^ -1', 0.5],
  ['=-2 * 3', -6],
  ['=(-2) ^ 2', 4],
  ['=(10 + -2 * 3)', 4],
  ['=1 - -1 + 1', 3],
  ['=--2', 2],
  ['=- 2 ^ 2', 4],
  ['=+2 ^ 2', 4],
  // mixed precedence without negation (3+ levels)
  ['=1 = 2 + 3 * 4 - 5', false],
  ['=9 = 2 + 3 * 4 - 5', true],
  ['=1 + 2 * 3 - 4', 3],
  ['=1 + 2 * 3 ^ 2 - 4 / 2', 17],
  ['=2 ^ 3 * 2 + 1 = 17', true],
  // left associativity
  ['=10 - 3 - 2', 5],
  ['=100 / 10 / 5', 2],
  ['=2 ^ 3 ^ 2', 64],
  // percent
  ['=50%', 0.5],
  ['=-50%', -0.5],
  ['=200 * 10% + 1', 21],
  ['=100 ^ 50%', 10],
  // functions and parentheses
  ['=SUM(1, -2 * 3, 10)', 5],
  ['=SUM(-1, -2)', -3],
  ['=(1 + 2) * (3 - -1)', 12],
  ['=((2))', 2],
];

describe('operator precedence', () => {
  const values = evaluate(cases.map(([f]) => f));
  cases.forEach(([formula, expected], i) => {
    it(`${formula} => ${expected}`, () => {
      expect(values[i]).toBe(expected);
    });
  });
});

describe('malformed formulas', () => {
  const malformed = ['=1 +', '=-', '=* 2', '=(1))', '=1, 2', '=%'];
  const values = evaluate(malformed);
  malformed.forEach((formula, i) => {
    it(`${formula} is an error`, () => {
      expect(values[i]).toBeInstanceOf(FormulaError);
    });
  });
});
