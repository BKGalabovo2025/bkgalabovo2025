
"use server";

import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
// We will now rely on the central, robust member service to get members.
import { getAllMembers } from '@/services/member-service';

// Defines the shape of a club service object.
export type ClubService = {
    id: string;
    name: string;
    price: number;
    // Can be 'subscription' or 'one-time'.
    type: 'subscription' | 'one-time';
    // Duration in days, only applicable if type is 'subscription'.
    duration?: number; 
};

const SERVICES_COLLECTION = 'services';

/**
 * Fetches all services offered by the club from Firestore.
 * @returns A promise that resolves to an array of ClubService objects.
 */
export const getAllClubServices = async (): Promise<ClubService[]> => {
    const db = getDb();
    const servicesCollection = collection(db, SERVICES_COLLECTION);
    const querySnapshot = await getDocs(servicesCollection);
    
    // Map the documents to ClubService objects, ensuring the ID is included.
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as ClubService));
};

/**
 * Fetches both all club services and all members concurrently.
 * This is useful for pages that need both sets of data at the same time.
 * It now correctly uses the centralized `getAllMembers` function.
 */
export const getServicesAndMembers = async () => {
    try {
        // Use Promise.all to run fetches in parallel for better performance.
        const [services, members] = await Promise.all([
            getAllClubServices(),
            // This call now goes to the corrected, centralized, and robust service function.
            // This ensures that any invalid member data is filtered out at the source.
            getAllMembers() 
        ]);
        return { services, members };
    } catch (error) {
        console.error("Failed to fetch services and members:", error);
        // Return empty arrays in case of an error to prevent crashes downstream.
        return { services: [], members: [] };
    }
};
