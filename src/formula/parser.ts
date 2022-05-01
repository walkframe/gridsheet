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
  constructor(public tokens: Token[]) {
    this.tokens = tokens;
  }
  public parse() {
    return this._parse([], 0, 0);
  }

  private get(index: number) {
    return this.tokens[index];
  }

  private _parse(exprs: any[], index: number, depth: number) {
    const stack: any[] = [];
    const start = index;
    let result: any;
    let lastOperator: undefined | Operator = undefined;
    while (this.tokens.length) {
      const token = this.get(index++);
      switch (token?.type) {
        case undefined:
          if (stack.length) {
            if (lastOperator) {
              lastOperator.right = stack.pop();
            }
          }
          return result;
        case "COMMA":
          continue;
        case "VALUE":
          const value = token.convert();
          if (result == null) {
            result = value;
          }
          stack.push(value);
          break;
        case "REF":
          stack.push(token.convert());
          break;
        case "FUNCTION": {
          const block = this._parse(
            [new Function(token.entity)],
            ++index,
            depth + 1
          );
          exprs.push(block);
          break;
        }

        case "PAREN_S": {
          const block = this._parse([], index + 1, depth + 1);
          exprs.push(block);
          break;
        }

        case "PAREN_E":
          if (depth === 0) {
            throw new FormulaError("不正なカッコ");
          }
          this.tokens.splice(start, index - start);
          return exprs;
        case "OPERATOR": {
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
          break;
        }
      }
    }
    return result;
  }
}
