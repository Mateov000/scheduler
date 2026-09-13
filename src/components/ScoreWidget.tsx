'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface ScoreBreakdown {
  hardViolationsCount: number;
  ghcPenalties: Record<string, number>;
  softPenalties: Record<string, number>;
}

interface ScoreWidgetProps {
  score: number;
  scoreBreakdown: ScoreBreakdown;
  solvingTimeMs?: number;
  violations?: string[];
}

export const ScoreWidget: React.FC<ScoreWidgetProps> = ({
  score,
  scoreBreakdown,
  solvingTimeMs,
  violations = [],
}) => {
  const [showDrillDown, setShowDrillDown] = useState(false);

  // Determine chromatic palette
  const getTheme = (s: number) => {
    if (s < 40) {
      return {
        text: 'text-rose-400',
        stroke: '#f43f5e',
        glow: 'shadow-[0_0_25px_rgba(244,63,94,0.3)]',
        border: 'border-rose-800/50',
        label: 'Compromiso Severo',
        bgPill: 'bg-rose-950/60 text-rose-300 border-rose-700/50',
      };
    }
    if (s <= 65) {
      return {
        text: 'text-amber-400',
        stroke: '#fbbf24',
        glow: 'shadow-[0_0_25px_rgba(251,191,36,0.3)]',
        border: 'border-amber-800/50',
        label: 'Margen de Mejora',
        bgPill: 'bg-amber-950/60 text-amber-300 border-amber-700/50',
      };
    }
    if (s <= 85) {
      return {
        text: 'text-emerald-400',
        stroke: '#34d399',
        glow: 'shadow-[0_0_25px_rgba(52,211,153,0.3)]',
        border: 'border-emerald-800/50',
        label: 'Semana en Equilibrio',
        bgPill: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
      };
    }
    return {
      text: 'text-fuchsia-400',
      stroke: '#e879f9',
      glow: 'shadow-[0_0_35px_rgba(232,121,249,0.4)]',
      border: 'border-fuchsia-800/50',
      label: 'Alineación Excelente',
      bgPill: 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-700/50',
    };
  };

  const theme = getTheme(score);

  // SVG ring computation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  // Find highest soft penalties for actionable advice
  const topPenalties = Object.entries(scoreBreakdown.softPenalties)
    .filter(([_, val]) => val > 0.1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const ghcEntries = Object.entries(scoreBreakdown.ghcPenalties).filter(([_, val]) => val > 0);

  return (
    <div
      className={`bg-slate-900/90 backdrop-blur-md border ${theme.border} rounded-xl p-5 shadow-2xl flex flex-col gap-4 text-slate-100 transition-all duration-300 ${theme.glow}`}
    >
      {/* Top row with Ring & Main numbers */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Circular SVG Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-slate-800 stroke-current"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={theme.stroke}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Score in the middle */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-2xl font-black tracking-tight ${theme.text}`}>
                {Math.round(score)}
              </span>
              <span className="text-[10px] uppercase font-mono text-slate-400">Score</span>
            </div>
          </div>

          {/* Status Label */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${theme.bgPill}`}
              >
                {theme.label}
              </span>
              {score >= 86 && <Sparkles className="w-4 h-4 text-fuchsia-400 animate-pulse" />}
            </div>
            <p className="text-xs text-slate-400 max-w-[220px]">
              {score >= 86
                ? 'Equilibrio sobresaliente entre descanso, estudio, trabajo y vínculos.'
                : score >= 66
                ? 'Agenda viable y saludable con buena distribución energética.'
                : score >= 40
                ? 'Existen fricciones moderadas en descanso, estudio o traslados.'
                : 'Peligro de agotamiento severo o falta de sueño reparador.'}
            </p>
          </div>
        </div>

        {/* Speed & Toggle Drill-Down */}
        <div className="flex flex-col items-end gap-2">
          {solvingTimeMs !== undefined && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/50">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>{solvingTimeMs.toFixed(1)} ms</span>
            </div>
          )}

          <button
            onClick={() => setShowDrillDown(!showDrillDown)}
            className="text-xs flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            <span>Desglose</span>
            {showDrillDown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Drill-Down Section (§20.3) */}
      {showDrillDown && (
        <div className="pt-3 border-t border-slate-800 flex flex-col gap-3 text-xs animate-fadeIn">
          {/* Hard Violations Indicator */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Hard Constraints (Inviolables)
            </span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                scoreBreakdown.hardViolationsCount === 0
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                  : 'bg-rose-950 text-rose-300 border border-rose-800/40'
              }`}
            >
              {scoreBreakdown.hardViolationsCount === 0 ? '0 Violaciones (Factible)' : `${scoreBreakdown.hardViolationsCount} Violaciones`}
            </span>
          </div>

          {/* GHC Trade-offs */}
          {ghcEntries.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Trade-offs de GHC Activos</span>
              </div>
              {ghcEntries.map(([ghcId, penalty]) => (
                <div key={ghcId} className="flex justify-between text-slate-300 pl-6 text-[11px]">
                  <span>{ghcId} (Buffer acortado):</span>
                  <span className="font-mono text-amber-300 font-bold">-{penalty.toFixed(1)} pts</span>
                </div>
              ))}
            </div>
          )}

          {/* Top Soft Penalties */}
          {topPenalties.length > 0 && (
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Mayores Fricciones Detectadas:
              </span>
              <div className="flex flex-col gap-1">
                {topPenalties.map(([scKey, penalty]) => (
                  <div key={scKey} className="flex justify-between text-slate-400">
                    <span className="capitalize">{scKey.replace('w_', '').replace('_', ' ')}</span>
                    <span className="font-mono text-rose-300 font-medium">-{penalty.toFixed(1)} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Advice */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-indigo-200">
            <Lightbulb className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Tip para ganar Score:</strong> Si protegés el bloque de estudio del martes y asegurás 8h de descanso post-Ferro, tu score aumentará en{' '}
              <strong className="text-white">+6.5 pts</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
