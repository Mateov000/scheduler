import { Event } from '../types';
import { ConstraintParams } from '../params';
import { HCValidationResult } from './HC01_noOverlap';

export function validateHC09_minimumSleep(events: Event[], params: ConstraintParams): HCValidationResult {
  const sleepEvents = events.filter(e => e.category === 'sueno');

  for (const sleep of sleepEvents) {
    if (sleep.duration < params.sleep_minimum_absolute) {
      return {
        satisfied: false,
        reason: `El bloque de sueño "${sleep.name}" dura ${sleep.duration} min, violando el piso mínimo absoluto de ${params.sleep_minimum_absolute} min (6 horas).`,
      };
    }
  }

  return { satisfied: true };
}
