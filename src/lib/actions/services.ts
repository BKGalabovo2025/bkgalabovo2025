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
  type: z.enum(["Абонамент", "Годишен абонамент", "Еднократно плащане"]),
  targetGroups: z.array(z.string()).default([]),
  billingPeriod: z.string().optional().nullable(),
  grantsLicense: z.boolean().default(false),
  licenseCondition: z.string().optional().nullable(),
  licensePaymentCount: z.coerce.number().optional().nullable(),
  grantsApparel: z.boolean().default(false),
  apparelCondition: z.string().optional().nullable(),
  apparelPaymentCount: z.coerce.number().optional().nullable(),
  durationMinutes: z.coerce.number().optional().nullable(),
  isCoachLed: z.boolean().default(true),
  requiresBooking: z.boolean().default(false),
  maxMembers: z.coerce.number().optional().nullable(),
  minMembers: z.coerce.number().optional().nullable(),
});

// --- Type for Server Action State ---
export type ServiceState = {
  errors?: { [key: string]: string[] | undefined };
  message?: string | null;
  success?: boolean;
};

// --- Helper Functions (Private) ---

function _parseFormData(formData: FormData) {
  const getStr = (key: string) => {
    const val = formData.get(key);
    return val === null ? undefined : (val as string);
  };

  const getNum = (key: string) => {
    const val = formData.get(key);
    if (val === null || val === "") return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  };

  const getBool = (key: string) => {
    const val = formData.get(key);
    return val === "on" || val === "true";
  };

  return {
    name: getStr("name"),
    price: formData.get("price"), // Let Zod handle coercion
    currency: getStr("currency") || "EUR",
    description: getStr("description"),
    type: getStr("type"),
    targetGroups: formData.getAll("targetGroups") as string[],
    grantsLicense: getBool("grantsLicense"),
    grantsApparel: getBool("grantsApparel"),
    billingPeriod: getStr("billingPeriod"),
    licenseCondition: getStr("licenseCondition"),
    licensePaymentCount: getNum("licensePaymentCount"),
    apparelCondition: getStr("apparelCondition"),
    apparelPaymentCount: getNum("apparelPaymentCount"),
    durationMinutes: getNum("durationMinutes"),
    isCoachLed: getBool("isCoachLed"),
    requiresBooking: getBool("requiresBooking"),
    maxMembers: getNum("maxMembers"),
    minMembers: getNum("minMembers"),
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
    if (obj[key] !== undefined && obj[key] !== null) {
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
    if (!idToken) throw new Error("Missing ID Token");
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();
    const rawData = _parseFormData(formData);

    const validatedFields = ServiceSchema.safeParse(rawData);
    if (!validatedFields.success) {
      const issues = validatedFields.error.issues;
      const firstIssue = issues.length > 0 ? issues[0] : null;
      const errorMsg = firstIssue
        ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
        : "Validation Error";

      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: `Грешка във валидацията: ${errorMsg}`,
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
    if (!id || !idToken) throw new Error("Missing ID or ID Token");
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();
    const rawData = _parseFormData(formData);

    const validatedFields = ServiceSchema.safeParse(rawData);
    if (!validatedFields.success) {
      const issues = validatedFields.error.issues;
      const firstIssue = issues.length > 0 ? issues[0] : null;
      const errorMsg = firstIssue
        ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
        : "Validation Error";

      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: `Грешка във валидацията: ${errorMsg}`,
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
