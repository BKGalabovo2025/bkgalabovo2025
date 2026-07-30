import { Metadata } from "next";

import ExercisesClient from "./exercises-client";

export const metadata: Metadata = {
  title: "База с Упражнения | Тренировъчен процес",
  description: "Официална база с упражнения от BWF и създаване на собствени.",
};

export default function ExercisesPage() {
  return <ExercisesClient />;
}
