import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import { ClubServiceFormView } from "@/components/catalogs/forms/ClubServiceFormView";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { GeneralService } from "@/types";

export const dynamic = "force-dynamic";

async function getGeneralService(id: string): Promise<GeneralService | null> {
  try {
    const db = getAdminDb();
    const doc = await db.collection("generalServices").doc(id).get();
    if (!doc.exists) return null;
    return serializeFirestoreData({
      id: doc.id,
      ...doc.data(),
    }) as GeneralService;
  } catch (err) {
    console.error("Error fetching general service:", err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const service = await getGeneralService(id);
  if (!service) {
    return { title: "Редакция на клубна услуга | Каталози - БК Гълъбово" };
  }
  return {
    title: `Редакция: ${service.name} | Каталози - БК Гълъбово`,
    description: `Редактиране на клубна услуга ${service.name}.`,
  };
}

export default async function EditClubServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getGeneralService(id);
  if (!service) {
    notFound();
  }

  return <ClubServiceFormView mode="edit" initialService={service} />;
}
