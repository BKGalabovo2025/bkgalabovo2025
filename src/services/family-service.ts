
import { getDb } from '@/lib/firebase';
import { collection, addDoc, getDoc, doc, updateDoc, arrayUnion, arrayRemove, writeBatch, DocumentSnapshot } from 'firebase/firestore';
import type { Family } from '@/types';

const FAMILIES_COLLECTION = 'families';
const MEMBERS_COLLECTION = 'members';

export const docToFamily = (doc: DocumentSnapshot): Family | null => {
    if (!doc.id || !doc.exists()) {
        console.error("docToFamily: Invalid document snapshot provided.", { id: doc.id });
        return null;
    }
    const data = doc.data() || {};

    const memberIds = Array.isArray(data.memberIds) ? data.memberIds.filter(id => typeof id === 'string') : [];

    return {
        id: doc.id,
        name: data.name || 'Unnamed Family',
        memberIds: memberIds,
    };
};

export const createFamily = async (name: string, memberIds: string[]): Promise<Family> => {
    const db = getDb();
    const familyData = {
        name: name,
        memberIds: memberIds,
    };
    const familyDocRef = await addDoc(collection(db, FAMILIES_COLLECTION), familyData);

    const batch = writeBatch(db);
    memberIds.forEach(memberId => {
        const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
        batch.update(memberRef, { familyId: familyDocRef.id });
    });
    await batch.commit();

    return {
        id: familyDocRef.id,
        ...familyData,
    };
};

export const addMembersToFamily = async (familyId: string, memberIds: string[]): Promise<void> => {
    if (memberIds.length === 0) return;
    const db = getDb();
    const familyRef = doc(db, FAMILIES_COLLECTION, familyId);

    const batch = writeBatch(db);
    batch.update(familyRef, { memberIds: arrayUnion(...memberIds) });

    memberIds.forEach(memberId => {
        const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
        batch.update(memberRef, { familyId: familyId });
    });

    await batch.commit();
};

export const removeMembersFromFamily = async (familyId: string, memberIds: string[]): Promise<void> => {
    if (memberIds.length === 0) return;
    const db = getDb();
    const familyRef = doc(db, FAMILIES_COLLECTION, familyId);

    const batch = writeBatch(db);
    batch.update(familyRef, { memberIds: arrayRemove(...memberIds) });
    
    memberIds.forEach(memberId => {
        const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
        batch.update(memberRef, { familyId: null });
    });
    
    await batch.commit();

    const familySnap = await getDoc(familyRef);
    const family = docToFamily(familySnap);
    if (family && family.memberIds.length <= 1) {
        // Optional: Add logic here to handle or delete families with one or zero members.
    }
};

export const getFamilyById = async (familyId: string): Promise<Family | null> => {
    if (!familyId) return null;
    const db = getDb();
    const familyRef = doc(db, FAMILIES_COLLECTION, familyId);
    const familySnap = await getDoc(familyRef);
    return docToFamily(familySnap);
};
