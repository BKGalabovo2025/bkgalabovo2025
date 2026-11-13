"use server";
import "server-only";

import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAuditEvent } from "@/lib/audit-logger";
import {
  ensureAdmin,
  ensureAdminWithSite,
  getAuthUserFromSessionCookie,
} from "@/lib/auth-utils";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { getBackupDb } from "@/lib/firebase-admin-backup";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { serverCache } from "@/lib/server-cache";
import { Member, Sale, ScheduleEvent } from "@/types";
import { MemberSchema } from "@/types/member.types";

export type MemberActionState<T = unknown> = {
  errors?: { [key: string]: string[] | undefined };
  message?: string | null;
  success?: boolean;
  data?: T;
};

// --- Public Server Actions ---

/**
 * Creates a new member using Server Actions.
 */
export async function createMemberAction(
  idToken: string,
  memberData: Record<string, unknown>
): Promise<MemberActionState<{ id: string }>> {
  try {
    const targetSiteId = (memberData?.siteId as string) || undefined;
    const user = await ensureAdminWithSite(idToken, targetSiteId);
    const adminDb = getAdminDb();

    // Validation
    const validatedFields = MemberSchema.omit({
      id: true,
      name: true,
      updatedAt: true,
    })
      .extend({
        registrationDate: z.string().optional(),
      })
      .safeParse(memberData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Грешка при валидация на данните.",
      };
    }

    const data = validatedFields.data;
    const name = [data.firstName, data.middleName, data.lastName]
      .filter(Boolean)
      .join(" ");

    const docRef = await adminDb.collection("members").add({
      hasSignedDeclaration: false,
      hasMedicalCertificate: false,
      isLicensed: false,
      ...data,
      status: "active",
      name,
      registrationDate: data.registrationDate
        ? new Date(data.registrationDate)
        : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: { uid: user.uid, email: user.email },
    });

    // Audit log
    await logAuditEvent({
      action: "create_member",
      targetCollection: "members",
      targetId: docRef.id,
      siteId: (data.siteId as string) || "bkgalabovo",
      details: `Създаден нов член: ${name}`,
      userId: user.uid,
      userEmail: user.email || undefined,
      metadata: { name, email: data.email, role: data.memberType || "athlete" },
    });

    // If member is created with a familyId, update the family document
    if (data.familyId) {
      await adminDb
        .collection("families")
        .doc(data.familyId as string)
        .update({
          memberIds: FieldValue.arrayUnion(docRef.id),
          updatedAt: FieldValue.serverTimestamp(),
        });
      revalidatePath(`/families/${data.familyId}`);
    }

    revalidatePath("/members");
    revalidatePath("/dashboard");
    serverCache.invalidatePattern("members:");

    return {
      success: true,
      message: `Членът ${name} бе създаден успешно.`,
      data: { id: docRef.id },
    };
  } catch (error: unknown) {
    console.error("createMemberAction Error:", error);
    return {
      success: false,
      message: `Сървърна грешка: ${error instanceof Error ? error.message : "Неизвестна грешка"}`,
    };
  }
}

/**
 * Updates an existing member.
 */
