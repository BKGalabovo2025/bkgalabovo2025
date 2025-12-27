
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, Timestamp, DocumentSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Member } from '@/types';

const MEMBERS_COLLECTION = 'members';

/**
 * Definitively converts a Firestore document into a fully validated, "bulletproof" Member object.
 * This function is the single source of truth for Member object creation from Firestore.
 * It ensures every field is of the correct type and defaults to a safe value if missing,
 * corrupted, or of the wrong type. This prevents any downstream errors in the application.
 * @param doc The Firestore document snapshot.
 * @returns A valid Member object or null if the document is fundamentally invalid (e.g., no ID).
 */
const docToMember = (doc: DocumentSnapshot): Member | null => {
    if (!doc.id || !doc.exists()) {
        console.error("docToMember: Invalid document snapshot provided. It will be skipped.", { id: doc.id });
        return null;
    }

    const data = doc.data() || {}; // Use an empty object as a fallback to prevent crashes.

    const member: Member = {
        id: doc.id,
        firstName: typeof data.firstName === 'string' ? data.firstName : '',
        lastName: typeof data.lastName === 'string' ? data.lastName : '',
        email: typeof data.email === 'string' ? data.email : null,
        phone: typeof data.phone === 'string' ? data.phone : null,
        dateOfBirth: data.dateOfBirth?.toDate?.() instanceof Date ? data.dateOfBirth.toDate().toISOString() : new Date(0).toISOString(), // Default to Unix epoch if invalid
        registrationDate: data.registrationDate?.toDate?.() instanceof Date ? data.registrationDate.toDate().toISOString() : new Date().toISOString(), // Default to now if invalid
        status: data.status === 'active' || data.status === 'inactive' ? data.status : 'inactive',
        avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : null,
        familyId: typeof data.familyId === 'string' ? data.familyId : null,
        educationInstitution: typeof data.educationInstitution === 'string' ? data.educationInstitution : null,
        personalId: typeof data.personalId === 'string' ? data.personalId : null,
        analysisCache: typeof data.analysisCache === 'object' ? data.analysisCache : null,
    };

    // Final check for essential fields. If a name is missing, the record is considered invalid.
    if (!member.firstName || !member.lastName) {
        console.error(`docToMember: Document with ID ${doc.id} is missing essential fields (firstName, lastName) and will be skipped.`, { data });
        return null;
    }

    return member;
}

type CreateMemberData = Omit<Member, 'id'>;
type UpdateMemberData = Partial<CreateMemberData>;

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

export const getAllMembers = async (): Promise<Member[]> => {
  const db = getDb();
  const membersCollection = collection(db, MEMBERS_COLLECTION);
  const querySnapshot = await getDocs(membersCollection);
  return querySnapshot.docs.map(docToMember).filter(Boolean) as Member[];
};

export const addMember = async (memberData: CreateMemberData): Promise<string> => {
  const db = getDb();
  const membersCollection = collection(db, MEMBERS_COLLECTION);
  const dataToAdd = {
    ...memberData,
    dateOfBirth: Timestamp.fromDate(new Date(memberData.dateOfBirth)),
    registrationDate: Timestamp.fromDate(new Date(memberData.registrationDate)),
  };
  const docRef = await addDoc(membersCollection, dataToAdd);
  return docRef.id;
};

export const updateMember = async (id: string, memberData: UpdateMemberData): Promise<void> => {
  const db = getDb();
  const memberRef = doc(db, MEMBERS_COLLECTION, id);
  const dataToUpdate: { [key: string]: any } = { ...memberData };
  if (memberData.dateOfBirth) {
      dataToUpdate.dateOfBirth = Timestamp.fromDate(new Date(memberData.dateOfBirth as string));
  }
  if (memberData.registrationDate) {
      dataToUpdate.registrationDate = Timestamp.fromDate(new Date(memberData.registrationDate as string));
  }
  await updateDoc(memberRef, dataToUpdate);
};

export const deleteMember = async (id: string): Promise<void> => {
  const db = getDb();
  const memberRef = doc(db, MEMBERS_COLLECTION, id);
  await deleteDoc(memberRef);
};
