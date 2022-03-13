import * as functions from "./functions";
import { Function } from "./lexer";

export const call = (vs: any[]) => {
  const f: Function = vs.shift();
  const args: any[] = vs.map(v => {
    if (Array.isArray(v)) {
      return call(v);
    } else {
      return v.get();
    }
  });
  // @ts-ignore
  if (functions[f.name] == null) {
    // TODO: error
    return 0;
  }
  // @ts-ignore
  return functions[f.name](...args);
};