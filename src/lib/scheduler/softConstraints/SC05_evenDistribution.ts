import { Event } from '../types';

/**
 * SC-05 · Distribución Equilibrada de Carga Diaria (Peso default: 4)
 * Penaliza una alta varianza de carga horaria entre los días de la semana.
 */
export function computeSC05Penalty(events: Event[]): number {
  const dailyLoads: number[] = new Array(7).fill(0);

  for (const ev of events) {
    if (ev.category !== 'sueno') {
      const day = new Date(ev.start).getDay();
      dailyLoads[day] += ev.duration;
    }
  }

  const mean = dailyLoads.reduce((a, b) => a + b, 0) / 7;
  const variance = dailyLoads.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / 7;

  // Normalizar varianza respecto a una varianza máxima típica (ej. 480 min^2)
  const maxExpectedVariance = Math.pow(360, 2);
  return Math.min(1, variance / maxExpectedVariance);
}
