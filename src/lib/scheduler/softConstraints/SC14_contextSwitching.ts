import { Event } from '../types';
import { ConstraintParams } from '../params';

/**
 * SC-14 · Sin Exceso de Cambios de Contexto en un Día (Peso default: 6)
 * Penaliza si hay más de context_switches_max (default: 4) transiciones de categoría en un solo día.
 */
export function computeSC14Penalty(events: Event[], params: ConstraintParams): number {
  const eventsByDay: Event[][] = Array.from({ length: 7 }, () => []);

  for (const ev of events) {
    if (ev.category !== 'sueno' && ev.category !== 'traslado') {
      const day = new Date(ev.start).getDay();
      eventsByDay[day].push(ev);
    }
  }

  let excessiveDays = 0;

  for (const dayEvents of eventsByDay) {
    if (dayEvents.length < 2) continue;

    dayEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    let switches = 0;

    for (let i = 0; i < dayEvents.length - 1; i++) {
      if (dayEvents[i].category !== dayEvents[i + 1].category) {
        switches++;
      }
    }

    if (switches > params.context_switches_max) {
      excessiveDays++;
    }
  }

  return excessiveDays / 7;
}