export async function updateMemberAction(
  id: string,
  idToken: string,
  memberData: Record<string, unknown>
): Promise<MemberActionState> {
  try {
    const user = await ensureAdmin(idToken);
    const adminDb = getAdminDb();
    const docRef = adminDb.collection("members").doc(id);

    const existingSnap = await docRef.get();
    if (!existingSnap.exists) {
      return {
        success: false,
        message: "Членът не бе намерен.",
      };
    }
    const existingData = existingSnap.data();
    let targetSiteId = (memberData?.siteId as string) || existingData?.siteId;
    if (targetSiteId === "Зала Гълъбово") {
      targetSiteId = "bkgalabovo";
    }
    const allowedSites = (user as { allowedSites?: string[] }).allowedSites;
    if (
      targetSiteId &&
      allowedSites &&
      allowedSites.length > 0 &&
      !allowedSites.includes(targetSiteId)
    ) {
      return {
        success: false,
        message: "Нямате достъп до този клон.",
      };
    }

    // Validation (allow partial updates)
    const validatedFields = MemberSchema.omit({
      id: true,
      name: true,
      updatedAt: true,
    })
      .extend({
        registrationDate: z.string().optional(),
      })
      .partial()
      .safeParse(memberData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Грешка при валидация на данните.",
      };
    }

    const memberRef = adminDb.collection("members").doc(id);
    const data = validatedFields.data;

    // Recalculate name if name parts changed
    const currentSnap = await memberRef.get();
    if (!currentSnap.exists) throw new Error("Member not found.");
    const currentData = currentSnap.data()!;

    const firstName = data.firstName ?? currentData.firstName;
    const middleName = data.middleName ?? currentData.middleName;
    const lastName = data.lastName ?? currentData.lastName;

    const name = [firstName, middleName, lastName].filter(Boolean).join(" ");

    const updatePayload: Record<string, unknown> = {
      ...data,
      name,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: { uid: user.uid, email: user.email },
    };

    if (data.registrationDate) {
      updatePayload.registrationDate = new Date(data.registrationDate);
    }

    await memberRef.update(updatePayload);

    // Audit log
    await logAuditEvent({
      action: "update_member",
      targetCollection: "members",
      targetId: id,
      siteId:
        (data.siteId as string) ||
        (currentData.siteId as string) ||
        "bkgalabovo",
      details: `Редактирани данни на член: ${name}`,
      userId: user.uid,
      userEmail: user.email || undefined,
      metadata: { updatedFields: Object.keys(data) },
    });

    // Handle family changes if familyId is provided in the update
    if (data.familyId !== undefined && data.familyId !== currentData.familyId) {
      // Remove from old family
      if (currentData.familyId) {
        await adminDb
          .collection("families")
          .doc(currentData.familyId)
          .update({
            memberIds: FieldValue.arrayRemove(id),
            updatedAt: FieldValue.serverTimestamp(),
          });
        revalidatePath(`/families/${currentData.familyId}`);
      }

      // Add to new family
      if (data.familyId) {
        await adminDb
          .collection("families")
          .doc(data.familyId as string)
          .update({
            memberIds: FieldValue.arrayUnion(id),
            updatedAt: FieldValue.serverTimestamp(),
          });
        revalidatePath(`/families/${data.familyId}`);
      }
    }

    revalidatePath("/members");
    revalidatePath(`/members/${id}`);
    revalidatePath("/club/parents");
    serverCache.invalidatePattern("members:");
    serverCache.invalidatePattern("parent-dashboard:");

    return {
      success: true,
      message: "Данните на члена бяха актуализирани.",
    };
  } catch (error: unknown) {
    console.error("updateMemberAction Error:", error);
    return {
      success: false,
      message: "Грешка при актуализиране на данните.",
    };
  }
}

/**
 * Deletes a member.
 */
export async function deleteMemberAction(
  id: string,
  idToken: string
): Promise<MemberActionState> {
  try {
    const user = await ensureAdmin(idToken);
    const adminDb = getAdminDb();

    const memberRef = adminDb.collection("members").doc(id);
    const memberSnap = await memberRef.get();

    if (memberSnap.exists) {
      const data = memberSnap.data();
      const familyId = data?.familyId;
      const memberName = data?.name || id;
      const siteId = (data?.siteId as string) || "bkgalabovo";
      const allowedSites = (user as { allowedSites?: string[] }).allowedSites;
      if (
        siteId &&
        allowedSites &&
        allowedSites.length > 0 &&
        !allowedSites.includes(siteId)
      ) {
        return {
          success: false,
          message: "Нямате достъп до този клон.",
        };
      }

      // Audit log before deletion
      await logAuditEvent({
        action: "delete_member",
        targetCollection: "members",
        targetId: id,
        siteId,
        details: `Изтрит член: ${memberName}`,
        userId: user.uid,
        userEmail: user.email || undefined,
      });

      if (familyId) {
        const familyRef = adminDb.collection("families").doc(familyId);
        await familyRef.update({
          memberIds: FieldValue.arrayRemove(id),
          updatedAt: FieldValue.serverTimestamp(),
        });

        const familySnap = await familyRef.get();
        const familyData = familySnap.data();
        if (
          familyData &&
          (!familyData.memberIds || familyData.memberIds.length === 0)
        ) {
          await familyRef.delete();
          revalidatePath("/families");
        } else {
          revalidatePath(`/families/${familyId}`);
        }
      }
    }

    await memberRef.delete();

    revalidatePath("/members");
    revalidatePath("/club/parents");
    serverCache.invalidatePattern("members:");
    serverCache.invalidatePattern("parent-dashboard:");

    return {
      success: true,
      message: "Членът бе изтрит успешно.",
    };
  } catch (error: unknown) {
    console.error("deleteMemberAction Error:", error);
    return {
      success: false,
      message: "Грешка при изтриване на члена.",
    };
  }
}

