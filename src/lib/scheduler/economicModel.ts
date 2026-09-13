import { Event } from './types';

export interface ActivityCostEstimate {
  name: string;
  costARS: number;
  category: 'free' | 'cheap' | 'moderate' | 'expensive';
}

export const DEFAULT_ACTIVITY_COSTS_ARS: Record<string, ActivityCostEstimate> = {
  playa: { name: 'Playa / Caminata', costARS: 0, category: 'free' },
  estudio_casa: { name: 'Estudio en Casa', costARS: 0, category: 'free' },
  colectivo_local: { name: 'Colectivo Local MDP', costARS: 850, category: 'cheap' },
  mate_cafe: { name: 'Mate o Café al Paso', costARS: 2500, category: 'cheap' },
  cafe_comida: { name: 'Café con Merienda / Comida', costARS: 8000, category: 'moderate' },
  cine: { name: 'Entrada de Cine', costARS: 10000, category: 'moderate' },
  bowling_aldrey: { name: 'Bowling Paseo Aldrey', costARS: 12000, category: 'moderate' },
  salida_nocturna: { name: 'Salida Nocturna / Bar', costARS: 20000, category: 'expensive' },
};

/**
 * Assigns an estimated cost in ARS to an Event based on category and location.
 */
export function estimateEventCostARS(event: Event): number {
  if (event.estimatedCostARS !== undefined) {
    return event.estimatedCostARS;
  }

  // Location/Category Heuristics
  const loc = event.location?.type;
  if (loc === 'casa' || loc === 'facultad' || loc === 'exterior_plaza' || loc === 'exterior_rambla') {
    return 0;
  }
  if (loc === 'cafe_guemes') {
    return DEFAULT_ACTIVITY_COSTS_ARS.cafe_comida.costARS;
  }
  if (loc === 'paseo_aldrey') {
    return DEFAULT_ACTIVITY_COSTS_ARS.bowling_aldrey.costARS;
  }
  if (event.category === 'social') {
    return DEFAULT_ACTIVITY_COSTS_ARS.mate_cafe.costARS;
  }

  return 0;
}

export interface WeeklyBudgetSummary {
  totalEstimatedSpendARS: number;
  budgetLimitARS?: number;
  isOverBudget: boolean;
  excessARS: number;
  categoryBreakdown: Record<string, number>;
}

/**
 * Calculates the total estimated weekly expenditure in Argentine Pesos (§25 & SC-13).
 */
export function calculateWeeklyBudgetSpend(
  schedule: Event[],
  budgetLimitARS?: number
): WeeklyBudgetSummary {
  let total = 0;
  const breakdown: Record<string, number> = {};

  for (const event of schedule) {
    const cost = estimateEventCostARS(event);
    total += cost;
    const cat = event.category || 'otro';
    breakdown[cat] = (breakdown[cat] || 0) + cost;
  }

  const isOver = budgetLimitARS !== undefined ? total > budgetLimitARS : false;
  const excess = isOver && budgetLimitARS !== undefined ? total - budgetLimitARS : 0;

  return {
    totalEstimatedSpendARS: total,
    budgetLimitARS,
    isOverBudget: isOver,
    excessARS: excess,
    categoryBreakdown: breakdown,
  };
}
