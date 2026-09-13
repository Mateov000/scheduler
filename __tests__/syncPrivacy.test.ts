import { describe, expect, it } from 'vitest';
import { generateIcalCalendar } from '../src/lib/scheduler/calendarExport';
import {
  LOCAL_ONLY_FIELDS,
  resolveConflictLWW,
  sanitizeContactForCloudSync,
  sanitizeForCloudSync,
} from '../src/lib/scheduler/storage/syncEngine';
import { Contact, Event } from '../src/lib/scheduler/types';

describe('Privacy and Cloud Sync Engine (Principle P4)', () => {
  const sensitiveEvent: Event = {
    id: 'ev_cannabis_chill',
    name: 'Sesión privada y relajación',
    category: 'recuperacion',
    start: new Date(2026, 8, 18, 20, 0, 0),
    duration: 120,
    is_locked: false,
    location: { type: 'casa', name: 'Casa' },
    weatherSensitivity: 'none',
    cognitiveLoad: 0,
    physicalLoad: 0,
    is_sensitive: true,
    cannabis_consumed: true,
    displayAlias: 'Bloqueo Personal',
    notesEncrypted: 'Notas confidenciales sobre la sesión',
    contacts: ['Amigo Secreto'],
    createdAt: new Date('2026-09-18T12:00:00Z'),
    updatedAt: new Date('2026-09-18T12:00:00Z'),
    deviceId: 'laptop_matu',
    localVersion: 1,
    syncStatus: 'synced',
  };

  it('purges all LOCAL_ONLY_FIELDS from event payloads before cloud sync', () => {
    const payload = sanitizeForCloudSync(sensitiveEvent);

    // Verify none of the LOCAL_ONLY_FIELDS exist
    for (const field of LOCAL_ONLY_FIELDS) {
      expect(payload).not.toHaveProperty(field);
    }

    // Because is_sensitive is true, name is replaced with displayAlias
    expect(payload.name).toBe('Bloqueo Personal');
    // Contacts should be purged
    expect(payload.contacts).toHaveLength(0);
  });

  it('sanitizes sensitive contacts before cloud sync', () => {
    const delicateContact: Contact = {
      id: 'cont_lau',
      name: 'Lau G.',
      alias: 'Lau',
      relationshipType: 'vinculo_delicado',
      isSensitive: true,
      notes: 'Conversaciones privadas y contexto sensible',
    };

    const payload = sanitizeContactForCloudSync(delicateContact);
    expect(payload.name).toBe('Lau');
    expect(payload.notes).toBeUndefined();
  });

  it('generates an RFC 5545 .ics file and masks sensitive events as "Ocupado" or alias', () => {
    const regularEvent: Event = {
      id: 'ev_work_casino',
      name: 'Turno Casino Rambla',
      category: 'trabajo',
      start: new Date('2026-09-15T13:00:00Z'),
      duration: 360,
      is_locked: true,
      location: { type: 'rambla_casino', name: 'Casino Rambla' },
      weatherSensitivity: 'transit_only',
      cognitiveLoad: 1,
      physicalLoad: 1,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'laptop_matu',
      localVersion: 1,
      syncStatus: 'synced',
    };

    const icsString = generateIcalCalendar([regularEvent, sensitiveEvent]);

    // Check envelope
    expect(icsString).toContain('BEGIN:VCALENDAR');
    expect(icsString).toContain('END:VCALENDAR');

    // Regular event is visible
    expect(icsString).toContain('SUMMARY:Turno Casino Rambla');
    expect(icsString).toContain('LOCATION:Casino Rambla');

    // Sensitive event is masked with displayAlias
    expect(icsString).toContain('SUMMARY:Bloqueo Personal');
    // Ensure cannabis_consumed or notes NEVER appear in the .ics
    expect(icsString).not.toContain('cannabis');
    expect(icsString).not.toContain('Notas confidenciales');
    expect(icsString).not.toContain('Amigo Secreto');
    expect(icsString).toContain('CLASS:PRIVATE');
  });

  it('resolves conflicts using Last-Write-Wins (LWW) while protecting local private fields', () => {
    const localEvent: Event = {
      ...sensitiveEvent,
      updatedAt: new Date('2026-09-18T14:00:00Z'),
      localVersion: 2,
    };

    const remoteEvent: Event = {
      ...sensitiveEvent,
      name: 'Cambio remoto desde otro dispositivo',
      updatedAt: new Date('2026-09-18T15:00:00Z'), // Remote is newer
      localVersion: 3,
      cannabis_consumed: undefined, // Cloud doesn't have it
    };

    const resolved = resolveConflictLWW(localEvent, remoteEvent);

    // Remote's updated fields take precedence
    expect(resolved.name).toBe('Cambio remoto desde otro dispositivo');
    // Local private fields are preserved!
    expect(resolved.cannabis_consumed).toBe(true);
    expect(resolved.notesEncrypted).toBe('Notas confidenciales sobre la sesión');
  });
});
