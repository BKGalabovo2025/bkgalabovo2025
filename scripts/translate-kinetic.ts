import fs from "fs";
import path from "path";
// @ts-ignore
import { ALL_EXERCISES } from "../src/lib/exercises/all.ts";

const translateChain = (chain: string) => {
  switch (chain) {
    case "ankle-stiffness":
      return "Стабилност на глезена";
    case "core-rotation":
      return "Ротация на ядрото";
    case "hip-mobility":
      return "Мобилност на таза";
    case "shoulder-deceleration":
      return "Спиране на рамото";
    case "shoulder-acceleration":
      return "Ускорение на рамото";
    case "wrist-pronation":
      return "Движение на китката";
    default:
      return chain;
  }
};

const updatedExercises = ALL_EXERCISES.map((ex) => {
  if (ex.targetKineticChain) {
    ex.targetKineticChain = ex.targetKineticChain.map(translateChain);
  }
  return ex;
});

const content = `import { Exercise } from "@/types/planner.types";\n\nexport const ALL_EXERCISES: Omit<Exercise, "id" | "siteId" | "createdAt" | "updatedAt">[] = ${JSON.stringify(updatedExercises, null, 2)};\n`;

fs.writeFileSync(
  path.join(process.cwd(), "src/lib/exercises/all.ts"),
  content,
  "utf-8"
);
console.log("Translated kinetic chains.");
