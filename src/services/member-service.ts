
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, Timestamp, DocumentSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Member } from '@/types';

const MEMBERS_COLLECTION = 'members';

const docToMember = (doc: DocumentSnapshot): Member | null => {
    if (!doc.id || !doc.exists()) {
        console.error("docToMember: Invalid document snapshot provided. It will be skipped.", { id: doc.id });
        return null;
    }

    const data = doc.data() || {};

    const firstName = typeof data.firstName === 'string' ? data.firstName : '';
    const middleName = typeof data.middleName === 'string' ? data.middleName : null;
    const lastName = typeof data.lastName === 'string' ? data.lastName : '';

    if (!firstName || !lastName) {
        console.error(`docToMember: Document with ID ${doc.id} is missing essential fields (firstName, lastName) and will be skipped.`, { data });
        return null;
    }

    const toISODate = (date: any): string => {
        if (date instanceof Timestamp) {
            return date.toDate().toISOString();
        } else if (typeof date === 'string') {
            return date;
        } else {
            return new Date(0).toISOString();
        }
    }

    const member: Member = {
        id: doc.id,
        name: [firstName, middleName, lastName].filter(Boolean).join(' '),
        firstName,
        middleName,
        lastName,
        email: typeof data.email === 'string' ? data.email : null,
        phone: typeof data.phone === 'string' ? data.phone : null,
        phoneType: data.phoneType === 'personal' || data.phoneType === 'parent' ? data.phoneType : null,
        dateOfBirth: toISODate(data.dateOfBirth),
        registrationDate: toISODate(data.registrationDate),
        status: data.status === 'active' || data.status === 'inactive' ? data.status : 'inactive',
        avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : null,
        familyId: typeof data.familyId === 'string' ? data.familyId : null,
        educationInstitution: typeof data.educationInstitution === 'string' ? data.educationInstitution : null,
        personalId: typeof data.personalId === 'string' ? data.personalId : null,
        address: typeof data.address === 'string' ? data.address : null,
        notes: typeof data.notes === 'string' ? data.notes : null,
        analysisCache: typeof data.analysisCache === 'object' ? data.analysisCache : null,
    };

    return member;
}

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

export const addMember = async (memberData: Omit<Member, 'id' | 'name'>): Promise<string> => {
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

export const updateMember = async (id: string, memberData: Partial<Omit<Member, 'id' | 'name'>>): Promise<void> => {
  const db = getDb();
  const memberRef = doc(db, MEMBERS_COLLECTION, id);
  const dataToUpdate: { [key: string]: any } = { ...memberData };
  if (memberData.dateOfBirth) {
      dataToUpdate.dateOfBirth = Timestamp.fromDate(new Date(memberData.dateOfBirth as string));
  }
  if (memberData.registrationDate) {
      dataToUpdate.registrationDate = Timestamp.fromDate(new Date(memberData.registrationDate as string));
  }

  Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) {
          delete dataToUpdate[key];
      }
  });

  await updateDoc(memberRef, dataToUpdate);
};

export const deleteMember = async (id: string): Promise<void> => {
  const db = getDb();
  const memberRef = doc(db, MEMBERS_COLLECTION, id);
  await deleteDoc(memberRef);
};
