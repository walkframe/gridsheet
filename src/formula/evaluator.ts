import { a2p } from '../lib/converters';
import { Table } from '../lib/table';

type EvaluateProps = {
  table: Table;
};

// strip sharp and dollars
const getId = (idString: string, stripAbsolute = true) => {
  let id = idString.slice(1);
  if (stripAbsolute && id.startsWith('$')) {
    id = id.slice(1);
  }
  if (stripAbsolute && id.endsWith('$')) {
    id = id.slice(0, -1);
  }
  return id;
};

export class FormulaError {
  public code: string;
  public message: string;
  public error?: Error;
  constructor(code: string, message: string, error?: Error) {
    this.code = code;
    this.message = message;
    this.error = error;
  }
}

class Entity<T = any> {
  public value: T;
  constructor(value: T) {
    this.value = value;
  }
}

export class ValueEntity extends Entity {
  public evaluate() {
    return this.value;
  }
}

export class UnreferencedEntity extends Entity {
  public evaluate() {
    throw new FormulaError('#REF!', `Reference does not exist.`);
  }
}

export class InvalidRefEntity extends Entity<string> {
  public evaluate() {
    throw new FormulaError('#NAME?', `Invalid ref: ${this.value}`);
  }
}

export class RefEntity extends Entity<string> {
  constructor(value: string) {
    super(value);
  }
  public stringify() {
    return this.value.toUpperCase();
  }

  private parse(table: Table): {
    table: Table;
    ref: string;
    sheetName: string;
  } {
    if (this.value.indexOf('!') !== -1) {
      const [rawSheetName, ref] = this.value.split('!');
      const sheetName = stripSheetName(rawSheetName);
      return {
        table: table.getTableBySheetName(sheetName),
        ref: ref.toUpperCase(),
        sheetName,
      };
    }
    return {
      table,
      ref: this.value.toUpperCase(),
      sheetName: stripSheetName(table.sheetName),
    };
  }

  public evaluate({ table }: EvaluateProps): Table {
    const parsed = this.parse(table);
    if (parsed.table == null) {
      throw new FormulaError('#REF!', `Unknown sheet: ${parsed.sheetName}`);
    }
    const { y, x } = a2p(parsed.ref);
    return parsed.table.trim({ top: y, left: x, bottom: y, right: x });
  }
  public id(table: Table) {
    const parsed = this.parse(table);
    if (parsed.table == null) {
      return this.value;
    }
    const id = parsed.table.getIdByAddress(parsed.ref);
    if (id) {
      if (parsed.table === table) {
        return id;
      }
      return `#${parsed.table.sheetId}!${id}`;
    }

    return this.value;
  }
}

export class RangeEntity extends Entity<string> {
  private parse(table: Table): {
    table: Table;
    refs: string[];
    sheetName: string;
  } {
    const rawRefs = this.value.split(':');
    const refs: string[] = [];
    let sheetName = '';
    for (let i = 0; i < rawRefs.length; i++) {
      const ref = rawRefs[i];
      if (ref.indexOf('!') !== -1) {
        const [rawSheetName, rawRef] = ref.split('!');
        refs.push(rawRef.toUpperCase());
        if (i === 0) {
          sheetName = stripSheetName(rawSheetName);
          table = table.getTableBySheetName(sheetName);
        }
        if (table == null) {
          return { table, refs, sheetName };
        }
      } else {
        refs.push(ref);
      }
    }
    return { table, refs, sheetName: sheetName || table.sheetName };
  }
  public stringify() {
    return this.value.toUpperCase();
  }

  public evaluate({ table }: EvaluateProps): Table {
    const parsed = this.parse(table);
    if (parsed.table == null) {
      throw new FormulaError('#REF!', `Unknown sheet: ${parsed.sheetName}`);
    }
    const area = parsed.table.rangeToArea(parsed.refs.join(':'));
    return parsed.table.trim(area);
  }
  public idRange(table: Table) {
    const parsed = this.parse(table);
    if (parsed.table == null) {
      return this.value;
    }
    const range = parsed.refs.map((ref) => parsed.table.getIdByAddress(ref)).join(':');

    if (parsed.table === table) {
      return range;
    }
    return `#${parsed.table.sheetId}!${range}`;
  }
}

