import { Event } from './types';

export const SLOT_DURATION_MINUTES = 15;
export const SLOTS_PER_DAY = (24 * 60) / SLOT_DURATION_MINUTES; // 96
export const SLOTS_PER_WEEK = 7 * SLOTS_PER_DAY; // 672

export interface PartitionedSchedule {
  fixed: Event[];
  movable: Event[];
}

/**
 * Redondea una fecha hacia el slot de 15 minutos más cercano o inferior.
 */
export function roundToSlot(date: Date): Date {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const remainder = minutes % SLOT_DURATION_MINUTES;
  d.setMinutes(minutes - remainder, 0, 0);
  return d;
}

/**
 * Convierte una fecha a un índice de slot [0..671] dentro de la semana que inicia en weekStart.
 */
export function dateToSlotIndex(date: Date, weekStart: Date): number {
  const diffMs = date.getTime() - weekStart.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  return Math.floor(diffMinutes / SLOT_DURATION_MINUTES);
}

/**
 * Convierte un índice de slot a una fecha absoluta basada en weekStart.
 */
export function slotIndexToDate(slotIndex: number, weekStart: Date): Date {
  return new Date(weekStart.getTime() + slotIndex * SLOT_DURATION_MINUTES * 60 * 1000);
}

/**
 * Separa los eventos de la agenda en:
 * - fixed: Eventos con is_locked: true, cursadas universitarias o turnos confirmados.
 * - movable: Eventos flexibles sujetos a reubicación por el optimizador.
 */
export function partitionEvents(schedule: Event[]): PartitionedSchedule {
  const fixed: Event[] = [];
  const movable: Event[] = [];

  for (const event of schedule) {
    if (
      event.is_locked ||
      event.category === 'cursada' ||
      event.category === 'trabajo'
    ) {
      fixed.push({ ...event, is_locked: true });
    } else {
      movable.push(event);
    }
  }

  return { fixed, movable };
}