/**
 * Bulk updates the status of multiple members.
 */
export async function bulkUpdateMemberStatusAction(
  memberIds: string[],
  status: "active" | "inactive" | "suspended",
  idToken: string
): Promise<MemberActionState> {
  try {
    const user = await ensureAdmin(idToken);
    const adminDb = getAdminDb();

    const allowedSites = (user as { allowedSites?: string[] }).allowedSites;
    if (allowedSites && allowedSites.length > 0 && memberIds.length > 0) {
      const memberRefs = memberIds.map((id) =>
        adminDb.collection("members").doc(id)
      );
      const memberSnaps = await adminDb.getAll(...memberRefs);
      for (const snap of memberSnaps) {
        if (!snap.exists) continue;
        let targetSiteId = snap.data()?.siteId as string | undefined;
        if (targetSiteId === "Зала Гълъбово") {
          targetSiteId = "bkgalabovo";
        }
        if (targetSiteId && !allowedSites.includes(targetSiteId)) {
          return {
            success: false,
            message: "Нямате достъп до този клон.",
          };
        }
      }
    }

    const batch = adminDb.batch();

    memberIds.forEach((id) => {
      const memberRef = adminDb.collection("members").doc(id);
      batch.update(memberRef, {
        status,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: { uid: user.uid, email: user.email },
      });
    });

    await batch.commit();

    // Audit log
    await logAuditEvent({
      action: "toggle_member_status",
      targetCollection: "members",
      details: `Масова промяна на статус на ${memberIds.length} членове на "${status}"`,
      userId: user.uid,
      userEmail: user.email || undefined,
      metadata: { memberIds, status },
    });

    revalidatePath("/members");
    revalidatePath("/club/parents");
    serverCache.invalidatePattern("members:");
    serverCache.invalidatePattern("parent-dashboard:");

    return {
      success: true,
      message: `Статусът на ${memberIds.length} членове бе променен на ${status}.`,
    };
  } catch (error: unknown) {
    console.error("bulkUpdateMemberStatusAction Error:", error);
    return {
      success: false,
      message: "Грешка при масово обновяване на статуса.",
    };
  }
}

function snapToData<T>(
  doc: admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot
): T {
  const data = doc.data();
  if (!data) return null as unknown as T;
  const convertTimestamps = (val: unknown): unknown => {
    if (!val) return val;
    if (typeof (val as { toDate?: unknown }).toDate === "function") {
      return (val as admin.firestore.Timestamp).toDate().toISOString();
    }
    if (Array.isArray(val)) {
      return val.map(convertTimestamps);
    }
    if (typeof val === "object") {
      const copy: Record<string, unknown> = {};
      for (const key of Object.keys(val)) {
        copy[key] = convertTimestamps((val as Record<string, unknown>)[key]);
      }
      return copy;
    }
    return val;
  };
  return {
    id: doc.id,
    ...(convertTimestamps(data) as Record<string, unknown>),
  } as T;
}

interface Family {
  id: string;
  name?: string;
  memberIds: string[];
  siteId?: string;
}

/**
 * Server action to fetch a member's complete profile data (member, family, family members, sales, attendances) concurrently.
 */
export async function getMemberProfileDataServerAction(
  memberId: string
): Promise<
  MemberActionState<{
    member: Member;
    family: Family | null;
    familyMembers: Member[];
    attendances: ScheduleEvent[];
    sales: Sale[];
  }>
