"use server";
import "server-only";

import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ensureAdmin, getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
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
    const user = await ensureAdmin(idToken);
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
    serverCache.invalidatePattern("members:");

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
    await ensureAdmin(idToken);
    const adminDb = getAdminDb();

    const memberRef = adminDb.collection("members").doc(id);
    const memberSnap = await memberRef.get();

    if (memberSnap.exists) {
      const data = memberSnap.data();
      const familyId = data?.familyId;

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
    serverCache.invalidatePattern("members:");

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
    await ensureAdmin(idToken);
    const adminDb = getAdminDb();
    const batch = adminDb.batch();

    memberIds.forEach((id) => {
      const memberRef = adminDb.collection("members").doc(id);
      batch.update(memberRef, {
        status,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    revalidatePath("/members");
    serverCache.invalidatePattern("members:");

    return {
      success: true,
      message: `Успешно обновени ${memberIds.length} членове.`,
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

    const adminDb = getAdminDb();

    // Fetch member, family search, and events concurrently
    const memberDocRef = adminDb.collection("members").doc(memberId);
    const familiesColRef = adminDb.collection("families");
    const eventsColRef = adminDb.collection("events");

    const [memberSnap, familyQuerySnap, eventsQuerySnap] = await Promise.all([
      memberDocRef.get(),
      familiesColRef.where("memberIds", "array-contains", memberId).get(),
      eventsColRef.where("attendeeMemberIds", "array-contains", memberId).get(),
    ]);

    if (!memberSnap.exists) {
      return {
        success: false,
        message: "Членът не бе намерен.",
      };
    }

    const memberData = snapToData<Member>(memberSnap);

    // Sort attendances by startDate desc
    const attendances = eventsQuerySnap.docs
      .map((d) => snapToData<ScheduleEvent>(d))
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

    let family: Family | null = null;
    let familyMembers: Member[] = [];
    const targetMemberIds = [memberId];

    if (!familyQuerySnap.empty) {
      const familyDoc = familyQuerySnap.docs[0];
      family = serializeFirestoreData({
        ...familyDoc.data(),
        id: familyDoc.id,
      }) as Family;

      const otherMemberIds = family.memberIds.filter((id) => id !== memberId);
      if (otherMemberIds.length > 0) {
        targetMemberIds.push(...otherMemberIds);

        // Fetch other family members concurrently
        const otherMembersSnaps = await Promise.all(
          otherMemberIds.map((id) =>
            adminDb.collection("members").doc(id).get()
          )
        );
        familyMembers = otherMembersSnaps
          .filter((snap) => snap.exists)
          .map((snap) => snapToData<Member>(snap));
      }
    }

    // Fetch sales for all family members (or single member if no family) concurrently
    const salesSnaps = await Promise.all(
      targetMemberIds.map((id) =>
        adminDb.collection("sales").where("memberId", "==", id).get()
      )
    );

    // Also fetch sales where memberIdsForAttendance contains the memberId
    const salesAttendanceSnaps = await Promise.all(
      targetMemberIds.map((id) =>
        adminDb
          .collection("sales")
          .where("memberIdsForAttendance", "array-contains", id)
          .get()
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
