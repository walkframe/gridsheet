import { UserTable } from "../api/tables";
import * as functions from "./functions";
import { Function } from "./lexer";

export const call = (vs: any[], table: UserTable) => {
  const f: Function = vs.shift();
  const args: any[] = vs.map(v => {
    if (Array.isArray(v)) {
      return call(v, table);
    } else {
      return v.get(table);
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