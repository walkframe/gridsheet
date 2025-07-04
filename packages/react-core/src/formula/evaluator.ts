import { a2p, grantAddressAbsolute, p2a } from '../lib/converters';
import { Table } from '../lib/table';
import { Id, PointType } from '../types';

type EvaluateProps = {
  table: Table;
};

export type IdentifyProps = {
  table: Table;
  slideY?: number;
  slideX?: number;
  operation?: 'move' | 'removeRows' | 'removeCols';
  dependency: string;
  idMap?: { [id: string]: string };
};

export type DisplayProps = {
  table: Table;
  slideY?: number;
  slideX?: number;
};

// strip sharp and dollars
const getId = (idString: string, stripAbsolute = true) => {
  let id = idString;
  if (stripAbsolute && id.startsWith('$')) {
    id = id.slice(1);
  }
  if (stripAbsolute && id.endsWith('$')) {
    id = id.slice(0, -1);
  }
  return id.replace('#', '');
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

  public evaluate({ table }: EvaluateProps): Table {
    const parsed = parseRef(this.value, { table, dependency: '' });
    if (parsed.table == null) {
      throw new FormulaError('#REF!', `Unknown sheet: ${parsed.sheetName}`);
    }
    if (parsed.addresses.length === 0) {
      throw new FormulaError('#REF!', `Invalid address: ${this.value}`);
    }
    const { y, x } = a2p(parsed.addresses[0]);
    return parsed.table.trim({ top: y, left: x, bottom: y, right: x });
  }

  public identify(props: IdentifyProps) {
    const { table, dependency, slideY = 0, slideX = 0 } = props;
    const parsed = parseRef(this.value, props);
    if (parsed.table == null) {
      return this.value;
    }
    const address = parsed.addresses[0];
    const { y, x, absX, absY } = a2p(address);
    const newPoint = {
      y: y + slideY,
      x: x + slideX,
      absX,
      absY,
    };
    const { id, formula } = parsed.table.getIdFormula(newPoint);
    if (id == null) {
      return this.value;
    }
    const system = table.wire.getSystem(id, table);
    table.wire.data[id]!.system = system;
    system.dependents.add(dependency);
    return `#${parsed.table.sheetId}!${formula}`;
  }
}

export class RangeEntity extends Entity<string> {
  public stringify() {
    return this.value.toUpperCase();
  }

  public evaluate({ table }: EvaluateProps): Table {
    const parsed = parseRef(this.value, { table, dependency: '' });
    if (parsed.table == null) {
      throw new FormulaError('#REF!', `Unknown sheet: ${parsed.sheetName}`);
    }
    if (parsed.addresses.length === 0) {
      throw new FormulaError('#REF!', `Invalid address: ${this.value}`);
    }
    const area = parsed.table.rangeToArea(parsed.addresses.join(':'));
    return parsed.table.trim(area);
  }
  public identify(props: IdentifyProps) {
    const { table, dependency, slideY = 0, slideX = 0 } = props;
    const parsed = parseRef(this.value, props);
    if (parsed.table == null) {
      return this.value;
    }
    const formulas: string[] = [];
    for (let i = 0; i < parsed.addresses.length; i++) {
      const address = parsed.addresses[i];
      const { y, x, absX, absY } = a2p(address);
      const newPoint = {
        y: y + slideY,
        x: x + slideX,
        absX,
        absY,
      };
      const { id, formula } = parsed.table.getIdFormula(newPoint);
      if (id == null) {
        return this.value;
      }
      const system = table.wire.getSystem(id, table);
      table.wire.data[id]!.system = system;
      system.dependents.add(dependency);
      formulas.push(formula!);
    }
    return `#${parsed.table.sheetId}!${formulas.join(':')}`;
  }
}

