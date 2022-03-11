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
  NE = "ne",
  COMMA = "comma"
;

export class Function {
  constructor(public name: string, public expr?: string) {
    this.name = name;
    this.expr = expr;
  }
}

export class Reference {
  constructor(public scope: string) {
    this.scope = scope;
  }
}

export class Block {
  constructor(public type: "lparen" | "rparen") {
    this.type = type;
  }
}

const isWhiteSpace = (char: string) => {
  return char === " " || char === "\n" || char === "\t";
}

export class Lexer {
  private index: number;
  public tokens: any[];
  public whitespaces: {[s: string]: string} = {};

  constructor(private formula: string) {
    this.formula = formula;
    this.index = 0;
    this.tokens = [];
    this.whitespaces = {};
  }
  public tokenize() {
    while (this.index <= this.formula.length) {
      const token = this.getToken();
      if (token != null) {
        this.tokens.push(token);
      }
    }
    return this.tokens;
  }

  private isWhiteSpace() {
    return isWhiteSpace(this.formula[this.index]);
  }

  private next(base = 1) {
    this.index += base;
  }

  private getAndNext(base = 1) {
    const c = this.formula[this.index];
    this.index += base;
    return c;
  }

  private getChar(base = 0, next=false) {
    const c = this.formula[this.index + base];
    if (next) {
      this.index += base;
    }
    return c;
  }

  private getToken() {
    let space: string = ""
    while (this.isWhiteSpace()) {
      space += this.formula[this.index++];
    }
    if (space !== "") {
      this.whitespaces[this.index - space.length] = space;
    }
    const char = this.getAndNext();
    switch (char) {
      case "(":
        return new Block("lparen");
      case ")":
        return new Block("rparen");
      case ",":
        return;
      case "+":
        return new Function(ADD, "+");
      case "-":
        return new Function(MINUS, "-");
      case "/":
        return new Function(DIVIDE, "/");
      case "*":
        return new Function(MULTIPLY, "*");
      case "&":
        return new Function(CONCATENATE, "&");
      case "=":
        return new Function(EQ, "=");
      case ">":
        if (this.getChar(1) === "=") {
          this.next();
          return new Function(GTE, ">=");
        }
        return new Function(GT, ">");
      case "<":
        if (this.getChar(1) === "=") {
          this.next();
          return new Function(LTE, "<=");
        }
        if (this.getChar(1) === ">") {
          this.next();
          return new Function(NE, "<>");
        }
        return new Function(LT, "<");
      case '"':
        let buf = this.getAndNext();
        while (true) {
          if (this.getChar() === '"') {
            if (this.getChar(1) === '"') {
              // escape
              buf += '"';
              this.next(2);
              continue;
            } else {
              this.next();
              break;
            }
          }
          buf += this.getAndNext();
        }
        return buf;
    }
    let buf = char;
    while (true) {
      const c = this.getChar();
      if (c === "(") {
        return new Function(buf);
      }
      if (c == null || c.match(/[ +-/*&=<>),]/)) {
        if (!buf) {
          return;
        }
        const n = parseInt(buf, 10);
        return isNaN(n) ? new Reference(buf) : n;
      }
      buf += c;
      this.next();
    }
  }
}
