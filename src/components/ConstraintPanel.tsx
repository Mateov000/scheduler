'use client';

import React, { useState } from 'react';
import {
  Check,
  Edit2,
  HelpCircle,
  Info,
  RotateCcw,
  Shield,
  Sliders,
  Sparkles,
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
  howItWorks: string;
  mathLogic: string;
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
    howItWorks: 'Aplica una penalización cuadrática para cualquier tiempo de recuperación inferior a este objetivo.',
    mathLogic: 'P = w · (cannabis_buffer_target - t)²',
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
    howItWorks: 'Si el intervalo libre es menor a este piso, el estado es podado inmediatamente del árbol CSP.',
    mathLogic: 'Si t < cannabis_buffer_floor → Violación Dura (Infinito)',
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
    howItWorks: 'Determina la severidad con la que se penaliza recortar el buffer de cannabis.',
    mathLogic: 'Multiplicador directo w en la función de costo de GHC-01',
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
    howItWorks: 'Tras la salida de Ferro San Juan (madrugada), reserva una ventana ininterrumpida de descanso.',
    mathLogic: 'start_siguiente_evento - fin_turno_ferro ≥ sleep_target_post_ferro',
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
    howItWorks: 'Garantiza el piso vital fisiológico de sueño entre el fin de un día y el inicio del siguiente.',
    mathLogic: 'start_primer_evento(día+1) - fin_ultimo_evento(día) ≥ sleep_minimum_absolute',
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
    howItWorks: 'Inserta un buffer obligatorio antes y después de los turnos en el Casino para cubrir el viaje en MDP.',
    mathLogic: 'buffer_previo ≥ travel_buffer_casino && buffer_posterior ≥ travel_buffer_casino',
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
    howItWorks: 'Inserta un buffer obligatorio antes y después de los turnos en Ferro San Juan.',
    mathLogic: 'buffer_previo ≥ travel_buffer_ferro && buffer_posterior ≥ travel_buffer_ferro',
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
    howItWorks: 'Prohíbe agendar estudio intensivo o parciales en las primeras horas tras el turno nocturno.',
    mathLogic: 'Para eventos con cognitiveLoad ≥ 2: start_evento - fin_ferro ≥ cognitive_ban_post_ferro',
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
    howItWorks: 'Protege contra temporales o sudestadas marplatenses reubicando eventos de exterior a sedes cubiertas.',
    mathLogic: 'Si location.isOutdoor && ComfortScore < weather_extreme_threshold → Inválido',
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
    howItWorks: 'Bonifica bloques de estudio continuo y enfocado (Deep Work), penalizando la fragmentación.',
    mathLogic: 'Penaliza si duración_estudio < study_block_min_duration',
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
    howItWorks: 'Incentiva programar sesiones de preparación culinaria en el hogar para toda la semana.',
    mathLogic: 'Penalización = w · max(0, batch_cooking_target - sesiones_agendadas)',
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
    howItWorks: 'Asegura que cada bloque de cocina tenga tiempo suficiente para cocinar y ordenar.',
    mathLogic: 'Penaliza bloques de batch cooking con duración inferior a este parámetro',
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
    howItWorks: 'Detecta y penaliza huecos libres demasiado cortos para ser productivos pero que obligan a esperar.',
    mathLogic: 'Penaliza si 0 < gap_libre < dead_time_threshold',
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
    howItWorks: 'Controla la fatiga cognitiva por cambio continuo de mentalidad (ej. trabajo a estudio a gym a social).',
    mathLogic: 'Penaliza si transiciones_de_categoria_en_el_día > context_switches_max',
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
    howItWorks: 'Garantiza bloques libres intencionales para encuentros espontáneos y vida social.',
    mathLogic: 'Bonifica tener al menos serendipity_slots_per_week slots abiertos en la semana',
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
    howItWorks: 'Suma todos los traslados del día en Mar del Plata y penaliza el exceso de tiempo en transporte.',
    mathLogic: 'Penaliza si sumatoria_traslados_del_día > travel_time_max_daily',
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
    howItWorks: 'Verifica que en jornadas continuas intensas se inserte una pausa para alimentarse adecuadamente.',
    mathLogic: 'Penaliza bloques continuos activos > long_session_no_meal_threshold sin evento de comida',
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
    howItWorks: 'Bonifica actividades sociales y mates en la costa cuando el clima de MDP es agradable.',
    mathLogic: 'Bonificación = w · (ComfortScore - comfort_opportunity_threshold) para eventos outdoor',
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
    howItWorks: 'En días fríos, ventosos o con lluvia, convierte el clima desfavorable en alta productividad doméstica.',
    mathLogic: 'Bonificación por actividades indoor cuando ComfortScore < comfort_indoor_threshold',
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
    howItWorks: 'Protege la estabilidad afectiva y evita recaídas limitando encuentros con vínculos delicados.',
    mathLogic: 'Penaliza si encuentros_semanales_lau > sensitive_contact_weekly_limit',
    min: 1,
    max: 7,
    step: 1,
    category: 'Soft',
  },
];

