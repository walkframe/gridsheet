import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(timezone);
dayjs.extend(utc);

const NUMS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
const NUMS_Z = new Set([...NUMS, 'Z', 'z']);
const JFMASOND = new Set(['J', 'F', 'M', 'A', 'S', 'O', 'N', 'D', ...NUMS]);
const NBRYNLGPTVC = new Set(['N', 'B', 'R', 'Y', 'N', 'L', 'G', 'P', 'T', 'V', 'C', ...NUMS_Z]);

// Reject strings that contain words not typically found in date representations.
// Date strings consist of month names, digits, separators, and timezone abbreviations.
// If a word is purely alphabetic and not a recognized date token, it's likely not a date.
const DATE_WORDS = new Set([
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'am', 'pm', 'utc', 'gmt', 'est', 'cst', 'mst', 'pst', 'jst', 'cet', 'eet', 'ist', 'aest',
  'edt', 'cdt', 'mdt', 'pdt', 'bst', 'hst', 'akst', 'akdt', 'nzst', 'nzdt',
  't', 'z',
]);

export function parseDate(value: string): Date | undefined {
  const first = value[0];
  if (first == null || !JFMASOND.has(first.toUpperCase())) {
    return;
  }
  if (!NBRYNLGPTVC.has(value[value.length - 1].toUpperCase())) {
    return;
  }
  if (value.match(/[=*&#@!?[\]{}"'()|%\\<>~+\r\n]/)) {
    return;
  }
  const words = value.split(/[\s,/\-:.]+/).filter(Boolean);
  for (const word of words) {
    if (/^[a-zA-Z]+$/.test(word) && !DATE_WORDS.has(word.toLowerCase())) {
      return;
    }
  }
  let timeZone = 'UTC';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {}
  try {
    const day = dayjs.tz(value, timeZone);
    return day.toDate();
  } catch (e) {}
}
