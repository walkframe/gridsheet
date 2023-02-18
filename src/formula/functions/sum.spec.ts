import {SumFunction} from "./sum";
import {Table} from "../../lib/table";
import {FormulaError, Range, Ref, Value} from "../evaluator";
import {functions} from "../mapping";

describe('sum', () => {
  const table = new Table({
    numRows: 100, numCols: 100,
    cells: {A1: {value: 5}, A2: {value: "=-(9 * 10) - 4"}, B50: {value: 25}, C15: {value: "not a number"}, C20: {value: 10}},
  });
  table.setFunctions(functions);

  describe('normal', () => {
    it('sum single values', () => {
      const f = new SumFunction({
        table,
        args: [
          new Ref("B50"),
          new Value(5),
          new Value(-3),
        ]});
      expect(f.call()).toBe(27);
    });
    it('sum range', () => {
      const f = new SumFunction({
        table,
        args: [
          new Range("A2:E20"),
          new Value(30),
        ]});
      // -90 - 4 + 10 + 30
      expect(f.call()).toBe(-54);
    });
  })
  describe('validation error', () => {
    it('missing argument', () => {
      const f = new SumFunction({table, args: []});
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
