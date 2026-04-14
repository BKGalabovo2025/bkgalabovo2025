import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
  query,
  where,
  serverTimestamp,
  DocumentSnapshot,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase-collections";
import { Member, MemberSchema } from "@/types/member.types";

const MEMBERS_COLLECTION = FIRESTORE_COLLECTIONS.MEMBERS;

// Converts a Firestore document to a Member object with robust validation.
export const docToMember = (docSnap: DocumentSnapshot): Member | null => {
  if (!docSnap.exists()) {
    console.warn(`docToMember: Document with ID ${docSnap.id} does not exist.`);
    return null;
  }

  const data = docSnap.data();

  // Helper to gracefully convert Timestamps to ISO strings.
  const toISODate = (date: Timestamp | Date): string | undefined => {
    if (date instanceof Timestamp) {
      return date.toDate().toISOString();
    }
    if (date instanceof Date) {
      return date.toISOString();
    }
    // Return undefined for invalid or missing dates to let Zod handle it.
    return undefined;
  };

  const name = [data.firstName, data.middleName, data.lastName]
    .filter(Boolean)
    .join(" ");

  // Prepare the data for Zod parsing.
  const dataToParse = {
    ...data,
    id: docSnap.id,
    name: name,
    dateOfBirth: toISODate(data.dateOfBirth),
    registrationDate:
      toISODate(data.registrationDate) || new Date().toISOString(),
    updatedAt: toISODate(data.updatedAt),
  };

  try {
    // Use Zod to validate and parse the data.
    return MemberSchema.parse(dataToParse);
  } catch (error) {
    console.error(
      `Validation failed for ID ${docSnap.id}. Data:`,
      dataToParse,
      error
    );
    return null;
  }
};

// Fetches a single member by their ID.
export const getMemberById = async (id: string): Promise<Member | null> => {
  if (!id || id === "undefined") {
    console.error(`getMemberById was called with an invalid ID: ${id}`);
    return null;
  }
  const db = getDb();
  const memberRef = doc(db, MEMBERS_COLLECTION, id);
  const docSnap = await getDoc(memberRef);
  return docToMember(docSnap);
};

// Fetches multiple members by their IDs.
export const getMembersByIds = async (ids: string[]): Promise<Member[]> => {
  if (!ids || ids.length === 0) {
    return [];
  }
  const db = getDb();
  const membersCollection = collection(db, MEMBERS_COLLECTION);
  const q = query(membersCollection, where("__name__", "in", ids));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docToMember).filter(Boolean) as Member[];
};

let membersCache: Member[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

// Fetches all members from the database with a simple in-memory cache.
export const getAllMembers = async (
  forceRefetch = false
): Promise<Member[]> => {
  const now = Date.now();

  // Return cached data if available and not expired
  if (!forceRefetch && membersCache && now - lastFetchTime < CACHE_DURATION) {
    return membersCache;
  }

  const db = getDb();
  const membersCollection = collection(db, MEMBERS_COLLECTION);
  const querySnapshot = await getDocs(membersCollection);

  const members = querySnapshot.docs
    .map(docToMember)
    .filter(Boolean) as Member[];

  // Update cache
  membersCache = members;
  lastFetchTime = now;

  return members;
};

// Изчисляване на възрастовата група на базата на годината на раждане
const calculateAgeGroup = (
  dateOfBirth?: string | Date | null
): string | null => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth as string | Date);
  if (isNaN(dob.getTime())) return null;

  const birthYear = dob.getFullYear();
  const currentYear = new Date().getFullYear();
  const diff = currentYear - birthYear;

  if (diff <= 8) return "U9";
  if (diff === 9 || diff === 10) return "U11";
  if (diff === 11 || diff === 12) return "U13";
  if (diff === 13 || diff === 14) return "U15";
  if (diff === 15 || diff === 16) return "U17";
  if (diff === 17 || diff === 18) return "U19";
  if (diff >= 19) return "Мъже/Жени";

  return null;
};

// Adds a new member to the database, using server-side timestamps.
export const addMember = async (
  memberData: Omit<Member, "id" | "name" | "registrationDate" | "updatedAt">
): Promise<string> => {
  const db = getDb();
  const membersCollection = collection(db, MEMBERS_COLLECTION);

  const ageGroup = calculateAgeGroup(memberData.dateOfBirth);

  const dataToAdd = {
    ...memberData,
    ageGroup,
    dateOfBirth: memberData.dateOfBirth
      ? Timestamp.fromDate(new Date(memberData.dateOfBirth))
      : null,
    registrationDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(membersCollection, dataToAdd);
  return docRef.id;
};

// Updates an existing member in the database, using server-side timestamps.
export const updateMember = async (
  id: string,
  memberData: Partial<Omit<Member, "id" | "name">>
): Promise<void> => {
  const db = getDb();
  const memberRef = doc(db, MEMBERS_COLLECTION, id);

  const dataToUpdate: { [key: string]: unknown } = { ...memberData };

  if ("dateOfBirth" in dataToUpdate) {
    dataToUpdate.ageGroup = calculateAgeGroup(
      dataToUpdate.dateOfBirth as string | Date | null
    );
    if (dataToUpdate.dateOfBirth) {
      dataToUpdate.dateOfBirth = Timestamp.fromDate(
        new Date(dataToUpdate.dateOfBirth as string)
      );
    } else {
      dataToUpdate.dateOfBirth = null;
    }
  }

  dataToUpdate.updatedAt = serverTimestamp();

  await updateDoc(memberRef, dataToUpdate);
};