export class IdEntity extends Entity<string> {
  private parse(table: Table): { table: Table; id: string } {
    if (this.value.indexOf('!') !== -1) {
      const [tableId, id] = this.value.split('!'); // #id
      const sheetId = Number(tableId.slice(1));
      return { table: table.getTableBySheetId(sheetId)!, id: getId(id, false) };
    }
    return { table, id: getId(this.value, false) };
  }
  public evaluate({ table }: EvaluateProps) {
    const parsed = this.parse(table);
    if (parsed.id === '?') {
      throw new FormulaError('#REF!', `Reference does not exist`);
    }
    const { y, x } = parsed.table.getPointById(parsed.id);
    const [absY, absX] = [Math.abs(y), Math.abs(x)];
    return parsed.table.trim({
      top: absY,
      left: absX,
      bottom: absY,
      right: absX,
    });
  }
  public display({ table, slideY = 0, slideX = 0 }: DisplayProps) {
    const parsed = this.parse(table);
    const address = parsed.table.getAddressById(parsed.id, slideY, slideX);
    if (!address) {
      return '#REF!';
    }
    if (parsed.table.sheetId === table.sheetId) {
      return address;
    }
    return `${parsed.table.sheetPrefix()}${address}`;
  }
  public identify(props: IdentifyProps) {
    const { table, dependency, slideY = 0, slideX = 0 } = props;
    const address = this.display({ table, slideY, slideX });
    if (address == null || address.length < 2) {
      return '#?';
    }
    const { formula, ids } = parseRef(address, props);
    if (dependency) {
      ids.forEach((id) => {
        const system = table.wire.getSystem(id, table);
        table.wire.data[id]!.system = system;
        system.dependents.add(dependency);
      });
    }
    return formula || '#?';
  }
}

export class IdRangeEntity extends Entity<string> {
  private parse(table: Table): { table: Table; ids: string[] } {
    const range = this.value;
    if (range.indexOf('!') !== -1) {
      const [tableId, idRange] = range.split('!'); // #id
      const sheetId = Number(tableId.slice(1));
      return { table: table.getTableBySheetId(sheetId)!, ids: idRange.split(':') };
    }
    return { table, ids: range.split(':') };
  }

  public evaluate({ table }: EvaluateProps): Table {
    const parsed = this.parse(table);
    const ids = parsed.ids.map((id) => getId(id));
    const ps: PointType[] = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (id === '?') {
        throw new FormulaError('#REF!', `Reference does not exist`);
      }
      const p = parsed.table.getPointById(id);
      ps.push(p);
    }
    const [p1, p2] = ps;
    const [top, left, bottom, right] = [
      p1.y,
      p1.x,
      p2.y || parsed.table.getNumRows(),
      p2.x || parsed.table.getNumCols(),
    ];
    return parsed.table.trim({ top, left, bottom, right });
  }
  public display({ table, slideY = 0, slideX = 0 }: DisplayProps) {
    const parsed = this.parse(table);
    const range = parsed.ids
      .map((id) => getId(id, false))
      .map((id) => parsed.table.getAddressById(id, slideY, slideX) || '#REF!')
      .join(':');
    if (parsed.table.sheetId === table.sheetId) {
      return range;
    }
    return `${parsed.table.sheetPrefix()}${range}`;
  }
  public identify(props: IdentifyProps) {
    const { table, dependency, slideY = 0, slideX = 0 } = props;
    const range = this.display({ table, slideY, slideX });
    const { formula, ids } = parseRef(range, props);
    if (dependency) {
      ids.forEach((id) => {
        const system = table.wire.getSystem(id, table);
        table.wire.data[id]!.system = system;
        system.dependents.add(dependency);
      });
    }
    return formula;
  }
}

export class FunctionEntity {
  public args: Expression[];
  public name: string;
  public precedence: number;
  private origin?: PointType;
  constructor(name: string, precedence = 0, args: Expression[] = [], origin?: PointType) {
    this.name = name;
    this.precedence = precedence;
    this.args = args;
    this.origin = origin;
  }

