import { CleanFunction } from './clean';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('clean', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('removes non-printable characters', () => {
      const f = new CleanFunction({ table, args: [new ValueEntity('Hello\x07World')] });
      expect(f.call()).toBe('HelloWorld');
    });

    it('removes line breaks', () => {
      const f = new CleanFunction({ table, args: [new ValueEntity('Line\nBreak')] });
      expect(f.call()).toBe('LineBreak');
    });

    it('leaves printable characters intact', () => {
      const f = new CleanFunction({ table, args: [new ValueEntity('Hello World!')] });
      expect(f.call()).toBe('Hello World!');
    });

    it('converts numbers to string before cleaning', () => {
      const f = new CleanFunction({ table, args: [new ValueEntity(123)] });
      expect(f.call()).toBe('123');
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new CleanFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
