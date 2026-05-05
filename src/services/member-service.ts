import {
  getDocs,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
  query,
  serverTimestamp,
  DocumentSnapshot,
  limit,
  orderBy,
  deleteDoc,
  CollectionReference,
  startAfter,
} from "firebase/firestore";
import { getMembersCollection } from "@/lib/firebase-collections";
import { Member, MemberSchema } from "@/types/member.types";

// Converts a Firestore document to a Member object with robust validation.
export const docToMember = (docSnap: DocumentSnapshot): Member | null => {
  if (!docSnap.exists()) {
    console.warn(`docToMember: Document with ID ${docSnap.id} does not exist.`);
    return null;
  }

  const data = docSnap.data();

  // Helper to gracefully convert Timestamps to ISO strings.
  const toISODate = (date: any): string | undefined => {
    if (!date) return undefined;
    // Duck-typing check for Firestore Timestamp
    if (typeof date.toDate === "function") {
      return date.toDate().toISOString();
    }
    if (date instanceof Date) {
      return date.toISOString();
    }
    return undefined;
  };

  const name = [data.firstName, data.middleName, data.lastName]
    .filter(Boolean)
    .join(" ");

  // Prepare the data for Zod parsing, ensuring derived/converted fields overwrite spread data.
  const dataToParse = {
    ...data,
    id: docSnap.id,
    name: name,
    dateOfBirth: toISODate(data.dateOfBirth),
    registrationDate:
      toISODate(data.registrationDate) || new Date().toISOString(),
    updatedAt: toISODate(data.updatedAt),
    skillLevel: data.skillLevel || null,
    rating: typeof data.rating === "number" ? data.rating : null,
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
  const memberRef = doc(getMembersCollection(), id);
  const docSnap = await getDoc(memberRef);
  return docToMember(docSnap);
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

  const q = query(
    getMembersCollection(),
    orderBy("lastName", "asc"),
    limit(1000) // Increased safety limit for "all" members fetch
  );
  const querySnapshot = await getDocs(q);

  const members = querySnapshot.docs
    .map(docToMember)
    .filter(Boolean) as Member[];

  // Update cache
  membersCache = members;
  lastFetchTime = now;

  return members;
};

// Fetches a paginated slice of members.
export const getMembersPage = async (
  pageSize: number = 20,
  startAfterDocId?: string
): Promise<{ members: Member[]; lastDocId: string | null }> => {
  let q = query(
    getMembersCollection(),
    orderBy("lastName", "asc"),
    limit(pageSize)
  );

  if (startAfterDocId) {
    const startAfterDoc = await getDoc(
      doc(getMembersCollection(), startAfterDocId)
    );
    if (startAfterDoc.exists()) {
      q = query(q, startAfter(startAfterDoc));
    }
  }

  const querySnapshot = await getDocs(q);
  const members = querySnapshot.docs
    .map(docToMember)
    .filter(Boolean) as Member[];
  const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

  return {
    members,
    lastDocId: lastDoc ? lastDoc.id : null,
  };
};

// Изчисляване на възрастовата група на базата на годината на раждане
export const calculateAgeGroup = (
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
  const ageGroup = calculateAgeGroup(memberData.dateOfBirth);
  const name = [
    memberData.firstName,
    memberData.middleName,
    memberData.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const dataToAdd = {
    ...memberData,
    name,
    ageGroup,
    dateOfBirth: memberData.dateOfBirth
      ? Timestamp.fromDate(new Date(memberData.dateOfBirth))
      : null,
    registrationDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    getMembersCollection() as CollectionReference<Omit<Member, "id">>,
    dataToAdd
  );
  return docRef.id;
};

// Updates an existing member in the database, using server-side timestamps.
export const updateMember = async (
  id: string,
  memberData: Partial<Omit<Member, "id" | "name">>
): Promise<void> => {
  const memberRef = doc(getMembersCollection(), id);

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

// Deletes a member from the database.
export const deleteMember = async (id: string): Promise<void> => {
  const memberRef = doc(getMembersCollection(), id);
  await deleteDoc(memberRef);
};
