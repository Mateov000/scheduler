'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Car,
  Check,
  Clock,
  Lock,
  MapPin,
  Repeat,
  Shield,
  Sparkles,
  Unlock,
  X,
  Zap,
} from 'lucide-react';
import { DayOfWeek, Event, EventCategory, Location, LocationType, RecurrenceFrequency, RecurrencePattern, WeatherSensitivity } from '../lib/scheduler/types';
import { expandRecurrencePattern } from '../lib/scheduler/recurrence';

export type RecurrenceImpactScope = 'this_event' | 'this_and_following';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    event: Event,
    travelEvents?: Event[],
    recurringInstances?: Event[],
    impactScope?: RecurrenceImpactScope,
    originalEvent?: Event | null
  ) => void;
  initialEvent?: Event | null;
  defaultDate?: Date | null;
  existingEvents?: Event[];
  travelBufferCasino?: number;
  travelBufferFerro?: number;
  travelBufferFacultad?: number;
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const CATEGORIES: { id: EventCategory; label: string; emoji: string; color: string }[] = [
  { id: 'trabajo', label: 'Trabajo / Turno', emoji: '💼', color: 'bg-blue-600' },
  { id: 'cursada', label: 'Cursada Facultad', emoji: '🎓', color: 'bg-purple-600' },
  { id: 'estudio', label: 'Estudio / Deep Work', emoji: '📚', color: 'bg-cyan-600' },
  { id: 'social', label: 'Social / Amigos', emoji: '🤝', color: 'bg-emerald-600' },
  { id: 'gym', label: 'Gimnasio / Entreno', emoji: '💪', color: 'bg-amber-600' },
  { id: 'batch_cooking', label: 'Batch Cooking', emoji: '🍲', color: 'bg-orange-600' },
  { id: 'comida', label: 'Comida', emoji: '🍽️', color: 'bg-yellow-600' },
  { id: 'sueno', label: 'Sueño / Descanso', emoji: '😴', color: 'bg-slate-600' },
  { id: 'traslado', label: 'Traslado', emoji: '🚌', color: 'bg-zinc-600' },
  { id: 'recuperacion', label: 'Recuperación', emoji: '🌿', color: 'bg-pink-600' },
  { id: 'tramites', label: 'Trámites', emoji: '📋', color: 'bg-teal-600' },
  { id: 'desarrollo_personal', label: 'Desarrollo Personal', emoji: '🧠', color: 'bg-indigo-600' },
  { id: 'otro', label: 'Otro', emoji: '📅', color: 'bg-neutral-600' },
];

const PREDEFINED_LOCATIONS: { type: LocationType; name: string }[] = [
  { type: 'casa', name: 'Casa' },
  { type: 'rambla_casino', name: 'Casino Rambla' },
  { type: 'ferro_san_juan', name: 'Ferro San Juan' },
  { type: 'facultad', name: 'Facultad de Ingeniería (UFASTA)' },
  { type: 'cafe_guemes', name: 'Café Güemes' },
  { type: 'paseo_aldrey', name: 'Paseo Aldrey' },
  { type: 'gym', name: 'Gimnasio' },
  { type: 'exterior_rambla', name: 'Rambla / Costa al aire libre' },
  { type: 'exterior_plaza', name: 'Plaza / Parque' },
  { type: 'custom', name: 'Otra ubicación...' },
];

