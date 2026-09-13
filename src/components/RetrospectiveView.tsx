'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Heart,
  HelpCircle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Utensils,
  X,
} from 'lucide-react';
import { Event } from '../lib/scheduler/types';

interface RetrospectiveViewProps {
  isOpen: boolean;
  onClose: () => void;
  projectedScore: number;
  actualScore: number;
  completedEvents: Event[];
  onStartNewPlan: () => void;
}

export const RetrospectiveView: React.FC<RetrospectiveViewProps> = ({
  isOpen,
  onClose,
  projectedScore,
  actualScore,
  completedEvents,
  onStartNewPlan,
}) => {
  const [frictionReason, setFrictionReason] = useState<string>('');

  if (!isOpen) return null;

  const scoreDiff = actualScore - projectedScore;

  // Compute metrics
  const studyHours = completedEvents
    .filter((e) => e.category === 'estudio' || e.category === 'cursada')
    .reduce((acc, e) => acc + e.duration, 0) / 60;

  const cookingSessions = completedEvents.filter((e) => e.category === 'batch_cooking').length;

  const socialHours = completedEvents
    .filter((e) => e.category === 'social' || e.isOpenSocialSlot)
    .reduce((acc, e) => acc + e.duration, 0) / 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-700/40 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Retrospectiva Semanal (§22)</h2>
              <p className="text-xs text-slate-400">Balance del domingo antes de planificar la nueva semana</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
          {/* Score Comparison Banner */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Score Proyectado</span>
                <span className="text-2xl font-black text-slate-300">{Math.round(projectedScore)}</span>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-600" />

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Score Real Logrado</span>
                <span className="text-2xl font-black text-indigo-400">{Math.round(actualScore)}</span>
              </div>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
                scoreDiff >= 0
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                  : 'bg-amber-950 text-amber-300 border border-amber-800/40'
              }`}
            >
              {scoreDiff >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{scoreDiff >= 0 ? `+${scoreDiff.toFixed(1)}` : scoreDiff.toFixed(1)} pts</span>
            </div>
          </div>

          {/* Core Habit Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col gap-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                Estudio Realizado
              </span>
              <span className="text-lg font-black text-cyan-300">{studyHours.toFixed(1)} h</span>
              <span className="text-[10px] text-slate-500">Meta sugerida: ~10h</span>
            </div>

            <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col gap-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-orange-400" />
                Batch Cooking
              </span>
              <span className="text-lg font-black text-orange-300">{cookingSessions} / 2</span>
              <span className="text-[10px] text-slate-500">Sesiones completadas</span>
            </div>

            <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col gap-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                Tiempo Social
              </span>
              <span className="text-lg font-black text-emerald-300">{socialHours.toFixed(1)} h</span>
              <span className="text-[10px] text-slate-500">Metas Juancito / Juani</span>
            </div>
          </div>

          {/* Friction Survey */}
          <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              ¿Qué causó las principales modificaciones esta semana?
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                'Cansancio acumulado post-Ferro',
                'Cambio de horario en el trabajo',
                'Surgió salida imprevista',
                'La cursada demandó más tiempo',
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setFrictionReason(reason)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    frictionReason === reason
                      ? 'bg-indigo-950 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cerrar
          </button>

          <button
            onClick={() => {
              onClose();
              onStartNewPlan();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <span>Planificar Nueva Semana</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
