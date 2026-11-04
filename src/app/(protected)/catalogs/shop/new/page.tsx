import type { Metadata } from "next";
import React from "react";

import { ProductFormView } from "@/components/catalogs/forms/ProductFormView";

export const metadata: Metadata = {
  title: "Добави артикул | Магазин - БК Гълъбово",
  description:
    "Добавяне на нов продукт, ракета, пера или спортен аксесоар в клубния магазин на Бадминтон клуб Гълъбово.",
};

export default function NewProductPage() {
  return <ProductFormView mode="add" />;
}
