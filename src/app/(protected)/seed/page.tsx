"use client";

import { deleteDoc, doc, writeBatch } from "firebase/firestore";
import { useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { ALL_EXERCISES } from "@/lib/exercises/all";
import { db } from "@/lib/firebase"; // adjust path if needed
import { plannerService } from "@/services/planner-service";
import { useAppStore } from "@/store/use-app-store";

export default function SeedPage() {
  const { activeBranch } = useAppStore();
  const [loading, setLoading] = useState(false);

  const newExercises = ALL_EXERCISES;

  const handleSeed = async () => {
    if (
      !confirm(
        "Внимание: Това ще изтрие всички текущи упражнения и ще ги замени с новите базирани на BWF/BEC упражнения! Продължаваме ли?"
      )
    )
      return;

    setLoading(true);
    try {
      // 1. Fetch old exercises
      const oldExercises = await plannerService.getExercises(activeBranch);

      // 2. Delete old exercises
      // We process deletes in chunks to avoid firestore batch limits if there are many
      for (const ex of oldExercises) {
        if (ex.id) {
          await deleteDoc(doc(db, "exercises", ex.id));
        }
      }

      // 3. Batch write new exercises
      let batch = writeBatch(db);
      let count = 0;

      for (const ex of newExercises) {
        const id = uuidv4();
        const docRef = doc(db, "exercises", id);

        batch.set(docRef, {
          ...ex,
          id,
          siteId: activeBranch,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        count++;
        if (count === 490) {
          // Firestore batch limit is 500
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
      }

      toast.success(
        `Успешно изтрихме старите и заредихме ${newExercises.length} нови упражнения!`
      );
    } catch (error) {
      console.error(error);
      toast.error("Възникна грешка при зареждането на упражненията.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-2xl space-y-6 p-8 text-center">
      <h1 className="text-3xl font-bold">Нулиране на Упражненията</h1>
      <p className="text-zinc-600">
        Тази страница е специално създадена, за да изчисти базата данни от
        старите упражнения и да инжектира новия пакет с{" "}
        <strong>официални BWF и BEC упражнения</strong>.
      </p>

      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-800">
        <ul className="list-inside list-disc space-y-1">
          <li>Ще бъдат изтрити всички досегашни упражнения.</li>
          <li>Ще бъдат добавени {newExercises.length} нови упражнения.</li>
          <li>
            Текстът е форматиран специално за треньори и деца според официалните
            програми.
          </li>
        </ul>
      </div>

      <Button
        size="lg"
        onClick={handleSeed}
        disabled={loading}
        className="h-16 w-full bg-indigo-600 text-lg hover:bg-indigo-700"
      >
        {loading ? "Зареждане..." : "Изчисти и Инжектирай Новите Упражнения!"}
      </Button>
    </div>
  );
}
