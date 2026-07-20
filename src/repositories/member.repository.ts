import {
  getDocs,
  doc,
  getDoc,
  query,
  limit,
  orderBy,
  deleteDoc,
  CollectionReference,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getMembersCollection,
  getMembersQuery,
} from "@/lib/firebase-collections";
import { Member } from "@/types/member.types";
import { docToMember } from "@/mappers/member.mapper";

/**
 * Fetches a single member by their ID from Firestore.
 */
export const fetchMemberById = async (id: string): Promise<Member | null> => {
  const memberRef = doc(getMembersCollection(), id);
  const docSnap = await getDoc(memberRef);
  return docToMember(docSnap);
};

/**
 * Fetches all members from Firestore, sorted by lastName.
 */
export const fetchAllMembers = async (): Promise<Member[]> => {
  const q = query(
    getMembersQuery(),
    orderBy("lastName", "asc"),
    limit(1000)
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs
    .map(docToMember)
    .filter(Boolean) as Member[];
};

/**
 * Adds a new member document to Firestore.
 */
export const createMemberDocument = async (
  data: Record<string, unknown>
): Promise<string> => {
  const docRef = await addDoc(
    getMembersCollection() as CollectionReference<unknown>,
    data
  );
  return docRef.id;
};

/**
 * Updates an existing member document in Firestore.
 */
export const updateMemberDocument = async (
  id: string,
  data: Record<string, unknown>
): Promise<void> => {
  const memberRef = doc(getMembersCollection(), id);
  await updateDoc(memberRef, data);
};

/**
 * Deletes a member document from Firestore.
 */
export const deleteMemberDocument = async (id: string): Promise<void> => {
  const memberRef = doc(getMembersCollection(), id);
  await deleteDoc(memberRef);
};

/**
 * Helper to get raw member data (e.g. for avatar check before update)
 */
export const fetchRawMemberData = async (id: string): Promise<any | null> => {
  const memberRef = doc(getMembersCollection(), id);
  const docSnap = await getDoc(memberRef);
  return docSnap.exists() ? docSnap.data() : null;
};
