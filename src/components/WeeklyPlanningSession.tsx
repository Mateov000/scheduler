'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CloudRain,
  Heart,
  Lock,
  Moon,
  Sparkles,
  Sun,
  Users,
  Zap,
} from 'lucide-react';
import { Contact, Event, SolverResult, WeatherCondition } from '../lib/scheduler/types';
import { ConstraintParams } from '../lib/scheduler/params';
import { MetaSliders } from './MetaSliders';
import { defaultMetaSliders, MetaSliderValues } from '../lib/scheduler/metaSliders';
import { solveMiMesa } from '../lib/scheduler/solver';

interface WeeklyPlanningSessionProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchedule: Event[];
  weather: WeatherCondition[];
  params: ConstraintParams;
  contacts: Contact[];
  weights: Record<string, number>;
  onFinishOptimization: (result: SolverResult) => void;
}

type Mood = 'tired' | 'normal' | 'energetic';
type WeekType = 'exams' | 'normal' | 'social';

export const WeeklyPlanningSession: React.FC<WeeklyPlanningSessionProps> = ({
  isOpen,
  onClose,
  currentSchedule,
  weather,
  params,
  contacts,
  weights,
  onFinishOptimization,
}) => {
  const [step, setStep] = useState<number>(1);
  const [mood, setMood] = useState<Mood>('normal');
  const [weekType, setWeekType] = useState<WeekType>('normal');
  const [metaSliders, setMetaSliders] = useState<MetaSliderValues>(defaultMetaSliders);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(['cont_juancito', 'cont_juani']);
  const [serendipityCount, setSerendipityCount] = useState<number>(2);
  const [isSolving, setIsSolving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      executeSolver();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const executeSolver = () => {
    setIsSolving(true);

    setTimeout(() => {
      const activeContacts = contacts.filter((c) => selectedContactIds.includes(c.id));
      const solverParams: ConstraintParams = {
        ...params,
        serendipity_slots_per_week: serendipityCount,
      };

      const result = solveMiMesa({
        schedule: currentSchedule,
        weather,
        params: solverParams,
        contacts: activeContacts,
        weights,
      });

      setIsSolving(false);
      onFinishOptimization(result);
      onClose();
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-700/40 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Sesión de Planificación Semanal (§17.2)</h2>
              <p className="text-xs text-slate-400">Paso {step} de 5</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step
                    ? 'w-6 bg-indigo-500'
                    : s < step
                    ? 'w-3 bg-emerald-500'
                    : 'w-3 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* STEP 1: Contexto Personal y Meta-Sliders */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-bold text-slate-200">1. ¿Cómo te sentís hoy para arrancar la semana?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ajusta las restricciones a tu nivel energético actual.</p>
              </div>

              {/* Mood picker */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'tired', label: 'Cansado', emoji: '😴', desc: 'Priorizar sueño y descanso' },
                  { key: 'normal', label: 'Normal', emoji: '😐', desc: 'Ritmo balanceado habitual' },
                  { key: 'energetic', label: 'Con ganas', emoji: '⚡', desc: 'Listo para alta productividad' },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMood(m.key as Mood)}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      mood === m.key
                        ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-xs font-bold text-slate-200">{m.label}</span>
                    <span className="text-[10px] text-slate-400">{m.desc}</span>
                  </button>
                ))}
              </div>

              {/* Week Type */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300">Tipo de semana que esperás:</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'exams', label: 'Exámenes / Parciales', icon: BookOpen },
                    { key: 'normal', label: 'Semana Regular', icon: Calendar },
                    { key: 'social', label: 'Foco Social', icon: Users },
                  ].map((w) => {
                    const Icon = w.icon;
                    return (
                      <button
                        key={w.key}
                        onClick={() => setWeekType(w.key as WeekType)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          weekType === w.key
                            ? 'bg-indigo-950/70 border-indigo-500 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-semibold">{w.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meta-Sliders */}
              <MetaSliders values={metaSliders} onChange={setMetaSliders} />
            </div>
          )}

          {/* STEP 2: Panorama Climático de Mar del Plata */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-bold text-slate-200">2. Panorama Climático de Mar del Plata</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  El motor aprovecha activamente las ventanas de buen clima para actividades al aire libre (SC-08) y canaliza mal clima a estudio (SC-08b).
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { day: 'Lunes', score: 85, temp: '19°C', weather: 'Soleado / Brisa suave', status: 'Oportunidad Outdoor' },
                  { day: 'Martes', score: 80, temp: '20°C', weather: 'Despejado', status: 'Oportunidad Outdoor' },
                  { day: 'Miércoles', score: 25, temp: '12°C', weather: 'Lluvia / Viento SE', status: 'Ideal Estudio en Casa' },
                  { day: 'Jueves', score: 75, temp: '18°C', weather: 'Parcial nublado', status: 'Clima Favorable' },
                  { day: 'Viernes', score: 88, temp: '21°C', weather: 'Excelente', status: 'Tarde para Social' },
                  { day: 'Sábado', score: 90, temp: '22°C', weather: 'Ideal Playa / Rambla', status: 'Ventana de Oro' },
                  { day: 'Domingo', score: 70, temp: '17°C', weather: 'Templado', status: 'Favorable' },
                ].map((d, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">{d.day}</span>
                      {d.score >= 70 ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CloudRain className="w-4 h-4 text-blue-400" />
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-slate-100">{d.temp}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          d.score >= 70
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        CS: {d.score}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 truncate">{d.weather}</span>
                    <span className="text-[10px] text-indigo-400 font-semibold">{d.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Confirmación de Fijos y Excepciones */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">3. Eventos Fijos y Excepciones Puntuables</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Los eventos bloqueados (`is_locked: true`) serán estrictamente respetados por HC-02.
                </p>
              </div>

              <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                {currentSchedule
                  .filter((e) => e.is_locked || e.category === 'trabajo' || e.category === 'cursada')
                  .map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <div>
                          <span className="text-xs font-bold text-slate-200">{ev.name}</span>
                          <p className="text-[11px] text-slate-400">
                            {new Date(ev.start).toLocaleDateString('es-AR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })} ({ev.duration}m) · {ev.location?.name}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800/40 rounded">
                        HC-02 Bloqueado
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* STEP 4: Intenciones Sociales */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-bold text-slate-200">4. Intenciones Sociales y Serendipia</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Seleccioná con quiénes te gustaría conectar y cuántos slots abiertos reservar.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  { id: 'cont_juancito', name: 'Juancito', goal: 'Meta: 5h/sem', note: 'Amigo cercano' },
                  { id: 'cont_juani', name: 'Juani', goal: 'Meta: 3h/sem', note: 'A 10 min de casa' },
                  { id: 'cont_lau', name: 'Lau', goal: 'SC-16 (Balance)', note: 'Vínculo delicado' },
                ].map((c) => {
                  const isSelected = selectedContactIds.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedContactIds((prev) =>
                          prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                        );
                      }}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/80 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isSelected ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-200">{c.name}</span>
                          <p className="text-[11px] text-slate-400">{c.note}</p>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-semibold text-emerald-400">{c.goal}</span>
                    </div>
                  );
                })}
              </div>

              {/* Serendipity slots counter */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-fuchsia-400" />
                    Slots de Serendipia (Capa C)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ventanas abiertas para conocer gente o aceptar planes espontáneos.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3].map((num) => (
                    <button
                      key={num}
                      onClick={() => setSerendipityCount(num)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        serendipityCount === num
                          ? 'bg-fuchsia-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Ejecución del Solver CSP */}
          {step === 5 && (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <div className="p-4 bg-indigo-950/60 text-indigo-400 border border-indigo-500/30 rounded-2xl animate-pulse">
                <Zap className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">¡Todo listo para optimizar tu semana!</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1">
                  El motor CSP procesará las 10 Hard Constraints, evaluará GHC-01 y optimizará las 16 Soft Constraints en menos de 50 milisegundos.
                </p>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-left w-full text-xs flex flex-col gap-1.5 font-mono text-slate-300">
                <div>✓ Modo Energético: <span className="text-indigo-400 font-bold">{mood.toUpperCase()}</span></div>
                <div>✓ Tipo de Semana: <span className="text-indigo-400 font-bold">{weekType.toUpperCase()}</span></div>
                <div>✓ Slots de Serendipia a Inyectar: <span className="text-indigo-400 font-bold">{serendipityCount}</span></div>
                <div>✓ Amigos Priorizados: <span className="text-emerald-400 font-bold">{selectedContactIds.length}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : handlePrev}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            {step === 1 ? 'Cancelar' : <><ArrowLeft className="w-3.5 h-3.5" /> Anterior</>}
          </button>

          <button
            onClick={handleNext}
            disabled={isSolving}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {step === 5 ? (
              isSolving ? 'Optimizando (< 50ms)...' : 'Optimizar con CSP'
            ) : (
              <>Siguiente <ArrowRight className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
