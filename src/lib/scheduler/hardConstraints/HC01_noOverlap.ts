import { Event } from '../types';

export interface HCValidationResult {
  satisfied: boolean;
  reason?: string;
  conflictingEventIds?: [string, string];
}

export function validateHC01_noOverlap(events: Event[]): HCValidationResult {
  const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const currentStart = new Date(current.start).getTime();
    const currentEnd = currentStart + current.duration * 60 * 1000;
    const nextStart = new Date(next.start).getTime();

    if (currentEnd > nextStart) {
      return {
        satisfied: false,
        reason: `Solapamiento detectado entre "${current.name}" y "${next.name}".`,
        conflictingEventIds: [current.id, next.id],
      };
    }
  }

  return { satisfied: true };
}
