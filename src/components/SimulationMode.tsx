'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  FlaskConical,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { Contact, Event, SolverResult, WeatherCondition } from '../lib/scheduler/types';
import { ConstraintParams } from '../lib/scheduler/params';
import { defaultMetaSliders, MetaSliderValues } from '../lib/scheduler/metaSliders';
import { evaluateSchedule } from '../lib/scheduler/scorer';
import { solveMiMesa } from '../lib/scheduler/solver';

interface SimulationModeProps {
  isOpen: boolean;
  onClose: () => void;
  baseSchedule: Event[];
  weather: WeatherCondition[];
  params: ConstraintParams;
  contacts: Contact[];
  weights: Record<string, number>;
  onApplySimulation: (newSchedule: Event[]) => void;
}

export const SimulationMode: React.FC<SimulationModeProps> = ({
  isOpen,
  onClose,
  baseSchedule,
  weather,
  params,
  contacts,
  weights,
  onApplySimulation,
}) => {
  const [simulatedSchedule, setSimulatedSchedule] = useState<Event[]>(() =>
    baseSchedule.map((e) => ({ ...e }))
  );

  if (!isOpen) return null;

  // Base score
  const baseEval = evaluateSchedule(baseSchedule, weather, params, contacts, weights, defaultMetaSliders);
  // Simulated score
  const simEval = evaluateSchedule(simulatedSchedule, weather, params, contacts, weights, defaultMetaSliders);
  const scoreDelta = simEval.score - baseEval.score;

  // Sandbox actions
  const addHypotheticalShift = () => {
    const friday = new Date();
    friday.setDate(friday.getDate() + ((5 - friday.getDay() + 7) % 7));
    friday.setHours(17, 0, 0, 0);

    const extraShift: Event = {
      id: `sim_extra_shift_${Date.now()}`,
      name: 'Turno Extra Ferro San Juan',
      category: 'trabajo',
      emoji: '🍕',
      start: friday,
      duration: 480, // 8h
      is_locked: false,
      location: { type: 'ferro_san_juan', name: 'Ferro San Juan' },
      weatherSensitivity: 'transit_only',
      cognitiveLoad: 1,
      physicalLoad: 2,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'sandbox',
      localVersion: 1,
      syncStatus: 'synced',
    };

    setSimulatedSchedule([...simulatedSchedule, extraShift]);
  };

  const removeStudyBlocks = () => {
    setSimulatedSchedule(simulatedSchedule.filter((e) => e.category !== 'estudio'));
  };

  const resetSandbox = () => {
    setSimulatedSchedule(baseSchedule.map((e) => ({ ...e })));
  };

  const runSolverOnSandbox = () => {
    const result = solveMiMesa({
      schedule: simulatedSchedule,
      weather,
      params,
      contacts,
      weights,
    });
    setSimulatedSchedule(result.schedule);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-indigo-500/80 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Sandbox Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-md">
              <FlaskConical className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Modo Simulación "Y si..." (§24)</h2>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full font-mono uppercase">
                  Sandbox Aislado
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Experimentá libremente cambios hipotéticos sin alterar tu agenda real.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sandbox Score Delta Bar */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Score Original</span>
              <span className="text-2xl font-black text-slate-300">{Math.round(baseEval.score)}</span>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-600" />

            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Score Simulado</span>
              <span className="text-2xl font-black text-indigo-400">{Math.round(simEval.score)}</span>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
              scoreDelta >= 0
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                : 'bg-rose-950 text-rose-300 border border-rose-800/40'
            }`}
          >
            {scoreDelta >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{scoreDelta >= 0 ? `+${scoreDelta.toFixed(1)}` : scoreDelta.toFixed(1)} pts</span>
          </div>
        </div>

        {/* Experiment Scenarios */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Escenarios de Prueba Rápidos:
          </span>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={addHypotheticalShift}
              className="p-3.5 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-left flex flex-col gap-1 transition-colors"
            >
              <span className="text-xs font-bold text-slate-200">➕ Sumar turno extra Ferro</span>
              <span className="text-[11px] text-slate-400">Evalúa el impacto de sumar un turno nocturno de 8h</span>
            </button>

            <button
              onClick={removeStudyBlocks}
              className="p-3.5 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-left flex flex-col gap-1 transition-colors"
            >
              <span className="text-xs font-bold text-slate-200">➖ Quitar bloques de estudio</span>
              <span className="text-[11px] text-slate-400">Simula qué pasa si suspendés estudio esta semana</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={runSolverOnSandbox}
              className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              Re-optimizar sandbox con CSP
            </button>

            <button
              onClick={resetSandbox}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer
            </button>
          </div>

          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-400">
            Eventos en el sandbox: <strong className="text-white">{simulatedSchedule.length}</strong> (Original: {baseSchedule.length})
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Descartar Simulación
          </button>

          <button
            onClick={() => {
              onApplySimulation(simulatedSchedule);
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Aplicar Escenario a Agenda Real
          </button>
        </div>
      </div>
    </div>
  );
};
