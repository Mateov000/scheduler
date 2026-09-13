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

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event, travelEvents?: Event[], recurringInstances?: Event[]) => void;
  initialEvent?: Event | null;
  defaultDate?: Date | null;
  travelBufferCasino?: number;
  travelBufferFerro?: number;
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
  travelBufferCasino = 30,
  travelBufferFerro = 45,
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

  // Auto Travel Buffer for Work
  const [autoTravelBuffers, setAutoTravelBuffers] = useState<boolean>(true);

  // Recurrence State
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFrequency>('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState<DayOfWeek[]>([1]); // default lunes
  const [untilDateStr, setUntilDateStr] = useState<string>('');

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
      setIsRecurring(!!initialEvent.recurrenceId);
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
      setAutoTravelBuffers(true);
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
    } else if (cat === 'cursada') {
      setLocationType('facultad');
      setCognitiveLoad(2);
      setPhysicalLoad(0);
      setDuration(120);
    } else if (cat === 'estudio') {
      setLocationType('casa');
      setCognitiveLoad(3);
      setPhysicalLoad(0);
      setDuration(120);
    } else if (cat === 'gym') {
      setLocationType('gym');
      setPhysicalLoad(3);
      setCognitiveLoad(0);
      setDuration(60);
    } else if (cat === 'social') {
      setLocationType('exterior_rambla');
      setCognitiveLoad(0);
      setPhysicalLoad(0);
    } else if (cat === 'batch_cooking') {
      setLocationType('casa');
      setCognitiveLoad(1);
      setPhysicalLoad(1);
      setDuration(120);
    } else if (cat === 'recuperacion') {
      setLocationType('casa');
      setIsSensitive(true);
      setCognitiveLoad(0);
      setPhysicalLoad(0);
    } else if (cat === 'comida') {
      setLocationType('casa');
      setDuration(45);
    } else if (cat === 'sueno') {
      setLocationType('casa');
      setDuration(480);
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

  // Detect if work shift is at Rambla or Ferro
  const isWorkShift = category === 'trabajo';
  const isRambla =
    locationType === 'rambla_casino' ||
    name.toLowerCase().includes('rambla') ||
    name.toLowerCase().includes('casino');
  const isFerro =
    locationType === 'ferro_san_juan' ||
    name.toLowerCase().includes('ferro') ||
    name.toLowerCase().includes('san juan');
  const hasTravelBufferDetected = isWorkShift && (isRambla || isFerro);
  const detectedTravelBufferMinutes = isFerro ? travelBufferFerro : travelBufferCasino;
  const detectedWorkplaceName = isFerro ? 'Ferro San Juan' : 'Casino Rambla';

  // Computed preview for travel buffers
  const calculateTravelTimes = () => {
    if (!hasTravelBufferDetected || !autoTravelBuffers) return null;
    const parts = (startTimeStr || '10:00').split(':').map((v) => parseInt(v, 10) || 0);
    const startMins = (parts[0] ?? 10) * 60 + (parts[1] ?? 0);
    const idaStartMins = (startMins - detectedTravelBufferMinutes + 24 * 60) % (24 * 60);
    const idaH = Math.floor(idaStartMins / 60);
    const idaM = idaStartMins % 60;
    const idaTime = `${String(idaH).padStart(2, '0')}:${String(idaM).padStart(2, '0')}`;

    const endParts = calculateEndTimeStr().split(':').map((v) => parseInt(v, 10) || 0);
    const endMins = (endParts[0] || 0) * 60 + (endParts[1] || 0);
    const vueltaEndMins = (endMins + detectedTravelBufferMinutes) % (24 * 60);
    const vueltaH = Math.floor(vueltaEndMins / 60);
    const vueltaM = vueltaEndMins % 60;
    const vueltaTime = `${String(vueltaH).padStart(2, '0')}:${String(vueltaM).padStart(2, '0')}`;

    return { idaTime, vueltaTime };
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

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const [h, m] = startTimeStr.split(':').map((v) => parseInt(v, 10) || 0);
    const [year, month, day] = startDateStr.split('-').map((v) => parseInt(v, 10) || 0);
    const startDate = new Date(year, month - 1, day, h, m, 0, 0);

    let finalLocName = customLocationName;
    if (locationType !== 'custom') {
      const match = PREDEFINED_LOCATIONS.find((l) => l.type === locationType);
      finalLocName = match?.name || locationType;
    }

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
      createdAt: initialEvent?.createdAt || new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: (initialEvent?.localVersion ?? 0) + 1,
      syncStatus: 'pending',
    };

    // 1. Generate Separate Work Travel Events if enabled
    const travelEvents: Event[] = [];
    if (hasTravelBufferDetected && autoTravelBuffers) {
      const idaStart = new Date(startDate.getTime() - detectedTravelBufferMinutes * 60000);
      const vueltaStart = new Date(startDate.getTime() + duration * 60000);

      travelEvents.push({
        id: `ev_traslado_ida_${Date.now()}`,
        name: `Traslado a ${detectedWorkplaceName}`,
        category: 'traslado',
        emoji: '🚌',
        start: idaStart,
        duration: detectedTravelBufferMinutes,
        is_locked: isLocked,
        location: { type: locationType, name: detectedWorkplaceName },
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

      travelEvents.push({
        id: `ev_traslado_vuelta_${Date.now() + 1}`,
        name: `Traslado desde ${detectedWorkplaceName}`,
        category: 'traslado',
        emoji: '🚌',
        start: vueltaStart,
        duration: detectedTravelBufferMinutes,
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

    // 2. Generate Recurring Instances if enabled
    let recurringInstances: Event[] | undefined;
    if (isRecurring && untilDateStr) {
      const [uYear, uMonth, uDay] = untilDateStr.split('-').map((v) => parseInt(v, 10) || 0);
      const untilDate = new Date(uYear, uMonth - 1, uDay, 23, 59, 59, 999);

      const patternId = initialEvent?.recurrenceId || `rec_${Date.now()}`;
      const pattern: RecurrencePattern = {
        id: patternId,
        frequency: recurrenceFreq,
        daysOfWeek: recurrenceFreq === 'weekly' ? recurrenceDays : undefined,
        startDate: new Date(startDate),
        until: untilDate,
        exceptions: [],
      };

      newEvent.recurrenceId = patternId;

      // Expand instances up to untilDate
      recurringInstances = expandRecurrencePattern(pattern, newEvent, startDate, untilDate);
    }

    onSave(newEvent, travelEvents.length > 0 ? travelEvents : undefined, recurringInstances);
    onClose();
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
                  onChange={(e) => setStartDateStr(e.target.value)}
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

            {/* Aviso y Configuración de Traslados para Casino y Ferro */}
            {hasTravelBufferDetected && (
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl flex flex-col gap-2 animate-fadeIn">
                <div className="flex items-start gap-2">
                  <Car className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold text-indigo-200">
                      🚗 Traslado Laboral Detectado ({detectedWorkplaceName})
                    </span>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      El sistema reservará automáticamente dos eventos separados de traslado:{' '}
                      <strong>{detectedTravelBufferMinutes} min de ida</strong> antes de entrar y{' '}
                      <strong>{detectedTravelBufferMinutes} min de vuelta</strong> al salir.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-indigo-300 font-semibold cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={autoTravelBuffers}
                    onChange={(e) => setAutoTravelBuffers(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Crear automáticamente los bloques de traslado como eventos separados</span>
                </label>
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
                  onChange={(e) => setIsRecurring(e.target.checked)}
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
            {travelTimes && (
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/60 flex items-center justify-between text-[11px] text-zinc-300 font-mono">
                <div className="flex items-center gap-1.5">
                  <span>🚌</span>
                  <span className="font-sans font-semibold">Traslado ida a {detectedWorkplaceName}</span>
                </div>
                <span className="text-zinc-400">
                  {travelTimes.idaTime} - {startTimeStr} ({detectedTravelBufferMinutes}m)
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
            {travelTimes && (
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/60 flex items-center justify-between text-[11px] text-zinc-300 font-mono">
                <div className="flex items-center gap-1.5">
                  <span>🚌</span>
                  <span className="font-sans font-semibold">Traslado vuelta desde {detectedWorkplaceName}</span>
                </div>
                <span className="text-zinc-400">
                  {calculateEndTimeStr()} - {travelTimes.vueltaTime} ({detectedTravelBufferMinutes}m)
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
      </div>
    </div>
  );
};
