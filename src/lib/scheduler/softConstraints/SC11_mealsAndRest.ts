import { Event } from '../types';
import { ConstraintParams } from '../params';

/**
 * SC-11 · Comidas y Descansos en Jornadas Largas (Peso default: 7)
 * Penaliza jornadas de más de long_session_no_meal_threshold (default: 300 min = 5h) sin un bloque de comida.
 */
export function computeSC11Penalty(events: Event[], params: ConstraintParams): number {
  const sorted = [...events]
    .filter(e => e.category !== 'sueno')
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  if (sorted.length === 0) return 0;

  let longWorkBlocksWithoutMeal = 0;
  let continuousDuration = 0;
  let hasMealInWindow = false;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    if (current.category === 'comida') {
      hasMealInWindow = true;
      continuousDuration = 0;
    } else {
      continuousDuration += current.duration;
    }

    if (continuousDuration > params.long_session_no_meal_threshold && !hasMealInWindow) {
      longWorkBlocksWithoutMeal++;
      continuousDuration = 0; // reset for next detection
    }

    // Check gap to next
    if (i < sorted.length - 1) {
      const next = sorted[i + 1];
      const gap = (new Date(next.start).getTime() - (new Date(current.start).getTime() + current.duration * 60 * 1000)) / (60 * 1000);
      if (gap >= 60) {
        // Natural break resets continuous block
        continuousDuration = 0;
        hasMealInWindow = false;
      }
    }
  }

  return Math.min(1, longWorkBlocksWithoutMeal / 3);
}
