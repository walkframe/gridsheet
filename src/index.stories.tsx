import React from "react";
import Component from "./index";

const data = [
  {a: 1, b: 2},
  {a: 1, b: 2},
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
