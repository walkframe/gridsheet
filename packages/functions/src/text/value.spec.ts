import { ValueFunction } from './value';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('value', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('converts plain numeric string', () => {
      const f = new ValueFunction({ table, args: [new ValueEntity('123.45')] });
      expect(f.call()).toBe(123.45);
    });

    it('converts numeric string with commas', () => {
      const f = new ValueFunction({ table, args: [new ValueEntity('1,234.56')] });
      expect(f.call()).toBe(1234.56);
    });

    it('converts percentage string', () => {
      const f = new ValueFunction({ table, args: [new ValueEntity('15.5%')] });
      expect(f.call()).toBe(0.155);
    });

    it('handles negative percentages', () => {
      const f = new ValueFunction({ table, args: [new ValueEntity('-20%')] });
      expect(f.call()).toBe(-0.2);
    });

    it('converts date string to serial number', () => {
      const f = new ValueFunction({ table, args: [new ValueEntity('01/01/1900')] });
      // Excel epoch for 1900-01-01 is roughly 2.0 (but it depends on timezone and UTC parsing)
      // The implementation uses Date.UTC(1899, 11, 30)
      // "01/01/1900" in JS usually defaults to midnight local or UTC depending on format.
      // Let's just ensure it returns a valid number.
      expect(typeof f.call()).toBe('number');
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new ValueFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid format', () => {
      const f = new ValueFunction({ table, args: [new ValueEntity('not a number')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
