import { Event } from '../types';
import { ConstraintParams } from '../params';
import { HCValidationResult } from './HC01_noOverlap';

export function validateHC05_workTravel(events: Event[], params: ConstraintParams): HCValidationResult {
  const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];
    if (ev.category === 'trabajo') {
      const isCasino = ev.location.type === 'rambla_casino' || ev.name.toLowerCase().includes('casino');
      const bufferMin = isCasino ? params.travel_buffer_casino : params.travel_buffer_ferro;
      const evStart = new Date(ev.start).getTime();
      const evEnd = evStart + ev.duration * 60 * 1000;

      // Check gap before
      if (i > 0) {
        const prev = sorted[i - 1];
        const prevEnd = new Date(prev.start).getTime() + prev.duration * 60 * 1000;
        if (prev.category !== 'traslado' && evStart - prevEnd < bufferMin * 60 * 1000) {
          return {
            satisfied: false,
            reason: `Buffer de traslado previo insuficiente para "${ev.name}": se requieren al menos ${bufferMin} min.`,
          };
        }
      }

      // Check gap after
      if (i < sorted.length - 1) {
        const next = sorted[i + 1];
        const nextStart = new Date(next.start).getTime();
        if (next.category !== 'traslado' && nextStart - evEnd < bufferMin * 60 * 1000) {
          return {
            satisfied: false,
            reason: `Buffer de traslado posterior insuficiente para "${ev.name}": se requieren al menos ${bufferMin} min.`,
          };
        }
      }
    }
  }

  return { satisfied: true };
}
