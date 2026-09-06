import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { serverCache } from "@/lib/server-cache";
import { ClubService } from "@/types";

import { Service, ServiceSchema } from "../finances/services/service.types";
import CatalogsClient from "./CatalogsClient";

export const dynamic = "force-dynamic";

export default async function CatalogsPage() {
  let services: Service[] = [];
  let recoveryServices: ClubService[] = [];

  try {
    const adminDb = getAdminDb();
    const result = await Promise.all([
      serverCache.get(
        "clubServices",
        async () => {
          const servicesSnapshot = await adminDb
            .collection("clubServices")
            .get();
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
              durationMinutes: data.duration || 0,
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
      ),
    ]);
    services = result[0];
    recoveryServices = result[1];
  } catch (error) {
    console.error("Failed to fetch catalog services:", error);
  }

  return (
    <div className="space-y-12 pb-24 duration-700 animate-in fade-in">
      <PageHeader
        title="Клубни Каталози"
        description="Управление на ценоразписи, тренировъчни програми и възстановителни процедури."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Каталози" },
        ]}
      />

      <Suspense
        fallback={
          <div className="p-8 text-center text-zinc-500">
            Зареждане на каталозите...
          </div>
        }
      >
        <CatalogsClient
          services={services}
          recoveryServices={recoveryServices}
        />
      </Suspense>
    </div>
  );
}
