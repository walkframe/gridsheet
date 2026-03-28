import { BaseConvFunction } from './base';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('base', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('converts number to binary', () => {
      const f = new BaseConvFunction({ sheet, args: [new ValueEntity(255), new ValueEntity(2)] });
      expect(f.call()).toBe('11111111');
    });

    it('converts number to hex', () => {
      const f = new BaseConvFunction({ sheet, args: [new ValueEntity(255), new ValueEntity(16)] });
      expect(f.call()).toBe('FF');
    });

    it('pads with zeros if min_length is provided', () => {
      const f = new BaseConvFunction({ sheet, args: [new ValueEntity(255), new ValueEntity(16), new ValueEntity(4)] });
      expect(f.call()).toBe('00FF');
    });

    it('floors inputs before converting', () => {
      const f = new BaseConvFunction({ sheet, args: [new ValueEntity(255.9), new ValueEntity(16.9)] });
      expect(f.call()).toBe('FF');
    });
  });

  describe('validation error', () => {
    it('missing arguments', () => {
      const f = new BaseConvFunction({ sheet, args: [new ValueEntity(255)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('negative value', () => {
      const f = new BaseConvFunction({ sheet, args: [new ValueEntity(-1), new ValueEntity(16)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('base out of bounds (less than 2)', () => {
      const f = new BaseConvFunction({ sheet, args: [new ValueEntity(255), new ValueEntity(1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('base out of bounds (greater than 36)', () => {
      const f = new BaseConvFunction({ sheet, args: [new ValueEntity(255), new ValueEntity(37)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('negative min_length', () => {
      const f = new BaseConvFunction({ sheet, args: [new ValueEntity(255), new ValueEntity(16), new ValueEntity(-1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
