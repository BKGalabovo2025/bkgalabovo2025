import { Metadata } from "next";

import TrainingsCatalogPage from "../trainings/page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Тренировки & Абонаменти | Каталози - БК Гълъбово",
  description:
    "Каталог на тренировъчни програми, абонаментни карти и индивидуални часове.",
};

export default function ServicesAliasPage() {
  return <TrainingsCatalogPage />;
}
