import React from "react";
import GridSheet from "./index";

const data = [
//  ["a", "b", "c", "d", "e"],
//  ["a", "b", "c", "d", "e"],
//  ["a", "b", "c", "d", "e"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],


];

export default {
  title: "index",
};

export const showIndex = () => (<GridSheet
  data={data}
  options={{
    // headerWidth: "50px",
    // headerHeight: "40px",
    cols: [
      { key: "B", label: "ビー"},
      { key: "D", width: "300px"},
    ],
    rows: [
      { key: 2, label: "二", style: {borderBottom: "double 4px #000000"}},
      { key: 3, height: "100px", style: { fontWeight: "bold", color: "#ff0000", backgroundColor: "rgba(255, 200, 200, 0.5)"}},
      { key: 4, label: "よん", height: "50px", verticalAlign: "bottom"},

    ],
  }}
/>);

