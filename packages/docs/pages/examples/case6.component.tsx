'use client';

import * as React from 'react';
import {
  GridSheet,
  buildInitialCells,
  Policy,
  PolicyMixinType,
  RenderProps,
  SerializeProps,
} from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';

type EventType = {
  time: string;
  task: string;
};

type ValueType = EventType[];

// Event parsing function
const parseEvents = (input: string): EventType[] => {
  if (!input || typeof input !== 'string') {
    return [];
  }

  const lines = input.split('\n').filter((line) => line.trim());
  const events: EventType[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

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

// Calendar policy mixin (combines render + parse)
const CalendarCellPolicyMixin: PolicyMixinType = {
  renderCallback(rendered: any, { point }: RenderProps<ValueType>) {
    const { date } = getDateFromPosition(point.y, point.x);

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          padding: 8,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 4,
          }}
        >
          {date}
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            overflow: 'hidden',
          }}
        >
          {rendered}
        </div>
      </div>
    );
  },
  renderNull() {
    return (
      <span
        style={{
          color: '#aaa',
          fontSize: 11,
          fontStyle: 'italic',
          textAlign: 'center',
          marginTop: 'auto',
          marginBottom: 'auto',
        }}
      >
        No events
      </span>
    );
  },
  renderArray({ value }: RenderProps<ValueType>) {
    const events = Array.isArray(value) ? value : [];

    return (
      <>
        {events.map((event: EventType, i: number) => (
          <div
            key={i}
            style={{
              background: '#3498db',
              color: '#fff',
              borderRadius: 3,
              padding: '2px 4px',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              minHeight: 16,
            }}
          >
            {event.time && (
              <span
                style={{
                  fontWeight: 'bold',
                  fontSize: 10,
                  minWidth: 28,
                }}
              >
                {event.time}
              </span>
            )}
            <span
              style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {event.task}
            </span>
          </div>
        ))}
      </>
    );
  },
  serializeArray({ value }: SerializeProps<ValueType>): string {
    if (!value || value.length === 0) {
      return '';
    }
    return value.map((ev: EventType) => `${ev.time ? ev.time + ' ' : ''}${ev.task}`).join('\n');
  },
  deserializeFirst: (value: string) => {
    if (!value || !value.trim()) {
      return { value: null };
    }
    const events = parseEvents(value);
    return { value: events };
  },
};

// Generate 4 weeks of calendar data
const weeks: ValueType[][] = [];
for (let w = 0; w < 4; w++) {
  const week: ValueType[] = [];
  for (let d = 0; d < 7; d++) {
    // Sample events (only for some days)
    let events: EventType[] | null = null;
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

export default function CustomRendering() {
  const book = useSpellbook({
    policies: {
      calendar: new Policy({ mixins: [CalendarCellPolicyMixin] }),
    },
  });

  return (
    <div
      style={{
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <GridSheet
        book={book}
        initialCells={buildInitialCells({
          matrices: {
            A1: weeks,
          },
          cells: {
            default: {
              policy: 'calendar',
            },
            defaultCol: { width: 120 },
            defaultRow: { height: 100 },
            A0: { label: 'Mon' },
            B0: { label: 'Tue' },
            C0: { label: 'Wed' },
            D0: { label: 'Thu' },
            E0: { label: 'Fri' },
            F0: { label: 'Sat', style: { backgroundColor: '#4a90d9' } },
            F: { style: { backgroundColor: 'rgba(74, 144, 217, 0.15)' } },
            G0: { label: 'Sun', style: { backgroundColor: '#d94a4a' } },
            G: { style: { backgroundColor: 'rgba(217, 74, 74, 0.15)' } },
          },
        })}
        options={{
          sheetWidth: typeof window !== 'undefined' ? Math.min(900, window.innerWidth - 60) : 900,
          sheetHeight: 450,
          limits: { minCols: 7, maxCols: 7, minRows: 5, maxRows: 5 },
        }}
      />
    </div>
  );
}
