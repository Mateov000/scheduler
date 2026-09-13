import { Event } from '../types';
import { HCValidationResult } from './HC01_noOverlap';

export function validateHC02_lockedEvents(originalEvents: Event[], proposedEvents: Event[]): HCValidationResult {
  const proposedMap = new Map(proposedEvents.map(e => [e.id, e]));

  for (const orig of originalEvents) {
    if (orig.is_locked) {
      const prop = proposedMap.get(orig.id);
      if (!prop) {
        return {
          satisfied: false,
          reason: `El evento bloqueado "${orig.name}" (${orig.id}) fue eliminado de la propuesta.`,
        };
      }
      if (
        new Date(orig.start).getTime() !== new Date(prop.start).getTime() ||
        orig.duration !== prop.duration
      ) {
        return {
          satisfied: false,
          reason: `El evento bloqueado "${orig.name}" (${orig.id}) fue movido o alterado en duración.`,
        };
      }
    }
  }

  return { satisfied: true };
}
