import { Event } from '../types';
import { ConstraintParams } from '../params';

/**
 * SC-12 · Tiempo de Traslado Total Diario (Peso default: 4)
 * Penaliza si el tiempo total de traslado en un solo día supera travel_time_max_daily (default: 90 min).
 */
export function computeSC12Penalty(events: Event[], params: ConstraintParams): number {
  const dailyTravelMinutes: number[] = new Array(7).fill(0);

  for (const ev of events) {
    if (ev.category === 'traslado') {
      const day = new Date(ev.start).getDay();
      dailyTravelMinutes[day] += ev.duration;
    }
  }

  let excessiveDays = 0;
  for (const travel of dailyTravelMinutes) {
    if (travel > params.travel_time_max_daily) {
      excessiveDays++;
    }
  }

  return excessiveDays / 7;
}
