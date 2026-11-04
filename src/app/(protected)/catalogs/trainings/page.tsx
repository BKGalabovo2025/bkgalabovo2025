import { Metadata } from "next";

import {
  Service,
  ServiceSchema,
} from "@/app/(protected)/finances/services/service.types";
import { TrainingsCatalogView } from "@/components/catalogs/views/TrainingsCatalogView";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { serverCache } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Тренировки & Абонаменти | Каталози - БК Гълъбово",
  description:
    "Каталог на предлаганите тренировъчни програми, абонаментни карти и индивидуални часове.",
};

async function getTrainingsServices(): Promise<Service[]> {
  try {
    const adminDb = getAdminDb();
    return await serverCache.get(
      "clubServices",
      async () => {
        const snapshot = await adminDb.collection("clubServices").get();
        return snapshot.docs.map((doc) => {
          const data = doc.data();
          const serialized = serializeFirestoreData({
            id: doc.id,
            ...data,
          });
          return ServiceSchema.parse(serialized);
        });
      },
      300000
    );
  } catch (error) {
    console.error("Грешка при зареждане на тренировки:", error);
    return [];
  }
}

export default async function TrainingsCatalogPage() {
  const services = await getTrainingsServices();
  return <TrainingsCatalogView initialServices={services} />;
}
