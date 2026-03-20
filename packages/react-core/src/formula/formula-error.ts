export class FormulaError {
  public code: string;
  public message: string;
  public error?: Error;
  __isFormulaError = true;
  constructor(code: string, message: string, error?: Error) {
    this.code = code;
    this.message = message;
    this.error = error;
  }
  static is(obj: any): obj is FormulaError {
    return obj instanceof FormulaError || obj?.__isFormulaError === true;
  }
  toString() {
    return this.code;
  }
}
