import { Token } from "./lexer";
import { Value, Function, Expression, FormulaError } from "./evaluator";

const ZERO = new Value(0);

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
      } else if (token.type === "VALUE" || token.type === "REF") {
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