export class IdEntity extends Entity<string> {
  private parse(table: Table): { table: Table; id: string } {
    if (this.value.indexOf('!') !== -1) {
      const [tableId, id] = this.value.split('!');
      return { table: table.tables[tableId.slice(1)], id: getId(id, false) };
    }
    return { table, id: getId(this.value, false) };
  }
  public evaluate({ table }: EvaluateProps) {
    const parsed = this.parse(table);
    const { y, x } = parsed.table.getPointById(parsed.id);
    const [absY, absX] = [Math.abs(y), Math.abs(x)];
    return parsed.table.trim({
      top: absY,
      left: absX,
      bottom: absY,
      right: absX,
    });
  }
  public ref(table: Table, slideY = 0, slideX = 0) {
    const parsed = this.parse(table);
    const address = parsed.table.getAddressById(parsed.id, slideY, slideX);
    if (parsed.table.sheetId === table.sheetId) {
      return address;
    }
    return `${parsed.table.sheetPrefix()}${address}`;
  }
  public slide(table: Table, slideY = 0, slideX = 0) {
    const address = this.ref(table, slideY, slideX);
    if (address == null || address.length < 2) {
      return '#REF!';
    }
    return table.getIdByAddress(address);
  }
}

export class IdRangeEntity extends Entity<string> {
  private parse(table: Table): { table: Table; ids: string[] } {
    const range = this.value;
    if (range.indexOf('!') !== -1) {
      const [sheetId, idRange] = range.split('!');
      table = table.tables[sheetId.slice(1)];
      return { table, ids: idRange.split(':') };
    }
    return { table, ids: range.split(':') };
  }

  public evaluate({ table }: EvaluateProps): Table {
    const parsed = this.parse(table);
    const [p1, p2] = parsed.ids.map((id) => getId(id)).map((id) => parsed.table.getPointById(id));
    const [top, left, bottom, right] = [
      p1.y,
      p1.x,
      p2.y || parsed.table.getNumRows(),
      p2.x || parsed.table.getNumCols(),
    ];
    return parsed.table.trim({ top, left, bottom, right });
  }
  public range(table: Table, slideY = 0, slideX = 0) {
    const parsed = this.parse(table);
    const range = parsed.ids
      .map((id) => getId(id, false))
      .map((id) => parsed.table.getAddressById(id, slideY, slideX))
      .join(':');
    if (parsed.table.sheetId === table.sheetId) {
      return range;
    }
    return `${parsed.table.sheetPrefix()}${range}`;
  }

  public slide(table: Table, slideY = 0, slideX = 0) {
    const range = this.range(table, slideY, slideX);
    return new RangeEntity(range).idRange(table);
  }
}

export class FunctionEntity {
  public args: Expression[];
  public name: string;
  public precedence: number;
  constructor(name: string, precedence = 0, args: Expression[] = []) {
    this.name = name;
    this.precedence = precedence;
    this.args = args;
  }

  public evaluate({ table }: EvaluateProps): any {
    const name = this.name.toLowerCase();
    const Func = table.getFunction(name);
    if (Func == null) {
      throw new FormulaError('#NAME?', `Unknown function: ${name}`);
    }
    const func = new Func({ args: this.args, table });
    return func.call();
  }
}

export type Expression =
  | ValueEntity
  | RefEntity
  | RangeEntity
  | IdEntity
  | IdRangeEntity
  | FunctionEntity
  | UnreferencedEntity
  | InvalidRefEntity;

const ZERO = new ValueEntity(0);

