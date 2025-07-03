import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import {
  GridSheet,
  buildInitialCells,
  useHub,
  useTableRef,
  useStoreRef,
  Policy,
  PolicyMixinType,
} from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Demo/Case7',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  'This demo showcases a real-time collaboration interface built with GridSheet.',
  'It simulates multiple users working on the same spreadsheet simultaneously.',
].join('\n\n');

const HOW_IT_WORKS = [
  '1. 👥 Multiple virtual users are shown with different colored cursors.',
  '2. ⚡ Changes appear in real-time with user attribution.',
  '3. 📝 Activity feed shows recent edits and user actions.',
  '4. 👤 User presence indicators show who is currently active.',
  '5. 📋 Priority column uses policy to maintain bold formatting.',
  '',
  '## Implementation Guide',
  '',
  '### 👥 Real-time Collaboration Overview',
  'This comprehensive real-time collaboration interface demonstrates how GridSheet can be used to create collaborative spreadsheet applications. The implementation includes user presence tracking, real-time updates, activity logging, and conflict resolution mechanisms.',
  '',
  '### 👤 User Presence Management',
  'Implement user presence tracking with visual indicators including colored cursors, avatars, and status indicators. Track user activity, cursor positions, and online status. Provide real-time updates of user presence across all connected clients.',
  '',
  '### ⚡ Real-time Data Synchronization',
  'Create real-time data synchronization that propagates changes across all connected users. Implement efficient update mechanisms, conflict resolution, and data consistency. Handle network latency and connection issues gracefully.',
  '',
  '### 📝 Activity Logging System',
  'Develop a comprehensive activity logging system that tracks all user actions including edits, cursor movements, and formatting changes. Display activity feed with timestamps, user attribution, and action descriptions. Implement activity filtering and search capabilities.',
  '',
  '### 🎨 Visual User Attribution',
  'Implement visual user attribution for all changes including color-coded highlights, user avatars, and change indicators. Provide clear visual feedback for which user made specific changes. Include temporary highlighting for recent edits.',
  '',
  '### 📋 Policy-Based Formatting',
  'Use policies to maintain consistent formatting across collaborative editing sessions. Implement automatic formatting rules, style inheritance, and conflict resolution for formatting changes. Ensure data integrity while allowing collaborative styling.',
  '',
  '### ⚔️ Conflict Resolution',
  'Implement robust conflict resolution mechanisms for simultaneous edits. Handle edit conflicts, data merging, and version control. Provide user feedback for conflicts and resolution options.',
  '',
  '### ⚡ Performance Optimization',
  'Optimize performance for real-time collaboration with multiple users. Implement efficient update batching, change compression, and selective synchronization. Consider bandwidth limitations and connection quality.',
  '',
  '### 🎨 User Interface Design',
  'Design collaborative interfaces that clearly show user presence and activity. Include user lists, activity feeds, and collaboration controls. Implement intuitive visual indicators for different types of user activity.',
  '',
  '### 🌐 Network Communication',
  'Implement efficient network communication for real-time updates. Use WebSocket connections, message queuing, and connection management. Handle reconnection scenarios and offline editing capabilities.',
  '',
  '### ✅ Best Practices',
  '1. **Data Consistency**: Ensure data consistency across all connected users',
  '2. **User Experience**: Provide clear visual feedback for all collaborative actions',
  '3. **Performance**: Optimize for real-time updates and multiple concurrent users',
  '4. **Conflict Resolution**: Implement robust conflict resolution mechanisms',
  '5. **Network Resilience**: Handle network issues and connection problems gracefully',
  '6. **Security**: Implement proper authentication and authorization for collaborative features',
  '7. **Scalability**: Design for multiple concurrent users and large datasets',
  '',
  '### 🎯 Common Use Cases',
  '- **Team Collaboration**: Real-time team spreadsheet editing',
  '- **Project Management**: Collaborative project tracking and planning',
  '- **Financial Modeling**: Multi-user financial analysis and modeling',
  '- **Data Entry**: Collaborative data entry and validation',
  '- **Documentation**: Real-time collaborative documentation creation',
  '',
  '### 🚀 Advanced Features',
  '- **User Permissions**: Role-based access control and editing permissions',
  '- **Version History**: Track changes and maintain version history',
  '- **Comments and Annotations**: Add comments and annotations to cells',
  '- **Offline Support**: Allow offline editing with sync when reconnected',
  '- **Integration**: Connect with external collaboration platforms',
  '',
  '### 🔄 Collaboration Patterns',
  '- **Operational Transformation**: Handle concurrent edits with operational transformation',
  '- **Conflict-free Replicated Data Types**: Use CRDTs for conflict resolution',
  '- **Event Sourcing**: Track all changes as events for audit and replay',
  '- **State Synchronization**: Efficient state synchronization across clients',
  '- **User Session Management**: Manage user sessions and authentication',
].join('\n\n');

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

