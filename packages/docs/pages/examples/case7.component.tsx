'use client';

import * as React from 'react';
import { GridSheet, buildInitialCells, useConnector, useHub, Policy, PolicyMixinType } from '@gridsheet/react-core';

// Policy for Priority column
const PriorityPolicy: PolicyMixinType = {
  validate: (props: any) => {
    const { patch } = props;
    if (patch?.style) {
      return {
        ...patch,
        style: {
          ...patch.style,
          fontWeight: 'bold',
        },
      };
    }
    return patch;
  },
};

// Virtual user data
const virtualUsers = [
  { id: 'alice', name: 'Alice', color: '#3498db', avatar: '👩‍💼' },
  { id: 'bob', name: 'Bob', color: '#e74c3c', avatar: '👨‍💻' },
  { id: 'charlie', name: 'Charlie', color: '#27ae60', avatar: '👨‍🎨' },
  { id: 'diana', name: 'Diana', color: '#f39c12', avatar: '👩‍🔬' },
];

export default function RealTimeCollaboration() {
  const connector = useConnector();
  const [activityLog, setActivityLog] = React.useState<
    Array<{
      user: string;
      action: string;
      timestamp: string;
      cell?: string;
    }>
  >([]);
  const [userCursors, setUserCursors] = React.useState<Record<string, { row: number; col: number }>>({
    alice: { row: 1, col: 1 },
    bob: { row: 2, col: 3 },
    charlie: { row: 4, col: 2 },
    diana: { row: 3, col: 4 },
  });

  const hub = useHub({
    labelers: {
      value: (n: number) => 'Value',
      label: (n: number) => 'Label',
    },
    policies: {
      priority: new Policy({ mixins: [PriorityPolicy] }),
    },
  });

  // Add to activity log
  const addActivity = React.useCallback((user: string, action: string, cell?: string) => {
    setActivityLog((prev) => [
      {
        user,
        action,
        timestamp: new Date().toLocaleTimeString(),
        cell,
      },
      ...prev.slice(0, 9),
    ]); // Keep latest 10 items
  }, []);

  // Simulate virtual user actions
  React.useEffect(() => {
    const actions = [
      { action: 'edited cell', cell: undefined, weight: 8 }, // Increase edit weight
      { action: 'moved cursor to', cell: undefined, weight: 1 },
      { action: 'added comment', cell: undefined, weight: 0.5 },
      { action: 'changed format', cell: undefined, weight: 0.5 },
    ];

    const simulateUserAction = () => {
      // Add possibility of multiple users acting simultaneously
      const numUsersToAct = Math.random() < 0.15 ? 2 : 1; // 15% chance of 2 users simultaneously (adjusted probability)

      for (let i = 0; i < numUsersToAct; i++) {
        const randomUser = virtualUsers[Math.floor(Math.random() * virtualUsers.length)];

        // Determine action using weighted random selection
        const totalWeight = actions.reduce((sum, action) => sum + action.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedAction = actions[0];

        for (const action of actions) {
          random -= action.weight;
          if (random <= 0) {
            selectedAction = action;
            break;
          }
        }

        // Update cursor position randomly
        const newRow = Math.floor(Math.random() * 5) + 2; // Rows 2-6 (excluding header)
        const newCol = Math.floor(Math.random() * 5) + 1; // Columns 1-5 (removed assignee column)

        setUserCursors((prev) => ({
          ...prev,
          [randomUser.id]: { row: newRow, col: newCol },
        }));

        // If edit action, actually edit the cell after 1 second
        if (selectedAction.action === 'edited cell' && connector.current) {
          setTimeout(() => {
            if (connector.current) {
              const { tableManager } = connector.current;
              const { table: table, sync } = tableManager;
              const cellAddress = `${String.fromCharCode(64 + newCol)}${newRow}`;

              // Select appropriate data based on column
              let newValue: string;
              switch (newCol) {
                case 1: // Project column
                  newValue = [
                    'Website Redesign',
                    'Mobile App',
                    'Database Migration',
                    'API Integration',
                    'UI/UX Design',
                    'Frontend Refactor',
                    'Backend API',
                    'DevOps Setup',
                    'Testing Suite',
                    'Documentation',
                  ][Math.floor(Math.random() * 10)];
                  break;
                case 2: // Status column
                  newValue = [
                    'In Progress',
                    'Planning',
                    'Completed',
                    'Testing',
                    'Review',
                    'On Hold',
                    'Blocked',
                    'Ready for QA',
                    'Deployed',
                    'Archived',
                  ][Math.floor(Math.random() * 10)];
                  break;
                case 3: // Due Date column
                  const dates = [
                    '2024-02-15',
                    '2024-02-20',
                    '2024-02-25',
                    '2024-03-01',
                    '2024-03-05',
                    '2024-03-10',
                    '2024-03-15',
                    '2024-03-20',
                    '2024-03-25',
                    '2024-04-01',
                  ];
                  newValue = dates[Math.floor(Math.random() * dates.length)];
                  break;
                case 4: // Progress column
                  const progress = ['10%', '25%', '50%', '75%', '90%', '100%', '15%', '35%', '60%', '80%'];
                  newValue = progress[Math.floor(Math.random() * progress.length)];
                  break;
                case 5: // Priority column
                  newValue = ['High', 'Medium', 'Low', 'Critical', 'Urgent', 'Normal'][Math.floor(Math.random() * 6)];
                  break;
                default:
                  newValue = 'Updated';
              }

              // Update the cell
              table.update({
                diff: { [cellAddress]: { value: newValue } },
              });
              sync(table);

              addActivity(randomUser.name, 'edited cell', cellAddress);
            }
          }, 1000);
        } else {
          addActivity(randomUser.name, selectedAction.action, selectedAction.cell);
        }
      }
    };

    const intervalId = setInterval(simulateUserAction, 1200); // Action every 1.2 seconds (adjusted frequency)
    return () => clearInterval(intervalId);
  }, [addActivity, connector]);

  // Get current user (simulate authentication)
  const getCurrentUser = () => {
    if (!connector.current) {
      return null;
    }
    const { tableManager } = connector.current;
    const { table: table } = tableManager;
    // Simulate getting current user from table context
    return virtualUsers[0]; // For demo, always return Alice
  };

  return (
    <div
      style={{
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Main grid */}
        <div>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* User cursor overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              {Object.entries(userCursors).map(([userId, pos]) => {
                const user = virtualUsers.find((u) => u.id === userId);
                if (!user || !connector.current) {
                  return null;
                }

                const { tableManager } = connector.current;
                const { table: table } = tableManager;
                const position = pos as { row: number; col: number };

                // Get actual column width and row height
                const columnWidths = table.getRectSize({
                  top: 1,
                  left: 1,
                  bottom: 1,
                  right: position.col,
                });

                const rowHeights = table.getRectSize({
                  top: 1,
                  left: 1,
                  bottom: position.row,
                  right: 1,
                });

                // Get current cell width and height
                const currentColWidth = table.getCellByPoint({ y: 0, x: position.col })?.width || 120;
                const currentRowHeight = table.getCellByPoint({ y: position.row, x: 0 })?.height || 40;

                // Get header width and height
                const headerWidth = table.headerWidth;
                const headerHeight = table.headerHeight;

                // Calculate position to center the cell
                const x = columnWidths.width + headerWidth + currentColWidth / 2 - 10;
                const y = rowHeights.height + headerHeight + currentRowHeight / 2 - 10;

                return (
                  <div
                    key={userId}
                    style={{
                      position: 'absolute',
                      left: x,
                      top: y,
                      width: 20,
                      height: 20,
                      backgroundColor: user.color,
                      borderRadius: '50%',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: 'white',
                      fontWeight: 'bold',
                      animation: 'pulse 2s infinite',
                    }}
                    title={`${user.name} is here`}
                  >
                    {user.avatar}
                  </div>
                );
              })}
            </div>

            <GridSheet
              connector={connector}
              hub={hub}
              initialCells={buildInitialCells({
                matrices: {
                  A1: [
                    ['Project', 'Status', 'Due Date', 'Progress', 'Priority'],
                    ['Website Redesign', 'In Progress', '2024-02-15', '75%', 'High'],
                    ['Mobile App', 'Planning', '2024-03-01', '25%', 'Medium'],
                    ['Database Migration', 'Completed', '2024-01-30', '100%', 'Low'],
                    ['API Integration', 'Testing', '2024-02-20', '90%', 'High'],
                    ['UI/UX Design', 'Review', '2024-02-10', '60%', 'Medium'],
                  ],
                },
                cells: {
                  default: {
                    width: 120,
                    height: 40,
                  },
                  0: { height: 32, width: 30 }, // Header row height
                  A: { width: 150 }, // Project column wider
                  B: { width: 100 }, // Status column narrower
                  C: { width: 120 }, // Due Date column
                  D: { width: 80 }, // Progress column narrower
                  E: { width: 100 }, // Priority column
                  'A1:E1': {
                    style: {
                      backgroundColor: '#34495e',
                      color: 'white',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    },
                  },
                  'E2:E6': {
                    style: {
                      textAlign: 'center',
                      fontWeight: 'bold',
                    },
                    policy: 'priority',
                  },
                },
              })}
              options={{
                sheetWidth: typeof window !== 'undefined' ? Math.min(800, window.innerWidth - 60) : 800,
                sheetHeight: 300,
              }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Activity feed */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e9ecef',
              flex: 1,
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#2c3e50' }}>📝 Activity Feed</h3>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}
            >
              {activityLog.map((activity, index) => {
                const user = virtualUsers.find((u) => u.name === activity.user);
                return (
                  <div
                    key={index}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                      borderLeft: `3px solid ${user?.color || '#666'}`,
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: user?.color }}>
                      {user?.avatar} {activity.user}
                    </div>
                    <div style={{ color: '#666' }}>
                      {activity.action}
                      {activity.cell && ` ${activity.cell}`}
                    </div>
                    <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>{activity.timestamp}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