export type TokenType =
  | 'VALUE'
  | 'REF'
  | 'RANGE'
  | 'ID'
  | 'ID_RANGE'
  | 'FUNCTION'
  | 'PREFIX_OPERATOR'
  | 'INFIX_OPERATOR'
  | 'POSTFIX_OPERATOR'
  | 'OPEN'
  | 'CLOSE'
  | 'COMMA'
  | 'SPACE'
  | 'UNREFERENCED'
  | 'INVALID_REF';

const INFIX_FUNCTION_NAME_MAP = {
  '+': 'add',
  '-': 'minus',
  '/': 'divide',
  '*': 'multiply',
  '^': 'power',
  '&': 'concat',
  '=': 'eq',
  '<>': 'ne',
  '>': 'gt',
  '>=': 'gte',
  '<': 'lt',
  '<=': 'lte',
};

const PREFIX_FUNCTION_NAME_MAP = {
  '-': 'uminus',
};

const WHITESPACE_CHARS = new Set([' ', '\n', '\r', '\t', '\f']);
const SPECIAL_CHARS = new Set([...WHITESPACE_CHARS, '+', '-', '/', '*', '^', '&', '=', '<', '>', ')', ',', '%']);

export class Token {
  type: TokenType;
  entity: any;
  precedence: number;

  constructor(type: TokenType, entity: any, precedence = 0) {
    this.type = type;
    this.entity = entity;
    this.precedence = precedence;
  }

  public length() {
    if (this.type === 'VALUE' && typeof this.entity === 'string') {
      return this.entity.length + 2;
    }
    return new String(this.entity).length;
  }

  public stringify() {
    if (this.type === 'VALUE') {
      if (typeof this.entity === 'string') {
        return `"${this.entity}"`;
      }
      if (typeof this.entity === 'boolean') {
        return this.entity ? 'TRUE' : 'FALSE';
      }
    }
    return this.entity as string;
  }

  public convert() {
    switch (this.type) {
      case 'VALUE':
        return new ValueEntity(this.entity);
      // eslint-disable-next-line no-fallthrough
      case 'ID':
        return new IdEntity(this.entity as string);
      // eslint-disable-next-line no-fallthrough
      case 'ID_RANGE':
        return new IdRangeEntity(this.entity as string);
      // eslint-disable-next-line no-fallthrough
      case 'REF':
        return new RefEntity(this.entity as string);
      // eslint-disable-next-line no-fallthrough
      case 'RANGE':
        return new RangeEntity(this.entity as string);
      // eslint-disable-next-line no-fallthrough
      case 'INFIX_OPERATOR': {
        const name = INFIX_FUNCTION_NAME_MAP[this.entity as keyof typeof INFIX_FUNCTION_NAME_MAP];
        return new FunctionEntity(name, this.precedence);
        // eslint-disable-next-line no-fallthrough
      }
      case 'PREFIX_OPERATOR': {
        const name = PREFIX_FUNCTION_NAME_MAP[this.entity as keyof typeof PREFIX_FUNCTION_NAME_MAP];
        return new FunctionEntity(name, this.precedence);
        // eslint-disable-next-line no-fallthrough
      }
      case 'FUNCTION':
        return new FunctionEntity(this.entity as string);
      // eslint-disable-next-line no-fallthrough
      case 'UNREFERENCED':
        return new UnreferencedEntity(this.entity);
      // eslint-disable-next-line no-fallthrough
      case 'INVALID_REF':
        return new InvalidRefEntity(this.entity as string);
      // eslint-disable-next-line no-fallthrough
    }
  }
}

const isWhiteSpace = (char: string) => {
  return WHITESPACE_CHARS.has(char);
};

