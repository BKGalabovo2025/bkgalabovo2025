'use server';

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// --- Zod Schema for Service Validation ---
const ServiceSchema = z.object({
  name: z.string().min(3, "Името трябва да е поне 3 символа."),
  priceId: z.string().min(1, "Моля, изберете цена."),
  description: z.string().min(10, "Описанието трябва да е поне 10 символа."),
  type: z.enum(['Абонамент', 'Еднократно плащане']),
  targetGroups: z.array(z.string()).optional(),
  billingPeriod: z.string().optional(),
  grantsLicense: z.boolean().optional(),
  licenseCondition: z.string().optional(),
  licensePaymentCount: z.coerce.number().optional(),
  grantsApparel: z.boolean().optional(),
  apparelCondition: z.string().optional(),
  apparelPaymentCount: z.coerce.number().optional(),
  durationMinutes: z.coerce.number().optional(),
});

// --- Type for Server Action State ---
export type ServiceState = {
  errors?: { [key: string]: string[] | undefined; };
  message?: string | null;
  success?: boolean;
};

// --- Helper Functions (Private) ---

async function _getUser(idToken: string) {
    const adminAuth = getAdminAuth();
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        return await adminAuth.getUser(decodedToken.uid);
    } catch (error) {
        console.error("Error verifying ID token:", error);
        throw new Error("Authentication failed.");
    }
}

function _parseFormData(formData: FormData): any {
    return {
        name: formData.get('name'),
        priceId: formData.get('priceId'),
        description: formData.get('description'),
        type: formData.get('type'),
        targetGroups: formData.getAll('targetGroups'),
        grantsLicense: formData.get('grantsLicense') === 'on',
        grantsApparel: formData.get('grantsApparel') === 'on',
        billingPeriod: formData.get('billingPeriod'),
        licenseCondition: formData.get('licenseCondition'),
        licensePaymentCount: formData.get('licensePaymentCount'),
        apparelCondition: formData.get('apparelCondition'),
        apparelPaymentCount: formData.get('apparelPaymentCount'),
        durationMinutes: formData.get('durationMinutes'),
    };
}

async function _logHistory(db: FirebaseFirestore.Firestore, serviceId: string, userId: string, userName: string, action: string, changes: string) {
    await db.collection("serviceHistory").add({
        serviceId, userId, userName, action, changes,
        timestamp: FieldValue.serverTimestamp(),
    });
}

// --- Public Server Actions ---

export async function updateClubService(
  id: string,
  idToken: string,
  prevState: ServiceState,
  formData: FormData
): Promise<ServiceState> {

  try {
    const user = await _getUser(idToken);
    const adminDb = getAdminDb();
    const parsedData = _parseFormData(formData);

    const validatedFields = ServiceSchema.safeParse(parsedData);
    if (!validatedFields.success) {
      return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Validation failed." };
    }

    const { priceId, ...dataToSave } = validatedFields.data;

    const priceRef = adminDb.collection("prices").doc(priceId);
    const priceSnap = await priceRef.get();
    if (!priceSnap.exists) throw new Error("Selected price is invalid.");
    const priceData = priceSnap.data()!;

    const serviceRef = adminDb.collection("clubServices").doc(id);
    await serviceRef.update({
        ...dataToSave,
        price: priceData.value,
        currency: priceData.currency,
        priceId,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: { userId: user.uid, userName: user.displayName || user.email },
    });

    await _logHistory(adminDb, id, user.uid, user.displayName || "Unknown User", 'update', "Service details updated.");

    revalidatePath("/finances/services");
    revalidatePath(`/finances/services/${id}/history`);
    return { success: true, message: `Service '${dataToSave.name}' updated successfully.` };

  } catch (error: any) {
    console.error("Server Action Error:", error);
    return { success: false, message: `Server Error: ${error.message}` };
  }
}

export async function createClubService(
  idToken: string,
  prevState: ServiceState,
  formData: FormData
): Promise<ServiceState> {
  try {
    const user = await _getUser(idToken);
    const adminDb = getAdminDb();
    const parsedData = _parseFormData(formData);

    const validatedFields = ServiceSchema.safeParse(parsedData);
    if (!validatedFields.success) {
        return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Validation failed." };
    }

    const { priceId, ...dataToSave } = validatedFields.data;
    
    const priceRef = adminDb.collection("prices").doc(priceId);
    const priceSnap = await priceRef.get();
    if (!priceSnap.exists) throw new Error("Selected price is invalid.");
    const priceData = priceSnap.data()!;

    const docRef = await adminDb.collection("clubServices").add({
        ...dataToSave,
        price: priceData.value,
        currency: priceData.currency,
        priceId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: { userId: user.uid, userName: user.displayName || user.email },
    });

    await _logHistory(adminDb, docRef.id, user.uid, user.displayName || "Unknown User", 'create', "Service created.");

    revalidatePath("/finances/services");
    return { success: true, message: `Service '${dataToSave.name}' created successfully.` };

  } catch (error: any) {
    console.error("Server Action Error:", error);
    return { success: false, message: `Server Error: ${error.message}` };
  }
}
