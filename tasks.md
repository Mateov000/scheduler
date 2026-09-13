# Checklist de Tareas de Implementación: MiMesa Scheduler v1.1

Checklist operativa paso a paso derivada directamente de la [Guia de implementacion.md](file:///c:/Users/Matu/Documents/Proyectos%20miscelaneos/scheduler/Guia%20de%20implementacion.md) y la [Master Spec.txt](file:///c:/Users/Matu/Documents/Proyectos%20miscelaneos/scheduler/Master%20Spec.txt).

---

## Fase 0: Setup, Tipado del Dominio y Formalización de Restricciones

### Tarea 0.1: Inicialización del Repositorio y Arquitectura de Carpetas
- [x] Inicializar proyecto Next.js 16 (App Router) con React 19, TypeScript estricto y Tailwind CSS.
- [x] Configurar entorno de testing unitario (Jest o Vitest) con TypeScript.
- [x] Crear la estructura completa de carpetas: `src/lib/scheduler/` (con subcarpetas `hardConstraints/`, `graduatedHardConstraints/`, `softConstraints/`, `storage/`, `llm/`, `weather/`), `src/components/` y `__tests__/`.

### Tarea 0.2: Tipado Estricto Integral (`types.ts`)
- [x] Crear `src/lib/scheduler/types.ts`.
- [x] Definir tipos de tiempo y slots: `DayOfWeek`, `TimeSlot`.
- [x] Definir ubicaciones y categorías: `LocationType` (11 tipos), `Location`, `EventCategory` (16 categorías), `WeatherSensitivity`.
- [x] Definir interfaz completa `Event` con campos temporales, recurrencia, energía (0–3), privacidad/sensibilidad (`is_sensitive`, `cannabis_consumed`, `displayAlias`), banderas de solver y estado de sincronización.
- [x] Definir interfaces de recurrencia: `RecurrencePattern`, `RecurrenceException` (`skip`, `reschedule`, `modify`).
- [x] Definir interfaces de clima y vínculos: `WeatherCondition`, `CardinalDirection`, `Contact`.
- [x] Definir interfaces del motor CSP: `ConstraintTrace`, `SolverInput`, `SolverResult` (con desglose de Score y métricas).

### Tarea 0.3: Parámetros Editables del Sistema (`params.ts`)
- [x] Crear `src/lib/scheduler/params.ts`.
- [x] Declarar la interfaz `ConstraintParams` conteniendo con exactitud los **21 parámetros editables** (Principio P9).
- [x] Exportar el objeto `defaultParams` con los valores numéricos y rangos válidos (min/max) definidos en la especificación.

### Tarea 0.4: Matriz de Tiempos de Traslado de Mar del Plata (`travelMatrix.ts`)
- [x] Crear `src/lib/scheduler/travelMatrix.ts`.
- [x] Implementar `defaultTravelMatrix` con los tiempos en transporte público entre Casa, Rambla Casino, Ferro San Juan, Facultad, Café Güemes y Paseo Aldrey.
- [x] Implementar la función `getTravelTimeMinutes(from, to, matrix)`.

### Tarea 0.5: Esqueleto de Restricciones y Suite de Pruebas de GHC-01
- [x] Crear los 27 archivos vacíos para HCs (10), GHCs (1) y SCs (16) en sus respectivas carpetas.
- [x] Implementar la función de penalización cuadrática en `src/lib/scheduler/graduatedHardConstraints/GHC01_cannabisBuffer.ts`.
- [x] Crear y ejecutar suite de pruebas en `__tests__/GHC01_cannabisBuffer.test.ts` evaluando: target (240 min $\to 0$), sobre el target ($\to 0$), en el piso (120 min $\to 8.0$), punto medio (180 min $\to 2.0$), por debajo del piso (90 min $\to \infty$) y valores negativos ($\to \infty$).

---

## Fase 1: El Motor CSP (Constraint Satisfaction Problem) Core (< 50ms)

### Tarea 1.1: Particionamiento y Representación Temporal (`partitioner.ts`)
- [x] Crear `src/lib/scheduler/partitioner.ts`.
- [x] Implementar discretización temporal en slots de 15 minutos (96 slots/día, 672 slots/semana).
- [x] Implementar función `partitionEvents(schedule)` que separa estrictamente eventos `fixed` (`is_locked: true`, cursadas fijas, turnos confirmados) de eventos `movable`.

### Tarea 1.2: Propagación de Dominios AC-3 y Forward Checking (`propagator.ts`)
- [x] Crear `src/lib/scheduler/propagator.ts`.
- [x] Implementar propagación AC-3 reduciendo el dominio de slots factibles para cada evento movible.
- [x] Implementar poda inmediata por Forward Checking si el dominio de algún evento se reduce a cero.

### Tarea 1.3: Catálogo Completo de las 10 Hard Constraints (HC-01 a HC-11)
- [x] Programar `HC01_noOverlap.ts`: Inviolabilidad de no solapamiento entre eventos.
- [x] Programar `HC02_lockedEvents.ts`: Eventos con `is_locked: true` son inamovibles.
- [x] Programar `HC03_sleepPostFerro.ts`: Bloque continuo de sueño de al menos `sleep_target_post_ferro` minutos tras turno Ferro.
- [x] Programar `HC05_workTravel.ts`: Buffers obligatorios de traslado pre/post turno (`travel_buffer_casino`, `travel_buffer_ferro`).
- [x] Programar `HC05b_travelViability.ts`: Gap físico de traslado entre eventos consecutivos usando `travelMatrix`.
- [x] Programar `HC07_universitySchedule.ts`: Inviolabilidad de cursadas fijas (Redes, AyDS, AEEC, CalSoft).
- [x] Programar `HC08_weatherRelocation.ts`: Reubicación indoor ante clima extremo (`ComfortScore < weather_extreme_threshold`) con cadena de fallbacks (`depto_contacto` $\to$ `cafe_guemes` $\to$ `paseo_aldrey`).
- [x] Programar `HC09_minimumSleep.ts`: Sueño mínimo absoluto de `sleep_minimum_absolute` minutos todas las noches.
- [x] Programar `HC10_noWorkOverlap.ts`: Prohibición de solapar eventos personales con turnos de trabajo y sus traslados.
- [x] Programar `HC11_cognitiveBanPostFerro.ts`: Bloqueo de eventos con `cognitiveLoad >= 2` durante `cognitive_ban_post_ferro` minutos post-llegada de Ferro.

### Tarea 1.4: Solver de Factibilidad Base (Backtracking + Forward Checking)
- [x] Implementar ordenamiento de variables con heurística MRV (Minimum Remaining Values).
- [x] Programar algoritmo de backtracking con validación binaria estricta de las 10 HCs.
- [x] Garantizar la obtención de una asignación factible base en $< 15\text{ms}$.

### Tarea 1.5: La Función de Penalización Unificada y las 16 Soft Constraints (`scorer.ts`)
- [x] Crear `src/lib/scheduler/scorer.ts`.
- [x] Implementar fórmula de Costo Total sumando penalidades GHC y soft constraints ponderadas: $\sum \text{penalidad}_{GHC} + \sum (w_i^{\text{efectivo}} \cdot P_i)$.
- [x] Implementar normalización de Score de Bienestar en rango $[0, 100]$.
- [x] Implementar las 16 Soft Constraints individuales:
  - [x] `SC01_studyBlocks.ts`: Bloques continuos de estudio $\ge \text{study\_block\_min\_duration}$ ($w=8$).
  - [x] `SC02_batchCooking.ts`: Meta semanal de sesiones de batch cooking ($w=5$).
  - [x] `SC03_socialGoals.ts`: Metas de horas con contactos conocidos (Juancito 5h, Juani 3h) ($w=6$).
  - [x] `SC04_circadianFatigue.ts`: Rastro de deuda de fatiga post-Ferro y boost automático de sueño ($w=9$).
  - [x] `SC05_evenDistribution.ts`: Distribución equilibrada de carga horaria entre días ($w=4$).
  - [x] `SC06_contactAvailability.ts`: Solapamiento con `busySlots` de contactos (informativo, $w=3$).
  - [x] `SC07_timePreferences.ts`: Respeto a ventanas de energía y estudio declaradas ($w=6$).
  - [x] `SC08_goodWeatherForSocial.ts`: Aprovechamiento de ventanas con $\text{ComfortScore} > 70$ para social/outdoor ($w=7$).
  - [x] `SC08b_badWeatherForProductivity.ts`: Canalización de mal clima ($< 40$) a productividad sin bloquear salidas ($w=4$).
  - [x] `SC09_noDeadTime.ts`: Penalización de tiempo muerto corto ($0 < \text{gap} < 20\text{ min}$) entre categorías distintas ($w=5$).
  - [x] `SC10_energyEconomy.ts`: Secuenciación por carga cognitiva/física y tiempos de recuperación por actividad ($w=8$).
  - [x] `SC11_mealsAndRest.ts`: Descanso y comidas en jornadas continuas $> 300\text{ min}$ ($w=7$).
  - [x] `SC12_totalTravelTime.ts`: Tiempo total de traslado diario $\le 90\text{ min}$ ($w=4$).
  - [x] `SC13_weeklyBudget.ts`: Techo presupuestario semanal en ARS ($w=3$, opcional).
  - [x] `SC14_contextSwitching.ts`: Límite de cambios de contexto diarios $\le 4$ ($w=6$).
  - [x] `SC15_serendipitySlots.ts`: Reserva de al menos 2 slots semanales para serendipia ($w=5$).
  - [x] `SC16_sensitiveContactBalance.ts`: Equilibrio de encuentros con vínculo delicado - Lau ($w=0$ default).

### Tarea 1.6: Optimización Local Hill Climbing con Trade-offs de GHC
- [x] Programar bucle de Hill Climbing (máximo 500 iteraciones) con generador de vecindario (desplazamientos de $\pm 15, \pm 30, \pm 60$ min e intercambio de slots).
- [x] Integrar lógica de trade-off de `GHC-01`: permitir acortar el buffer de cannabis solo si el Score neto resultante aumenta y el buffer se mantiene $\ge 120\text{ min}$.

### Tarea 1.7: Módulo de Post-Procesamiento (`postProcessor.ts`)
- [x] Crear `src/lib/scheduler/postProcessor.ts`.
- [x] Inserción automática de buffers: `buffer_post_consumo` (GHC-01), `sueno` post-Ferro (HC-03) y `traslado` laboral (HC-05).
- [x] Fusión automática de gaps de tiempo muerto $< \text{dead\_time\_threshold}$ (SC-09).
- [x] Inyección de `SocialOpportunitySlots` (SC-15) en ventanas de buen clima.

### Tarea 1.8: Generador de `ConstraintTrace` y Pipeline Unificado (`solver.ts`)
- [x] Crear `src/lib/scheduler/constraintTrace.ts` para construir el registro explicativo de cada evento movido/insertado.
- [x] Ensamblar el pipeline unificado en `src/lib/scheduler/solver.ts` (`solveMiMesa`).
- [x] Crear `__tests__/solver.integration.test.ts` y validar benchmark de resolución en $< 50\text{ms}$ para 30 eventos.

---

## Fase 2: Recurrencia, Persistencia Local-First y Privacidad

### Tarea 2.1: Expansión de Recurrencia y Gestión de Excepciones (`recurrence.ts`)
- [x] Crear `src/lib/scheduler/recurrence.ts`.
- [x] Implementar expansor temporal de `RecurrencePattern` a eventos individuales en la ventana de planificación.
- [x] Implementar lógica CRUD de `RecurrenceException`: `skip` (ignorar ocurrencia), `reschedule` (cambio de horario), `modify` (cambio de atributos).
- [x] Implementar división de patrones (*"Editar desde aquí en adelante"*).

### Tarea 2.2: Repositorio Local-First con Esquema Tipado (`LocalStorageStore.ts`)
- [x] Crear `src/lib/scheduler/storage/LocalStorageStore.ts`.
- [x] Implementar persistencia offline en `localStorage` con versionado y tipado estricto.
- [x] Diseñar cola de mutaciones offline (`syncQueue`).

### Tarea 2.3: Sincronización Supabase y Filtro de Privacidad Inquebrantable (`syncEngine.ts`)
- [x] Crear `src/lib/scheduler/storage/syncEngine.ts`.
- [x] Conectar cliente de Supabase (PostgreSQL).
- [x] Implementar función sanitizadora que remueva estrictamente `LOCAL_ONLY_FIELDS` (`cannabis_consumed`, `notesEncrypted`, `displayAlias`, `AILogs`) de todo payload de red.
- [x] Implementar resolución de conflictos *Last Write Wins* (`localVersion`, `deviceId`, `updatedAt`).

### Tarea 2.4: Exportación Segura a Calendarios Externos (`calendarExport.ts`)
- [x] Crear `src/lib/scheduler/calendarExport.ts`.
- [x] Implementar generador de archivos `.ics` compatibles con Google Calendar / Apple iCal.
- [x] Asegurar que eventos con `is_sensitive: true` se exporten únicamente como *"Ocupado"* sin detalles, contactos ni ubicación.

---

## Fase 3: Sistema Meteorológico, Estrategia Indoor y Modelo Social

### Tarea 3.1: Cliente Open-Meteo y Caché Local con TTL (`weatherService.ts`)
- [x] Crear `src/lib/scheduler/weatherService.ts`.
- [x] Conectar API pública de Open-Meteo para Mar del Plata (Lat `-38.00`, Lon `-57.55`).
- [x] Implementar caché local de 6 horas con modo offline fallback.

### Tarea 3.2: Motor de Cálculo de `ComfortScore`
- [x] Crear `src/lib/scheduler/weather/comfortScore.ts`.
- [x] Implementar cálculo matemático de penalidades: $P_{\text{lluvia}}$, $P_{\text{viento}}$ (con factor $k_{SE} = 1.3$ para cuadrante SE/S/E) y $P_{\text{frío}}$.
- [x] Calcular y normalizar `ComfortScore` en escala $0$ a $100$.

### Tarea 3.3: Estrategia Climática y Sensibilidad por Actividad
- [x] Crear suite de pruebas `__tests__/SC08_goodWeather.test.ts` y `__tests__/SC08b_badWeather.test.ts`.
- [x] Implementar regla: Salidas sociales con mal clima nunca son bloqueadas ni penalizadas.
- [x] Implementar tabla de sensibilidad climática y reubicación automática por clima extremo (§12.5).

### Tarea 3.4: Modelo Social en Tres Capas, Serendipia y Logística del Hogar
- [x] Crear `src/lib/scheduler/socialEngine.ts`.
- [x] Implementar gestión de contactos de Capa A (metas de Juancito y Juani; balance de Lau).
- [x] Implementar lógica logística del hogar: nunca sugerir la casa de Matu como fallback para salidas casuales o contactos en construcción (Capa B).
- [x] Generar e inyectar `SocialOpportunitySlots` (Capa C).

---

## Fase 4: UX Core, Calendario Espacial, Meta-Sliders y DiffViewer

### Tarea 4.1: Calendario Proporcional Diaria/Semanal y Lock Universal (`CalendarGrid.tsx`)
- [x] Crear `src/components/CalendarGrid.tsx`.
- [x] Implementar grilla temporal con representación espacial proporcional: la altura en píxeles es estrictamente lineal a la duración en minutos ($120\text{ min} = 2 \times 60\text{ min}$).
- [x] Implementar alternador fluido entre vista diaria y vista semanal.
- [x] Renderizar botón/toggle de **Universal Lock** en cada tarjeta de evento: muta `is_locked: true` e invoca `HC-02` inmediatamente.
- [x] Renderizar slots de serendipia con estilo visual distintivo (bordes punteados y fondo translúcido).

### Tarea 4.2: Sesión de Planificación Semanal en 5 Pasos (`WeeklyPlanningSession.tsx`)
- [x] Crear `src/components/WeeklyPlanningSession.tsx`.
- [x] Paso 1: Contexto personal, estado de ánimo y ajuste de los 3 Meta-Sliders.
- [x] Paso 2: Panorama meteorológico de MDP con tarjetas de oportunidades climáticas.
- [x] Paso 3: Confirmación y edición de excepciones en eventos fijos.
- [x] Paso 4: Intenciones sociales de la semana y cantidad de slots de serendipia.
- [x] Paso 5: Disparo del solver y apertura automática del `DiffViewerModal`.

### Tarea 4.3: DiffViewerModal con Tratamiento Especial de GHC (`DiffViewerModal.tsx`)
- [x] Crear `src/components/DiffViewerModal.tsx`.
- [x] Mostrar visualización comparativa *"Antes vs Después"* de eventos alterados.
- [x] Renderizar explicaciones en lenguaje natural extraídas del `ConstraintTrace`.
- [x] Implementar tarjeta destacada de advertencia para `GHC-01` acortado, indicando minutos de desvío, justificación e impacto neto en Score.
- [x] Implementar acciones: Aceptar, Descartar y Ajustar manualmente.

### Tarea 4.4: Meta-Sliders y Multiplicadores Reactivos (`MetaSliders.tsx`, `metaSliders.ts`)
- [x] Crear `src/lib/scheduler/metaSliders.ts` y `src/components/MetaSliders.tsx`.
- [x] Implementar los 3 meta-sliders: Profundidad vs Amplitud, Productividad vs Disfrute, Solo vs Con gente.
- [x] Programar cálculo de multiplicadores $[0.5, 2.0]$ sobre los pesos de las SC asociadas.
- [x] Integrar los 5 presets de contexto (Semana de examen, Período social, Recuperación post-Ferro, Conocer gente, Introspección).
- [x] Crear y correr pruebas unitarias en `__tests__/metaSliders.test.ts`.

### Tarea 4.5: Panel de Restricciones Configurable Inline (`ConstraintPanel.tsx`)
- [x] Crear `src/components/ConstraintPanel.tsx`.
- [x] Diseñar secciones para Meta-Sliders, HCs, GHCs y SCs con sliders de pesos (0–10) y toggles semanales.
- [x] Renderizar botón de edición inline (ícono ✏️) para cada uno de los **21 parámetros** de `params.ts`.
- [x] Conectar recálculo reactivo del Score en $< 50\text{ms}$ ante cambios de valores.

### Tarea 4.6: Widget de Score, Anillo de Color y Drill-Down (`ScoreWidget.tsx`)
- [x] Crear `src/components/ScoreWidget.tsx`.
- [x] Implementar anillo de color (Rojo $<40$, Amarillo $40-65$, Verde $66-85$, Destellos $86-100$).
- [x] Implementar vista de drill-down desglosando penalidades de GHC y SCs con consejos accionables de mejora.

---

## Fase 5: Features de Producto, LLM y Analíticas

### Tarea 5.1: Integración LLM Híbrida NLU / OCR (`geminiClient.ts`)
- [x] Crear `src/lib/scheduler/llm/geminiClient.ts` conectando SDK de Google Gemini Flash.
- [x] Implementar parser NLU para transformar lenguaje natural en objetos `Event`.
- [x] Implementar `SmartScheduleImporter` para OCR y parsing visual de capturas del SIU Guaraní y horarios de WhatsApp.
- [x] Implementar generador de síntesis/briefing matutino empático.
- [x] Garantizar funcionamiento degradado offline (el CSP opera 100% sin conexión).

### Tarea 5.2: Modo "¿Qué Hago Ahora?" con Estrategia Climática (`WhatShouldIDoNow.tsx`)
- [x] Crear `src/components/WhatShouldIDoNow.tsx` accesible mediante botón flotante ⚡.
- [x] Implementar algoritmo de ranking en horizonte de 2 horas según ánimo, ComfortScore actual, fatiga y metas pendientes.

### Tarea 5.3: Fatigue Tracker de Turno Nocturno
- [x] Crear `src/lib/scheduler/fatigueTracker.ts`.
- [x] Monitorear deuda acumulada de sueño post-Ferro.
- [x] Disparar alerta y sugerir activación del preset *"Recuperación post-Ferro"* si la fatiga supera el umbral crítico ($P_{04} > 0.6$).

### Tarea 5.4: Retrospectiva Semanal (`RetrospectiveView.tsx`)
- [x] Crear `src/components/RetrospectiveView.tsx`.
- [x] Comparar Score proyectado vs Score real alcanzado.
- [x] Registrar métricas de cumplimiento y motivos de fricción en movimientos de bloques.

### Tarea 5.5: Motor de Aprendizaje de Patrones No Invasivo (`patternLearning.ts`)
- [x] Crear `src/lib/scheduler/patternLearning.ts`.
- [x] Detectar patrones de comportamiento (umbral: confianza $\ge 0.75$, ocurrencias $N \ge 5$).
- [x] Presentar sugerencias no invasivas al usuario sin activar reglas automáticamente.

### Tarea 5.6: Modo Simulación "Y si..." (`SimulationMode.tsx`)
- [x] Crear `src/components/SimulationMode.tsx`.
- [x] Implementar clonación en memoria del schedule para evaluar escenarios hipotéticos y comparar métricas sin alterar datos reales.

### Tarea 5.7: Modelo Económico Estimado en ARS
- [x] Crear `src/lib/scheduler/economicModel.ts`.
- [x] Cargar tabla editable de costos estimados por actividad en pesos argentinos (§25).
- [x] Calcular gasto semanal estimado y evaluar control contra `weekly_budget_ars` (SC-13).

### Tarea 5.8: Arquitectura de Notificaciones y Throttling
- [x] Crear `src/lib/scheduler/notificationManager.ts`.
- [x] Configurar 3 niveles de prioridad (Crítica con sonido, Alta silenciosa, Media/Baja in-app).
- [x] Aplicar reglas de throttling (máximo 3 push/día) y silencio nocturno (23:00 a 08:00, excepto alerta de GHC-01).
- [x] Anonimizar notificaciones de eventos sensibles a formato `{emoji} {hora}`.

### Tarea 5.9: Flujo de Onboarding en 5 Pantallas
- [x] Crear `src/components/OnboardingWizard.tsx`.
- [x] Diseñar pantallas: 1) Trabajo y buffers, 2) Materias de facultad (importación SIU o manual), 3) Red social (hasta 3 contactos), 4) Meta-Sliders iniciales, 5) Lanzamiento a primera planificación semanal.
- [x] Implementar perfilado progresivo lazy para encuentros sucesivos.