interface HardConstraintDef {
  id: string;
  name: string;
  status: 'Inviolable' | 'Activa' | 'Graduada';
  desc: string;
  howItWorks: string;
  mathLogic: string;
  purpose: string;
  paramsKeys?: Array<{
    key: keyof ConstraintParams;
    label: string;
    unit: string;
    min: number;
    max: number;
    step?: number;
  }>;
}

const HARD_CONSTRAINTS_LIST: HardConstraintDef[] = [
  {
    id: 'GHC-01',
    name: 'Buffer Graduado de Cannabis',
    status: 'Graduada',
    desc: 'Función de penalización cuadrática con piso inviolable de recuperación.',
    howItWorks:
      'Tras un evento de consumo privado, penaliza si el tiempo de recuperación es menor al objetivo. Si cae por debajo del piso mínimo de seguridad absoluta, el solver lo considera violación infinita y descarta la solución.',
    mathLogic: 'P = w · (cannabis_buffer_target - t)² si piso ≤ t < objetivo. Si t < piso → Violación Dura (Infinito).',
    purpose: 'Asegurar lucidez cognitiva y sobriedad antes de compromisos de trabajo, estudio o familia.',
    paramsKeys: [
      { key: 'cannabis_buffer_target', label: 'Buffer Objetivo', unit: 'minutos', min: 60, max: 480, step: 15 },
      { key: 'cannabis_buffer_floor', label: 'Piso Mínimo Inviolable', unit: 'minutos', min: 30, max: 240, step: 15 },
      { key: 'w_ghc01', label: 'Multiplicador de Costo (w)', unit: 'peso', min: 0, max: 10, step: 0.5 },
    ],
  },
  {
    id: 'HC-01',
    name: 'No Solapamiento Temporal',
    status: 'Inviolable',
    desc: 'Ningún evento comparte slot con otro en el espacio físico.',
    howItWorks:
      'Verifica que para cualquier par de eventos A y B agendados, sus intervalos de inicio y fin no tengan intersección temporal.',
    mathLogic: '[start_A, start_A + dur_A) ∩ [start_B, start_B + dur_B) = ∅ para todo A ≠ B.',
    purpose: 'Imposibilidad física y biológica de estar en dos lugares o actividades al mismo tiempo.',
  },
  {
    id: 'HC-02',
    name: 'Universal Lock Respetado',
    status: 'Inviolable',
    desc: 'Eventos con is_locked: true no se mueven ni alteran de horario ni duración.',
    howItWorks:
      'Todo evento marcado con candado congela su horario y duración como constantes fijas. El solver CSP únicamente optimiza alrededor de ellos sin tocarlos.',
    mathLogic: 'Dominio D(E) = { (start_fijo, dur_fija) }. Poda inmediata de cualquier mutación.',
    purpose: 'Garantizar que compromisos inamovibles (médicos, parciales, citas) nunca sean desplazados por el algoritmo.',
  },
  {
    id: 'HC-03',
    name: 'Sueño Continuo Post-Ferro San Juan',
    status: 'Inviolable',
    desc: 'Ventana continua garantizada de descanso tras turno de cierre nocturno.',
    howItWorks:
      'Tras terminar el turno de madrugada en la pizzería Ferro San Juan, reserva automáticamente un bloque continuo de descanso nocturno sin permitir ningún evento.',
    mathLogic: 'start_siguiente_evento - fin_ferro ≥ sleep_target_post_ferro.',
    purpose: 'Prevenir privación crónica de sueño y deterioro cognitivo en jornadas con noche invertida.',
    paramsKeys: [
      { key: 'sleep_target_post_ferro', label: 'Horas de Sueño Post-Ferro', unit: 'minutos', min: 360, max: 600, step: 30 },
    ],
  },
  {
    id: 'HC-05',
    name: 'Buffers de Traslado Laboral',
    status: 'Inviolable',
    desc: 'Margen de traslado antes y después de turnos en Casino Rambla y Ferro San Juan.',
    howItWorks:
      'Inserta obligatoriamente un margen de tiempo libre antes de entrar y después de salir de cada turno presencial de trabajo para viajar por la ciudad.',
    mathLogic: 'gap_previo ≥ travel_buffer && gap_posterior ≥ travel_buffer para Casino y Ferro.',
    purpose: 'Asegurar puntualidad laboral y absorber imprevistos del transporte público en Mar del Plata.',
    paramsKeys: [
      { key: 'travel_buffer_casino', label: 'Buffer Casino Rambla', unit: 'minutos', min: 10, max: 90, step: 5 },
      { key: 'travel_buffer_ferro', label: 'Buffer Ferro San Juan', unit: 'minutos', min: 15, max: 90, step: 5 },
    ],
  },
  {
    id: 'HC-05b',
    name: 'Viabilidad Física de Traslados (Matriz MDP)',
    status: 'Inviolable',
    desc: 'El intervalo entre ubicaciones distintas debe ser mayor o igual a la matriz de viaje de Mar del Plata.',
    howItWorks:
      'Consulta la matriz geodésica de tiempos de traslado entre zonas de Mar del Plata (Hogar, Facultad, Casino, Ferro, etc.). Si el tiempo libre es menor al viaje real, el estado se poda.',
    mathLogic: 'start_B - fin_A ≥ TravelMatrix[loc_A, loc_B] si loc_A ≠ loc_B.',
    purpose: 'Garantizar que la agenda sea físicamente posible de ejecutar en las calles de la ciudad.',
  },
  {
    id: 'HC-07',
    name: 'Horarios Fijos Universitarios',
    status: 'Inviolable',
    desc: 'Cursadas y comisiones de FI UFASTA (Redes, AyDS, AEEC, CalSoft).',
    howItWorks:
      'Las materias universitarias tienen asignaciones horarias fijas e inamovibles durante el cuatrimestre.',
    mathLogic: 'Bloques de cursada protegidos con prioridad académica absoluta.',
    purpose: 'Asegurar el progreso de la carrera de ingeniería sin colisiones horarias.',
  },
  {
    id: 'HC-08',
    name: 'Reubicación por Clima Extremo',
    status: 'Activa',
    desc: 'Si ComfortScore cae por debajo del umbral, salidas al aire libre pasan a indoor.',
    howItWorks:
      'Evalúa el ComfortScore de Mar del Plata. Si hay sudestada, temporal o frío extremo bajo el umbral, actividades outdoor se invalidan o reubican a sede cubierta.',
    mathLogic: 'Si location.outdoor && ComfortScore < weather_extreme_threshold → Inválido.',
    purpose: 'Proteger la salud y el bienestar frente al clima adverso de la costa atlántica.',
    paramsKeys: [
      { key: 'weather_extreme_threshold', label: 'Umbral Clima Extremo', unit: 'ComfortScore', min: 0, max: 50, step: 5 },
    ],
  },
  {
    id: 'HC-09',
    name: 'Sueño Mínimo Absoluto Nocturno (6h)',
    status: 'Inviolable',
    desc: 'Mínimo fisiológico garantizado de descanso entre jornadas consecutivas.',
    howItWorks:
      'En cualquier noche de la semana, el intervalo entre el fin del último evento del día y el inicio del primer evento del día siguiente debe cumplir este piso fisiológico.',
    mathLogic: 'start_primer_evento(día N+1) - fin_ultimo_evento(día N) ≥ sleep_minimum_absolute.',
    purpose: 'Resguardar la salud cardiovascular y neurológica con un piso biológico innegociable.',
    paramsKeys: [
      { key: 'sleep_minimum_absolute', label: 'Piso Absoluto de Sueño', unit: 'minutos', min: 300, max: 480, step: 30 },
    ],
  },
  {
    id: 'HC-10',
    name: 'Prioridad Laboral Absoluta',
    status: 'Inviolable',
    desc: 'Turnos de trabajo nunca son invadidos por actividades flexibles.',
    howItWorks:
      'Los turnos laborales en Casino y Ferro tienen jerarquía máxima. Ninguna actividad social, de estudio o flexible puede superponerse.',
    mathLogic: 'Dominio de turnos fijado antes de instanciar variables flexibles.',
    purpose: 'Preservar el sustento económico y cumplir los deberes laborales.',
  },
  {
    id: 'HC-11',
    name: 'Veto Cognitivo Post-Ferro',
    status: 'Activa',
    desc: 'Sin estudio pesado ni parciales en las primeras horas tras salir de Ferro.',
    howItWorks:
      'Prohíbe agendar estudio de alta exigencia mental en los primeros minutos posteriores a la salida de Ferro San Juan.',
    mathLogic: 'Si cognitiveLoad ≥ 2: start_evento - fin_ferro ≥ cognitive_ban_post_ferro.',
    purpose: 'Evitar el desgaste improductivo y la frustración de intentar estudiar con agotamiento físico.',
    paramsKeys: [
      { key: 'cognitive_ban_post_ferro', label: 'Minutos de Veda Cognitiva', unit: 'minutos', min: 0, max: 180, step: 15 },
    ],
  },
];

