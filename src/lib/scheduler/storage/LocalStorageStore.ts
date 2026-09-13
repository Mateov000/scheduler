import { ConstraintParams, defaultParams } from '../params';
import { Event, MiMesaConfig, RecurrencePattern } from '../types';

export interface MutationOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'event' | 'param' | 'contact' | 'recurrence_pattern';
  entityId: string;
  payload?: any;
  timestamp: string; // ISO format
  deviceId: string;
}

export const STORAGE_KEYS = {
  EVENTS: 'mimesa_events_v1',
  PARAMS: 'mimesa_params_v1',
  META: 'mimesa_meta_v1',
  PATTERNS: 'mimesa_patterns_v1',
  SYNC_QUEUE: 'mimesa_sync_queue_v1',
} as const;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Revives parsed JSON data by converting recognized ISO date strings into Date objects.
 */
export function reviveEventDates(event: any): Event {
  return {
    ...event,
    start: new Date(event.start),
    createdAt: new Date(event.createdAt || Date.now()),
    updatedAt: new Date(event.updatedAt || Date.now()),
    exceptionFor: event.exceptionFor ? new Date(event.exceptionFor) : undefined,
  };
}

export function revivePatternDates(pattern: any): RecurrencePattern {
  return {
    ...pattern,
    startDate: new Date(pattern.startDate),
    until: pattern.until ? new Date(pattern.until) : undefined,
    exceptions: Array.isArray(pattern.exceptions)
      ? pattern.exceptions.map((ex: any) => ({
          ...ex,
          date: new Date(ex.date),
          override: ex.override
            ? {
                ...ex.override,
                start: ex.override.start ? new Date(ex.override.start) : undefined,
              }
            : undefined,
        }))
      : [],
  };
}

export class LocalStorageStore {
  private memoryFallback: Map<string, string> = new Map();

  private getItem(key: string): string | null {
    if (isBrowser()) {
      try {
        return localStorage.getItem(key);
      } catch {
        return this.memoryFallback.get(key) ?? null;
      }
    }
    return this.memoryFallback.get(key) ?? null;
  }

  private setItem(key: string, value: string): void {
    if (isBrowser()) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch {
        this.memoryFallback.set(key, value);
        return;
      }
    }
    this.memoryFallback.set(key, value);
  }

  private removeItem(key: string): void {
    if (isBrowser()) {
      try {
        localStorage.removeItem(key);
        return;
      } catch {
        this.memoryFallback.delete(key);
        return;
      }
    }
    this.memoryFallback.delete(key);
  }

  // --- Events ---
  getEvents(): Event[] {
    const raw = this.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(reviveEventDates);
    } catch {
      return [];
    }
  }

  saveEvents(events: Event[]): void {
    this.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }

  // --- Params ---
  getParams(): ConstraintParams {
    const raw = this.getItem(STORAGE_KEYS.PARAMS);
    if (!raw) return { ...defaultParams };
    try {
      const parsed = JSON.parse(raw);
      return { ...defaultParams, ...parsed };
    } catch {
      return { ...defaultParams };
    }
  }

  saveParams(params: ConstraintParams): void {
    this.setItem(STORAGE_KEYS.PARAMS, JSON.stringify(params));
  }

  // --- Metadata / Config ---
  getMeta(): Partial<MiMesaConfig> | null {
    const raw = this.getItem(STORAGE_KEYS.META);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  saveMeta(meta: Partial<MiMesaConfig>): void {
    this.setItem(STORAGE_KEYS.META, JSON.stringify(meta));
  }

  // --- Recurrence Patterns ---
  getPatterns(): RecurrencePattern[] {
    const raw = this.getItem(STORAGE_KEYS.PATTERNS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(revivePatternDates);
    } catch {
      return [];
    }
  }

  savePatterns(patterns: RecurrencePattern[]): void {
    this.setItem(STORAGE_KEYS.PATTERNS, JSON.stringify(patterns));
  }

  // --- Offline Sync Queue ---
  getSyncQueue(): MutationOperation[] {
    const raw = this.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  enqueueMutation(operation: MutationOperation): void {
    const queue = this.getSyncQueue();
    queue.push(operation);
    this.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  }

  dequeueMutation(operationId: string): void {
    const queue = this.getSyncQueue().filter((op) => op.id !== operationId);
    this.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  }

  clearSyncQueue(): void {
    this.removeItem(STORAGE_KEYS.SYNC_QUEUE);
  }

  clearAll(): void {
    this.removeItem(STORAGE_KEYS.EVENTS);
    this.removeItem(STORAGE_KEYS.PARAMS);
    this.removeItem(STORAGE_KEYS.META);
    this.removeItem(STORAGE_KEYS.PATTERNS);
    this.removeItem(STORAGE_KEYS.SYNC_QUEUE);
    this.memoryFallback.clear();
  }
}

export const localStore = new LocalStorageStore();
