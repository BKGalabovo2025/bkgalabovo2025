import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase"; // Corrected import to use getDb
import { getFamiliesCollection } from "@/lib/firebase-collections"; // Corrected import
import { Family } from "@/types/family.types";

export const getFamilyById = async (familyId: string): Promise<Family | null> => {
  if (!familyId) return null;
  const db = getDb();
  const familiesCollection = getFamiliesCollection(); // Get collection instance
  const familyRef = doc(db, familiesCollection.path, familyId);
  const docSnap = await getDoc(familyRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Family;
  }
  return null;
};

export const updateFamily = async (
  familyId: string,
  familyData: Partial<Family>
): Promise<void> => {
  const db = getDb();
  const familiesCollection = getFamiliesCollection(); // Get collection instance
  const familyRef = doc(db, familiesCollection.path, familyId);
  await updateDoc(familyRef, familyData);
};

export const deleteFamily = async (familyId: string): Promise<void> => {
    const db = getDb();
    const familiesCollection = getFamiliesCollection(); // Get collection instance
    const familyRef = doc(db, familiesCollection.path, familyId);
    await deleteDoc(familyRef);
};