interface SoftConstraintDef {
  id: string;
  name: string;
  key: string;
  defaultW: number;
  howItWorks: string;
  mathLogic: string;
  purpose: string;
  paramsKeys?: Array<{
    key: keyof ConstraintParams;
    label: string;
    unit: string;
    min: number;
    max: number;
    step?: number;
  }>;
}

const SOFT_CONSTRAINTS_LIST: SoftConstraintDef[] = [
  {
    id: 'SC-01',
    name: 'Bloques de Estudio Continuos (Deep Work)',
    key: 'w_sc01',
    defaultW: 8,
    howItWorks: 'Premia bloques de estudio concentrado de al menos la duración mínima establecida y penaliza la fragmentación.',
    mathLogic: 'Penalización = w · max(0, study_block_min_duration - duración) para eventos de estudio.',
    purpose: 'Fomentar el foco ininterrumpido en materias técnicas difíciles de ingeniería.',
    paramsKeys: [
      { key: 'study_block_min_duration', label: 'Duración Mínima de Estudio', unit: 'minutos', min: 60, max: 240, step: 15 },
    ],
  },
  {
    id: 'SC-02',
    name: 'Batch Cooking Semanal en Casa',
    key: 'w_sc02',
    defaultW: 5,
    howItWorks: 'Incentiva programar sesiones de preparación culinaria en el hogar para cocinar viandas semanales.',
    mathLogic: 'Penalización = w · max(0, batch_cooking_target - sesiones) + control de duración.',
    purpose: 'Asegurar comida sana y ahorrar tiempo y dinero durante los días más ocupados.',
    paramsKeys: [
      { key: 'batch_cooking_target', label: 'Sesiones Semanales', unit: 'sesiones', min: 1, max: 4, step: 1 },
      { key: 'batch_cooking_duration', label: 'Duración por Sesión', unit: 'minutos', min: 60, max: 240, step: 15 },
    ],
  },
  {
    id: 'SC-03',
    name: 'Metas de Horas Semanales de Amigos',
    key: 'w_sc03',
    defaultW: 6,
    howItWorks: 'Compara las horas compartidas con cada amigo (Juancito, Juani) contra sus metas declaradas en el modelo social.',
    mathLogic: 'Penalización cuadrática por déficit de horas compartidas con amigos cercanos.',
    purpose: 'Mantener vínculos afectivos fuertes sin que la rutina laboral los relegue.',
  },
  {
    id: 'SC-04',
    name: 'Fatiga Circadiana Acumulada',
    key: 'w_sc04',
    defaultW: 9,
    howItWorks: 'Modela la energía biológica hora a hora, penalizando tareas cognitivas o físicas en valles circadianos.',
    mathLogic: 'Penalización = w · Carga · FactorCircadiano(hora, deuda_sueno).',
    purpose: 'Alinear las tareas más difíciles con los momentos de máxima lucidez biológica.',
  },
  {
    id: 'SC-05',
    name: 'Carga Diaria Equilibrada',
    key: 'w_sc05',
    defaultW: 4,
    howItWorks: 'Calcula la varianza de carga total entre días para evitar jornadas de agotamiento extremo seguidas de colapso.',
    mathLogic: 'Penalización = w · Varianza(CargaCognitiva + CargaFísica entre los 7 días).',
    purpose: 'Lograr una distribución homogénea del esfuerzo durante toda la semana.',
  },
  {
    id: 'SC-06',
    name: 'Disponibilidad de Contactos',
    key: 'w_sc06',
    defaultW: 3,
    howItWorks: 'Prioriza ubicar salidas en las ventanas horarias donde los amigos tienen mayor disponibilidad.',
    mathLogic: 'Bonificación por coincidencia con franjas declaradas de disponibilidad social.',
    purpose: 'Facilitar la coordinación de mates y salidas sin cancelaciones.',
  },
  {
    id: 'SC-07',
    name: 'Horarios de Estudio Preferidos',
    key: 'w_sc07',
    defaultW: 6,
    howItWorks: 'Ubica materias complejas en las franjas horarias preferidas por Matu (tarde temprana y mañanas despejadas).',
    mathLogic: 'Bonificación por solapamiento con franjas horarias óptimas de concentración.',
    purpose: 'Aprovechar los momentos de mayor agilidad mental para avanzar en la carrera.',
  },
  {
    id: 'SC-08',
    name: 'Aprovechar Buen Clima para Social',
    key: 'w_sc08',
    defaultW: 7,
    howItWorks: 'Cuando el ComfortScore en Mar del Plata supera el umbral, bonifica ubicar salidas al aire libre en la costa.',
    mathLogic: 'Bonificación = w · (ComfortScore - comfort_opportunity_threshold) para eventos al aire libre.',
    purpose: 'Aprovechar los días soleados marplatenses para el bienestar anímico y social.',
    paramsKeys: [
      { key: 'comfort_opportunity_threshold', label: 'Umbral Buen Clima', unit: 'ComfortScore', min: 50, max: 90, step: 5 },
    ],
  },
  {
    id: 'SC-08b',
    name: 'Aprovechar Mal Clima en Casa (Indoor)',
    key: 'w_sc08b',
    defaultW: 4,
    howItWorks: 'En días fríos, con viento del sudeste o lluvia, canaliza el tiempo a estudio intensivo o cocina en casa.',
    mathLogic: 'Bonificación por actividades indoor en casa si ComfortScore < comfort_indoor_threshold.',
    purpose: 'Transformar días con clima adverso en jornadas de alta productividad hogareña.',
    paramsKeys: [
      { key: 'comfort_indoor_threshold', label: 'Umbral Mal Clima', unit: 'ComfortScore', min: 20, max: 60, step: 5 },
    ],
  },
  {
    id: 'SC-09',
    name: 'Minimizar Tiempo Muerto Improductivo',
    key: 'w_sc09',
    defaultW: 5,
    howItWorks: 'Detecta baches libres entre eventos que sean menores al umbral y los penaliza para compactar la agenda.',
    mathLogic: 'Penalización si 0 < gap_libre < dead_time_threshold.',
    purpose: 'Eliminar esperas vacías e inútiles entre actividades.',
    paramsKeys: [
      { key: 'dead_time_threshold', label: 'Umbral Tiempo Muerto', unit: 'minutos', min: 5, max: 45, step: 5 },
    ],
  },
  {
    id: 'SC-10',
    name: 'Secuenciación por Carga y Recuperación',
    key: 'w_sc10',
    defaultW: 8,
    howItWorks: 'Exige que tras una actividad de alta exigencia mental o física haya un espacio de recuperación.',
    mathLogic: 'Penaliza eventos consecutivos con carga ≥ 2 sin intervalo de descanso intermedio.',
    purpose: 'Preservar la energía y prevenir la sobrecarga cognitiva continua.',
  },
  {
    id: 'SC-11',
    name: 'Comidas en Jornadas Largas (> 5h)',
    key: 'w_sc11',
    defaultW: 7,
    howItWorks: 'Verifica que en períodos activos continuos se reserve al menos un intervalo de comida.',
    mathLogic: 'Penaliza bloques continuos activos > long_session_no_meal_threshold sin comida.',
    purpose: 'Asegurar una nutrición adecuada sin saltearse comidas por trabajo o estudio.',
    paramsKeys: [
      { key: 'long_session_no_meal_threshold', label: 'Máximo Sin Comida', unit: 'minutos', min: 120, max: 480, step: 30 },
    ],
  },
  {
    id: 'SC-12',
    name: 'Tiempo Máximo de Viaje Diario Acumulado',
    key: 'w_sc12',
    defaultW: 4,
    howItWorks: 'Suma el tiempo de todos los desplazamientos del día y penaliza si supera el límite deseado.',
    mathLogic: 'Penaliza si Σ tiempo_viaje_diario > travel_time_max_daily.',
    purpose: 'Evitar pasar una fracción excesiva del día viajando en colectivo por Mar del Plata.',
    paramsKeys: [
      { key: 'travel_time_max_daily', label: 'Tope Viaje Diario', unit: 'minutos', min: 30, max: 180, step: 15 },
    ],
  },
  {
    id: 'SC-13',
    name: 'Presupuesto Semanal en Pesos (ARS)',
    key: 'w_sc13',
    defaultW: 3,
    howItWorks: 'Suma el gasto estimado de salidas y traslados y penaliza el exceso presupuestario.',
    mathLogic: 'Penaliza si Σ costo_estimado_ARS > presupuesto_semanal.',
    purpose: 'Mantener control financiero y cuidar el presupuesto mensual.',
  },
  {
    id: 'SC-14',
    name: 'Límite de Cambios de Contexto por Día',
    key: 'w_sc14',
    defaultW: 6,
    howItWorks: 'Cuenta cuántas transiciones de categoría ocurren en el mismo día para evitar dispersión mental.',
    mathLogic: 'Penaliza si transiciones_de_categoría > context_switches_max.',
    purpose: 'Reducir el desgaste mental producido por alternar constantemente entre modos de atención.',
    paramsKeys: [
      { key: 'context_switches_max', label: 'Máximo Cambios de Contexto', unit: 'transiciones', min: 2, max: 8, step: 1 },
    ],
  },
  {
    id: 'SC-15',
    name: 'Slots de Serendipia Social Semanal',
    key: 'w_sc15',
    defaultW: 5,
    howItWorks: 'Reserva espacios libres abiertos para imprevistos placenteros y conocer gente nueva.',
    mathLogic: 'Bonificación por mantener al menos serendipity_slots_per_week slots abiertos.',
    purpose: 'Mantener la vida social viva y abierta a oportunidades espontáneas.',
    paramsKeys: [
      { key: 'serendipity_slots_per_week', label: 'Slots Semanales de Serendipia', unit: 'slots', min: 0, max: 5, step: 1 },
    ],
  },
  {
    id: 'SC-16',
    name: 'Equilibrio Vínculo Delicado (Lau)',
    key: 'w_sc16',
    defaultW: 0,
    howItWorks: 'Limita el número de encuentros semanales con vínculos delicados para preservar la estabilidad afectiva.',
    mathLogic: 'Penaliza si encuentros_semanales > sensitive_contact_weekly_limit.',
    purpose: 'Cuidar la paz mental y evitar recaídas emocionales manteniendo límites saludables.',
    paramsKeys: [
      { key: 'sensitive_contact_weekly_limit', label: 'Límite Semanal de Encuentros', unit: 'encuentros', min: 1, max: 7, step: 1 },
    ],
  },
];

