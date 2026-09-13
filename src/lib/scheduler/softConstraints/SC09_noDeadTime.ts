import { Event } from '../types';
import { ConstraintParams } from '../params';

/**
 * SC-09 · Sin Tiempo Muerto Corto Entre Eventos de Distinta Naturaleza (Peso default: 5)
 * Penaliza gaps de menos de dead_time_threshold (default: 20 min) entre eventos de categorías distintas.
 */
export function computeSC09Penalty(events: Event[], params: ConstraintParams): number {
  const sorted = [...events]
    .filter(e => e.category !== 'traslado' && e.category !== 'sueno')
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  if (sorted.length < 2) return 0;

  let deadTimePairs = 0;
  let totalPairs = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (current.category !== next.category) {
      totalPairs++;
      const currentEnd = new Date(current.start).getTime() + current.duration * 60 * 1000;
      const nextStart = new Date(next.start).getTime();
      const gapMinutes = (nextStart - currentEnd) / (60 * 1000);

      if (gapMinutes > 0 && gapMinutes < params.dead_time_threshold) {
        deadTimePairs++;
      }
    }
  }

  if (totalPairs === 0) return 0;
  return deadTimePairs / totalPairs;
}
