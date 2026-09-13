'use client';

import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Edit2,
  RefreshCw,
  RotateCcw,
  Sliders,
  Shield,
  Zap,
} from 'lucide-react';
import { ConstraintParams, defaultParams } from '../lib/scheduler/params';
import { MetaSliders } from './MetaSliders';
import { MetaSliderValues } from '../lib/scheduler/metaSliders';

interface ConstraintPanelProps {
  params: ConstraintParams;
  onParamsChange: (newParams: ConstraintParams) => void;
  metaSliders: MetaSliderValues;
  onMetaSlidersChange: (newMetaSliders: MetaSliderValues) => void;
  weights: Record<string, number>;
  onWeightChange: (key: string, weight: number) => void;
}

type TabType = 'params' | 'meta' | 'hard' | 'soft';

interface ParamMeta {
  key: keyof ConstraintParams;
  label: string;
  unit: string;
  description: string;
  min: number;
  max: number;
  step?: number;
  category: 'GHC' | 'Hard' | 'Soft';
}

const ALL_PARAMS_META: ParamMeta[] = [
  // GHC
  {
    key: 'cannabis_buffer_target',
    label: 'GHC-01 · Buffer Objetivo Cannabis',
    unit: 'minutos',
    description: 'Tiempo ideal libre tras consumo antes de eventos con responsabilidad o familia.',
    min: 60,
    max: 480,
    step: 15,
    category: 'GHC',
  },
  {
    key: 'cannabis_buffer_floor',
    label: 'GHC-01 · Piso Mínimo Inviolable',
    unit: 'minutos',
    description: 'Piso de seguridad absoluta. Menos de este valor se considera violación infinita.',
    min: 30,
    max: 240,
    step: 15,
    category: 'GHC',
  },
  {
    key: 'w_ghc01',
    label: 'GHC-01 · Peso de Penalización Cuadrática',
    unit: 'peso',
    description: 'Multiplicador de la curva cuadrática entre piso y objetivo.',
    min: 0,
    max: 10,
    step: 0.5,
    category: 'GHC',
  },

  // Hard Constraints
  {
    key: 'sleep_target_post_ferro',
    label: 'HC-03 · Sueño Continuo Post-Ferro',
    unit: 'minutos',
    description: 'Bloque continuo de descanso nocturno garantizado tras turno de madrugada (480m = 8h).',
    min: 360,
    max: 600,
    step: 30,
    category: 'Hard',
  },
  {
    key: 'sleep_minimum_absolute',
    label: 'HC-09 · Sueño Mínimo Absoluto Nocturno',
    unit: 'minutos',
    description: 'Descanso mínimo fisiológico requerido en cualquier noche de la semana (360m = 6h).',
    min: 300,
    max: 480,
    step: 30,
    category: 'Hard',
  },
  {
    key: 'travel_buffer_casino',
    label: 'HC-05 · Traslado Sucursal Casino Rambla',
    unit: 'minutos',
    description: 'Tiempo de viaje asignado por tramo entre el hogar y Rambla Casino.',
    min: 10,
    max: 90,
    step: 5,
    category: 'Hard',
  },
  {
    key: 'travel_buffer_ferro',
    label: 'HC-05 · Traslado Sucursal Ferro San Juan',
    unit: 'minutos',
    description: 'Tiempo de viaje asignado por tramo entre el hogar y Ferro San Juan.',
    min: 15,
    max: 90,
    step: 5,
    category: 'Hard',
  },
  {
    key: 'cognitive_ban_post_ferro',
    label: 'HC-11 · Bloqueo Cognitivo Post-Ferro',
    unit: 'minutos',
    description: 'Minutos post-llegada en los que no se permite estudio pesado o parciales (0 = desactivada).',
    min: 0,
    max: 180,
    step: 15,
    category: 'Hard',
  },
  {
    key: 'weather_extreme_threshold',
    label: 'HC-08 · Umbral de Clima Extremo para Reubicación',
    unit: 'ComfortScore',
    description: 'Si el ComfortScore cae por debajo de este valor, salidas al aire libre se reubican a indoor.',
    min: 0,
    max: 50,
    step: 5,
    category: 'Hard',
  },

  // Soft Constraints
  {
    key: 'study_block_min_duration',
    label: 'SC-01 · Duración Mínima Bloque de Estudio',
    unit: 'minutos',
    description: 'Estudio de Redes, AyDS, AEEC y CalSoft en bloques enfocados ininterrumpidos.',
    min: 60,
    max: 240,
    step: 15,
    category: 'Soft',
  },
  {
    key: 'batch_cooking_target',
    label: 'SC-02 · Meta Semanal Sesiones Batch Cooking',
    unit: 'sesiones/sem',
    description: 'Cantidad mínima de sesiones de cocina semanal para garantizar viandas.',
    min: 1,
    max: 4,
    step: 1,
    category: 'Soft',
  },
  {
    key: 'batch_cooking_duration',
    label: 'SC-02 · Duración Bloque Batch Cooking',
    unit: 'minutos',
    description: 'Tiempo por sesión de preparación culinaria en el hogar.',
    min: 60,
    max: 240,
    step: 15,
    category: 'Soft',
  },
  {
    key: 'dead_time_threshold',
    label: 'SC-09 · Umbral de Tiempo Muerto Improductivo',
    unit: 'minutos',
    description: 'Gaps menores a este valor entre distintas actividades son fusionados o penalizados.',
    min: 5,
    max: 45,
    step: 5,
    category: 'Soft',
  },
  {
    key: 'context_switches_max',
    label: 'SC-14 · Máximo Cambios de Contexto por Día',
    unit: 'transiciones',
    description: 'Límite de transiciones de categoría por jornada para evitar sobrecarga mental.',
    min: 2,
    max: 8,
    step: 1,
    category: 'Soft',
  },
  {
    key: 'serendipity_slots_per_week',
    label: 'SC-15 · Slots de Serendipia Semanales',
    unit: 'slots/sem',
    description: 'Espacios reservados en buen clima para socializar o conocer gente nueva.',
    min: 0,
    max: 5,
    step: 1,
    category: 'Soft',
  },
  {
    key: 'travel_time_max_daily',
    label: 'SC-12 · Tiempo Máximo de Viaje Diario Acumulado',
    unit: 'minutos/día',
    description: 'Alerta si el viaje total de la jornada supera este tope.',
    min: 30,
    max: 180,
    step: 15,
    category: 'Soft',
  },
  {
    key: 'long_session_no_meal_threshold',
    label: 'SC-11 · Máximo Tiempo Continuo Sin Comida',
    unit: 'minutos',
    description: 'Jornadas consecutivas de más de estas horas requieren al menos un almuerzo/cena.',
    min: 120,
    max: 480,
    step: 30,
    category: 'Soft',
  },
  {
    key: 'comfort_opportunity_threshold',
    label: 'SC-08 · Umbral de Buen Clima para Aire Libre',
    unit: 'ComfortScore',
    description: 'Puntaje meteorológico a partir del cual se priorizan salidas y paseos.',
    min: 50,
    max: 90,
    step: 5,
    category: 'Soft',
  },
  {
    key: 'comfort_indoor_threshold',
    label: 'SC-08b · Umbral de Mal Clima para Productividad',
    unit: 'ComfortScore',
    description: 'Puntaje meteorológico por debajo del cual se canaliza tiempo a estudio en casa.',
    min: 20,
    max: 60,
    step: 5,
    category: 'Soft',
  },
  {
    key: 'sensitive_contact_weekly_limit',
    label: 'SC-16 · Límite Semanal Vínculo Delicado (Lau)',
    unit: 'encuentros/sem',
    description: 'Tope de encuentros semanales para resguardar equilibrio emocional.',
    min: 1,
    max: 7,
    step: 1,
    category: 'Soft',
  },
];

