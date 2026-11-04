import { Metadata } from "next";

import TrainingsCatalogPage from "./trainings/page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Клубни Каталози | БК Гълъбово",
  description:
    "Управление на ценоразписи, тренировъчни програми, клубни услуги, възстановяване и магазин.",
};

export default function CatalogsIndexPage() {
  return <TrainingsCatalogPage />;
}
