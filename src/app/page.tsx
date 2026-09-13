'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CloudSun,
  Download,
  FlaskConical,
  HelpCircle,
  History,
  MessageSquarePlus,
  Moon,
  Plus,
  RotateCcw,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Wind,
  Zap,
} from 'lucide-react';

import { CalendarGrid } from '@/components/CalendarGrid';
import { ConstraintPanel } from '@/components/ConstraintPanel';
import { DiffViewerModal } from '@/components/DiffViewerModal';
import { EventFormModal } from '@/components/EventFormModal';
import { MetaSliders } from '@/components/MetaSliders';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { RetrospectiveView } from '@/components/RetrospectiveView';
import { ScoreWidget } from '@/components/ScoreWidget';
import { SimulationMode } from '@/components/SimulationMode';
import { WeeklyPlanningSession } from '@/components/WeeklyPlanningSession';
import { WhatShouldIDoNow } from '@/components/WhatShouldIDoNow';

import { downloadIcsFile, generateIcalCalendar } from '@/lib/scheduler/calendarExport';
import { GeminiFlashClient } from '@/lib/scheduler/llm/geminiClient';
import { defaultMetaSliders, MetaSliderValues } from '@/lib/scheduler/metaSliders';
import { ConstraintParams, defaultParams } from '@/lib/scheduler/params';
import { evaluateSchedule } from '@/lib/scheduler/scorer';
import { solveMiMesa } from '@/lib/scheduler/solver';
import { LocalStorageStore } from '@/lib/scheduler/storage/LocalStorageStore';
import { resolveConflictLWW, sanitizeForCloudSync, SupabaseSyncClient } from '@/lib/scheduler/storage/syncEngine';
import { Contact, ConstraintTrace, Event, SolverResult, WeatherCondition } from '@/lib/scheduler/types';
import { fetchMDPWeather, generateSyntheticMDPWeather } from '@/lib/scheduler/weatherService';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

const store = new LocalStorageStore();
const geminiClient = new GeminiFlashClient();
const syncClient = new SupabaseSyncClient();

// Initial sample contacts for Matu (§11.1)
const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'cont_juancito',
    name: 'Juancito',
    relationshipType: 'amigo_cercano',
    weeklyHoursGoal: 5,
    hasPrivateApartment: false,
  },
  {
    id: 'cont_juani',
    name: 'Juani',
    relationshipType: 'amigo_cercano',
    weeklyHoursGoal: 3,
    hasPrivateApartment: true,
  },
  {
    id: 'cont_lau',
    name: 'Lau',
    alias: 'Lau',
    relationshipType: 'vinculo_delicado',
    isSensitive: true,
  },
];

