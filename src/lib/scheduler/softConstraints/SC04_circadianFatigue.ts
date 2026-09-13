import { Event } from '../types';
import { ConstraintParams } from '../params';

/**
 * SC-04 · Fatiga Circadiana Acumulada (Peso default: 9)
 * Acumula el déficit de sueño post-Ferro frente a sleep_target_post_ferro (default: 480 min).
 */
export function computeSC04Penalty(events: Event[], params: ConstraintParams): { penalty: number; deficitMinutes: number } {
  const ferroShifts = events.filter(
    e => e.location.type === 'ferro_san_juan' || e.name.toLowerCase().includes('ferro')
  );

  if (ferroShifts.length === 0) {
    return { penalty: 0, deficitMinutes: 0 };
  }

  let totalDeficit = 0;
  const sleepEvents = events.filter(e => e.category === 'sueno');

  for (const shift of ferroShifts) {
    const shiftEnd = new Date(shift.start).getTime() + shift.duration * 60 * 1000;
    const maxSleepStart = shiftEnd + params.travel_buffer_ferro * 60 * 1000;

    const postSleep = sleepEvents.find(s => {
      const sStart = new Date(s.start).getTime();
      return sStart >= shiftEnd && sStart <= maxSleepStart;
    });

    const sleepDuration = postSleep ? postSleep.duration : 0;
    if (sleepDuration < params.sleep_target_post_ferro) {
      totalDeficit += (params.sleep_target_post_ferro - sleepDuration);
    }
  }

  const penalty = Math.min(1, totalDeficit / params.sleep_target_post_ferro);
  return { penalty, deficitMinutes: totalDeficit };
}
