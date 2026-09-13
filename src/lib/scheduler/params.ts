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
  travel_buffer_facultad: number;         // default: 40 min, min: 15, max: 90

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
  travel_buffer_facultad: 40,
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
