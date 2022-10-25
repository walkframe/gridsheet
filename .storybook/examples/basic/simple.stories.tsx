import React from "react";
import { ComponentStory } from "@storybook/react";
import { generateInitial, GridSheet } from "../../../src";

export default {
  title: "Basic",
};

type Props = {
  numRows: number;
  numCols: number;
  defaultWidth: number;
};

const Sheet = ({ numRows, numCols, defaultWidth }: Props) => {
  return (
    <>
      <GridSheet
        initial={generateInitial({
          cells: {
            default: { width: defaultWidth },
          },
          ensured: { numRows, numCols },
        })}
      />
    </>
  );
};

const Template: ComponentStory<typeof Sheet> = (args) => <Sheet {...args} />;

export const Large = Template.bind({});
Large.args = { numRows: 1000, numCols: 100, defaultWidth: 50 };

export const Small = Template.bind({});
Small.args = { numRows: 5, numCols: 5, defaultWidth: 100 };
