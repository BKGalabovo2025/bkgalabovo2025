import { PHYSICAL_EXERCISES } from "./exercises/physical";
import { WARMUP_EXERCISES } from "./exercises/warmup";
import { TACTICAL_EXERCISES } from "./exercises/tactical";
import { TECHNICAL_EXERCISES } from "./exercises/technical";
import { MENTAL_EXERCISES } from "./exercises/mental";

import { PHYSICAL_EXERCISES_PART2 } from "./exercises/physical-part2";
import { TECHNICAL_EXERCISES_PART2 } from "./exercises/technical-part2";
import { TACTICAL_EXERCISES_PART2 } from "./exercises/tactical-part2";
import { MENTAL_EXERCISES_PART2 } from "./exercises/mental-part2";

export const INITIAL_BWF_EXERCISES = [
  ...WARMUP_EXERCISES,
  ...PHYSICAL_EXERCISES,
  ...PHYSICAL_EXERCISES_PART2,
  ...TECHNICAL_EXERCISES,
  ...TECHNICAL_EXERCISES_PART2,
  ...TACTICAL_EXERCISES,
  ...TACTICAL_EXERCISES_PART2,
  ...MENTAL_EXERCISES,
  ...MENTAL_EXERCISES_PART2,
];
