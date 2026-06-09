export interface ExerciseData {
  name: string;
  category: string;
  equipment: string;
  muscles: string[];
  musclesSec: string[];
  description: string;
}

// Muscle IDs must match the SVG BodyDiagram component IDs
export const EXERCISES: ExerciseData[] = [
  // ── CHEST ──
  {
    name: "Barbell Bench Press",
    category: "compound",
    equipment: "barbell",
    muscles: ["chest_left", "chest_right", "front_delt_left", "front_delt_right", "tricep_left", "tricep_right"],
    musclesSec: ["serratus_left", "serratus_right"],
    description: "Flat barbell bench press — the king of chest movements.",
  },
  {
    name: "Incline Bench Press",
    category: "compound",
    equipment: "barbell",
    muscles: ["chest_left", "chest_right", "front_delt_left", "front_delt_right", "tricep_left", "tricep_right"],
    musclesSec: ["serratus_left", "serratus_right"],
    description: "Upper chest emphasis with a 30–45° incline.",
  },
  {
    name: "Dumbbell Bench Press",
    category: "compound",
    equipment: "dumbbell",
    muscles: ["chest_left", "chest_right", "front_delt_left", "front_delt_right", "tricep_left", "tricep_right"],
    musclesSec: ["serratus_left", "serratus_right"],
    description: "Greater range of motion than barbell variation.",
  },
  {
    name: "Cable Fly",
    category: "isolation",
    equipment: "cable",
    muscles: ["chest_left", "chest_right"],
    musclesSec: ["front_delt_left", "front_delt_right"],
    description: "Constant tension cable fly for chest stretch and squeeze.",
  },
  {
    name: "Dips",
    category: "compound",
    equipment: "bodyweight",
    muscles: ["chest_left", "chest_right", "tricep_left", "tricep_right"],
    musclesSec: ["front_delt_left", "front_delt_right"],
    description: "Compound push movement. Lean forward for chest focus.",
  },

  // ── BACK ──
  {
    name: "Barbell Row",
    category: "compound",
    equipment: "barbell",
    muscles: ["lat_left", "lat_right", "rhomboid", "rear_delt_left", "rear_delt_right"],
    musclesSec: ["bicep_left", "bicep_right", "lower_trap", "forearm_left", "forearm_right"],
    description: "Bent-over barbell row for full back thickness.",
  },
  {
    name: "Deadlift",
    category: "compound",
    equipment: "barbell",
    muscles: ["lower_back", "glute_left", "glute_right", "hamstring_left", "hamstring_right"],
    musclesSec: ["quad_left", "quad_right", "upper_trap", "lat_left", "lat_right", "forearm_left", "forearm_right"],
    description: "The ultimate full-body posterior chain movement.",
  },
  {
    name: "Pull-Up",
    category: "compound",
    equipment: "bodyweight",
    muscles: ["lat_left", "lat_right", "bicep_left", "bicep_right"],
    musclesSec: ["rhomboid", "rear_delt_left", "rear_delt_right", "lower_trap"],
    description: "Overhand grip pull-up for lat width.",
  },
  {
    name: "Chin-Up",
    category: "compound",
    equipment: "bodyweight",
    muscles: ["lat_left", "lat_right", "bicep_left", "bicep_right"],
    musclesSec: ["chest_left", "chest_right", "lower_trap"],
    description: "Underhand grip — more bicep involvement than pull-up.",
  },
  {
    name: "Lat Pulldown",
    category: "compound",
    equipment: "cable",
    muscles: ["lat_left", "lat_right"],
    musclesSec: ["bicep_left", "bicep_right", "rhomboid", "rear_delt_left", "rear_delt_right"],
    description: "Machine lat pulldown for vertical pulling strength.",
  },
  {
    name: "Seated Cable Row",
    category: "compound",
    equipment: "cable",
    muscles: ["lat_left", "lat_right", "rhomboid", "rear_delt_left", "rear_delt_right"],
    musclesSec: ["bicep_left", "bicep_right", "lower_trap"],
    description: "Horizontal pull for mid-back thickness.",
  },
  {
    name: "Face Pull",
    category: "isolation",
    equipment: "cable",
    muscles: ["rear_delt_left", "rear_delt_right", "rhomboid"],
    musclesSec: ["upper_trap", "lower_trap"],
    description: "Shoulder health and rear delt isolation.",
  },

  // ── SHOULDERS ──
  {
    name: "Overhead Press",
    category: "compound",
    equipment: "barbell",
    muscles: ["front_delt_left", "front_delt_right", "side_delt_left", "side_delt_right", "tricep_left", "tricep_right"],
    musclesSec: ["upper_trap", "serratus_left", "serratus_right"],
    description: "Standing barbell overhead press for shoulder strength.",
  },
  {
    name: "Dumbbell Shoulder Press",
    category: "compound",
    equipment: "dumbbell",
    muscles: ["front_delt_left", "front_delt_right", "side_delt_left", "side_delt_right", "tricep_left", "tricep_right"],
    musclesSec: ["upper_trap"],
    description: "Seated or standing dumbbell overhead press.",
  },
  {
    name: "Lateral Raise",
    category: "isolation",
    equipment: "dumbbell",
    muscles: ["side_delt_left", "side_delt_right"],
    musclesSec: ["upper_trap"],
    description: "Dumbbell lateral raise for shoulder width.",
  },
  {
    name: "Front Raise",
    category: "isolation",
    equipment: "dumbbell",
    muscles: ["front_delt_left", "front_delt_right"],
    musclesSec: ["upper_trap", "chest_left", "chest_right"],
    description: "Targets the anterior deltoid specifically.",
  },

  // ── LEGS ──
  {
    name: "Barbell Squat",
    category: "compound",
    equipment: "barbell",
    muscles: ["quad_left", "quad_right", "glute_left", "glute_right"],
    musclesSec: ["hamstring_left", "hamstring_right", "lower_back", "calf_left", "calf_right"],
    description: "High-bar or low-bar squat — legs staple.",
  },
  {
    name: "Romanian Deadlift",
    category: "compound",
    equipment: "barbell",
    muscles: ["hamstring_left", "hamstring_right", "glute_left", "glute_right"],
    musclesSec: ["lower_back", "forearm_left", "forearm_right"],
    description: "Hip hinge with straight legs for hamstring stretch.",
  },
  {
    name: "Leg Press",
    category: "compound",
    equipment: "machine",
    muscles: ["quad_left", "quad_right", "glute_left", "glute_right"],
    musclesSec: ["hamstring_left", "hamstring_right"],
    description: "Machine leg press for quad and glute development.",
  },
  {
    name: "Leg Curl",
    category: "isolation",
    equipment: "machine",
    muscles: ["hamstring_left", "hamstring_right"],
    musclesSec: ["calf_left", "calf_right"],
    description: "Lying or seated hamstring curl.",
  },
  {
    name: "Leg Extension",
    category: "isolation",
    equipment: "machine",
    muscles: ["quad_left", "quad_right"],
    musclesSec: [],
    description: "Knee extension for quad isolation.",
  },
  {
    name: "Bulgarian Split Squat",
    category: "compound",
    equipment: "dumbbell",
    muscles: ["quad_left", "quad_right", "glute_left", "glute_right"],
    musclesSec: ["hamstring_left", "hamstring_right"],
    description: "Rear foot elevated split squat for unilateral leg strength.",
  },
  {
    name: "Hip Thrust",
    category: "compound",
    equipment: "barbell",
    muscles: ["glute_left", "glute_right"],
    musclesSec: ["hamstring_left", "hamstring_right"],
    description: "Barbell hip thrust for glute hypertrophy.",
  },
  {
    name: "Calf Raise",
    category: "isolation",
    equipment: "machine",
    muscles: ["calf_left", "calf_right", "calf_back_left", "calf_back_right"],
    musclesSec: [],
    description: "Standing or seated calf raise.",
  },

  // ── ARMS ──
  {
    name: "Barbell Curl",
    category: "isolation",
    equipment: "barbell",
    muscles: ["bicep_left", "bicep_right"],
    musclesSec: ["forearm_left", "forearm_right"],
    description: "Classic barbell curl for bicep mass.",
  },
  {
    name: "Dumbbell Curl",
    category: "isolation",
    equipment: "dumbbell",
    muscles: ["bicep_left", "bicep_right"],
    musclesSec: ["forearm_left", "forearm_right"],
    description: "Alternating or simultaneous dumbbell curl.",
  },
  {
    name: "Hammer Curl",
    category: "isolation",
    equipment: "dumbbell",
    muscles: ["bicep_left", "bicep_right", "forearm_left", "forearm_right"],
    musclesSec: [],
    description: "Neutral grip curl targeting the brachialis.",
  },
  {
    name: "Tricep Pushdown",
    category: "isolation",
    equipment: "cable",
    muscles: ["tricep_left", "tricep_right"],
    musclesSec: [],
    description: "Cable pushdown for tricep isolation.",
  },
  {
    name: "Skull Crusher",
    category: "isolation",
    equipment: "barbell",
    muscles: ["tricep_left", "tricep_right"],
    musclesSec: [],
    description: "Lying tricep extension for all three heads.",
  },
  {
    name: "Close-Grip Bench Press",
    category: "compound",
    equipment: "barbell",
    muscles: ["tricep_left", "tricep_right", "chest_left", "chest_right"],
    musclesSec: ["front_delt_left", "front_delt_right"],
    description: "Narrow grip bench for tricep emphasis.",
  },

  // ── CORE ──
  {
    name: "Plank",
    category: "isolation",
    equipment: "bodyweight",
    muscles: ["upper_abs", "lower_abs"],
    musclesSec: ["oblique_left", "oblique_right", "lower_back"],
    description: "Isometric core hold.",
  },
  {
    name: "Cable Crunch",
    category: "isolation",
    equipment: "cable",
    muscles: ["upper_abs", "lower_abs"],
    musclesSec: ["oblique_left", "oblique_right"],
    description: "Weighted cable crunch for ab development.",
  },
  {
    name: "Ab Wheel Rollout",
    category: "isolation",
    equipment: "other",
    muscles: ["upper_abs", "lower_abs"],
    musclesSec: ["serratus_left", "serratus_right", "lower_back"],
    description: "Ab wheel rollout for full core development.",
  },

  // ── TRAPS ──
  {
    name: "Barbell Shrug",
    category: "isolation",
    equipment: "barbell",
    muscles: ["upper_trap"],
    musclesSec: ["lower_trap"],
    description: "Barbell shrug for upper trap hypertrophy.",
  },
];

