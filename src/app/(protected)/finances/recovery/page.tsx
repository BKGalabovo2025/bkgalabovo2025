import { getAdminDb } from "@/lib/firebase-admin";
import { ClubService } from "@/types";
import RecoveryClientPage from "@/app/(protected)/finances/recovery/client-page";

export const dynamic = "force-dynamic";

async function getRecoveryServices(): Promise<ClubService[]> {
  try {
    const adminDb = getAdminDb();
    const sessionsSnapshot = await adminDb.collection("sessions").get();

    if (sessionsSnapshot.empty) {
      return [];
    }

    const services = sessionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      const parseZones = (z: any) => {
        if (Array.isArray(z)) return z;
        if (typeof z === "string") return z.split(",").filter(Boolean);
        return [];
      };
      // Unify mapping logic here as well or use a shared converter
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

    return services;
  } catch (error) {
    console.error("Error fetching recovery services:", error);
    throw new Error("Failed to fetch recovery services.");
  }
}

export default async function RecoveryCatalogPage() {
  let data: ClubService[] = [];
  let error: string | null = null;

  try {
    data = await getRecoveryServices();
  } catch {
    error = "Неуспешно зареждане на каталога за възстановяване.";
  }

  if (error) {
    return <div className="container mx-auto py-10 text-red-500">{error}</div>;
  }

  return <RecoveryClientPage data={data} />;
}
