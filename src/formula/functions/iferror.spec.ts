import {IfErrorFunction} from "./iferror";
import {Table} from "../../lib/table";
import {FormulaError, Function, Range, Ref, Value} from "../evaluator";
import { functions } from "../mapping";

describe('iferror', () => {
  const table = new Table({
    numRows: 5, numCols: 5,
    cells: {A1: {value: "=100/5"}, B2: {value: "=100/0"}, C3: {value: "C3"}, D4: {value: "A2:E10"}, E5: {value: "=aaaaa"}},
  });
  table.setFunctions(functions);

  describe('normal', () => {
    it('no errors', () => {
      const f = new IfErrorFunction({
        table,
        args: [new Ref("A1"), new Value("div 0")]
      });
      expect(f.call()).toBe(20);
    });
    it('div/0 error', () => {
      const f = new IfErrorFunction({
        table,
        args: [new Ref("B2"), new Value("div 0")],
      });
      expect(f.call()).toBe("div 0");
    });
    it('reference error', () => {
      const f = new IfErrorFunction({
        table,
        args: [
          new Range("C3"),
          new Ref("A1"),
        ]});
      expect(f.call()).toBe(20);
    });
    it('range error', () => {
      const f = new IfErrorFunction({
        table,
        args: [
          new Range("A2:E20"),
        ]});
      expect(f.call()).toBe(undefined);
    });
    it('name error', () => {
      const f = new IfErrorFunction({
        table,
        args: [
          new Function("aaaaaaaaaaaaaaaaa"),
          new Function("sum", 0, [new Value(1), new Value(2), new Value(3)])
        ]});
      expect(f.call()).toBe(6);
    });
  })
  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IfErrorFunction({table, args: []});
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
