import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import {
  GridSheet,
  buildInitialCells,
  Renderer,
  RendererMixinType,
  RenderProps,
  useHub,
  Parser,
} from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Demo/Case6',
  tags: ['autodocs'],
};
export default meta;

// 型定義
type EventType = {
  time: string;
  task: string;
};

type ValueType = EventType[];

const DESCRIPTION = [
  'This demo showcases a calendar/scheduler UI built with GridSheet.',
  'It demonstrates custom date cell rendering with event management.',
  'Users can input events in "HH:MM Task" format, separated by newlines.',
].join('\n\n');

const HOW_IT_WORKS = [
  '1. 📅 Each cell represents a day in a week view with fixed dates.',
  '2. 📝 Events are input as "HH:MM Task" format, separated by newlines.',
  '3. 🔄 Events are parsed and displayed individually.',
  '4. 🌅 Weekends are highlighted.',
  '5. 📭 Empty days show "No events".',
  '',
  '## Implementation Guide',
  '',
  '### 📅 Calendar/Scheduler Interface Overview',
  'This comprehensive calendar and scheduler interface demonstrates how GridSheet can be used to create sophisticated scheduling applications. The implementation includes date calculations, event parsing, visual styling, and interactive event management.',
  '',
  '### 📅 Date Calculation System',
  'Implement a robust date calculation system that determines dates based on grid positions. Calculate weekdays, weekends, and date ranges for proper calendar display. Handle date boundaries, leap years, and timezone considerations.',
  '',
  '### 🔧 Event Parsing and Validation',
  'Create custom parsers that convert user input into structured event data. Parse time formats (HH:MM), validate time ranges, and handle various input formats. Include error handling for invalid time formats and malformed input.',
  '',
  '### 🎨 Custom Calendar Renderer',
  'Implement custom renderers that display calendar cells with dates, events, and visual indicators. Handle weekend highlighting, event display, and empty state messaging. Create responsive layouts that work with different cell sizes.',
  '',
  '### 📝 Event Management System',
  'Develop a comprehensive event management system that handles multiple events per day. Support event time formatting, task descriptions, and event prioritization. Include visual indicators for different event types and durations.',
  '',
  '### 🎨 Visual Styling and Theming',
  'Create professional calendar styling with weekend highlighting, event colors, and visual hierarchy. Implement consistent color schemes, typography, and spacing. Include hover effects and visual feedback for user interactions.',
  '',
  '### 💾 Data Structure Management',
  'Handle complex data structures including event arrays, date objects, and time formats. Implement proper data validation, serialization, and deserialization. Ensure data consistency across different calendar views.',
  '',
  '### 📱 Responsive Calendar Layout',
  'Design responsive calendar layouts that adapt to different screen sizes and orientations. Implement flexible grid systems, adaptive cell sizing, and mobile-friendly interactions. Ensure calendar remains usable on all devices.',
  '',
  '### ✏️ Event Input and Editing',
  'Provide intuitive event input interfaces with format validation and real-time feedback. Support multiple input formats, keyboard shortcuts, and bulk event entry. Include undo/redo functionality for event modifications.',
  '',
  '### ⚡ Performance Optimization',
  'Optimize calendar rendering for large date ranges and multiple events. Implement efficient date calculations, event filtering, and visual updates. Consider virtualization for long date ranges and memory management.',
  '',
  '### ✅ Best Practices',
  '1. **Date Handling**: Use proper date libraries and handle timezone considerations',
  '2. **Event Validation**: Validate all event inputs and time formats',
  '3. **User Experience**: Provide clear visual feedback and intuitive interactions',
  '4. **Accessibility**: Ensure calendar is accessible to users with disabilities',
  '5. **Performance**: Optimize rendering for large datasets and frequent updates',
  '6. **Data Persistence**: Implement reliable event saving and recovery',
  '7. **Error Handling**: Provide graceful error handling for invalid inputs',
  '',
  '### 🎯 Common Use Cases',
  '- **Personal Scheduling**: Individual calendar and task management',
  '- **Team Calendars**: Shared team scheduling and meeting coordination',
  '- **Event Management**: Conference and event scheduling systems',
  '- **Resource Booking**: Room and resource reservation systems',
  '- **Project Planning**: Project timeline and milestone tracking',
  '',
  '### 🚀 Advanced Features',
  '- **Recurring Events**: Support for daily, weekly, monthly recurring events',
  '- **Event Categories**: Color-coded event categories and filtering',
  '- **Time Zone Support**: Multi-timezone calendar support',
  '- **Event Sharing**: Share events and calendars with other users',
  '- **Integration**: Connect with external calendar systems and APIs',
  '',
  '### 📅 Calendar Patterns',
  '- **Week View**: Traditional weekly calendar layout',
  '- **Month View**: Monthly calendar with event previews',
  '- **Agenda View**: List-based event display',
  '- **Timeline View**: Gantt-style timeline visualization',
  '- **Multi-calendar**: Support for multiple calendar sources',
].join('\n\n');

// Event parsing function
const parseEvents = (input: string): EventType[] => {
  if (!input || typeof input !== 'string') return [];
  
  const lines = input.split('\n').filter(line => line.trim());
  const events: EventType[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Parse HH:MM Task format
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);
    if (match) {
      const [, hour, minute, task] = match;
      const time = `${hour.padStart(2, '0')}:${minute}`;
      events.push({ time, task });
    } else {
      // If not in time format, treat the entire line as a task
      events.push({ time: '', task: trimmed });
    }
  }
  
  return events;
};

