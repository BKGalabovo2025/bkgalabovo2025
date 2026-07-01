/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { serverCache } from "@/lib/server-cache";

// --- Zod Schema for Service Validation ---
const ServiceSchema = z.object({
  name: z
    .string()
    .min(2, "�?мето трябва да е поне 2 символа."),
  price: z.coerce
    .number()
    .min(
      0,
      "Цената трябва да е положително число."
    ),
  currency: z.string().default("EUR"),
  description: z
    .string()
    .min(
      5,
      "Описанието трябва да е поне 5 символа."
    ),
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

function parseFormData(formData: FormData) {
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

async function logHistory(
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
    const rawData = parseFormData(formData);

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

    await logHistory(
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
      // eslint-disable-next-line sonarjs/no-nested-conditional
      message: `Грешка при сървъра: ${error instanceof Error ? (error instanceof Error ? error.message : "Unknown error") : "Неизвестна грешка"}`,
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
    const rawData = parseFormData(formData);

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

    await logHistory(
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
      // eslint-disable-next-line sonarjs/no-nested-conditional
      message: `Грешка при сървъра: ${error instanceof Error ? (error instanceof Error ? error.message : "Unknown error") : "Неизвестна грешка"}`,
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
      return {
        success: false,
        message: "Услугата не е намерена.",
      };
    }

    const serviceData = serviceSnap.data();
    await serviceRef.delete();

    await logHistory(
      adminDb,
      id,
      user.uid,
      user.displayName || user.email || "Unknown User",
      "delete",
      `�?зтрита услуга: ${serviceData?.name}`
    );

    serverCache.invalidate("clubServices");
    revalidatePath("/catalogs");
    revalidatePath("/finances/services");
    return {
      success: true,
      message: "Услугата беше изтрита успешно.",
    };
  } catch (error) {
    console.error("Error deleting service:", error);
    return {
      success: false,
      message: "Възникна грешка при изтриването.",
    };
  }
}

// --- Recovery Session Actions ---

const RecoverySessionSchema = z.object({
  name: z
    .string()
    .min(2, "�?мето трябва да е поне 2 символа."),
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
  imageUrl: z.string().optional().nullable(),
  imageDisplayMode: z
    .enum(["collage", "carousel"])
    .optional()
    .default("collage"),
});

export async function createRecoverySession(
  idToken: string,
  _prevState: ServiceState,
  formData: FormData
): Promise<ServiceState> {
  try {
    if (!idToken) throw new Error("Missing ID Token");
    const user = await getAuthUser(idToken);
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
      imageUrl: formData.get("imageUrl") || null,
      imageDisplayMode: formData.get("imageDisplayMode") || "collage",
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

    await logHistory(
      adminDb,
      sessionId,
      user.uid,
      user.displayName || user.email || "Unknown User",
      "create",
      `Създадена процедура: ${data.name}`
    );

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
    const user = await getAuthUser(idToken);
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
      imageUrl: formData.get("imageUrl") || null,
      imageDisplayMode: formData.get("imageDisplayMode") || "collage",
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

    const docRef = adminDb.collection("sessions").doc(id);
    const docSnap = await docRef.get();
    const oldData = docSnap.exists ? docSnap.data() : null;

    await docRef.update({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    let changesDesc = `Обновена процедура: ${data.name}`;
    if (oldData) {
      const changes = [];
      if (Number(oldData.price) !== Number(data.price))
        changes.push(`цена (${oldData.price} -> ${data.price})`);
      if (oldData.name !== data.name) changes.push(`име`);
      if (oldData.description !== data.description)
        changes.push(`описание`);
      if (
        Number(oldData.durationMinutes || oldData.duration) !==
        Number(data.durationMinutes)
      )
        changes.push(
          `времетраене (${oldData.durationMinutes || oldData.duration} -> ${data.durationMinutes})`
        );

      if (changes.length > 0) {
        changesDesc += ` (Променени: ${changes.join(", ")})`;
      }
    }

    await logHistory(
      adminDb,
      id,
      user.uid,
      user.displayName || user.email || "Unknown User",
      "update",
      changesDesc
    );

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
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const doc = await adminDb.collection("sessions").doc(id).get();
    const serviceName = doc.exists ? doc.data()?.name || "Unknown" : "Unknown";

    await adminDb.collection("sessions").doc(id).delete();

    await logHistory(
      adminDb,
      id,
      user.uid,
      user.displayName || user.email || "Unknown User",
      "delete",
      `�?зтрита процедура: ${serviceName}`
    );
    serverCache.invalidate("recoveryServices");
    revalidatePath("/catalogs");
    revalidatePath("/finances/recovery");
    return {
      success: true,
      message: "Процедурата беше изтрита успешно.",
    };
  } catch (error) {
    console.error("Error deleting recovery session:", error);
    return {
      success: false,
      message: "Грешка при изтриването.",
    };
  }
}

function createSaleRecord(
  batch: any,
  adminDb: any,
  saleData: any,
  user: any,
  now: string
) {
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
  return saleRef;
}

function createHistoryEvent(
  batch: any,
  adminDb: any,
  saleData: any,
  serviceName: string,
  clientName: string | undefined,
  user: any,
  saleRef: any
) {
  const serviceId = saleData.items[0]?.productId;
  if (!serviceId) return;

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

async function updatePaidEventsAttendance(
  adminDb: any,
  paidEventIds: string[],
  targetMemberIds: string[],
  paymentType: string,
  saleId: string
) {
  if (paidEventIds.length === 0 || targetMemberIds.length === 0) return;
  const nowIso = new Date().toISOString();
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

      const updatedAttendees = attendees.map((attendee) => {
        if (targetMemberIds.includes(attendee.memberId)) {
          return {
            ...attendee,
            paymentStatus: "paid",
            paymentType: paymentType,
            paymentDate: nowIso,
            saleId: saleId,
          };
        }
        return attendee;
      });

      attendanceBatch.update(eventRef, { attendees: updatedAttendees });
    }

    await attendanceBatch.commit();
  }
}

function getEventMonthKey(event: any): string | null {
  let eventDate: Date;
  if (event.startDate && typeof event.startDate.toDate === "function") {
    eventDate = event.startDate.toDate();
  } else if (event.startDate) {
    eventDate = new Date(event.startDate);
  } else {
    return null;
  }
  return `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}`;
}

async function syncMonthlyAttendanceForMember(
  adminDb: any,
  memberId: string,
  targetMonths: string[],
  paymentType: string,
  saleId: string,
  nowIsoSync: string
) {
  const eventsSnap = await adminDb
    .collection("events")
    .where("attendeeMemberIds", "array-contains", memberId)
    .get();

  const syncBatch = adminDb.batch();
  let syncCount = 0;

  for (const eventDoc of eventsSnap.docs) {
    const event = eventDoc.data();
    const eventMonthKey = getEventMonthKey(event);

    if (!eventMonthKey || !targetMonths.includes(eventMonthKey)) continue;

    const attendees: any[] = event.attendees || [];
    const idx = attendees.findIndex((a: any) => a.memberId === memberId);
    if (idx === -1) continue;

    const attendee = attendees[idx];
    if (
      !attendee.attended ||
      (attendee.paymentStatus === "paid" && attendee.saleId === saleId)
    )
      continue;

    const updatedAttendees = [...attendees];
    updatedAttendees[idx] = {
      ...attendee,
      paymentStatus: "paid",
      paymentType: paymentType,
      paymentDate: nowIsoSync,
      saleId: saleId,
    };

    syncBatch.update(eventDoc.ref, { attendees: updatedAttendees });
    syncCount++;

    if (syncCount % 400 === 0) {
      await syncBatch.commit();
    }
  }

  if (syncCount % 400 !== 0) {
    await syncBatch.commit();
  }
}

async function syncMonthlyAttendance(
  adminDb: any,
  targetMonths: string[],
  targetMemberIds: string[],
  paymentType: string,
  saleId: string
) {
  if (targetMonths.length === 0 || targetMemberIds.length === 0) return;
  const nowIsoSync = new Date().toISOString();

  for (const memberId of targetMemberIds) {
    await syncMonthlyAttendanceForMember(
      adminDb,
      memberId,
      targetMonths,
      paymentType,
      saleId,
      nowIsoSync
    );
  }
}

async function updateMembersLastPaymentDate(
  adminDb: any,
  saleData: any,
  targetMemberIds: string[]
) {
  if (!saleData.isPaid) return;

  const updateMember = async (id: string) => {
    if (!id || id === "GUEST_EXTERNAL") return;
    const mRef = adminDb.collection("members").doc(id);
    const mSnap = await mRef.get();
    if (mSnap.exists) {
      await mRef.update({
        lastPaymentDate: new Date(saleData.saleDate).toISOString(),
      });
    }
  };

  if (saleData.memberId) {
    await updateMember(saleData.memberId);
  }

  for (const tId of targetMemberIds) {
    if (tId !== saleData.memberId) {
      await updateMember(tId);
    }
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
    const saleRef = createSaleRecord(batch, adminDb, saleData, user, now);

    // 2. Записване на събитие в историята на тренировъчната услуга
    createHistoryEvent(
      batch,
      adminDb,
      saleData,
      serviceName,
      clientName,
      user,
      saleRef
    );

    await batch.commit();

    // 3. Атомарно обновяване на присъствията в събитията (платен статус)
    const paidEventIds: string[] = saleData.paidEventIds || [];
    const targetMemberIds: string[] =
      saleData.memberIdsForAttendance ||
      (saleData.memberIdForAttendance ? [saleData.memberIdForAttendance] : []);

    const paymentType: "subscription" | "individual" =
      saleData.paymentMode === "subscription" ? "subscription" : "individual";

    if (saleData.isPaid) {
      await updatePaidEventsAttendance(
        adminDb,
        paidEventIds,
        targetMemberIds,
        paymentType,
        saleRef.id
      );

      // 4. AUTO-SYNC: Mark ALL attended events in the covered months as paid
      const targetMonths: string[] = saleData.targetMonths || [];
      await syncMonthlyAttendance(
        adminDb,
        targetMonths,
        targetMemberIds,
        paymentType,
        saleRef.id
      );
    }

    // 5. Update the member's lastPaymentDate if this sale is paid
    await updateMembersLastPaymentDate(adminDb, saleData, targetMemberIds);

    serverCache.invalidatePattern("sales:");
    revalidatePath("/catalogs");
    revalidatePath("/reports");
    for (const tId of targetMemberIds) {
      revalidatePath(`/members/${tId}`);
    }

    return { success: true, saleId: saleRef.id };
  } catch (error: unknown) {
    console.error("Error executeTrainingSaleAction:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при продажба.",
    };
  }
}
