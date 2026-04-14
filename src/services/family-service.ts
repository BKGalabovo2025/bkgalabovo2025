import { getDb } from "@/lib/firebase";
import { getDoc, doc, DocumentSnapshot, Timestamp } from "firebase/firestore";
import { Family, FamilySchema } from "@/types";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase-collections";

const { FAMILIES } = FIRESTORE_COLLECTIONS;

/**
 * Converts a Firestore document snapshot into a validated Family object.
 * @param doc - The Firestore document snapshot.
 * @returns A validated Family object or null if the document is invalid or doesn't exist.
 */
const docToFamily = (docSnap: DocumentSnapshot): Family | null => {
  if (!docSnap.exists()) {
    console.warn(`docToFamily: Document with ID ${docSnap.id} does not exist.`);
    return null;
  }

  const data = docSnap.data();

  const toISODate = (date: unknown): string | undefined => {
    if (date instanceof Timestamp) return date.toDate().toISOString();
    if (date instanceof Date) return date.toISOString();
    return undefined;
  };

  const dataToParse = {
    ...data,
    id: docSnap.id,
    createdAt: toISODate(data.createdAt),
    updatedAt: toISODate(data.updatedAt),
  };

  try {
    return FamilySchema.parse(dataToParse);
  } catch (error) {
    console.error(
      `docToFamily: Zod validation failed for document ID ${docSnap.id}.`,
      error
    );
    return null;
  }
};

/**
 * Fetches a family by its ID.
 * @param familyId - The ID of the family to fetch.
 * @returns The Family object or null if not found.
 */
export const getFamilyById = async (
  familyId: string
): Promise<Family | null> => {
  if (!familyId) return null;
  const db = getDb();
  const familyRef = doc(db, FAMILIES, familyId);
  const familySnap = await getDoc(familyRef);
  return docToFamily(familySnap);
};
