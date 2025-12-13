
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/types';

const MEMBERS_COLLECTION = 'members';

// Helper to convert Firestore doc to Member object, handling Timestamps
const docToMember = (doc: any): Member => {
    const data = doc.data();
    // Ensure date fields are converted from Timestamps to ISO strings
    const dateOfBirth = data.dateOfBirth instanceof Timestamp ? data.dateOfBirth.toDate().toISOString() : data.dateOfBirth;
    const registrationDate = data.registrationDate instanceof Timestamp ? data.registrationDate.toDate().toISOString() : data.registrationDate;
    
    return {
        id: doc.id,
        ...data,
        dateOfBirth,
        registrationDate,
    } as Member;
}

// Type for data provided on creation (without id)
type CreateMemberData = Omit<Member, 'id'>;

// Type for data provided on update (can be partial)
type UpdateMemberData = Partial<CreateMemberData>;

/**
 * Fetches a single member by their ID from Firestore.
 * @param id The ID of the member to fetch.
 * @returns The member object or null if not found.
 */
export const getMemberById = async (id: string): Promise<Member | null> => {
    const memberRef = doc(db, MEMBERS_COLLECTION, id);
    const docSnap = await getDoc(memberRef);

    if (docSnap.exists()) {
        return docToMember(docSnap);
    }
    return null;
};

/**
 * Fetches all members from Firestore.
 */
export const getMembers = async (): Promise<Member[]> => {
  const membersCollection = collection(db, MEMBERS_COLLECTION);
  const querySnapshot = await getDocs(membersCollection);
  return querySnapshot.docs.map(docToMember);
};

/**
 * Adds a new member to Firestore.
 * @param memberData The data for the new member.
 * @returns The ID of the newly created document.
 */
export const addMember = async (memberData: CreateMemberData): Promise<string> => {
  const membersCollection = collection(db, MEMBERS_COLLECTION);
  // Ensure date strings are converted to Timestamps for Firestore
  const dataWithTimestamps = {
    ...memberData,
    dateOfBirth: Timestamp.fromDate(new Date(memberData.dateOfBirth)),
    registrationDate: Timestamp.fromDate(new Date(memberData.registrationDate)),
  };
  const docRef = await addDoc(membersCollection, dataWithTimestamps);
  return docRef.id;
};

/**
 * Updates data for an existing member.
 * @param id The ID of the member to update.
 * @param memberData The new data for the member.
 */
export const updateMember = async (id: string, memberData: UpdateMemberData): Promise<void> => {
  const memberRef = doc(db, MEMBERS_COLLECTION, id);
  // Handle potential date updates by converting them to Timestamps
  const dataWithTimestamps: { [key: string]: any } = { ...memberData };
  if (memberData.dateOfBirth) {
      dataWithTimestamps.dateOfBirth = Timestamp.fromDate(new Date(memberData.dateOfBirth));
  }
  if (memberData.registrationDate) {
      dataWithTimestamps.registrationDate = Timestamp.fromDate(new Date(memberData.registrationDate));
  }
  await updateDoc(memberRef, dataWithTimestamps);
};

/**
 * Deletes a member from Firestore.
 * @param id The ID of the member to delete.
 */
export const deleteMember = async (id: string): Promise<void> => {
  const memberRef = doc(db, MEMBERS_COLLECTION, id);
  await deleteDoc(memberRef);
};