const DURATION_PRESETS = [30, 45, 60, 90, 120, 180, 240, 360, 480, 540];

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEvent,
  defaultDate,
  existingEvents = [],
  travelBufferCasino = 30,
  travelBufferFerro = 45,
  travelBufferFacultad = 40,
}) => {
  const isEdit = !!initialEvent;

  // Form State
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<EventCategory>('trabajo');
  const [emoji, setEmoji] = useState<string>('💼');
  const [startDateStr, setStartDateStr] = useState<string>('');
  const [startTimeStr, setStartTimeStr] = useState<string>('10:00');
  const [duration, setDuration] = useState<number>(120);
  const [locationType, setLocationType] = useState<LocationType>('rambla_casino');
  const [customLocationName, setCustomLocationName] = useState<string>('');
  const [cognitiveLoad, setCognitiveLoad] = useState<0 | 1 | 2 | 3>(1);
  const [physicalLoad, setPhysicalLoad] = useState<0 | 1 | 2 | 3>(1);
  const [weatherSensitivity, setWeatherSensitivity] = useState<WeatherSensitivity>('none');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSensitive, setIsSensitive] = useState<boolean>(false);
  const [cannabisConsumed, setCannabisConsumed] = useState<boolean>(false);

  // Suggested Associated Travel Buffers (Independent Ida / Vuelta)
  const [includeTravelIda, setIncludeTravelIda] = useState<boolean>(true);
  const [includeTravelVuelta, setIncludeTravelVuelta] = useState<boolean>(true);
  const [travelBufferMinutes, setTravelBufferMinutes] = useState<number>(30);

  // Recurrence State
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFrequency>('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState<DayOfWeek[]>([1]); // default lunes
  const [untilDateStr, setUntilDateStr] = useState<string>('');
  const [showScopeModal, setShowScopeModal] = useState<boolean>(false);

  // Reset or initialize fields ONLY when modal opens or initialEvent changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialEvent) {
      setName(initialEvent.name);
      setCategory(initialEvent.category);
      setEmoji(initialEvent.emoji || '📅');
      const d = new Date(initialEvent.start);
      setStartDateStr(formatLocalDate(d));
      setStartTimeStr(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      );
      setDuration(initialEvent.duration);
      setLocationType(initialEvent.location?.type || 'casa');
      setCustomLocationName(initialEvent.location?.name || '');
      setCognitiveLoad(initialEvent.cognitiveLoad ?? 1);
      setPhysicalLoad(initialEvent.physicalLoad ?? 0);
      setWeatherSensitivity(initialEvent.weatherSensitivity || 'none');
      setIsLocked(initialEvent.is_locked ?? false);
      setIsSensitive(initialEvent.is_sensitive ?? false);
      setCannabisConsumed(initialEvent.cannabis_consumed ?? false);

      const hasRecurrence = !!initialEvent.recurrenceId;
      setIsRecurring(hasRecurrence);
      if (initialEvent.recurrenceFrequency) {
        setRecurrenceFreq(initialEvent.recurrenceFrequency);
      } else {
        setRecurrenceFreq('weekly');
      }

      if (initialEvent.recurrenceUntil) {
        setUntilDateStr(formatLocalDate(new Date(initialEvent.recurrenceUntil)));
      }

      if (hasRecurrence && existingEvents && existingEvents.length > 0) {
        const seriesEvents = existingEvents.filter(
          (e) => e.recurrenceId === initialEvent.recurrenceId
        );
        if (seriesEvents.length > 0) {
          const days = Array.from(
            new Set(seriesEvents.map((e) => new Date(e.start).getDay() as DayOfWeek))
          ).sort();
          setRecurrenceDays(days.length > 0 ? days : [d.getDay() as DayOfWeek]);

          if (!initialEvent.recurrenceUntil) {
            const latestStart = seriesEvents.reduce(
              (max, e) => (new Date(e.start) > max ? new Date(e.start) : max),
              d
            );
            setUntilDateStr(formatLocalDate(latestStart));
          }
        } else {
          setRecurrenceDays([d.getDay() as DayOfWeek]);
          if (!initialEvent.recurrenceUntil) {
            const fourWeeksLater = new Date(d);
            fourWeeksLater.setDate(d.getDate() + 28);
            setUntilDateStr(formatLocalDate(fourWeeksLater));
          }
        }
      } else {
        setRecurrenceDays([d.getDay() as DayOfWeek]);
        if (!initialEvent.recurrenceUntil) {
          const fourWeeksLater = new Date(d);
          fourWeeksLater.setDate(d.getDate() + 28);
          setUntilDateStr(formatLocalDate(fourWeeksLater));
        }
      }

      setIncludeTravelIda(false);
      setIncludeTravelVuelta(false);
      setTravelBufferMinutes(30);
      setShowScopeModal(false);
    } else {
      setName('');
      setCategory('trabajo');
      setEmoji('💼');
      const d = defaultDate ? new Date(defaultDate) : new Date();
      setStartDateStr(formatLocalDate(d));
      setStartTimeStr(
        defaultDate
          ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
          : '10:00'
      );
      setDuration(120);
      setLocationType('rambla_casino');
      setCustomLocationName('');
      setCognitiveLoad(1);
      setPhysicalLoad(1);
      setWeatherSensitivity('none');
      setIsLocked(false);
      setIsSensitive(false);
      setCannabisConsumed(false);
      setIncludeTravelIda(true);
      setIncludeTravelVuelta(true);
      setTravelBufferMinutes(travelBufferCasino);
      setIsRecurring(false);
      setRecurrenceFreq('weekly');
      setRecurrenceDays([d.getDay() as DayOfWeek]);
      // Default until 4 weeks later
      const fourWeeksLater = new Date(d);
      fourWeeksLater.setDate(d.getDate() + 28);
      setUntilDateStr(formatLocalDate(fourWeeksLater));
    }
  }, [isOpen, initialEvent]); // STABLE DEPENDENCIES: Never re-runs when inputs or buttons change!

  if (!isOpen) return null;

  // Sync category change with emoji & smart defaults
  const handleCategorySelect = (cat: EventCategory) => {
    setCategory(cat);
    const meta = CATEGORIES.find((c) => c.id === cat);
    if (meta) {
      setEmoji(meta.emoji);
    }
    if (cat === 'trabajo') {
      setLocationType('rambla_casino');
      setCognitiveLoad(1);
      setPhysicalLoad(1);
      setIncludeTravelIda(true);
      setIncludeTravelVuelta(true);
      setTravelBufferMinutes(travelBufferCasino);
    } else if (cat === 'cursada') {
      setLocationType('facultad');
      setCognitiveLoad(2);
      setPhysicalLoad(0);
      setDuration(120);
      setIncludeTravelIda(true);
      setIncludeTravelVuelta(true);
      setTravelBufferMinutes(travelBufferFacultad); // 40 min default
    } else if (cat === 'estudio') {
      setLocationType('casa');
      setCognitiveLoad(3);
      setPhysicalLoad(0);
      setDuration(120);
      setIncludeTravelIda(false);
      setIncludeTravelVuelta(false);
    } else if (cat === 'gym') {
      setLocationType('gym');
      setPhysicalLoad(3);
      setCognitiveLoad(0);
      setDuration(60);
      setIncludeTravelIda(false);
      setIncludeTravelVuelta(false);
    } else if (cat === 'social') {
      setLocationType('exterior_rambla');
      setCognitiveLoad(0);
      setPhysicalLoad(0);
      setIncludeTravelIda(false);
      setIncludeTravelVuelta(false);
    } else if (cat === 'batch_cooking') {
      setLocationType('casa');
      setCognitiveLoad(1);
      setPhysicalLoad(1);
      setDuration(120);
      setIncludeTravelIda(false);
      setIncludeTravelVuelta(false);
    } else if (cat === 'recuperacion') {
      setLocationType('casa');
      setIsSensitive(true);
      setCognitiveLoad(0);
      setPhysicalLoad(0);
      setIncludeTravelIda(false);
      setIncludeTravelVuelta(false);
    } else if (cat === 'comida') {
      setLocationType('casa');
      setDuration(45);
      setIncludeTravelIda(false);
      setIncludeTravelVuelta(false);
    } else if (cat === 'sueno') {
      setLocationType('casa');
      setDuration(480);
      setIncludeTravelIda(false);
      setIncludeTravelVuelta(false);
    }
  };

  // Calculate End Time from Start + Duration
  const calculateEndTimeStr = () => {
    const parts = (startTimeStr || '10:00').split(':').map((v) => parseInt(v, 10) || 0);
    const h = parts[0] ?? 10;
    const m = parts[1] ?? 0;
    const totalMinutes = h * 60 + m + (duration || 60);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  // Handle End Time change -> calculate duration
  const handleEndTimeChange = (newEndTime: string) => {
    if (!newEndTime) return;
    const [startH, startM] = startTimeStr.split(':').map((v) => parseInt(v, 10) || 0);
    const [endH, endM] = newEndTime.split(':').map((v) => parseInt(v, 10) || 0);

    let diff = (endH - startH) * 60 + (endM - startM);
    if (diff <= 0) {
      diff += 24 * 60; // Crosses midnight
    }
    setDuration(diff);
  };

  // Detect venue and suggested associated travel (Work, Facultad, or External)
  const isWorkCasino =
    category === 'trabajo' &&
    (locationType === 'rambla_casino' ||
      name.toLowerCase().includes('rambla') ||
      name.toLowerCase().includes('casino'));

  const isWorkFerro =
    category === 'trabajo' &&
    (locationType === 'ferro_san_juan' ||
      name.toLowerCase().includes('ferro') ||
      name.toLowerCase().includes('san juan'));

  const isFacultad =
    category === 'cursada' ||
    locationType === 'facultad' ||
    name.toLowerCase().includes('facultad') ||
    name.toLowerCase().includes('ufasta') ||
    name.toLowerCase().includes('cursada') ||
    name.toLowerCase().includes('ingenieria');

  // Can this event have suggested travel?
  const isEligibleForSuggestedTravel = isWorkCasino || isWorkFerro || isFacultad || locationType !== 'casa';

  let detectedVenueName = 'Destino';
  let defaultSuggestedBuffer = 30;

  if (isWorkCasino) {
    detectedVenueName = 'Casino Rambla';
    defaultSuggestedBuffer = travelBufferCasino;
  } else if (isWorkFerro) {
    detectedVenueName = 'Ferro San Juan';
    defaultSuggestedBuffer = travelBufferFerro;
  } else if (isFacultad) {
    detectedVenueName = 'Facultad de Ingeniería (UFASTA)';
    defaultSuggestedBuffer = travelBufferFacultad; // 40 min default!
  } else if (locationType === 'custom') {
    detectedVenueName = customLocationName || 'Ubicación Externa';
    defaultSuggestedBuffer = 30;
  } else {
    const match = PREDEFINED_LOCATIONS.find((l) => l.type === locationType);
    detectedVenueName = match?.name || 'Destino';
    defaultSuggestedBuffer = 30;
  }

  // Computed preview for travel buffers (Ida / Vuelta)
  const calculateTravelTimes = () => {
    if (!includeTravelIda && !includeTravelVuelta) return null;
    const parts = (startTimeStr || '10:00').split(':').map((v) => parseInt(v, 10) || 0);
    const startMins = (parts[0] ?? 10) * 60 + (parts[1] ?? 0);
    const effectiveBuffer = travelBufferMinutes || defaultSuggestedBuffer;

    const idaStartMins = (startMins - effectiveBuffer + 24 * 60) % (24 * 60);
    const idaH = Math.floor(idaStartMins / 60);
    const idaM = idaStartMins % 60;
    const idaTime = `${String(idaH).padStart(2, '0')}:${String(idaM).padStart(2, '0')}`;

    const endParts = calculateEndTimeStr().split(':').map((v) => parseInt(v, 10) || 0);
    const endMins = (endParts[0] || 0) * 60 + (endParts[1] || 0);
    const vueltaEndMins = (endMins + effectiveBuffer) % (24 * 60);
    const vueltaH = Math.floor(vueltaEndMins / 60);
    const vueltaM = vueltaEndMins % 60;
    const vueltaTime = `${String(vueltaH).padStart(2, '0')}:${String(vueltaM).padStart(2, '0')}`;

    return { idaTime, vueltaTime, effectiveBuffer };
  };
  const travelTimes = calculateTravelTimes();

  // Toggle Day in Weekly Recurrence
  const toggleDayOfWeek = (d: DayOfWeek) => {
    if (recurrenceDays.includes(d)) {
      if (recurrenceDays.length > 1) {
        setRecurrenceDays(recurrenceDays.filter((x) => x !== d));
      }
    } else {
      setRecurrenceDays([...recurrenceDays, d].sort());
    }
  };

  // Core save execution given an impact scope
  const executeSave = (impactScope: RecurrenceImpactScope) => {
    const [h, m] = startTimeStr.split(':').map((v) => parseInt(v, 10) || 0);
    const [year, month, day] = startDateStr.split('-').map((v) => parseInt(v, 10) || 0);
    const startDate = new Date(year, month - 1, day, h, m, 0, 0);

    let finalLocName = customLocationName;
    if (locationType !== 'custom') {
      const match = PREDEFINED_LOCATIONS.find((l) => l.type === locationType);
      finalLocName = match?.name || locationType;
    }

    const effectiveBuffer = travelBufferMinutes || defaultSuggestedBuffer;

    // SCENARIO 1: Explicit "Solo este evento" when editing an existing recurring event
    if (isEdit && initialEvent?.recurrenceId && impactScope === 'this_event') {
      const newEvent: Event = {
        id: initialEvent.id,
        name: name.trim() || `${category.toUpperCase()}`,
        category,
        emoji,
        start: startDate,
        duration,
        is_locked: isLocked,
        location: {
          type: locationType,
          name: finalLocName,
        },
        weatherSensitivity,
        cognitiveLoad,
        physicalLoad,
        is_sensitive: isSensitive,
        cannabis_consumed: cannabisConsumed,
        recurrenceId: initialEvent.recurrenceId,
        isRecurrenceException: true,
        createdAt: initialEvent.createdAt || new Date(),
        updatedAt: new Date(),
        deviceId: 'local',
        localVersion: (initialEvent.localVersion ?? 0) + 1,
        syncStatus: 'pending',
      };

      const singleTravelEvents: Event[] = [];
      if (includeTravelIda) {
        singleTravelEvents.push({
          id: `ev_traslado_ida_${Date.now()}`,
          name: `Traslado a ${detectedVenueName}`,
          category: 'traslado',
          emoji: '🚌',
          start: new Date(startDate.getTime() - effectiveBuffer * 60000),
          duration: effectiveBuffer,
          is_locked: isLocked,
          location: { type: locationType, name: detectedVenueName },
          weatherSensitivity: 'transit_only',
          cognitiveLoad: 0,
          physicalLoad: 0,
          is_sensitive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deviceId: 'local',
          localVersion: 1,
          syncStatus: 'pending',
        });
      }

      if (includeTravelVuelta) {
        singleTravelEvents.push({
          id: `ev_traslado_vuelta_${Date.now() + 1}`,
          name: `Traslado desde ${detectedVenueName}`,
          category: 'traslado',
          emoji: '🚌',
          start: new Date(startDate.getTime() + duration * 60000),
          duration: effectiveBuffer,
          is_locked: isLocked,
          location: { type: 'casa', name: 'Casa' },
          weatherSensitivity: 'transit_only',
          cognitiveLoad: 0,
          physicalLoad: 0,
          is_sensitive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deviceId: 'local',
          localVersion: 1,
          syncStatus: 'pending',
        });
      }

      onSave(newEvent, singleTravelEvents.length > 0 ? singleTravelEvents : undefined, undefined, 'this_event', initialEvent);
      setShowScopeModal(false);
      onClose();
      return;
    }

    // SCENARIO 2: Recurrence is enabled (isRecurring === true)
    // Applies to:
    // - New event with recurrence checked
    // - Editing non-recurring event and enabling recurrence
    // - Editing recurring event with "Este y los eventos siguientes"
    if (isRecurring) {
      let untilDate: Date;
      if (untilDateStr) {
        const [uYear, uMonth, uDay] = untilDateStr.split('-').map((v) => parseInt(v, 10) || 0);
        untilDate = new Date(uYear, uMonth - 1, uDay, 23, 59, 59, 999);
      } else {
        untilDate = new Date(startDate);
        untilDate.setDate(untilDate.getDate() + 28);
        untilDate.setHours(23, 59, 59, 999);
      }

      // Ensure untilDate is not before startDate
      if (untilDate.getTime() < startDate.getTime()) {
        untilDate = new Date(startDate);
        untilDate.setDate(untilDate.getDate() + 28);
        untilDate.setHours(23, 59, 59, 999);
      }

      const patternId = initialEvent?.recurrenceId
        ? `${initialEvent.recurrenceId}_fwd_${Date.now()}`
        : `rec_${Date.now()}`;

      const baseEventId = initialEvent?.id || `ev_${Date.now()}`;
      const newEvent: Event = {
        id: baseEventId,
        name: name.trim() || `${category.toUpperCase()}`,
        category,
        emoji,
        start: startDate,
        duration,
        is_locked: isLocked,
        location: {
          type: locationType,
          name: finalLocName,
        },
        weatherSensitivity,
        cognitiveLoad,
        physicalLoad,
        is_sensitive: isSensitive,
        cannabis_consumed: cannabisConsumed,
        recurrenceId: patternId,
        recurrenceFrequency: recurrenceFreq,
        recurrenceUntil: untilDate,
        createdAt: initialEvent?.createdAt || new Date(),
        updatedAt: new Date(),
        deviceId: 'local',
        localVersion: (initialEvent?.localVersion ?? 0) + 1,
        syncStatus: 'pending',
      };

      // Ensure effectiveRecurrenceDays has the day of startDate if weekly and empty
      const startDow = new Date(startDate).getDay() as DayOfWeek;
      let effectiveRecurrenceDays = recurrenceDays;
      if (recurrenceFreq === 'weekly') {
        if (!effectiveRecurrenceDays || effectiveRecurrenceDays.length === 0) {
          effectiveRecurrenceDays = [startDow];
        }
      }

      const pattern: RecurrencePattern = {
        id: patternId,
        frequency: recurrenceFreq,
        daysOfWeek: recurrenceFreq === 'weekly' ? effectiveRecurrenceDays : undefined,
        startDate: new Date(startDate),
        until: untilDate,
        exceptions: [],
      };

      const windowStartDate = new Date(startDate);
      windowStartDate.setHours(0, 0, 0, 0);
      const windowEndDate = new Date(untilDate);
      windowEndDate.setHours(23, 59, 59, 999);

      // Expand instances from windowStartDate up to untilDate
      let recurringInstances = expandRecurrencePattern(pattern, newEvent, windowStartDate, windowEndDate);

      // Safety guarantee: ensure at least the base event is included in recurringInstances
      if (!recurringInstances || recurringInstances.length === 0) {
        recurringInstances = [newEvent];
      }

      // Generate travel events for all recurring instances
      const allTravelEvents: Event[] = [];
      if (includeTravelIda || includeTravelVuelta) {
        recurringInstances.forEach((inst, idx) => {
          const instDate = new Date(inst.start);
          if (includeTravelIda) {
            allTravelEvents.push({
              id: `ev_traslado_ida_${inst.id}_${idx}_${Date.now()}`,
              name: `Traslado a ${detectedVenueName}`,
              category: 'traslado',
              emoji: '🚌',
              start: new Date(instDate.getTime() - effectiveBuffer * 60000),
              duration: effectiveBuffer,
              is_locked: isLocked,
              location: { type: locationType, name: detectedVenueName },
              weatherSensitivity: 'transit_only',
              cognitiveLoad: 0,
              physicalLoad: 0,
              is_sensitive: false,
              recurrenceId: `${patternId}_travel`,
              createdAt: new Date(),
              updatedAt: new Date(),
              deviceId: 'local',
              localVersion: 1,
              syncStatus: 'pending',
            });
          }
          if (includeTravelVuelta) {
            allTravelEvents.push({
              id: `ev_traslado_vuelta_${inst.id}_${idx}_${Date.now() + 1}`,
              name: `Traslado desde ${detectedVenueName}`,
              category: 'traslado',
              emoji: '🚌',
              start: new Date(instDate.getTime() + inst.duration * 60000),
              duration: effectiveBuffer,
              is_locked: isLocked,
              location: { type: 'casa', name: 'Casa' },
              weatherSensitivity: 'transit_only',
              cognitiveLoad: 0,
              physicalLoad: 0,
              is_sensitive: false,
              recurrenceId: `${patternId}_travel`,
              createdAt: new Date(),
              updatedAt: new Date(),
              deviceId: 'local',
              localVersion: 1,
              syncStatus: 'pending',
            });
          }
        });
      }

      onSave(
        newEvent,
        allTravelEvents.length > 0 ? allTravelEvents : undefined,
        recurringInstances,
        impactScope,
        initialEvent
      );
      setShowScopeModal(false);
      onClose();
      return;
    }

    // SCENARIO 3: Single event (not recurring or user turned off recurrence)
    const baseEventId = initialEvent?.id || `ev_${Date.now()}`;
    const newEvent: Event = {
      id: baseEventId,
      name: name.trim() || `${category.toUpperCase()}`,
      category,
      emoji,
      start: startDate,
      duration,
      is_locked: isLocked,
      location: {
        type: locationType,
        name: finalLocName,
      },
      weatherSensitivity,
      cognitiveLoad,
      physicalLoad,
      is_sensitive: isSensitive,
      cannabis_consumed: cannabisConsumed,
      recurrenceId: undefined, // Recurrence is off
      createdAt: initialEvent?.createdAt || new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: (initialEvent?.localVersion ?? 0) + 1,
      syncStatus: 'pending',
    };

    const singleTravelEvents: Event[] = [];
    if (includeTravelIda) {
      singleTravelEvents.push({
        id: `ev_traslado_ida_${Date.now()}`,
        name: `Traslado a ${detectedVenueName}`,
        category: 'traslado',
        emoji: '🚌',
        start: new Date(startDate.getTime() - effectiveBuffer * 60000),
        duration: effectiveBuffer,
        is_locked: isLocked,
        location: { type: locationType, name: detectedVenueName },
        weatherSensitivity: 'transit_only',
        cognitiveLoad: 0,
        physicalLoad: 0,
        is_sensitive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deviceId: 'local',
        localVersion: 1,
        syncStatus: 'pending',
      });
    }
    if (includeTravelVuelta) {
      singleTravelEvents.push({
        id: `ev_traslado_vuelta_${Date.now() + 1}`,
        name: `Traslado desde ${detectedVenueName}`,
        category: 'traslado',
        emoji: '🚌',
        start: new Date(startDate.getTime() + duration * 60000),
        duration: effectiveBuffer,
        is_locked: isLocked,
        location: { type: 'casa', name: 'Casa' },
        weatherSensitivity: 'transit_only',
        cognitiveLoad: 0,
        physicalLoad: 0,
        is_sensitive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deviceId: 'local',
        localVersion: 1,
        syncStatus: 'pending',
      });
    }

    onSave(
      newEvent,
      singleTravelEvents.length > 0 ? singleTravelEvents : undefined,
      undefined,
      impactScope,
      initialEvent
    );
    setShowScopeModal(false);
    onClose();
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && !!initialEvent?.recurrenceId) {
      setShowScopeModal(true);
      return;
    }
    executeSave('this_and_following');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col text-slate-100 max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEdit ? 'Editar Evento' : 'Constructor de Evento'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEdit
                  ? 'Modificá horarios, traslados o recurrencia periódica'
                  : 'Creá un evento con asignación de categoría, horario y traslados'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-xs">
          {/* Recurring Event Banner */}
          {isEdit && !!initialEvent?.recurrenceId && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-950/60 border border-purple-800/70 text-purple-200 text-xs shadow-sm">
              <Repeat className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>Evento periódico:</strong> Podés modificar el horario o cambiar la repetición. Al guardar, elegirás si impacta solo en este día o en todos los siguientes.
              </span>
            </div>
          )}

          {/* 1. Nombre y Emoji */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">Nombre del Evento *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Turno Rambla Casino, Cursada Redes, Mate con Juancito..."
                className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="w-24 flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 2. Categoría */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-300">Categoría del Evento</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/70 text-white font-bold shadow-md shadow-indigo-600/20'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Horarios y Duración */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800 pb-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Fecha, Horario y Duración</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Fecha</label>
                <input
                  type="date"
                  required
                  value={startDateStr}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDateStr(val);
                    if (val && !initialEvent?.recurrenceId) {
                      const [y, m, d] = val.split('-').map(Number);
                      const pickedDate = new Date(y, (m || 1) - 1, d || 1);
                      setRecurrenceDays([pickedDate.getDay() as DayOfWeek]);
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Hora Inicio</label>
                <input
                  type="time"
                  required
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Hora Fin</label>
                <input
                  type="time"
                  value={calculateEndTimeStr()}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-indigo-300 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-slate-500 mr-1">Duración rápida:</span>
              {DURATION_PRESETS.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setDuration(dur)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                    duration === dur
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {dur >= 60 ? `${dur / 60}h` : `${dur}m`}
                </button>
              ))}

              <div className="flex items-center gap-1 ml-auto bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-lg">
                <span className="text-slate-400 text-[11px]">Manual:</span>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(5, parseInt(e.target.value, 10) || 5))}
                  className="w-14 bg-transparent text-indigo-300 font-mono font-bold text-center focus:outline-none"
                />
                <span className="text-slate-500 font-mono text-[11px]">min</span>
              </div>
            </div>
          </div>

          {/* 4. Ubicación & Reserva Automática de Traslado */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800 pb-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Ubicación en Mar del Plata</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Lugar / Sede</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as LocationType)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  {PREDEFINED_LOCATIONS.map((loc) => (
                    <option key={loc.type} value={loc.type}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {locationType === 'custom' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Nombre Personalizado</label>
                  <input
                    type="text"
                    value={customLocationName}
                    onChange={(e) => setCustomLocationName(e.target.value)}
                    placeholder="Ej. Casa de Juani, Playa Varese..."
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Aviso y Configuración de Traslados Sugeridos (Facultad, Trabajo o Externo) */}
            {isEligibleForSuggestedTravel && (
              <div className="p-4 bg-indigo-950/40 border border-indigo-500/40 rounded-xl flex flex-col gap-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 mt-0.5">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-indigo-200 text-xs">
                        🚗 Traslado Sugerido: {detectedVenueName}
                      </span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {isFacultad
                          ? `Default sugerido de ${travelBufferFacultad} min de viaje a la facultad (ida y/o vuelta).`
                          : isWorkFerro
                          ? `Default sugerido de ${travelBufferFerro} min de viaje a Ferro San Juan.`
                          : isWorkCasino
                          ? `Default sugerido de ${travelBufferCasino} min de viaje a Casino Rambla.`
                          : `Tiempo estimado de viaje para esta ubicación externa.`}
                      </p>
                    </div>
                  </div>

                  {/* Input de minutos de viaje por tramo */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                    <span className="text-slate-400 text-[11px]">Duración:</span>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={travelBufferMinutes}
                      onChange={(e) => setTravelBufferMinutes(Math.max(5, parseInt(e.target.value, 10) || 5))}
                      className="w-12 bg-transparent text-indigo-300 font-mono font-bold text-center focus:outline-none text-xs"
                    />
                    <span className="text-slate-500 font-mono text-[11px]">min/tramo</span>
                  </div>
                </div>

                {/* Quick selection pills for Ida / Vuelta */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-medium">Opciones rápidas:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIncludeTravelIda(true);
                      setIncludeTravelVuelta(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      includeTravelIda && includeTravelVuelta
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Ambos (Ida y Vuelta)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIncludeTravelIda(true);
                      setIncludeTravelVuelta(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      includeTravelIda && !includeTravelVuelta
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Solo Ida
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIncludeTravelIda(false);
                      setIncludeTravelVuelta(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      !includeTravelIda && includeTravelVuelta
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Solo Vuelta
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIncludeTravelIda(false);
                      setIncludeTravelVuelta(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      !includeTravelIda && !includeTravelVuelta
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Ninguno
                  </button>
                </div>

                {/* Independent Checkboxes with Time Range Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    includeTravelIda
                      ? 'bg-indigo-950/70 border-indigo-500 text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={includeTravelIda}
                      onChange={(e) => setIncludeTravelIda(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs flex items-center gap-1">
                        <span>🚌</span> Crear traslado de IDA
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {travelTimes ? `${travelTimes.idaTime} a ${startTimeStr} (${travelBufferMinutes} min)` : `${travelBufferMinutes} min antes`}
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    includeTravelVuelta
                      ? 'bg-indigo-950/70 border-indigo-500 text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={includeTravelVuelta}
                      onChange={(e) => setIncludeTravelVuelta(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs flex items-center gap-1">
                        <span>🚌</span> Crear traslado de VUELTA
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {travelTimes ? `${calculateEndTimeStr()} a ${travelTimes.vueltaTime} (${travelBufferMinutes} min)` : `${travelBufferMinutes} min después`}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 5. Cargas Energéticas y Privacidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cargas */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-3">
              <span className="font-bold text-slate-200">Cargas Energéticas (SC-10)</span>

              <div className="flex flex-col gap-1">
                <span className="text-slate-400">Carga Cognitiva:</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCognitiveLoad(lvl as any)}
                      className={`flex-1 py-1 rounded text-xs font-mono font-bold transition-colors ${
                        cognitiveLoad === lvl
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Nivel {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-slate-400">Carga Física:</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPhysicalLoad(lvl as any)}
                      className={`flex-1 py-1 rounded text-xs font-mono font-bold transition-colors ${
                        physicalLoad === lvl
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Nivel {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Privacidad y Candado */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-2.5 justify-between">
              <span className="font-bold text-slate-200">Restricciones y Privacidad</span>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Inamovible (Bloqueado por HC-02)
                </span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSensitive}
                  onChange={(e) => setIsSensitive(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-rose-400" />
                  Privado / Sensible (Principio P4)
                </span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cannabisConsumed}
                  onChange={(e) => setCannabisConsumed(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  🌿 Consumo de Cannabis (Activa GHC-01)
                </span>
              </label>
            </div>
          </div>

          {/* 6. Recurrencia Periódica Personalizada */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Repeat className="w-4 h-4 text-purple-400" />
                <span>Repetición Periódica (Recurrencia)</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsRecurring(checked);
                    if (checked) {
                      const [year, month, day] = (startDateStr || formatLocalDate(new Date())).split('-').map(Number);
                      const base = new Date(year, (month || 1) - 1, day || 1);
                      if (!untilDateStr) {
                        const future = new Date(base);
                        future.setDate(future.getDate() + 28);
                        setUntilDateStr(formatLocalDate(future));
                      }
                      const baseDow = base.getDay() as DayOfWeek;
                      if (!initialEvent?.recurrenceId) {
                        setRecurrenceDays([baseDow]);
                      }
                    }
                  }}
                  className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-0"
                />
                <span className="font-semibold text-purple-300">Repetir periódicamente</span>
              </label>
            </div>

            {isRecurring && (
              <div className="flex flex-col gap-3 pt-2 border-t border-slate-800/80 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Frecuencia */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 font-medium">Frecuencia de repetición</label>
                    <select
                      value={recurrenceFreq}
                      onChange={(e) => setRecurrenceFreq(e.target.value as RecurrenceFrequency)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="daily">Diaria (Todos los días)</option>
                      <option value="weekly">Semanal (Días específicos)</option>
                      <option value="biweekly">Quincenal (Cada 2 semanas)</option>
                      <option value="monthly">Mensual (Mismo día del mes)</option>
                    </select>
                  </div>

                  {/* Fecha de Finalización */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 font-medium">Termina de repetirse el:</label>
                    <input
                      type="date"
                      required={isRecurring}
                      value={untilDateStr}
                      onChange={(e) => setUntilDateStr(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Días de la semana si es semanal */}
                {recurrenceFreq === 'weekly' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 font-medium">Repetir los días:</label>
                    <div className="flex gap-1.5">
                      {[
                        { day: 1, label: 'Lun' },
                        { day: 2, label: 'Mar' },
                        { day: 3, label: 'Mié' },
                        { day: 4, label: 'Jue' },
                        { day: 5, label: 'Vie' },
                        { day: 6, label: 'Sáb' },
                        { day: 0, label: 'Dom' },
                      ].map(({ day, label }) => {
                        const isDaySelected = recurrenceDays.includes(day as DayOfWeek);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDayOfWeek(day as DayOfWeek)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isDaySelected
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 7. Vista Previa en Vivo (Live Preview) */}
          <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 rounded-xl flex flex-col gap-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Vista Previa en Vivo en el Calendario</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {startDateStr ? new Date(`${startDateStr}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
              </span>
            </div>

            {/* Travel IDA preview if active */}
            {includeTravelIda && travelTimes && (
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/60 flex items-center justify-between text-[11px] text-zinc-300 font-mono">
                <div className="flex items-center gap-1.5">
                  <span>🚌</span>
                  <span className="font-sans font-semibold">Traslado ida a {detectedVenueName}</span>
                </div>
                <span className="text-zinc-400">
                  {travelTimes.idaTime} - {startTimeStr} ({travelBufferMinutes}m)
                </span>
              </div>
            )}

            {/* Main Event Card Preview */}
            <div className="p-3 rounded-xl border border-indigo-500/50 bg-indigo-950/50 shadow-md flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{emoji || '📅'}</span>
                  <span className="text-sm font-bold text-white">
                    {name.trim() || `${category.toUpperCase()}`}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  {category}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
                <span className="flex items-center gap-1 text-indigo-200 font-mono font-semibold">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {startTimeStr} - {calculateEndTimeStr()} ({duration} min)
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {locationType === 'custom' ? (customLocationName || 'Personalizada') : PREDEFINED_LOCATIONS.find(l => l.type === locationType)?.name}
                </span>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  🧠 Cognitiva: {cognitiveLoad}/3
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  💪 Física: {physicalLoad}/3
                </span>
                {isLocked && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-semibold text-[10px] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Inamovible
                  </span>
                )}
                {isSensitive && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-semibold text-[10px] flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Privado
                  </span>
                )}
                {cannabisConsumed && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold text-[10px]">
                    🌿 Cannabis
                  </span>
                )}
                {isRecurring && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-semibold text-[10px] flex items-center gap-1">
                    <Repeat className="w-3 h-3" /> {recurrenceFreq} hasta {untilDateStr}
                  </span>
                )}
              </div>
            </div>

            {/* Travel VUELTA preview if active */}
            {includeTravelVuelta && travelTimes && (
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/60 flex items-center justify-between text-[11px] text-zinc-300 font-mono">
                <div className="flex items-center gap-1.5">
                  <span>🚌</span>
                  <span className="font-sans font-semibold">Traslado vuelta desde {detectedVenueName}</span>
                </div>
                <span className="text-zinc-400">
                  {calculateEndTimeStr()} - {travelTimes.vueltaTime} ({travelBufferMinutes}m)
                </span>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isEdit ? 'Guardar Cambios' : 'Crear Evento'}</span>
            </button>
          </div>
        </form>

        {/* Scope Selection Modal for Recurring Event */}
        {showScopeModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-100">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="p-2.5 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Editar evento con repetición</h4>
                  <p className="text-xs text-slate-400">¿Dónde querés que impacten los cambios?</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-1">
                {/* Option 1: Solo este evento */}
                <button
                  type="button"
                  onClick={() => executeSave('this_event')}
                  className="p-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 hover:border-indigo-500 text-left transition-all group flex items-start gap-3 shadow-md"
                >
                  <div className="mt-0.5 p-2 rounded-lg bg-indigo-950 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors text-base">
                    🎯
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Solo este evento</span>
                      <span className="text-[10px] font-normal text-slate-400 font-mono">({startDateStr})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Modifica únicamente la repetición de este día. Las repeticiones pasadas y futuras de la serie no se verán afectadas.
                    </p>
                  </div>
                </button>

                {/* Option 2: Este y los eventos siguientes */}
                <button
                  type="button"
                  onClick={() => executeSave('this_and_following')}
                  className="p-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 hover:border-purple-500 text-left transition-all group flex items-start gap-3 shadow-md"
                >
                  <div className="mt-0.5 p-2 rounded-lg bg-purple-950 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors text-base">
                    ⏩
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Este y los eventos siguientes</span>
                      <span className="text-[10px] font-normal text-purple-300 font-mono">(&ge; {startDateStr})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Aplica los cambios a este día y a todas las repeticiones futuras (cambio de día de la semana, horario o fin de serie). Lo anterior a esta fecha queda igual.
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScopeModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  Volver a editar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
