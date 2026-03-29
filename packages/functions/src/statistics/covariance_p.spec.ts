import { CovariancePFunction } from './covariance_p';
import { Sheet, FormulaError, RangeEntity } from '@gridsheet/core';

describe('covariance.p', () => {
  const sheet = new Sheet({});
  sheet.initialize({
    A1: { value: 2 },
    A2: { value: 4 },
    A3: { value: 6 },
    B1: { value: 1 },
    B2: { value: 3 },
    B3: { value: 5 },
  });

  describe('normal', () => {
    it('calculates population covariance', () => {
      const f = new CovariancePFunction({ sheet, args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B3')] });
      // meanA=4, meanB=3, sum products: (2-4)(1-3)+(4-4)(3-3)+(6-4)(5-3)=4+0+4=8, cov=8/3
      expect(f.call()).toBeCloseTo(8 / 3);
    });

    it('calculates with single value pair (returns 0)', () => {
      const f = new CovariancePFunction({ sheet, args: [new RangeEntity('A1:A1'), new RangeEntity('B1:B1')] });
      expect(f.call()).toBe(0);
    });
  });

  describe('validation error', () => {
    it('throws when ranges have different length', () => {
      const f = new CovariancePFunction({ sheet, args: [new RangeEntity('A1:A2'), new RangeEntity('B1:B3')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
