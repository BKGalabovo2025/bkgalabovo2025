import type { Metadata } from "next";
import React from "react";

import { ClubServiceFormView } from "@/components/catalogs/forms/ClubServiceFormView";

export const metadata: Metadata = {
  title: "Добави клубна услуга | Каталози - БК Гълъбово",
  description:
    "Създаване на нова клубна услуга, наем на шкафче, ракета или наплитане в Бадминтон клуб Гълъбово.",
};

export default function NewClubServicePage() {
  return <ClubServiceFormView mode="add" />;
}