/**
 * Control numérico reutilizable con botones de incremento/decremento e input directo.
 */
const InlineNumberControl: React.FC<{
  paramKey: keyof ConstraintParams;
  label: string;
  unit: string;
  value?: number;
  min: number;
  max: number;
  step?: number;
  onChange: (key: keyof ConstraintParams, val: number) => void;
}> = ({ paramKey, label, unit, value, min, max, step = 1, onChange }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-xs">
      <div className="flex flex-col">
        <span className="font-semibold text-slate-300">{label}</span>
        <span className="text-[10px] text-slate-500">
          Rango: [{min} – {max}] {unit}
        </span>
      </div>
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onChange(paramKey, Math.max(min, (value ?? min) - step))}
          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs transition-colors"
          title="Decrementar"
        >
          -
        </button>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? min}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value);
            if (!isNaN(parsed)) {
              onChange(paramKey, Math.min(max, Math.max(min, parsed)));
            }
          }}
          className="w-16 text-center font-mono font-bold bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-indigo-300 focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(paramKey, Math.min(max, (value ?? min) + step))}
          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs transition-colors"
          title="Incrementar"
        >
          +
        </button>
        <span className="text-[11px] text-slate-400 min-w-[35px]">{unit}</span>
      </div>
    </div>
  );
};

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
  const [hoveredConstraintId, setHoveredConstraintId] = useState<string | null>(null);

  const handleParamNumberChange = (key: keyof ConstraintParams, val: number) => {
    onParamsChange({
      ...params,
      [key]: val,
    });
  };

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
          <div>
            <h2 className="text-lg font-bold tracking-tight">Panel de Control de Restricciones</h2>
            <p className="text-xs text-slate-400">Pasa el mouse sobre cualquier restricción para ver su explicación matemática</p>
          </div>
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
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('params')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'params'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Edit2 className="w-3.5 h-3.5" />
          21 Parámetros Editables (P9)
        </button>
        <button
          onClick={() => setActiveTab('hard')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'hard'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Hard Constraints & GHC (11)
        </button>
        <button
          onClick={() => setActiveTab('soft')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'soft'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Soft Constraints & Parámetros (17)
        </button>
        <button
          onClick={() => setActiveTab('meta')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'meta'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Meta-Sliders
        </button>
      </div>

      {/* Tab 1: 21 Inline Editable Parameters (Principio P9) */}
      {activeTab === 'params' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Ningún número está hardcodeado en el motor CSP. Pasa el cursor para ver la explicación o edita inline:
            </span>
            <span className="font-mono text-indigo-400">Total: 21 parámetros</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {ALL_PARAMS_META.map((meta) => {
              const currentValue = params[meta.key];
              const isEditing = editingKey === meta.key;
              const isHovered = hoveredConstraintId === meta.key;

              return (
                <div
                  key={meta.key}
                  onMouseEnter={() => setHoveredConstraintId(meta.key)}
                  onMouseLeave={() => setHoveredConstraintId(null)}
                  className={`p-3.5 bg-slate-950/60 border rounded-xl flex flex-col justify-between gap-2.5 transition-all ${
                    isHovered ? 'border-indigo-500/80 bg-slate-950/90 shadow-lg' : 'border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-200">{meta.label}</span>
                        <Info className="w-3.5 h-3.5 text-indigo-400 opacity-60" />
                      </div>
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

                  {/* Hover Explanation Box */}
                  {isHovered && (
                    <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-lg flex flex-col gap-1 text-[11px] text-indigo-200 animate-fadeIn">
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-indigo-300">ℹ️ Cómo funciona:</span>
                        <span>{meta.howItWorks}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-indigo-300">📐 Lógica / Fórmula:</span>
                        <span className="font-mono text-indigo-200 text-[10px] bg-slate-900/60 px-1 py-0.5 rounded">{meta.mathLogic}</span>
                      </div>
                    </div>
                  )}

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

      {/* Tab 2: Hard Constraints & GHC (Explicación al hover + Edición directa de parámetros) */}
      {activeTab === 'hard' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Pasa el cursor sobre cualquier Hard Constraint para ver su funcionamiento y ajusta sus parámetros numéricos directamente:
            </span>
            <span className="font-mono text-rose-400 font-bold">11 Restricciones Inviolables</span>
          </div>

          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            {HARD_CONSTRAINTS_LIST.map((hc) => {
              const isHovered = hoveredConstraintId === hc.id;

              return (
                <div
                  key={hc.id}
                  onMouseEnter={() => setHoveredConstraintId(hc.id)}
                  onMouseLeave={() => setHoveredConstraintId(null)}
                  className={`p-4 bg-slate-950/60 border rounded-xl flex flex-col gap-3 transition-all ${
                    isHovered
                      ? 'border-rose-500/80 bg-slate-950/90 shadow-xl'
                      : 'border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/40">
                          {hc.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-200">{hc.name}</h4>
                        <Info className="w-3.5 h-3.5 text-rose-400/70" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{hc.desc}</p>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border flex-shrink-0 ${
                        hc.status === 'Graduada'
                          ? 'bg-amber-950 text-amber-300 border-amber-800/40'
                          : 'bg-rose-950 text-rose-300 border-rose-800/40'
                      }`}
                    >
                      {hc.status}
                    </span>
                  </div>

                  {/* Explicación Detallada al Hover */}
                  {isHovered && (
                    <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl flex flex-col gap-2 text-xs text-rose-200 animate-fadeIn">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-rose-300 flex-shrink-0">ℹ️ Cómo funciona:</span>
                        <span>{hc.howItWorks}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-rose-300 flex-shrink-0">📐 Lógica / Fórmula:</span>
                        <span className="font-mono text-rose-200 text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-rose-900/50">
                          {hc.mathLogic}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-rose-300 flex-shrink-0">🎯 Propósito:</span>
                        <span>{hc.purpose}</span>
                      </div>
                    </div>
                  )}

                  {/* Parámetros Numéricos Editables de la Restricción */}
                  {hc.paramsKeys && hc.paramsKeys.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Valores numéricos de esta restricción:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {hc.paramsKeys.map((p) => (
                          <InlineNumberControl
                            key={p.key}
                            paramKey={p.key}
                            label={p.label}
                            unit={p.unit}
                            value={params[p.key]}
                            min={p.min}
                            max={p.max}
                            step={p.step}
                            onChange={handleParamNumberChange}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Soft Constraints (Explicación al hover + Edición de pesos Y parámetros numéricos) */}
      {activeTab === 'soft' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Pasa el cursor sobre cualquier Soft Constraint para ver su fórmula y ajusta tanto su peso (w) como sus valores numéricos:
            </span>
            <span className="font-mono text-indigo-400 font-bold">17 Soft Constraints</span>
          </div>

          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            {SOFT_CONSTRAINTS_LIST.map((sc) => {
              const currentWeight = weights[sc.key] ?? sc.defaultW;
              const isHovered = hoveredConstraintId === sc.id;

              return (
                <div
                  key={sc.id}
                  onMouseEnter={() => setHoveredConstraintId(sc.id)}
                  onMouseLeave={() => setHoveredConstraintId(null)}
                  className={`p-4 bg-slate-950/60 border rounded-xl flex flex-col gap-3 transition-all ${
                    isHovered
                      ? 'border-indigo-500/80 bg-slate-950/90 shadow-xl'
                      : 'border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
                          {sc.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-200">{sc.name}</h4>
                        <Info className="w-3.5 h-3.5 text-indigo-400/70" />
                      </div>
                    </div>

                    <span className="font-mono font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-2.5 py-1 rounded text-xs flex-shrink-0">
                      Peso w = {currentWeight}
                    </span>
                  </div>

                  {/* Weight Slider */}
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">Peso base:</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={currentWeight}
                      onChange={(e) => onWeightChange(sc.key, Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-xs font-mono font-bold text-slate-300 w-6 text-right">
                      {currentWeight}
                    </span>
                  </div>

                  {/* Explicación Detallada al Hover */}
                  {isHovered && (
                    <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex flex-col gap-2 text-xs text-indigo-200 animate-fadeIn">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-indigo-300 flex-shrink-0">ℹ️ Cómo funciona:</span>
                        <span>{sc.howItWorks}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-indigo-300 flex-shrink-0">📐 Lógica / Fórmula:</span>
                        <span className="font-mono text-indigo-200 text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-indigo-900/50">
                          {sc.mathLogic}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-indigo-300 flex-shrink-0">🎯 Propósito:</span>
                        <span>{sc.purpose}</span>
                      </div>
                    </div>
                  )}

                  {/* Parámetros Numéricos Editables de la Soft Constraint */}
                  {sc.paramsKeys && sc.paramsKeys.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Valores numéricos que rigen esta restricción:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sc.paramsKeys.map((p) => (
                          <InlineNumberControl
                            key={p.key}
                            paramKey={p.key}
                            label={p.label}
                            unit={p.unit}
                            value={params[p.key]}
                            min={p.min}
                            max={p.max}
                            step={p.step}
                            onChange={handleParamNumberChange}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Meta-Sliders */}
      {activeTab === 'meta' && (
        <MetaSliders values={metaSliders} onChange={onMetaSlidersChange} />
      )}
    </div>
  );
};
