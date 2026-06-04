import { getAdminDb } from "@/lib/firebase-admin";
import { ClubService } from "@/types";
import EditRecoverySessionClient from "@/app/(protected)/finances/recovery/[id]/edit-client";
import { notFound } from "next/navigation";
import { getSiteById } from "@/services/site-service";

export const dynamic = "force-dynamic";

async function getRecoverySession(id: string): Promise<ClubService> {
  // ... existing code ...
  const adminDb = getAdminDb();
  const doc = await adminDb.collection("sessions").doc(id).get();

  if (!doc.exists) {
    notFound();
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    siteId: "recoveryzone",
    name: data.name || "",
    description: data.description || "",
    price: data.price || 0,
    currency: "EUR",
    durationMinutes: data.duration || 0,
    category: data.category || "Други",
    zones: Array.isArray(data.zones)
      ? data.zones
      : typeof data.zones === "string"
        ? data.zones.split(",").filter(Boolean)
        : [],
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
    imageDisplayMode: data.imageDisplayMode || "collage",
  } as unknown as ClubService;
}

export default async function EditRecoverySessionPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const [data, site] = await Promise.all([
    getRecoverySession(id),
    getSiteById("recoveryzone"),
  ]);

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
      initialData={data}
      siteInventory={siteInventory}
    />
  );
}