> {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Unauthorized");

    const cleanMemberId = decodeURIComponent(memberId || "").trim();
    if (!cleanMemberId) {
      return {
        success: false,
        message: "Невалиден идентификатор на член.",
      };
    }

    const adminDb = getAdminDb();

    // 1. Resilient Member Lookup:
    // A: Direct doc get on primary / resilient adminDb
    let memberSnap:
      | admin.firestore.DocumentSnapshot
      | admin.firestore.QueryDocumentSnapshot
      | null = null;

    try {
      const snap = await adminDb.collection("members").doc(cleanMemberId).get();
      if (snap.exists) {
        memberSnap = snap;
      }
    } catch (err) {
      console.warn("[getMemberProfileData] Primary doc get failed:", err);
    }

    // B: Direct doc get on backup DB if not found
    if (!memberSnap || !memberSnap.exists) {
      const backupDb = getBackupDb();
      if (backupDb) {
        try {
          const bSnap = await backupDb
            .collection("members")
            .doc(cleanMemberId)
            .get();
          if (bSnap.exists) {
            memberSnap = bSnap;
          }
        } catch (err) {
          console.warn("[getMemberProfileData] Backup doc get failed:", err);
        }
      }
    }

    // C: Query by internal `id` field in case doc.id differs
    if (!memberSnap || !memberSnap.exists) {
      try {
        const querySnap = await adminDb
          .collection("members")
          .where("id", "==", cleanMemberId)
          .limit(1)
          .get();
        if (!querySnap.empty) {
          memberSnap = querySnap.docs[0];
        } else {
          const backupDb = getBackupDb();
          if (backupDb) {
            const bQuerySnap = await backupDb
              .collection("members")
              .where("id", "==", cleanMemberId)
              .limit(1)
              .get();
            if (!bQuerySnap.empty) {
              memberSnap = bQuerySnap.docs[0];
            }
          }
        }
      } catch (err) {
        console.warn("[getMemberProfileData] Query by id field failed:", err);
      }
    }

    let memberData: Member | null = null;
    if (memberSnap && memberSnap.exists) {
      memberData = snapToData<Member>(memberSnap);
    } else {
      // D: Check cached all members list
      try {
        const { getAllMembersServer } =
          await import("@/services/member-service.server");
        const all = await getAllMembersServer();
        const found = all.find(
          (m) =>
            m.id === cleanMemberId ||
            (m as Record<string, unknown>)._id === cleanMemberId
        );
        if (found) {
          memberData = found;
        }
      } catch (err) {
        console.warn(
          "[getMemberProfileData] getAllMembersServer fallback failed:",
          err
        );
      }
    }

    if (!memberData) {
      return {
        success: false,
        message: "Членът не бе намерен.",
      };
    }

    const effectiveMemberId = memberData.id || cleanMemberId;
    const familiesColRef = adminDb.collection("families");
    const eventsColRef = adminDb.collection("events");

    // Fetch family search and events concurrently with safe catches
    const [familyQuerySnap, eventsQuerySnap] = await Promise.all([
      familiesColRef
        .where("memberIds", "array-contains", effectiveMemberId)
        .get()
        .catch(() => ({
          empty: true,
          docs: [] as admin.firestore.QueryDocumentSnapshot[],
        })),
      eventsColRef
        .where("attendeeMemberIds", "array-contains", effectiveMemberId)
        .get()
        .catch(() => ({
          empty: true,
          docs: [] as admin.firestore.QueryDocumentSnapshot[],
        })),
    ]);

    // Sort attendances by startDate desc
    const attendances = eventsQuerySnap.docs
      .map((d) => snapToData<ScheduleEvent>(d))
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

    let family: Family | null = null;
    let familyMembers: Member[] = [];
    const targetMemberIds = [effectiveMemberId];

    if (!familyQuerySnap.empty) {
      const familyDoc = familyQuerySnap.docs[0];
      family = serializeFirestoreData({
        ...familyDoc.data(),
        id: familyDoc.id,
      }) as Family;

      const otherMemberIds = (family.memberIds || []).filter(
        (id) => id !== effectiveMemberId
      );
      if (otherMemberIds.length > 0) {
        targetMemberIds.push(...otherMemberIds);

        // Fetch other family members concurrently
        const otherMembersSnaps = await Promise.all(
          otherMemberIds.map((id) =>
            adminDb
              .collection("members")
              .doc(id)
              .get()
              .catch(() => null)
          )
        );
        familyMembers = otherMembersSnaps
          .filter((snap): snap is admin.firestore.DocumentSnapshot =>
            Boolean(snap?.exists)
          )
          .map((snap) => snapToData<Member>(snap));
      }
    }

    // Fetch sales for all family members (or single member if no family) concurrently
    const salesSnaps = await Promise.all(
      targetMemberIds.map((id) =>
        adminDb
          .collection("sales")
          .where("memberId", "==", id)
          .get()
          .catch(() => ({
            docs: [] as admin.firestore.QueryDocumentSnapshot[],
          }))
      )
    );

    // Also fetch sales where memberIdsForAttendance contains the memberId
    const salesAttendanceSnaps = await Promise.all(
      targetMemberIds.map((id) =>
        adminDb
          .collection("sales")
          .where("memberIdsForAttendance", "array-contains", id)
          .get()
          .catch(() => ({
            docs: [] as admin.firestore.QueryDocumentSnapshot[],
          }))
      )
    );

    // Merge and deduplicate sales
    const salesMap = new Map<string, Sale>();

    salesSnaps.forEach((querySnap) => {
      querySnap.docs.forEach((doc) => {
        const sale = snapToData<Sale>(doc);
        salesMap.set(sale.id, sale);
      });
    });

    salesAttendanceSnaps.forEach((querySnap) => {
      querySnap.docs.forEach((doc) => {
        const sale = snapToData<Sale>(doc);
        salesMap.set(sale.id, sale);
      });
    });

    const sales = Array.from(salesMap.values()).sort(
      (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
    );

    return {
      success: true,
      data: {
        member: memberData,
        family,
        familyMembers,
        attendances,
        sales,
      },
    };
  } catch (error: unknown) {
    console.error("getMemberProfileDataServerAction Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "������ ��� ��������� �� �������.",
    };
  }
}