const TOKEN_OPEN = new Token('OPEN', '('),
  TOKEN_CLOSE = new Token('CLOSE', ')'),
  TOKEN_COMMA = new Token('COMMA', ','),
  TOKEN_ADD = new Token('INFIX_OPERATOR', '+', 3),
  TOKEN_MINUS = new Token('INFIX_OPERATOR', '-', 3),
  TOKEN_UMINUS = new Token('PREFIX_OPERATOR', '-', 6),
  TOKEN_DIVIDE = new Token('INFIX_OPERATOR', '/', 4),
  TOKEN_MULTIPLY = new Token('INFIX_OPERATOR', '*', 4),
  TOKEN_POWER = new Token('INFIX_OPERATOR', '^', 5),
  TOKEN_CONCAT = new Token('INFIX_OPERATOR', '&', 4),
  TOKEN_GTE = new Token('INFIX_OPERATOR', '>=', 2),
  TOKEN_GT = new Token('INFIX_OPERATOR', '>', 2),
  TOKEN_LTE = new Token('INFIX_OPERATOR', '<=', 2),
  TOKEN_LT = new Token('INFIX_OPERATOR', '<', 2),
  TOKEN_NE = new Token('INFIX_OPERATOR', '<>', 1),
  TOKEN_EQ = new Token('INFIX_OPERATOR', '=', 1);

const BOOLS: { [s: string]: boolean } = { ['true']: true, ['false']: false };
export class Lexer {
  private index: number;
  private formula: string;
  public tokens: Token[] = [];
  public foreign: boolean = false;

  constructor(formula: string) {
    this.formula = formula;
    this.index = 0;
    this.tokens = [];
  }

  private isWhiteSpace() {
    return isWhiteSpace(this.formula[this.index]);
  }

  private next(base = 1) {
    this.index += base;
  }

  private get(base = 0) {
    const c = this.formula[this.index + base];
    return c;
  }

  private getToken(base = 0) {
    return this.tokens[this.tokens.length + base];
  }

