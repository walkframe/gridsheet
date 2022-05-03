import { Function, Operator, Token } from "./lexer";
export class FormulaError {
  constructor(public code: string, public message: string) {
    this.code = code;
    this.message = message;
  }
}

export class Parser {
  public index = 0;
  constructor(public tokens: Token[]) {
    this.tokens = tokens;
  }
  public build() {
    const { expr } = this.parse(false);
    return expr;
  }

  private parse(underFunction: boolean) {
    const stack: any[] = [];
    let lastOperator: undefined | Operator;

    const complement = (hasNext = false) => {
      if (lastOperator) {
        lastOperator.right = stack.pop();
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
      } else if (token.type === "VALUE" || token.type === "REF") {
        const expr = token.convert();
        stack.push(expr);
      } else if (token.type === "FUNCTION") {
        this.index++;
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
        const { expr } = this.parse(false);
        stack.push(expr);
      } else if (token.type === "CLOSE") {
        return complement();
      } else if (token.type === "OPERATOR") {
        const left = stack.pop();
        if (left == null) {
          throw new FormulaError("ERROR!", "Missing left expression");
        }
        const operator = token.convert() as Operator;
        if (lastOperator == null) {
          operator.left = left;
          stack.unshift(operator);
        } else if (operator.precedence > lastOperator.precedence) {
          operator.left = left;
          lastOperator.right = operator;
          stack.unshift(lastOperator);
        } else {
          operator.left = stack.shift();
          lastOperator.right = left;
          stack.unshift(operator);
        }
        lastOperator = operator;
      }
    }
    return complement();
  }
}
