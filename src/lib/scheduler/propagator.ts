import { Event } from './types';
import { ConstraintParams } from './params';
import { SLOT_DURATION_MINUTES, SLOTS_PER_WEEK, dateToSlotIndex, slotIndexToDate } from './partitioner';

export type DomainsMap = Map<string, number[]>;

/**
 * Propagación AC-3 y Forward Checking.
 * Para cada evento movible, genera el conjunto de slots de inicio [0..671] que no colisionan
 * directamente con eventos fijos (HC-01), buffers laborales (HC-05) o descanso obligatorio post-Ferro (HC-03).
 */
export function propagateAC3(
  movable: Event[],
  fixed: Event[],
  params: ConstraintParams,
  weekStart: Date
): DomainsMap {
  const domains: DomainsMap = new Map();

  // Matriz booleana de ocupación fija en la semana
  const occupiedSlots = new Uint8Array(SLOTS_PER_WEEK); // 0 = libre, 1 = ocupado

  for (const f of fixed) {
    const startIdx = Math.max(0, dateToSlotIndex(new Date(f.start), weekStart));
    const slotCount = Math.ceil(f.duration / SLOT_DURATION_MINUTES);
    const endIdx = Math.min(SLOTS_PER_WEEK, startIdx + slotCount);

    for (let s = startIdx; s < endIdx; s++) {
      occupiedSlots[s] = 1;
    }

    // Si es turno de trabajo, marcar buffers de traslado (HC-05)
    if (f.category === 'trabajo' || f.location.type === 'rambla_casino' || f.location.type === 'ferro_san_juan') {
      const isCasino = f.location.type === 'rambla_casino' || f.name.toLowerCase().includes('casino');
      const bufferMinutes = isCasino ? params.travel_buffer_casino : params.travel_buffer_ferro;
      const bufferSlots = Math.ceil(bufferMinutes / SLOT_DURATION_MINUTES);

      // Pre-buffer
      for (let s = Math.max(0, startIdx - bufferSlots); s < startIdx; s++) {
        occupiedSlots[s] = 1;
      }
      // Post-buffer
      for (let s = endIdx; s < Math.min(SLOTS_PER_WEEK, endIdx + bufferSlots); s++) {
        occupiedSlots[s] = 1;
      }
    }
  }

  // Filtrar dominios para cada evento movible
  for (const m of movable) {
    const reqSlots = Math.ceil(m.duration / SLOT_DURATION_MINUTES);
    const validStarts: number[] = [];

    // Horizon: recorrer slots factibles
    for (let start = 0; start <= SLOTS_PER_WEEK - reqSlots; start++) {
      let isFeasible = true;

      // Check slot collisions
      for (let s = start; s < start + reqSlots; s++) {
        if (occupiedSlots[s] === 1) {
          isFeasible = false;
          break;
        }
      }

      // Check cognitive ban (HC-11): no cognitiveLoad >= 2 in night post-ferro
      if (isFeasible && m.cognitiveLoad >= 2) {
        // Cálculo puramente aritmético del slot en el día (0 a 95 slots -> 0 a 23 horas)
        const hourInDay = Math.floor((start % 96) / 4);
        if (hourInDay >= 1 && hourInDay < 6) {
          isFeasible = false;
        }
      }

      if (isFeasible) {
        validStarts.push(start);
      }
    }

    domains.set(m.id, validStarts);
  }

  return domains;
}

/**
 * Heurística MRV (Minimum Remaining Values):
 * Ordena los eventos movibles colocando primero aquellos con menos opciones de inicio válidas.
 */
export function sortByMRV(movable: Event[], domains: DomainsMap): Event[] {
  return [...movable].sort((a, b) => {
    const lenA = domains.get(a.id)?.length ?? 0;
    const lenB = domains.get(b.id)?.length ?? 0;
    return lenA - lenB;
  });
}
