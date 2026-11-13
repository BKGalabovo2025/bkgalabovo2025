import { Metadata } from "next";
import React from "react";

import { CatalogsLayoutClient } from "@/components/catalogs/CatalogsLayoutClient";

export const metadata: Metadata = {
  title: "Клубни Каталози | БК Гълъбово",
  description:
    "Управление на ценоразписи, тренировъчни програми, клубни услуги, възстановяване и магазин.",
};

export default function CatalogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CatalogsLayoutClient>{children}</CatalogsLayoutClient>;
}
