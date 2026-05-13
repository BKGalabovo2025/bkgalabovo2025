import { getAdminDb } from "@/lib/firebase-admin";
import { Service, ServiceSchema } from "./service.types";
import ServicesClientPage from "./client-page";
import { serializeFirestoreData } from "@/lib/serialize-utils";

export const dynamic = "force-dynamic";

// --- Service Fetching (Server-Side) ---
async function getServices(): Promise<Service[]> {
  try {
    const adminDb = getAdminDb();
    const servicesSnapshot = await adminDb.collection("clubServices").get();

    if (servicesSnapshot.empty) {
      return [];
    }

    const services = servicesSnapshot.docs.map((doc) => {
      const data = doc.data();
      const serializedData = serializeFirestoreData({
        id: doc.id,
        ...data,
      });
      return ServiceSchema.parse(serializedData);
    });

    return services as Service[];
  } catch (error) {
    console.error("Error fetching or parsing services from Firestore:", error);
    throw new Error("Failed to fetch or validate services from database.");
  }
}

export default async function ServicesPage() {
  let data: Service[] = [];
  let error: string | null = null;
  try {
    data = await getServices();
  } catch (e) {
    console.error("Failed to render ServicesPage:", e);
    error = "Неуспешно зареждане на услугите. Проверете сървърните логове.";
  }

  if (error) {
    return <div className="container mx-auto py-10 text-red-500">{error}</div>;
  }

  return <ServicesClientPage data={data} />;
}
