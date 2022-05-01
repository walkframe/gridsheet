import { cellToIndexes } from "../api/converters";
import { UserTable } from "../api/tables";
import { Operator, Token } from "./lexer";
export class FormulaError {
  constructor(public message: string) {
    this.message = message;
  }
}

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

const flatten = (a: any[]) => {
  return a.length === 1 && Array.isArray(a[0]) ? a[0] : a;
};

export class Parser {
  public index = 0;
  constructor(public tokens: Token[]) {
    this.tokens = tokens;
  }
  public parse() {
    return this._parse(0);
  }

  private get(index: number) {
    return this.tokens[index];
  }

  private _parse(depth: number) {
    const stack: any[] = [];
    let result: any;
    let lastOperator: undefined | Operator = undefined;
    while (this.tokens.length) {
      const token = this.get(this.index++);

      if (token == null) {
        if (stack.length) {
          if (lastOperator) {
            lastOperator.right = stack.pop();
          }
        }
        return result;
      } else if (token.type === "COMMA") {
        continue;
      } else if (token.type === "VALUE" || token.type === "REF") {
        const value = token.convert();
        if (result == null) {
          result = value;
        }
        stack.push(value);
      } else if (token.type === "FUNCTION") {
      } else if (token.type === "PAREN_S") {
        const block = this._parse(depth + 1);
        stack.push(block);
      } else if (token.type === "PAREN_E") {
        if (depth === 0) {
          throw new FormulaError("不正なカッコ");
        }
        if (stack.length) {
          if (lastOperator) {
            lastOperator.right = stack.pop();
          }
        }
        return result;
      } else if (token.type === "OPERATOR") {
        const left = stack.pop();
        if (left == null) {
          throw new FormulaError("aaa");
        }
        const operator = token.convert() as Operator;
        const prevOperator = lastOperator;
        lastOperator = operator;
        if (prevOperator == null) {
          operator.left = left;
          result = operator;
        } else if (operator.precedence > prevOperator.precedence) {
          operator.left = left;
          prevOperator.right = operator;
          result = prevOperator;
        } else {
          operator.left = result;
          prevOperator.right = left;
          result = operator;
        }
      }
    }
    return result;
  }
}
