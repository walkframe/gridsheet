import { rangeToArea } from "../api/matrix";
import { addressToPosition, n2a } from "../api/converters";
import { Table } from "../api/table";
import { AreaType, MatrixType } from "../types";

const getId = (idString: string) => {
  const id = Number(
    idString.startsWith("#") ? idString.substring(1) : idString
  );
  if (isNaN(id)) {
    throw new FormulaError("#ERROR!", `Formula parsing error.`);
  }
  return id;
};

export class FormulaError {
  constructor(public code: string, public message: string) {
    this.code = code;
    this.message = message;
  }
}

export class Value {
  constructor(public value?: any) {
    this.value = value;
  }
  public evaluate(base: Table) {
    return this.value;
  }
}

export class Ref {
  constructor(public value: string) {
    this.value = value.toUpperCase();
  }
  public evaluate(base: Table): Table {
    const [y, x] = addressToPosition(this.value);
    return base.trim([y, x, y, x]);
  }
  public id(base: Table) {
    const id = base.getIdByAddress(this.value);
    return `#${id}`;
  }
}

export class Id {
  constructor(public value: string) {
    this.value = value;
  }
  public evaluate(base: Table) {
    const [y, x] = base.getPositionById(getId(this.value));
    return base.trim([y, x, y, x]);
  }
  public ref(base: Table) {
    return base.getAddressById(getId(this.value));
  }
}

export class IdRange {
  constructor(public value: string) {
    this.value = value;
  }
  public evaluate(base: Table): Table {
    const ids = this.value.split(":");
    const [p1, p2] = ids.map(getId).map((id) => base.getPositionById(id));
    return base.trim([p1[0], p1[1], p2[0], p2[1]]);
  }
  public range(base: Table) {
    return this.value
      .split(":")
      .map(getId)
      .map((id) => base.getAddressById(id))
      .join(":");
  }
}

export class Range {
  constructor(public value: string) {
    this.value = value.toUpperCase();
  }
  public evaluate(base: Table): Table {
    const area = rangeToArea(this.complementRange(base));
    return base.trim(area);
  }
  public idRange(base: Table) {
    return this.value
      .split(":")
      .map((ref) => "#" + base.getIdByAddress(ref))
      .join(":");
  }
  private complementRange(base: Table) {
    const cells = this.value.split(":");
    let [start = "", end = ""] = cells;
    if (!start.match(/[1-9]\d*/)) {
      start += "1";
    }
    if (!start.match(/[a-zA-Z]/)) {
      start = "A" + start;
    }
    if (!end.match(/[1-9]\d*/)) {
      end += base.getNumRows();
    }
    if (!end.match(/[a-zA-Z]/)) {
      end = n2a(base.getNumCols() + 1) + end;
    }
    return `${start}:${end}`;
  }
}

export class Function {
  public args: Expression[];
  constructor(public name: string, public precedence = 0) {
    this.name = name;
    this.precedence = precedence;
    this.args = [];
  }

  public evaluate(base: Table): any {
    const args = this.args.map((a) => a.evaluate(base));
    const name = this.name.toLowerCase();
    const Func = base.functions[name];
    if (Func == null) {
      throw new FormulaError("#NAME?", `Unknown function: ${name}`);
    }
    const func = new Func(args, base);
    return func.call();
  }
}

export const evaluate = (formula: string, base: Table, raise = true) => {
  const lexer = new Lexer(formula);
  lexer.tokenize();
  const parser = new Parser(lexer.tokens);
  const expr = parser.build();
  try {
    return expr?.evaluate?.(base);
  } catch (e) {
    if (raise) {
      throw e;
    }
    console.error(e);
  }
};

type Expression = Value | Ref | Range | Function;

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
  | "SPACE";

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

const BOOLS = { true: true, false: false };
export class Lexer {
  private index: number;
  public tokens: Token[] = [];

  constructor(private formula: string, public base = Table) {
    this.formula = formula;
    this.index = 0;
    this.tokens = [];
    this.base = base;
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

  public stringify(to: "REF" | "ID", table: Table) {
    if (to === "ID") {
      return this.tokens
        .map((t) => {
          switch (t.type) {
            case "REF":
              return new Ref(t.entity).id(table);
            case "RANGE":
              return new Range(t.entity).idRange(table);
          }
          return t.entity;
        })
        .join("");
    }
    return this.tokens
      .map((t) => {
        switch (t.type) {
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
        case "-":
          if (
            this.tokens[this.tokens.length - 1]?.type === "INFIX_OPERATOR" ||
            (this.tokens[this.tokens.length - 1]?.type === "SPACE" &&
              this.tokens[this.tokens.length - 2]?.type === "INFIX_OPERATOR")
          ) {
            this.tokens.push(TOKEN_UMINUS);
          } else {
            this.tokens.push(TOKEN_MINUS);
          }
          continue;
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
        case '"':
          const buf = this.getString();
          this.tokens.push(new Token("VALUE", buf));
          continue;
        default: {
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
                  if (buf.indexOf(":") !== -1) {
                    this.tokens.push(new Token("ID_RANGE", buf));
                  } else {
                    this.tokens.push(new Token("ID", buf));
                  }
                } else if (buf.indexOf(":") !== -1) {
                  this.tokens.push(new Token("RANGE", buf));
                } else {
                  this.tokens.push(new Token("REF", buf));
                }
              }
              break;
            }
            buf += c;
            this.next();
          }
        }
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
  constructor(public tokens: Token[], public base = Table) {
    this.tokens = tokens;
    this.base = base;
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
        token.type === "RANGE"
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

export const solveFormula = (value: any, base: Table, raise = true) => {
  if (typeof value === "string" || value instanceof String) {
    if (value.charAt(0) === "=") {
      return evaluate(value.substring(1), base, raise);
    }
  }
  return value;
};

export const solveMatrix = (target: Table, base: Table): MatrixType => {
  const area = target.getArea();
  return target.getMatrixFlatten(area).map((row) => {
    return row.map((col) => solveFormula(col, base));
  });
};