  public getTokenIndexByCharPosition(pos: number) {
    let start = 0,
      end = 0;

    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      end = start + token.length();
      if (start <= pos && pos <= end) {
        return i;
      }
      start = end;
    }
    return -1;
  }

  public getCharPositionByTokenIndex(index: number) {
    let pos = 0;
    for (let i = 0; i < index; i++) {
      pos += this.tokens[i].length();
    }
    return pos;
  }

  public getTokenPositionRange(index: number): [number, number] {
    let start = 0,
      end = 0;
    for (let i = 0; i < index; i++) {
      start = end;
      end += this.tokens[i].length();
    }
    return [start, end];
  }

  public stringify() {
    return this.tokens.map((t) => t.stringify()).join('');
  }

  public stringifyToId(table: Table, slideY = 0, slideX = 0) {
    return this.tokens
      .map((t) => {
        switch (t.type) {
          case 'VALUE':
            if (typeof t.entity === 'number' || typeof t.entity === 'boolean') {
              return t.entity;
            }
            return `"${t.entity}"`;
          // eslint-disable-next-line no-fallthrough
          case 'ID':
            return new IdEntity(t.entity as string).slide(table, slideY, slideX);
          // eslint-disable-next-line no-fallthrough
          case 'ID_RANGE':
            return new IdRangeEntity(t.entity as string).slide(table, slideY, slideX);
          // eslint-disable-next-line no-fallthrough
          case 'REF':
            return new RefEntity(t.entity as string).id(table);
          // eslint-disable-next-line no-fallthrough
          case 'RANGE':
            return new RangeEntity(t.entity as string).idRange(table);
          // eslint-disable-next-line no-fallthrough
        }
        return t.entity;
      })
      .join('');
  }

  public stringifyToRef(table: Table) {
    return this.tokens
      .map((t) => {
        switch (t.type) {
          case 'VALUE':
            if (typeof t.entity === 'number' || typeof t.entity === 'boolean') {
              return t.entity;
            }
            return `"${t.entity}"`;
          case 'ID':
            return new IdEntity(t.entity as string).ref(table);
          case 'ID_RANGE':
            return new IdRangeEntity(t.entity as string).range(table);
        }
        return t.entity;
      })
      .join('');
  }

  public tokenize() {
    while (this.index <= this.formula.length) {
      this.skipSpaces();
      let char = this.get();
      this.next();
      switch (char) {
        case undefined:
          return;
        case '(':
          this.tokens.push(TOKEN_OPEN);
          continue;
        case ')':
          this.tokens.push(TOKEN_CLOSE);
          continue;
        case ',':
          this.tokens.push(TOKEN_COMMA);
          continue;
        case '+':
          this.tokens.push(TOKEN_ADD);
          continue;
        case '-': {
          const prev1 = this.getToken(-1)?.type;
          const prev2 = this.getToken(-2)?.type;
          if (prev1 === 'INFIX_OPERATOR' || (prev1 === 'SPACE' && prev2 === 'INFIX_OPERATOR')) {
            this.tokens.push(TOKEN_UMINUS);
          } else {
            this.tokens.push(TOKEN_MINUS);
          }
          continue;
        }
        case '/':
          this.tokens.push(TOKEN_DIVIDE);
          continue;
        case '*':
          this.tokens.push(TOKEN_MULTIPLY);
          continue;
        case '^':
          this.tokens.push(TOKEN_POWER);
          continue;
        case '&':
          this.tokens.push(TOKEN_CONCAT);
          continue;
        case '=':
          this.tokens.push(TOKEN_EQ);
          continue;
        case '>':
          if (this.get() === '=') {
            this.next();
            this.tokens.push(TOKEN_GTE);
            continue;
          }
          this.tokens.push(TOKEN_GT);
          continue;
        case '<':
          if (this.get() === '=') {
            this.next();
            this.tokens.push(TOKEN_LTE);
            continue;
          }
          if (this.get() === '>') {
            this.next();
            this.tokens.push(TOKEN_NE);
            continue;
          }
          this.tokens.push(TOKEN_LT);
          continue;
        case '"': {
          const buf = this.getString('"');
          this.tokens.push(new Token('VALUE', buf));
          continue;
        }
        case "'": {
          const buf = this.getString("'");
          char = `'${buf}'`;
          break;
        }
        case '!': {
          this.foreign = true;
          break;
          // not continue
        }
        case '%': {
          this.tokens.push(new Token('POSTFIX_OPERATOR', '%', 4));
          continue;
        }
      } // switch end
      let buf = char;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const c = this.get();
        if (c === '(') {
          this.tokens.push(new Token('FUNCTION', buf), TOKEN_OPEN);
          this.next();
          break;
        }
        if (c == null || SPECIAL_CHARS.has(c)) {
          if (buf.length === 0) {
            break;
          }
          if (buf.match(/^[+-]?(\d*[.])?\d+$/)) {
            this.tokens.push(new Token('VALUE', parseFloat(buf)));
          } else {
            const bool = BOOLS[buf.toLowerCase()];
            if (bool != null) {
              this.tokens.push(new Token('VALUE', bool));
            } else if (buf.startsWith('#')) {
              if (buf === '#REF!') {
                this.tokens.push(new Token('UNREFERENCED', buf));
              } else if (buf.indexOf(':') !== -1) {
                this.tokens.push(new Token('ID_RANGE', buf));
              } else {
                this.tokens.push(new Token('ID', buf));
              }
            } else if (buf.indexOf(':') !== -1) {
              this.tokens.push(new Token('RANGE', buf));
            } else {
              if (isNaN(buf[buf.length - 1] as unknown as number)) {
                this.tokens.push(new Token('INVALID_REF', buf));
              } else {
                this.tokens.push(new Token('REF', buf));
              }
            }
          }
          break;
        }
        buf += c;
        this.next();
      }
    }
  }
  private skipSpaces() {
    let space: string = '';
    while (this.isWhiteSpace()) {
      space += this.formula[this.index++];
    }
    if (space !== '') {
      this.tokens.push(new Token('SPACE', space));
    }
  }

  private getString(quote = '"') {
    let buf = '';
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const c = this.get();
      this.next();
      if (c == null) {
        break;
      }
      if (c === quote) {
        if (this.get() === quote) {
          // escape
          buf += quote;
          this.next();
          continue;
        } else {
          break;
        }
      } else {
        buf += c;
      }
    }
    return buf;
  }
}

