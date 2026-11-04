import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import { Service } from "@/app/(protected)/finances/services/service.types";
import { TrainingServiceFormView } from "@/components/catalogs/forms/TrainingServiceFormView";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";

export const dynamic = "force-dynamic";

async function getService(id: string): Promise<Service | null> {
  try {
    const db = getAdminDb();
    const doc = await db.collection("clubServices").doc(id).get();
    if (!doc.exists) return null;
    return serializeFirestoreData({ id: doc.id, ...doc.data() }) as Service;
  } catch (err) {
    console.error("Error fetching clubService:", err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const service = await getService(id);
  if (!service) {
    return { title: "Редакция на тренировка | Каталози - БК Гълъбово" };
  }
  return {
    title: `Редакция: ${service.name} | Каталози - БК Гълъбово`,
    description: `Редактиране на тренировъчна програма ${service.name}.`,
  };
}

export default async function EditTrainingProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getService(id);
  if (!service) {
    notFound();
  }

  return <TrainingServiceFormView mode="edit" initialService={service} />;
}