export const MUSCLE_LABEL_MAP: Record<string, string> = {
  chest_left: "Chest",
  chest_right: "Chest",
  front_delt_left: "Front Delts",
  front_delt_right: "Front Delts",
  side_delt_left: "Side Delts",
  side_delt_right: "Side Delts",
  rear_delt_left: "Rear Delts",
  rear_delt_right: "Rear Delts",
  bicep_left: "Biceps",
  bicep_right: "Biceps",
  tricep_left: "Triceps",
  tricep_right: "Triceps",
  forearm_left: "Forearms",
  forearm_right: "Forearms",
  upper_abs: "Abs",
  lower_abs: "Abs",
  oblique_left: "Obliques",
  oblique_right: "Obliques",
  serratus_left: "Serratus",
  serratus_right: "Serratus",
  quad_left: "Quads",
  quad_right: "Quads",
  hamstring_left: "Hamstrings",
  hamstring_right: "Hamstrings",
  calf_left: "Calves",
  calf_right: "Calves",
  calf_back_left: "Calves",
  calf_back_right: "Calves",
  glute_left: "Glutes",
  glute_right: "Glutes",
  lat_left: "Lats",
  lat_right: "Lats",
  upper_trap: "Upper Traps",
  lower_trap: "Lower Traps",
  rhomboid: "Rhomboids",
  lower_back: "Lower Back",
};

export function getUniqueMuscleLabels(muscleIds: string[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const id of muscleIds) {
    const label = MUSCLE_LABEL_MAP[id];
    if (label && !seen.has(label)) {
      seen.add(label);
      labels.push(label);
    }
  }
  return labels;
}
