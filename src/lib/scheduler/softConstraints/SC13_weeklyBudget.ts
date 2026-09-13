import { Event } from '../types';
import { ConstraintParams } from '../params';

/**
 * SC-13 · Presupuesto Semanal Estimado (Peso default: 3)
 * Penaliza si el gasto estimado acumulado supera weekly_budget_ars.
 * Inactiva de facto si weekly_budget_ars es undefined.
 */
export function computeSC13Penalty(events: Event[], params: ConstraintParams): number {
  if (params.weekly_budget_ars === undefined || params.weekly_budget_ars <= 0) {
    return 0; // Inactiva
  }

  const totalCost = events.reduce((sum, e) => sum + (e.estimatedCostARS ?? 0), 0);
  if (totalCost <= params.weekly_budget_ars) {
    return 0;
  }

  const excess = totalCost - params.weekly_budget_ars;
  return Math.min(1, excess / params.weekly_budget_ars);
}
