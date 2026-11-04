import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import EditRecoverySessionClient from "@/app/(protected)/finances/recovery/[id]/edit-client";
import { getAdminDb } from "@/lib/firebase-admin";
import { getSiteByIdAdmin } from "@/services/admin/site-service.admin";
import { ClubService } from "@/types";

export const dynamic = "force-dynamic";

async function getRecoverySession(id: string): Promise<ClubService> {
  const adminDb = getAdminDb();
  const doc = await adminDb.collection("sessions").doc(id).get();

  if (!doc.exists) {
    notFound();
  }

  const data = doc.data()!;
  const parseZones = (z: unknown) => {
    if (Array.isArray(z)) return z;
    if (typeof z === "string") return z.split(",").filter(Boolean);
    return [];
  };
  return {
    id: doc.id,
    siteId: "recoveryzone",
    name: data.name || "",
    description: data.description || "",
    price: data.price || 0,
    currency: "EUR",
    durationMinutes: data.duration || 0,
    category: data.category || "Други",
    zones: parseZones(data.zones),
    athleteCount: data.athleteCount || 1,
    numberOfDays: data.numberOfDays || 1,
    proceduresPerDay: data.proceduresPerDay || 1,
    sessionType: data.sessionType || "Възстановяване",
    requiredResources: data.requiredResources || {
      attachments: { arms: 0, legs: 0, hips: 0 },
      compressors: 0,
    },
    requiresBooking: true,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate().toISOString()
      : data.createdAt || "",
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate().toISOString()
      : data.updatedAt || "",
    imageUrl: data.imageUrl || null,
  } as unknown as ClubService;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await getRecoverySession(id);
  return {
    title: `Редакция: ${session.name} | Възстановяване - БК Гълъбово`,
    description: `Редактиране на процедура ${session.name} в Recovery Zone.`,
  };
}

export default async function EditRecoverySessionCatalogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getRecoverySession(id);
  const site = await getSiteByIdAdmin("recoveryzone");

  const siteInventory = site?.inventory
    ? {
        compressors: site.inventory.compressors || 0,
        attachments: {
          arms: site.inventory.attachments?.arms || 0,
          legs: site.inventory.attachments?.legs || 0,
          hips: site.inventory.attachments?.hips || 0,
        },
      }
    : undefined;

  return (
    <EditRecoverySessionClient
      initialData={session}
      siteInventory={siteInventory}
    />
  );
}