// Generates initial weekly schedule for Matu
function createInitialSchedule(): Event[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const makeDate = (dayOffset: number, hour: number, minute: number = 0) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  return [
    // 1. Casino Rambla (Lunes 10:00 – 16:00)
    {
      id: 'ev_casino_lun',
      name: 'Turno Rambla Casino',
      category: 'trabajo',
      emoji: '🎰',
      start: makeDate(0, 10),
      duration: 360,
      is_locked: true,
      location: { type: 'rambla_casino', name: 'Casino Rambla' },
      weatherSensitivity: 'transit_only',
      cognitiveLoad: 1,
      physicalLoad: 1,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },

    // 2. Cursada Redes (Martes 14:00 – 16:00)
    {
      id: 'ev_cursada_redes',
      name: 'Cursada: Redes de Computadoras',
      category: 'cursada',
      emoji: '🎓',
      start: makeDate(1, 14),
      duration: 120,
      is_locked: true,
      location: { type: 'facultad', name: 'Facultad de Ingeniería' },
      weatherSensitivity: 'none',
      cognitiveLoad: 2,
      physicalLoad: 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },

    // 3. Estudio AyDS (Miércoles 15:00 – 17:00)
    {
      id: 'ev_estudio_ayds',
      name: 'Estudio: Análisis y Diseño de Sistemas',
      category: 'estudio',
      emoji: '💻',
      start: makeDate(2, 15),
      duration: 120,
      is_locked: false,
      location: { type: 'casa', name: 'Casa' },
      weatherSensitivity: 'none',
      cognitiveLoad: 3,
      physicalLoad: 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },

    // 4. Batch Cooking (Jueves 18:00 – 20:00)
    {
      id: 'ev_cooking_jue',
      name: 'Batch Cooking Semanal',
      category: 'batch_cooking',
      emoji: '🍲',
      start: makeDate(3, 18),
      duration: 120,
      is_locked: false,
      location: { type: 'casa', name: 'Casa' },
      weatherSensitivity: 'none',
      cognitiveLoad: 1,
      physicalLoad: 1,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },

    // 5. Turno Ferro San Juan (Viernes 17:00 – 01:00 AM)
    {
      id: 'ev_ferro_vie',
      name: 'Turno Ferro San Juan (Cierre)',
      category: 'trabajo',
      emoji: '🍕',
      start: makeDate(4, 17),
      duration: 480,
      is_locked: true,
      location: { type: 'ferro_san_juan', name: 'Ferro San Juan' },
      weatherSensitivity: 'transit_only',
      cognitiveLoad: 1,
      physicalLoad: 2,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },

    // 6. Mate con Juancito (Sábado 16:00 – 18:00)
    {
      id: 'ev_mate_juancito',
      name: 'Mate y charla con Juancito',
      category: 'social',
      emoji: '🧉',
      start: makeDate(5, 16),
      duration: 120,
      is_locked: false,
      contacts: ['Juancito'],
      location: { type: 'exterior_rambla', name: 'Rambla Casino' },
      weatherSensitivity: 'outdoor_full',
      cognitiveLoad: 0,
      physicalLoad: 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },

    // 7. Sesión de Recuperación / Cannabis (Sábado 21:00 – 23:00)
    {
      id: 'ev_cannabis_recup',
      name: 'Descanso y relajación privada',
      category: 'recuperacion',
      emoji: '🌿',
      start: makeDate(5, 21),
      duration: 120,
      is_locked: false,
      is_sensitive: true,
      cannabis_consumed: true, // Triggers GHC-01
      displayAlias: 'Tiempo Personal',
      location: { type: 'casa', name: 'Casa' },
      weatherSensitivity: 'none',
      cognitiveLoad: 0,
      physicalLoad: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },
  ];
}

