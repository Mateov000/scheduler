import { ConstraintParams } from './params';
import { Event } from './types';

export interface FatigueReport {
  consecutiveNightShifts: number;
  totalSleepDeficitMinutes: number;
  normalizedFatigueP04: number; // 0.0 to 1.0
  isCritical: boolean; // P04 > 0.6
  alertMessage?: string;
  recommendedPreset?: 'Recuperación post-Ferro';
}

/**
 * Monitors consecutive night shifts at Ferro San Juan and calculates sleep deficit (§17.2 & SC-04).
 */
export function computeFatigueState(
  schedule: Event[],
  params: ConstraintParams
): FatigueReport {
  // 1. Identify all Ferro night shifts
  const ferroShifts = schedule
    .filter(
      (e) =>
        e.category === 'trabajo' &&
        (e.location?.type === 'ferro_san_juan' || e.name.toLowerCase().includes('ferro'))
    )
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  if (ferroShifts.length === 0) {
    return {
      consecutiveNightShifts: 0,
      totalSleepDeficitMinutes: 0,
      normalizedFatigueP04: 0,
      isCritical: false,
    };
  }

  const sleepTarget = params.sleep_target_post_ferro; // default 480 min (8h)
  let totalDeficit = 0;
  let consecutiveCount = 0;
  let maxConsecutive = 0;
  let lastShiftEndTime = 0;

  for (const shift of ferroShifts) {
    const shiftStart = new Date(shift.start).getTime();
    const shiftEnd = shiftStart + shift.duration * 60000;

    // Check if within 36 hours of previous shift (consecutive night shifts)
    if (lastShiftEndTime > 0 && shiftStart - lastShiftEndTime < 36 * 3600000) {
      consecutiveCount++;
    } else {
      consecutiveCount = 1;
    }
    maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
    lastShiftEndTime = shiftEnd;

    // Search for sleep event immediately following this shift
    const postSleep = schedule.find((e) => {
      const eStart = new Date(e.start).getTime();
      return (
        e.category === 'sueno' &&
        eStart >= shiftEnd &&
        eStart <= shiftEnd + (params.travel_buffer_ferro + 60) * 60000
      );
    });

    const actualSleep = postSleep ? postSleep.duration : 0;
    const deficit = Math.max(0, sleepTarget - actualSleep);
    totalDeficit += deficit;
  }

  // Calculate normalized fatigue P_04 = min(1.0, deficit / sleepTarget)
  const normalizedFatigueP04 = Math.min(1.0, totalDeficit / sleepTarget);
  const isCritical = normalizedFatigueP04 > 0.6 || maxConsecutive >= 2;

  let alertMessage: string | undefined;
  let recommendedPreset: 'Recuperación post-Ferro' | undefined;

  if (isCritical) {
    alertMessage = `Alerta de fatiga acumulada: ${maxConsecutive} turnos Ferro consecutivos con un déficit de ${totalDeficit} min de sueño. Se recomienda activar el preset 'Recuperación post-Ferro'.`;
    recommendedPreset = 'Recuperación post-Ferro';
  }

  return {
    consecutiveNightShifts: maxConsecutive,
    totalSleepDeficitMinutes: totalDeficit,
    normalizedFatigueP04: Math.round(normalizedFatigueP04 * 100) / 100,
    isCritical,
    alertMessage,
    recommendedPreset,
  };
}
