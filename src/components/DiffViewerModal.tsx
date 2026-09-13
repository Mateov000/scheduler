'use client';

import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Sparkles,
  Sliders,
  TrendingUp,
  Wrench,
  X,
} from 'lucide-react';
import { ConstraintTrace, Event } from '../lib/scheduler/types';

interface DiffViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  traces: ConstraintTrace[];
  originalSchedule: Event[];
  proposedSchedule: Event[];
  scoreBefore: number;
  scoreAfter: number;
  onAccept: () => void;
  onDiscard: () => void;
  onManualAdjust?: () => void;
}

export const DiffViewerModal: React.FC<DiffViewerModalProps> = ({
  isOpen,
  onClose,
  traces,
  originalSchedule,
  proposedSchedule,
  scoreBefore,
  scoreAfter,
  onAccept,
  onDiscard,
  onManualAdjust,
}) => {
  if (!isOpen) return null;

  const scoreDelta = scoreAfter - scoreBefore;

  // Identify any GHC-01 trace
  const ghcTrace = traces.find(
    (t) => t.primaryTrigger.constraintId === 'GHC-01' || (t.ghcViolationAmount && t.ghcViolationAmount > 0)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-700/40 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Propuesta de Optimización de Agenda</h2>
              <p className="text-xs text-slate-400">Revisión de cambios sugeridos por el solver CSP</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 font-mono text-xs">
              <span className="text-slate-400">Score:</span>
              <span className="text-slate-300">{Math.round(scoreBefore)}</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="font-bold text-emerald-400">{Math.round(scoreAfter)}</span>
              <span
                className={`font-bold ml-1 ${
                  scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ({scoreDelta >= 0 ? `+${scoreDelta.toFixed(1)}` : scoreDelta.toFixed(1)} pts)
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Prominent GHC-01 Warning Card (§7.3 & §18) */}
          {ghcTrace && (
            <div className="p-4 rounded-xl bg-amber-950/40 border-2 border-amber-600/80 shadow-lg flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
                <span>GHC-01 · Buffer Post-Consumo Acortado</span>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-900/60 rounded text-amber-200 border border-amber-700/50">
                  Trade-off propuesto
                </span>
              </div>

              <p className="text-xs text-amber-200/90 leading-relaxed">
                {ghcTrace.primaryTrigger.explanation}
              </p>

              <div className="flex items-center justify-between text-xs bg-amber-950/80 p-2.5 rounded-lg border border-amber-800/40 font-mono">
                <span className="text-slate-300">Impacto en Score neto:</span>
                <span className="font-bold text-amber-300">
                  {ghcTrace.scoreImpact >= 0 ? `+${ghcTrace.scoreImpact.toFixed(1)}` : ghcTrace.scoreImpact.toFixed(1)} pts
                </span>
              </div>
            </div>
          )}

          {/* List of changes */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Modificaciones Propuestas ({traces.length}):
            </h3>

            {traces.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                Tu agenda actual ya está en un estado óptimo factible. No se requirieron movimientos.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {traces.map((trace, idx) => {
                  const event = proposedSchedule.find((e) => e.id === trace.eventId);
                  const isAuto = trace.changeType === 'auto_inserted';

                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 rounded-xl flex flex-col gap-2 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                              isAuto
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/40'
                                : 'bg-slate-800 text-slate-300 border border-slate-700/50'
                            }`}
                          >
                            {isAuto ? 'AUTO-INSERTADO' : trace.changeType.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-slate-200">
                            {event ? (event.emoji ? `${event.emoji} ` : '') + event.name : trace.eventId}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-mono font-bold ${
                            trace.scoreImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {trace.scoreImpact >= 0
                            ? `+${trace.scoreImpact.toFixed(1)}`
                            : trace.scoreImpact.toFixed(1)}{' '}
                          pts
                        </span>
                      </div>

                      {/* Explanation */}
                      <p className="text-xs text-slate-400 leading-snug pl-1 border-l-2 border-slate-700">
                        {trace.primaryTrigger.explanation}
                      </p>

                      {/* Time Slot Comparison if moved */}
                      {trace.previousSlot && trace.newSlot && (
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900 p-2 rounded-lg mt-1">
                          <span className="line-through text-slate-500">
                            {new Date(trace.previousSlot.start).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-indigo-300 font-bold">
                            {new Date(trace.newSlot.start).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onDiscard}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            Descartar Propuesta
          </button>

          <div className="flex items-center gap-2">
            {onManualAdjust && (
              <button
                onClick={onManualAdjust}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                Ajustar Manualmente
              </button>
            )}

            <button
              onClick={onAccept}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Aceptar y Aplicar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
