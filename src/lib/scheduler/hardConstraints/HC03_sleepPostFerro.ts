import { Event } from '../types';
import { ConstraintParams } from '../params';
import { HCValidationResult } from './HC01_noOverlap';

export function validateHC03_sleepPostFerro(events: Event[], params: ConstraintParams): HCValidationResult {
  const ferroShifts = events.filter(
    e => e.category === 'trabajo' && (e.location.type === 'ferro_san_juan' || e.name.toLowerCase().includes('ferro'))
  );
  const sleepEvents = events.filter(e => e.category === 'sueno');

  for (const shift of ferroShifts) {
    const shiftEnd = new Date(shift.start).getTime() + shift.duration * 60 * 1000;
    const maxSleepStart = shiftEnd + params.travel_buffer_ferro * 60 * 1000;

    const validSleep = sleepEvents.find(s => {
      const sleepStart = new Date(s.start).getTime();
      return sleepStart >= shiftEnd && sleepStart <= maxSleepStart && s.duration >= params.sleep_target_post_ferro;
    });

    if (!validSleep) {
      return {
        satisfied: false,
        reason: `No se encontró bloque de sueño continuo de al menos ${params.sleep_target_post_ferro} min tras el turno Ferro "${shift.name}".`,
      };
    }
  }

  return { satisfied: true };
}