export default function MiMesaHome() {
  const [schedule, setSchedule] = useState<Event[]>([]);
  const [weather, setWeather] = useState<WeatherCondition[]>([]);
  const [params, setParams] = useState<ConstraintParams>(defaultParams);
  const [metaSliders, setMetaSliders] = useState<MetaSliderValues>(defaultMetaSliders);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);

  // Modals & Panels
  const [showConstraintPanel, setShowConstraintPanel] = useState<boolean>(false);
  const [showPlanningSession, setShowPlanningSession] = useState<boolean>(false);
  const [showDiffModal, setShowDiffModal] = useState<boolean>(false);
  const [showSimulationModal, setShowSimulationModal] = useState<boolean>(false);
  const [showRetrospective, setShowRetrospective] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [currentAnchorDate, setCurrentAnchorDate] = useState<Date>(new Date());
  const [defaultModalDate, setDefaultModalDate] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Solver Proposed State
  const [proposedSchedule, setProposedSchedule] = useState<Event[]>([]);
  const [proposedTraces, setProposedTraces] = useState<ConstraintTrace[]>([]);
  const [solvingDurationMs, setSolvingDurationMs] = useState<number>(18.5);

  // NLU input
  const [naturalTextInput, setNaturalTextInput] = useState<string>('');
  const [isProcessingNLU, setIsProcessingNLU] = useState<boolean>(false);

  // Initialize data on mount
  useEffect(() => {
    // 1. Load Weather
    fetchMDPWeather().then(setWeather).catch(() => {
      setWeather(generateSyntheticMDPWeather());
    });

    // 2. Load Stored Events or Fallback
    const storedEvents = store.getEvents();
    if (storedEvents.length > 0) {
      setSchedule(storedEvents);
    } else {
      const initial = createInitialSchedule();
      setSchedule(initial);
      store.saveEvents(initial);
    }

    // 3. Load Params
    const storedParams = store.getParams();
    setParams(storedParams);

    // 4. Supabase Cloud Sync & Realtime Subscription (§2.3)
    if (isSupabaseConfigured && supabase) {
      syncClient.fetchAllEvents().then((remoteEvents) => {
        if (remoteEvents.length > 0) {
          setSchedule((current) => {
            const merged = [...current];
            for (const remote of remoteEvents) {
              const localIndex = merged.findIndex((e) => e.id === remote.id);
              if (localIndex >= 0) {
                merged[localIndex] = resolveConflictLWW(merged[localIndex], remote);
              } else {
                merged.push(remote);
              }
            }
            store.saveEvents(merged);
            return merged;
          });
        }
      });

      // Listen for changes from other devices in Realtime
      const channel = supabase
        .channel('realtime_mimesa_events')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'mimesa_events' },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const row: any = payload.new;
              const remoteEvent: Event = {
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
              };

              setSchedule((current) => {
                const idx = current.findIndex((e) => e.id === remoteEvent.id);
                let nextList = [...current];
                if (idx >= 0) {
                  nextList[idx] = resolveConflictLWW(nextList[idx], remoteEvent);
                } else {
                  nextList.push(remoteEvent);
                }
                store.saveEvents(nextList);
                return nextList;
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as any)?.id;
              if (deletedId) {
                setSchedule((current) => {
                  const nextList = current.filter((e) => e.id !== deletedId);
                  store.saveEvents(nextList);
                  return nextList;
                });
              }
            }
          }
        )
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    }
  }, []);

  // Real-time evaluation of current schedule
  const currentEval = useMemo(() => {
    if (schedule.length === 0 || weather.length === 0) {
      return {
        score: 82,
        hardViolationsCount: 0,
        ghcPenalties: {},
        softPenalties: {},
      };
    }
    const evaluated = evaluateSchedule(schedule, weather, params, contacts, weights, metaSliders);
    return {
      score: evaluated.score,
      hardViolationsCount: 0,
      ghcPenalties: evaluated.ghcPenalties,
      softPenalties: evaluated.softPenalties,
    };
  }, [schedule, weather, params, contacts, weights, metaSliders]);

  // Universal Lock Toggle Handler (§29.3)
  const handleToggleLock = (eventId: string) => {
    let targetEvent: Event | undefined;
    const updated = schedule.map((e) => {
      if (e.id === eventId) {
        targetEvent = {
          ...e,
          is_locked: !e.is_locked,
          updatedAt: new Date(),
        };
        return targetEvent;
      }
      return e;
    });

    setSchedule(updated);
    store.saveEvents(updated);

    if (isSupabaseConfigured && targetEvent) {
      syncClient.pushEvent(sanitizeForCloudSync(targetEvent));
    }
  };

  // Manual Event Deletion with recurrence scoping
  const handleDeleteEvent = async (
    eventId: string,
    scope: 'this_event' | 'this_and_following' | 'all' = 'this_event'
  ) => {
    const target = schedule.find((e) => e.id === eventId);
    if (!target) return;

    let updated: Event[];
    let deletedIds: string[] = [];

    if (!target.recurrenceId || scope === 'this_event') {
      deletedIds = [eventId];
      // Also clean up any associated travel events for this specific occurrence
      const targetTime = new Date(target.start).getTime();
      const travelIds = schedule
        .filter(
          (e) =>
            e.category === 'traslado' &&
            Math.abs(new Date(e.start).getTime() - targetTime) <= 12 * 60 * 60 * 1000 &&
            (e.name.toLowerCase().includes(target.name.toLowerCase()) ||
              (target.location?.name && e.location?.name && e.location.name === target.location.name))
        )
        .map((e) => e.id);
      deletedIds.push(...travelIds);
      updated = schedule.filter((e) => !deletedIds.includes(e.id));
      showToast(`✓ Se eliminó el evento "${target.name}"`);
    } else if (scope === 'this_and_following') {
      const targetStartDay = new Date(target.start);
      targetStartDay.setHours(0, 0, 0, 0);

      const toDelete = schedule.filter((e) => {
        if (e.recurrenceId === target.recurrenceId) {
          return new Date(e.start).getTime() >= targetStartDay.getTime();
        }
        if (
          e.category === 'traslado' &&
          e.recurrenceId === `${target.recurrenceId}_travel` &&
          new Date(e.start).getTime() >= targetStartDay.getTime()
        ) {
          return true;
        }
        return e.id === target.id;
      });
      deletedIds = toDelete.map((e) => e.id);
      updated = schedule.filter((e) => !deletedIds.includes(e.id));
      showToast(`✓ Se eliminaron este y los siguientes eventos de "${target.name}"`);
    } else {
      // scope === 'all'
      const toDelete = schedule.filter(
        (e) =>
          e.recurrenceId === target.recurrenceId ||
          (e.category === 'traslado' && e.recurrenceId === `${target.recurrenceId}_travel`) ||
          e.id === target.id
      );
      deletedIds = toDelete.map((e) => e.id);
      updated = schedule.filter((e) => !deletedIds.includes(e.id));
      showToast(`✓ Se eliminó toda la serie de "${target.name}"`);
    }

    setSchedule(updated);
    store.saveEvents(updated);

    if (isSupabaseConfigured) {
      for (const id of deletedIds) {
        await syncClient.deleteEvent(id);
      }
    }
  };

  // Full Week Wipe
  const handleClearWeek = async () => {
    if (schedule.length === 0) return;
    if (
      window.confirm(
        '¿Vaciar todos los eventos de la semana? Esta acción eliminará los eventos en este dispositivo y en la nube.'
      )
    ) {
      const idsToDelete = schedule.map((e) => e.id);
      setSchedule([]);
      store.saveEvents([]);

      if (isSupabaseConfigured) {
        for (const id of idsToDelete) {
          await syncClient.deleteEvent(id);
        }
      }
    }
  };

  // Run Solver
  const runCSP = () => {
    const result: SolverResult = solveMiMesa({
      schedule,
      weather,
      params,
      contacts,
      weights,
    });

    setProposedSchedule(result.schedule);
    setProposedTraces(result.constraintTrace);
    setSolvingDurationMs(result.solvingTimeMs);
    setShowDiffModal(true);
  };

  // Accept solver proposal
  const handleAcceptDiff = () => {
    setSchedule(proposedSchedule);
    store.saveEvents(proposedSchedule);
    setShowDiffModal(false);
  };

  // Discard solver proposal
  const handleDiscardDiff = () => {
    setShowDiffModal(false);
  };

  // Export to .ics
  const handleExportIcs = () => {
    const icsContent = generateIcalCalendar(schedule, 'MiMesa de Matu');
    downloadIcsFile(icsContent, 'mimesa-agenda-semanal.ics');
  };

  // Handle Save from EventFormModal (Create or Edit with recurrence scoping)
  const handleSaveEvent = (
    savedEvent: Event,
    travelEvents?: Event[],
    recurringInstances?: Event[],
    impactScope: 'this_event' | 'this_and_following' = 'this_event',
    originalEvent?: Event | null
  ) => {
    let nextSchedule = [...schedule];

    if (originalEvent && originalEvent.recurrenceId && impactScope === 'this_and_following') {
      // SPLIT / UPDATE FROM THIS EVENT FORWARD
      const origRecurrenceId = originalEvent.recurrenceId;
      const splitDay = new Date(originalEvent.start);
      splitDay.setHours(0, 0, 0, 0);

      // 1. Keep prior occurrences of this recurrence, discard split day and later
      const priorEvents = nextSchedule.filter((e) => {
        if (e.recurrenceId === origRecurrenceId) {
          return new Date(e.start).getTime() < splitDay.getTime();
        }
        if (e.category === 'traslado' && e.recurrenceId === `${origRecurrenceId}_travel`) {
          return new Date(e.start).getTime() < splitDay.getTime();
        }
        if (e.id === originalEvent.id) {
          return false;
        }
        return true;
      });

      // 2. Add new instances starting from the new date
      const eventsToAdd = recurringInstances && recurringInstances.length > 0 ? recurringInstances : [savedEvent];
      nextSchedule = [...priorEvents, ...eventsToAdd];

      if (travelEvents && travelEvents.length > 0) {
        nextSchedule.push(...travelEvents);
      }

      showToast(`✓ Serie actualizada a partir del ${new Date(savedEvent.start).toLocaleDateString('es-AR')}`);
    } else if (originalEvent) {
      // Single event edit (or this_event scope)
      const index = nextSchedule.findIndex((e) => e.id === originalEvent.id);
      if (index >= 0) {
        nextSchedule[index] = savedEvent;
      } else {
        nextSchedule.push(savedEvent);
      }

      if (travelEvents && travelEvents.length > 0) {
        nextSchedule.push(...travelEvents);
      }

      showToast(`✓ Cambios guardados para "${savedEvent.name}"`);
    } else {
      // Creating new event
      const eventsToAdd = recurringInstances && recurringInstances.length > 0 ? recurringInstances : [savedEvent];
      nextSchedule.push(...eventsToAdd);

      if (travelEvents && travelEvents.length > 0) {
        nextSchedule.push(...travelEvents);
      }

      showToast(`✓ Evento "${savedEvent.name}" agregado al calendario`);
    }

    setSchedule(nextSchedule);
    store.saveEvents(nextSchedule);

    // Auto-focus calendar on the date/week of the saved event
    setCurrentAnchorDate(new Date(savedEvent.start));

    if (isSupabaseConfigured) {
      const eventsToPush = recurringInstances && recurringInstances.length > 0 ? recurringInstances : [savedEvent];
      for (const ev of eventsToPush) {
        syncClient.pushEvent(sanitizeForCloudSync(ev));
      }
      if (travelEvents) {
        for (const t of travelEvents) {
          syncClient.pushEvent(sanitizeForCloudSync(t));
        }
      }
    }
  };

  // NLU submission
  const handleNluSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalTextInput.trim()) return;

    setIsProcessingNLU(true);
    try {
      const parsedPartial = await geminiClient.parseNaturalLanguageToEvent(naturalTextInput);
      const newEvent: Event = {
        id: `ev_nlu_${Date.now()}`,
        name: parsedPartial.name || naturalTextInput,
        category: parsedPartial.category || 'otro',
        emoji: parsedPartial.emoji || '📅',
        start: parsedPartial.start || new Date(),
        duration: parsedPartial.duration || 60,
        is_locked: false,
        location: parsedPartial.location || { type: 'casa', name: 'Casa' },
        weatherSensitivity: parsedPartial.weatherSensitivity || 'none',
        cognitiveLoad: parsedPartial.cognitiveLoad ?? 1,
        physicalLoad: parsedPartial.physicalLoad ?? 0,
        is_sensitive: parsedPartial.is_sensitive ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deviceId: 'local',
        localVersion: 1,
        syncStatus: 'synced',
      };

      // Auto-detect travel buffers for Rambla, Ferro, and Facultad
      const isWork = newEvent.category === 'trabajo';
      const isRambla =
        newEvent.location?.type === 'rambla_casino' ||
        newEvent.name.toLowerCase().includes('rambla') ||
        newEvent.name.toLowerCase().includes('casino');
      const isFerro =
        newEvent.location?.type === 'ferro_san_juan' ||
        newEvent.name.toLowerCase().includes('ferro') ||
        newEvent.name.toLowerCase().includes('san juan');
      const isFacultad =
        newEvent.category === 'cursada' ||
        newEvent.location?.type === 'facultad' ||
        newEvent.name.toLowerCase().includes('facultad') ||
        newEvent.name.toLowerCase().includes('cursada') ||
        newEvent.name.toLowerCase().includes('ufasta');

      const travelEvents: Event[] = [];
      if ((isWork && (isRambla || isFerro)) || isFacultad) {
        let buf = params.travel_buffer_facultad || 40;
        let locName = 'Facultad de Ingeniería';
        let locType: any = 'facultad';

        if (isWork) {
          buf = isFerro ? params.travel_buffer_ferro : params.travel_buffer_casino;
          locName = isFerro ? 'Ferro San Juan' : 'Casino Rambla';
          locType = isFerro ? 'ferro_san_juan' : 'rambla_casino';
        }

        travelEvents.push({
          id: `ev_traslado_ida_${Date.now()}`,
          name: `Traslado a ${locName}`,
          category: 'traslado',
          emoji: '🚌',
          start: new Date(newEvent.start.getTime() - buf * 60000),
          duration: buf,
          is_locked: false,
          location: { type: locType, name: locName },
          weatherSensitivity: 'transit_only',
          cognitiveLoad: 0,
          physicalLoad: 0,
          is_sensitive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deviceId: 'local',
          localVersion: 1,
          syncStatus: 'synced',
        });

        travelEvents.push({
          id: `ev_traslado_vuelta_${Date.now() + 1}`,
          name: `Traslado desde ${locName}`,
          category: 'traslado',
          emoji: '🚌',
          start: new Date(newEvent.start.getTime() + newEvent.duration * 60000),
          duration: buf,
          is_locked: false,
          location: { type: 'casa', name: 'Casa' },
          weatherSensitivity: 'transit_only',
          cognitiveLoad: 0,
          physicalLoad: 0,
          is_sensitive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deviceId: 'local',
          localVersion: 1,
          syncStatus: 'synced',
        });
      }

      const updated = [...schedule, newEvent, ...travelEvents];
      setSchedule(updated);
      store.saveEvents(updated);
      setNaturalTextInput('');

      if (isSupabaseConfigured) {
        syncClient.pushEvent(sanitizeForCloudSync(newEvent));
        for (const t of travelEvents) {
          syncClient.pushEvent(sanitizeForCloudSync(t));
        }
      }
    } finally {
      setIsProcessingNLU(false);
    }
  };

  // Quick weather header
  const currentComfort = weather[0]?.comfortScore ?? 80;
  const currentTemp = weather[0]?.temperatureCelsius ?? 19;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between shadow-lg">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white">MiMesa Scheduler</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-mono font-bold">
                v1.1 CSP
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Mar del Plata · Determinismo matemático offline</p>
          </div>
        </div>

        {/* Mar del Plata Weather Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-200">MDP: {currentTemp}°C</span>
          <span className="text-slate-500">|</span>
          <span
            className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
              currentComfort >= 70
                ? 'bg-emerald-950 text-emerald-300'
                : currentComfort >= 40
                ? 'bg-amber-950 text-amber-300'
                : 'bg-rose-950 text-rose-300'
            }`}
          >
            ComfortScore: {currentComfort}
          </span>
        </div>

        {/* Cloud Sync Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono">
          {isSupabaseConfigured ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Supabase Realtime
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Local-First (Offline)
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Constructor Manual de Eventos */}
          <button
            onClick={() => {
              setEditingEvent(null);
              setDefaultModalDate(currentAnchorDate);
              setShowEventModal(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            title="Abrir constructor visual de eventos (con categorías, traslados y recurrencia)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo Evento</span>
          </button>

          {/* Planificar Semana */}
          <button
            onClick={() => setShowPlanningSession(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            title="Iniciar ritual dominical de planificación en 5 pasos"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Planificar Semana</span>
          </button>

          {/* Optimizar Ahora con CSP */}
          <button
            onClick={runCSP}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Resolver agenda con CSP en < 50ms"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Optimizar CSP</span>
          </button>

          {/* Simulación */}
          <button
            onClick={() => setShowSimulationModal(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors"
            title="Modo Simulación (Sandbox 'Y si...')"
          >
            <FlaskConical className="w-4 h-4 text-purple-400" />
          </button>

          {/* Retrospectiva */}
          <button
            onClick={() => setShowRetrospective(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors"
            title="Retrospectiva Semanal"
          >
            <History className="w-4 h-4 text-amber-400" />
          </button>

          {/* Exportar iCal */}
          <button
            onClick={handleExportIcs}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors"
            title="Exportar semana a .ics (Google / Apple Calendar con privacidad P4)"
          >
            <Download className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Settings / Constraints Panel */}
          <button
            onClick={() => setShowConstraintPanel(!showConstraintPanel)}
            className={`p-2 rounded-xl border transition-colors ${
              showConstraintPanel
                ? 'bg-indigo-950 border-indigo-500 text-indigo-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Configurar restricciones y parámetros (P9)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Natural Language Quick Input Bar (§5.1) */}
        <form
          onSubmit={handleNluSubmit}
          className="relative bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center shadow-xl focus-within:border-indigo-500 transition-colors"
        >
          <div className="pl-3 pr-2 text-indigo-400">
            <MessageSquarePlus className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={naturalTextInput}
            onChange={(e) => setNaturalTextInput(e.target.value)}
            placeholder="Agregá eventos en lenguaje natural (ej. 'Tengo parcial de Redes el viernes a las 10' o 'Mate con Juancito el martes a las 17')..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            disabled={isProcessingNLU}
          />
          <button
            type="submit"
            disabled={isProcessingNLU || !naturalTextInput.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1"
          >
            {isProcessingNLU ? 'Parseando...' : <><Plus className="w-3.5 h-3.5" /> Agregar</>}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setDefaultModalDate(currentAnchorDate);
              setShowEventModal(true);
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all border border-slate-700 ml-1.5 flex items-center gap-1"
            title="Abrir Constructor de Evento"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Constructor</span>
          </button>
        </form>

        {/* Top Widget Bar: ScoreWidget & Meta-Sliders Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ScoreWidget
              score={currentEval.score}
              scoreBreakdown={{
                hardViolationsCount: currentEval.hardViolationsCount,
                ghcPenalties: currentEval.ghcPenalties,
                softPenalties: currentEval.softPenalties,
              }}
              solvingTimeMs={solvingDurationMs}
            />
          </div>

          <div className="lg:col-span-2">
            <MetaSliders values={metaSliders} onChange={setMetaSliders} />
          </div>
        </div>

        {/* Constraint Panel (Expandable) */}
        {showConstraintPanel && (
          <div className="animate-fadeIn">
            <ConstraintPanel
              params={params}
              onParamsChange={(newP) => {
                setParams(newP);
                store.saveParams(newP);
              }}
              metaSliders={metaSliders}
              onMetaSlidersChange={setMetaSliders}
              weights={weights}
              onWeightChange={(key, w) => setWeights({ ...weights, [key]: w })}
            />
          </div>
        )}

        {/* Primary Spatial Calendar Grid (§29.2 & §29.3) */}
        <section className="flex-1 min-h-[600px] flex flex-col">
          <CalendarGrid
            events={schedule}
            weather={weather}
            anchorDate={currentAnchorDate}
            onAnchorDateChange={setCurrentAnchorDate}
            onToggleLock={handleToggleLock}
            onDeleteEvent={handleDeleteEvent}
            onEditEvent={(ev) => {
              setEditingEvent(ev);
              setDefaultModalDate(new Date(ev.start));
              setShowEventModal(true);
            }}
            onSlotClick={(clickedDate) => {
              setEditingEvent(null);
              setDefaultModalDate(clickedDate);
              setShowEventModal(true);
            }}
            onClearWeek={handleClearWeek}
          />
        </section>
      </main>

      {/* Floating Action Button: WhatShouldIDoNow (§17.3) */}
      <WhatShouldIDoNow
        currentSchedule={schedule}
        weather={weather}
        params={params}
        contacts={contacts}
        onAddEvent={(newEv) => {
          const updated = [...schedule, newEv];
          setSchedule(updated);
          store.saveEvents(updated);
        }}
      />

      {/* Modals */}
      <DiffViewerModal
        isOpen={showDiffModal}
        onClose={() => setShowDiffModal(false)}
        traces={proposedTraces}
        originalSchedule={schedule}
        proposedSchedule={proposedSchedule}
        scoreBefore={currentEval.score}
        scoreAfter={evaluateSchedule(proposedSchedule, weather, params, contacts, weights, metaSliders).score}
        onAccept={handleAcceptDiff}
        onDiscard={handleDiscardDiff}
        onManualAdjust={() => {
          setShowDiffModal(false);
          setShowConstraintPanel(true);
        }}
      />

      <WeeklyPlanningSession
        isOpen={showPlanningSession}
        onClose={() => setShowPlanningSession(false)}
        currentSchedule={schedule}
        weather={weather}
        params={params}
        contacts={contacts}
        weights={weights}
        onFinishOptimization={(res) => {
          setProposedSchedule(res.schedule);
          setProposedTraces(res.constraintTrace);
          setSolvingDurationMs(res.solvingTimeMs);
          setShowDiffModal(true);
        }}
      />

      <SimulationMode
        isOpen={showSimulationModal}
        onClose={() => setShowSimulationModal(false)}
        baseSchedule={schedule}
        weather={weather}
        params={params}
        contacts={contacts}
        weights={weights}
        onApplySimulation={(newSched) => {
          setSchedule(newSched);
          store.saveEvents(newSched);
        }}
      />

      <RetrospectiveView
        isOpen={showRetrospective}
        onClose={() => setShowRetrospective(false)}
        projectedScore={85}
        actualScore={currentEval.score}
        completedEvents={schedule}
        onStartNewPlan={() => {
          setShowRetrospective(false);
          setShowPlanningSession(true);
        }}
      />

      <OnboardingWizard
        isOpen={showOnboarding}
        onComplete={(initEvents, initContacts, initParams) => {
          setSchedule(initEvents);
          setContacts(initContacts);
          setParams(initParams);
          store.saveEvents(initEvents);
          store.saveParams(initParams);
          setShowOnboarding(false);
        }}
      />

      {/* Constructor & Editor de Eventos */}
      <EventFormModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
          setDefaultModalDate(null);
        }}
        onSave={handleSaveEvent}
        initialEvent={editingEvent}
        defaultDate={defaultModalDate || currentAnchorDate}
        travelBufferCasino={params.travel_buffer_casino}
        travelBufferFerro={params.travel_buffer_ferro}
        travelBufferFacultad={params.travel_buffer_facultad}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn flex items-center gap-2.5 px-4 py-3 bg-emerald-950/95 border border-emerald-500/60 rounded-xl text-emerald-100 text-xs font-semibold shadow-2xl backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
