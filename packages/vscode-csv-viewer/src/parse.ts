/**
 * Minimal, dependency-free RFC-4180-ish delimited parser.
 * Handles quoted fields, escaped quotes (""), and delimiters/newlines inside
 * quotes. `delimiter` is "," for CSV or "\t" for TSV.
 */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let sawAny = false;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    sawAny = true;
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      endField();
    } else if (c === '\n') {
      endRow();
    } else if (c === '\r') {
      // swallow; \r\n handled by the following \n
    } else {
      field += c;
    }
  }

  // Flush the trailing field/row unless the file ended exactly on a newline.
  if (field.length > 0 || row.length > 0) {
    endRow();
  }
  if (!sawAny) {
    return [];
  }
  return rows;
}