export const Case7: StoryObj = {
  render: () => {
    const tableRef = useTableRef();
    const storeRef = useStoreRef();
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

      const sampleData = [
        'Updated!',
        'In Review',
        'Almost Done',
        'On Track',
        'Delayed',
        '90%',
        '85%',
        '95%',
        '70%',
        '60%',
        'High Priority',
        'Medium',
        'Low',
        'Critical',
        'Normal',
        'Alice',
        'Bob',
        'Charlie',
        'Diana',
        'Team',
        '2024-02-20',
        '2024-02-25',
        '2024-03-01',
        '2024-03-05',
        '2024-03-10',
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
          const newCol = Math.floor(Math.random() * 6) + 1; // Columns 1-6

          setUserCursors((prev) => ({
            ...prev,
            [randomUser.id]: { row: newRow, col: newCol },
          }));

          // If edit action, actually edit the cell after 1 second
          if (selectedAction.action === 'edited cell' && tableRef.current) {
            setTimeout(() => {
              if (tableRef.current) {
                const { table, dispatch } = tableRef.current;
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
                  case 3: // Assignee column
                    newValue = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'][
                      Math.floor(Math.random() * 8)
                    ];
                    break;
                  case 4: // Due Date column
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
                  case 5: // Progress column
                    const progress = ['10%', '25%', '50%', '75%', '90%', '100%', '15%', '35%', '60%', '80%'];
                    newValue = progress[Math.floor(Math.random() * progress.length)];
                    break;
                  case 6: // Priority column
                    newValue = ['High', 'Medium', 'Low', 'Critical', 'Urgent', 'Normal'][Math.floor(Math.random() * 6)];
                    break;
                  default:
                    newValue = 'Updated';
                }

                // Highlight the edited cell
                const updatedTable = table.update({
                  diff: {
                    [cellAddress]: {
                      value: newValue,
                      style: {
                        backgroundColor: randomUser.color + '30',
                        fontWeight: 'bold',
                        border: `2px solid ${randomUser.color}`,
                        transition: 'all 0.3s ease',
                      },
                    },
                  },
                });
                dispatch(updatedTable);

                addActivity(randomUser.name, `edited ${cellAddress} to "${newValue}"`, cellAddress);

                // Remove highlight after 2 seconds (shorter)
                setTimeout(() => {
                  if (tableRef.current) {
                    const { table, dispatch } = tableRef.current;
                    const currentCell = table.getByPoint({ y: newRow, x: newCol });
                    if (currentCell) {
                      const resetTable = table.update({
                        diff: {
                          [cellAddress]: {
                            ...currentCell,
                            style: {
                              ...currentCell.style,
                              backgroundColor: undefined,
                              border: undefined,
                              fontWeight: undefined,
                            },
                          },
                        },
                      });
                      dispatch(resetTable);
                    }
                  }
                }, 2000);
              }
            }, 1000); // Add 1 second delay
          } else {
            addActivity(randomUser.name, selectedAction.action, selectedAction.cell);
          }
        }
      };

      const interval = setInterval(simulateUserAction, 1200); // Action every 1.2 seconds (adjusted frequency)
      return () => clearInterval(interval);
    }, [addActivity, tableRef]);

    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}
        >
          <h2 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>👥 Real-time Collaboration Demo</h2>
          <p style={{ color: '#7f8c8d', margin: '0 0 15px 0' }}>
            Simulating multiple users working on the same spreadsheet
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
          {/* Main grid */}
          <div>
            <div
              style={{
                position: 'relative',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
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
                  if (!user || !tableRef.current) return null;

                  const { table } = tableRef.current;

                  // Get actual column width and row height
                  const columnWidths = table.getRectSize({
                    top: 1,
                    left: 1,
                    bottom: 1,
                    right: pos.col,
                  });

                  const rowHeights = table.getRectSize({
                    top: 1,
                    left: 1,
                    bottom: pos.row,
                    right: 1,
                  });

                  // Get current cell width and height
                  const currentColWidth = table.getByPoint({ y: 0, x: pos.col })?.width || 120;
                  const currentRowHeight = table.getByPoint({ y: pos.row, x: 0 })?.height || 40;

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
                tableRef={tableRef}
                storeRef={storeRef}
                hub={hub}
                initialCells={buildInitialCells({
                  matrices: {
                    A1: [
                      ['Project', 'Status', 'Assignee', 'Due Date', 'Progress', 'Priority'],
                      ['Website Redesign', 'In Progress', 'Alice', '2024-02-15', '75%', 'High'],
                      ['Mobile App', 'Planning', 'Bob', '2024-03-01', '25%', 'Medium'],
                      ['Database Migration', 'Completed', 'Charlie', '2024-01-30', '100%', 'Low'],
                      ['API Integration', 'Testing', 'Diana', '2024-02-20', '90%', 'High'],
                      ['UI/UX Design', 'Review', 'Alice', '2024-02-10', '60%', 'Medium'],
                    ],
                  },
                  cells: {
                    default: {
                      width: 120,
                      height: 40,
                    },
                    A: { width: 150 }, // Project column wider
                    B: { width: 100 }, // Status column narrower
                    C: { width: 80 }, // Assignee column narrower
                    D: { width: 120 }, // Due Date column
                    E: { width: 80 }, // Progress column narrower
                    F: { width: 100 }, // Priority column
                    'A1:F1': {
                      style: {
                        backgroundColor: '#34495e',
                        color: 'white',
                        fontWeight: 'bold',
                        textAlign: 'center',
                      },
                    },
                    'F2:F6': {
                      style: {
                        textAlign: 'center',
                        fontWeight: 'bold',
                      },
                      policy: 'priority',
                    },
                  },
                })}
                options={{
                  sheetWidth: 800,
                  sheetHeight: 300,
                  headerHeight: 32,
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

        {/* How it works - Markdown */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              color: '#2c3e50',
              margin: '0 0 15px 0',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            📖 How it works
          </h3>
          <div
            style={{
              lineHeight: '1.6',
              color: '#374151',
            }}
          >
            <ReactMarkdown>{HOW_IT_WORKS}</ReactMarkdown>
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
  },
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
