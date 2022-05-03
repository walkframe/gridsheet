import { cellToIndexes } from "../api/converters";
import { UserTable } from "../api/tables";

export const ADD = "add",
  MINUS = "minus",
  DIVIDE = "divide",
  MULTIPLY = "multiply",
  CONCATENATE = "concatenate",
  EQ = "eq",
  GT = "gt",
  LT = "lt",
  GTE = "gte",
  LTE = "lte",
  NE = "ne";

export type TokenType =
  | "VALUE"
  | "REF"
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
  "&": "concatenate",
  "=": "eq",
  ">": "gt",
  ">=": "gte",
  "<": "lt",
  "<=": "lte",
  "<>": "ne",
};

export class Value {
  constructor(public data?: string | number) {
    this.data = data;
  }
  public get() {
    return this.data;
  }
}

export class Ref {
  constructor(public ref: string) {
    this.ref = ref;
  }
  public get(table: UserTable) {
    const [y, x] = cellToIndexes(this.ref.toUpperCase());
    return table.get(y, x)?.value || 0;
  }
}

export class Function {
  public args: any[];
  constructor(public name: string, public precedence = 0) {
    this.name = name;
    this.precedence = precedence;
    this.args = [];
  }
}

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
          this.next();
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
                  this.tokens.push(new Token("REF", buf));
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
