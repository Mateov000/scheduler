import { Event, WeatherCondition, Contact } from './types';
import { ConstraintParams } from './params';
import { MetaSlidersState, defaultMetaSliders, getMetaSliderMultipliers } from './metaSliders';
import { computeGHC01Penalty } from './graduatedHardConstraints/GHC01_cannabisBuffer';

// Soft constraints imports
import { computeSC01Penalty } from './softConstraints/SC01_studyBlocks';
import { computeSC02Penalty } from './softConstraints/SC02_batchCooking';
import { computeSC03Penalty } from './softConstraints/SC03_socialGoals';
import { computeSC04Penalty } from './softConstraints/SC04_circadianFatigue';
import { computeSC05Penalty } from './softConstraints/SC05_evenDistribution';
import { computeSC06Penalty } from './softConstraints/SC06_contactAvailability';
import { computeSC07Penalty } from './softConstraints/SC07_timePreferences';
import { computeSC08Penalty } from './softConstraints/SC08_goodWeatherForSocial';
import { computeSC08bPenalty } from './softConstraints/SC08b_badWeatherForProductivity';
import { computeSC09Penalty } from './softConstraints/SC09_noDeadTime';
import { computeSC10Penalty } from './softConstraints/SC10_energyEconomy';
import { computeSC11Penalty } from './softConstraints/SC11_mealsAndRest';
import { computeSC12Penalty } from './softConstraints/SC12_totalTravelTime';
import { computeSC13Penalty } from './softConstraints/SC13_weeklyBudget';
import { computeSC14Penalty } from './softConstraints/SC14_contextSwitching';
import { computeSC15Penalty } from './softConstraints/SC15_serendipitySlots';
import { computeSC16Penalty } from './softConstraints/SC16_sensitiveContactBalance';

export interface ScoreEvaluationResult {
  totalCost: number;
  score: number; // 0 a 100
  ghcPenalties: Record<string, number>;
  softPenalties: Record<string, number>;
  effectiveWeights: Record<string, number>;
}

export const defaultBaseWeights: Record<string, number> = {
  'SC-01': 8,
  'SC-02': 5,
  'SC-03': 6,
  'SC-04': 9,
  'SC-05': 4,
  'SC-06': 3,
  'SC-07': 6,
  'SC-08': 7,
  'SC-08b': 4,
  'SC-09': 5,
  'SC-10': 8,
  'SC-11': 7,
  'SC-12': 4,
  'SC-13': 3,
  'SC-14': 6,
  'SC-15': 5,
  'SC-16': 0, // Inactiva por defecto
};

/**
 * Función de Penalización Unificada y Cálculo del Score de Bienestar (§9).
 */
export function evaluateSchedule(
  events: Event[],
  weather: WeatherCondition[],
  params: ConstraintParams,
  contacts: Contact[] = [],
  baseWeights: Record<string, number> = defaultBaseWeights,
  metaSliders: MetaSlidersState = defaultMetaSliders
): ScoreEvaluationResult {
  const multipliers = getMetaSliderMultipliers(metaSliders);
  const effectiveWeights: Record<string, number> = {};
  for (const [key, baseW] of Object.entries(baseWeights)) {
    const mult = multipliers[key] ?? 1.0;
    effectiveWeights[key] = baseW * mult;
  }

  // 1. Evaluar GHCs (GHC-01)
  const ghcPenalties: Record<string, number> = {};
  let totalGhcCost = 0;

  const cannabisEvents = events.filter(e => e.cannabis_consumed);
  for (const ev of cannabisEvents) {
    // Buscar el siguiente evento en casa o descanso
    const evEnd = new Date(ev.start).getTime() + ev.duration * 60 * 1000;
    const nextHomeEvent = events
      .filter(e => new Date(e.start).getTime() >= evEnd && (e.location.type === 'casa' || e.category === 'sueno'))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];

    const bufferMin = nextHomeEvent
      ? (new Date(nextHomeEvent.start).getTime() - evEnd) / (60 * 1000)
      : params.cannabis_buffer_target; // Si no hay evento en casa, se asume pleno

    const penalty = computeGHC01Penalty(bufferMin, params);
    ghcPenalties['GHC-01'] = (ghcPenalties['GHC-01'] ?? 0) + penalty;
    totalGhcCost += penalty;
  }

  // 2. Evaluar las 16 Soft Constraints (0 a 1)
  const p01 = computeSC01Penalty(events, params);
  const p02 = computeSC02Penalty(events, params);
  const p03 = computeSC03Penalty(events, contacts);
  const { penalty: p04 } = computeSC04Penalty(events, params);
  const p05 = computeSC05Penalty(events);
  const p06 = computeSC06Penalty(events, contacts);
  const p07 = computeSC07Penalty(events);
  const p08 = computeSC08Penalty(events, weather, params);
  const p08b = computeSC08bPenalty(events, weather, params);
  const p09 = computeSC09Penalty(events, params);
  const p10 = computeSC10Penalty(events);
  const p11 = computeSC11Penalty(events, params);
  const p12 = computeSC12Penalty(events, params);
  const p13 = computeSC13Penalty(events, params);
  const p14 = computeSC14Penalty(events, params);
  const p15 = computeSC15Penalty(events, params);
  const p16 = computeSC16Penalty(events, contacts, params);

  const softPenalties: Record<string, number> = {
    'SC-01': p01,
    'SC-02': p02,
    'SC-03': p03,
    'SC-04': p04,
    'SC-05': p05,
    'SC-06': p06,
    'SC-07': p07,
    'SC-08': p08,
    'SC-08b': p08b,
    'SC-09': p09,
    'SC-10': p10,
    'SC-11': p11,
    'SC-12': p12,
    'SC-13': p13,
    'SC-14': p14,
    'SC-15': p15,
    'SC-16': p16,
  };

  // 3. Suma ponderada de Soft Constraints
  let totalSoftCost = 0;
  let maxPossibleSoftCost = 0;

  for (const [key, pVal] of Object.entries(softPenalties)) {
    const w = effectiveWeights[key] ?? 0;
    totalSoftCost += w * pVal;
    maxPossibleSoftCost += w * 1.0;
  }

  const totalCost = totalGhcCost + totalSoftCost;

  // Max theoretical cost: GHC max (w_ghc01) + maxPossibleSoftCost
  const maxCost = Math.max(1, (params.w_ghc01 * 1.0) + maxPossibleSoftCost);
  const score = Math.max(0, Math.min(100, Math.round(100 * (1 - totalCost / maxCost))));

  return {
    totalCost,
    score,
    ghcPenalties,
    softPenalties,
    effectiveWeights,
  };
}
