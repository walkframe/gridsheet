import { ProperFunction } from './proper';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('proper', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('capitalizes first letter of each word', () => {
      const f = new ProperFunction({ table, args: [new ValueEntity('hello world')] });
      expect(f.call()).toBe('Hello World');
    });

    it('lowercases the rest of the word', () => {
      const f = new ProperFunction({ table, args: [new ValueEntity('hELLO wORLD')] });
      expect(f.call()).toBe('Hello World');
    });

    it('handles mixed case and symbols', () => {
      const f = new ProperFunction({ table, args: [new ValueEntity('this is 1st case!')] });
      expect(f.call()).toBe('This Is 1St Case!');
    });

    it('handles non-english characters', () => {
      const f = new ProperFunction({ table, args: [new ValueEntity('café au lait')] });
      expect(f.call()).toBe('Café Au Lait');
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new ProperFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
