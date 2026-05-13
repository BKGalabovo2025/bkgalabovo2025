"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";

// --- Zod Schema for Service Validation ---
const ServiceSchema = z.object({
  name: z.string().min(2, "Името трябва да е поне 2 символа."),
  price: z.coerce.number().min(0, "Цената трябва да е положително число."),
  currency: z.string().default("EUR"),
  description: z.string().min(5, "Описанието трябва да е поне 5 символа."),
  type: z.enum(["Абонамент", "Еднократно плащане"]),
  targetGroups: z.array(z.string()).default([]),
  billingPeriod: z.string().optional().nullable(),
  grantsLicense: z.boolean().default(false),
  licenseCondition: z.string().optional(),
  licensePaymentCount: z.coerce.number().optional(),
  grantsApparel: z.boolean().default(false),
  apparelCondition: z.string().optional(),
  apparelPaymentCount: z.coerce.number().optional(),
  durationMinutes: z.coerce.number().optional(),
  isCoachLed: z.boolean().default(true),
  requiresBooking: z.boolean().default(false),
  maxMembers: z.coerce.number().optional(),
  minMembers: z.coerce.number().optional(),
});

// --- Type for Server Action State ---
export type ServiceState = {
  errors?: { [key: string]: string[] | undefined };
  message?: string | null;
  success?: boolean;
};

// --- Helper Functions (Private) ---

function _parseFormData(formData: FormData) {
  return {
    name: formData.get("name") as string,
    price: formData.get("price"),
    currency: (formData.get("currency") as string) || "EUR",
    description: formData.get("description") as string,
    type: formData.get("type") as "Абонамент" | "Еднократно плащане",
    targetGroups: formData.getAll("targetGroups") as string[],
    grantsLicense: formData.get("grantsLicense") === "on",
    grantsApparel: formData.get("grantsApparel") === "on",
    billingPeriod: formData.get("billingPeriod") as string,
    licenseCondition: formData.get("licenseCondition") as string,
    licensePaymentCount: formData.get("licensePaymentCount")
      ? Number(formData.get("licensePaymentCount"))
      : undefined,
    apparelCondition: formData.get("apparelCondition") as string,
    apparelPaymentCount: formData.get("apparelPaymentCount")
      ? Number(formData.get("apparelPaymentCount"))
      : undefined,
    durationMinutes: formData.get("durationMinutes")
      ? Number(formData.get("durationMinutes"))
      : undefined,
    isCoachLed: formData.get("isCoachLed") === "on",
    requiresBooking: formData.get("requiresBooking") === "on",
    maxMembers: formData.get("maxMembers")
      ? Number(formData.get("maxMembers"))
      : undefined,
    minMembers: formData.get("minMembers")
      ? Number(formData.get("minMembers"))
      : undefined,
  };
}

async function _logHistory(
  db: FirebaseFirestore.Firestore,
  serviceId: string,
  userId: string,
  userName: string,
  action: string,
  changes: string
) {
  await db.collection("serviceHistory").add({
    serviceId,
    userId,
    userName,
    action,
    changes,
    timestamp: FieldValue.serverTimestamp(),
  });
}

function cleanObject(obj: any) {
  const newObj: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
}

// --- Public Server Actions ---

export async function createClubService(
  idToken: string,
  _prevState: ServiceState,
  formData: FormData
): Promise<ServiceState> {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();
    const rawData = _parseFormData(formData);

    const validatedFields = ServiceSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Моля, проверете въведените данни.",
      };
    }

    const data = cleanObject(validatedFields.data);
    const serviceId = `svc_${Date.now()}`;

    await adminDb
      .collection("clubServices")
      .doc(serviceId)
      .set({
        ...data,
        id: serviceId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: {
          userId: user.uid,
          userName: user.displayName || user.email,
        },
      });

    await _logHistory(
      adminDb,
      serviceId,
      user.uid,
      user.displayName || user.email || "Unknown User",
      "create",
      `Създадена услуга: ${data.name}`
    );

    revalidatePath("/finances/services");
    return {
      success: true,
      message: `Услугата '${data.name}' беше създадена успешно.`,
    };
  } catch (error: unknown) {
    console.error("Server Action Error:", error);
    return {
      success: false,
      message: `Грешка при сървъра: ${error instanceof Error ? error.message : "Неизвестна грешка"}`,
    };
  }
}

export async function updateClubService(
  id: string,
  idToken: string,
  _prevState: ServiceState,
  formData: FormData
): Promise<ServiceState> {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();
    const rawData = _parseFormData(formData);

    const validatedFields = ServiceSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Моля, проверете въведените данни.",
      };
    }

    const data = cleanObject(validatedFields.data);

    await adminDb
      .collection("clubServices")
      .doc(id)
      .update({
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: {
          userId: user.uid,
          userName: user.displayName || user.email,
        },
      });

    await _logHistory(
      adminDb,
      id,
      user.uid,
      user.displayName || user.email || "Unknown User",
      "update",
      `Обновена услуга: ${data.name}`
    );

    revalidatePath("/finances/services");
    revalidatePath(`/finances/services/${id}`);
    return {
      success: true,
      message: `Услугата '${data.name}' беше обновена успешно.`,
    };
  } catch (error: unknown) {
    console.error("Server Action Error:", error);
    return {
      success: false,
      message: `Грешка при сървъра: ${error instanceof Error ? error.message : "Неизвестна грешка"}`,
    };
  }
}

export async function deleteClubService(idToken: string, id: string) {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const serviceRef = adminDb.collection("clubServices").doc(id);
    const serviceSnap = await serviceRef.get();

    if (!serviceSnap.exists) {
      return { success: false, message: "Услугата не е намерена." };
    }

    const serviceData = serviceSnap.data();
    await serviceRef.delete();

    await _logHistory(
      adminDb,
      id,
      user.uid,
      user.displayName || user.email || "Unknown User",
      "delete",
      `Изтрита услуга: ${serviceData?.name}`
    );

    revalidatePath("/finances/services");
    return { success: true, message: "Услугата беше изтрита успешно." };
  } catch (error) {
    console.error("Error deleting service:", error);
    return { success: false, message: "Възникна грешка при изтриването." };
  }
}
