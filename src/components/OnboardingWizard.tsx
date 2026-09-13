'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Check,
  Heart,
  Sliders,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { Contact, Event } from '../lib/scheduler/types';
import { ConstraintParams, defaultParams } from '../lib/scheduler/params';
import { defaultMetaSliders, MetaSliderValues } from '../lib/scheduler/metaSliders';

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: (initialEvents: Event[], initialContacts: Contact[], initialParams: ConstraintParams) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onComplete }) => {
  const [screen, setScreen] = useState<number>(1);

  // Screen 1: Work branches
  const [hasCasino, setHasCasino] = useState<boolean>(true);
  const [hasFerro, setHasFerro] = useState<boolean>(true);

  // Screen 2: University subjects
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    'Redes de Computadoras',
    'Análisis y Diseño de Sistemas (AyDS)',
    'Administración Empresarial (AEEC)',
    'Calidad de Software (CalSoft)',
  ]);

  // Screen 3: Contacts
  const [includeJuancito, setIncludeJuancito] = useState<boolean>(true);
  const [includeJuani, setIncludeJuani] = useState<boolean>(true);
  const [includeLau, setIncludeLau] = useState<boolean>(true);

  // Screen 4: Budget & Meta-Sliders
  const [weeklyBudget, setWeeklyBudget] = useState<string>('35000');

  if (!isOpen) return null;

  const handleFinish = () => {
    // Generate initial events
    const initialEvents: Event[] = [];
    const now = new Date();
    // Monday of this week
    const monday = new Date(now);
    const day = monday.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    // Add Casino Rambla (e.g., Monday 10:00 - 16:00)
    if (hasCasino) {
      const casinoDate = new Date(monday);
      casinoDate.setHours(10, 0, 0, 0);
      initialEvents.push({
        id: 'init_casino_1',
        name: 'Turno Casino Rambla',
        category: 'trabajo',
        emoji: '🎰',
        start: casinoDate,
        duration: 360,
        is_locked: true,
        location: { type: 'rambla_casino', name: 'Casino Rambla' },
        weatherSensitivity: 'transit_only',
        cognitiveLoad: 1,
        physicalLoad: 1,
        is_sensitive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deviceId: 'onboarding',
        localVersion: 1,
        syncStatus: 'synced',
      });
    }

    // Add Ferro San Juan (e.g., Friday 17:00 - 01:00 AM)
    if (hasFerro) {
      const ferroDate = new Date(monday);
      ferroDate.setDate(ferroDate.getDate() + 4); // Friday
      ferroDate.setHours(17, 0, 0, 0);
      initialEvents.push({
        id: 'init_ferro_1',
        name: 'Turno Ferro San Juan',
        category: 'trabajo',
        emoji: '🍕',
        start: ferroDate,
        duration: 480,
        is_locked: true,
        location: { type: 'ferro_san_juan', name: 'Ferro San Juan' },
        weatherSensitivity: 'transit_only',
        cognitiveLoad: 1,
        physicalLoad: 2,
        is_sensitive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deviceId: 'onboarding',
        localVersion: 1,
        syncStatus: 'synced',
      });
    }

    // Add university fixed classes (Tuesday & Thursday)
    selectedSubjects.forEach((subj, idx) => {
      const classDate = new Date(monday);
      classDate.setDate(classDate.getDate() + (idx % 2 === 0 ? 1 : 3)); // Tue or Thu
      classDate.setHours(14 + (idx >= 2 ? 3 : 0), 0, 0, 0);

      initialEvents.push({
        id: `init_uni_${idx}`,
        name: `Cursada: ${subj}`,
        category: 'cursada',
        emoji: '🎓',
        start: classDate,
        duration: 120,
        is_locked: true,
        location: { type: 'facultad', name: 'Facultad de Ingeniería' },
        weatherSensitivity: 'none',
        cognitiveLoad: 2,
        physicalLoad: 0,
        is_sensitive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deviceId: 'onboarding',
        localVersion: 1,
        syncStatus: 'synced',
      });
    });

    // Contacts
    const initialContacts: Contact[] = [];
    if (includeJuancito) {
      initialContacts.push({
        id: 'cont_juancito',
        name: 'Juancito',
        relationshipType: 'amigo_cercano',
        weeklyHoursGoal: 5,
        hasPrivateApartment: false,
      });
    }
    if (includeJuani) {
      initialContacts.push({
        id: 'cont_juani',
        name: 'Juani',
        relationshipType: 'amigo_cercano',
        weeklyHoursGoal: 3,
        hasPrivateApartment: true,
      });
    }
    if (includeLau) {
      initialContacts.push({
        id: 'cont_lau',
        name: 'Lau',
        alias: 'Lau',
        relationshipType: 'vinculo_delicado',
        isSensitive: true,
      });
    }

    const initialParams: ConstraintParams = {
      ...defaultParams,
      weekly_budget_ars: weeklyBudget ? parseFloat(weeklyBudget) : undefined,
    };

    onComplete(initialEvents, initialContacts, initialParams);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Bienvenido a MiMesa Scheduler (§28)
            </h2>
            <p className="text-xs text-slate-400">Paso {screen} de 5</p>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === screen ? 'w-5 bg-indigo-500' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Screen Content */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
          {/* Screen 1: Work */}
          {screen === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">1. Configuración de Trabajo</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  El sistema insertará buffers automáticos de traslado y garantizará 8h de descanso post-Ferro.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={hasCasino}
                      onChange={(e) => setHasCasino(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500 rounded"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-200">Sucursal Rambla Casino</span>
                      <p className="text-[11px] text-slate-400">Turnos diurnos · Buffer de 30 min por tramo</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 font-bold">30m</span>
                </label>

                <label className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={hasFerro}
                      onChange={(e) => setHasFerro(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500 rounded"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-200">Sucursal Ferro San Juan</span>
                      <p className="text-[11px] text-slate-400">Turnos nocturnos · Buffer 45m + 8h sueño garantizado</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 font-bold">45m + 8h</span>
                </label>
              </div>
            </div>
          )}

          {/* Screen 2: University */}
          {screen === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">2. Materias Universitarias (Cuatrimestre)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bloques ininterrumpidos $\ge 120$ min en horarios de alta energía.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {[
                  'Redes de Computadoras',
                  'Análisis y Diseño de Sistemas (AyDS)',
                  'Administración Empresarial (AEEC)',
                  'Calidad de Software (CalSoft)',
                ].map((subj) => (
                  <div
                    key={subj}
                    className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center gap-2.5"
                  >
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-200">{subj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screen 3: Social */}
          {screen === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">3. Vínculos y Metas Semanales</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Matu mantiene sus vínculos cercanos con metas claras de conexión.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-200">Juancito</span>
                      <p className="text-[11px] text-slate-400">Amigo íntimo · Meta: 5 horas semanales</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">5h/sem</span>
                </div>

                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-200">Juani</span>
                      <p className="text-[11px] text-slate-400">A 10 min de casa · Meta: 3 horas semanales</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">3h/sem</span>
                </div>

                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-200">Lau</span>
                      <p className="text-[11px] text-slate-400">Vínculo delicado · SC-16 balance emocional</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 font-bold">SC-16</span>
                </div>
              </div>
            </div>
          )}

          {/* Screen 4: Budget & Sliders */}
          {screen === 4 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">4. Presupuesto Semanal Estimado (ARS)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Control opcional de gastos en pesos argentinos para actividades sociales y salidas.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300">Presupuesto semanal deseado ($ ARS):</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    value={weeklyBudget}
                    onChange={(e) => setWeeklyBudget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="Ej. 35000"
                  />
                </div>
                <span className="text-[11px] text-slate-500">Dejar en blanco si no se desea límite presupuestario.</span>
              </div>
            </div>
          )}

          {/* Screen 5: Launch */}
          {screen === 5 && (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
              <div className="p-4 bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 rounded-2xl">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">¡Tu perfil inicial está configurado!</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Tu agenda inicial contiene tus horarios de trabajo, cursadas y metas vinculares listas para optimizar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={() => setScreen((s) => Math.max(1, s - 1))}
            disabled={screen === 1}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-30"
          >
            Anterior
          </button>

          <button
            onClick={() => {
              if (screen < 5) setScreen(screen + 1);
              else handleFinish();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            {screen === 5 ? 'Comenzar a Planificar' : 'Continuar'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
