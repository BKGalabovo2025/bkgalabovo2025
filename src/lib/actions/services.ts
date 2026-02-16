'use server';

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// --- Zod Schema for validation (no changes here) ---
const ServiceSchema = z.object({
  name: z.string().min(3, { message: "Името трябва да е поне 3 символа." }),
  price: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().positive({ message: "Цената трябва да е положително число." })
  ),
  description: z.string().min(10, { message: "Описанието трябва да е поне 10 символа." }),
  currency: z.string(),
  type: z.string(),
  billingPeriod: z.string().optional(),
  targetGroups: z.array(z.string()).optional(),
  grantsLicense: z.boolean().optional(),
  licenseCondition: z.string().optional(),
  licensePaymentCount: z.number().optional(),
  grantsApparel: z.boolean().optional(),
  apparelCondition: z.string().optional(),
  apparelPaymentCount: z.number().optional(),
  durationMinutes: z.number().optional(),
});

// UPDATED: Added 'success' property
export type ServiceState = {
  errors?: { [key: string]: string[] | undefined; };
  message?: string | null;
  success?: boolean;
};

// --- Private Helper Functions ---

async function _getUserNameFromToken(idToken: string): Promise<string> {
    if (!idToken) return "System (No Token)";
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const user = await adminAuth.getUser(decodedToken.uid);
        return user.displayName || user.email || "Анонимен потребител";
    } catch (error) {
        console.error("Error verifying ID token:", error);
        return "System (Invalid Token)";
    }
}

function _parseFormData(formData: FormData) {
    const data = {
        name: formData.get('name') as string,
        price: parseFloat(formData.get('price') as string),
        description: formData.get('description') as string,
        currency: formData.get('currency') as string,
        type: formData.get('type') as string,
        targetGroups: formData.getAll('targetGroups') as string[],
        grantsLicense: formData.get('grantsLicense') === 'on',
        grantsApparel: formData.get('grantsApparel') === 'on',
        billingPeriod: formData.get('billingPeriod') as string | undefined,
        licenseCondition: formData.get('licenseCondition') as string | undefined,
        licensePaymentCount: formData.has('licensePaymentCount') ? parseInt(formData.get('licensePaymentCount') as string, 10) : undefined,
        apparelCondition: formData.get('apparelCondition') as string | undefined,
        apparelPaymentCount: formData.has('apparelPaymentCount') ? parseInt(formData.get('apparelPaymentCount') as string, 10) : undefined,
        durationMinutes: formData.has('durationMinutes') ? parseInt(formData.get('durationMinutes') as string, 10) : undefined,
    };

    Object.keys(data).forEach(key => {
        const k = key as keyof typeof data;
        if (data[k] === undefined || data[k] === null || (typeof data[k] === 'number' && isNaN(data[k]))) {
            delete data[k];
        }
    });

    return data;
}

function _generateChangeDescription(originalData: any, newData: any): string {
    const changes: string[] = [];
    const originalPrice = (originalData.price || 0) / 100;
    const newPrice = newData.price;

    if (originalData.name !== newData.name) {
        changes.push(`Име е променено от '${originalData.name}' на '${newData.name}'.`);
    }
    if (originalPrice.toFixed(2) !== newPrice.toFixed(2)) {
        changes.push(`Цена е променена от ${originalPrice.toFixed(2)} на ${newPrice.toFixed(2)}.`);
    }
    if (originalData.description !== newData.description) {
        changes.push("Описанието е редактирано.");
    }
    if (originalData.type !== newData.type) {
        changes.push(`Тип е променен от '${originalData.type}' на '${newData.type}'.`);
    }

    if (changes.length === 0) return "Няма направени промени по основните полета.";
    return changes.join(" ");
}

async function _logServiceHistory(serviceId: string, userName: string, action: 'create' | 'update', changes: string) {
  try {
    await adminDb.collection("serviceHistory").add({
      serviceId,
      userName,
      action,
      changes,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
      console.error(`Failed to log history for service ${serviceId}:`, JSON.stringify(error, null, 2));
  }
}

// --- Public Server Actions ---

export async function updateClubService(
  id: string,
  idToken: string,
  prevState: ServiceState,
  formData: FormData
): Promise<ServiceState> {

  const userName = await _getUserNameFromToken(idToken);
  const parsedData = _parseFormData(formData);

  const validatedFields = ServiceSchema.safeParse(parsedData);

  if (!validatedFields.success) {
      return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Невалидни данни. Моля, проверете полетата." };
  }

  const dataToSave = validatedFields.data;
  const priceInCents = Math.round(dataToSave.price * 100);
  const serviceRef = adminDb.collection("clubServices").doc(id);

  try {
    const originalDocSnap = await serviceRef.get();
    if (!originalDocSnap.exists) throw new Error("Услугата не е намерена.");
    
    const originalData = originalDocSnap.data()!;
    const changesDescription = _generateChangeDescription(originalData, dataToSave);

    await serviceRef.update({ ...dataToSave, price: priceInCents });
    await _logServiceHistory(id, userName, 'update', changesDescription);

    revalidatePath("/finances/services");
    revalidatePath(`/finances/services/${id}/history`);
    return { success: true, message: `Услугата '${dataToSave.name}' беше успешно обновена.` };

  } catch (error: any) {
    console.error("Server Action Error:", JSON.stringify(error, null, 2));
    return { success: false, message: `Грешка от сървъра: ${error.message}` };
  }
}

export async function createClubService(
  idToken: string,
  prevState: ServiceState,
  formData: FormData
): Promise<ServiceState> {

    const userName = await _getUserNameFromToken(idToken);
    const parsedData = _parseFormData(formData);
    
    const validatedFields = ServiceSchema.safeParse(parsedData);

    if (!validatedFields.success) {
        return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Невалидни данни. Моля, проверете полетата." };
    }

    const dataToSave = validatedFields.data;
    const priceInCents = Math.round(dataToSave.price * 100);

    try {
        const docRef = await adminDb.collection("clubServices").add({ ...dataToSave, price: priceInCents });
        await _logServiceHistory(docRef.id, userName, 'create', "Услугата е създадена.");

        revalidatePath("/finances/services");
        return { success: true, message: `Услугата '${dataToSave.name}' беше успешно създадена.` };

    } catch (error: any) {
        console.error("Server Action Error:", JSON.stringify(error, null, 2));
        return { success: false, message: `Грешка от сървъра: ${error.message}` };
    }
}
