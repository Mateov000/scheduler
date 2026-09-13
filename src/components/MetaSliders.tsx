'use client';

import React from 'react';
import { Sliders, Sparkles, BookOpen, Users, Coffee, Bed } from 'lucide-react';
import { CONTEXT_PRESETS, ContextPresetName, MetaSliderValues } from '../lib/scheduler/metaSliders';

interface MetaSlidersProps {
  values: MetaSliderValues;
  onChange: (values: MetaSliderValues) => void;
}

export const MetaSliders: React.FC<MetaSlidersProps> = ({ values, onChange }) => {
  const handleSliderChange = (key: keyof MetaSliderValues, numVal: number) => {
    onChange({
      ...values,
      [key]: numVal,
    });
  };

  const applyPreset = (presetName: ContextPresetName) => {
    const presetValues = CONTEXT_PRESETS[presetName];
    if (presetValues) {
      onChange(presetValues);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-6 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-base tracking-tight">Meta-Sliders de Intención Semanal</h3>
        </div>
        <span className="text-xs px-2.5 py-1 bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 rounded-full font-mono">
          Rango: [0.5x – 2.0x]
        </span>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Presets de Contexto (§10.4):</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CONTEXT_PRESETS) as ContextPresetName[]).map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700/60 text-slate-300 hover:text-white transition-all duration-150 flex items-center gap-1.5"
            >
              {preset === 'Semana de examen' && <BookOpen className="w-3.5 h-3.5 text-amber-400" />}
              {preset === 'Período social intenso' && <Users className="w-3.5 h-3.5 text-emerald-400" />}
              {preset === 'Recuperación post-Ferro' && <Bed className="w-3.5 h-3.5 text-blue-400" />}
              {preset === 'Quiero conocer gente' && <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />}
              {preset === 'Introspección / relax' && <Coffee className="w-3.5 h-3.5 text-teal-400" />}
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* The 3 Sliders */}
      <div className="flex flex-col gap-6 pt-1">
        {/* Slider 1 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-400">0: Vínculos íntimos (Juani / Juancito)</span>
            <span className="text-indigo-400 font-mono font-bold bg-slate-800 px-2 py-0.5 rounded">
              {values.depthVsAmplitudeSocial} / 10
            </span>
            <span className="text-slate-400">10: Amplitud (Gente nueva / Serendipia)</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={values.depthVsAmplitudeSocial}
            onChange={(e) => handleSliderChange('depthVsAmplitudeSocial', Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Prioriza SC-03 (Metas)</span>
            <span>Neutral (5)</span>
            <span>Prioriza SC-15 (Serendipia)</span>
          </div>
        </div>

        {/* Slider 2 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-400">0: Productividad (Estudio / Batch cooking)</span>
            <span className="text-indigo-400 font-mono font-bold bg-slate-800 px-2 py-0.5 rounded">
              {values.productivityVsEnjoyment} / 10
            </span>
            <span className="text-slate-400">10: Disfrute / Salidas sociales</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={values.productivityVsEnjoyment}
            onChange={(e) => handleSliderChange('productivityVsEnjoyment', Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Prioriza SC-01 y SC-02</span>
            <span>Neutral (5)</span>
            <span>Prioriza SC-08 y SC-15</span>
          </div>
        </div>

        {/* Slider 3 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-400">0: Introversión / Recuperación a solas</span>
            <span className="text-indigo-400 font-mono font-bold bg-slate-800 px-2 py-0.5 rounded">
              {values.introvertVsExtrovert} / 10
            </span>
            <span className="text-slate-400">10: Extroversión / Con gente</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={values.introvertVsExtrovert}
            onChange={(e) => handleSliderChange('introvertVsExtrovert', Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Prioriza Sueño y Descanso</span>
            <span>Neutral (5)</span>
            <span>Prioriza Salidas y Encuentros</span>
          </div>
        </div>
      </div>
    </div>
  );
};
