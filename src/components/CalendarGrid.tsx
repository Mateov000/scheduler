'use client';

import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  MapPin,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { Event, EventCategory, WeatherCondition } from '../lib/scheduler/types';

interface CalendarGridProps {
  events: Event[];
  weather?: WeatherCondition[];
  currentDate?: Date;
  onToggleLock: (eventId: string) => void;
  onEventClick?: (event: Event) => void;
}

const CATEGORY_STYLES: Record<
  EventCategory,
  { bg: string; border: string; text: string; badge: string }
> = {
  trabajo: {
    bg: 'bg-blue-950/70 hover:bg-blue-900/80',
    border: 'border-blue-500/50',
    text: 'text-blue-100',
    badge: 'bg-blue-500/30 text-blue-300',
  },
  cursada: {
    bg: 'bg-purple-950/70 hover:bg-purple-900/80',
    border: 'border-purple-500/50',
    text: 'text-purple-100',
    badge: 'bg-purple-500/30 text-purple-300',
  },
  estudio: {
    bg: 'bg-cyan-950/70 hover:bg-cyan-900/80',
    border: 'border-cyan-500/50',
    text: 'text-cyan-100',
    badge: 'bg-cyan-500/30 text-cyan-300',
  },
  social: {
    bg: 'bg-emerald-950/70 hover:bg-emerald-900/80',
    border: 'border-emerald-500/50',
    text: 'text-emerald-100',
    badge: 'bg-emerald-500/30 text-emerald-300',
  },
  gym: {
    bg: 'bg-amber-950/70 hover:bg-amber-900/80',
    border: 'border-amber-500/50',
    text: 'text-amber-100',
    badge: 'bg-amber-500/30 text-amber-300',
  },
  batch_cooking: {
    bg: 'bg-orange-950/70 hover:bg-orange-900/80',
    border: 'border-orange-500/50',
    text: 'text-orange-100',
    badge: 'bg-orange-500/30 text-orange-300',
  },
  comida: {
    bg: 'bg-yellow-950/70 hover:bg-yellow-900/80',
    border: 'border-yellow-500/50',
    text: 'text-yellow-100',
    badge: 'bg-yellow-500/30 text-yellow-300',
  },
  sueno: {
    bg: 'bg-slate-950/80 hover:bg-slate-900/90',
    border: 'border-slate-600/50',
    text: 'text-slate-200',
    badge: 'bg-slate-700/50 text-slate-300',
  },
  traslado: {
    bg: 'bg-zinc-900/60 hover:bg-zinc-850/70',
    border: 'border-zinc-600/40',
    text: 'text-zinc-300',
    badge: 'bg-zinc-700/40 text-zinc-400',
  },
  buffer_post_consumo: {
    bg: 'bg-rose-950/70 hover:bg-rose-900/80',
    border: 'border-rose-500/60',
    text: 'text-rose-100',
    badge: 'bg-rose-500/30 text-rose-300',
  },
  social_opportunity: {
    bg: 'bg-fuchsia-950/40 hover:bg-fuchsia-900/50',
    border: 'border-fuchsia-400/70 border-dashed',
    text: 'text-fuchsia-100',
    badge: 'bg-fuchsia-500/30 text-fuchsia-300',
  },
  tramites: {
    bg: 'bg-teal-950/70 hover:bg-teal-900/80',
    border: 'border-teal-500/50',
    text: 'text-teal-100',
    badge: 'bg-teal-500/30 text-teal-300',
  },
  desarrollo_personal: {
    bg: 'bg-indigo-950/70 hover:bg-indigo-900/80',
    border: 'border-indigo-500/50',
    text: 'text-indigo-100',
    badge: 'bg-indigo-500/30 text-indigo-300',
  },
  recuperacion: {
    bg: 'bg-pink-950/70 hover:bg-pink-900/80',
    border: 'border-pink-500/50',
    text: 'text-pink-100',
    badge: 'bg-pink-500/30 text-pink-300',
  },
  preparacion_buffer: {
    bg: 'bg-stone-900/60 hover:bg-stone-850/70',
    border: 'border-stone-600/40',
    text: 'text-stone-300',
    badge: 'bg-stone-700/40 text-stone-400',
  },
  otro: {
    bg: 'bg-neutral-900/70 hover:bg-neutral-850/80',
    border: 'border-neutral-600/40',
    text: 'text-neutral-200',
    badge: 'bg-neutral-700/40 text-neutral-300',
  },
};

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const SCALE_PX_PER_MIN = 1.0; // 1 minute = 1px, 60 min = 60px, 120 min = 120px (Strict linear proportionality §29.2)

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  events,
  weather = [],
  currentDate = new Date(),
  onToggleLock,
  onEventClick,
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(currentDate);

  // Compute week range (Monday to Sunday)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const d = new Date(anchorDate);
    const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon ...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  }, [anchorDate]);

  const activeDays = viewMode === 'week' ? weekDays : [anchorDate];

  // Hours of day from 07:00 to 24:00 (17 hours) or full 24h
  const startHour = 0;
  const totalHours = 24;

  const navigateDays = (delta: number) => {
    const next = new Date(anchorDate);
    next.setDate(anchorDate.getDate() + (viewMode === 'week' ? delta * 7 : delta));
    setAnchorDate(next);
  };

  const setToday = () => {
    setAnchorDate(new Date());
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold tracking-tight">
            {viewMode === 'week'
              ? `Semana del ${weekDays[0].getDate()} al ${weekDays[6].getDate()} de ${weekDays[0].toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`
              : anchorDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs font-medium mr-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'day'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Día
            </button>
          </div>

          <button
            onClick={() => navigateDays(-1)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={setToday}
            className="px-2.5 py-1 text-xs font-medium hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => navigateDays(1)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid container with scroll */}
      <div className="flex-1 overflow-y-auto relative flex flex-col">
        {/* Days Header */}
        <div className="sticky top-0 z-20 flex border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
          {/* Time gutter spacer */}
          <div className="w-16 flex-shrink-0 border-r border-slate-800 p-2 text-center text-xs text-slate-500">
            GMT-3
          </div>

          {/* Day columns */}
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${activeDays.length}, 1fr)` }}>
            {activeDays.map((day, idx) => {
              const isToday =
                new Date().getDate() === day.getDate() &&
                new Date().getMonth() === day.getMonth() &&
                new Date().getFullYear() === day.getFullYear();

              return (
                <div
                  key={idx}
                  className={`py-3 px-2 text-center border-r border-slate-800/80 ${
                    isToday ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {DAY_NAMES[day.getDay()]}
                  </span>
                  <span
                    className={`text-sm font-bold inline-block mt-0.5 rounded-full px-2 py-0.5 ${
                      isToday ? 'bg-indigo-600 text-white' : 'text-slate-200'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline body */}
        <div className="flex relative" style={{ height: `${totalHours * 60 * SCALE_PX_PER_MIN}px` }}>
          {/* Hour markers gutter */}
          <div className="w-16 flex-shrink-0 border-r border-slate-800 relative select-none">
            {Array.from({ length: totalHours }, (_, i) => i + startHour).map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-right pr-2 text-xs text-slate-500 font-mono"
                style={{ top: `${(hour - startHour) * 60 * SCALE_PX_PER_MIN}px`, transform: 'translateY(-50%)' }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Grid columns */}
          <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${activeDays.length}, 1fr)` }}>
            {/* Background horizontal hour lines */}
            {Array.from({ length: totalHours }, (_, i) => (
              <div
                key={i}
                className="absolute w-full border-t border-slate-800/40 pointer-events-none"
                style={{ top: `${i * 60 * SCALE_PX_PER_MIN}px` }}
              />
            ))}

            {/* Render each day column */}
            {activeDays.map((day, colIdx) => {
              const dayStart = new Date(day);
              dayStart.setHours(0, 0, 0, 0);
              const dayEnd = new Date(day);
              dayEnd.setHours(23, 59, 59, 999);

              // Events occurring on this day
              const dayEvents = events.filter((e) => {
                const eDate = new Date(e.start);
                return eDate >= dayStart && eDate <= dayEnd;
              });

              return (
                <div key={colIdx} className="relative border-r border-slate-800/50 h-full">
                  {dayEvents.map((event) => {
                    const eStart = new Date(event.start);
                    const minutesFromMidnight = eStart.getHours() * 60 + eStart.getMinutes();
                    const top = (minutesFromMidnight - startHour * 60) * SCALE_PX_PER_MIN;
                    // Proportional height: height = duration * SCALE_PX_PER_MIN
                    const height = Math.max(22, event.duration * SCALE_PX_PER_MIN);

                    const styles = CATEGORY_STYLES[event.category] || CATEGORY_STYLES.otro;
                    const isSerendipity = event.isOpenSocialSlot || event.category === 'social_opportunity';

                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick && onEventClick(event)}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                        }}
                        className={`absolute left-1 right-1 rounded-lg border p-1.5 transition-all shadow-md overflow-hidden cursor-pointer flex flex-col justify-between ${
                          styles.bg
                        } ${styles.border} ${styles.text}`}
                      >
                        {/* Event Top Bar */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            {isSerendipity && <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 flex-shrink-0 animate-pulse" />}
                            <span className="text-xs font-bold truncate">
                              {event.emoji ? `${event.emoji} ` : ''}
                              {event.name}
                            </span>
                          </div>

                          {/* Universal Lock Button (§29.3) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleLock(event.id);
                            }}
                            title={event.is_locked ? 'Bloqueado por HC-02 (Inamovible)' : 'Desbloqueado (Optimizable por el solver)'}
                            className={`p-1 rounded transition-colors ${
                              event.is_locked
                                ? 'text-amber-400 bg-amber-950/60 hover:bg-amber-900/80'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            {event.is_locked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                            )}
                          </button>
                        </div>

                        {/* Event Details (shown if card height permits) */}
                        {height > 35 && (
                          <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-0.5 opacity-90 truncate">
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {String(eStart.getHours()).padStart(2, '0')}:{String(eStart.getMinutes()).padStart(2, '0')} (
                              {event.duration}m)
                            </span>
                            {event.location?.name && (
                              <span className="flex items-center gap-0.5 truncate">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {event.location.name}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
