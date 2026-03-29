export class FormulaError {
  public code: string;
  public message: string;
  public error?: Error;
  public readonly __gsType = 'FormulaError' as const;
  constructor(code: string, message: string, error?: Error) {
    this.code = code;
    this.message = message;
    this.error = error;
  }
  static is(obj: any): obj is FormulaError {
    return obj instanceof FormulaError || obj?.__gsType === 'FormulaError';
  }
  toString() {
    return this.code;
  }
}
