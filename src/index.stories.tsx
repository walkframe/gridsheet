import React from "react";
import Component from "./index";

const data = [
  ["a", "b", "c"],
  ["e", "f", "g"],
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
