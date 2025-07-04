import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, useConnector, useHub } from '@gridsheet/react-core';
import type { FeedbackType } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Control/OnSelect',
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo demonstrates the onSelect event handling in GridSheet.',
  'It shows how to monitor cell selection changes in real-time, including single cell selection and range selection.',

  '## How it works',
  'The interface includes a live selection viewer that updates as you interact with the grid.',
  '1. The onSelect callback is triggered whenever the selection changes.',
  '2. Single cell selection shows the pointing coordinates.',
  '3. Range selection shows both the start and end points of the selection.',
  '4. The selection information is displayed in real-time.',
].join('\n\n');

const SheetOnSelectComponent: React.FC = () => {
  const [selectionInfo, setSelectionInfo] = React.useState<any>({});
  const connector = useConnector();

  const handleSelect: FeedbackType = React.useCallback(({ table, points }) => {
    if (points) {
      console.log('onSelect', {
        pointing: points.pointing,
        selectingFrom: points.selectingFrom,
        selectingTo: points.selectingTo,
      });
      setSelectionInfo({
        pointing: points.pointing,
        selectingFrom: points.selectingFrom,
        selectingTo: points.selectingTo,
        isRange: points.selectingFrom.y !== points.selectingTo.y || points.selectingFrom.x !== points.selectingTo.x,
      });
    }
  }, []);

  const hub = useHub({
    onSelect: handleSelect,
  });

  return (
    <>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <GridSheet
            connector={connector}
            hub={hub}
            initialCells={buildInitialCells({
              matrices: {
                A1: [
                  [1, 2, 3, 4, 5],
                  [6, 7, 8, 9, 10],
                  [11, 12, 13, 14, 15],
                  [16, 17, 18, 19, 20],
                ],
              },
              cells: {
                default: {
                  width: 60,
                  height: 30,
                },
                E: {
                  style: { backgroundColor: '#ddf' },
                },
              },
              ensured: {
                numRows: 20,
                numCols: 10,
              },
            })}
            options={{
              sheetWidth: 400,
              sheetHeight: 300,
            }}
          />
          <div style={{ marginTop: '20px' }}>
            <h3>Selection Information:</h3>
            <div
              style={{
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px',
              }}
            >
              <div>
                <strong>Current Cell:</strong>{' '}
                {selectionInfo.pointing ? `(${selectionInfo.pointing.y}, ${selectionInfo.pointing.x})` : 'None'}
              </div>
              <div>
                <strong>Selection Type:</strong> {selectionInfo.isRange ? 'Range Selection' : 'Single Cell'}
              </div>
              {selectionInfo.isRange && (
                <>
                  <div>
                    <strong>From:</strong> ({selectionInfo.selectingFrom?.y}, {selectionInfo.selectingFrom?.x})
                  </div>
                  <div>
                    <strong>To:</strong> ({selectionInfo.selectingTo?.y}, {selectionInfo.selectingTo?.x})
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const SheetOnSelect: StoryObj = {
  render: () => <SheetOnSelectComponent />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
