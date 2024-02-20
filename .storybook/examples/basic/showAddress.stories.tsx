import React from "react";
import { ComponentStory } from "@storybook/react";
import { generateInitial, GridSheet } from "../../../src";

export default {
  title: "Basic",
};

type Props = {
  showAddress: boolean;
};

const Sheet = ({ showAddress }: Props) => {
  return (
    <>
      <GridSheet
        initialCells={generateInitial({
          ensured: { numRows: 100, numCols: 100 },
        })}
        options={{ showAddress }}
      />
    </>
  );
};

const Template: ComponentStory<typeof Sheet> = (args) => <Sheet {...args} />;

export const ShowAddress = Template.bind({});
ShowAddress.args = { showAddress: true };