  public evaluate({ table }: EvaluateProps): any {
    const name = this.name.toLowerCase();
    const Func = table.getFunction(name);
    if (Func == null) {
      throw new FormulaError('#NAME?', `Unknown function: ${name}`);
    }
    const func = new Func({ args: this.args, table, origin: this.origin });
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
  private origin?: PointType;

  constructor(type: TokenType, entity: any, precedence = 0, origin?: PointType) {
    this.type = type;
    this.entity = entity;
    this.precedence = precedence;
    this.origin = origin;
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

      case 'ID':
        return new IdEntity(this.entity as string);

      case 'ID_RANGE':
        return new IdRangeEntity(this.entity as string);

      case 'REF':
        return new RefEntity(this.entity as string);

      case 'RANGE':
        return new RangeEntity(this.entity as string);

      case 'INFIX_OPERATOR': {
        const name = INFIX_FUNCTION_NAME_MAP[this.entity as keyof typeof INFIX_FUNCTION_NAME_MAP];
        return new FunctionEntity(name, this.precedence);
      }
      case 'PREFIX_OPERATOR': {
        const name = PREFIX_FUNCTION_NAME_MAP[this.entity as keyof typeof PREFIX_FUNCTION_NAME_MAP];
        return new FunctionEntity(name, this.precedence);
      }
      case 'FUNCTION':
        return new FunctionEntity(this.entity as string, 0, [], this.origin);

      case 'UNREFERENCED':
        return new UnreferencedEntity(this.entity);

      case 'INVALID_REF':
        return new InvalidRefEntity(this.entity as string);
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

type LexerOption = {
  origin?: PointType;
  idMap?: { [id: Id]: Id };
};

export class Lexer {
  private index: number;
  private formula: string;
  public tokens: Token[] = [];
  public foreign: boolean = false;
  private origin?: PointType;
  private idMap: { [id: Id]: Id };

  constructor(formula: string, options?: LexerOption) {
    this.formula = formula;
    this.index = 0;
    this.tokens = [];
    if (options?.origin) {
      this.origin = options.origin;
    }

    this.idMap = options?.idMap ?? {};
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

  public getTokenIndexByCharPosition(pos: number): [number, boolean] {
    // return [index, edge]
    let start = 0,
      end = 0;

    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      end = start + token.length();
      if (start <= pos && pos <= end) {
        return [i, pos === start || pos === end];
      }
      start = end;
    }
    return [-1, false];
  }

  public getTokenPositionRange(index: number, slide = 1): [number, number] {
    let start = 0,
      end = 0;
    for (let i = 0; i < index; i++) {
      start = end;
      end += this.tokens[i].length();
    }
    return [start + slide, end + slide];
  }

  public stringify() {
    return this.tokens.map((t) => t.stringify()).join('');
  }

  public identify(props: IdentifyProps): string {
    const converted = this.tokens.map((t) => {
      switch (t.type) {
        case 'VALUE':
          if (typeof t.entity === 'number' || typeof t.entity === 'boolean') {
            return t.entity;
          }
          return `"${t.entity}"`;

        case 'ID':
          return new IdEntity(t.entity as string).identify(props);

        case 'ID_RANGE':
          return new IdRangeEntity(t.entity as string).identify(props);

        case 'REF':
          return new RefEntity(t.entity as string).identify(props);

        case 'RANGE':
          return new RangeEntity(t.entity as string).identify(props);
      }
      return t.entity;
    });
    return converted.join('');
  }

  public display({ table }: DisplayProps) {
    return this.tokens
      .map((t) => {
        switch (t.type) {
          case 'VALUE':
            if (typeof t.entity === 'number' || typeof t.entity === 'boolean') {
              return t.entity;
            }
            return `"${t.entity}"`;
          case 'ID':
            return new IdEntity(t.entity as string).display({ table });
          case 'ID_RANGE':
            return new IdRangeEntity(t.entity as string).display({ table });
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

      while (true) {
        const c = this.get();
        if (c === '(') {
          this.tokens.push(new Token('FUNCTION', buf, 0, this.origin), TOKEN_OPEN);
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
              if (buf.indexOf('#REF!') !== -1) {
                this.tokens.push(new Token('UNREFERENCED', buf));
              } else if (buf.indexOf(':') !== -1) {
                this.tokens.push(new Token('ID_RANGE', this.resolveIdRange(buf)));
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

    while (true) {
      const c = this.get();
      this.next();
      if (c == null) {
        break;
      }
      if (c === quote) {
        if (quote === '"' && this.get() === quote) {
          // escape for double quotes
          buf += quote;
          this.next();
          continue;
        } else if (quote === "'" && this.get() === quote) {
          // keep consecutive single quotes as is
          buf += c;
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

  private resolveIdRange(range: string) {
    const [sheetId, refString] = range.split('!');
    const refs = refString.split(':');
    const done = new Set<number>();

    Object.keys(this.idMap).forEach((before) => {
      const after = this.idMap[before];

      // #x -> #y, #$x -> #$y, #x$ -> #y$, #$x$ -> #$y$
      const regex = new RegExp(`(\\$)?#${before}(\\$)?`);

      for (let i = 0; i < refs.length; i++) {
        if (done.has(i)) {
          continue;
        }

        const ref = refs[i];
        const replaced = ref.replace(regex, (_, prefix, suffix) => {
          return `${prefix || ''}#${after}${suffix || ''}`;
        });
        if (replaced === ref) {
          continue;
        }

        refs[i] = replaced;
        done.add(i);
      }
    });
    return `${sheetId}!${refs.join(':')}`;
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

export const identifyFormula = (value: any, { idMap, ...props }: IdentifyProps) => {
  if (typeof value === 'string' || value instanceof String) {
    if (value.charAt(0) === '=') {
      const lexer = new Lexer(value.substring(1), { idMap });
      lexer.tokenize();
      const identified = lexer.identify(props);
      return '=' + identified;
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

export function splitRef(ref: string): { sheetName: string | undefined; addresses: string[] } {
  let sheetName: string | undefined = undefined;
  let addresses: string[] = [];

  if (ref.startsWith("'")) {
    let i = 1;
    let name = '';

    while (i < ref.length) {
      const char = ref[i];
      const nextChar = ref[i + 1];

      if (char === "'") {
        if (nextChar === "'") {
          name += "'";
          i += 2;
        } else if (nextChar === '!') {
          i += 2;
          break;
        } else {
          return { sheetName: undefined, addresses: [] };
        }
      } else {
        name += char;
        i++;
      }
    }

    sheetName = name;
    const addressPart = ref.slice(i).trim();
    addresses = addressPart.split(':');
  } else {
    const excl = ref.indexOf('!');
    if (excl !== -1) {
      sheetName = ref.slice(0, excl);
      const addressPart = ref.slice(excl + 1).trim();
      addresses = addressPart.split(':');
    } else {
      addresses = ref.trim().split(':');
    }
  }
  return { sheetName, addresses };
}

export const parseRef = (
  ref: string,
  { table, operation, dependency }: IdentifyProps,
): {
  table: Table;
  sheetId?: number;
  formula?: string;
  sheetName?: string;
  addresses: string[];
  ids: string[];
} => {
  const { sheetName, addresses } = splitRef(ref);
  const ids: string[] = [];
  if (sheetName) {
    table = table.getTableBySheetName(sheetName)!;
    if (table == null) {
      return { table, sheetName, addresses, ids };
    }
  }
  if (addresses.length === 0) {
    return { table, sheetName, addresses, ids };
  }
  const refs: string[] = [];
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    const { y, x, absX, absY } = a2p(address);
    let id = table.getId({ y, x });

    // if the id is the same as the dependency by the operation,
    // we need to adjust the id based on the operation
    if (id === dependency) {
      if (operation === 'removeRows') {
        id = table.getId({ y: y - 1, x });
      } else if (operation === 'removeCols') {
        id = table.getId({ y, x: x - 1 });
      }
    }
    if (id == null) {
      refs.push(grantAddressAbsolute(address, !!absX, !!absY) || '?');
      continue;
    }
    ids.push(id);
    refs.push(`${absX ? '$' : ''}#${id}${absY ? '$' : ''}`);
  }
  let formula = `#${table.sheetId}!${refs.join(':')}`;
  return {
    table,
    sheetName,
    addresses,
    ids,
    formula,
  };
};
