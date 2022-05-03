import { cellToIndexes } from "../api/converters";
import { UserTable } from "../api/tables";
import { Function, Operator, Token } from "./lexer";
export class FormulaError {
  constructor(public message: string) {
    this.message = message;
  }
}

export class Parser {
  public index = 0;
  constructor(public tokens: Token[]) {
    this.tokens = tokens;
  }
  public parse() {
    const { result } = this._parse(0, false);
    return result;
  }

  private get(index: number) {
    return this.tokens[index];
  }

  private _parse(depth: number, underFunction: boolean) {
    const stack: any[] = [];
    let result: any;
    let lastOperator: undefined | Operator = undefined;
    const pickup = () => {
      if (stack.length) {
        if (lastOperator) {
          lastOperator.right = stack.pop();
        } else if (result == null) {
          result = stack.pop();
        }
      }
    };
    while (this.tokens.length > this.index) {
      const token = this.get(this.index++);

      if (token.type === "COMMA") {
        if (!underFunction) {
          throw new FormulaError("不正なカンマ");
        }
        pickup();
        return { result, hasNext: true };
      } else if (token.type === "VALUE" || token.type === "REF") {
        const value = token.convert();
        if (result == null) {
          result = value;
        }
        stack.push(value);
      } else if (token.type === "FUNCTION") {
        this.index++;
        const func = token.convert() as Function;
        stack.push(func);
        while (true) {
          const { result: block, hasNext } = this._parse(depth + 1, true);
          if (block) {
            func.args.push(block);
          }
          if (!hasNext) {
            break;
          }
        }
      } else if (token.type === "OPEN") {
        const { result: block } = this._parse(depth + 1, false);
        stack.push(block);
      } else if (token.type === "CLOSE") {
        if (depth === 0) {
          throw new FormulaError("不正なカッコ");
        }
        pickup();

        return { result, hasNext: false };
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
    pickup();
    return { result };
  }
}
