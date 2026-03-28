
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, Timestamp, query, where, serverTimestamp, DocumentSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase-collections';
import { Member, MemberSchema } from '@/types/member.types';

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
        console.error(`Validation failed for ID ${docSnap.id}. Data:`, dataToParse, error); 
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

// Изчисляване на възрастовата група за 2026 година на базата на годината на раждане
export const calculateAgeGroup2026 = (dateOfBirth?: string | Date | null): string | null => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth as string | Date);
    if (isNaN(dob.getTime())) return null;
    
    const year = dob.getFullYear();
    
    if (year >= 2018) return 'U9';
    if (year === 2017 || year === 2016) return 'U11';
    if (year === 2015 || year === 2014) return 'U13';
    if (year === 2013 || year === 2012) return 'U15';
    if (year === 2011 || year === 2010) return 'U17';
    if (year === 2009 || year === 2008) return 'U19';
    if (year <= 2007) return 'Мъже/Жени';
    
    return null;
};

// Adds a new member to the database, using server-side timestamps.
export const addMember = async (memberData: Omit<Member, 'id' | 'name' | 'registrationDate' | 'updatedAt'>): Promise<string> => {
  const db = getDb();
  const membersCollection = collection(db, MEMBERS_COLLECTION);
  
  const ageGroup2026 = calculateAgeGroup2026(memberData.dateOfBirth);

  const dataToAdd = {
    ...memberData,
    ageGroup2026,
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
  
  const dataToUpdate: { [key: string]: unknown } = { ...memberData };

  if ('dateOfBirth' in dataToUpdate) {
      dataToUpdate.ageGroup2026 = calculateAgeGroup2026(dataToUpdate.dateOfBirth as string | Date | null);
      if (dataToUpdate.dateOfBirth) {
          dataToUpdate.dateOfBirth = Timestamp.fromDate(new Date(dataToUpdate.dateOfBirth as string));
      } else {
          dataToUpdate.dateOfBirth = null;
      }
  }
  
  dataToUpdate.updatedAt = serverTimestamp();

  await updateDoc(memberRef, dataToUpdate);
};