/**
 * Fetches all members safely on the server using Admin SDK.
 * Bypasses client-side auth race conditions and security rules latency.
 */
export async function getMembersAction(siteId?: string): Promise<{
  success: boolean;
  data: Member[];
  error?: string;
}> {
  try {
    const { getAllMembersServer } =
      await import("@/services/member-service.server");
    const members = await getAllMembersServer(siteId);
    return { success: true, data: members };
  } catch (error) {
    console.error("getMembersAction error:", error);
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на списъка с членове",
    };
  }
}

/**
 * Uploads a physical medical certificate (photo / PDF) for a member by Admin.
 */
export async function uploadAdminMedicalCertificateAction(input: {
  memberId: string;
  fileBase64: string;
  fileName?: string;
  certificateDate: string;
  idToken: string;
}): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    const user = await ensureAdmin(input.idToken);
    const adminDb = getAdminDb();
    const memberRef = adminDb.collection("members").doc(input.memberId);
    const memberDoc = await memberRef.get();

    if (!memberDoc.exists) {
      return { success: false, error: "Членът не е намерен." };
    }

    let fileUrl = input.fileBase64;
    try {
      const storage = getAdminStorage();
      const bucket = storage.bucket();
      const [header, base64Data] = input.fileBase64.split(",");
      if (base64Data) {
        const mimeType = header?.match(/:(.*?);/)?.[1] || "image/jpeg";
        const ext = mimeType.includes("pdf") ? "pdf" : "jpg";
        const filename = `medical-certificates/${input.memberId}_${Date.now()}.${ext}`;
        const file = bucket.file(filename);
        await file.save(Buffer.from(base64Data, "base64"), {
          contentType: mimeType,
          public: true,
          metadata: { cacheControl: "public, max-age=31536000" },
        });
        fileUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      }
    } catch (storageErr) {
      console.warn("Storage upload fallback to base64:", storageErr);
      fileUrl = input.fileBase64;
    }

    const now = new Date().toISOString();
    await memberRef.update({
      hasMedicalCertificate: true,
      medicalCertificateDate: input.certificateDate,
      medicalCertificateHandedAt: now,
      medicalCertificateUrl: fileUrl,
      medicalCertificateFileName: input.fileName || "medical-certificate",
      medicalCertificateUploadedAt: now,
      medicalCertificateStatus: "valid",
      updatedAt: FieldValue.serverTimestamp(),
    });

    await logAuditEvent({
      action: "update_member",
      targetCollection: "members",
      targetId: input.memberId,
      userId: user.uid,
      userEmail: user.email || "admin@bkgalabovo.com",
      details: `Качено медицинско свидетелство за състезател ID: ${input.memberId}`,
    });

    serverCache.invalidatePattern("members:");
    serverCache.invalidatePattern("parent-dashboard:");
    revalidatePath(`/members/${input.memberId}`);
    revalidatePath("/members");
    revalidatePath("/club/parents");

    return { success: true, fileUrl };
  } catch (error) {
    console.error("uploadAdminMedicalCertificateAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при качване на медицинско свидетелство.",
    };
  }
}
