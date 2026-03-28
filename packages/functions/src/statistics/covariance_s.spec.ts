import { CovarianceSFunction } from './covariance_s';
import { Sheet, FormulaError, RangeEntity } from '@gridsheet/react-core';

describe('covariance.s', () => {
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
    it('calculates sample covariance', () => {
      const f = new CovarianceSFunction({ sheet, args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B3')] });
      // meanA=4, meanB=3, sum products: (2-4)(1-3)+(4-4)(3-3)+(6-4)(5-3)=4+0+4=8, cov=8/2=4
      expect(f.call()).toBe(4);
    });
  });

  describe('validation error', () => {
    it('throws when ranges have different length', () => {
      const f = new CovarianceSFunction({ sheet, args: [new RangeEntity('A1:A2'), new RangeEntity('B1:B3')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws when only 1 value', () => {
      const f = new CovarianceSFunction({ sheet, args: [new RangeEntity('A1:A1'), new RangeEntity('B1:B1')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
