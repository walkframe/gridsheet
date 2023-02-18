import { rangeToArea } from "../lib/structs";
import { a2p, x2c } from "../lib/converters";
import { Table } from "../lib/table";

type EvaluateProps = {
  table: Table;
};

// strip sharp and dollars
const getId = (idString: string, stripAbsolute = true) => {
  let id = idString.slice(1);
  if (stripAbsolute && id.startsWith("$")) {
    id = id.slice(1);
  }
  if (stripAbsolute && id.endsWith("$")) {
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

export class Value extends Entity {
  public evaluate({ table }: EvaluateProps) {
    return this.value;
  }
}

export class Unreferenced extends Entity {
  public evaluate({ table }: EvaluateProps) {
    throw new FormulaError("#REF!", `Reference does not exist.`);
  }
}

export class InvalidRef extends Entity {
  public evaluate({ table }: EvaluateProps) {
    throw new FormulaError("#NAME?", `Invalid ref: ${this.value}`);
  }
}

export class Ref extends Entity {
  constructor(value: string) {
    super(value.toUpperCase());
  }
  public evaluate({ table }: EvaluateProps): Table {
    const { y, x } = a2p(this.value);
    return table.trim({ top: y, left: x, bottom: y, right: x });
  }
  public id(table: Table) {
    const id = table.getIdByAddress(this.value);
    if (id) {
      return id;
    }
    return this.value;
  }
}

export class Range extends Entity<string> {
  constructor(value: string) {
    super(value.toUpperCase());
  }
  public evaluate({ table }: EvaluateProps): Table {
    const area = rangeToArea(this.complementRange(table));
    return table.trim(area);
  }
  public idRange(table: Table) {
    return this.value
      .split(":")
      .map((ref) => table.getIdByAddress(ref))
      .join(":");
  }
  private complementRange(table: Table) {
    const cells = this.value.split(":");
    let [start = "", end = ""] = cells;
    if (!start.match(/[1-9]\d*/)) {
      start += "1";
    }
    if (!start.match(/[a-zA-Z]/)) {
      start = "A" + start;
    }
    if (!end.match(/[1-9]\d*/)) {
      end += table.getNumRows();
    }
    if (!end.match(/[a-zA-Z]/)) {
      end = x2c(table.getNumCols() + 1) + end;
    }
    return `${start}:${end}`;
  }
}

export class Id extends Entity {
  public evaluate({ table }: EvaluateProps) {
    const id = getId(this.value);
    const { y, x } = table.getPointById(id);
    return table.trim({ top: y, left: x, bottom: y, right: x });
  }
  public ref(table: Table, slideY = 0, slideX = 0) {
    return table.getAddressById(getId(this.value, false), slideY, slideX);
  }
  public slide(table: Table, slideY = 0, slideX = 0) {
    const address = this.ref(table, slideY, slideX);
    if (address == null || address.length < 2) {
      return "#REF!";
    }
    return table.getIdByAddress(address);
  }
}

export class IdRange extends Entity<string> {
  public evaluate({ table }: EvaluateProps): Table {
    const ids = this.value.split(":");
    const [p1, p2] = ids
      .map((id) => getId(id))
      .map((id) => table.getPointById(id));
    return table.trim({ top: p1.y, left: p1.x, bottom: p2.y, right: p2.x });
  }
  public range(table: Table, slideY = 0, slideX = 0) {
    return this.value
      .split(":")
      .map((id) => getId(id, false))
      .map((id) => table.getAddressById(id, slideY, slideX))
      .join(":");
  }

  public slide(table: Table, slideY = 0, slideX = 0) {
    const range = this.range(table, slideY, slideX);
    return new Range(range).idRange(table);
  }
}

export class Function {
  public args: Expression[];
  public name: string;
  public precedence: number;
  constructor(name: string, precedence = 0, args: Expression[]=[]) {
    this.name = name;
    this.precedence = precedence;
    this.args = args;
  }

  public evaluate({ table }: EvaluateProps): any {
    const name = this.name.toLowerCase();
    const Func = table.getFunction(name);
    if (Func == null) {
      throw new FormulaError("#NAME?", `Unknown function: ${name}`);
    }
    const func = new Func({ args: this.args, table });
    return func.call();
  }
}

export type Expression =
  | Value
  | Ref
  | Range
  | Id
  | IdRange
  | Function
  | Unreferenced
  | InvalidRef;

const ZERO = new Value(0);

export type TokenType =
  | "VALUE"
  | "REF"
  | "RANGE"
  | "ID"
  | "ID_RANGE"
  | "FUNCTION"
  | "PREFIX_OPERATOR"
  | "INFIX_OPERATOR"
  | "OPEN"
  | "CLOSE"
  | "COMMA"
  | "SPACE"
  | "UNREFERENCED"
  | "INVALID_REF";

const INFIX_FUNCTION_NAME_MAP = {
  "+": "add",
  "-": "minus",
  "/": "divide",
  "*": "multiply",
  "^": "power",
  "&": "concat",
  "=": "eq",
  "<>": "ne",
  ">": "gt",
  ">=": "gte",
  "<": "lt",
  "<=": "lte",
};

const PREFIX_FUNCTION_NAME_MAP = {
  "-": "uminus",
};

export class Token {
  type: TokenType;
  entity: any;
  precedence: number;

  constructor(type: TokenType, entity: any, precedence = 0) {
    this.type = type;
    this.entity = entity;
    this.precedence = precedence;
  }

  public convert() {
    switch (this.type) {
      case "VALUE":
        return new Value(this.entity);
      case "ID":
        return new Id(this.entity);
      case "ID_RANGE":
        return new IdRange(this.entity);
      case "REF":
        return new Ref(this.entity);
      case "RANGE":
        return new Range(this.entity);
      case "INFIX_OPERATOR": {
        const name =
          INFIX_FUNCTION_NAME_MAP[
            this.entity as keyof typeof INFIX_FUNCTION_NAME_MAP
          ];
        return new Function(name, this.precedence);
      }
      case "PREFIX_OPERATOR": {
        const name =
          PREFIX_FUNCTION_NAME_MAP[
            this.entity as keyof typeof PREFIX_FUNCTION_NAME_MAP
          ];
        return new Function(name, this.precedence);
      }
      case "FUNCTION":
        return new Function(this.entity);
      case "UNREFERENCED":
        return new Unreferenced(this.entity);
      case "INVALID_REF":
        return new InvalidRef(this.entity);
    }
  }
}

const isWhiteSpace = (char: string) => {
  return char === " " || char === "\n" || char === "\t";
};

const TOKEN_OPEN = new Token("OPEN", "("),
  TOKEN_CLOSE = new Token("CLOSE", ")"),
  TOKEN_COMMA = new Token("COMMA", ","),
  TOKEN_ADD = new Token("INFIX_OPERATOR", "+", 3),
  TOKEN_MINUS = new Token("INFIX_OPERATOR", "-", 3),
  TOKEN_UMINUS = new Token("PREFIX_OPERATOR", "-", 6),
  TOKEN_DIVIDE = new Token("INFIX_OPERATOR", "/", 4),
  TOKEN_MULTIPLY = new Token("INFIX_OPERATOR", "*", 4),
  TOKEN_POWER = new Token("INFIX_OPERATOR", "^", 5),
  TOKEN_CONCAT = new Token("INFIX_OPERATOR", "&", 4),
  TOKEN_GTE = new Token("INFIX_OPERATOR", ">=", 2),
  TOKEN_GT = new Token("INFIX_OPERATOR", ">", 2),
  TOKEN_LTE = new Token("INFIX_OPERATOR", "<=", 2),
  TOKEN_LT = new Token("INFIX_OPERATOR", "<", 2),
  TOKEN_NE = new Token("INFIX_OPERATOR", "<>", 1),
  TOKEN_EQ = new Token("INFIX_OPERATOR", "=", 1);

const BOOLS = { ["true"]: true, ["false"]: false };
export class Lexer {
  private index: number;
  public tokens: Token[] = [];
  private formula: string;

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

  public stringifyToId(table: Table, slideY = 0, slideX = 0) {
    return this.tokens
      .map((t) => {
        switch (t.type) {
          case "VALUE":
            if (typeof t.entity === "number" || typeof t.entity === "boolean") {
              return t.entity;
            }
            return `"${t.entity}"`;
          case "ID":
            return new Id(t.entity).slide(table, slideY, slideX);
          case "ID_RANGE":
            return new IdRange(t.entity).slide(table, slideY, slideX);
          case "REF":
            return new Ref(t.entity).id(table);
          case "RANGE":
            return new Range(t.entity).idRange(table);
        }
        return t.entity;
      })
      .join("");
  }

  public stringifyToRef(table: Table) {
    return this.tokens
      .map((t) => {
        switch (t.type) {
          case "VALUE":
            if (typeof t.entity === "number" || typeof t.entity === "boolean") {
              return t.entity;
            }
            return `"${t.entity}"`;
          case "ID":
            return new Id(t.entity).ref(table);
          case "ID_RANGE":
            return new IdRange(t.entity).range(table);
        }
        return t.entity;
      })
      .join("");
  }

  public tokenize() {
    while (this.index <= this.formula.length) {
      this.skipSpaces();
      const char = this.get();
      this.next();
      switch (char) {
        case undefined:
          return;
        case "(":
          this.tokens.push(TOKEN_OPEN);
          continue;
        case ")":
          this.tokens.push(TOKEN_CLOSE);
          continue;
        case ",":
          this.tokens.push(TOKEN_COMMA);
          continue;
        case "+":
          this.tokens.push(TOKEN_ADD);
          continue;
        case "-": {
          const prev1 = this.getToken(-1)?.type;
          const prev2 = this.getToken(-2)?.type;
          if (
            prev1 === "INFIX_OPERATOR" ||
            (prev1 === "SPACE" && prev2 === "INFIX_OPERATOR")
          ) {
            this.tokens.push(TOKEN_UMINUS);
          } else {
            this.tokens.push(TOKEN_MINUS);
          }
          continue;
        }
        case "/":
          this.tokens.push(TOKEN_DIVIDE);
          continue;
        case "*":
          this.tokens.push(TOKEN_MULTIPLY);
          continue;
        case "^":
          this.tokens.push(TOKEN_POWER);
          continue;
        case "&":
          this.tokens.push(TOKEN_CONCAT);
          continue;
        case "=":
          this.tokens.push(TOKEN_EQ);
          continue;
        case ">":
          if (this.get() === "=") {
            this.next();
            this.tokens.push(TOKEN_GTE);
            continue;
          }
          this.tokens.push(TOKEN_GT);
          continue;
        case "<":
          if (this.get() === "=") {
            this.next();
            this.tokens.push(TOKEN_LTE);
            continue;
          }
          if (this.get() === ">") {
            this.next();
            this.tokens.push(TOKEN_NE);
            continue;
          }
          this.tokens.push(TOKEN_LT);
          continue;
        case '"': {
          const buf = this.getString();
          this.tokens.push(new Token("VALUE", buf));
          continue;
        }
      } // switch end
      let buf = char;
      while (true) {
        const c = this.get();
        if (c === "(") {
          this.tokens.push(new Token("FUNCTION", buf), TOKEN_OPEN);
          this.next();
          break;
        }
        if (c == null || c.match(/[ +\-/*^&=<>),]/)) {
          if (buf.length === 0) {
            break;
          }
          if (buf.match(/^[+-]?(\d*[.])?\d+$/)) {
            this.tokens.push(new Token("VALUE", parseFloat(buf)));
          } else {
            // @ts-ignore
            const bool = BOOLS[buf.toLowerCase()];
            if (bool != null) {
              this.tokens.push(new Token("VALUE", bool));
            } else if (buf.startsWith("#")) {
              if (buf === "#REF!") {
                this.tokens.push(new Token("UNREFERENCED", buf));
              } else if (buf.indexOf(":") !== -1) {
                this.tokens.push(new Token("ID_RANGE", buf));
              } else {
                this.tokens.push(new Token("ID", buf));
              }
            } else if (buf.indexOf(":") !== -1) {
              this.tokens.push(new Token("RANGE", buf));
            } else {
              // @ts-ignore
              if (isNaN(buf[buf.length - 1])) {
                this.tokens.push(new Token("INVALID_REF", buf));
              } else {
                this.tokens.push(new Token("REF", buf));
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
    let space: string = "";
    while (this.isWhiteSpace()) {
      space += this.formula[this.index++];
    }
    if (space !== "") {
      this.tokens.push(new Token("SPACE", space));
    }
  }

  private getString() {
    let buf = "";
    while (true) {
      const c = this.get();
      this.next();
      if (c == null) {
        break;
      }
      if (c === '"') {
        if (this.get() === '"') {
          // escape
          buf += '"';
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
    let lastOperator: undefined | Function;

    const complement = (hasNext = false) => {
      if (lastOperator) {
        const outer = stack.pop();
        lastOperator.args.push(outer!);
      }
      return { hasNext, expr: stack.shift() };
    };

    while (this.tokens.length > this.index) {
      const token = this.tokens[this.index++];
      if (token.type === "SPACE") {
        continue;
      }
      if (token.type === "COMMA") {
        if (!underFunction) {
          throw new FormulaError("#ERROR!", "Invalid comma");
        }
        return complement(true);
      } else if (
        token.type === "VALUE" ||
        token.type === "ID" ||
        token.type === "ID_RANGE" ||
        token.type === "REF" ||
        token.type === "RANGE" ||
        token.type === "UNREFERENCED" ||
        token.type === "INVALID_REF"
      ) {
        const expr = token.convert();
        stack.push(expr!);
      } else if (token.type === "FUNCTION") {
        this.index++;
        this.depth++;
        const func = token.convert() as Function;
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
      } else if (token.type === "OPEN") {
        this.depth++;
        const { expr } = this.parse(false);
        stack.push(expr!);
      } else if (token.type === "CLOSE") {
        if (this.depth-- === 0) {
          throw new FormulaError("#ERROR!", "Unexpected end paren");
        }
        return complement();
      } else if (token.type === "INFIX_OPERATOR") {
        const operator = token.convert() as Function;
        let left = stack.pop();
        if (left == null) {
          if (operator.name === "minus" || operator.name === "add") {
            left = ZERO;
          } else {
            throw new FormulaError("#ERROR!", "Missing left expression");
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
      } else if (token.type === "PREFIX_OPERATOR") {
        const operator = token.convert() as Function;
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

export const convertFormulaAbsolute = ({
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
  if (typeof value === "string" || value instanceof String) {
    if (value.charAt(0) === "=") {
      const lexer = new Lexer(value.substring(1));
      lexer.tokenize();
      return "=" + lexer.stringifyToId(table, slideY, slideX);
    }
  }
  return value;
};
