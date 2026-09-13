import { describe, expect, it } from 'vitest';
import {
  addRecurrenceException,
  expandRecurrencePattern,
  removeRecurrenceException,
  splitPatternAtDate,
} from '../src/lib/scheduler/recurrence';
import { Event, RecurrencePattern } from '../src/lib/scheduler/types';

const baseEvent: Event = {
  id: 'ev_cursada_redes',
  name: 'Cursada Redes de Computadoras',
  category: 'cursada',
  start: new Date(2026, 8, 15, 14, 0, 0), // Tuesday Sept 15, 2026, 14:00
  duration: 120,
  is_locked: true,
  location: { type: 'facultad', name: 'Facultad de Ingeniería' },
  weatherSensitivity: 'none',
  cognitiveLoad: 2,
  physicalLoad: 0,
  is_sensitive: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deviceId: 'test_device',
  localVersion: 1,
  syncStatus: 'synced',
};

describe('Recurrence Engine', () => {
  it('expands a weekly recurrence pattern across a planning window', () => {
    const pattern: RecurrencePattern = {
      id: 'pat_redes_weekly',
      frequency: 'weekly',
      daysOfWeek: [2, 4], // Tuesday and Thursday
      startDate: new Date(2026, 8, 14), // Monday Sept 14
      exceptions: [],
    };

    const windowStart = new Date(2026, 8, 14, 0, 0, 0);
    const windowEnd = new Date(2026, 8, 20, 23, 59, 59);

    const occurrences = expandRecurrencePattern(pattern, baseEvent, windowStart, windowEnd);

    // Tuesday Sept 15 and Thursday Sept 17
    expect(occurrences).toHaveLength(2);
    expect(occurrences[0].start.getDate()).toBe(15);
    expect(occurrences[0].start.getHours()).toBe(14);
    expect(occurrences[1].start.getDate()).toBe(17);
    expect(occurrences[1].start.getHours()).toBe(14);
  });

  it('respects a "skip" recurrence exception', () => {
    let pattern: RecurrencePattern = {
      id: 'pat_redes_weekly',
      frequency: 'weekly',
      daysOfWeek: [2, 4],
      startDate: new Date(2026, 8, 14),
      exceptions: [],
    };

    // Skip Thursday Sept 17 (feriado / no hay clase)
    pattern = addRecurrenceException(pattern, {
      date: new Date(2026, 8, 17),
      type: 'skip',
      note: 'Feriado nacional',
    });

    const windowStart = new Date(2026, 8, 14, 0, 0, 0);
    const windowEnd = new Date(2026, 8, 20, 23, 59, 59);

    const occurrences = expandRecurrencePattern(pattern, baseEvent, windowStart, windowEnd);

    expect(occurrences).toHaveLength(1);
    expect(occurrences[0].start.getDate()).toBe(15);
  });

  it('respects a "reschedule" exception on a specific date', () => {
    let pattern: RecurrencePattern = {
      id: 'pat_redes_weekly',
      frequency: 'weekly',
      daysOfWeek: [2],
      startDate: new Date(2026, 8, 14),
      exceptions: [],
    };

    const rescheduledDate = new Date(2026, 8, 15, 16, 30, 0);
    pattern = addRecurrenceException(pattern, {
      date: new Date(2026, 8, 15),
      type: 'reschedule',
      override: {
        start: rescheduledDate,
        duration: 90,
      },
    });

    const windowStart = new Date(2026, 8, 14, 0, 0, 0);
    const windowEnd = new Date(2026, 8, 20, 23, 59, 59);

    const occurrences = expandRecurrencePattern(pattern, baseEvent, windowStart, windowEnd);

    expect(occurrences).toHaveLength(1);
    expect(occurrences[0].start.getHours()).toBe(16);
    expect(occurrences[0].start.getMinutes()).toBe(30);
    expect(occurrences[0].duration).toBe(90);
    expect(occurrences[0].isRecurrenceException).toBe(true);
  });

  it('splits pattern at date ("edit from this event forward")', () => {
    const pattern: RecurrencePattern = {
      id: 'pat_gym_daily',
      frequency: 'daily',
      startDate: new Date(2026, 8, 1),
      exceptions: [],
    };

    const splitDate = new Date(2026, 8, 15);
    const { updatedOriginalPattern, newPattern, newBaseEvent } = splitPatternAtDate(
      pattern,
      baseEvent,
      splitDate,
      { name: 'Gym Nueva Rutina' }
    );

    expect(updatedOriginalPattern.until).toBeDefined();
    expect(updatedOriginalPattern.until!.getDate()).toBe(14);
    expect(newPattern.startDate.getDate()).toBe(15);
    expect(newBaseEvent.name).toBe('Gym Nueva Rutina');
  });

  it('allows removing an exception', () => {
    let pattern: RecurrencePattern = {
      id: 'pat_test',
      frequency: 'daily',
      startDate: new Date(2026, 8, 1),
      exceptions: [
        {
          date: new Date(2026, 8, 5),
          type: 'skip',
        },
      ],
    };

    pattern = removeRecurrenceException(pattern, new Date(2026, 8, 5));
    expect(pattern.exceptions).toHaveLength(0);
  });
});
