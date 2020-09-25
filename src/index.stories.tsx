import React from "react";
import Component from "./index";

const data = [
  ["a", "b", "c"],
  ["d", "e", "f"],
  ["g", "h", "i"],
  ["j", "k", "l"],
  ["m", "n", "o"],
];

const props = {
  data,

};

export default {
  title: "index",
};

export const showIndex = () => (<Component 
  {...props}
/>);
