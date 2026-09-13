import { Event } from '../types';
import { ConstraintParams } from '../params';

/**
 * SC-01 · Bloques de Estudio Continuos (Peso default: 8)
 * Penaliza bloques de estudio con duración menor a study_block_min_duration (default: 120 min).
 */
export function computeSC01Penalty(events: Event[], params: ConstraintParams): number {
  const studyEvents = events.filter(e => e.category === 'estudio');
  if (studyEvents.length === 0) return 0;

  const validBlocks = studyEvents.filter(e => e.duration >= params.study_block_min_duration);
  return 1 - (validBlocks.length / studyEvents.length);
}
