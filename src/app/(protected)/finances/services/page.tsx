import { getAdminDb } from "@/lib/firebase-admin";
import { Service, ServiceSchema } from "./service.types";
import ServicesClientPage from "./client-page";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase-collections"; // <-- 1. ИМПОРТИРАМЕ КОНСТАНТИТЕ

export const dynamic = "force-dynamic";

async function getServices(): Promise<Service[]> {
  try {
    const adminDb = getAdminDb();
    // 2. ИЗПОЛЗВАМЕ КОНСТАНТАТА, вместо ръчно изписан низ
    const servicesSnapshot = await adminDb
      .collection(FIRESTORE_COLLECTIONS.CLUB_SERVICES)
      .get();

    if (servicesSnapshot.empty) {
      console.log(
        `No documents found in ${FIRESTORE_COLLECTIONS.CLUB_SERVICES} collection.`
      );
      return [];
    }

    const services: Service[] = servicesSnapshot.docs.map((doc) => {
      const data = doc.data();
      const serviceData = {
        id: doc.id,
        ...data,
      };
      return ServiceSchema.parse(serviceData);
    });

    return services;
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
