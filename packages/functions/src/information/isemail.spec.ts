import { IsemailFunction } from './isemail';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('isemail', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns true for valid email', () => {
      const f = new IsemailFunction({ sheet, args: [new ValueEntity('test@example.com')] });
      expect(f.call()).toBe(true);
    });

    it('returns false for invalid email format', () => {
      const f = new IsemailFunction({ sheet, args: [new ValueEntity('test@example')] });
      expect(f.call()).toBe(false);
    });

    it('returns false for string without @', () => {
      const f = new IsemailFunction({ sheet, args: [new ValueEntity('test.example.com')] });
      expect(f.call()).toBe(false);
    });

    it('returns false for non-string types', () => {
      const f = new IsemailFunction({ sheet, args: [new ValueEntity(123)] });
      expect(f.call()).toBe(false);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IsemailFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
