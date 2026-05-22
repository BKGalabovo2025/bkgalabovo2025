import { cookies } from "next/headers";
import { PageHeader } from "@/components/layout/page-header";
import { getFinancesOverviewDataAction } from "@/lib/actions/finances-server";
import { getInventorySalesServerAction } from "@/lib/actions/sales-server";
import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { ServiceSchema } from "./services/service.types";
import { ClubService } from "@/types";
import FinancesClient from "./FinancesClient";
import { serverCache } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

// Helper to convert Firestore timestamps inside objects into ISO strings for client compatibility
const convertTimestamps = (val: any): any => {
  if (!val) return val;
  if (typeof val.toDate === "function") {
    return val.toDate().toISOString();
  }
  if (val instanceof admin.firestore.Timestamp) {
    return val.toDate().toISOString();
  }
  if (Array.isArray(val)) {
    return val.map(convertTimestamps);
  }
  if (typeof val === "object") {
    const copy: any = {};
    for (const key of Object.keys(val)) {
      copy[key] = convertTimestamps(val[key]);
    }
    return copy;
  }
  return val;
};

export default async function FinancesPage() {
  const cookieStore = await cookies();
  const activeBranch = cookieStore.get("activeBranch")?.value || "bkgalabovo";

  const adminDb = getAdminDb();

  // Parallel fetch of all essential finance data using in-memory cache helpers
  const [
    financesResult,
    salesResult,
    initialMembers,
    services,
    recoveryServices,
  ] = await Promise.all([
    getFinancesOverviewDataAction(activeBranch),
    getInventorySalesServerAction(activeBranch),
    serverCache.get(
      `members:${activeBranch || "all"}`,
      async () => {
        let membersQuery: admin.firestore.Query = adminDb.collection("members");
        if (activeBranch && activeBranch !== "bkgalabovo") {
          membersQuery = membersQuery.where("siteId", "==", activeBranch);
        }
        // Use select projection to minimize firestore read payload
        const snap = await membersQuery
          .select("firstName", "lastName", "siteId")
          .get();
        return snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...convertTimestamps(data),
          };
        });
      },
      60000 // 60 seconds members cache TTL
    ),
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
      300000 // 5 minutes catalog cache TTL
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
      300000 // 5 minutes catalog cache TTL
    ),
  ]);

  // 1. Finances Dashboard Stats
  const financesData =
    financesResult.success && financesResult.data
      ? financesResult.data
      : {
          dailyTrend: [],
          categories: [
            { name: "Няма продажби", value: 0.01, color: "#e4e4e7" },
          ],
          totalRevenue: 0,
          transactionCount: 0,
          averageTransactionValue: 0,
        };

  // 2. Initial Sales list
  const initialSales = salesResult.success ? salesResult.data || [] : [];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      <PageHeader
        title="Централна Финансова Каса & Услуги"
        description="Единно работно пространство за бързи разплащания, членства, закриване на такси, инвентар и управление на клубни услуги."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Каса & Услуги" },
        ]}
      />

      <FinancesClient
        initialSales={initialSales}
        initialMembers={initialMembers}
        services={services}
        recoveryServices={recoveryServices}
        financesData={financesData}
      />
    </div>
  );
}
