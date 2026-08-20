import fs from "fs";
import path from "path";
// @ts-ignore
import { ALL_EXERCISES } from "../src/lib/exercises/all.ts";

const stats = {
  total: ALL_EXERCISES.length,
  categories: {} as Record<string, number>,
  kineticChains: {} as Record<string, number>,
  equipment: {} as Record<string, number>,
  missingVideo: 0,
  missingCoachingPoints: 0,
  levels: {} as Record<number, number>,
};

ALL_EXERCISES.forEach((ex) => {
  // Category
  stats.categories[ex.category] = (stats.categories[ex.category] || 0) + 1;

  // Complexity
  if (ex.complexityLevel) {
    stats.levels[ex.complexityLevel] =
      (stats.levels[ex.complexityLevel] || 0) + 1;
  }

  // Kinetic chain
  if (ex.targetKineticChain) {
    ex.targetKineticChain.forEach((chain: string) => {
      stats.kineticChains[chain] = (stats.kineticChains[chain] || 0) + 1;
    });
  }

  // Equipment
  const eq = ex.equipment ? ex.equipment.toLowerCase() : "none";
  if (eq.includes("собствено тегло") || eq.trim() === "") {
    stats.equipment["bodyweight"] = (stats.equipment["bodyweight"] || 0) + 1;
  } else if (eq.includes("дъмбел") || eq.includes("пудовка")) {
    stats.equipment["weights"] = (stats.equipment["weights"] || 0) + 1;
  } else if (eq.includes("щанга")) {
    stats.equipment["barbell"] = (stats.equipment["barbell"] || 0) + 1;
  } else if (eq.includes("машин") || eq.includes("скрипец")) {
    stats.equipment["machines"] = (stats.equipment["machines"] || 0) + 1;
  } else if (
    eq.includes("перо") ||
    eq.includes("пера") ||
    eq.includes("совалк")
  ) {
    stats.equipment["shuttles"] = (stats.equipment["shuttles"] || 0) + 1;
  } else if (
    eq.includes("стълбичка") ||
    eq.includes("въже") ||
    eq.includes("ластик") ||
    eq.includes("конус") ||
    eq.includes("медицинска")
  ) {
    stats.equipment["functional"] = (stats.equipment["functional"] || 0) + 1;
  } else {
    stats.equipment["other"] = (stats.equipment["other"] || 0) + 1;
  }

  // Missing data
  if (!ex.videoUrl) stats.missingVideo++;
  if (!ex.coachingPoints || ex.coachingPoints.length === 0)
    stats.missingCoachingPoints++;
});

fs.writeFileSync(
  path.join(process.cwd(), "scripts", "analysis-results.json"),
  JSON.stringify(stats, null, 2),
  "utf-8"
);
console.log("Analysis complete. Results written to analysis-results.json");
