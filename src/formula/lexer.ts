import { cellToIndexes } from "../api/converters";
import { UserTable } from "../api/tables";

export const
  ADD = "add",
  MINUS = "minus",
  DIVIDE = "divide",
  MULTIPLY = "multiply",
  CONCATENATE = "concatenate",
  EQ = "eq",
  GT = "gt",
  LT = "lt",
  GTE = "gte",
  LTE = "lte",
  NE = "ne"
;

export class Variable {
  constructor(public data?: string | number, public ref?: string) {
    this.data = data;
    this.ref = ref;
  }
  public get(table: UserTable) {
    if (this.data != null) {
      return this.data;
    }
    if (this.ref != null) {
      const [y, x] = cellToIndexes(this.ref.toUpperCase());
      return table.get(y, x)?.value || 0;
    }
  }
}

export class Operator {
  constructor(public name: string, public symbol?: string, public precedence: number = 0) {
    this.name = name;
    this.symbol = symbol;
    this.precedence = precedence;
  }
  public toFunction() {
    return new Function(this.name);
  }
}

export class Function {
  constructor(public name: string) {
    this.name = name;
  }
}

const isWhiteSpace = (char: string) => {
  return char === " " || char === "\n" || char === "\t";
}

export class Lexer {
  private index: number;
  public whitespaces: {[s: string]: string} = {};

  constructor(private formula: string) {
    this.formula = formula;
    this.index = 0;
    this.whitespaces = {};
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

  public tokenize(tokens: any[] = []) {
    while (this.index <= this.formula.length) {
      this.skipSpaces();

      const char = this.get();
      this.next();
      switch (char) {
        case undefined:
          return tokens;
        case "(":
          tokens.push([]);
          this.tokenize(tokens[tokens.length - 1]);
          continue;
        case ")":
          return tokens;
        case ",":
          continue;
        case "+":
          tokens.push(new Operator(ADD, "+", 3));
          continue;
        case "-":
          tokens.push(new Operator(MINUS, "-", 3));
          continue;
        case "/":
          tokens.push(new Operator(DIVIDE, "/", 4));
          continue;
        case "*":
          tokens.push(new Operator(MULTIPLY, "*", 4));
          continue;
        case "&":
          tokens.push(new Operator(CONCATENATE, "&", 3));
          continue;
        case "=":
          tokens.push(new Operator(EQ, "=", 1));
          continue;
        case ">":
          if (this.get() === "=") {
            this.next();
            tokens.push(new Operator(GTE, ">=", 2));
            continue;
          }
          tokens.push(new Operator(GT, ">", 2));
          continue;
        case "<":
          if (this.get() === "=") {
            this.next();
            tokens.push(new Operator(LTE, "<=", 2));
            continue;
          }
          if (this.get() === ">") {
            this.next();
            tokens.push(new Operator(NE, "<>", 1));
            continue;
          }
          tokens.push(new Operator(LT, "<", 2));
          continue;
        case '"':
          this.next();
          const buf = this.getString();
          tokens.push(new Variable(buf));
          continue;
        default:
          {
            let buf = char;
            while (true) {
              const c = this.get();
              if (c === "(") {
                tokens.push([new Function(buf)]);
                this.next();
                this.tokenize(tokens[tokens.length - 1]);
                break;
              }
              if (c == null || c.match(/[ +-/*&=<>),]/)) {
                if (buf) {
                  const n = parseInt(buf, 10);
                  tokens.push(isNaN(n) ? new Variable(undefined, buf) : new Variable(n));
                }
                break;
              }
              buf += c;
              this.next();
            }
          }
      }
    }
    return tokens;
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
      if (this.get() === '"') {
        if (this.get(1) === '"') {
          // escape
          buf += '"';
          this.next(2);
          continue;
        } else {
          this.next();
          break;
        }
      }
    }
    return buf;
  }
}
