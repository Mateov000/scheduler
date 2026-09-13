import { Event } from '../types';
import { HCValidationResult } from './HC01_noOverlap';

export function validateHC10_noWorkOverlap(events: Event[]): HCValidationResult {
  const workEvents = events.filter(e => e.category === 'trabajo');
  const otherEvents = events.filter(e => e.category !== 'trabajo' && e.category !== 'traslado');

  for (const work of workEvents) {
    const workStart = new Date(work.start).getTime();
    const workEnd = workStart + work.duration * 60 * 1000;

    for (const other of otherEvents) {
      const otherStart = new Date(other.start).getTime();
      const otherEnd = otherStart + other.duration * 60 * 1000;

      if (workStart < otherEnd && workEnd > otherStart) {
        return {
          satisfied: false,
          reason: `El evento "${other.name}" solapa con el turno de trabajo confirmado "${work.name}".`,
        };
      }
    }
  }

  return { satisfied: true };
}
