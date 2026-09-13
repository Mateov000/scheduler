import { Event } from '../types';
import { ConstraintParams } from '../params';

/**
 * SC-02 · Batch Cooking Semanal (Peso default: 5)
 * Penaliza si las sesiones semanales de batch cooking no alcanzan batch_cooking_target (default: 2).
 */
export function computeSC02Penalty(events: Event[], params: ConstraintParams): number {
  const target = params.batch_cooking_target;
  if (target <= 0) return 0;

  const cookingSessions = events.filter(
    e => e.category === 'batch_cooking' && e.duration >= params.batch_cooking_duration
  ).length;

  return Math.max(0, target - cookingSessions) / target;
}
