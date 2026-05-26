"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { serverCache } from "@/lib/server-cache";

// --- Zod Schema for Service Validation ---
const ServiceSchema = z.object({
  name: z.string().min(2, "Името трябва да е поне 2 символа."),
  price: z.coerce.number().min(0, "Цената трябва да е положително число."),
  currency: z.string().default("EUR"),
  description: z.string().min(5, "Описанието трябва да е поне 5 символа."),
  type: z.enum([
    "Абонамент",
    "Годишен абонамент",
    "Еднократно плащане",
    "Членски внос",
  ]),
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
  imageUrl: z.string().optional().nullable(),
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
    imageUrl: getStr("imageUrl"),
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

function cleanObject(obj: Record<string, unknown>) {
  const newObj: Record<string, unknown> = {};
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

    serverCache.invalidate("clubServices");
    revalidatePath("/catalogs");
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

    serverCache.invalidate("clubServices");
    revalidatePath("/catalogs");
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

    serverCache.invalidate("clubServices");
    revalidatePath("/catalogs");
    revalidatePath("/finances/services");
    return { success: true, message: "Услугата беше изтрита успешно." };
  } catch (error) {
    console.error("Error deleting service:", error);
    return { success: false, message: "Възникна грешка при изтриването." };
  }
}

// --- Recovery Session Actions ---

const RecoverySessionSchema = z.object({
  name: z.string().min(2, "Името трябва да е поне 2 символа."),
  description: z.string().optional().default(""),
  price: z.coerce.number().min(0),
  durationMinutes: z.coerce.number().min(1),
  category: z.string().min(1),
  zones: z.array(z.string()).default([]),
  athleteCount: z.coerce.number().min(1).default(1),
  numberOfDays: z.coerce.number().min(1).default(1),
  proceduresPerDay: z.coerce.number().min(1).default(1),
  sessionType: z.string().optional().default("Възстановяване"),
  requiredResources: z.object({
    attachments: z.object({
      arms: z.coerce.number().min(0).default(0),
      hips: z.coerce.number().min(0).default(0),
      legs: z.coerce.number().min(0).default(0),
    }),
    compressors: z.coerce.number().min(0).default(0),
  }),
});

export async function createRecoverySession(
  idToken: string,
  _prevState: ServiceState,
  formData: FormData
): Promise<ServiceState> {
  try {
    if (!idToken) throw new Error("Missing ID Token");
    await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const rawData = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: formData.get("price"),
      durationMinutes: formData.get("duration"),
      category: formData.get("category"),
      zones: formData.get("zones")?.toString().split(",").filter(Boolean) || [],
      athleteCount: formData.get("athleteCount"),
      numberOfDays: formData.get("numberOfDays"),
      proceduresPerDay: formData.get("proceduresPerDay"),
      sessionType: formData.get("sessionType"),
      requiredResources: {
        attachments: {
          arms: formData.get("req_arms") || 0,
          hips: formData.get("req_hips") || 0,
          legs: formData.get("req_legs") || 0,
        },
        compressors: formData.get("req_compressors") || 0,
      },
    };

    const validatedFields = RecoverySessionSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Грешка във валидацията.",
      };
    }

    const data = validatedFields.data;
    const sessionId = `rec_${Date.now()}`;

    await adminDb
      .collection("sessions")
      .doc(sessionId)
      .set({
        ...data,
        id: sessionId,
        siteId: "recoveryzone",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

    serverCache.invalidate("recoveryServices");
    revalidatePath("/catalogs");
    revalidatePath("/finances/recovery");
    return {
      success: true,
      message: `Процедурата '${data.name}' беше създадена успешно.`,
    };
  } catch (error) {
    console.error("Error creating recovery session:", error);
    return { success: false, message: "Грешка при сървъра." };
  }
}

export async function updateRecoverySession(
  id: string,
  idToken: string,
  _prevState: ServiceState,
  formData: FormData
): Promise<ServiceState> {
  try {
    if (!id || !idToken) throw new Error("Missing ID or ID Token");
    await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const rawData = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: formData.get("price"),
      durationMinutes: formData.get("duration"),
      category: formData.get("category"),
      zones: formData.get("zones")?.toString().split(",").filter(Boolean) || [],
      athleteCount: formData.get("athleteCount"),
      numberOfDays: formData.get("numberOfDays"),
      proceduresPerDay: formData.get("proceduresPerDay"),
      sessionType: formData.get("sessionType"),
      requiredResources: {
        attachments: {
          arms: formData.get("req_arms") || 0,
          hips: formData.get("req_hips") || 0,
          legs: formData.get("req_legs") || 0,
        },
        compressors: formData.get("req_compressors") || 0,
      },
    };

    const validatedFields = RecoverySessionSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Грешка във валидацията.",
      };
    }

    const data = validatedFields.data;

    await adminDb
      .collection("sessions")
      .doc(id)
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      });

    serverCache.invalidate("recoveryServices");
    revalidatePath("/catalogs");
    revalidatePath("/finances/recovery");
    revalidatePath(`/finances/recovery/${id}`);
    return {
      success: true,
      message: `Процедурата '${data.name}' беше обновена успешно.`,
    };
  } catch (error) {
    console.error("Error updating recovery session:", error);
    return { success: false, message: "Грешка при сървъра." };
  }
}

