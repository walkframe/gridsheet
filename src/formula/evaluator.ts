import { rangeToArea } from "../api/matrix";
import { cellToIndexes } from "../api/converters";
import { UserTable } from "../api/table";
import { AreaType, MatrixType } from "../types";

export class FormulaError {
  constructor(public code: string, public message: string) {
    this.code = code;
    this.message = message;
  }
}

export class Value {
  constructor(public data?: any) {
    this.data = data;
  }
  public evaluate(base: UserTable) {
    return this.data;
  }
}

export class Ref {
  constructor(public ref: string) {
    this.ref = ref.toUpperCase();
  }
  public evaluate(base: UserTable): UserTable {
    const [y, x] = cellToIndexes(this.ref);
    return base.copy([y, x, y, x]);
  }
}

export class Range {
  constructor(public range: string) {
    this.range = range.toUpperCase();
  }
  public evaluate(base: UserTable): UserTable {
    const area = rangeToArea(base.complementRange(this.range));
    return base.copy(area);
  }
}

export class Function {
  public args: Expression[];
  constructor(public name: string, public precedence = 0) {
    this.name = name;
    this.precedence = precedence;
    this.args = [];
  }

  public evaluate(base: UserTable): any {
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

export const evaluate = (formula: string, base: UserTable, raise = true) => {
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
  | "FUNCTION"
  | "OPERATOR"
  | "OPEN"
  | "CLOSE"
  | "COMMA"
  | "SPACE";

const FUNCTION_NAME_MAP = {
  "+": "add",
  "-": "minus",
  "/": "divide",
  "*": "multiply",
  "&": "concat",
  "=": "eq",
  "<>": "ne",
  ">": "gt",
  ">=": "gte",
  "<": "lt",
  "<=": "lte",
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
      case "REF":
        return new Ref(this.entity);
      case "RANGE":
        return new Range(this.entity);
      case "OPERATOR": {
        const name =
          FUNCTION_NAME_MAP[this.entity as keyof typeof FUNCTION_NAME_MAP];
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
  TOKEN_ADD = new Token("OPERATOR", "+", 3),
  TOKEN_MINUS = new Token("OPERATOR", "-", 3),
  TOKEN_DIVIDE = new Token("OPERATOR", "/", 4),
  TOKEN_MULTIPLY = new Token("OPERATOR", "*", 4),
  TOKEN_CONCAT = new Token("OPERATOR", "&", 4),
  TOKEN_GTE = new Token("OPERATOR", ">=", 2),
  TOKEN_GT = new Token("OPERATOR", ">", 2),
  TOKEN_LTE = new Token("OPERATOR", "<=", 2),
  TOKEN_LT = new Token("OPERATOR", "<", 2),
  TOKEN_NE = new Token("OPERATOR", "<>", 1),
  TOKEN_EQ = new Token("OPERATOR", "=", 1);

const BOOLS = { true: true, false: false };
export class Lexer {
  private index: number;
  public tokens: Token[] = [];

  constructor(private formula: string, public base=UserTable) {
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
          this.tokens.push(TOKEN_MINUS);
          continue;
        case "/":
          this.tokens.push(TOKEN_DIVIDE);
          continue;
        case "*":
          this.tokens.push(TOKEN_MULTIPLY);
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
            if (c == null || c.match(/[ +\-/*&=<>),]/)) {
              if (buf) {
                if (buf.match(/^[+-]?(\d*[.])?\d+$/)) {
                  this.tokens.push(new Token("VALUE", parseFloat(buf)));
                } else {
                  // @ts-ignore
                  const bool = BOOLS[buf.toLowerCase()];
                  if (bool != null) {
                    this.tokens.push(new Token("VALUE", bool));
                  } else if (buf.indexOf(":") !== -1) {
                    this.tokens.push(new Token("RANGE", buf));
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
  constructor(public tokens: Token[], public base=UserTable) {
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
      } else if (token.type === "OPERATOR") {
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
      }
    }
    return complement();
  }
}

export const solveFormula = (value: any, base: UserTable, raise = true) => {
  if (typeof value === "string" || value instanceof String) {
    if (value.charAt(0) === "=") {
      return evaluate(value.substring(1), base, raise);
    }
  }
  return value;
};

export const solveMatrix = (
  target: UserTable,
  base: UserTable,
  area?: AreaType
): MatrixType => {
  if (area == null) {
    area = target.getWholeArea();
  }
  return target.matrixFlatten(area).map((row) => {
    return row.map((col) => solveFormula(col, base));
  });
};
