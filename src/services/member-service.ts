
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, Timestamp, query, where, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase-collections';
import { Member, MemberSchema } from '@/types/member.types';

const MEMBERS_COLLECTION = FIRESTORE_COLLECTIONS.MEMBERS;

// Converts a Firestore document to a Member object with robust validation.
export const docToMember = (docSnap: any): Member | null => {
    if (!docSnap.exists()) {
        console.warn(`docToMember: Document with ID ${docSnap.id} does not exist.`);
        return null;
    }

    const data = docSnap.data();

    // Helper to gracefully convert Timestamps to ISO strings.
    const toISODate = (date: any): string | undefined => {
        if (date instanceof Timestamp) {
            return date.toDate().toISOString();
        }
        // Return undefined for invalid or missing dates to let Zod handle it.
        return undefined;
    };
    
    const name = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ');

    // Prepare the data for Zod parsing.
    const dataToParse = {
        ...data,
        id: docSnap.id,
        name: name,
        dateOfBirth: toISODate(data.dateOfBirth),
        registrationDate: toISODate(data.registrationDate) || new Date().toISOString(),
        updatedAt: toISODate(data.updatedAt),
    };

    try {
        // Use Zod to validate and parse the data.
        return MemberSchema.parse(dataToParse);
    } catch (error) {
        console.error(`docToMember: Zod validation failed for document ID ${docSnap.id}.`, error);
        return null; 
    }
};

// Fetches a single member by their ID.
export const getMemberById = async (id: string): Promise<Member | null> => {
    if (!id || id === 'undefined') {
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
    const q = query(membersCollection, where('__name__', 'in', ids));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToMember).filter(Boolean) as Member[];
};

// Fetches all members from the database.
export const getAllMembers = async (): Promise<Member[]> => {
  const db = getDb();
  const membersCollection = collection(db, MEMBERS_COLLECTION);
  const querySnapshot = await getDocs(membersCollection);
  return querySnapshot.docs.map(docToMember).filter(Boolean) as Member[];
};

// Adds a new member to the database, using server-side timestamps.
export const addMember = async (memberData: Omit<Member, 'id' | 'name' | 'registrationDate' | 'updatedAt'>): Promise<string> => {
  const db = getDb();
  const membersCollection = collection(db, MEMBERS_COLLECTION);
  
  const dataToAdd = {
    ...memberData,
    dateOfBirth: memberData.dateOfBirth ? Timestamp.fromDate(new Date(memberData.dateOfBirth)) : null,
    registrationDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(membersCollection, dataToAdd);
  return docRef.id;
};

// Updates an existing member in the database, using server-side timestamps.
export const updateMember = async (id: string, memberData: Partial<Omit<Member, 'id' | 'name'>>): Promise<void> => {
  const db = getDb();
  const memberRef = doc(db, MEMBERS_COLLECTION, id);
  
  const dataToUpdate: { [key: string]: any } = {
    ...memberData,
    updatedAt: serverTimestamp(),
  };

  if (memberData.dateOfBirth) {
      dataToUpdate.dateOfBirth = Timestamp.fromDate(new Date(memberData.dateOfBirth as string));
  }

  await updateDoc(memberRef, dataToUpdate);
};

// Deletes a member from the database.
export const deleteMember = async (id: string): Promise<void> => {
  const db = getDb();
  const memberRef = doc(db, MEMBERS_COLLECTION, id);
  await deleteDoc(memberRef);
};

// Fetches all members belonging to a specific family ID.
export const getMembersByFamilyId = async (familyId: string): Promise<Member[]> => {
    if (!familyId) return [];

    const db = getDb();
    const membersCollection = collection(db, MEMBERS_COLLECTION);
    const q = query(membersCollection, where("familyId", "==", familyId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(docToMember).filter(Boolean) as Member[];
};