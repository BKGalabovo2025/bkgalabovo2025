import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import { CampProvider } from "@/components/camps/CampContext";
import { CampLayoutClient } from "@/components/camps/CampLayoutClient";
import { getEventById } from "@/services/schedule-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const camp = await getEventById(id);
    if (!camp) {
      return {
        title: "Лагерът не е намерен | БК Гълъбово",
      };
    }
    return {
      title: `${camp.title} | Лагери | БК Гълъбово`,
      description: `Детайлна програма, график и участници за лагер ${camp.title}`,
    };
  } catch {
    return {
      title: "Лагер | БК Гълъбово",
    };
  }
}

export default async function CampDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const camp = await getEventById(id);

  if (!camp) {
    notFound();
  }

  return (
    <CampProvider camp={camp}>
      <CampLayoutClient>{children}</CampLayoutClient>
    </CampProvider>
  );
}
