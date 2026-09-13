import { Event } from '../types';

/**
 * SC-07 · Preferencias Horarias Personales (Peso default: 6)
 * Penaliza programar estudio o trabajo cognitivo fuera de las ventanas de energía declaradas.
 */
export function computeSC07Penalty(
  events: Event[],
  energyPeakHours = { start: '10:00', end: '14:00' },
  preferredStudyHours = { start: '09:00', end: '13:00' }
): number {
  const deepEvents = events.filter(e => e.category === 'estudio' || e.cognitiveLoad >= 2);
  if (deepEvents.length === 0) return 0;

  const [peakStartH] = energyPeakHours.start.split(':').map(Number);
  const [peakEndH] = energyPeakHours.end.split(':').map(Number);

  let misplacedCount = 0;

  for (const ev of deepEvents) {
    const evHour = new Date(ev.start).getHours();
    if (evHour < peakStartH - 1 || evHour > peakEndH + 2) {
      misplacedCount++;
    }
  }

  return misplacedCount / deepEvents.length;
}
