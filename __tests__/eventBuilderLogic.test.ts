import { describe, expect, it } from 'vitest';
import { Event } from '../src/lib/scheduler/types';
import { expandRecurrencePattern } from '../src/lib/scheduler/recurrence';

describe('Event Builder Business Logic', () => {
  it('calculates travel buffers correctly for Casino Rambla shift (30 min)', () => {
    const shiftStart = new Date(2026, 8, 14, 10, 0, 0); // Monday 10:00
    const duration = 360; // 6 hours
    const bufferMinutes = 30;

    const idaStart = new Date(shiftStart.getTime() - bufferMinutes * 60000);
    const vueltaStart = new Date(shiftStart.getTime() + duration * 60000);

    expect(idaStart.getHours()).toBe(9);
    expect(idaStart.getMinutes()).toBe(30);

    expect(vueltaStart.getHours()).toBe(16);
    expect(vueltaStart.getMinutes()).toBe(0);
  });

  it('calculates travel buffers correctly for Ferro San Juan shift (45 min)', () => {
    const shiftStart = new Date(2026, 8, 18, 17, 0, 0); // Friday 17:00
    const duration = 480; // 8 hours (until 01:00 AM)
    const bufferMinutes = 45;

    const idaStart = new Date(shiftStart.getTime() - bufferMinutes * 60000);
    const vueltaStart = new Date(shiftStart.getTime() + duration * 60000);

    expect(idaStart.getHours()).toBe(16);
    expect(idaStart.getMinutes()).toBe(15);

    expect(vueltaStart.getHours()).toBe(1);
    expect(vueltaStart.getMinutes()).toBe(0);
    expect(vueltaStart.getDate()).toBe(19); // Next day
  });

  it('creates full recurring instances up to end date without losing base event properties', () => {
    const baseEvent: Event = {
      id: 'ev_gym_builder',
      name: 'Entreno Gym',
      category: 'gym',
      emoji: '💪',
      start: new Date(2026, 8, 14, 9, 0, 0),
      duration: 60,
      is_locked: false,
      location: { type: 'gym', name: 'Gimnasio' },
      weatherSensitivity: 'none',
      cognitiveLoad: 0,
      physicalLoad: 3,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    };

    const pattern = {
      id: 'rec_gym',
      frequency: 'weekly' as const,
      daysOfWeek: [1, 3, 5] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[], // Lun, Mié, Vie
      startDate: new Date(2026, 8, 14),
      until: new Date(2026, 8, 20, 23, 59, 59),
      exceptions: [],
    };

    const instances = expandRecurrencePattern(
      pattern,
      baseEvent,
      new Date(2026, 8, 14, 0, 0, 0),
      new Date(2026, 8, 20, 23, 59, 59)
    );

    // Monday 14, Wednesday 16, Friday 18
    expect(instances).toHaveLength(3);
    expect(instances[0].start.getDate()).toBe(14);
    expect(instances[1].start.getDate()).toBe(16);
    expect(instances[2].start.getDate()).toBe(18);

    instances.forEach((inst) => {
      expect(inst.physicalLoad).toBe(3);
      expect(inst.duration).toBe(60);
      expect(inst.category).toBe('gym');
    });
  });
});
