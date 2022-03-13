import { Operator, Variable } from "./lexer";

export class FormulaError {

}

const flatten = (a: any[]) => {
  return a.length === 1 && Array.isArray(a[0]) ? a[0] : a;
}

export class Parser {
  constructor(public tokens: any[]) {
    this.tokens = tokens;
  }
  public parse() {
    return this._parse(this.tokens)[0];
  }

  private _parse(tokens: any[]) {
    const exprs: any[] = [];
    while (tokens.length) {
      const token = tokens.shift();
      if (token == null) {
        return exprs;
      } else if (token instanceof Operator) {
        const call = [token.toFunction(), exprs.pop() || new Variable(0)];
        exprs.push(call);
        const next2 = tokens[1];
        if (next2 instanceof Operator && token.precedence >= next2.precedence) {
          const next1 = tokens.shift();
          if (Array.isArray(next1)) {
            call.push(flatten(this._parse(next1)));
          } else {
            call.push(next1);
          }
        } else {
          const rights = this._parse(tokens);
          call.push(rights.shift());
          exprs.push(...rights);
        }
      } else if (Array.isArray(token)) {
        const expr = this._parse(token);
        exprs.push(flatten(expr));
      } else {
        exprs.push(token);
      }
    }
    return exprs;
  }
}

