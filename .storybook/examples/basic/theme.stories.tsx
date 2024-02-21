import React from "react";
import { ComponentStory } from "@storybook/react";
import { constructInitialCells, GridSheet } from "../../../src";
import { Mode } from "../../../src/types";

export default {
  title: "Basic",
};

type Props = {
  mode: Mode;
};

const Sheet = ({ mode }: Props) => {
  return (
    <>
      <GridSheet
        initialCells={constructInitialCells({
          ensured: { numRows: 10, numCols: 10 },
        })}
        options={{ mode }}
      />
    </>
  );
};

const Template: ComponentStory<typeof Sheet> = (args) => <Sheet {...args} />;

export const Dark = Template.bind({});
Dark.args = { mode: "dark" };
