import type { Metadata } from "next";
import React from "react";

import { TrainingServiceFormView } from "@/components/catalogs/forms/TrainingServiceFormView";

export const metadata: Metadata = {
  title: "Добави тренировка | Каталози - БК Гълъбово",
  description:
    "Създаване на нова тренировъчна програма, групов абонамент или индивидуален час в Бадминтон клуб Гълъбово.",
};

export default function NewTrainingProgramPage() {
  return <TrainingServiceFormView mode="add" />;
}
