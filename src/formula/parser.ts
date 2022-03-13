import { Operator } from "./lexer";

export class FormulaError {

}

export class Parser {
  constructor(public tokens: any[]) {
    this.tokens = tokens;
  }
  public parse(tokens: any[]) {
    const exprs: any[] = [];
    while (tokens.length) {
      const token = tokens.shift();
      if (token == null) {
        return exprs;
      } else if (token instanceof Operator) {
        const call = [token.toFunction(), exprs.pop()];
        exprs.push(call);
        const next2 = tokens[1];
        if (next2 instanceof Operator && token.precedence >= next2.precedence) {
          const next1 = tokens.shift();
          if (Array.isArray(next1)) {
            call.push(this.parse(next1));
          } else {
            call.push(next1);
          }
        } else {
          const rights = this.parse(tokens);
          call.push(rights.shift());
          exprs.push(...rights);
        }
      } else if (Array.isArray(token)) {
        const expr = this.parse(token);
        exprs.push(expr);
      } else {
        exprs.push(token);
      }
    }

    return exprs;
  }
}

