import { Metadata } from "next";

import { RecoveryCatalogView } from "@/components/catalogs/views/RecoveryCatalogView";
import { getAdminDb } from "@/lib/firebase-admin";
import { serverCache } from "@/lib/server-cache";
import { ClubService } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Възстановяване (Recovery) | Каталози - БК Гълъбово",
  description:
    "Процедури за възстановяване, сауна, криотерапия, масажи и специализирани пакети в Recovery Zone.",
};

async function getRecoveryCatalogServices(): Promise<ClubService[]> {
  try {
    const adminDb = getAdminDb();
    return await serverCache.get(
      "recoveryServices",
      async () => {
        const snapshot = await adminDb.collection("sessions").get();
        return snapshot.docs.map((doc) => {
          const data = doc.data();
          const parseZones = (z: unknown) => {
            if (Array.isArray(z)) return z;
            if (typeof z === "string") return z.split(",").filter(Boolean);
            return [];
          };
          return {
            id: doc.id,
            siteId: "recoveryzone",
            name: data.name || "Неименувана услуга",
            description: data.description || "",
            price: data.price || 0,
            currency: "EUR",
            durationMinutes: data.durationMinutes ?? data.duration ?? 60,
            category: data.category || "Други",
            zones: parseZones(data.zones),
            athleteCount: data.athleteCount || 1,
            numberOfDays: data.numberOfDays || 1,
            proceduresPerDay: data.proceduresPerDay || 1,
            sessionType: data.sessionType || "Възстановяване",
            requiresBooking: true,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toISOString()
              : data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate
              ? data.updatedAt.toDate().toISOString()
              : data.updatedAt || new Date().toISOString(),
            requiredResources: data.requiredResources || null,
            imageUrl: data.imageUrl || null,
            imageDisplayMode: data.imageDisplayMode || "collage",
          } as unknown as ClubService;
        });
      },
      300000
    );
  } catch (error) {
    console.error("Грешка при зареждане на възстановителни процедури:", error);
    return [];
  }
}

export default async function RecoveryCatalogPage() {
  const services = await getRecoveryCatalogServices();
  return <RecoveryCatalogView initialServices={services} />;
}
