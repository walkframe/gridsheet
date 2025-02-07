import * as React from "react";
import {
  GridSheet,
  Renderer,
  Parser,
  MatrixType,
  constructInitialCells,
  aa2oa, RendererMixinType, ParserMixinType, CheckboxRendererMixin,
} from "@gridsheet/react-core";

export default {
  title: "Demo",
};

const ListRendererMixin: RendererMixinType = {
  array(value: any[]) {
    return (
      <ul>
        {value.map((v, i) => (
          <li key={i}>{v}</li>
        ))}
      </ul>
    );
  },
  stringify({ value }: { value: any[] }): string {
    if (Array.isArray(value)) {
      return value.join("\n");
    }
    return String(value) || "";
  }
}

const ListParserMixin: ParserMixinType = {
  functions: [
    (value: string) => value.split(/\n/g),
  ],
}

const initialData: MatrixType = [
  [true, "Ichiro", "Baseball player", ["Curry Rice", "Baseball"]],
  [true, "Jiro", "Ramen shop owner", ["Ramen"]],
  [true, "Saburo", "Singer", ["Song"]],
  [true, "Shiro", "Sword master", ["Christianity"]],
  [true, "Goro", "Solo proprietorship", ["Eating alone"]],
];

export function SecondDemo() {
  const [tsv, setTsv] = React.useState("");

  return (
    <div className="example-app">
      <h1>Sloppy data</h1>
      <GridSheet
        initialCells={constructInitialCells({
          matrices: { A1: initialData },
          cells: {
            default: { height: 100 },
            A: { width: 50, renderer: "checkbox", alignItems: "center", justifyContent: "center" },
            C: { width: 200 },
            D: { width: 400, renderer: "list", parser: "list" },
          },
        })}
        options={{
          headerHeight: 30,
          sheetWidth: 600,
          sheetHeight: 600,

          renderers: {
            checkbox: new Renderer({mixins: [CheckboxRendererMixin]}),
            list: new Renderer({mixins: [ListRendererMixin]}),
          },
          parsers: {
            list: new Parser({mixins: [ListParserMixin]}),
          },
          onSave: (table) => {
            const matrix = table.getMatrixFlatten({});
            const filtered = matrix
              .filter((row) => row[0])
              .map((row) => row.slice(1));
            setTsv(filtered.map((cols) => cols.join("\t")).join("\n"));
          },
          onChange: (table) => {
            const matrix = table.getMatrixFlatten({});
            if (matrix != null) {
              console.log(
                "data onchange:",
                matrix && aa2oa(matrix, ["name", "occupation", "memo"])
              );
            }
            const diff = table.getObjectFlatten({
              filter: (cell) =>
                !!cell?.changedAt &&
                cell.changedAt > table.lastChangedAt!,
            });
            console.log("onchange diff:", diff);
          },
        }}
      />
      <p>TSV: (Ctrl+s to update)</p>
      <textarea
        placeholder="Inactive rows will be ommited"
        value={tsv}
        style={{ width: "100%", minHeight: "200px" }}
      ></textarea>
    </div>
  );
}
