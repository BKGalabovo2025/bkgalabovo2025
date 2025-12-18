
import { db } from '@/lib/firebase';
import { collection, addDoc, getDoc, doc, updateDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import type { Family, Member } from '@/types';

/**
 * Creates a new family with a list of member IDs and updates each member's record.
 * @param memberIds - An array of member IDs to be included in the new family.
 * @returns The ID of the newly created family.
 */
export const createFamily = async (memberIds: string[]): Promise<string> => {
    const familyCollection = collection(db, 'families');
    
    // Create the new family document
    const familyDocRef = await addDoc(familyCollection, {
        memberIds: memberIds,
    });

    // Update all members to include the new family ID
    const batch = writeBatch(db);
    memberIds.forEach(memberId => {
        const memberRef = doc(db, 'members', memberId);
        batch.update(memberRef, { familyId: familyDocRef.id });
    });
    await batch.commit();

    return familyDocRef.id;
};

/**
 * Adds a member to an existing family.
 * @param familyId - The ID of the family to add the member to.
 * @param memberId - The ID of the member to add.
 */
export const addMemberToFamily = async (familyId: string, memberId: string): Promise<void> => {
    const familyRef = doc(db, 'families', familyId);
    const memberRef = doc(db, 'members', memberId);

    const batch = writeBatch(db);
    
    // Add member to the family's list
    batch.update(familyRef, {
        memberIds: arrayUnion(memberId)
    });
    
    // Set the familyId on the member's record
    batch.update(memberRef, { familyId: familyId });
    
    await batch.commit();
};

/**
 * Removes a member from a family.
 * If the family is left with one or zero members, it can optionally be deleted.
 * @param familyId - The ID of the family.
 * @param memberId - The ID of the member to remove.
 */
export const removeMemberFromFamily = async (familyId: string, memberId: string): Promise<void> => {
    const familyRef = doc(db, 'families', familyId);
    const memberRef = doc(db, 'members', memberId);

    const batch = writeBatch(db);

    // Remove familyId from the member's record
    batch.update(memberRef, { familyId: null });

    // Remove the member from the family's list
    batch.update(familyRef, {
        memberIds: arrayRemove(memberId)
    });

    await batch.commit();
    
    // Optional: Check if the family should be deleted
    const familySnap = await getDoc(familyRef);
    if (familySnap.exists()) {
        const family = familySnap.data() as Family;
        if (family.memberIds.length <= 1) {
            // If only one or zero members are left, we might not need the family group anymore.
            // For now, we leave it, but deletion logic could be added here.
            // await deleteDoc(familyRef);
        }
    }
};

/**
 * Retrieves family data by its ID.
 * @param familyId - The ID of the family.
 * @returns The family data.
 */
export const getFamilyById = async (familyId: string): Promise<Family | null> => {
    const familyRef = doc(db, 'families', familyId);
    const familySnap = await getDoc(familyRef);

    if (familySnap.exists()) {
        return { id: familySnap.id, ...familySnap.data() } as Family;
    } else {
        return null;
    }
};
