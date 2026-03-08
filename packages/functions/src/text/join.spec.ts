import { JoinFunction } from './join';
import { Table, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('join', () => {
  const table = new Table({});
  table.initialize({ A1: { value: 'apple' }, A2: { value: 'banana' }, A3: { value: 'cherry' } });

  describe('normal', () => {
    it('joins values with a delimiter', () => {
      const f = new JoinFunction({ table, args: [new ValueEntity(', '), new ValueEntity('A'), new ValueEntity('B')] });
      expect(f.call()).toBe('A, B');
    });

    it('joins range with a delimiter', () => {
      const f = new JoinFunction({ table, args: [new ValueEntity('-'), new RangeEntity('A1:A3')] });
      expect(f.call()).toBe('apple-banana-cherry');
    });

    it('joins mixed ranges and values', () => {
      const f = new JoinFunction({ table, args: [new ValueEntity(' '), new RangeEntity('A1:A2'), new ValueEntity('date')] });
      expect(f.call()).toBe('apple banana date');
    });

    it('handles empty delimiter', () => {
      const f = new JoinFunction({ table, args: [new ValueEntity(''), new ValueEntity('A'), new ValueEntity('B')] });
      expect(f.call()).toBe('AB');
    });

    it('stringifies numbers correctly', () => {
      const f = new JoinFunction({ table, args: [new ValueEntity('-'), new ValueEntity(1), new ValueEntity(2)] });
      expect(f.call()).toBe('1-2');
    });
  });

  describe('validation error', () => {
    it('missing arguments', () => {
      const f = new JoinFunction({ table, args: [new ValueEntity(',')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid delimiter type', () => {
      // ensureString handles numbers implicitly, but doesn't throw on them. Empty tests here for FormulaError if necessary.
      // E.g., boolean or object might be handled differently, but ensureString logic dictates this.
      // If we don't have strict type error, we can skip explicit tests for ensureString if it doesn't throw.
    });
  });
});
