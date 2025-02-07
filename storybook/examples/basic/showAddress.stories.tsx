import React from "react";
import { ComponentStory } from "@storybook/react";
import { constructInitialCells, GridSheet } from "@gridsheet/react-core";

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
        initialCells={constructInitialCells({
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
