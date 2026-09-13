# Guía de Implementación Exhaustiva: MiMesa Scheduler v1.1

**Estado:** 📘 Especificación Técnica Paso a Paso para Implementación  
**Fuente Única de Verdad:** [Master Spec.txt](file:///c:/Users/Matu/Documents/Proyectos%20miscelaneos/scheduler/Master%20Spec.txt) v1.1  
**Stack Tecnológico:** Next.js 16 (App Router), React 19, TypeScript estricto, Tailwind CSS, LocalStorage (Local-First), Supabase (PostgreSQL + Realtime), Open-Meteo API, Google Gemini Flash.  
**Criterio de Calidad:** Determinismo matemático absoluto en el solver CSP (< 50ms para 30 eventos offline), separación total entre cálculo CSP y NLU/LLM, privacidad estricta con `localOnlyFields`, representación espacial proporcional en el calendario, lock universal por evento y editabilidad de todos los parámetros numéricos (Principio P9).

---

## Índice de Fases de Implementación

1. [Marco Teórico y Principios de Diseño](#marco-teórico-y-principios-de-diseño)
2. [Fase 0: Setup, Tipado del Dominio y Formalización de Restricciones](#fase-0-setup-tipado-del-dominio-y-formalización-de-restricciones)
   - [Tarea 0.1: Inicialización del Repositorio y Arquitectura de Carpetas](#tarea-01-inicialización-del-repositorio-y-arquitectura-de-carpetas)
   - [Tarea 0.2: Tipado Estricto Integral (`types.ts`)](#tarea-02-tipado-estricto-integral-typests)
   - [Tarea 0.3: Parámetros Editables del Sistema (`params.ts`)](#tarea-03-parámetros-editables-del-sistema-paramsts)
   - [Tarea 0.4: Matriz de Tiempos de Traslado de Mar del Plata (`travelMatrix.ts`)](#tarea-04-matriz-de-tiempos-de-traslado-de-mar-del-plata-travelmatrixts)
   - [Tarea 0.5: Esqueleto de Restricciones y Suite de Pruebas de GHC-01](#tarea-05-esqueleto-de-restricciones-y-suite-de-pruebas-de-ghc-01)
3. [Fase 1: El Motor CSP (Constraint Satisfaction Problem) Core](#fase-1-el-motor-csp-constraint-satisfaction-problem-core)
   - [Tarea 1.1: Particionamiento y Representación Temporal (`partitioner.ts`)](#tarea-11-particionamiento-y-representación-temporal-partitionerts)
   - [Tarea 1.2: Propagación de Dominios AC-3 y Forward Checking (`propagator.ts`)](#tarea-12-propagación-de-dominios-ac-3-y-forward-checking-propagatorts)
   - [Tarea 1.3: Catálogo Completo de las 10 Hard Constraints (HC-01 a HC-11)](#tarea-13-catálogo-completo-de-las-10-hard-constraints-hc-01-a-hc-11)
   - [Tarea 1.4: Solver de Factibilidad Base (Backtracking + Forward Checking)](#tarea-14-solver-de-factibilidad-base-backtracking--forward-checking)
   - [Tarea 1.5: La Función de Penalización Unificada y las 16 Soft Constraints (`scorer.ts`)](#tarea-15-la-función-de-penalización-unificada-y-las-16-soft-constraints-scorerts)
   - [Tarea 1.6: Optimización Local Hill Climbing con Trade-offs de GHC](#tarea-16-optimización-local-hill-climbing-con-trade-offs-de-ghc)
   - [Tarea 1.7: Módulo de Post-Procesamiento (`postProcessor.ts`)](#tarea-17-módulo-de-post-procesamiento-postprocessorts)
   - [Tarea 1.8: Generador de `ConstraintTrace` y Pipeline Unificado (`solver.ts`)](#tarea-18-generador-de-constrainttrace-y-pipeline-unificado-solverts)
4. [Fase 2: Recurrencia, Persistencia Local-First y Privacidad](#fase-2-recurrencia-persistencia-local-first-y-privacidad)
   - [Tarea 2.1: Expansión de Recurrencia y Gestión de Excepciones (`recurrence.ts`)](#tarea-21-expansión-de-recurrencia-y-gestión-de-excepciones-recurrencets)
   - [Tarea 2.2: Repositorio Local-First con Esquema Tipado (`LocalStorageStore.ts`)](#tarea-22-repositorio-local-first-con-esquema-tipado-localstoragestorets)
   - [Tarea 2.3: Sincronización Supabase y Filtro de Privacidad Inquebrantable (`syncEngine.ts`)](#tarea-23-sincronización-supabase-y-filtro-de-privacidad-inquebrantable-syncenginets)
   - [Tarea 2.4: Exportación Segura a Calendarios Externos (`calendarExport.ts`)](#tarea-24-exportación-segura-a-calendarios-externos-calendarexportts)
5. [Fase 3: Sistema Meteorológico, Estrategia Indoor y Modelo Social](#fase-3-sistema-meteorológico-estrategia-indoor-y-modelo-social)
   - [Tarea 3.1: Cliente Open-Meteo y Caché Local con TTL (`weatherService.ts`)](#tarea-31-cliente-open-meteo-y-caché-local-con-ttl-weatherservicets)
   - [Tarea 3.2: Motor de Cálculo de `ComfortScore`](#tarea-32-motor-de-cálculo-de-comfortscore)
   - [Tarea 3.3: Estrategia Climática y Sensibilidad por Actividad](#tarea-33-estrategia-climática-y-sensibilidad-por-actividad)
   - [Tarea 3.4: Modelo Social en Tres Capas, Serendipia y Logística del Hogar](#tarea-34-modelo-social-en-tres-capas-serendipia-y-logística-del-hogar)
6. [Fase 4: UX Core, Calendario Espacial, Meta-Sliders y DiffViewer](#fase-4-ux-core-calendario-espacial-meta-sliders-y-diffviewer)
   - [Tarea 4.1: Calendario Proporcional Diaria/Semanal y Lock Universal (`CalendarGrid.tsx`)](#tarea-41-calendario-proporcional-diariasemanal-y-lock-universal-calendargridtsx)
   - [Tarea 4.2: Sesión de Planificación Semanal en 5 Pasos (`WeeklyPlanningSession.tsx`)](#tarea-42-sesión-de-planificación-semanal-en-5-pasos-weeklyplanningsessiontsx)
   - [Tarea 4.3: DiffViewerModal con Tratamiento Especial de GHC (`DiffViewerModal.tsx`)](#tarea-43-diffviewermodal-con-tratamiento-especial-de-ghc-diffviewermodaltsx)
   - [Tarea 4.4: Meta-Sliders y Multiplicadores Reactivos (`MetaSliders.tsx`, `metaSliders.ts`)](#tarea-44-meta-sliders-y-multiplicadores-reactivos-metasliderstsx-metaslidersts)
   - [Tarea 4.5: Panel de Restricciones Configurable Inline (`ConstraintPanel.tsx`)](#tarea-45-panel-de-restricciones-configurable-inline-constraintpaneltsx)
   - [Tarea 4.6: Widget de Score, Anillo de Color y Drill-Down (`ScoreWidget.tsx`)](#tarea-46-widget-de-score-anillo-de-color-y-drill-down-scorewidgettsx)
7. [Fase 5: Features de Producto, LLM y Analíticas](#fase-5-features-de-producto-llm-y-analíticas)
   - [Tarea 5.1: Integración LLM Híbrida NLU / OCR (`geminiClient.ts`)](#tarea-51-integración-llm-híbrida-nlu--ocr-geminiclientts)
   - [Tarea 5.2: Modo "¿Qué Hago Ahora?" con Estrategia Climática (`WhatShouldIDoNow.tsx`)](#tarea-52-modo-qué-hago-ahora-con-estrategia-climática-whatshouldidonowtsx)
   - [Tarea 5.3: Fatigue Tracker de Turno Nocturno](#tarea-53-fatigue-tracker-de-turno-nocturno)
   - [Tarea 5.4: Retrospectiva Semanal (`RetrospectiveView.tsx`)](#tarea-54-retrospectiva-semanal-retrospectiveviewtsx)
   - [Tarea 5.5: Motor de Aprendizaje de Patrones No Invasivo (`patternLearning.ts`)](#tarea-55-motor-de-aprendizaje-de-patrones-no-invasivo-patternlearningts)
   - [Tarea 5.6: Modo Simulación "Y si..." (`SimulationMode.tsx`)](#tarea-56-modo-simulación-y-si-simulationmodetsx)
   - [Tarea 5.7: Modelo Económico Estimado en ARS](#tarea-57-modelo-económico-estimado-en-ars)
   - [Tarea 5.8: Arquitectura de Notificaciones y Throttling](#tarea-58-arquitectura-de-notificaciones-y-throttling)
   - [Tarea 5.9: Flujo de Onboarding en 5 Pantallas](#tarea-59-flujo-de-onboarding-en-5-pantallas)

---

## Marco Teórico y Principios de Diseño

### El Contexto Operativo de Matu
1. **Hogar:** Convive con sus padres en Mar del Plata. Privacidad limitada; no apto para visitas casuales o salidas con personas nuevas. Sí apto para estudio profundo, batch cooking, descanso y visitas puntuales de amigos muy íntimos (Juani a 10 min, Juancito a 30 min). **El hogar jamás se propone como fallback social general**.
2. **Trabajo Dual:**
   - **Sucursal Rambla Casino:** Turnos diurnos (ej. 10:00 a 16:00). Traslado de 30 minutos por tramo (`travel_buffer_casino: 30`).
   - **Sucursal Ferro San Juan:** Turnos nocturnos con cierre de madrugada (ej. 17:00 a 01:00 AM). Traslado de 45 minutos por tramo (`travel_buffer_ferro: 45`). Exige ventana de sueño flotante de 8 horas continuas garantizadas (`sleep_target_post_ferro: 480`). Bloqueo de actividades de alta demanda cognitiva (`cognitiveLoad >= 2`) durante los primeros 90 minutos post-llegada (`cognitive_ban_post_ferro: 90`). Rastro de fatiga acumulada ante turnos consecutivos sin sueño reparador.
3. **Universidad (4 Materias fijas del cuatrimestre):**
   - *Redes de Computadoras* (Redes, carga cognitiva Alta)
   - *Análisis y Diseño de Sistemas* (AyDS, carga cognitiva Alta)
   - *Administración Empresarial en la Economía del Conocimiento* (AEEC, carga cognitiva Media)
   - *Calidad de Software* (CalSoft, carga cognitiva Alta)
   - Todas requieren bloques ininterrumpidos de estudio $\ge 120$ minutos (`study_block_min_duration: 120`).
4. **Vínculos:** Juancito (meta: 5h/sem), Juani (meta: 3h/sem), Lau (vínculo delicado, sin límite rígido; SC-16 opcional con penalización suave si supera 2 encuentros/sem; default inactiva con peso 0). Espacio abierto para nuevas conexiones mediante slots de serendipia.
5. **Consumo de Cannabis y Llegada:** Buffer post-consumo (`GHC-01`) con objetivo de 4 horas (`cannabis_buffer_target: 240`) y piso absoluto de 2 horas (`cannabis_buffer_floor: 120`). Penalización cuadrática en el intervalo $[120, 240)$ e infinita si $< 120$.
6. **Microclima de Mar del Plata:** Viento sudeste (SE) adverso $> 35$ km/h. La estrategia climática protege buen clima para social/outdoor (SC-08) y canaliza mal clima a estudio/cocina en casa (SC-08b), pero **nunca bloquea un plan social concreto en mal clima**.

### Los 9 Principios No Negociables
- **P1: Tu tiempo es tuyo.** Los horarios de contactos informan, jamás bloquean tu agenda.
- **P2: Determinismo sobre probabilismo.** Las reglas duras y matemáticas son exactas (240 min son 240 min).
- **P3: Local-first, cloud-enhanced.** El CSP corre 100% offline en TypeScript en $< 50\text{ms}$. La nube sincroniza pero no condiciona.
- **P4: Información sensible bajo control.** Campos privados (`cannabis_consumed`, notas personales, alias) jamás salen del dispositivo ni se exportan a APIs externas.
- **P5: Sugerir, nunca imponer.** El solver propone en el `DiffViewerModal`; el usuario tiene la última palabra.
- **P6: Calendario vivido, no administrado.** Se optimiza bienestar bio-psico-social: energía, sueño, ritmo y vínculos.
- **P7: El clima es una oportunidad.** Se aprovecha activamente el buen clima costero.
- **P8: Transparencia total.** Cada cambio tiene un `ConstraintTrace` con causa, impacto y alternativas.
- **P9: Todo número es configurable.** Ningún valor numérico está hardcodeado. Los 21 parámetros se definen en `params.ts` y son editables inline.

---

## Fase 0: Setup, Tipado del Dominio y Formalización de Restricciones

### Tarea 0.1: Inicialización del Repositorio y Arquitectura de Carpetas
- **Objetivo:** Inicializar la estructura base del proyecto con Next.js 16 (App Router), React 19, TypeScript estricto y Tailwind CSS.
- **Estructura exacta a construir:**
  ```text
  src/
  ├── lib/
  │   └── scheduler/
  │       ├── types.ts                         # Todas las interfaces y tipos del dominio
  │       ├── params.ts                        # Interfaz ConstraintParams y objeto defaultParams
  │       ├── travelMatrix.ts                  # Matriz de tiempos de traslado en MDP
  │       ├── metaSliders.ts                   # Multiplicadores de meta-sliders y presets
  │       ├── hardConstraints/                # 10 archivos de HCs
  │       │   ├── HC01_noOverlap.ts
  │       │   ├── HC02_lockedEvents.ts
  │       │   ├── HC03_sleepPostFerro.ts
  │       │   ├── HC05_workTravel.ts
  │       │   ├── HC05b_travelViability.ts
  │       │   ├── HC07_universitySchedule.ts
  │       │   ├── HC08_weatherRelocation.ts
  │       │   ├── HC09_minimumSleep.ts
  │       │   ├── HC10_noWorkOverlap.ts
  │       │   └── HC11_cognitiveBanPostFerro.ts
  │       ├── graduatedHardConstraints/        # 1 GHC
  │       │   └── GHC01_cannabisBuffer.ts
  │       ├── softConstraints/                 # 16 archivos de SCs
  │       │   ├── SC01_studyBlocks.ts
  │       │   ├── SC02_batchCooking.ts
  │       │   ├── SC03_socialGoals.ts
  │       │   ├── SC04_circadianFatigue.ts
  │       │   ├── SC05_evenDistribution.ts
  │       │   ├── SC06_contactAvailability.ts
  │       │   ├── SC07_timePreferences.ts
  │       │   ├── SC08_goodWeatherForSocial.ts
  │       │   ├── SC08b_badWeatherForProductivity.ts
  │       │   ├── SC09_noDeadTime.ts
  │       │   ├── SC10_energyEconomy.ts
  │       │   ├── SC11_mealsAndRest.ts
  │       │   ├── SC12_totalTravelTime.ts
  │       │   ├── SC13_weeklyBudget.ts
  │       │   ├── SC14_contextSwitching.ts
  │       │   ├── SC15_serendipitySlots.ts
  │       │   └── SC16_sensitiveContactBalance.ts
  │       ├── partitioner.ts                   # Particionado fixed vs movable y discretización de slots
  │       ├── propagator.ts                    # AC-3 y Forward Checking
  │       ├── scorer.ts                        # Función de penalización unificada y cálculo de Score
  │       ├── postProcessor.ts                 # Inserción de buffers y fusión de gaps
  │       ├── constraintTrace.ts               # Construcción de explicaciones para DiffViewer
  │       └── solver.ts                        # Pipeline CSP completo
  ├── components/
  │   ├── CalendarGrid.tsx                     # Calendario espacial proporcional (diaria/semanal)
  │   ├── DiffViewerModal.tsx                  # Modal con revisión de cambios y advertencia GHC
  │   ├── WeeklyPlanningSession.tsx            # Wizard de domingo en 5 pasos
  │   ├── ConstraintPanel.tsx                  # Panel editable inline para los 21 parámetros
  │   ├── MetaSliders.tsx                      # 3 sliders globales con presets
  │   ├── ScoreWidget.tsx                      # Anillo de color y drill-down
  │   ├── WhatShouldIDoNow.tsx                 # Modal "¿Qué hago ahora?"
  │   ├── RetrospectiveView.tsx                # Análisis retrospectivo semanal
  │   └── SimulationMode.tsx                   # Entorno de pruebas "Y si..."
  └── __tests__/
      ├── HC03_sleepPostFerro.test.ts
      ├── GHC01_cannabisBuffer.test.ts
      ├── SC08_goodWeather.test.ts
      ├── SC08b_badWeather.test.ts
      ├── metaSliders.test.ts
      └── solver.integration.test.ts
  ```
- **Done When:** El proyecto compila limpiamente (`npm run build` o `npx tsc --noEmit`) sin advertencias ni rutas rotas.

---

### Tarea 0.2: Tipado Estricto Integral (`types.ts`)
- **Archivo:** `src/lib/scheduler/types.ts`
- **Contenido obligatorio y firmas:**
  ```typescript
  export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo

  export type LocationType =
    | 'casa'
    | 'rambla_casino'
    | 'ferro_san_juan'
    | 'facultad'
    | 'exterior_rambla'
    | 'exterior_plaza'
    | 'cafe_guemes'
    | 'paseo_aldrey'
    | 'gym'
    | 'depto_contacto'
    | 'custom';

  export interface Location {
    type: LocationType;
    name: string;
    address?: string;
    lat?: number;
    lon?: number;
  }

  export type EventCategory =
    | 'trabajo'
    | 'cursada'
    | 'estudio'
    | 'social'
    | 'gym'
    | 'batch_cooking'
    | 'comida'
    | 'sueno'
    | 'traslado'
    | 'tramites'
    | 'desarrollo_personal'
    | 'recuperacion'
    | 'buffer_post_consumo'
    | 'social_opportunity'
    | 'preparacion_buffer'
    | 'otro';

  export type WeatherSensitivity = 'none' | 'transit_only' | 'outdoor_full';

  export interface EventDependency {
    targetEventId: string;
    type: 'after' | 'same_day' | 'requires_completed';
    minGapMinutes?: number;
    maxGapMinutes?: number;
  }

  export interface Event {
    id: string;
    name: string;
    category: EventCategory;
    emoji?: string;

    // Tiempo
    start: Date;              // UTC interno; representación en ART (UTC-3)
    duration: number;         // Minutos, siempre múltiplos de 15
    is_locked: boolean;       // Controlado por toggle UI explícito

    // Recurrencia
    recurrenceId?: string;
    isRecurrenceException?: boolean;
    exceptionFor?: Date;

    // Ubicación y clima
    location: Location;
    weatherSensitivity: WeatherSensitivity;

    // Social
    contacts?: string[];
    isOpenSocialSlot?: boolean;

    // Carga energética
    cognitiveLoad: 0 | 1 | 2 | 3;
    physicalLoad: 0 | 1 | 2 | 3;

    // Economía
    estimatedCostARS?: number;
    costCategory?: 'free' | 'cheap' | 'moderate' | 'expensive';

    // Privacidad / Local-only
    is_sensitive: boolean;
    cannabis_consumed?: boolean;   // Activa GHC-01
    displayAlias?: string;         // Alias público para iCal / sync
    notesEncrypted?: string;

    // Flags de post-procesamiento del solver
    isAutoGenerated?: boolean;
    autoGeneratedReason?: string;
    isRecoverySlot?: boolean;
    isPreparationBuffer?: boolean;

    // Dependencias
    dependsOn?: EventDependency[];

    // Sync
    createdAt: Date;
    updatedAt: Date;
    deviceId: string;
    localVersion: number;
    syncStatus: 'synced' | 'pending' | 'conflict';
  }

  export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

  export interface RecurrenceException {
    date: Date;
    type: 'skip' | 'reschedule' | 'modify';
    override?: Partial<Event>;
    note?: string;
  }

  export interface RecurrencePattern {
    id: string;
    frequency: RecurrenceFrequency;
    daysOfWeek?: DayOfWeek[];
    startDate: Date;
    until?: Date;
    occurrenceCount?: number;
    exceptions: RecurrenceException[];
  }

  export type CardinalDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

  export interface WeatherCondition {
    timestamp: Date;
    precipitationProbability: number;   // 0.0 – 1.0
    precipitationMm: number;
    windSpeedKmh: number;
    windDirection: CardinalDirection;
    temperatureCelsius: number;
    feelsLikeCelsius: number;
    comfortScore: number;               // 0 – 100 computado
  }

  export interface Contact {
    id: string;
    name: string;
    alias?: string;
    relationshipType: 'amigo_cercano' | 'facultad' | 'trabajo' | 'conocido' | 'vinculo_delicado';
    weeklyHoursGoal?: number;           // Para SC-03
    busySlots?: { dayOfWeek: DayOfWeek; start: string; end: string }[];
    hasPrivateApartment?: boolean;      // Para HC-08 fallback
    isSensitive?: boolean;              // Para SC-16 (Lau)
    notes?: string;
  }

  export interface TimeSlot {
    start: Date;
    end: Date;
  }

  export interface ConstraintTrace {
    eventId: string;
    changeType: 'moved' | 'resized' | 'relocated' | 'auto_inserted' | 'removed';
    primaryTrigger: {
      constraintId: string;     // "GHC-01", "SC-08", "HC-03", etc.
      constraintName: string;
      explanation: string;      // En lenguaje natural
      severity: 'hard' | 'graduated' | 'soft';
    };
    secondaryTriggers?: { constraintId: string; explanation: string }[];
    scoreImpact: number;
    previousSlot?: TimeSlot;
    newSlot?: TimeSlot;
    ghcViolationAmount?: number; // Minutos faltantes para el target si es GHC
    alternativesConsidered?: { slot: TimeSlot; scoreIfChosen: number; whyRejected: string }[];
  }

  export interface SolverInput {
    schedule: Event[];
    weather: WeatherCondition[];
    params: import('./params').ConstraintParams;
    weights: Record<string, number>;
    contacts: Contact[];
  }

  export interface SolverResult {
    feasible: boolean;
    violations?: string[];
    schedule: Event[];
    score: number;
    scoreBreakdown: {
      hardViolationsCount: number;
      ghcPenalties: Record<string, number>;
      softPenalties: Record<string, number>;
    };
    constraintTrace: ConstraintTrace[];
    solvingTimeMs: number;
  }
  ```
- **Done When:** `types.ts` exporta todos los tipos requeridos y compila sin errores.

---

### Tarea 0.3: Parámetros Editables del Sistema (`params.ts`)
- **Archivo:** `src/lib/scheduler/params.ts`
- **Regla P9:** Absolutamente ningún valor numérico de restricciones debe estar hardcodeado en la lógica del algoritmo.
- **Implementación obligatoria de los 21 parámetros:**
  ```typescript
  export interface ConstraintParams {
    // Tier 2: GHC-01
    cannabis_buffer_target: number;         // default: 240 min, min: 60, max: 480
    cannabis_buffer_floor: number;          // default: 120 min, min: 30, max: target - 30
    w_ghc01: number;                        // default: 8, min: 0, max: 10

    // Tier 1: HC-03 / HC-09
    sleep_target_post_ferro: number;        // default: 480 min, min: 360, max: 600
    sleep_minimum_absolute: number;         // default: 360 min, min: 300, max: sleep_target_post_ferro

    // Tier 1: HC-05
    travel_buffer_casino: number;           // default: 30 min, min: 10, max: 90
    travel_buffer_ferro: number;            // default: 45 min, min: 15, max: 90

    // Tier 1: HC-11
    cognitive_ban_post_ferro: number;       // default: 90 min, min: 0, max: 180 (0 = desactivada)

    // Tier 1: HC-08
    weather_extreme_threshold: number;      // default: 20 (ComfortScore), min: 0, max: 50

    // Tier 3: Soft Constraints
    study_block_min_duration: number;       // default: 120 min, min: 60, max: 240 (SC-01)
    batch_cooking_target: number;           // default: 2 sesiones/sem, min: 1, max: 4 (SC-02)
    batch_cooking_duration: number;         // default: 120 min, min: 60, max: 240 (SC-02)
    dead_time_threshold: number;            // default: 20 min, min: 5, max: 45 (SC-09)
    context_switches_max: number;           // default: 4 cambios/día, min: 2, max: 8 (SC-14)
    serendipity_slots_per_week: number;     // default: 2 slots/sem, min: 0, max: 5 (SC-15)
    travel_time_max_daily: number;          // default: 90 min, min: 30, max: 180 (SC-12)
    long_session_no_meal_threshold: number; // default: 300 min, min: 120, max: 480 (SC-11)
    comfort_opportunity_threshold: number;  // default: 70 (ComfortScore), min: 50, max: 90 (SC-08)
    comfort_indoor_threshold: number;       // default: 40 (ComfortScore), min: 20, max: 60 (SC-08b)
    weekly_budget_ars?: number;             // default: undefined (SC-13 inactiva si no se define)
    sensitive_contact_weekly_limit: number; // default: 2 encuentros/sem (SC-16, activa si w > 0)
  }

  export const defaultParams: ConstraintParams = {
    cannabis_buffer_target: 240,
    cannabis_buffer_floor: 120,
    w_ghc01: 8,
    sleep_target_post_ferro: 480,
    sleep_minimum_absolute: 360,
    travel_buffer_casino: 30,
    travel_buffer_ferro: 45,
    cognitive_ban_post_ferro: 90,
    weather_extreme_threshold: 20,
    study_block_min_duration: 120,
    batch_cooking_target: 2,
    batch_cooking_duration: 120,
    dead_time_threshold: 20,
    context_switches_max: 4,
    serendipity_slots_per_week: 2,
    travel_time_max_daily: 90,
    long_session_no_meal_threshold: 300,
    comfort_opportunity_threshold: 70,
    comfort_indoor_threshold: 40,
    weekly_budget_ars: undefined,
    sensitive_contact_weekly_limit: 2,
  };
  ```
- **Done When:** Los 21 parámetros están exportados con sus tipos y valores default idénticos a los de la Master Spec (§5.2 y §32).

---

### Tarea 0.4: Matriz de Tiempos de Traslado de Mar del Plata (`travelMatrix.ts`)
- **Archivo:** `src/lib/scheduler/travelMatrix.ts`
- **Propósito:** Proveer el tiempo mínimo de viaje en transporte público entre ubicaciones clave de Mar del Plata para validar `HC-05b`. Cada celda debe ser editable por el usuario.
- **Valores default de la matriz (§6, HC-05b):**
  ```typescript
  import { LocationType } from './types';

  export type TravelMatrix = Record<LocationType, Partial<Record<LocationType, number>>>;

  export const defaultTravelMatrix: TravelMatrix = {
    casa: {
      casa: 0,
      rambla_casino: 30,
      ferro_san_juan: 25,
      facultad: 20,
      cafe_guemes: 15,
      paseo_aldrey: 18,
    },
    rambla_casino: {
      casa: 30,
      rambla_casino: 0,
      ferro_san_juan: 20,
      facultad: 25,
      cafe_guemes: 20,
      paseo_aldrey: 22,
    },
    ferro_san_juan: {
      casa: 25,
      rambla_casino: 20,
      ferro_san_juan: 0,
      facultad: 30,
      cafe_guemes: 18,
      paseo_aldrey: 20,
    },
    facultad: {
      casa: 20,
      rambla_casino: 25,
      ferro_san_juan: 30,
      facultad: 0,
      cafe_guemes: 10,
      paseo_aldrey: 12,
    },
    cafe_guemes: {
      casa: 15,
      rambla_casino: 20,
      ferro_san_juan: 18,
      facultad: 10,
      cafe_guemes: 0,
      paseo_aldrey: 5,
    },
    paseo_aldrey: {
      casa: 18,
      rambla_casino: 22,
      ferro_san_juan: 20,
      facultad: 12,
      cafe_guemes: 5,
      paseo_aldrey: 0,
    },
    exterior_rambla: { rambla_casino: 5, casa: 30, cafe_guemes: 15 },
    exterior_plaza: { facultad: 10, casa: 20, cafe_guemes: 15 },
    gym: { casa: 15, cafe_guemes: 10, rambla_casino: 20 },
    depto_contacto: { casa: 20, cafe_guemes: 15 },
    custom: { casa: 30 },
  };

  export function getTravelTimeMinutes(
    from: LocationType,
    to: LocationType,
    matrix: TravelMatrix = defaultTravelMatrix
  ): number {
    if (from === to) return 0;
    return matrix[from]?.[to] ?? matrix[to]?.[from] ?? 20; // Fallback por defecto de 20 min si no está definida
  }
  ```
- **Done When:** La matriz contiene las 6 ubicaciones centrales con sus tiempos exactos y la función `getTravelTimeMinutes` devuelve los minutos correctos.

---

### Tarea 0.5: Esqueleto de Restricciones y Suite de Pruebas de GHC-01
- **Archivos:**
  - `src/lib/scheduler/graduatedHardConstraints/GHC01_cannabisBuffer.ts`
  - `__tests__/GHC01_cannabisBuffer.test.ts`
- **Fórmula matemática exacta (§7.2 y §7.3):**
  $$\text{penalidad}_{GHC01}(x) = \begin{cases} 
  0 & \text{si } x \ge T_{\text{target}} \\[6pt]
  w_{GHC01} \cdot \left( \dfrac{T_{\text{target}} - x}{T_{\text{target}} - T_{\text{floor}}} \right)^2 & \text{si } T_{\text{floor}} \le x < T_{\text{target}} \\[6pt]
  \infty & \text{si } x < T_{\text{floor}}
  \end{cases}$$
- **Implementación en TypeScript:**
  ```typescript
  import { ConstraintParams } from '../params';

  export function computeGHC01Penalty(bufferMinutes: number, params: ConstraintParams): number {
    const target = params.cannabis_buffer_target;
    const floor = params.cannabis_buffer_floor;
    const weight = params.w_ghc01;

    if (bufferMinutes < 0 || bufferMinutes < floor) {
      return Infinity; // Violación inaceptable: estado descartado
    }
    if (bufferMinutes >= target) {
      return 0; // Cumple plenamente
    }

    const ratio = (target - bufferMinutes) / (target - floor);
    return weight * Math.pow(ratio, 2);
  }
  ```
- **Suite de pruebas unitarias (`__tests__/GHC01_cannabisBuffer.test.ts`):**
  - Evaluar buffer $\ge 240 \to 0$.
  - Evaluar buffer $= 120 \to 8 \times 1.0 = 8.0$.
  - Evaluar buffer $= 180$ (punto medio) $\to 8 \times (60/120)^2 = 8 \times 0.25 = 2.0$.
  - Evaluar buffer $= 90$ ($< 120$) $\to \infty$.
  - Evaluar buffer negativo $\to \infty$.
- **Done When:** Los tests unitarios pasan al 100% con `npm test` validando la curvatura cuadrática y el rechazo infinito.

---

## Fase 1: El Motor CSP (Constraint Satisfaction Problem) Core

### Tarea 1.1: Particionamiento y Representación Temporal (`partitioner.ts`)
- **Archivo:** `src/lib/scheduler/partitioner.ts`
- **Objetivo:** Separar la agenda en dos grupos:
  1. `fixed`: Eventos que no pueden cambiar de horario (`is_locked === true`, turnos laborales confirmados, cursadas universitarias fijas).
  2. `movable`: Eventos sujetos a optimización (bloques de estudio, batch cooking, salidas sociales flexibles, tiempo personal).
- **Discretización:** La semana se divide en slots de 15 minutos (96 slots por día, 672 slots por semana). Todos los inicios y duraciones deben redondearse a múltiplos de 15 minutos.
- **Done When:** La función `partitionEvents(schedule)` divide con precisión los eventos y valida que ningún evento `is_locked` sea incluido en la lista de movibles.

---

### Tarea 1.2: Propagación de Dominios AC-3 y Forward Checking (`propagator.ts`)
- **Archivo:** `src/lib/scheduler/propagator.ts`
- **Algoritmo:**
  1. Para cada evento movible $E_i$, su dominio inicial $D(E_i)$ abarca todos los slots factibles de la semana.
  2. Aplicar propagación AC-3 eliminando slots que colisionen directamente con eventos fijos (`HC-01`).
  3. Eliminar slots de sueño post-Ferro (`HC-03`) y buffers de traslado laboral (`HC-05`).
  4. Eliminar slots posteriores a Ferro que violen la prohibición cognitiva (`HC-11`).
  5. Ordenar los dominios restantes. Si algún dominio queda vacío ($|D(E_i)| = 0$), Forward Checking aborta la rama inmediatamente.
- **Done When:** AC-3 reduce los dominios iniciales en más del 60% en menos de 5ms, eliminando ramas inviables tempranamente.

---

### Tarea 1.3: Catálogo Completo de las 10 Hard Constraints (HC-01 a HC-11)
Cada restricción dura se implementa en un archivo dedicado dentro de `src/lib/scheduler/hardConstraints/`. Retorna `{ satisfied: boolean, reason?: string }`.

1. **`HC01_noOverlap.ts`:**
   - **Semántica:** $\forall E_i, E_j, i \neq j \implies end(E_i) \le start(E_j) \lor end(E_j) \le start(E_i)$.
   - Ningún evento puede solaparse ni por un minuto con otro. Inviolable.
2. **`HC02_lockedEvents.ts`:**
   - **Semántica:** Si $E.is\_locked === true$, su posición y duración no pueden ser modificadas por el solver. Inviolable.
3. **`HC03_sleepPostFerro.ts`:**
   - **Semántica:** Tras un turno de Ferro San Juan, debe existir un bloque continuo de sueño de al menos `sleep_target_post_ferro` minutos (default: 480 min), iniciando dentro de `travel_buffer_ferro` minutos (default: 45 min) del fin del turno. Inviolable.
4. **`HC05_workTravel.ts`:**
   - **Semántica:** Buffer libre antes y después de cada turno laboral: `travel_buffer_casino` (default: 30 min) para Casino Rambla, `travel_buffer_ferro` (default: 45 min) para Ferro San Juan. Inviolable.
5. **`HC05b_travelViability.ts`:**
   - **Semántica:** Entre dos eventos consecutivos en ubicaciones distintas $L_1 \neq L_2$, el tiempo libre entre ellos debe ser $\ge \text{getTravelTimeMinutes}(L_1, L_2)$. Inviolable (viabilidad física).
6. **`HC07_universitySchedule.ts`:**
   - **Semántica:** Las materias (Redes, AyDS, AEEC, CalSoft) tienen horarios fijos durante el cuatrimestre. Tratadas como `is_locked: true` recurrente salvo excepción explícita. Inviolable.
7. **`HC08_weatherRelocation.ts`:**
   - **Semántica:** Si un evento tiene `weatherSensitivity === 'outdoor_full'` y el `ComfortScore` proyectado es $< \text{weather\_extreme\_threshold}$ (default: 20), el solver reubica automáticamente a indoor siguiendo la prioridad: `depto_contacto` (si el contacto tiene departamento propio) $\to$ `cafe_guemes` $\to$ `paseo_aldrey`. Desactivable por el usuario.
8. **`HC09_minimumSleep.ts`:**
   - **Semántica:** En toda noche, Matu debe tener al menos `sleep_minimum_absolute` minutos continuos de descanso (default: 360 min = 6h). Inviolable.
9. **`HC10_noWorkOverlap.ts`:**
   - **Semántica:** Ningún evento personal o académico puede invadir el horario de un turno de trabajo confirmado, incluyendo los márgenes de traslado de HC-05. Inviolable.
10. **`HC11_cognitiveBanPostFerro.ts`:**
    - **Semántica:** Durante los `cognitive_ban_post_ferro` minutos (default: 90 min) posteriores a la llegada a casa tras un turno Ferro, no se pueden programar eventos con `cognitiveLoad >= 2` (estudio profundo, parciales). Desactivable (configurando el parámetro en 0).

*Nota:* HC-04 fue absorbida en el modelo circadiano (`SC-04`) y HC-06 (Lau) evolucionó a la soft constraint opcional `SC-16`. El catálogo de HCs consta de exactamente estas 10 restricciones.

- **Done When:** Cada HC cuenta con su archivo aislado y rechaza estados inválidos con un mensaje explicativo claro.

---

### Tarea 1.4: Solver de Factibilidad Base (Backtracking + Forward Checking)
- **Archivo:** `src/lib/scheduler/solver.ts` (función `backtrackWithFC`)
- **Heurística MRV (Minimum Remaining Values):** Ordenar las variables (eventos movibles) evaluando primero aquella que posea el dominio más reducido de slots factibles.
- **Ejecución:** Asignar slots a los eventos movibles validando binariamente las 10 HCs. Si una asignación falla, se poda la rama y se retrocede (backtracking).
- **Done When:** El solver encuentra un estado factible inicial que respeta el 100% de las HCs en menos de 15ms para una semana promedio.

---

### Tarea 1.5: La Función de Penalización Unificada y las 16 Soft Constraints (`scorer.ts`)
- **Archivo:** `src/lib/scheduler/scorer.ts`
- **Fórmula de Costo Total:**
  $$\text{Costo\_total}(S) = \sum \text{penalidad}_{GHC} + \sum_{i=1}^{16} w_i^{\text{efectivo}} \cdot P_i(S)$$
  donde $P_i(S) \in [0, 1]$ es la penalización normalizada de la SC $i$, y $w_i^{\text{efectivo}} = w_i^{\text{base}} \times \text{multiplicador\_metaSlider} \times \text{factor\_override\_semanal}$.
- **Fórmula de Score de Bienestar (0 a 100):**
  $$\text{Score}(S) = 100 \times \left(1 - \frac{\text{Costo\_total}(S)}{\text{Costo\_máximo\_teórico}}\right)$$
- **Catálogo Exhaustivo de las 16 Soft Constraints (SCs):**
  1. **SC-01 · Bloques de Estudio Continuos ($w=8$):** Penaliza bloques de estudio $< \text{study\_block\_min\_duration}$ (120 min). $P_{01} = 1 - (\text{bloques válidos} / \text{total bloques})$.
  2. **SC-02 · Batch Cooking Semanal ($w=5$):** Penaliza si las sesiones de batch cooking son menores a $\text{batch\_cooking\_target}$ (default: 2). $P_{02} = \max(0, \text{target} - \text{sesiones}) / \text{target}$.
  3. **SC-03 · Metas de Horas Semanales por Contacto ($w=6$):** Penaliza no alcanzar las horas semanales acordadas con amigos (Juancito: 5h, Juani: 3h). $P_{03} = \frac{1}{|C|} \sum \max(0, (H_c - h_c)/H_c)$.
  4. **SC-04 · Fatiga Circadiana Acumulada ($w=9$):** Rastrea déficit de sueño post-Ferro: $\sum \max(0, \text{sleep\_target} - \text{sueño\_real})$. $P_{04} = \min(1, \text{déficit} / \text{sleep\_target})$. Si $P_{04} > 0.4 \implies$ incrementa $w_{\text{sueno}}$ en $+2$; si $P_{04} > 0.6 \implies$ sugiere activar preset "Recuperación".
  5. **SC-05 · Distribución Equilibrada de Carga Diaria ($w=4$):** Penaliza desbalances extremos de carga horaria total entre días: $P_{05} = \text{Var}(\text{carga}) / \text{Var}_{\max}$.
  6. **SC-06 · Disponibilidad de Contactos ($w=3$):** Penaliza proponer encuentros durante los `busySlots` de un amigo. $P_{06} = \text{solapamiento} / \text{duración}$. Informativo, nunca bloqueante (Principio P1).
  7. **SC-07 · Preferencias Horarias Personales ($w=6$):** Penaliza planificar estudio fuera de `energyPeakHours` o `preferredStudyHours`.
  8. **SC-08 · Usar Buen Clima para Social/Outdoor ($w=7$):** Si hay ventanas con $\text{ComfortScore} > \text{comfort\_opportunity\_threshold}$ (default: 70) y tiempo libre sin actividad social/outdoor planificada, se penaliza.
  9. **SC-08b · Usar Mal Clima para Productividad ($w=4$):** Si hay ventanas con $\text{ComfortScore} < \text{comfort\_indoor\_threshold}$ (default: 40) con tiempo libre sin actividad productiva (estudio, batch cooking), se penaliza. **Nunca penaliza si hay una actividad social planificada con mal clima**.
  10. **SC-09 · Sin Tiempo Muerto Corto Entre Eventos de Distinta Naturaleza ($w=5$):** Penaliza huecos de $0 < \text{gap} < \text{dead\_time\_threshold}$ (default: 20 min) entre eventos de categorías distintas.
  11. **SC-10 · Economía Energética - Secuenciación por Carga ($w=8$):** Penaliza no respetar el tiempo de recuperación entre eventos según la tabla:
      - Parcial/examen (3 cog / 0 phys) $\to 90$ min recuperación.
      - Estudio intensivo (3 cog / 0 phys) $\to 30$ min recuperación.
      - Gym (0 cog / 3 phys) $\to 60$ min recuperación.
      - Turno Ferro (1 cog / 2 phys) $\to 30$ min recuperación.
      - Cursada (2 cog / 0 phys) $\to 20$ min recuperación.
      - Mate con amigos (0 cog / 0 phys) $\to 0$ min recuperación.
      - Batch cooking (1 cog / 1 phys) $\to 0$ min recuperación.
  12. **SC-11 · Comidas y Descansos en Jornadas Largas ($w=7$):** Penaliza jornadas continuas $> \text{long\_session\_no\_meal\_threshold}$ (default: 300 min = 5h) sin un bloque de comida.
  13. **SC-12 · Tiempo de Traslado Total Diario ($w=4$):** Penaliza días donde el tiempo de viaje total acumulado supere $\text{travel\_time\_max\_daily}$ (default: 90 min).
  14. **SC-13 · Presupuesto Semanal Estimado ($w=3$):** Penaliza si la sumatoria de gastos estimados en ARS supera $\text{weekly\_budget\_ars}$. Inactiva por defecto si el presupuesto no está fijado.
  15. **SC-14 · Sin Exceso de Cambios de Contexto en un Día ($w=6$):** Penaliza días con más de $\text{context\_switches\_max}$ (default: 4) transiciones entre categorías de eventos.
  16. **SC-15 · Slots de Serendipia Social Semanales ($w=5$):** Penaliza semanas sin al menos $\text{serendipity\_slots\_per_week}$ (default: 2) espacios abiertos para lo inesperado.
  17. **SC-16 · Equilibrio con Vínculo Delicado - Lau ($w=0$ default):** Opcional. Penaliza semanas con más de $\text{sensitive\_contact\_weekly\_limit}$ (default: 2) encuentros con el contacto marcado como sensible. Curva suave.
- **Done When:** `scorer.ts` implementa con exactitud matemática las 16 SCs, evalúa GHC-01 y devuelve el costo y el Score normalizado en $[0, 100]$.

---

### Tarea 1.6: Optimización Local Hill Climbing con Trade-offs de GHC
- **Archivo:** `src/lib/scheduler/solver.ts` (función `localSearchOptimize`)
- **Mecanismo:**
  1. Tomar la solución factible base generada en la Tarea 1.4.
  2. Ejecutar un bucle de Hill Climbing estocástico/primero-el-mejor (máximo 500 iteraciones).
  3. En cada iteración, generar un movimiento vecinal:
     - Desplazar un evento movible $\pm 15, \pm 30, \pm 60$ minutos dentro de su dominio factible.
     - Intercambiar slots entre dos eventos de duración compatible.
  4. Validar que el nuevo estado no viole ninguna de las 10 HCs binarias.
  5. Evaluar $\text{Costo\_total}(S_{\text{nuevo}})$. Si el costo es menor (Score más alto), aceptar el movimiento.
  6. **Tratamiento de GHC-01:** Si mover un evento acorta el buffer post-cannabis por debajo de $T_{\text{target}}$ (240 min) pero por encima de $T_{\text{floor}}$ (120 min), el solver sumará la penalización cuadrática. Si la ganancia en otras SCs supera esa penalización, el movimiento **es aceptado**, registrando un trade-off explícito. Si cae por debajo de 120 min, la penalización es infinita y el estado es descartado.
- **Done When:** El optimizador realiza trade-offs válidos entre GHC-01 y SCs de alto peso, convergiendo en $< 35\text{ms}$.

---

### Tarea 1.7: Módulo de Post-Procesamiento (`postProcessor.ts`)
- **Archivo:** `src/lib/scheduler/postProcessor.ts`
- **Operaciones secuenciales:**
  1. **Inserción de buffers automáticos:**
     - Insertar bloque `buffer_post_consumo` si un evento tiene `cannabis_consumed: true`.
     - Insertar bloque `sueno` post-Ferro garantizando `sleep_target_post_ferro`.
     - Insertar bloques `traslado` antes y después de turnos laborales (HC-05).
  2. **Fusión de gaps cortos (SC-09):** Detectar espacios libres menores a `dead_time_threshold` (20 min) entre eventos y ajustar las duraciones para absorber el gap improductivo.
  3. **Inserción de `SocialOpportunitySlots` (SC-15):** Inyectar los slots de serendipia faltantes posicionándolos preferentemente en ventanas de buen clima (SC-08).
- **Done When:** La agenda final cuenta con todos sus buffers explícitos y sin fragmentación de tiempo muerto.

---

### Tarea 1.8: Generador de `ConstraintTrace` y Pipeline Unificado (`solver.ts`)
- **Archivo:** `src/lib/scheduler/solver.ts`
- **Generación de Traza:**
  - Comparar la agenda original recibida con la agenda final optimizada.
  - Por cada evento movido, redimensionado o insertado, construir un objeto `ConstraintTrace` indicando:
    - Restricción disparadora primaria (ej. `"GHC-01"`, `"SC-08"`).
    - Explicación en lenguaje natural (ej. *"El buffer de cannabis se ajustó a 3h30 para permitir asistir a la Cursada de AyDS"*).
    - Impacto neto en el Score (ej. `+3.6 pts`).
    - Si se redujo una GHC, indicar cuántos minutos faltaron para el target (`ghcViolationAmount`).
- **Benchmark de Rendimiento:**
  - Debe resolver una agenda compleja de 30 eventos en menos de 50 milisegundos (`performance.now() - t0 < 50`).
- **Done When:** `__tests__/solver.integration.test.ts` corre sobre un escenario semanal completo, resuelve en $< 50\text{ms}$ y produce trazas detalladas para todos los cambios.

---

## Fase 2: Recurrencia, Persistencia Local-First y Privacidad

### Tarea 2.1: Expansión de Recurrencia y Gestión de Excepciones (`recurrence.ts`)
- **Archivo:** `src/lib/scheduler/recurrence.ts`
- **Funcionalidad:**
  - Desplegar una instancia `Event` por cada repetición configurada en `RecurrencePattern` (`daily`, `weekly`, `biweekly`, `monthly`) dentro del rango de la semana a planificar.
  - Aplicar `RecurrenceException`:
    - `skip`: Omite la generación del evento en esa fecha puntual.
    - `reschedule`: Modifica el `start` o `duration` de esa ocurrencia específica sin alterar el resto de la serie.
    - `modify`: Altera propiedades como ubicación, nombre o carga energética para esa fecha única.
  - Soportar split de patrones ("Editar desde aquí en adelante"): cierra el patrón original en la fecha seleccionada (`until`) y crea un nuevo patrón a partir de esa fecha.
- **Done When:** Modificar o borrar una clase universitaria o turno semanal puntual no altera el resto de las semanas del cuatrimestre.

---

### Tarea 2.2: Repositorio Local-First con Esquema Tipado (`LocalStorageStore.ts`)
- **Archivo:** `src/lib/scheduler/storage/LocalStorageStore.ts`
- **Características:**
  - Almacenamiento 100% offline en `localStorage` bajo claves versionadas (`mimesa_events_v1`, `mimesa_params_v1`, `mimesa_meta_v1`).
  - Validación de esquema en tiempo de carga con Zod o TypeScript asserts para evitar corrupción de datos.
  - Cola de operaciones pendientes (`syncQueue`) para sincronización asíncrona al detectar conectividad.
- **Done When:** La aplicación inicia, lee y guarda la agenda completa de forma instantánea sin conexión a internet.

---

### Tarea 2.3: Sincronización Supabase y Filtro de Privacidad Inquebrantable (`syncEngine.ts`)
- **Archivo:** `src/lib/scheduler/storage/syncEngine.ts`
- **Regla P4 (Información sensible bajo control):**
  - Lista inmutable de campos locales:
    ```typescript
    export const LOCAL_ONLY_FIELDS = [
      'cannabis_consumed',
      'notesEncrypted',
      'displayAlias',
      'AILogs',
    ] as const;
    ```
  - **Filtro Sanitizador:** Antes de armar el payload hacia Supabase, todo objeto `Event` o `Contact` debe pasar por una función que elimine estrictamente estas propiedades:
    ```typescript
    export function sanitizeForCloudSync(event: Event): Partial<Event> {
      const sanitized = { ...event };
      for (const field of LOCAL_ONLY_FIELDS) {
        delete (sanitized as any)[field];
      }
      return sanitized;
    }
    ```
  - Resolución de conflictos: Estrategia *Last Write Wins* basada en `localVersion`, `deviceId` y `updatedAt`.
- **Done When:** Al inspeccionar los payloads de red enviados a Supabase (vía DevTools o tests unitarios), jamás aparece el campo `cannabis_consumed` ni notas privadas.

---

### Tarea 2.4: Exportación Segura a Calendarios Externos (`calendarExport.ts`)
- **Archivo:** `src/lib/scheduler/calendarExport.ts`
- **Formato:** Generación de archivos `.ics` compatibles con Google Calendar y Apple iCal.
- **Anonimización:** Si un evento tiene `is_sensitive: true`:
  - El título se reemplaza por `"Ocupado"` (o por `displayAlias` si fue provisto).
  - La descripción, contactos asociados y notas se dejan completamente vacías.
  - El flag `cannabis_consumed` jamás se incluye en los atributos del iCalendar.
- **Done When:** Exportar la semana a un archivo `.ics` genera un calendario funcional donde los eventos sensibles son indistinguibles de bloqueos genéricos.

---

## Fase 3: Sistema Meteorológico, Estrategia Indoor y Modelo Social

### Tarea 3.1: Cliente Open-Meteo y Caché Local con TTL (`weatherService.ts`)
- **Archivo:** `src/lib/scheduler/weatherService.ts`
- **Configuración:** Coordenadas de Mar del Plata: Latitud `-38.00`, Longitud `-57.55`.
- **Variables horarias requeridas:** `precipitation_probability`, `precipitation`, `wind_speed_10m`, `wind_direction_10m`, `temperature_2m`, `apparent_temperature`.
- **Caché:** Guardar la respuesta en memoria/`localStorage` con un TTL de 6 horas. Si la app está offline, utilizar el último pronóstico cacheado.
- **Done When:** La función devuelve un array de 168 objetos `WeatherCondition` (uno por hora semanal) sin requerir API keys.

---

### Tarea 3.2: Motor de Cálculo de `ComfortScore`
- **Archivo:** `src/lib/scheduler/weather/comfortScore.ts`
- **Fórmula matemática exacta (§12.3):**
  $$\text{ComfortScore} = 100 - (P_{\text{lluvia}} \times 40) - (P_{\text{viento}} \times 30) - (P_{\text{frío}} \times 30)$$
  donde:
  $$P_{\text{lluvia}} = \min\left(1,\, \frac{\text{precipProb}}{0.35} + \frac{\text{precipMm}}{5}\right)$$
  $$P_{\text{viento}} = k_{SE} \times \min\left(1,\, \frac{\max(0,\, v - 20)}{25}\right), \quad k_{SE} = \begin{cases} 1.3 & \text{si dirección} \in \{SE, S, E\} \\ 1.0 & \text{otros} \end{cases}$$
  $$P_{\text{frío}} = \min\left(1,\, \frac{\max(0,\, 10 - \text{feelsLike})}{10}\right)$$
- **Done When:** Días con lluvia y ráfagas del SE de 45 km/h puntúan $< 20$, mientras que tardes soleadas de 19°C con viento suave puntúan $> 85$.

---

### Tarea 3.3: Estrategia Climática y Sensibilidad por Actividad
- **Archivos:**
  - `src/lib/scheduler/softConstraints/SC08_goodWeatherForSocial.ts`
  - `src/lib/scheduler/softConstraints/SC08b_badWeatherForProductivity.ts`
- **Las 3 Reglas de Oro (§12.4):**
  - **Regla 1 (Lo social en mal clima vale):** Si el usuario programa un encuentro social con lluvia o frío, el solver **nunca** lo penaliza ni lo bloquea.
  - **Regla 2 (Buen clima $\to$ Proteger para social):** Ventanas con $\text{ComfortScore} > \text{comfort\_opportunity\_threshold}$ (70) deben aprovecharse para social o aire libre (`SC-08`).
  - **Regla 3 (Mal clima $\to$ Canalizar a productividad en casa):** Ventanas con $\text{ComfortScore} < \text{comfort\_indoor\_threshold}$ (40) deben orientarse a estudio o batch cooking (`SC-08b`).
- **Tabla de Sensibilidad y Fallbacks Indoor (§12.5):**
  | Actividad | ComfortScore Mínimo | Tolera lluvia en viaje | Fallback indoor automático |
  | :--- | :---: | :---: | :--- |
  | Playa | 75 | No | `cafe_guemes` |
  | Caminata rambla | 55 | No | `paseo_aldrey` |
  | Plaza exterior | 50 | No | Café cercano |
  | Café Güemes | 0 | Sí | — |
  | Gym | 0 | Sí | — |
  | Paseo Aldrey | 0 | Sí | — |
  | Depto de contacto | 0 | Sí | — |
- **Done When:** Si el pronóstico alerta clima extremo ($\text{ComfortScore} < 20$), una salida a la playa se reubica automáticamente en un café según la cadena de fallback sin cancelar el evento.

---

### Tarea 3.4: Modelo Social en Tres Capas, Serendipia y Logística del Hogar
- **Archivo:** `src/lib/scheduler/socialEngine.ts`
- **Las Tres Capas (§11.1):**
  - **Capa A (Vínculos conocidos):** Juancito (meta 5h), Juani (meta 3h), Lau (SC-16 opcional).
  - **Capa B (Contactos en construcción):** Perfilado progresivo ("lazy profiling").
  - **Capa C (Slots de serendipia):** Eventos de tipo `SocialOpportunitySlot` (con bordes punteados en el calendario).
- **Logística del Hogar (§11.4):**
  - La casa de Matu es apta para: estudio, batch cooking, descanso/sueño y visitas íntimas (Juani frecuentemente, Juancito ocasionalmente).
  - **El hogar jamás es sugerido como fallback indoor para encuentros con personas de Capa B o salidas casuales**. En tales casos, los destinos sugeridos son siempre `cafe_guemes` o `paseo_aldrey`.
- **Done When:** El solver inyecta exactamente 2 slots de serendipia por semana en ventanas de buen clima y nunca programa visitas de conocidos casuales en la casa de Matu.

---

## Fase 4: UX Core, Calendario Espacial, Meta-Sliders y DiffViewer

### Tarea 4.1: Calendario Proporcional Diaria/Semanal y Lock Universal (`CalendarGrid.tsx`)
- **Archivo:** `src/components/CalendarGrid.tsx`
- **Requisitos de visualización:**
  1. **Representación Espacial Estricta del Tiempo (§29.2):**
     - La altura de cada tarjeta de evento en píxeles debe guardar una proporción matemática lineal con su duración: $\text{altura} = \text{duración en minutos} \times k$ (donde $k$ es la escala, ej. $1\text{ px/min}$ o $60\text{ px/hora}$).
     - Un evento de 120 minutos mide exactamente el doble de alto que uno de 60 minutos. La posición vertical en la grilla corresponde estrictamente a la hora de inicio.
  2. **Vistas Diaria y Semanal:** Alternador fluido entre vista de 7 días (grilla horaria de 00:00 a 24:00) y vista enfocada en el día actual.
  3. **Universal Lock por Evento (§29.3):**
     - Cada bloque de evento en el calendario debe renderizar un icono o toggle de candado (`Lock` / `Unlock`).
     - Al hacer clic, muta inmediatamente el estado local a `is_locked: true`.
     - Invoca instantáneamente la restricción `HC-02`: a partir de ese segundo, ningún ciclo de resolución ni re-optimización del solver intentará mover o modificar ese evento.
  4. **Renderizado de Slots de Serendipia:** Tarjetas con borde punteado (`border-dashed`), fondo translúcido y etiqueta *"Slot de Serendipia"*.
- **Done When:** El usuario percibe visualmente los espacios libres en escala real y puede fijar cualquier evento con un solo clic en el candado.

---

### Tarea 4.2: Sesión de Planificación Semanal en 5 Pasos (`WeeklyPlanningSession.tsx`)
- **Archivo:** `src/components/WeeklyPlanningSession.tsx`
- **Ritual dominical (21:00 hs) estructurado en 5 pasos (§17.2):**
  - **Paso 1 · Contexto Personal y Meta-Sliders:** Preguntas rápidas de estado de ánimo (😴 Cansado, 😐 Normal, ⚡ Con ganas), tipo de semana (📚 Exámenes, 😌 Normal, 🤝 Social) y posicionamiento de los 3 Meta-Sliders.
  - **Paso 2 · Panorama Climático:** Tarjetas del tiempo de Mar del Plata destacando ventanas de buen clima (oportunidades sociales) y mal clima (ventanas sugeridas para estudio/cocina).
  - **Paso 3 · Confirmación de Fijos y Excepciones:** Lista de eventos bloqueados (`is_locked`) con posibilidad de declarar excepciones puntuales de cursada o trabajo.
  - **Paso 4 · Intenciones Sociales:** Selección de amigos con los que conectar esta semana (Juancito, Juani, Lau) y ajuste de cantidad de slots de serendipia (0 a 3).
  - **Paso 5 · Ejecución del Solver y DiffViewer:** El solver procesa la semana en $< 50\text{ms}$ y abre directamente el modal de revisión de cambios.
- **Done When:** El flujo completo se completa en menos de 5 minutos y entrega la agenda resuelta al DiffViewer.

---

### Tarea 4.3: DiffViewerModal con Tratamiento Especial de GHC (`DiffViewerModal.tsx`)
- **Archivo:** `src/components/DiffViewerModal.tsx`
- **Comportamiento:**
  - Muestra una comparativa visual *"Antes vs Después"* de cada evento que el solver propone mover o reubicar.
  - Lee el `ConstraintTrace` y presenta el motivo en lenguaje amigable para humanos.
  - **Tratamiento Prominente de GHC-01 cruzada (§7.3 y §18):**
    - Si el solver recomienda acortar el buffer de cannabis (ej. a 3h30 en lugar de 4h), renderiza un panel de advertencia en color ámbar/naranja:
      > ⚠️ **GHC-01 · Buffer post-consumo acortado (3h30 en vez de 4h)**  
      > *"El solver propone esto porque permite asistir a la Cursada de Redes que tiene alta prioridad. El buffer de 3h30 está dentro del rango seguro (mínimo: 2h). ¿Estás cómodo con este tiempo?"*  
      > **Impacto en Score:** $-6.4\text{ pts (GHC-01)} + 12.0\text{ pts (Redes)} = +5.6\text{ pts neto}$.
    - Botones de acción: `[✅ Aceptar]` `[❌ Descartar]` `[🔧 Ajustar manualmente]`.
- **Done When:** El usuario comprende con absoluta claridad el trade-off propuesto y puede aprobar o rechazar cambios individualmente.

---

### Tarea 4.4: Meta-Sliders y Multiplicadores Reactivos (`MetaSliders.tsx`, `metaSliders.ts`)
- **Archivos:**
  - `src/lib/scheduler/metaSliders.ts`
  - `src/components/MetaSliders.tsx`
- **Los Tres Ejes (§10.2):**
  1. *Profundidad Social (0) $\longleftrightarrow$ Amplitud Social (10)*
     - Izquierda: Boost SC-03 y SC-06; Reduce SC-15.
     - Derecha: Reduce SC-03 y SC-06; Boost SC-15.
  2. *Productividad (0) $\longleftrightarrow$ Disfrute (10)*
     - Izquierda: Boost SC-01, SC-02 y SC-08b; Reduce SC-03 y SC-15.
     - Derecha: Reduce SC-01, SC-02 y SC-08b; Boost SC-03 y SC-15.
  3. *Introversión / Solo (0) $\longleftrightarrow$ Extroversión / Con gente (10)*
     - Izquierda: Protege slots de recuperación, Boost SC-04 y SC-08b; Reduce SC-03 y SC-15.
     - Derecha: Reduce recuperación y SC-04; Boost SC-03 y SC-15; Reduce SC-08b.
- **Función matemática del multiplicador:**
  $$\text{multiplicador}(x) = 0.5 + \left(\frac{x}{10}\right) \times 1.5 \quad \in [0.5, 2.0]$$
  En posición neutral ($x = 5$), el multiplicador es exactamente $1.0$ (sin efecto).
- **Presets de Contexto (§10.4):**
  - `Semana de examen`: Slider 1 (5), Slider 2 (1), Slider 3 (4).
  - `Período social intenso`: Slider 1 (6), Slider 2 (9), Slider 3 (9).
  - `Recuperación post-Ferro`: Slider 1 (5), Slider 2 (5), Slider 3 (1).
  - `Quiero conocer gente`: Slider 1 (9), Slider 2 (7), Slider 3 (9).
  - `Introspección / relax`: Slider 1 (5), Slider 2 (4), Slider 3 (1).
- **Done When:** Mover un meta-slider recalcula instantáneamente los pesos efectivos y actualiza la proyección del Score.

---

### Tarea 4.5: Panel de Restricciones Configurable Inline (`ConstraintPanel.tsx`)
- **Archivo:** `src/components/ConstraintPanel.tsx`
- **Estructura del panel (§19.1):**
  - Pestañas/acordeones para: **Meta-Sliders**, **Hard Constraints**, **Graduated Hard Constraints** y **Soft Constraints**.
  - Cada restricción muestra su estado (ON/OFF), slider de peso base (0 a 10) y override semanal.
  - **Edición Inline de Parámetros (Principio P9):** Al lado de cada número (minutos, umbrales, metas) se renderiza un botón con lápiz ✏️ que abre un input numérico. Al modificar el valor, se actualiza el objeto `params` y el solver recalcula la agenda en tiempo real.
- **Done When:** El usuario puede alterar cualquiera de los 21 parámetros directamente desde la UI sin reiniciar la aplicación.

---

### Tarea 4.6: Widget de Score, Anillo de Color y Drill-Down (`ScoreWidget.tsx`)
- **Archivo:** `src/components/ScoreWidget.tsx`
- **Escala cromática del Score (0 a 100):**
  - $< 40$: 🔴 Rojo (compromiso severo de bienestar).
  - $40 - 65$: 🟡 Amarillo (margen notable de mejora).
  - $66 - 85$: 🟢 Verde (buena semana en equilibrio).
  - $86 - 100$: ✨ Destellos / Violeta brillante (excelente alineación).
- **Desglose en Drill-Down (§20.3):** Separación visual nítida entre impacto de GHCs y penalidades de SCs, acompañada de recomendaciones accionables (ej. *"Para ganar +5 pts: Protegé el bloque de estudio del martes"*).
- **Done When:** El Score refleja en tiempo real cualquier cambio en la agenda o en los pesos de las restricciones.

---

## Fase 5: Features de Producto, LLM y Analíticas

### Tarea 5.1: Integración LLM Híbrida NLU / OCR (`geminiClient.ts`)
- **Archivo:** `src/lib/scheduler/llm/geminiClient.ts`
- **Modelo:** Google Gemini Flash (vía SDK oficial de Google Gen AI).
- **División de Responsabilidades:**
  - **El LLM realiza exclusivamente:**
    1. Parseo de lenguaje natural (ej. *"Tengo parcial de Redes el viernes a las 10"*) a objeto `Event` estructurado.
    2. OCR y visión multimodal (`SmartScheduleImporter`): Ingesta de capturas del SIU Guaraní, cronogramas laborales de WhatsApp o fotos de pizarrón para extraer horarios y materias.
    3. Síntesis matutina: Generación de un briefing empático en texto legible para el usuario.
  - **El CSP realiza el 100% de la matemática:** Detección de solapamientos, cálculo de buffers, evaluación de curvas cuadráticas y optimización de agenda.
  - **Degradación Graceful Offline:** Si el dispositivo no tiene conexión a internet, las funciones LLM se inhabilitan suavemente, pero el optimizador CSP y la edición manual siguen operando al 100%.
- **Done When:** Un prompt en lenguaje natural se traduce a un `Event` tipado válido listo para ser procesado por el CSP.

---

### Tarea 5.2: Modo "¿Qué Hago Ahora?" con Estrategia Climática (`WhatShouldIDoNow.tsx`)
- **Archivo:** `src/components/WhatShouldIDoNow.tsx`
- **Acceso:** Botón flotante siempre visible con el icono ⚡.
- **Funcionamiento:**
  - Ejecuta una búsqueda local en un horizonte inmediato de 2 horas.
  - Solicita el estado de ánimo actual (Energético, Normal, Cansado).
  - Consulta el `ComfortScore` actual de Mar del Plata, la fatiga acumulada, las metas semanales en riesgo y los amigos disponibles.
  - Si hace buen clima ($\text{ComfortScore} > 70$), rankea en primer lugar actividades outdoor o mate con amigos; si llueve ($\text{ComfortScore} < 40$), rankea estudio de Redes/AyDS o sesión de batch cooking.
- **Done When:** El usuario recibe 3 opciones ordenadas y accionables con un solo toque.

---

### Tarea 5.3: Fatigue Tracker de Turno Nocturno
- **Archivo:** `src/lib/scheduler/fatigueTracker.ts`
- **Propósito:** Registrar turnos consecutivos en la sucursal Ferro San Juan y calcular el déficit de sueño para alimentar la restricción `SC-04`.
- **Efecto:** Si la fatiga acumulada supera el umbral crítico ($P_{04} > 0.6$), el sistema notifica y sugiere activar automáticamente el preset de meta-sliders *"Recuperación post-Ferro"* protegiendo horas de sueño adicionales.
- **Done When:** Encadenar dos turnos nocturnos sin 8h completas de sueño eleva automáticamente el peso de las restricciones de descanso.

---

### Tarea 5.4: Retrospectiva Semanal (`RetrospectiveView.tsx`)
- **Archivo:** `src/components/RetrospectiveView.tsx`
- **Activación:** Se presenta al inicio del ritual de domingo, antes de planificar la nueva semana (§22).
- **Métricas:** Comparativa entre Score proyectado vs Score real ejecutado, porcentaje de cumplimiento de metas de estudio y cocina, y registro de motivos de fricción (ej. *"¿Por qué se movió el estudio del jueves? [Estaba cansado / Surgió algo]"*).
- **Done When:** El usuario visualiza la efectividad real de su semana anterior y aporta datos para el aprendizaje de patrones.

---

### Tarea 5.5: Motor de Aprendizaje de Patrones No Invasivo (`patternLearning.ts`)
- **Archivo:** `src/lib/scheduler/patternLearning.ts`
- **Condiciones de activación (§23):**
  - Confianza estadística $\ge 0.75$ sobre al menos $N \ge 5$ observaciones históricas.
  - **Inviolabilidad de la autonomía:** El sistema **nunca** crea ni activa una restricción de forma autónoma. Presenta una sugerencia explícita en la UI (ej. *"Notamos que los lunes post-Ferro moviste el estudio al martes 5 veces. ¿Querés que evitemos planificar estudio pesado ese día?"*).
- **Done When:** El motor detecta patrones recurrentes y los presenta como propuestas configurables para el usuario.

---

### Tarea 5.6: Modo Simulación "Y si..." (`SimulationMode.tsx`)
- **Archivo:** `src/components/SimulationMode.tsx`
- **Funcionamiento:** Clona en memoria la agenda de la semana en un entorno aislado (sandbox). Permite al usuario simular cambios drásticos (ej. *"¿Qué pasa si sumo un nuevo turno de trabajo el viernes?"* o *"¿Cómo queda mi score si no estudio el sábado?"*), comparando los resultados lado a lado sin alterar la agenda real.
- **Done When:** El usuario puede experimentar libremente y ver deltas de Score sin riesgo de corromper sus datos.

---

### Tarea 5.7: Modelo Económico Estimado en ARS
- **Archivo:** `src/lib/scheduler/economicModel.ts`
- **Valores default editables (§25):**
  - Playa, caminata, estudio en casa: `$0` (Free)
  - Colectivo local: `$850` (Cheap)
  - Mate en café: `$2.500` (Cheap)
  - Café con comida: `$8.000` (Moderate)
  - Cine: `$10.000` (Moderate)
  - Bowling en Aldrey: `$12.000` (Moderate)
  - Salida nocturna: `$20.000` (Expensive)
- **Cálculo:** Agrega el costo estimado de la semana y activa `SC-13` si se configuró un presupuesto límite en `weekly_budget_ars`.
- **Done When:** El calendario muestra el presupuesto proyectado en pesos argentinos y alerta si se excede el techo semanal definido.

---

### Tarea 5.8: Arquitectura de Notificaciones y Throttling
- **Archivo:** `src/lib/scheduler/notificationManager.ts`
- **Jerarquía y Canales (§26):**
  - **Crítica (Push + Sonido/Vibración):** Vencimiento del buffer post-consumo (`GHC-01`) en 30 minutos. Exenta del modo silencio.
  - **Alta (Push silencioso):** Inicio de ventana obligatoria de sueño post-Ferro (`HC-03`).
  - **Media (Notificación in-app):** Reubicación climática (`HC-08`), sesión de planificación dominical.
  - **Baja (Tarjeta en feed):** Briefing matutino, ventanas de buen clima detectadas, sugerencias de patrones.
- **Throttling estricto:** Máximo 3 notificaciones push por día. Modo silencio ininterrumpido entre las 23:00 y las 08:00 (excepto alerta crítica de GHC-01). Enmascaramiento de eventos sensibles (`{emoji} {hora}`).
- **Done When:** Las notificaciones respetan las reglas de silencio y nunca revelan datos sensibles en las pantallas de bloqueo.

---

### Tarea 5.9: Flujo de Onboarding en 5 Pantallas
- **Archivo:** `src/components/OnboardingWizard.tsx`
- **Secuencia de inicialización (§28):**
  1. *Pantalla 1/5 · Trabajo:* Configuración de sucursales (Casino Rambla y Ferro San Juan) y generación automática de buffers de traslado.
  2. *Pantalla 2/5 · Universidad:* Carga de las 4 materias del cuatrimestre mediante subida de captura de pantalla (SmartScheduleImporter) o ingreso manual.
  3. *Pantalla 3/5 · Vínculos:* Registro de hasta 3 contactos iniciales (Juancito, Juani, Lau) asignando metas u observaciones.
  4. *Pantalla 4/5 · Preferencias Iniciales:* Ajuste de los 3 Meta-Sliders y presupuesto semanal opcional.
  5. *Pantalla 5/5 · Primera Planificación:* Transición fluida a la primera Sesión de Planificación Semanal.
- **Done When:** Un usuario nuevo completa el onboarding en menos de 3 minutos y queda listo con su primera semana optimizada.

---

## Matriz de Verificación y Criterios de Aceptación Globales

| Componente | Criterio de Aceptación Principal | Método de Verificación |
| :--- | :--- | :--- |
| **Solver CSP Core** | Resuelve 30 eventos respetando 10 HCs en $< 50\text{ms}$ | Test de integración Jest con `performance.now()` |
| **GHC-01 (Cannabis)** | Curva cuadrática entre 120 y 240 min; $\infty$ si $< 120\text{ min}$ | Tests unitarios con assertions matemáticas exactas |
| **P9 (Configurabilidad)** | Los 21 parámetros de `params.ts` son editables inline | Test de UI modificando inputs en `ConstraintPanel` |
| **Universal Lock** | Toggle en tarjeta activa `is_locked: true` e invoca `HC-02` | Interacción en `CalendarGrid` verificando inamovilidad |
| **Calendario Espacial** | Altura proporcional matemática lineal a los minutos | Inspección CSS (`height = duration * k px`) |
| **DiffViewerModal** | Explica trazas y advierte prominentemente reducción de GHC-01 | Renderizado de modal con evento acortado |
| **Clima (ComfortScore)** | Aplica fórmula con penalización por viento SE del 1.3 | Test unitario con condiciones meteorológicas sintéticas |
| **Privacidad (P4)** | `cannabis_consumed` jamás sale del dispositivo en red | Interceptación de payloads hacia Supabase |
| **Sincronización** | Local-first con queue offline y Last-Write-Wins | Test de ciclo offline $\to$ online |