export const ConstraintPanel: React.FC<ConstraintPanelProps> = ({
  params,
  onParamsChange,
  metaSliders,
  onMetaSlidersChange,
  weights,
  onWeightChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('params');
  const [editingKey, setEditingKey] = useState<keyof ConstraintParams | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const startEditing = (key: keyof ConstraintParams, currentVal: any) => {
    setEditingKey(key);
    setEditValue(currentVal !== undefined ? String(currentVal) : '');
  };

  const saveEdit = (key: keyof ConstraintParams) => {
    const num = parseFloat(editValue);
    if (!isNaN(num)) {
      onParamsChange({
        ...params,
        [key]: num,
      });
    }
    setEditingKey(null);
  };

  const cancelEdit = () => {
    setEditingKey(null);
  };

  const resetAllToDefaults = () => {
    if (window.confirm('¿Restaurar todos los 21 parámetros a sus valores recomendados por defecto?')) {
      onParamsChange({ ...defaultParams });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6 text-slate-100">
      {/* Panel Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold tracking-tight">Panel de Control de Restricciones</h2>
        </div>

        <button
          onClick={resetAllToDefaults}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
          title="Restaurar los 21 parámetros a valores por defecto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Defaults (P9)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('params')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'params'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Edit2 className="w-3.5 h-3.5" />
          21 Parámetros Editables (P9)
        </button>
        <button
          onClick={() => setActiveTab('meta')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'meta'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Meta-Sliders
        </button>
        <button
          onClick={() => setActiveTab('hard')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'hard'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Hard Constraints (10)
        </button>
        <button
          onClick={() => setActiveTab('soft')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'soft'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Pesos Soft Constraints (16)
        </button>
      </div>

      {/* Tab 1: 21 Inline Editable Parameters (Principio P9) */}
      {activeTab === 'params' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Ningún número está hardcodeado en el motor CSP. Editá cualquier parámetro inline con el lápiz ✏️:
            </span>
            <span className="font-mono text-indigo-400">Total: 21 parámetros</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {ALL_PARAMS_META.map((meta) => {
              const currentValue = params[meta.key];
              const isEditing = editingKey === meta.key;

              return (
                <div
                  key={meta.key}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 rounded-lg flex flex-col justify-between gap-2 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200">{meta.label}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {meta.description}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold flex-shrink-0 ${
                        meta.category === 'GHC'
                          ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                          : meta.category === 'Hard'
                          ? 'bg-rose-950 text-rose-300 border border-rose-600/40'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-600/40'
                      }`}
                    >
                      {meta.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
                    <span className="text-[11px] text-slate-500">
                      Rango: [{meta.min} – {meta.max}] {meta.unit}
                    </span>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={meta.min}
                          max={meta.max}
                          step={meta.step ?? 1}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20 bg-slate-800 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white font-mono focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(meta.key)}
                          className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                          title="Guardar"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                          title="Cancelar"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                          {currentValue !== undefined ? currentValue : '—'} {meta.unit}
                        </span>
                        <button
                          onClick={() => startEditing(meta.key, currentValue)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                          title="Editar valor inline"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Meta-Sliders */}
      {activeTab === 'meta' && (
        <MetaSliders values={metaSliders} onChange={onMetaSlidersChange} />
      )}

      {/* Tab 3: Hard Constraints */}
      {activeTab === 'hard' && (
        <div className="flex flex-col gap-3">
          <span className="text-xs text-slate-400">
            Las 10 Hard Constraints definen la viabilidad matemática del estado. Son inviolables en el espacio factible:
          </span>
          <div className="flex flex-col gap-2 max-h-[450px] overflow-y-auto pr-1">
            {[
              { id: 'HC-01', name: 'No Solapamiento Temporal', status: 'Inviolable', desc: 'Ningún evento comparte slot con otro' },
              { id: 'HC-02', name: 'Universal Lock Respetado', status: 'Inviolable', desc: 'Eventos con is_locked no se mueven ni alteran' },
              { id: 'HC-03', name: '8h de Sueño Post-Ferro San Juan', status: 'Inviolable', desc: 'Ventana continua de 480m garantizada post-turno' },
              { id: 'HC-05', name: 'Buffers de Traslado Laboral', status: 'Inviolable', desc: '30m para Casino Rambla / 45m para Ferro San Juan' },
              { id: 'HC-05b', name: 'Viabilidad Física de Traslados', status: 'Inviolable', desc: 'Gap entre ubicaciones >= matriz de viaje MDP' },
              { id: 'HC-07', name: 'Horarios Fijos Universitarios', status: 'Inviolable', desc: 'Cursadas de Redes, AyDS, AEEC, CalSoft' },
              { id: 'HC-08', name: 'Reubicación por Clima Extremo', status: 'Activa', desc: 'Si ComfortScore < 20, outdoor pasa a indoor' },
              { id: 'HC-09', name: 'Sueño Mínimo Absoluto (6h)', status: 'Inviolable', desc: 'Mínimo fisiológico garantizado por noche' },
              { id: 'HC-10', name: 'Prioridad Laboral Absoluta', status: 'Inviolable', desc: 'Turnos de trabajo nunca son invadidos' },
              { id: 'HC-11', name: 'Veto Cognitivo Post-Ferro', status: 'Activa', desc: 'Sin estudio pesado en las primeras 1.5h post-llegada' },
            ].map((hc) => (
              <div
                key={hc.id}
                className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-rose-400">{hc.id}</span>
                    <span className="text-xs font-semibold text-slate-200">{hc.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{hc.desc}</p>
                </div>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800/40 rounded">
                  {hc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Pesos de Soft Constraints */}
      {activeTab === 'soft' && (
        <div className="flex flex-col gap-3">
          <span className="text-xs text-slate-400">
            Modificá el peso base (0 a 10) de cada Soft Constraint. Se multiplica reactivamente por los Meta-Sliders:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1">
            {[
              { id: 'SC-01', name: 'Bloques de Estudio Continuos (>= 120m)', key: 'w_sc01', defaultW: 8 },
              { id: 'SC-02', name: 'Batch Cooking Semanal (2 sesiones)', key: 'w_sc02', defaultW: 5 },
              { id: 'SC-03', name: 'Metas de Horas Semanales de Amigos', key: 'w_sc03', defaultW: 6 },
              { id: 'SC-04', name: 'Fatiga Circadiana Acumulada', key: 'w_sc04', defaultW: 9 },
              { id: 'SC-05', name: 'Carga Diaria Equilibrada', key: 'w_sc05', defaultW: 4 },
              { id: 'SC-06', name: 'Disponibilidad de Contactos', key: 'w_sc06', defaultW: 3 },
              { id: 'SC-07', name: 'Horarios de Estudio Preferidos', key: 'w_sc07', defaultW: 6 },
              { id: 'SC-08', name: 'Aprovechar Buen Clima para Social', key: 'w_sc08', defaultW: 7 },
              { id: 'SC-08b', name: 'Aprovechar Mal Clima en Casa', key: 'w_sc08b', defaultW: 4 },
              { id: 'SC-09', name: 'Sin Tiempo Muerto (< 20m)', key: 'w_sc09', defaultW: 5 },
              { id: 'SC-10', name: 'Secuenciación por Carga y Recuperación', key: 'w_sc10', defaultW: 8 },
              { id: 'SC-11', name: 'Comidas en Jornadas Largas (> 5h)', key: 'w_sc11', defaultW: 7 },
              { id: 'SC-12', name: 'Tiempo Máximo de Viaje Diario (<= 90m)', key: 'w_sc12', defaultW: 4 },
              { id: 'SC-13', name: 'Presupuesto Semanal en ARS', key: 'w_sc13', defaultW: 3 },
              { id: 'SC-14', name: 'Sin Exceso de Cambios de Contexto', key: 'w_sc14', defaultW: 6 },
              { id: 'SC-15', name: 'Slots de Serendipia Social Semanal', key: 'w_sc15', defaultW: 5 },
              { id: 'SC-16', name: 'Equilibrio Vínculo Delicado (Lau)', key: 'w_sc16', defaultW: 0 },
            ].map((sc) => {
              const currentWeight = weights[sc.key] ?? sc.defaultW;

              return (
                <div
                  key={sc.id}
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      <span className="font-mono text-indigo-400 mr-1.5">{sc.id}</span>
                      {sc.name}
                    </span>
                    <span className="font-mono font-bold text-indigo-300 bg-slate-800 px-2 py-0.5 rounded">
                      w = {currentWeight}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={currentWeight}
                    onChange={(e) => onWeightChange(sc.key, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
