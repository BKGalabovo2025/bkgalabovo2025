import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  setDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Site, Therapist } from "@/types/site.types";

const SITES_COLLECTION = "sites";

interface SiteDocumentData {
  name?: string;
  address?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  youtube?: string;
  facebook?: string;
  facebookGroup?: string;
  logo?: string;
  inventory?: import("@/types/site.types").SiteInventory;
  recoveryInventory?: {
    compressors?: number;
    attachments?: {
      legs?: number;
      arms?: number;
      hips?: number;
    };
  };
  schedule?: import("@/types/site.types").SiteSchedule | null;
  isActive?: boolean;
  recoveryEnabled?: boolean;
  therapists?: Partial<Therapist>[];
  teamIntro?: string;
  bookingRules?: Site["bookingRules"];
  marketing?: Site["marketing"];
  benefits?: Site["benefits"];
  attachments?: Site["attachments"];
  contraindications?: string[];
  faqs?: { q: string; a: string }[];
}

const docToSite = (doc: {
  id: string;
  exists: (() => boolean) | boolean;
  data: () => SiteDocumentData | undefined;
}): Site | null => {
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
    description: data.description || "",
    email: data.email || "",
    phone: data.phone || "",
    website: data.website || "",
    instagram: data.instagram || "",
    youtube: data.youtube || "",
    facebook: data.facebook || "",
    facebookGroup: data.facebookGroup || "",
    logo: data.logo || "",
    inventory,
    schedule: data.schedule || null,
    isActive: data.isActive ?? true,
    recoveryEnabled: data.recoveryEnabled ?? false,
    therapists: (data.therapists || []).map(
      (t: Partial<Therapist>, idx: number) => ({
        ...t,
        id:
          t.id ||
          t.name?.toLowerCase().replace(/\s+/g, "-") ||
          `therapist-${idx}`,
      })
    ) as Therapist[],
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
    faqs: data.faqs || [],
  };
};

export const updateSite = async (site: Partial<Site> & { id: string }) => {
  const db = getDb();
  const siteRef = doc(db, SITES_COLLECTION, site.id);
  await setDoc(siteRef, site, { merge: true });
};

export const getAllSites = async (): Promise<Site[]> => {
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
