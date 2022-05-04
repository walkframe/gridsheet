import { rangeToArea } from "../api/matrix";
import { cellToIndexes } from "../api/converters";
import { UserTable } from "../api/tables";
import { mapping } from "./functions/__mapping";
import { MatrixType } from "../types";

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
  public evaluate(table: UserTable) {
    return this.data;
  }
}

export class Ref {
  constructor(public ref: string) {
    this.ref = ref.toUpperCase();
  }
  public evaluate(table: UserTable): any {
    const [y, x] = cellToIndexes(this.ref.toUpperCase());
    const result = table.get(y, x)?.value || 0;
    if (
      (typeof result === "string" || result instanceof String) &&
      result.charAt(0) === "="
    ) {
      return evaluate(result.substring(1), table);
    }
    return result;
  }
}

export class Range {
  constructor(public range: string) {
    this.range = range.toUpperCase();
  }
  public evaluate(table: UserTable): UserTable {
    const area = rangeToArea(this.range);
    return table.copy(area);
  }
}

export class Function {
  public args: Expression[];
  constructor(public name: string, public precedence = 0) {
    this.name = name;
    this.precedence = precedence;
    this.args = [];
  }

  public evaluate(table: UserTable): any {
    const args = this.args.map((a) => a.evaluate(table));
    const name = this.name.toLowerCase() as keyof typeof mapping;
    const Func = mapping[name];
    if (Func == null) {
      throw new FormulaError("NAME?", `Unknown function: ${name}`);
    }
    const func = new Func(args, table);
    return func.call();
  }
}

export const evaluate = (formula: string, table: UserTable) => {
  const lexer = new Lexer(formula);
  lexer.tokenize();
  const parser = new Parser(lexer.tokens);
  const expr = parser.build();
  return expr?.evaluate?.(table);
};

export const evaluateTable = (
  table: UserTable,
  base: UserTable
): MatrixType => {
  return table.matrixFlatten().map((row) => {
    return row.map((col) => {
      if (typeof col === "string" || col instanceof String) {
        if (col.charAt(0) === "=") {
          return evaluate(col.substring(1), base);
        }
      }
      return col;
    });
  });
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
  | "COMMA";

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

export class Lexer {
  private index: number;
  public whitespaces: { [s: string]: string } = {};
  public tokens: Token[] = [];

  constructor(private formula: string) {
    this.formula = formula;
    this.index = 0;
    this.whitespaces = {};
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

  public tokenize() {
    while (this.index <= this.formula.length) {
      this.skipSpaces();
      const char = this.get();
      this.next();
      switch (char) {
        case undefined:
          return;
        case "(":
          this.tokens.push(new Token("OPEN", char));
          continue;
        case ")":
          this.tokens.push(new Token("CLOSE", char));
          continue;
        case ",":
          this.tokens.push(new Token("COMMA", char));
          continue;
        case "+":
          this.tokens.push(new Token("OPERATOR", char, 3));
          continue;
        case "-":
          this.tokens.push(new Token("OPERATOR", char, 3));
          continue;
        case "/":
          this.tokens.push(new Token("OPERATOR", char, 4));
          continue;
        case "*":
          this.tokens.push(new Token("OPERATOR", char, 4));
          continue;
        case "&":
          this.tokens.push(new Token("OPERATOR", char, 4));
          continue;
        case "=":
          this.tokens.push(new Token("OPERATOR", char, 1));
          continue;
        case ">":
          if (this.get() === "=") {
            this.next();
            this.tokens.push(new Token("OPERATOR", ">=", 2));
            continue;
          }
          this.tokens.push(new Token("OPERATOR", ">", 2));
          continue;
        case "<":
          if (this.get() === "=") {
            this.next();
            this.tokens.push(new Token("OPERATOR", "<=", 2));
            continue;
          }
          if (this.get() === ">") {
            this.next();
            this.tokens.push(new Token("OPERATOR", "<>", 1));
            continue;
          }
          this.tokens.push(new Token("OPERATOR", "<", 2));
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
              this.tokens.push(
                new Token("FUNCTION", buf),
                new Token("OPEN", "(")
              );
              this.next();
              break;
            }
            if (c == null || c.match(/[ +-/*&=<>),]/)) {
              if (buf) {
                const n = parseInt(buf, 10);
                if (isNaN(n)) {
                  if (buf.indexOf(":") !== -1) {
                    this.tokens.push(new Token("RANGE", buf));
                  } else {
                    this.tokens.push(new Token("REF", buf));
                  }
                } else {
                  this.tokens.push(new Token("VALUE", n));
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
      this.whitespaces[this.index - space.length] = space;
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
  constructor(public tokens: Token[]) {
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

      if (token.type === "COMMA") {
        if (!underFunction) {
          throw new FormulaError("ERROR!", "Invalid comma");
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
          throw new FormulaError("ERROR!", "Unexpected end paren");
        }
        return complement();
      } else if (token.type === "OPERATOR") {
        const operator = token.convert() as Function;
        let left = stack.pop();
        if (left == null) {
          if (operator.name === "minus" || operator.name === "add") {
            left = ZERO;
          } else {
            throw new FormulaError("ERROR!", "Missing left expression");
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
