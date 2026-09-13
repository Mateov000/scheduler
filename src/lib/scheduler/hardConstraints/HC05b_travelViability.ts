import { Event } from '../types';
import { getTravelTimeMinutes, TravelMatrix } from '../travelMatrix';
import { HCValidationResult } from './HC01_noOverlap';

export function validateHC05b_travelViability(events: Event[], matrix?: TravelMatrix): HCValidationResult {
  const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (current.category === 'traslado' || next.category === 'traslado') {
      continue;
    }

    if (current.location.type !== next.location.type) {
      const reqMinutes = getTravelTimeMinutes(current.location.type, next.location.type, matrix);
      const currentEnd = new Date(current.start).getTime() + current.duration * 60 * 1000;
      const nextStart = new Date(next.start).getTime();
      const availableGapMinutes = (nextStart - currentEnd) / (60 * 1000);

      if (availableGapMinutes < reqMinutes) {
        return {
          satisfied: false,
          reason: `Tiempo de traslado insuficiente entre "${current.name}" (${current.location.type}) y "${next.name}" (${next.location.type}): disponible ${availableGapMinutes} min, requerido ${reqMinutes} min.`,
        };
      }
    }
  }

  return { satisfied: true };
}
