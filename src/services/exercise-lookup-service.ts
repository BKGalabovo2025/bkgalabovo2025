/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional */
import { collection, getDocs, limit, query } from "firebase/firestore";

import { INITIAL_BWF_EXERCISES } from "@/lib/badminton-exercises";
import { db } from "@/lib/firebase";
import { Exercise } from "@/types/planner.types";

let cachedDbExercises: Exercise[] | null = null;

/**
 * Normalizes string for fuzzy keyword comparison.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Finds exercise details either from the comprehensive BWF catalog
 * or the Firestore 'exercises' collection.
 */
export async function findExerciseDetails(
  exerciseName: string,
  techniqueTip?: string,
  _siteId?: string
): Promise<Partial<Exercise>> {
  const cleanSearch = normalizeText(exerciseName);

  // 1. Check in INITIAL_BWF_EXERCISES first (instant in-memory lookup)
  const exactStatic = INITIAL_BWF_EXERCISES.find(
    (ex) => normalizeText(ex.name) === cleanSearch
  );
  if (exactStatic) {
    return {
      ...exactStatic,
      coachingPoints:
        exactStatic.coachingPoints && exactStatic.coachingPoints.length > 0
          ? exactStatic.coachingPoints
          : techniqueTip
            ? [techniqueTip]
            : [],
    };
  }

  // Fuzzy static match (containment)
  const fuzzyStatic = INITIAL_BWF_EXERCISES.find((ex) => {
    const exNorm = normalizeText(ex.name);
    return cleanSearch.includes(exNorm) || exNorm.includes(cleanSearch);
  });
  if (fuzzyStatic) {
    return {
      ...fuzzyStatic,
      coachingPoints:
        fuzzyStatic.coachingPoints && fuzzyStatic.coachingPoints.length > 0
          ? fuzzyStatic.coachingPoints
          : techniqueTip
            ? [techniqueTip]
            : [],
    };
  }

  // 2. Check in Firestore 'exercises' collection
  try {
    if (!cachedDbExercises && db) {
      const snap = await getDocs(
        query(collection(db, "exercises"), limit(200))
      );
      cachedDbExercises = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Exercise
      );
    }

    if (cachedDbExercises && cachedDbExercises.length > 0) {
      const exactDb = cachedDbExercises.find(
        (ex) => normalizeText(ex.name) === cleanSearch
      );
      if (exactDb) return exactDb;

      const fuzzyDb = cachedDbExercises.find((ex) => {
        const exNorm = normalizeText(ex.name);
        return cleanSearch.includes(exNorm) || exNorm.includes(cleanSearch);
      });
      if (fuzzyDb) return fuzzyDb;
    }
  } catch (err) {
    console.warn("Could not query exercises collection:", err);
  }

  // 3. Fallback structured record based on available exercise data
  return {
    name: exerciseName,
    description: `Специфично упражнение за бадминтон подготовка от тренировъчния план.${
      techniqueTip ? ` ${techniqueTip}` : ""
    }`,
    category:
      cleanSearch.includes("совалк") ||
      cleanSearch.includes("бягане") ||
      cleanSearch.includes("подскок")
        ? "physical"
        : cleanSearch.includes("загряв")
          ? "warmup"
          : cleanSearch.includes("стречинг")
            ? "cooldown"
            : "technique",
    coachingPoints: techniqueTip
      ? [techniqueTip]
      : [
          "Следете за чистотата на замаха, стабилен баланс на тялото и експлозивна реакция с краката.",
        ],
    durationMinutes: 15,
    location: ["court"],
    equipment: ["Ракета", "Пера"],
    intensity: 3,
  };
}
