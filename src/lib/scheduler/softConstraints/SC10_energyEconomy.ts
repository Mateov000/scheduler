import { Event } from '../types';

export interface ActivityEnergyProfile {
  nameMatch: string;
  category?: string;
  cognitiveLoad: number;
  physicalLoad: number;
  recoveryMinutes: number;
}

export const defaultEnergyProfiles: ActivityEnergyProfile[] = [
  { nameMatch: 'parcial', cognitiveLoad: 3, physicalLoad: 0, recoveryMinutes: 90 },
  { nameMatch: 'examen', cognitiveLoad: 3, physicalLoad: 0, recoveryMinutes: 90 },
  { nameMatch: 'estudio', cognitiveLoad: 3, physicalLoad: 0, recoveryMinutes: 30 },
  { nameMatch: 'gym', cognitiveLoad: 0, physicalLoad: 3, recoveryMinutes: 60 },
  { nameMatch: 'ferro', cognitiveLoad: 1, physicalLoad: 2, recoveryMinutes: 30 },
  { nameMatch: 'cursada', cognitiveLoad: 2, physicalLoad: 0, recoveryMinutes: 20 },
  { nameMatch: 'mate', cognitiveLoad: 0, physicalLoad: 0, recoveryMinutes: 0 },
  { nameMatch: 'batch_cooking', cognitiveLoad: 1, physicalLoad: 1, recoveryMinutes: 0 },
];

/**
 * SC-10 · Economía Energética — Secuenciación por Carga (Peso default: 8)
 * Penaliza secuencias donde el gap entre eventos es menor al tiempo de recuperación requerido.
 */
export function computeSC10Penalty(events: Event[]): number {
  const sorted = [...events]
    .filter(e => e.category !== 'sueno')
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  if (sorted.length < 2) return 0;

  let violations = 0;
  let evaluatedTransitions = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const currentEnd = new Date(current.start).getTime() + current.duration * 60 * 1000;
    const nextStart = new Date(next.start).getTime();
    const gapMinutes = (nextStart - currentEnd) / (60 * 1000);

    // Find profile
    const profile = defaultEnergyProfiles.find(p =>
      current.name.toLowerCase().includes(p.nameMatch) || current.category === p.nameMatch
    );

    const requiredRecovery = profile ? profile.recoveryMinutes : (current.cognitiveLoad >= 3 ? 30 : 0);

    if (requiredRecovery > 0) {
      evaluatedTransitions++;
      if (gapMinutes < requiredRecovery) {
        violations++;
      }
    }
  }

  if (evaluatedTransitions === 0) return 0;
  return violations / evaluatedTransitions;
}
