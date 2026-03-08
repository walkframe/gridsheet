import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';

const description = `Returns a serial value corresponding to the current date and time.`;

export class NowFunction extends BaseFunction {
  example = 'NOW()';
  description = description;
  defs: FunctionArgumentDefinition[] = [];
  category: FunctionCategory = 'time';

  protected main() {
    return new Date();
  }
}
