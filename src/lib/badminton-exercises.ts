import { MENTAL_EXERCISES } from "./exercises/mental";
import { MENTAL_EXERCISES_PART2 } from "./exercises/mental-part2";
import { PHYSICAL_EXERCISES } from "./exercises/physical";
import { PHYSICAL_EXERCISES_PART2 } from "./exercises/physical-part2";
import { TACTICAL_EXERCISES } from "./exercises/tactical";
import { TACTICAL_EXERCISES_PART2 } from "./exercises/tactical-part2";
import { TECHNICAL_EXERCISES } from "./exercises/technical";
import { TECHNICAL_EXERCISES_PART2 } from "./exercises/technical-part2";
import { WARMUP_EXERCISES } from "./exercises/warmup";

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
