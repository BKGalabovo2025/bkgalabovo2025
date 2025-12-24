
"use server";

import { collection, getDocs, query, where, addDoc, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 
import { MemberSubscription, ClubService, Member } from '@/types';

const MEMBERS_COLLECTION = 'members';
const SUBSCRIPTIONS_COLLECTION = 'memberSubscriptions';
const SERVICES_COLLECTION = 'clubServices';

/**
 * Fetches all member subscriptions from the database.
 */
export const getAllSubscriptions = async (): Promise<MemberSubscription[]> => {
    try {
        const subscriptionsCollection = collection(db, SUBSCRIPTIONS_COLLECTION);
        const querySnapshot = await getDocs(subscriptionsCollection);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }) as MemberSubscription);
    } catch (error) {
        console.error("Error fetching all subscriptions:", error);
        return [];
    }
};

/**
 * Fetches all club services from the database.
 */
export const getAllClubServices = async (): Promise<ClubService[]> => {
    try {
        const servicesCollection = collection(db, SERVICES_COLLECTION);
        const querySnapshot = await getDocs(servicesCollection);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }) as ClubService);
    } catch (error) {
        console.error("Error fetching all club services:", error);
        return [];
    }
};

/**
 * Fetches all members from the database.
 */
export const getMembers = async (): Promise<Member[]> => {
    try {
        const membersCollection = collection(db, MEMBERS_COLLECTION);
        const querySnapshot = await getDocs(membersCollection);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }) as Member);
    } catch (error) {
        console.error("Error fetching all members:", error);
        return [];
    }
};

/**
 * Creates a new club service in the database.
 */
export const createClubService = async (service: Omit<ClubService, 'id'>) => {
    try {
        // Remove undefined values before sending to Firestore
        Object.keys(service).forEach(key => (service as any)[key] === undefined && delete (service as any)[key]);
        const docRef = await addDoc(collection(db, SERVICES_COLLECTION), service);
        return docRef.id;
    } catch (error) {
        console.error("Error creating club service:", error);
        throw new Error("Could not create club service.");
    }
};
