export interface UserActionRecord {
  id: string;
  actionType: 'rescheduled' | 'canceled' | 'shortened' | 'extended';
  category: string;
  dayOfWeek: number; // 0 = Sun ... 6 = Sat
  context?: string; // e.g., 'post_ferro'
  timestamp: Date;
}

export interface PatternSuggestion {
  id: string;
  confidence: number; // 0.0 to 1.0 (>= 0.75 required)
  observationCount: number; // >= 5 required
  description: string;
  proposedAction: {
    type: 'adjust_param' | 'add_override' | 'change_study_hours';
    targetKey: string;
    suggestedValue: any;
  };
}

/**
 * Detects recurrent user habits without ever imposing or silently mutating constraints (§23).
 * Requires statistical confidence >= 0.75 across at least N >= 5 occurrences.
 */
export function detectSchedulePatterns(
  historicalActions: UserActionRecord[]
): PatternSuggestion[] {
  const suggestions: PatternSuggestion[] = [];

  // 1. Pattern: Post-Ferro study reschedules
  const postFerroReschedules = historicalActions.filter(
    (a) => a.actionType === 'rescheduled' && a.category === 'estudio' && a.context === 'post_ferro'
  );

  if (postFerroReschedules.length >= 5) {
    const totalPostFerroActions = historicalActions.filter(
      (a) => a.category === 'estudio' && a.context === 'post_ferro'
    ).length;

    const confidence = totalPostFerroActions > 0 ? postFerroReschedules.length / totalPostFerroActions : 0;

    if (confidence >= 0.75) {
      suggestions.push({
        id: 'pat_post_ferro_study_delay',
        confidence: Math.round(confidence * 100) / 100,
        observationCount: postFerroReschedules.length,
        description: `Notamos que postergaste el estudio post-Ferro ${postFerroReschedules.length} veces (${Math.round(confidence * 100)}% de los casos). ¿Querés que evitemos programar estudio pesado en las mañanas post-Ferro?`,
        proposedAction: {
          type: 'adjust_param',
          targetKey: 'cognitive_ban_post_ferro',
          suggestedValue: 120,
        },
      });
    }
  }

  // 2. Pattern: Gym duration extended
  const gymExtensions = historicalActions.filter(
    (a) => a.actionType === 'extended' && a.category === 'gym'
  );

  if (gymExtensions.length >= 5) {
    const totalGymActions = historicalActions.filter((a) => a.category === 'gym').length;
    const confidence = totalGymActions > 0 ? gymExtensions.length / totalGymActions : 0;

    if (confidence >= 0.75) {
      suggestions.push({
        id: 'pat_gym_extension',
        confidence: Math.round(confidence * 100) / 100,
        observationCount: gymExtensions.length,
        description: `Extendiste tus sesiones de gimnasio ${gymExtensions.length} veces. ¿Querés planificar por defecto bloques de 90 min en vez de 60 min?`,
        proposedAction: {
          type: 'adjust_param',
          targetKey: 'gym_default_duration',
          suggestedValue: 90,
        },
      });
    }
  }

  return suggestions;
}
