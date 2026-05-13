import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  setDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Site } from "@/types/site.types";

const SITES_COLLECTION = "sites";

export const docToSite = (doc: any): Site | null => {
  const exists = typeof doc.exists === "function" ? doc.exists() : doc.exists;
  if (!doc.id || !exists) return null;
  const data = doc.data() || {};

  // Map recoveryInventory to standard inventory if it exists
  let inventory = data.inventory || { courts: 0, machines: 0 };
  if (data.recoveryInventory) {
    inventory = {
      ...inventory,
      compressors: Number(data.recoveryInventory.compressors) || 0,
      attachments: data.recoveryInventory.attachments || {
        legs: 0,
        arms: 0,
        hips: 0,
      },
    };
  }

  return {
    id: doc.id,
    name: data.name || doc.id,
    address: data.address || "",
    email: data.email || "",
    phone: data.phone || "",
    website: data.website || "",
    logo: data.logo || "",
    inventory,
    schedule: data.schedule || null,
    isActive: data.isActive ?? true,
    recoveryEnabled: data.recoveryEnabled ?? false,
    therapists: (data.therapists || []).map((t: any, idx: number) => ({
      ...t,
      id:
        t.id ||
        t.name?.toLowerCase().replace(/\s+/g, "-") ||
        `therapist-${idx}`,
    })),
    teamIntro: data.teamIntro || "",
    bookingRules: data.bookingRules || {
      minHoursBeforeBooking: 1,
      maxDaysInAdvance: 7,
      cancellationPolicy: "Безплатно анулиране до 2 часа преди часа.",
    },
    marketing: data.marketing || {
      discountCodes: [],
      globalDiscount: { enabled: false, percentage: 0 },
      promoBanner: {
        enabled: false,
        text: "",
        backgroundColor: "#000000",
        textColor: "#ffffff",
      },
    },
    benefits: data.benefits || [],
    attachments: data.attachments || [],
    contraindications: data.contraindications || [],
  };
};

export const updateSite = async (site: Partial<Site> & { id: string }) => {
  const db = getDb();
  const siteRef = doc(db, SITES_COLLECTION, site.id);
  await setDoc(siteRef, site, { merge: true });
};

export const getAllSites = async (): Promise<Site[]> => {
  if (typeof window === "undefined") {
    const { getAdminDb } = await import("@/lib/firebase-admin");
    const adminDb = getAdminDb();
    const snapshot = await adminDb.collection(SITES_COLLECTION).get();
    if (snapshot.empty) {
      return getDefaultSites();
    }
    return snapshot.docs.map(docToSite).filter(Boolean) as Site[];
  }

  const db = getDb();
  const q = query(collection(db, SITES_COLLECTION));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return getDefaultSites();
  }

  return snapshot.docs.map(docToSite).filter(Boolean) as Site[];
};

const getDefaultSites = (): Site[] => [
  {
    id: "bkgalabovo",
    name: "БК Гълъбово",
    isActive: true,
    recoveryEnabled: false,
    inventory: { courts: 4, machines: 0 },
    schedule: null,
    bookingRules: {
      maxDaysInAdvance: 30,
      minHoursBeforeBooking: 1,
    },
  },
  {
    id: "recoveryzone",
    name: "Recovery Zone",
    isActive: true,
    recoveryEnabled: true,
    inventory: {
      attachments: { arms: 1, hips: 1, legs: 2 },
      compressors: 2,
    },
    schedule: null,
    bookingRules: {
      maxDaysInAdvance: 7,
      minHoursBeforeBooking: 1,
      cancellationPolicy: "Безплатно анулиране до 2 часа преди часа.",
    },
  },
];

export const getSiteById = async (id: string): Promise<Site | null> => {
  if (typeof window === "undefined") {
    const { getAdminDb } = await import("@/lib/firebase-admin");
    const adminDb = getAdminDb();
    const docRef = adminDb.collection(SITES_COLLECTION).doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      const all = await getAllSites();
      return all.find((s) => s.id === id) || null;
    }

    return docToSite(snapshot);
  }

  const db = getDb();
  const siteRef = doc(db, SITES_COLLECTION, id);
  const snapshot = await getDoc(siteRef);

  if (!snapshot.exists()) {
    // Fallback for hardcoded IDs if not in DB
    const all = await getAllSites();
    return all.find((s) => s.id === id) || null;
  }

  return docToSite(snapshot);
};
