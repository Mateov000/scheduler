export interface MetaSlidersState {
  depthVsAmplitudeSocial: number;   // 0 = sostener lo que tengo, 10 = conocer gente nueva
  productivityVsEnjoyment: number;  // 0 = enfocado en estudio/trabajo, 10 = modo social/disfrute
  introvertVsExtrovert: number;     // 0 = encontrarme a mí mismo (solo), 10 = encontrarme con gente
}

export const defaultMetaSliders: MetaSlidersState = {
  depthVsAmplitudeSocial: 5,
  productivityVsEnjoyment: 5,
  introvertVsExtrovert: 5,
};

export type MetaSliderPreset =
  | 'semana_examen'
  | 'periodo_social'
  | 'recuperacion_ferro'
  | 'conocer_gente'
  | 'introspeccion_relax';

export const metaSliderPresets: Record<MetaSliderPreset, { name: string; sliders: MetaSlidersState }> = {
  semana_examen: {
    name: 'Semana de examen',
    sliders: { depthVsAmplitudeSocial: 5, productivityVsEnjoyment: 1, introvertVsExtrovert: 4 },
  },
  periodo_social: {
    name: 'Período social intenso',
    sliders: { depthVsAmplitudeSocial: 6, productivityVsEnjoyment: 9, introvertVsExtrovert: 9 },
  },
  recuperacion_ferro: {
    name: 'Recuperación post-Ferro',
    sliders: { depthVsAmplitudeSocial: 5, productivityVsEnjoyment: 5, introvertVsExtrovert: 1 },
  },
  conocer_gente: {
    name: 'Quiero conocer gente',
    sliders: { depthVsAmplitudeSocial: 9, productivityVsEnjoyment: 7, introvertVsExtrovert: 9 },
  },
  introspeccion_relax: {
    name: 'Introspección / relax',
    sliders: { depthVsAmplitudeSocial: 5, productivityVsEnjoyment: 4, introvertVsExtrovert: 1 },
  },
};

export type MetaSliderValues = MetaSlidersState;
export type ContextPresetName =
  | 'Semana de examen'
  | 'Período social intenso'
  | 'Recuperación post-Ferro'
  | 'Quiero conocer gente'
  | 'Introspección / relax';

export const CONTEXT_PRESETS: Record<ContextPresetName, MetaSliderValues> = {
  'Semana de examen': metaSliderPresets.semana_examen.sliders,
  'Período social intenso': metaSliderPresets.periodo_social.sliders,
  'Recuperación post-Ferro': metaSliderPresets.recuperacion_ferro.sliders,
  'Quiero conocer gente': metaSliderPresets.conocer_gente.sliders,
  'Introspección / relax': metaSliderPresets.introspeccion_relax.sliders,
};

/**
 * Mapea un valor [0, 10] a un multiplicador [0.5, 2.0].
 * En 0 -> 0.5, en 5 -> 1.0 (neutro), en 10 -> 2.0.
 */
export function computeRawMultiplier(val: number): number {
  const clamped = Math.max(0, Math.min(10, val));
  if (clamped <= 5) {
    return 0.5 + (clamped / 5) * 0.5; // [0.5, 1.0]
  }
  return 1.0 + ((clamped - 5) / 5) * 1.0; // [1.0, 2.0]
}

/**
 * Multiplicador inverso para extremos izquierdos (0 -> 2.0 boost, 5 -> 1.0 neutro, 10 -> 0.5 reducción).
 */
export function computeInverseMultiplier(val: number): number {
  return computeRawMultiplier(10 - val);
}

/**
 * Computa el multiplicador final para cada Soft Constraint a partir del estado de los 3 meta-sliders.
 */
export function getMetaSliderMultipliers(sliders: MetaSlidersState): Record<string, number> {
  const multSocial = computeRawMultiplier(sliders.depthVsAmplitudeSocial);
  const multProd = computeRawMultiplier(sliders.productivityVsEnjoyment);
  const multExtro = computeRawMultiplier(sliders.introvertVsExtrovert);

  // Inversos para los extremos izquierdos
  const invSocial = computeInverseMultiplier(sliders.depthVsAmplitudeSocial);
  const invProd = computeInverseMultiplier(sliders.productivityVsEnjoyment);
  const invExtro = computeInverseMultiplier(sliders.introvertVsExtrovert);

  return {
    'SC-01': invProd,                       // Estudio: boost con productividad (izquierda)
    'SC-02': invProd,                       // Batch cooking: boost con productividad (izquierda)
    'SC-03': (invSocial + multProd + multExtro) / 3, // Metas amigos: boost sostener amigos, disfrute y extroversión
    'SC-04': invExtro,                      // Fatiga: boost con introversión/descanso
    'SC-05': 1.0,                           // Distribución equilibrada
    'SC-06': invSocial,                     // Disponibilidad amigos: boost sostener amigos
    'SC-07': 1.0,                           // Horarios personales
    'SC-08': (multProd + multExtro) / 2,    // Buen clima: boost disfrute y extroversión
    'SC-08b': (invProd + invExtro) / 2,     // Mal clima indoor: boost productividad e introversión
    'SC-09': 1.0,                           // Tiempo muerto
    'SC-10': 1.0,                           // Economía energética
    'SC-11': 1.0,                           // Comidas
    'SC-12': 1.0,                           // Traslados
    'SC-13': 1.0,                           // Presupuesto
    'SC-14': 1.0,                           // Cambios contexto
    'SC-15': (multSocial + multProd + multExtro) / 3, // Serendipia: boost conocer gente, disfrute y extroversión
    'SC-16': 1.0,                           // Vínculo Lau
  };
}
