
import { getDb } from '@/lib/firebase';
import { collection, addDoc, getDoc, doc, arrayUnion, arrayRemove, writeBatch, DocumentSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Family, FamilySchema } from '@/types';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase-collections';

const { FAMILIES, MEMBERS } = FIRESTORE_COLLECTIONS;

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
        console.error(`docToFamily: Zod validation failed for document ID ${docSnap.id}.`, error);
        return null;
    }
};

/**
 * Creates a new family and associates the given member IDs with it.
 * @param name - The name of the family.
 * @param memberIds - An array of member IDs to include in the family.
 * @returns The newly created Family object.
 */
const createFamily = async (name: string, memberIds: string[]): Promise<Family> => {
    const db = getDb();
    const familyData = {
        name,
        memberIds,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    
    const familyDocRef = await addDoc(collection(db, FAMILIES), familyData);

    const batch = writeBatch(db);
    memberIds.forEach(memberId => {
        const memberRef = doc(db, MEMBERS, memberId);
        batch.update(memberRef, { familyId: familyDocRef.id });
    });
    await batch.commit();

    const newFamily = await getDoc(familyDocRef);
    return docToFamily(newFamily)!;
};

/**
 * Adds members to an existing family.
 * @param familyId - The ID of the family to add members to.
 * @param memberIds - The IDs of the members to add.
 */
const addMembersToFamily = async (familyId: string, memberIds: string[]): Promise<void> => {
    if (memberIds.length === 0) return;
    const db = getDb();
    const familyRef = doc(db, FAMILIES, familyId);

    const batch = writeBatch(db);
    batch.update(familyRef, { 
        memberIds: arrayUnion(...memberIds),
        updatedAt: serverTimestamp(),
    });

    memberIds.forEach(memberId => {
        const memberRef = doc(db, MEMBERS, memberId);
        batch.update(memberRef, { familyId });
    });

    await batch.commit();
};

/**
 * Removes members from a family.
 * @param familyId - The ID of the family to remove members from.
 * @param memberIds - The IDs of the members to remove.
 */
const removeMembersFromFamily = async (familyId: string, memberIds: string[]): Promise<void> => {
    if (memberIds.length === 0) return;
    const db = getDb();
    const familyRef = doc(db, FAMILIES, familyId);

    const batch = writeBatch(db);
    batch.update(familyRef, { 
        memberIds: arrayRemove(...memberIds),
        updatedAt: serverTimestamp(),
    });
    
    memberIds.forEach(memberId => {
        const memberRef = doc(db, MEMBERS, memberId);
        batch.update(memberRef, { familyId: null });
    });
    
    await batch.commit();
};

/**
 * Fetches a family by its ID.
 * @param familyId - The ID of the family to fetch.
 * @returns The Family object or null if not found.
 */
export const getFamilyById = async (familyId: string): Promise<Family | null> => {
    if (!familyId) return null;
    const db = getDb();
    const familyRef = doc(db, FAMILIES, familyId);
    const familySnap = await getDoc(familyRef);
    return docToFamily(familySnap);
};
