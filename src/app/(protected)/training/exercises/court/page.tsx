import { Metadata } from "next";

import ExercisesClient from "../exercises-client";

export const metadata: Metadata = {
  title: "Упражнения в зала | Тренировъчен процес",
  description:
    "Загрявка, техника, тактика, игри и разпускане за тренировки в залата.",
};

export default function Page() {
  return <ExercisesClient section="court" />;
}
