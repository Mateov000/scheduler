import { Event } from '../types';
import { ConstraintParams } from '../params';

/**
 * SC-15 · Slots de Serendipia Social Semanales (Peso default: 5)
 * Penaliza semanas sin al menos serendipity_slots_per_week (default: 2) slots abiertos para lo inesperado.
 */
export function computeSC15Penalty(events: Event[], params: ConstraintParams): number {
  const target = params.serendipity_slots_per_week;
  if (target <= 0) return 0;

  const serendipityCount = events.filter(
    e => e.isOpenSocialSlot || e.category === 'social_opportunity'
  ).length;

  return Math.max(0, target - serendipityCount) / target;
}
