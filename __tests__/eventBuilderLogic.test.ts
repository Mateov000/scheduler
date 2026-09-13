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

  it('calculates travel buffers correctly for Facultad shift (40 min default)', () => {
    const classStart = new Date(2026, 8, 15, 8, 0, 0); // Tuesday 08:00
    const duration = 240; // 4 hours (until 12:00)
    const bufferMinutes = 40;

    const idaStart = new Date(classStart.getTime() - bufferMinutes * 60000);
    const vueltaStart = new Date(classStart.getTime() + duration * 60000);

    expect(idaStart.getHours()).toBe(7);
    expect(idaStart.getMinutes()).toBe(20);

    expect(vueltaStart.getHours()).toBe(12);
    expect(vueltaStart.getMinutes()).toBe(0);
  });

  it('supports independent Ida and Vuelta travel event generation (Solo Ida, Solo Vuelta, Ambos, Ninguno)', () => {
    const classStart = new Date(2026, 8, 15, 14, 0, 0); // 14:00 to 18:00
    const duration = 240;
    const effectiveBuffer = 40;
    const venueName = 'Facultad de Ingeniería';

    const buildTravelEvents = (includeIda: boolean, includeVuelta: boolean) => {
      const events = [];
      if (includeIda) {
        events.push({
          id: 'ev_ida',
          name: `Traslado a ${venueName}`,
          start: new Date(classStart.getTime() - effectiveBuffer * 60000),
          duration: effectiveBuffer,
        });
      }
      if (includeVuelta) {
        events.push({
          id: 'ev_vuelta',
          name: `Traslado desde ${venueName}`,
          start: new Date(classStart.getTime() + duration * 60000),
          duration: effectiveBuffer,
        });
      }
      return events;
    };

    // 1. Ambos
    const both = buildTravelEvents(true, true);
    expect(both).toHaveLength(2);
    expect(both[0].name).toBe('Traslado a Facultad de Ingeniería');
    expect(both[0].duration).toBe(40);
    expect(both[0].start.getHours()).toBe(13);
    expect(both[0].start.getMinutes()).toBe(20);
    expect(both[1].name).toBe('Traslado desde Facultad de Ingeniería');
    expect(both[1].start.getHours()).toBe(18);
    expect(both[1].start.getMinutes()).toBe(0);

    // 2. Solo Ida
    const idaOnly = buildTravelEvents(true, false);
    expect(idaOnly).toHaveLength(1);
    expect(idaOnly[0].name).toBe('Traslado a Facultad de Ingeniería');
    expect(idaOnly[0].start.getHours()).toBe(13);
    expect(idaOnly[0].start.getMinutes()).toBe(20);

    // 3. Solo Vuelta
    const vueltaOnly = buildTravelEvents(false, true);
    expect(vueltaOnly).toHaveLength(1);
    expect(vueltaOnly[0].name).toBe('Traslado desde Facultad de Ingeniería');
    expect(vueltaOnly[0].start.getHours()).toBe(18);
    expect(vueltaOnly[0].start.getMinutes()).toBe(0);

    // 4. Ninguno
    const none = buildTravelEvents(false, false);
    expect(none).toHaveLength(0);
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
