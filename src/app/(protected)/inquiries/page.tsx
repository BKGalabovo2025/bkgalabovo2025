import type { Metadata } from "next";

import InquiriesPageClient from "./InquiriesPageClient";

export const metadata: Metadata = {
  title: "Запитвания от сайта | БК Гълъбово",
  description:
    "Преглед и управление на запитванията за тренировки, събития и лагери, изпратени от уебсайта.",
};

export const dynamic = "force-dynamic";

export default function InquiriesPage() {
  return <InquiriesPageClient />;
}
