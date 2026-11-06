import { Metadata } from "next";

import ExercisesClient from "../exercises-client";

export const metadata: Metadata = {
  title: "Физическа подготовка | Упражнения",
  description: "Силови, скоростни и кондиционни упражнения.",
};

export default function Page() {
  return <ExercisesClient section="physical" />;
}