export class Parser {
  public index = 0;
  public depth = 0;
  public tokens: Token[];
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }
  public build() {
    const { expr } = this.parse(false);
    return expr;
  }

  private parse(underFunction: boolean) {
    const stack: Expression[] = [];
    let lastOperator: undefined | FunctionEntity;

    const complement = (hasNext = false) => {
      if (lastOperator) {
        const outer = stack.pop();
        lastOperator.args.push(outer!);
      }
      return { hasNext, expr: stack.shift() };
    };

    while (this.tokens.length > this.index) {
      const token = this.tokens[this.index++];
      if (token.type === 'SPACE') {
        continue;
      }
      if (token.type === 'COMMA') {
        if (!underFunction) {
          throw new FormulaError('#ERROR!', 'Invalid comma');
        }
        return complement(true);
      } else if (
        token.type === 'VALUE' ||
        token.type === 'ID' ||
        token.type === 'ID_RANGE' ||
        token.type === 'REF' ||
        token.type === 'RANGE' ||
        token.type === 'UNREFERENCED' ||
        token.type === 'INVALID_REF'
      ) {
        const expr = token.convert();
        stack.push(expr!);
      } else if (token.type === 'POSTFIX_OPERATOR' && token.entity === '%') {
        const expr = stack.pop();
        if (!expr) {
          throw new FormulaError('#ERROR!', 'Missing expression before %');
        }
        const divideBy100 = new FunctionEntity('divide', 4, [expr, new ValueEntity(100)]);
        stack.push(divideBy100);
      } else if (token.type === 'FUNCTION') {
        this.index++;
        this.depth++;
        const func = token.convert() as FunctionEntity;
        stack.push(func);
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { expr, hasNext } = this.parse(true);
          if (expr) {
            func.args.push(expr);
          }
          if (!hasNext) {
            break;
          }
        }
      } else if (token.type === 'OPEN') {
        this.depth++;
        const { expr } = this.parse(false);
        stack.push(expr!);
      } else if (token.type === 'CLOSE') {
        if (this.depth-- === 0) {
          throw new FormulaError('#ERROR!', 'Unexpected end paren');
        }
        return complement();
      } else if (token.type === 'INFIX_OPERATOR') {
        const operator = token.convert() as FunctionEntity;
        let left = stack.pop();
        if (left == null) {
          if (operator.name === 'minus' || operator.name === 'add') {
            left = ZERO;
          } else {
            throw new FormulaError('#ERROR!', 'Missing left expression');
          }
        }

        if (lastOperator == null) {
          operator.args.push(left);
          stack.unshift(operator);
        } else if (operator.precedence > lastOperator.precedence) {
          operator.args.push(left);
          lastOperator.args.push(operator);
          stack.unshift(lastOperator);
        } else {
          const outer = stack.shift();
          operator.args.push(outer!);
          lastOperator.args.push(left);
          stack.unshift(operator);
        }
        lastOperator = operator;
      } else if (token.type === 'PREFIX_OPERATOR') {
        const operator = token.convert() as FunctionEntity;
        if (lastOperator) {
          lastOperator.args.push(operator);
        } else {
          stack.unshift(operator);
        }
        lastOperator = operator;
      }
    }
    return complement();
  }
}

export const absolutizeFormula = ({
  value,
  table,
  slideY = 0,
  slideX = 0,
}: {
  value: any;
  table: Table;
  slideY?: number;
  slideX?: number;
}) => {
  if (typeof value === 'string' || value instanceof String) {
    if (value.charAt(0) === '=') {
      const lexer = new Lexer(value.substring(1));
      lexer.tokenize();
      return '=' + lexer.stringifyToId(table, slideY, slideX);
    }
  }
  return value;
};

export const stripSheetName = (sheetName: string) => {
  if (sheetName.charAt(0) === "'") {
    sheetName = sheetName.slice(1);
  }
  if (sheetName.charAt(sheetName.length - 1) === "'") {
    sheetName = sheetName.slice(0, -1);
  }
  return sheetName;
};
