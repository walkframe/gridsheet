import { Policy } from '../index';
import { parseDate } from './date';

describe('parseDate', () => {
  it('returns undefined for text that only looks like a date', () => {
    for (const v of ['a1', 'ab1', 'A1', 'd1', 'n2', 'Jan', 'Mar 99x']) {
      expect(parseDate(v)).toBeUndefined();
    }
  });

  it('reads dates as wall-clock time in the local time zone', () => {
    expect(parseDate('2026-01-02')?.getTime()).toBe(new Date(2026, 0, 2).getTime());
    expect(parseDate('2026/01/02')?.getTime()).toBe(new Date(2026, 0, 2).getTime());
    expect(parseDate('2026-01-02 10:30')?.getTime()).toBe(new Date(2026, 0, 2, 10, 30).getTime());
    expect(parseDate('Jan 1 2026')?.getTime()).toBe(new Date(2026, 0, 1).getTime());
    expect(parseDate('Dec 31, 2025 23:59')?.getTime()).toBe(new Date(2025, 11, 31, 23, 59).getTime());
  });

  it('keeps an explicit offset', () => {
    expect(parseDate('2026-01-02T00:00:00Z')?.getTime()).toBe(Date.UTC(2026, 0, 2));
    expect(parseDate('2026-01-01T19:00:00-05:00')?.getTime()).toBe(Date.UTC(2026, 0, 2));
  });
});

describe('Policy.deserialize', () => {
  it('keeps text that is not a valid date as a string', () => {
    const policy = new Policy();
    expect(policy.deserialize('a1').value).toBe('a1');
    expect(policy.deserialize('ab1').value).toBe('ab1');
    const d = policy.deserialize('2026-01-02').value;
    expect(d).toBeInstanceOf(Date);
    expect((d as Date).getTime()).toBe(new Date(2026, 0, 2).getTime());
  });
});
