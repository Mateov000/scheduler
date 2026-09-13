import { Contact, Event } from '../types';
import { MutationOperation } from './LocalStorageStore';

/**
 * Immutable list of fields that must NEVER leave the device.
 * Enforces Principle P4: "Información sensible bajo control".
 */
export const LOCAL_ONLY_FIELDS = [
  'cannabis_consumed',
  'notesEncrypted',
  'displayAlias',
  'AILogs',
] as const;

export type LocalOnlyField = (typeof LOCAL_ONLY_FIELDS)[number];

/**
 * Strips all local-only and sensitive private data before an Event payload is sent to cloud sync or external networks.
 */
export function sanitizeForCloudSync(event: Event): Record<string, any> {
  const sanitized: Record<string, any> = { ...event };

  // 1. Strictly purge all LOCAL_ONLY_FIELDS
  for (const field of LOCAL_ONLY_FIELDS) {
    delete sanitized[field];
  }

  // 2. Extra privacy layer for sensitive events
  if (event.is_sensitive) {
    sanitized.name = event.displayAlias || 'Ocupado';
    sanitized.contacts = [];
  }

  // 3. Convert Dates to ISO strings for network payload
  if (sanitized.start instanceof Date) {
    sanitized.start = sanitized.start.toISOString();
  }
  if (sanitized.createdAt instanceof Date) {
    sanitized.createdAt = sanitized.createdAt.toISOString();
  }
  if (sanitized.updatedAt instanceof Date) {
    sanitized.updatedAt = sanitized.updatedAt.toISOString();
  }
  if (sanitized.exceptionFor instanceof Date) {
    sanitized.exceptionFor = sanitized.exceptionFor.toISOString();
  }

  return sanitized;
}

/**
 * Sanitizes a Contact object before cloud sync.
 */
export function sanitizeContactForCloudSync(contact: Contact): Record<string, any> {
  const sanitized: Record<string, any> = { ...contact };
  if (contact.isSensitive) {
    sanitized.name = contact.alias || 'Contacto';
    sanitized.notes = undefined;
  }
  return sanitized;
}

/**
 * Last-Write-Wins (LWW) conflict resolver between a local event and a remote event.
 */
export function resolveConflictLWW(local: Event, remote: Event): Event {
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  if (remoteTime > localTime) {
    // Remote is strictly newer, but preserve local-only privacy fields from local copy!
    return {
      ...remote,
      cannabis_consumed: local.cannabis_consumed,
      notesEncrypted: local.notesEncrypted,
      displayAlias: local.displayAlias,
      syncStatus: 'synced',
    };
  }

  if (localTime > remoteTime) {
    // Local is newer
    return {
      ...local,
      syncStatus: 'pending',
    };
  }

  // Equal timestamps: break tie with localVersion
  if ((remote.localVersion ?? 0) > (local.localVersion ?? 0)) {
    return {
      ...remote,
      cannabis_consumed: local.cannabis_consumed,
      notesEncrypted: local.notesEncrypted,
      displayAlias: local.displayAlias,
      syncStatus: 'synced',
    };
  }

  return {
    ...local,
    syncStatus: 'pending',
  };
}

export interface CloudSyncResult {
  syncedCount: number;
  failedCount: number;
  processedIds: string[];
}

export interface CloudSyncApi {
  pushEvent(eventPayload: Record<string, any>): Promise<boolean>;
  deleteEvent(id: string): Promise<boolean>;
}

import { supabase } from '../../supabaseClient';

/**
 * Cloud API adapter for Supabase.
 */
export class SupabaseSyncClient implements CloudSyncApi {
  constructor(private supabaseUrl?: string, private supabaseAnonKey?: string) {}

  async pushEvent(eventPayload: Record<string, any>): Promise<boolean> {
    if (!supabase) return false;

    try {
      const dbRow = {
        id: eventPayload.id,
        name: eventPayload.name,
        category: eventPayload.category,
        emoji: eventPayload.emoji,
        start: eventPayload.start,
        duration: eventPayload.duration,
        is_locked: eventPayload.is_locked ?? false,
        location: eventPayload.location,
        weather_sensitivity: eventPayload.weatherSensitivity || 'none',
        contacts: eventPayload.contacts || [],
        cognitive_load: eventPayload.cognitiveLoad ?? 1,
        physical_load: eventPayload.physicalLoad ?? 0,
        estimated_cost_ars: eventPayload.estimatedCostARS ?? null,
        is_sensitive: eventPayload.is_sensitive ?? false,
        created_at: eventPayload.createdAt || new Date().toISOString(),
        updated_at: eventPayload.updatedAt || new Date().toISOString(),
        device_id: eventPayload.deviceId || 'local',
        local_version: eventPayload.localVersion || 1,
      };

      const { error } = await supabase.from('mimesa_events').upsert(dbRow);
      return !error;
    } catch {
      return false;
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('mimesa_events').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  async fetchAllEvents(): Promise<Event[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('mimesa_events').select('*');
      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        emoji: row.emoji,
        start: new Date(row.start),
        duration: row.duration,
        is_locked: row.is_locked,
        location: row.location,
        weatherSensitivity: row.weather_sensitivity,
        contacts: row.contacts,
        cognitiveLoad: row.cognitive_load,
        physicalLoad: row.physical_load,
        estimatedCostARS: row.estimated_cost_ars ? Number(row.estimated_cost_ars) : undefined,
        is_sensitive: row.is_sensitive,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        deviceId: row.device_id,
        localVersion: row.local_version,
        syncStatus: 'synced',
      }));
    } catch {
      return [];
    }
  }
}

/**
 * Processes the offline sync queue with strict sanitization on every payload.
 */
export async function processSyncQueue(
  queue: MutationOperation[],
  api: CloudSyncApi
): Promise<CloudSyncResult> {
  let syncedCount = 0;
  let failedCount = 0;
  const processedIds: string[] = [];

  for (const op of queue) {
    try {
      if (op.type === 'delete') {
        const success = await api.deleteEvent(op.entityId);
        if (success) {
          syncedCount++;
          processedIds.push(op.id);
        } else {
          failedCount++;
        }
      } else if (op.entity === 'event' && op.payload) {
        // Enforce strict sanitization before sending over network
        const safePayload = sanitizeForCloudSync(op.payload);
        const success = await api.pushEvent(safePayload);
        if (success) {
          syncedCount++;
          processedIds.push(op.id);
        } else {
          failedCount++;
        }
      } else {
        // Other entities
        syncedCount++;
        processedIds.push(op.id);
      }
    } catch {
      failedCount++;
    }
  }

  return { syncedCount, failedCount, processedIds };
}
