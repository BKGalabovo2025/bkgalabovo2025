import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query, 
  where,
  DocumentSnapshot
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Site } from "@/types/site.types";

const SITES_COLLECTION = "sites";

export const docToSite = (doc: DocumentSnapshot): Site | null => {
  if (!doc.id || !doc.exists()) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    name: data.name || doc.id,
    address: data.address || "",
    isActive: typeof data.isActive === "boolean" ? data.isActive : true,
    recoveryEnabled: typeof data.recoveryEnabled === "boolean" ? data.recoveryEnabled : false,
    recoveryInventory: data.recoveryInventory || {
      attachments: { arms: 0, hips: 0, legs: 0 },
      compressors: 0
    },
    operatingHours: data.operatingHours || { start: 8, end: 22 }
  };
};

export const getAllSites = async (): Promise<Site[]> => {
  const db = getDb();
  const q = query(collection(db, SITES_COLLECTION));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    // Return default sites if collection is empty (for bootstrapping)
    return [
      {
        id: "bkgalabovo",
        name: "БК Гълъбово",
        isActive: true,
        recoveryEnabled: false,
        recoveryInventory: {
          attachments: { arms: 0, hips: 0, legs: 0 },
          compressors: 0
        },
        operatingHours: { start: 8, end: 22 }
      },
      {
        id: "recoveryzone",
        name: "Recovery Zone",
        isActive: true,
        recoveryEnabled: true,
        recoveryInventory: {
          attachments: { arms: 2, hips: 2, legs: 4 },
          compressors: 3
        },
        operatingHours: { start: 9, end: 21 }
      }
    ];
  }
  
  return snapshot.docs.map(docToSite).filter(Boolean) as Site[];
};

export const getSiteById = async (id: string): Promise<Site | null> => {
  const db = getDb();
  const siteRef = doc(db, SITES_COLLECTION, id);
  const snapshot = await getDoc(siteRef);
  
  if (!snapshot.exists()) {
    // Fallback for hardcoded IDs if not in DB
    const all = await getAllSites();
    return all.find(s => s.id === id) || null;
  }
  
  return docToSite(snapshot);
};
