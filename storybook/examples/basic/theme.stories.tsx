import React from "react";
import { ComponentStory } from "@storybook/react";
import { constructInitialCells, GridSheet, ModeType } from "@gridsheet/react-core";

export default {
  title: "Basic",
};

type Props = {
  mode: ModeType;
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