// Calendar parser
const CalendarParser = new Parser({
  mixins: [{
    any(value: string, cell?: any): any {
      const events = parseEvents(value);
      console.log('Parsed events:', events);
      return events;
    },
  }],
});

// Date calculation function
const getDateFromPosition = (row: number, col: number): { date: string; weekday: number; isWeekend: boolean } => {
  const startDate = new Date('2024-07-01'); // July 1, 2024 is Monday
  const date = new Date(startDate);
  date.setDate(startDate.getDate() + (row - 1) * 7 + (col - 1));
  const weekday = date.getDay();
  const isWeekend = weekday === 0 || weekday === 6;
  
  return {
    date: date.toISOString().slice(0, 10),
    weekday,
    isWeekend,
  };
};

// Calendar renderer
const CalendarCellRenderer: RendererMixinType = {
  array({ value, point }: RenderProps<ValueType>) {
    if (!value) return null;
    
    const { date, isWeekend } = getDateFromPosition(point.y, point.x);
    const events = value || [];
    
    return (
      <div style={{
        width: '100%',
        height: '100%',
        padding: 8,
        background: isWeekend ? '#f8d7da' : '#fff',
        borderRadius: 6,
        border: isWeekend ? '1px solid #e74c3c' : '1px solid #eee',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}>
        <div style={{ 
          fontWeight: 700, 
          color: isWeekend ? '#e74c3c' : '#2c3e50', 
          fontSize: 14,
          marginBottom: 4,
        }}>
          {date}
        </div>
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflow: 'hidden',
        }}>
          {events.length > 0 ? (
            events.map((event: EventType, i: number) => (
              <div key={i} style={{
                background: '#3498db',
                color: '#fff',
                borderRadius: 3,
                padding: '2px 4px',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                minHeight: 16,
              }}>
                {event.time && (
                  <span style={{ 
                    fontWeight: 'bold', 
                    fontSize: 10,
                    minWidth: 28,
                  }}>
                    {event.time}
                  </span>
                )}
                <span style={{ 
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {event.task}
                </span>
              </div>
            ))
          ) : (
            <span style={{ 
              color: '#aaa', 
              fontSize: 11,
              fontStyle: 'italic',
              textAlign: 'center',
              marginTop: 'auto',
              marginBottom: 'auto',
            }}>
              No events
            </span>
          )}
        </div>
      </div>
    );
  },
  stringify({ value }: RenderProps<ValueType>): string {
    if (!value || value.length === 0) return '';
    return value.map((ev: EventType) => `${ev.time} ${ev.task}`).join('\n');
  },
};

// Generate 4 weeks of calendar data
const weeks: ValueType[][] = [];
for (let w = 0; w < 4; w++) {
  const week: ValueType[] = [];
  for (let d = 0; d < 7; d++) {
    // Sample events (only for some days)
    let events: EventType[] = [];
    const weekday = (d + 1) % 7; // Start from Monday
    
    if (weekday === 1 && w === 0) {
      events = parseEvents('10:00 Team Meeting\n14:00 Client Call');
    } else if (weekday === 3 && w === 0) {
      events = parseEvents('09:00 Write Report\n11:00 Interview\n15:00 Review');
    } else if (weekday === 5 && w === 0) {
      events = parseEvents('15:00 Sprint Demo\n16:30 Planning');
    } else if (weekday === 2 && w === 1) {
      events = parseEvents('14:00 1on1 Meeting');
    } else if (weekday === 4 && w === 2) {
      events = parseEvents('16:00 Release Planning');
    } else if (weekday === 1 && w === 3) {
      events = parseEvents('10:00 All Hands Meeting');
    }
    
    week.push(events);
  }
  weeks.push(week);
}

export const Case6: StoryObj = {
  render: () => {
    const hub = useHub({
      renderers: {
        calendar: new Renderer({ mixins: [CalendarCellRenderer] }),
      },
      parsers: {
        calendar: CalendarParser,
      },
      labelers: {
        sun: () => 'Sun',
        mon: () => 'Mon', 
        tue: () => 'Tue',
        wed: () => 'Wed',
        thu: () => 'Thu',
        fri: () => 'Fri',
        sat: () => 'Sat',
      },
    });
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <h2 style={{ textAlign: 'center', color: '#2c3e50' }}>🗓️ Monthly Calendar Demo</h2>
        <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: 20 }}>
          Input events as "HH:MM Task" format, separated by newlines
        </p>
        <GridSheet
          hub={hub}
          initialCells={buildInitialCells({
            matrices: {
              A1: weeks,
            },
            cells: {
              default: {
                renderer: 'calendar',
                parser: 'calendar',
                width: 120,
                height: 100,
              },
              A: { labeler: 'mon' },
              B: { labeler: 'tue' },
              C: { labeler: 'wed' },
              D: { labeler: 'thu' },
              E: { labeler: 'fri' },
              F: { labeler: 'sat' },
              G: { labeler: 'sun' },
            },
          })}
          options={{
            sheetWidth: 900,
            sheetHeight: 450,
            headerHeight: 32,
            showAddress: false,
          }}
        />
        
        {/* How it works - Markdown */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            color: '#2c3e50', 
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📖 How it works
          </h3>
          <div style={{
            lineHeight: '1.6',
            color: '#374151'
          }}>
            <ReactMarkdown>{HOW_IT_WORKS}</ReactMarkdown>
          </div>
        </div>
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