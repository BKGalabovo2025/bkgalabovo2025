import { Metadata } from "next";

import ExercisesClient from "../exercises-client";

export const metadata: Metadata = {
  title: "Лагерни упражнения | Тренировъчен процес",
  description: "Плажни блокове, станционни ротации и мулти-шатъл за лагери.",
};

export default function Page() {
  return <ExercisesClient section="camp" />;
}
