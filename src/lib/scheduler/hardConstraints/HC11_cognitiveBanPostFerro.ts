import { Event } from '../types';
import { ConstraintParams } from '../params';
import { HCValidationResult } from './HC01_noOverlap';

export function validateHC11_cognitiveBanPostFerro(events: Event[], params: ConstraintParams): HCValidationResult {
  if (params.cognitive_ban_post_ferro <= 0) {
    return { satisfied: true };
  }

  const ferroShifts = events.filter(
    e => e.category === 'trabajo' && (e.location.type === 'ferro_san_juan' || e.name.toLowerCase().includes('ferro'))
  );

  for (const shift of ferroShifts) {
    const shiftEnd = new Date(shift.start).getTime() + shift.duration * 60 * 1000;
    const arrivalTime = shiftEnd + params.travel_buffer_ferro * 60 * 1000;
    const banEndTime = arrivalTime + params.cognitive_ban_post_ferro * 60 * 1000;

    for (const ev of events) {
      if (ev.id !== shift.id && ev.cognitiveLoad >= 2) {
        const evStart = new Date(ev.start).getTime();
        const evEnd = evStart + ev.duration * 60 * 1000;

        if (evStart < banEndTime && evEnd > arrivalTime) {
          return {
            satisfied: false,
            reason: `El evento "${ev.name}" tiene alta carga cognitiva (${ev.cognitiveLoad}) y cae dentro de la ventana de prohibición cognitiva post-Ferro (${params.cognitive_ban_post_ferro} min).`,
          };
        }
      }
    }
  }

  return { satisfied: true };
}