export async function deleteRecoverySession(idToken: string, id: string) {
  try {
    await getAuthUser(idToken);
    const adminDb = getAdminDb();
    await adminDb.collection("sessions").doc(id).delete();
    serverCache.invalidate("recoveryServices");
    revalidatePath("/catalogs");
    revalidatePath("/finances/recovery");
    return { success: true, message: "Процедурата беше изтрита успешно." };
  } catch (error) {
    console.error("Error deleting recovery session:", error);
    return { success: false, message: "Грешка при изтриването." };
  }
}

export async function executeTrainingSaleAction(
  idToken: string,
  saleData: Record<string, any>,
  serviceName: string,
  clientName?: string
) {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();
    const now = new Date().toISOString();

    const batch = adminDb.batch();

    // 1. Създаване на записа за продажба
    const saleRef = adminDb.collection("sales").doc();
    const formattedSaleDate = saleData.saleDate
      ? new Date(saleData.saleDate).toISOString()
      : now;

    const newSale = {
      ...saleData,
      id: saleRef.id,
      saleDate: formattedSaleDate,
      createdAt: now,
      createdBy: { uid: user.uid, email: user.email },
    };
    batch.set(saleRef, newSale);

    // 2. Записване на събитие в историята на тренировъчната услуга
    const serviceId = saleData.items[0]?.productId;
    if (serviceId) {
      const qty = saleData.items[0]?.quantity || 1;
      const totalAmt = saleData.totalAmount || 0;
      const eventRef = adminDb.collection("serviceHistory").doc();
      const historyEvent = {
        serviceId: serviceId,
        userId: user.uid,
        userName: user.displayName || user.email || "Unknown User",
        action: "sale",
        changes: `Продажба на '${serviceName}' към ${clientName || "Неизвестен клиент"}: ${qty} бр. на стойност ${totalAmt} EUR`,
        timestamp: FieldValue.serverTimestamp(),
        relatedSaleId: saleRef.id,
      };
      batch.set(eventRef, historyEvent);
    }

    await batch.commit();

    // 3. Атомарно обновяване на присъствията в събитията (платен статус)
    // Прави се след commit на основния batch за да не достигаме Firestore лимита от 500 writes
    const paidEventIds: string[] = saleData.paidEventIds || [];
    const memberIdForAttendance: string | null =
      saleData.memberIdForAttendance || null;
    const paymentType: "subscription" | "individual" =
      saleData.paymentMode === "subscription" ? "subscription" : "individual";

    if (paidEventIds.length > 0 && memberIdForAttendance && saleData.isPaid) {
      // Process in batches of 100 events max
      const chunkSize = 100;
      for (let i = 0; i < paidEventIds.length; i += chunkSize) {
        const chunk = paidEventIds.slice(i, i + chunkSize);
        const attendanceBatch = adminDb.batch();

        for (const eventId of chunk) {
          const eventRef = adminDb.collection("events").doc(eventId);
          const eventSnap = await eventRef.get();

          if (!eventSnap.exists) continue;

          const eventData = eventSnap.data();
          const attendees: any[] = eventData?.attendees || [];

          const nowIso = new Date().toISOString();

          // Find and update the specific member's attendee record
          const updatedAttendees = attendees.map((attendee) => {
            if (attendee.memberId === memberIdForAttendance) {
              return {
                ...attendee,
                paymentStatus: "paid",
                paymentType: paymentType,
                paymentDate: nowIso,
                saleId: saleRef.id,
              };
            }
            return attendee;
          });

          attendanceBatch.update(eventRef, { attendees: updatedAttendees });
        }

        await attendanceBatch.commit();
      }
    }

    // Update the member's lastPaymentDate if this sale is paid
    if (
      saleData.isPaid &&
      saleData.memberId &&
      saleData.memberId !== "GUEST_EXTERNAL"
    ) {
      const memberRef = adminDb.collection("members").doc(saleData.memberId);
      const memberSnap = await memberRef.get();
      if (memberSnap.exists) {
        await memberRef.update({
          lastPaymentDate: new Date(saleData.saleDate).toISOString(),
        });
      }
    }

    serverCache.invalidatePattern("sales:");
    revalidatePath("/catalogs");
    revalidatePath("/reports");
    if (memberIdForAttendance) {
      revalidatePath(`/members/${memberIdForAttendance}`);
    }

    return { success: true, saleId: saleRef.id };
  } catch (error: any) {
    console.error("Error executeTrainingSaleAction:", error);
    return { success: false, error: error.message || "Грешка при продажба." };
  }
}
