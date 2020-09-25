import React from "react";
import Component from "./index";

const data = [
  ["a", "b", "c", "d", "e"],
  ["f", "g", "h", "i", "j"],
  ["k", "l", "m", "n", "o"],
  ["p", "q", "r", "s", "t"],
  ["u", "v", "w", "x", "y"],
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
