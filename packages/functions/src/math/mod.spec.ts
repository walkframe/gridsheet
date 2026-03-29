import { ModFunction } from './mod';
import { Sheet, FormulaError, RefEntity, ValueEntity } from '@gridsheet/core';

describe('mod', () => {
  const sheet = new Sheet({});
  sheet.initialize({ A1: { value: 5 }, A2: { value: -3 }, B2: { value: 25 } });
  describe('normal', () => {
    it('divided by positive value', () => {
      {
        const f = new ModFunction({
          sheet,
          args: [new RefEntity('B2'), new ValueEntity(5)],
        });
        expect(f.call()).toBe(0);
      }
      {
        const f = new ModFunction({
          sheet,
          args: [new ValueEntity(12), new RefEntity('A1')],
        });
        expect(f.call()).toBe(2);
      }
      {
        const f = new ModFunction({
          sheet,
          args: [new ValueEntity(-5), new ValueEntity(4)],
        });
        expect(f.call()).toBe(3);
      }
    });
    it('divided by negative value', () => {
      {
        const f = new ModFunction({
          sheet,
          args: [new ValueEntity(10), new RefEntity('A2')],
        });
        expect(f.call()).toBe(-2);
      }
      {
        const f = new ModFunction({
          sheet,
          args: [new ValueEntity(-10), new RefEntity('A2')],
        });
        expect(f.call()).toBe(-1);
      }
    });
  });
  describe('validation error', () => {
    it('missing argument', () => {
      {
        const f = new ModFunction({ sheet, args: [new ValueEntity(3)] });
        expect(f.call.bind(f)).toThrow(FormulaError);
      }
      {
        const f = new ModFunction({ sheet, args: [new ValueEntity(3)] });
        expect(f.call.bind(f)).toThrow(FormulaError);
      }
    });
    it('division by zero', () => {
      const f = new ModFunction({ sheet, args: [new ValueEntity(5), new ValueEntity(0)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
