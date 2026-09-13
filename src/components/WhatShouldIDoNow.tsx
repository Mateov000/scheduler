'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Coffee,
  Heart,
  Moon,
  Plus,
  Sparkles,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { Contact, Event, WeatherCondition } from '../lib/scheduler/types';
import { ConstraintParams } from '../lib/scheduler/params';

interface WhatShouldIDoNowProps {
  currentSchedule: Event[];
  weather: WeatherCondition[];
  params: ConstraintParams;
  contacts: Contact[];
  onAddEvent: (event: Event) => void;
}

interface ActionOption {
  id: string;
  title: string;
  emoji: string;
  category: string;
  duration: number;
  reason: string;
  locationName: string;
}

export const WhatShouldIDoNow: React.FC<WhatShouldIDoNowProps> = ({
  currentSchedule,
  weather,
  params,
  contacts,
  onAddEvent,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentMood, setCurrentMood] = useState<'energetic' | 'normal' | 'tired'>('normal');

  // Current weather approximation
  const currentWeather = weather[0] || {
    comfortScore: 75,
    temperatureCelsius: 19,
    precipitationProbability: 0,
  };

  // Generate 3 ranked recommendations based on mood and weather
  const getRankedOptions = (): ActionOption[] => {
    const isGoodWeather = currentWeather.comfortScore >= 70;
    const isBadWeather = currentWeather.comfortScore <= 40;

    if (currentMood === 'tired') {
      return [
        {
          id: 'opt_nap',
          title: 'Siesta Reparadora / Descanso en Casa',
          emoji: '😴',
          category: 'recuperacion',
          duration: 60,
          reason: 'Tu energía está baja. Un descanso de 60m recupera tu balance circadiano.',
          locationName: 'Casa',
        },
        {
          id: 'opt_tea',
          title: 'Mate o Café Tranquilo con Juani',
          emoji: '☕',
          category: 'social',
          duration: 60,
          reason: 'Juani está a 10 min. Encuentro liviano de baja demanda cognitiva.',
          locationName: 'Casa / Café cercano',
        },
        {
          id: 'opt_light_study',
          title: 'Lectura Liviana de AEEC',
          emoji: '📖',
          category: 'estudio',
          duration: 45,
          reason: 'Materia de carga cognitiva media sin exigencia extrema.',
          locationName: 'Casa',
        },
      ];
    }

    if (isGoodWeather) {
      return [
        {
          id: 'opt_rambla_walk',
          title: 'Caminata por la Rambla o Playa Bristol',
          emoji: '🌊',
          category: 'social',
          duration: 90,
          reason: `ComfortScore de ${currentWeather.comfortScore} pts. Oportunidad climática para despejar la mente.`,
          locationName: 'Rambla Casino',
        },
        {
          id: 'opt_mate_juancito',
          title: 'Mates al aire libre con Juancito',
          emoji: '🧉',
          category: 'social',
          duration: 90,
          reason: 'Avanza hacia tu meta de 5h/sem aprovechando la tarde soleada.',
          locationName: 'Plaza o Rambla',
        },
        {
          id: 'opt_gym_outdoor',
          title: 'Entrenamiento en el Gym',
          emoji: '💪',
          category: 'gym',
          duration: 60,
          reason: 'Excelente momento para descargar energía física antes de la noche.',
          locationName: 'Gimnasio',
        },
      ];
    }

    // Default or indoor weather
    return [
      {
        id: 'opt_study_redes',
        title: 'Bloque de Estudio Profundo: Redes / AyDS',
        emoji: '💻',
        category: 'estudio',
        duration: 120,
        reason: 'Clima ideal para concentración bajo techo (SC-08b). Bloque de 2 horas continuas.',
        locationName: 'Casa',
      },
      {
        id: 'opt_batch_cooking',
        title: 'Sesión de Batch Cooking para la Semana',
        emoji: '🍲',
        category: 'batch_cooking',
        duration: 90,
        reason: 'Asegura tus viandas saludables para turnos laborales de la semana (SC-02).',
        locationName: 'Casa',
      },
      {
        id: 'opt_cafe_guemes',
        title: 'Café de Trabajo o Charla en Güemes',
        emoji: '☕',
        category: 'social',
        duration: 60,
        reason: 'Espacio cálido y resguardado para distenderse sin sufrir el viento costero.',
        locationName: 'Café Güemes',
      },
    ];
  };

  const options = getRankedOptions();

  const handleSelectOption = (opt: ActionOption) => {
    const now = new Date();
    // round to next 15 min
    const start = new Date(Math.ceil(now.getTime() / (15 * 60000)) * (15 * 60000));

    const newEvent: Event = {
      id: `immediate_${Date.now()}`,
      name: opt.title,
      category: opt.category as any,
      emoji: opt.emoji,
      start,
      duration: opt.duration,
      is_locked: true, // Lock immediately upon user choice
      location: { type: 'custom', name: opt.locationName },
      weatherSensitivity: 'none',
      cognitiveLoad: opt.category === 'estudio' ? 2 : 0,
      physicalLoad: opt.category === 'gym' ? 3 : 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    };

    onAddEvent(newEvent);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold p-4 rounded-full shadow-2xl shadow-indigo-600/40 hover:scale-105 transition-all duration-200 flex items-center gap-2 group"
        title="¿Qué hago ahora? Modo Inmediato"
      >
        <Zap className="w-5 h-5 text-amber-200 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-bold pr-1">¿Qué Hago Ahora?</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-950 text-amber-400 border border-amber-600/40 rounded-lg">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">¿Qué Hago Ahora? (§17.3)</h3>
                  <p className="text-xs text-slate-400">Horizonte inmediato de las próximas 2 horas</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-5">
              {/* Mood Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-300">Tu estado de ánimo actual:</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'tired', label: 'Cansado', emoji: '😴' },
                    { key: 'normal', label: 'Normal', emoji: '😐' },
                    { key: 'energetic', label: 'Energético', emoji: '⚡' },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setCurrentMood(m.key as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        currentMood === m.key
                          ? 'bg-indigo-950 border-indigo-500 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Ranked Options */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sugerencias personalizadas para este momento:
                </span>

                <div className="flex flex-col gap-2.5">
                  {options.map((opt, idx) => (
                    <div
                      key={opt.id}
                      className="p-3.5 bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 rounded-xl flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{opt.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200">{opt.title}</span>
                            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded">
                              {opt.duration}m
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug">{opt.reason}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectOption(opt)}
                        className="p-2 bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white rounded-lg transition-all flex-shrink-0"
                        title="Asignar al calendario ahora"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
