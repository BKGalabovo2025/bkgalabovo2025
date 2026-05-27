import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { ServiceSchema } from "../finances/services/service.types";
import { ClubService } from "@/types";
import { serverCache } from "@/lib/server-cache";
import CatalogsClient from "./CatalogsClient";

export const dynamic = "force-dynamic";

export default async function CatalogsPage() {
  const adminDb = getAdminDb();

  const [services, recoveryServices] = await Promise.all([
    serverCache.get(
      "clubServices",
      async () => {
        const servicesSnapshot = await adminDb.collection("clubServices").get();
        return servicesSnapshot.docs.map((doc) => {
          const data = doc.data();
          const serializedData = serializeFirestoreData({
            id: doc.id,
            ...data,
          });
          return ServiceSchema.parse(serializedData);
        });
      },
      300000
    ),
    serverCache.get(
      "recoveryServices",
      async () => {
        const sessionsSnapshot = await adminDb.collection("sessions").get();
        return sessionsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            siteId: "recoveryzone",
            name: data.name || "Неименувана услуга",
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
            requiresBooking: true,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            requiredResources: data.requiredResources || null,
          } as ClubService;
        });
      },
      300000
    ),
  ]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      <PageHeader
        title="Клубни Каталози"
        description="Управление на ценоразписи, тренировъчни програми и възстановителни процедури."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Каталози" },
        ]}
      />

      <Suspense fallback={<div className="p-8 text-center text-zinc-500">Зареждане на каталозите...</div>}>
        <CatalogsClient services={services} recoveryServices={recoveryServices} />
      </Suspense>
    </div>
  );
}
