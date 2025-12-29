
"use server";

import { collection, getDocs, addDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAllMembers } from '@/services/member-service';

// Defines the shape of a club service object, expanded to include all form fields.
export type ClubService = {
    id: string;
    name: string;
    description?: string;
    price: number;
    targetGroups?: ('Деца' | 'Любители')[];
    type: 'subscription' | 'one-time';
    
    // Subscription-specific fields
    billingPeriod?: 'Месечен' | 'Годишен';
    grantsLicense?: boolean;
    licenseCondition?: 'Веднага' | 'След N плащания';
    licensePaymentCount?: number;
    grantsApparel?: boolean;
    apparelCondition?: 'Веднага' | 'След N плащания';
    apparelPaymentCount?: number;
    
    // One-time specific fields
    durationMinutes?: number;
};

const SERVICES_COLLECTION = 'services';

/**
 * Creates a new club service in Firestore.
 * This is a server action intended for use with the `useFormState` hook.
 * @param prevState The previous state returned by the action.
 * @param formData The FormData object submitted from the form.
 * @returns A state object with a success flag and a message.
 */
export const createClubService = async (prevState: { message: string }, formData: FormData): Promise<{ message: string; success: boolean; }> => {
    const db = getDb();

    // Extract raw data from the form
    const rawData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: formData.get('price'),
        targetGroups: formData.getAll('targetGroups'),
        type: formData.get('type'),
        billingPeriod: formData.get('billingPeriod'),
        grantsLicense: formData.get('grantsLicense') === 'on',
        licenseCondition: formData.get('licenseCondition'),
        licensePaymentCount: formData.get('licensePaymentCount'),
        grantsApparel: formData.get('grantsApparel') === 'on',
        apparelCondition: formData.get('apparelCondition'),
        apparelPaymentCount: formData.get('apparelPaymentCount'),
        durationMinutes: formData.get('durationMinutes'),
    };

    if (!rawData.name || !rawData.price || !rawData.type) {
        return { success: false, message: "Грешка: Моля попълнете задължителните полета (Име, Цена, Тип)." };
    }

    // Build the final object to be saved in Firestore, ensuring type safety
    const serviceData: Omit<ClubService, 'id'> = {
        name: rawData.name as string,
        description: rawData.description as string || undefined,
        price: parseFloat(rawData.price as string),
        targetGroups: rawData.targetGroups as ('Деца' | 'Любители')[] | undefined,
        type: rawData.type === 'Абонамент' ? 'subscription' : 'one-time',
    };

    if (serviceData.type === 'subscription') {
        serviceData.billingPeriod = rawData.billingPeriod as 'Месечен' | 'Годишен' || undefined;
        serviceData.grantsLicense = rawData.grantsLicense;
        if (rawData.grantsLicense) {
            serviceData.licenseCondition = rawData.licenseCondition as 'Веднага' | 'След N плащания' || undefined;
            if (rawData.licenseCondition === 'След N плащания' && rawData.licensePaymentCount) {
                serviceData.licensePaymentCount = parseInt(rawData.licensePaymentCount as string, 10);
            }
        }
        serviceData.grantsApparel = rawData.grantsApparel;
        if (rawData.grantsApparel) {
            serviceData.apparelCondition = rawData.apparelCondition as 'Веднага' | 'След N плащания' || undefined;
            if (rawData.apparelCondition === 'След N плащания' && rawData.apparelPaymentCount) {
                serviceData.apparelPaymentCount = parseInt(rawData.apparelPaymentCount as string, 10);
            }
        }
    } else { // 'one-time'
        if (rawData.durationMinutes) {
            serviceData.durationMinutes = parseInt(rawData.durationMinutes as string, 10);
        }
    }

    try {
        const servicesCollection = collection(db, SERVICES_COLLECTION);
        await addDoc(servicesCollection, serviceData);
    } catch (error) {
        console.error("Error creating new service:", error);
        return {
            success: false,
            message: 'Грешка в базата данни: Неуспешно създаване на услуга.'
        };
    }

    revalidatePath('/finances/services');
    return { success: true, message: 'Новата услуга беше създадена успешно!' };
};


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
