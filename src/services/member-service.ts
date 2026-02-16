
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, Timestamp, query, where } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase-collections';
import { Member, MemberSchema } from '@/types/member.types';

const MEMBERS_COLLECTION = FIRESTORE_COLLECTIONS.MEMBERS;

const docToMember = (docSnap: any): Member | null => {
    if (!docSnap.exists()) {
        console.warn(`docToMember: Document with ID ${docSnap.id} does not exist.`);
        return null;
    }

    const data = docSnap.data();

    const toISODate = (date: any): string | null => {
        if (date instanceof Timestamp) {
            return date.toDate().toISOString();
        } else if (typeof date === 'string' && !isNaN(Date.parse(date))) {
            return date;
        } else if (date) {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) return parsedDate.toISOString();
        }
        return null;
    };
    
    const name = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ') || '';

    const dataToParse = {
        ...data,
        id: docSnap.id,
        name: name,
        middleName: data.middleName || null,
        email: data.email || null,
        phone: data.phone || null,
        phoneType: data.phoneType || null,
        avatarUrl: data.avatarUrl || null,
        familyId: data.familyId || null,
        educationInstitution: data.educationInstitution || null,
        personalId: data.personalId || null,
        address: data.address || null,
        notes: data.notes || null,
        analysisCache: data.analysisCache || null,
        dateOfBirth: toISODate(data.dateOfBirth),
        registrationDate: toISODate(data.registrationDate) || toISODate(data.createdAt) || new Date().toISOString(),
    };

    try {
        return MemberSchema.parse(dataToParse);
    } catch (error) {
        console.error(`docToMember: Zod validation failed for document ID ${docSnap.id}.`, error);
        return null; 
    }
};

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

export const getAllMembers = async (): Promise<Member[]> => {
  const db = getDb();
  const membersCollection = collection(db, MEMBERS_COLLECTION);
  const querySnapshot = await getDocs(membersCollection);
  return querySnapshot.docs.map(docToMember).filter(Boolean) as Member[];
};


export const addMember = async (memberData: Omit<Member, 'id' | 'name'>): Promise<string> => {
  const db = getDb();
  const membersCollection = collection(db, MEMBERS_COLLECTION);
  const dataToAdd: { [key: string]: any } = {
    ...memberData,
    dateOfBirth: memberData.dateOfBirth ? Timestamp.fromDate(new Date(memberData.dateOfBirth)) : null,
    registrationDate: memberData.registrationDate ? Timestamp.fromDate(new Date(memberData.registrationDate)) : Timestamp.now(),
  };

  Object.keys(dataToAdd).forEach(key => {
      if (dataToAdd[key] === undefined || dataToAdd[key] === null) {
          delete dataToAdd[key];
      }
  });

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
