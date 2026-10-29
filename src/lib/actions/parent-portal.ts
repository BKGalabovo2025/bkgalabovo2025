"use server";
import "server-only";

// Cache invalidation trigger
import { format, isValid } from "date-fns";
import { bg } from "date-fns/locale";
import { revalidatePath } from "next/cache";

import { getAdminDb } from "@/lib/firebase-admin";
import {
  clearParentSession,
  generatePasswordResetToken,
  getParentSession,
  hashPassword,
  setParentSessionCookie,
  signParentToken,
  verifyPassword,
  verifyPasswordResetToken,
} from "@/lib/parent-auth";
import {
  notifyAdminNewAbsence,
  notifyAdminNewCorrection,
  notifyAdminNewRequest,
  notifyAdminParentCreated,
  notifyParentApproved,
  notifyParentCorrectionApproved,
  notifyParentCreatedManually,
  notifyParentPasswordReset,
  notifyParentRejected,
} from "@/lib/parent-email-templates";
import { arePhoneNumbersEqual, normalizePhoneNumber } from "@/lib/phone-utils";
import { formatDobString, serializeFirestoreData } from "@/lib/serialize-utils";
import {
  DataCorrectionRequest,
  DefaultParentMemberPermissions,
  ParentAbsence,
  ParentAccessRequest,
  ParentActivityLog,
  ParentAnnouncement,
  ParentAttendanceRecord,
  ParentMemberPermissions,
  ParentRole,
  ParentUser,
} from "@/types/parent-portal.types";

const PARENT_REQUESTS_COLLECTION = "parent_requests";
const PARENT_USERS_COLLECTION = "parent_users";
const PARENT_ABSENCES_COLLECTION = "parent_absences";
const PARENT_CORRECTIONS_COLLECTION = "parent_corrections";
const PARENT_ACTIVITY_LOGS_COLLECTION = "parent_activity_logs";
const MEMBERS_COLLECTION = "members";

/**
 * 1. Submit parent access request from public registration form.
 */
export async function submitParentAccessRequestAction(data: {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  password: string;
  parentRole: ParentRole;
  childFullName: string;
  childBirthDate: string;
}) {
  try {
    const parentName = data.parentName.trim();
    const parentPhone = normalizePhoneNumber(data.parentPhone);
    const parentEmail = data.parentEmail.trim().toLowerCase();
    const childFullName = data.childFullName.trim();
    const childBirthDate = data.childBirthDate.trim();

    if (!parentName || parentName.length < 2) {
      return {
        success: false,
        error: "Моля, въведете име и фамилия на родителя.",
      };
    }
    if (!parentPhone || parentPhone.length < 7) {
      return { success: false, error: "Невалиден телефонен номер." };
    }
    if (!parentEmail || !parentEmail.includes("@")) {
      return { success: false, error: "Невалиден имейл адрес." };
    }
    if (!data.password || data.password.length < 6) {
      return {
        success: false,
        error: "Паролата трябва да съдържа поне 6 символа.",
      };
    }
    if (!childFullName || childFullName.length < 2) {
      return { success: false, error: "Моля, въведете имената на детето." };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(childBirthDate)) {
      return {
        success: false,
        error: "Невалидна дата на раждане на детето (ГГГГ-ММ-ДД).",
      };
    }

    const adminDb = getAdminDb();

    // 1. Check if parent is already active in parent_users
    const existingUsersByEmail = await adminDb
      .collection(PARENT_USERS_COLLECTION)
      .where("email", "==", parentEmail)
      .limit(1)
      .get();

    if (!existingUsersByEmail.empty) {
      return {
        success: false,
        error:
          "Вече съществува регистриран профил с този имейл адрес. Моля, влезте от страницата за вход или използвайте 'Забравена парола'.",
      };
    }

    const existingUsersByPhone = await adminDb
      .collection(PARENT_USERS_COLLECTION)
      .where("phone", "==", parentPhone)
      .limit(1)
      .get();

    if (!existingUsersByPhone.empty) {
      return {
        success: false,
        error:
          "Вече съществува регистриран профил с този телефонен номер. Моля, влезте от страницата за вход или използвайте 'Забравена парола'.",
      };
    }

    // 2. Check if a pending request already exists
    const pendingReqs = await adminDb
      .collection(PARENT_REQUESTS_COLLECTION)
      .where("status", "==", "pending")
      .where("parentEmail", "==", parentEmail)
      .limit(1)
      .get();

    if (!pendingReqs.empty) {
      return {
        success: false,
        error:
          "Вече има изпратена чакаща заявка с този имейл. Моля, изчакайте преглед и одобрение от треньор.",
      };
    }

    // 3. Search for matching member in members collection
    const membersSnap = await adminDb
      .collection(MEMBERS_COLLECTION)
      .where("siteId", "==", "bkgalabovo")
      .get();

    let matchedMemberId: string | null = null;
    let matchedFamilyId: string | null = null;
    let isSecondParent = false;

    const childClean = childFullName.toLowerCase().replace(/\s+/g, " ");

    for (const doc of membersSnap.docs) {
      const m = doc.data();
      const mName = `${m.firstName || ""} ${m.lastName || ""}`
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
      const mBirth = (m.dateOfBirth || "").slice(0, 10);

      const isNameMatch =
        mName === childClean ||
        mName.includes(childClean) ||
        childClean.includes(mName);
      const isBirthMatch = mBirth === childBirthDate;
      const isPhoneMatch =
        arePhoneNumbersEqual(m.phone, parentPhone) ||
        arePhoneNumbersEqual(m.parentPhone, parentPhone) ||
        arePhoneNumbersEqual(m.motherPhone, parentPhone) ||
        arePhoneNumbersEqual(m.fatherPhone, parentPhone);

      // High confidence: name and birth date OR name and parent phone
      if (isNameMatch && (isBirthMatch || isPhoneMatch)) {
        matchedMemberId = doc.id;
        matchedFamilyId = m.familyId || null;
        break;
      }
    }

    // Check if this child already has another registered parent
    if (matchedMemberId) {
      const otherParents = await adminDb
        .collection(PARENT_USERS_COLLECTION)
        .where("linkedMemberIds", "array-contains", matchedMemberId)
        .limit(1)
        .get();
      if (!otherParents.empty) {
        isSecondParent = true;
      }
    }

    const passwordHash = hashPassword(data.password);
    const newDocRef = adminDb.collection(PARENT_REQUESTS_COLLECTION).doc();

    const requestObj: ParentAccessRequest = {
      id: newDocRef.id,
      siteId: "bkgalabovo",
      parentName,
      parentPhone,
      parentEmail,
      passwordHash,
      parentRole: data.parentRole,
      childFullName,
      childBirthDate,
      matchedMemberId,
      matchedFamilyId,
      isSecondParent,
      status: "pending",
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    };

    await newDocRef.set(requestObj);

    // Fire email notification to admin
    try {
      await notifyAdminNewRequest(requestObj);
    } catch (err) {
      console.warn("Failed to notify admin of new request:", err);
    }

    return { success: true };
  } catch (error) {
    console.error("submitParentAccessRequestAction error:", error);
    return {
      success: false,
      error:
        "Възникна системна грешка при изпращане на заявката. Моля, опитайте отново.",
    };
  }
}

/**
 * 2. Parent login action (using Phone OR Email + Password).
 */
export async function parentLoginAction(
  identifier: string,
  password: string,
  rememberMe: boolean = true
) {
  try {
    const rawId = identifier.trim();
    if (!rawId || !password) {
      return {
        success: false,
        error: "Моля, въведете телефон/имейл и парола.",
      };
    }

    const adminDb = getAdminDb();
    let parentDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

    // Check if identifier looks like an email or phone
    if (rawId.includes("@")) {
      const emailSnap = await adminDb
        .collection(PARENT_USERS_COLLECTION)
        .where("email", "==", rawId.toLowerCase())
        .limit(1)
        .get();
      if (!emailSnap.empty) {
        parentDoc = emailSnap.docs[0];
      }
    } else {
      const normPhone = normalizePhoneNumber(rawId);
      const phoneSnap = await adminDb
        .collection(PARENT_USERS_COLLECTION)
        .where("phone", "==", normPhone)
        .limit(1)
        .get();
      if (!phoneSnap.empty) {
        parentDoc = phoneSnap.docs[0];
      }
    }

    // Fallback: search both
    if (!parentDoc) {
      const normPhone = normalizePhoneNumber(rawId);
      const fallbackSnap = await adminDb
        .collection(PARENT_USERS_COLLECTION)
        .where("phone", "==", normPhone)
        .limit(1)
        .get();
      if (!fallbackSnap.empty) {
        parentDoc = fallbackSnap.docs[0];
      }
    }

    if (!parentDoc) {
      return { success: false, error: "Грешен телефон, имейл или парола." };
    }

    const parentUser = parentDoc.data() as ParentUser;

    if (parentUser.status === "suspended") {
      return {
        success: false,
        error:
          "Този профил е временно деактивиран от администратора. Моля, свържете се с клуба.",
      };
    }

    const isMatch = verifyPassword(password, parentUser.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Грешен телефон, имейл или парола." };
    }

    const token = signParentToken(
      {
        parentId: parentDoc.id,
        email: parentUser.email,
        phone: parentUser.phone,
      },
      rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24
    );

    await setParentSessionCookie(token, rememberMe);

    // Update last login, presence & action timestamps
    const nowIso = new Date().toISOString();
    await parentDoc.ref.update({
      lastLoginAt: nowIso,
      lastActiveAt: nowIso,
      lastAction: "Вход в родителския портал",
      lastActionAt: nowIso,
      updatedAt: nowIso,
    });

    // Record login activity log
    try {
      const logRef = adminDb.collection(PARENT_ACTIVITY_LOGS_COLLECTION).doc();
      await logRef.set({
        id: logRef.id,
        siteId: "bkgalabovo",
        parentUserId: parentDoc.id,
        parentName: parentUser.name,
        parentRole: parentUser.parentRole,
        action: "login",
        actionTitle: "Вход в родителския портал",
        details: rememberMe ? "Запомнен профил" : "Сесия",
        timestamp: nowIso,
      });
    } catch (err) {
      console.warn("Could not record login log:", err);
    }

    return {
      success: true,
      parent: {
        id: parentDoc.id,
        name: parentUser.name,
        email: parentUser.email,
        phone: parentUser.phone,
        linkedMemberIds: parentUser.linkedMemberIds || [],
      },
    };
  } catch (error) {
    console.error("parentLoginAction error:", error);
    return {
      success: false,
      error: "Възникна системна грешка при вход. Моля, опитайте отново.",
    };
  }
}

/**
 * 3. Parent logout.
 */
export async function parentLogoutAction() {
  await clearParentSession();
  return { success: true };
}

/**
 * 3.1 Change parent password by the logged-in parent.
 */
export async function changeParentPasswordAction(
  currentPassword: string,
  newPassword: string
) {
  try {
    const parent = await getActiveParentUserAction();
    if (!parent) {
      return {
        success: false,
        error: "Нямате активна родителска сесия. Моля, влезте отново.",
      };
    }

    if (!currentPassword || !newPassword) {
      return {
        success: false,
        error: "Моля, попълнете текущата и новата парола.",
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        error: "Новата парола трябва да бъде поне 6 символа.",
      };
    }

    const isMatch = verifyPassword(currentPassword, parent.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Грешна текуща парола." };
    }

    const adminDb = getAdminDb();
    const newHash = hashPassword(newPassword);

    await adminDb.collection(PARENT_USERS_COLLECTION).doc(parent.id).update({
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
    });

    try {
      const logRef = adminDb.collection(PARENT_ACTIVITY_LOGS_COLLECTION).doc();
      await logRef.set({
        id: logRef.id,
        siteId: "bkgalabovo",
        parentUserId: parent.id,
        parentName: parent.name,
        parentRole: parent.parentRole,
        action: "password_change",
        actionTitle: "Смяна на парола",
        details: "Успешна смяна на временната парола с лична",
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Non-blocking log
    }

    return { success: true };
  } catch (error) {
    console.error("changeParentPasswordAction error:", error);
    return { success: false, error: "Грешка при промяна на паролата." };
  }
}

/**
 * 4. Get active parent user session with fresh data from Firestore.
 */
export async function getActiveParentUserAction(): Promise<ParentUser | null> {
  try {
    const session = await getParentSession();
    if (!session?.parentId) return null;

    const adminDb = getAdminDb();
    const doc = await adminDb
      .collection(PARENT_USERS_COLLECTION)
      .doc(session.parentId)
      .get();

    if (!doc.exists) return null;
    const data = doc.data() as ParentUser;
    if (data.status === "suspended") return null;

    return { ...data, id: doc.id };
  } catch (error) {
    console.error("getActiveParentUserAction error:", error);
    return null;
  }
}

/**
 * 5. Approve parent access request (Admin action).
 */
export async function approveParentAccessRequestAction(
  requestId: string,
  options?: {
    customPermissions?: ParentMemberPermissions;
    manualMemberId?: string;
  }
) {
  try {
    const adminDb = getAdminDb();
    const reqRef = adminDb
      .collection(PARENT_REQUESTS_COLLECTION)
      .doc(requestId);
    const reqSnap = await reqRef.get();

    if (!reqSnap.exists) {
      return { success: false, error: "Заявката не е намерена." };
    }

    const reqData = reqSnap.data() as ParentAccessRequest;
    if (reqData.status === "approved") {
      return { success: false, error: "Тази заявка вече е одобрена." };
    }

    const targetMemberId = options?.manualMemberId || reqData.matchedMemberId;
    if (!targetMemberId) {
      return {
        success: false,
        error:
          "Няма асоцииран член (дете). Моля, изберете член от списъка преди одобрение.",
      };
    }

    // Fetch primary member
    const memberRef = adminDb
      .collection(MEMBERS_COLLECTION)
      .doc(targetMemberId);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
      return {
        success: false,
        error: "Избраният член не съществува в базата данни.",
      };
    }

    const memberData = memberSnap.data() || {};
    const familyId = memberData.familyId || null;

    // Find all sibling members in the same family
    const linkedMemberIds = [targetMemberId];
    if (familyId) {
      const familySnap = await adminDb
        .collection(MEMBERS_COLLECTION)
        .where("familyId", "==", familyId)
        .where("siteId", "==", "bkgalabovo")
        .get();

      for (const fDoc of familySnap.docs) {
        const m = fDoc.data() || {};
        const isAdultOrCoach =
          m.isCoach ||
          m.role === "coach" ||
          (typeof m.notes === "string" && m.notes.includes("ТРЕНЬОР")) ||
          (m.dateOfBirth &&
            parseInt(String(m.dateOfBirth).slice(0, 4)) <
              new Date().getFullYear() - 18);
        const isSamePhone =
          reqData.parentPhone && m.phone === reqData.parentPhone;
        const isSameEmail =
          reqData.parentEmail &&
          m.email &&
          m.email.toLowerCase() === reqData.parentEmail.toLowerCase();
        if (
          !linkedMemberIds.includes(fDoc.id) &&
          !isAdultOrCoach &&
          !isSamePhone &&
          !isSameEmail
        ) {
          linkedMemberIds.push(fDoc.id);
        }
      }
    }

    // Build permissions map
    const basePermissions =
      options?.customPermissions || DefaultParentMemberPermissions;
    const permissionsPerMember: Record<string, ParentMemberPermissions> = {};

    linkedMemberIds.forEach((mId) => {
      // Primary member gets requested permissions, siblings start with default
      permissionsPerMember[mId] =
        mId === targetMemberId
          ? { ...basePermissions }
          : { ...DefaultParentMemberPermissions };
    });

    const nowIso = new Date().toISOString();

    // Check if a parent_user with this email/phone already exists to merge, or create new
    const existingUserQuery = await adminDb
      .collection(PARENT_USERS_COLLECTION)
      .where("email", "==", reqData.parentEmail)
      .limit(1)
      .get();

    let parentUserId: string;

    if (!existingUserQuery.empty) {
      const existingDoc = existingUserQuery.docs[0];
      parentUserId = existingDoc.id;
      const existingData = existingDoc.data() as ParentUser;
      const mergedMembers = Array.from(
        new Set([...(existingData.linkedMemberIds || []), ...linkedMemberIds])
      );
      const mergedPermissions = {
        ...(existingData.permissionsPerMember || {}),
        ...permissionsPerMember,
      };

      await existingDoc.ref.update({
        linkedMemberIds: mergedMembers,
        permissionsPerMember: mergedPermissions,
        familyId: familyId || existingData.familyId || null,
        updatedAt: nowIso,
        status: "active",
      });
    } else {
      const newParentRef = adminDb.collection(PARENT_USERS_COLLECTION).doc();
      parentUserId = newParentRef.id;

      const newParentObj: ParentUser = {
        id: parentUserId,
        siteId: "bkgalabovo",
        name: reqData.parentName,
        phone: reqData.parentPhone,
        email: reqData.parentEmail,
        passwordHash: reqData.passwordHash,
        parentRole: reqData.parentRole,
        status: "active",
        linkedMemberIds,
        familyId,
        permissionsPerMember,
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: null,
      };

      await newParentRef.set(newParentObj);
    }

    // Automatically update the member's card with parent contact info!
    const memberUpdates: Record<string, string> = {
      parentName: reqData.parentName,
      parentPhone: reqData.parentPhone,
      parentEmail: reqData.parentEmail,
    };

    if (reqData.parentRole === "mother") {
      memberUpdates.motherName = reqData.parentName;
      memberUpdates.motherPhone = reqData.parentPhone;
    } else if (reqData.parentRole === "father") {
      memberUpdates.fatherName = reqData.parentName;
      memberUpdates.fatherPhone = reqData.parentPhone;
    }

    await memberRef.update(memberUpdates);

    // Update request document to approved
    await reqRef.update({
      status: "approved",
      matchedMemberId: targetMemberId,
      matchedFamilyId: familyId,
      reviewedAt: nowIso,
    });

    // Notify parent via email
    const siteUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://bkgalabovo2025.vercel.app";
    const loginUrl = `${siteUrl}/club/parents/login`;
    const childFullName =
      `${memberData.firstName || ""} ${memberData.lastName || ""}`.trim() ||
      reqData.childFullName;

    try {
      await notifyParentApproved(
        reqData.parentEmail,
        reqData.parentName,
        childFullName,
        loginUrl
      );
    } catch (err) {
      console.warn("Failed to notify parent of approval:", err);
    }

    revalidatePath("/members");
    revalidatePath(`/members/${targetMemberId}`);

    return { success: true };
  } catch (error) {
    console.error("approveParentAccessRequestAction error:", error);
    return {
      success: false,
      error: "Възникна системна грешка при одобряване на заявката.",
    };
  }
}

/**
 * 6. Reject parent access request with reason (Admin action).
 */
export async function rejectParentAccessRequestAction(
  requestId: string,
  reason: string
) {
  try {
    const adminDb = getAdminDb();
    const reqRef = adminDb
      .collection(PARENT_REQUESTS_COLLECTION)
      .doc(requestId);
    const snap = await reqRef.get();

    if (!snap.exists) {
      return { success: false, error: "Заявката не е намерена." };
    }

    const data = snap.data() as ParentAccessRequest;
    const nowIso = new Date().toISOString();

    await reqRef.update({
      status: "rejected",
      rejectionReason: reason.trim(),
      reviewedAt: nowIso,
    });

    try {
      await notifyParentRejected(
        data.parentEmail,
        data.parentName,
        data.childFullName,
        reason.trim()
      );
    } catch (err) {
      console.warn("Failed to notify parent of rejection:", err);
    }

    return { success: true };
  } catch (error) {
    console.error("rejectParentAccessRequestAction error:", error);
    return {
      success: false,
      error: "Възникна грешка при отказване на заявката.",
    };
  }
}

/**
 * 7. Create parent user manually by Admin.
 */
export async function createParentUserManuallyAction(data: {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentRole: ParentRole;
  memberId: string;
  initialPassword?: string;
  permissions?: ParentMemberPermissions;
}) {
  try {
    const parentName = data.parentName.trim();
    const parentPhone = normalizePhoneNumber(data.parentPhone);
    const parentEmail = data.parentEmail.trim().toLowerCase();
    const tempPassword =
      data.initialPassword?.trim() || Math.random().toString(36).slice(-8);

    if (!parentName || !parentPhone || !parentEmail) {
      return {
        success: false,
        error: "Всички полета за родител са задължителни.",
      };
    }

    const adminDb = getAdminDb();

    // Check member
    const memberRef = adminDb.collection(MEMBERS_COLLECTION).doc(data.memberId);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
      return { success: false, error: "Избраният член не съществува." };
    }
    const memberData = memberSnap.data() || {};
    const familyId = memberData.familyId || null;

    const linkedMemberIds = [data.memberId];
    if (familyId) {
      const sibSnap = await adminDb
        .collection(MEMBERS_COLLECTION)
        .where("familyId", "==", familyId)
        .where("siteId", "==", "bkgalabovo")
        .get();
      for (const doc of sibSnap.docs) {
        const m = doc.data() || {};
        const isAdultOrCoach =
          m.isCoach ||
          m.role === "coach" ||
          (typeof m.notes === "string" && m.notes.includes("ТРЕНЬОР")) ||
          (m.dateOfBirth &&
            parseInt(String(m.dateOfBirth).slice(0, 4)) <
              new Date().getFullYear() - 18);
        const isSamePhone = parentPhone && m.phone === parentPhone;
        const isSameEmail =
          parentEmail &&
          m.email &&
          m.email.toLowerCase() === parentEmail.toLowerCase();
        if (
          !linkedMemberIds.includes(doc.id) &&
          !isAdultOrCoach &&
          !isSamePhone &&
          !isSameEmail
        ) {
          linkedMemberIds.push(doc.id);
        }
      }
    }

    const permissionsPerMember: Record<string, ParentMemberPermissions> = {};
    const basePermissions = data.permissions || DefaultParentMemberPermissions;
    linkedMemberIds.forEach((id) => {
      permissionsPerMember[id] = { ...basePermissions };
    });

    const nowIso = new Date().toISOString();
    const passwordHash = hashPassword(tempPassword);

    // Check if a parent user already exists with this phone or email
    const existingSnap = await adminDb
      .collection(PARENT_USERS_COLLECTION)
      .where("siteId", "==", "bkgalabovo")
      .where("phone", "==", parentPhone)
      .limit(1)
      .get();

    let targetParentRef = adminDb.collection(PARENT_USERS_COLLECTION).doc();
    let existingData: ParentUser | null = null;

    if (!existingSnap.empty) {
      targetParentRef = existingSnap.docs[0].ref;
      existingData = existingSnap.docs[0].data() as ParentUser;
    } else {
      const emailSnap = await adminDb
        .collection(PARENT_USERS_COLLECTION)
        .where("siteId", "==", "bkgalabovo")
        .where("email", "==", parentEmail)
        .limit(1)
        .get();
      if (!emailSnap.empty) {
        targetParentRef = emailSnap.docs[0].ref;
        existingData = emailSnap.docs[0].data() as ParentUser;
      }
    }

    if (existingData) {
      // Merge linked member IDs and permissions without creating duplicate
      const allLinked = Array.from(
        new Set([...(existingData.linkedMemberIds || []), ...linkedMemberIds])
      );
      const mergedPerms = {
        ...(existingData.permissionsPerMember || {}),
        ...permissionsPerMember,
      };

      await targetParentRef.update({
        name: parentName,
        phone: parentPhone,
        email: parentEmail,
        passwordHash,
        status: "active",
        linkedMemberIds: allLinked,
        permissionsPerMember: mergedPerms,
        updatedAt: nowIso,
      });
    } else {
      const newParentObj: ParentUser = {
        id: targetParentRef.id,
        siteId: "bkgalabovo",
        name: parentName,
        phone: parentPhone,
        email: parentEmail,
        passwordHash,
        parentRole: data.parentRole,
        status: "active",
        linkedMemberIds,
        familyId,
        permissionsPerMember,
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: null,
        lastActiveAt: null,
        lastAction: null,
        lastActionAt: null,
      };
      await targetParentRef.set(newParentObj);
    }

    // Update child card
    const memberUpdates: Record<string, string> = {
      parentName,
      parentPhone,
      parentEmail,
    };
    if (data.parentRole === "mother") {
      memberUpdates.motherName = parentName;
      memberUpdates.motherPhone = parentPhone;
    } else if (data.parentRole === "father") {
      memberUpdates.fatherName = parentName;
      memberUpdates.fatherPhone = parentPhone;
    }
    await memberRef.update(memberUpdates);

    // Send email to parent & admin with credentials and direct login link
    const siteUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://bkgalabovo2025.vercel.app";
    const loginUrl = `${siteUrl}/club/parents/login`;
    const childFullName =
      `${memberData.firstName || ""} ${memberData.lastName || ""}`.trim();

    let emailSent = false;
    try {
      const emailResults = await Promise.allSettled([
        notifyParentCreatedManually({
          parentEmail,
          parentName,
          childName: childFullName,
          loginUrl,
          tempPassword,
          parentPhone,
        }),
        notifyAdminParentCreated({
          parentName,
          parentRole: data.parentRole,
          parentEmail,
          parentPhone,
          childName: childFullName,
          tempPassword,
        }),
      ]);
      const parentEmailRes = emailResults[0];
      if (
        parentEmailRes.status === "fulfilled" &&
        parentEmailRes.value === true
      ) {
        emailSent = true;
      }
    } catch (emailErr) {
      console.warn(
        "[parent-portal] Error sending manual creation emails:",
        emailErr
      );
    }

    revalidatePath("/members");
    revalidatePath(`/members/${data.memberId}`);
    revalidatePath("/parents");

    return {
      success: true,
      tempPassword,
      parentName,
      parentPhone,
      parentEmail,
      childName: childFullName,
      emailSent,
    };
  } catch (error) {
    console.error("createParentUserManuallyAction error:", error);
    return {
      success: false,
      error: "Възникна грешка при ръчно създаване на родител.",
    };
  }
}

/**
 * 8. Toggle parent user active/suspended status.
 */
export async function toggleParentUserStatusAction(
  parentUserId: string,
  newStatus: "active" | "suspended"
) {
  try {
    const adminDb = getAdminDb();
    await adminDb.collection(PARENT_USERS_COLLECTION).doc(parentUserId).update({
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("toggleParentUserStatusAction error:", error);
    return {
      success: false,
      error: "Грешка при промяна на статуса на родителя.",
    };
  }
}

/**
 * 9. Update member permissions for a parent user.
 */
export async function updateParentMemberPermissionsAction(
  parentUserId: string,
  memberId: string,
  permissions: ParentMemberPermissions
) {
  try {
    const adminDb = getAdminDb();
    const parentRef = adminDb
      .collection(PARENT_USERS_COLLECTION)
      .doc(parentUserId);
    const snap = await parentRef.get();
    if (!snap.exists) {
      return { success: false, error: "Родителят не е намерен." };
    }

    const data = snap.data() as ParentUser;
    const permissionsPerMember = { ...(data.permissionsPerMember || {}) };
    permissionsPerMember[memberId] = { ...permissions };

    await parentRef.update({
      permissionsPerMember,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath(`/members/${memberId}`);
    return { success: true };
  } catch (error) {
    console.error("updateParentMemberPermissionsAction error:", error);
    return {
      success: false,
      error: "Грешка при запис на правата за видимост.",
    };
  }
}

/**
 * 10. Reset parent password by Admin (generates a temporary password).
 */
export async function resetParentPasswordByAdminAction(parentUserId: string) {
  try {
    const adminDb = getAdminDb();
    const parentRef = adminDb
      .collection(PARENT_USERS_COLLECTION)
      .doc(parentUserId);
    const snap = await parentRef.get();
    if (!snap.exists) {
      return { success: false, error: "Родителят не е намерен." };
    }

    const data = snap.data() as ParentUser;
    const tempPassword = Math.random().toString(36).slice(-8);
    const newHash = hashPassword(tempPassword);

    await parentRef.update({
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
    });

    const siteUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://bkgalabovo2025.vercel.app";
    const loginUrl = `${siteUrl}/club/parents/login`;

    let childFullName = "";
    if (data.linkedMemberIds && data.linkedMemberIds.length > 0) {
      try {
        const memberDoc = await adminDb
          .collection(MEMBERS_COLLECTION)
          .doc(data.linkedMemberIds[0])
          .get();
        if (memberDoc.exists) {
          const mData = memberDoc.data() || {};
          childFullName =
            `${mData.firstName || ""} ${mData.lastName || ""}`.trim();
        }
      } catch (e) {
        console.warn("Could not fetch child name for parent reset:", e);
      }
    }

    let emailSent = false;
    try {
      const emailResults = await Promise.allSettled([
        notifyParentCreatedManually({
          parentEmail: data.email,
          parentName: data.name,
          childName: childFullName || "състезател",
          loginUrl,
          tempPassword,
          parentPhone: data.phone,
        }),
        notifyAdminParentCreated({
          parentName: data.name,
          parentRole: data.parentRole,
          parentEmail: data.email,
          parentPhone: data.phone,
          childName: childFullName || "състезател",
          tempPassword,
        }),
      ]);
      const parentEmailRes = emailResults[0];
      if (
        parentEmailRes.status === "fulfilled" &&
        parentEmailRes.value === true
      ) {
        emailSent = true;
      }
    } catch (err) {
      console.warn("Failed to notify of password reset:", err);
    }

    revalidatePath("/members");
    if (data.linkedMemberIds) {
      data.linkedMemberIds.forEach((mId) => revalidatePath(`/members/${mId}`));
    }
    revalidatePath("/parents");

    return {
      success: true,
      tempPassword,
      parentName: data.name,
      parentPhone: data.phone,
      parentEmail: data.email,
      childName: childFullName,
      emailSent,
    };
  } catch (error) {
    console.error("resetParentPasswordByAdminAction error:", error);
    return { success: false, error: "Грешка при генериране на нова парола." };
  }
}

/**
 * 10b. Resend parent credentials (generates fresh password and emails both parent and admin).
 */
export async function resendParentCredentialsAction(parentUserId: string) {
  return resetParentPasswordByAdminAction(parentUserId);
}

/**
 * 11. Request password reset (Forgot password self-service).
 */
export async function requestParentPasswordResetAction(emailOrPhone: string) {
  try {
    const raw = emailOrPhone.trim();
    if (!raw)
      return { success: false, error: "Моля, въведете имейл или телефон." };

    const adminDb = getAdminDb();
    let parentDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

    if (raw.includes("@")) {
      const snap = await adminDb
        .collection(PARENT_USERS_COLLECTION)
        .where("email", "==", raw.toLowerCase())
        .limit(1)
        .get();
      if (!snap.empty) parentDoc = snap.docs[0];
    } else {
      const norm = normalizePhoneNumber(raw);
      const snap = await adminDb
        .collection(PARENT_USERS_COLLECTION)
        .where("phone", "==", norm)
        .limit(1)
        .get();
      if (!snap.empty) parentDoc = snap.docs[0];
    }

    if (!parentDoc) {
      // Return true anyway for privacy reasons, but log
      return {
        success: true,
        message:
          "Ако съществува профил с тези данни, на имейла ще бъде изпратен линк за нова парола.",
      };
    }

    const parent = parentDoc.data() as ParentUser;
    const token = generatePasswordResetToken(parentDoc.id);
    const siteUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://bkgalabovo2025.vercel.app";
    const resetUrl = `${siteUrl}/club/parents/reset-password?token=${token}`;

    await notifyParentPasswordReset(parent.email, parent.name, resetUrl);

    return {
      success: true,
      message: "Изпратен е имейл с инструкции за задаване на нова парола.",
    };
  } catch (error) {
    console.error("requestParentPasswordResetAction error:", error);
    return {
      success: false,
      error: "Възникна грешка при изпращане на заявка за парола.",
    };
  }
}

/**
 * 12. Reset password using valid token.
 */
export async function resetParentPasswordWithTokenAction(
  token: string,
  newPassword: string
) {
  try {
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: "Паролата трябва да бъде поне 6 символа.",
      };
    }

    const parentId = verifyPasswordResetToken(token);
    if (!parentId) {
      return {
        success: false,
        error:
          "Линкът за смяна на парола е невалиден или е изтекъл. Моля, заявете нов.",
      };
    }

    const adminDb = getAdminDb();
    const parentRef = adminDb.collection(PARENT_USERS_COLLECTION).doc(parentId);
    const snap = await parentRef.get();
    if (!snap.exists) {
      return { success: false, error: "Потребителят не е намерен." };
    }

    const newHash = hashPassword(newPassword);
    await parentRef.update({
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("resetParentPasswordWithTokenAction error:", error);
    return {
      success: false,
      error: "Възникна грешка при обновяване на паролата.",
    };
  }
}

/**
 * 13. Submit absence notice by parent.
 */
export async function submitParentAbsenceAction(data: {
  memberId: string;
  type: "single_day" | "period";
  startDate: string;
  endDate?: string | null;
  reason: "illness" | "school" | "travel" | "injury" | "other";
  note?: string;
}) {
  try {
    const parent = await getActiveParentUserAction();
    if (!parent) {
      return {
        success: false,
        error: "Необходим е вход в родителския портал.",
      };
    }

    if (!parent.linkedMemberIds.includes(data.memberId)) {
      return {
        success: false,
        error: "Нямате достъп до профила на това дете.",
      };
    }

    // Date validation: must be today or future date
    const today = new Date().toISOString().slice(0, 10);
    if (data.startDate < today) {
      return {
        success: false,
        error: "Отсъствие може да се заявява само за днес или за бъдещи дати.",
      };
    }

    if (
      data.type === "period" &&
      data.endDate &&
      data.endDate < data.startDate
    ) {
      return {
        success: false,
        error: "Крайната дата не може да бъде преди началната дата.",
      };
    }

    const adminDb = getAdminDb();
    const memberSnap = await adminDb
      .collection(MEMBERS_COLLECTION)
      .doc(data.memberId)
      .get();
    const memberData = memberSnap.data() || {};
    const memberName =
      `${memberData.firstName || ""} ${memberData.lastName || ""}`.trim() ||
      "Член";

    const newRef = adminDb.collection(PARENT_ABSENCES_COLLECTION).doc();
    const absenceObj: ParentAbsence = {
      id: newRef.id,
      siteId: "bkgalabovo",
      parentUserId: parent.id,
      parentName: parent.name,
      memberId: data.memberId,
      memberName,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate || null,
      reason: data.reason,
      note: data.note?.trim() || "",
      status: "submitted",
      coachReply: "",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };

    await newRef.set(absenceObj);

    // Notify admin
    try {
      await notifyAdminNewAbsence(absenceObj);
    } catch (err) {
      console.warn("Failed to notify admin of absence:", err);
    }

    return { success: true, absence: absenceObj };
  } catch (error) {
    console.error("submitParentAbsenceAction error:", error);
    return {
      success: false,
      error: "Възникна грешка при изпращане на уведомлението.",
    };
  }
}

/**
 * 14. Cancel absence by parent.
 */
export async function cancelParentAbsenceAction(absenceId: string) {
  try {
    const parent = await getActiveParentUserAction();
    if (!parent) return { success: false, error: "Нямате сесия." };

    const adminDb = getAdminDb();
    const ref = adminDb.collection(PARENT_ABSENCES_COLLECTION).doc(absenceId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, error: "Записът не е намерен." };

    const data = snap.data() as ParentAbsence;
    if (data.parentUserId !== parent.id) {
      return { success: false, error: "Нямате права за тази операция." };
    }

    await ref.update({
      status: "cancelled_by_parent",
    });

    return { success: true };
  } catch (error) {
    console.error("cancelParentAbsenceAction error:", error);
    return { success: false, error: "Грешка при отмяна на отсъствието." };
  }
}

/**
 * 15. Mark absence as seen by Admin with optional encouraging reply.
 */
export async function markAbsenceSeenByAdminAction(
  absenceId: string,
  coachReply?: string
) {
  try {
    const adminDb = getAdminDb();
    await adminDb
      .collection(PARENT_ABSENCES_COLLECTION)
      .doc(absenceId)
      .update({
        status: "seen",
        coachReply: coachReply?.trim() || "",
        reviewedAt: new Date().toISOString(),
      });
    return { success: true };
  } catch (error) {
    console.error("markAbsenceSeenByAdminAction error:", error);
    return { success: false, error: "Грешка при обновяване на статуса." };
  }
}

/**
 * 16. Submit data correction request by parent.
 */
export async function submitDataCorrectionAction(data: {
  memberId: string;
  fieldKey: string;
  fieldLabel: string;
  currentValue: string;
  proposedValue: string;
  note?: string;
}) {
  try {
    const parent = await getActiveParentUserAction();
    if (!parent)
      return { success: false, error: "Необходим е вход в профила." };

    if (!parent.linkedMemberIds.includes(data.memberId)) {
      return {
        success: false,
        error: "Нямате достъп до профила на това дете.",
      };
    }

    const proposed = data.proposedValue.trim();
    if (!proposed) return { success: false, error: "Въведете нова стойност." };

    const adminDb = getAdminDb();

    // Check if an existing pending correction already exists for this exact field
    const pendingSnap = await adminDb
      .collection(PARENT_CORRECTIONS_COLLECTION)
      .where("memberId", "==", data.memberId)
      .where("fieldKey", "==", data.fieldKey)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!pendingSnap.empty) {
      return {
        success: false,
        error:
          "Вече има подадена чакаща корекция за това поле. Моля, изчакайте преглед.",
      };
    }

    const memberSnap = await adminDb
      .collection(MEMBERS_COLLECTION)
      .doc(data.memberId)
      .get();
    const memberData = memberSnap.data() || {};
    const memberName =
      `${memberData.firstName || ""} ${memberData.lastName || ""}`.trim() ||
      "Член";

    const newRef = adminDb.collection(PARENT_CORRECTIONS_COLLECTION).doc();
    const correctionObj: DataCorrectionRequest = {
      id: newRef.id,
      siteId: "bkgalabovo",
      parentUserId: parent.id,
      parentName: parent.name,
      memberId: data.memberId,
      memberName,
      fieldKey: data.fieldKey,
      fieldLabel: data.fieldLabel,
      currentValue: data.currentValue || "",
      proposedValue: proposed,
      note: data.note?.trim() || "",
      status: "pending",
      adminComment: "",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };

    await newRef.set(correctionObj);

    try {
      await notifyAdminNewCorrection(correctionObj);
    } catch (err) {
      console.warn("Failed to notify admin of correction:", err);
    }

    return { success: true, correction: correctionObj };
  } catch (error) {
    console.error("submitDataCorrectionAction error:", error);
    return {
      success: false,
      error: "Грешка при изпращане на заявката за корекция.",
    };
  }
}

/**
 * 17. Approve data correction by Admin (1-click automatic update in member document!).
 */
export async function approveDataCorrectionAction(correctionId: string) {
  try {
    const adminDb = getAdminDb();
    const corrRef = adminDb
      .collection(PARENT_CORRECTIONS_COLLECTION)
      .doc(correctionId);
    const corrSnap = await corrRef.get();
    if (!corrSnap.exists) {
      return { success: false, error: "Заявката за корекция не е намерена." };
    }

    const corr = corrSnap.data() as DataCorrectionRequest;
    if (corr.status !== "pending") {
      return { success: false, error: "Тази заявка вече е обработена." };
    }

    const memberRef = adminDb.collection(MEMBERS_COLLECTION).doc(corr.memberId);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
      return { success: false, error: "Членът не съществува." };
    }

    // Automatically update the field in the member card!
    await memberRef.update({
      [corr.fieldKey]: corr.proposedValue,
      updatedAt: new Date().toISOString(),
    });

    await corrRef.update({
      status: "approved",
      resolvedAt: new Date().toISOString(),
    });

    // Notify parent
    const parentSnap = await adminDb
      .collection(PARENT_USERS_COLLECTION)
      .doc(corr.parentUserId)
      .get();

    if (parentSnap.exists) {
      const pData = parentSnap.data() as ParentUser;
      try {
        await notifyParentCorrectionApproved(
          pData.email,
          pData.name,
          corr.memberName,
          corr.fieldLabel
        );
      } catch (err) {
        console.warn("Failed to notify parent of approved correction:", err);
      }
    }

    revalidatePath(`/members/${corr.memberId}`);
    return { success: true };
  } catch (error) {
    console.error("approveDataCorrectionAction error:", error);
    return { success: false, error: "Грешка при одобряване на корекцията." };
  }
}

/**
 * 18. Reject data correction by Admin.
 */
export async function rejectDataCorrectionAction(
  correctionId: string,
  adminComment?: string
) {
  try {
    const adminDb = getAdminDb();
    await adminDb
      .collection(PARENT_CORRECTIONS_COLLECTION)
      .doc(correctionId)
      .update({
        status: "rejected",
        adminComment: adminComment?.trim() || "",
        resolvedAt: new Date().toISOString(),
      });
    return { success: true };
  } catch (error) {
    console.error("rejectDataCorrectionAction error:", error);
    return { success: false, error: "Грешка при отказване на корекцията." };
  }
}

/**
 * 19. Delete a parent user profile completely (Admin action).
 */
export async function deleteParentUserAction(parentUserId: string) {
  try {
    const adminDb = getAdminDb();
    await adminDb
      .collection(PARENT_USERS_COLLECTION)
      .doc(parentUserId)
      .delete();
    revalidatePath("/parents");
    return { success: true };
  } catch (error) {
    console.error("deleteParentUserAction error:", error);
    return {
      success: false,
      error: "Грешка при изтриване на родителския профил.",
    };
  }
}

/**
 * 20. Fetch all data needed for the Admin Parent Portal management dashboard.
 */
export async function getAdminParentPortalDataAction() {
  try {
    const adminDb = getAdminDb();

    const [reqsSnap, usersSnap, absSnap, corrsSnap, membersSnap, logsSnap] =
      await Promise.all([
        adminDb
          .collection(PARENT_REQUESTS_COLLECTION)
          .where("siteId", "==", "bkgalabovo")
          .get(),
        adminDb
          .collection(PARENT_USERS_COLLECTION)
          .where("siteId", "==", "bkgalabovo")
          .get(),
        adminDb
          .collection(PARENT_ABSENCES_COLLECTION)
          .where("siteId", "==", "bkgalabovo")
          .get(),
        adminDb
          .collection(PARENT_CORRECTIONS_COLLECTION)
          .where("siteId", "==", "bkgalabovo")
          .get(),
        adminDb
          .collection(MEMBERS_COLLECTION)
          .where("siteId", "==", "bkgalabovo")
          .get(),
        adminDb
          .collection(PARENT_ACTIVITY_LOGS_COLLECTION)
          .where("siteId", "==", "bkgalabovo")
          .limit(100)
          .get(),
      ]);

    const requests: ParentAccessRequest[] = reqsSnap.docs
      .map((d) => ({ ...d.data(), id: d.id }) as ParentAccessRequest)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    const parents: ParentUser[] = usersSnap.docs
      .map((d) => ({ ...d.data(), id: d.id }) as ParentUser)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    const absences: ParentAbsence[] = absSnap.docs
      .map((d) => ({ ...d.data(), id: d.id }) as ParentAbsence)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    const corrections: DataCorrectionRequest[] = corrsSnap.docs
      .map((d) => ({ ...d.data(), id: d.id }) as DataCorrectionRequest)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    const activityLogs: ParentActivityLog[] = logsSnap.docs
      .map((d) => ({ ...d.data(), id: d.id }) as ParentActivityLog)
      .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));

    const members = membersSnap.docs.map((d) => {
      const m = d.data();
      return {
        id: d.id,
        firstName: m.firstName || "",
        lastName: m.lastName || "",
        fullName: `${m.firstName || ""} ${m.lastName || ""}`.trim(),
        dateOfBirth: formatDobString(m.dateOfBirth),
        phone: m.phone || "",
        parentPhone: m.parentPhone || "",
        motherPhone: m.motherPhone || "",
        fatherPhone: m.fatherPhone || "",
        motherName: m.motherName || "",
        fatherName: m.fatherName || "",
        familyId: m.familyId || null,
        avatarUrl: m.avatarUrl || null,
      };
    });

    const pendingRequestsCount = requests.filter(
      (r) => r.status === "pending"
    ).length;
    const pendingAbsencesCount = absences.filter(
      (a) => a.status === "submitted"
    ).length;
    const pendingCorrectionsCount = corrections.filter(
      (c) => c.status === "pending"
    ).length;

    const now = Date.now();
    const onlineParentsCount = parents.filter(
      (p) =>
        p.lastActiveAt &&
        now - new Date(p.lastActiveAt).getTime() < 3 * 60 * 1000
    ).length;

    return {
      success: true,
      data: serializeFirestoreData({
        requests,
        parents,
        absences,
        corrections,
        members,
        activityLogs,
        onlineParentsCount,
        stats: {
          pendingRequestsCount,
          pendingAbsencesCount,
          pendingCorrectionsCount,
          onlineParentsCount,
          totalPending:
            pendingRequestsCount +
            pendingAbsencesCount +
            pendingCorrectionsCount,
        },
      }),
    };
  } catch (error) {
    console.error("getAdminParentPortalDataAction error:", error);
    return {
      success: false,
      error: "Грешка при зареждане на данните за родителския портал.",
      data: null,
    };
  }
}

/**
 * 21. Get comprehensive Parent Portal dashboard data for authenticated parent.
 */
export async function getParentDashboardDataAction(requestedChildId?: string) {
  try {
    const parent = await getActiveParentUserAction();
    if (!parent) {
      return { success: false, error: "UNAUTHORIZED", data: null };
    }

    const linkedIds = parent.linkedMemberIds || [];
    if (linkedIds.length === 0) {
      return {
        success: true,
        data: {
          parent,
          children: [],
          selectedChild: null,
          permissions: DefaultParentMemberPermissions,
          visibleData: null,
          pendingCorrections: {},
          absences: [],
          attendances: [] as ParentAttendanceRecord[],
          nextTraining: null,
          announcements: [
            {
              id: "welcome",
              title: "Добре дошли в родителския портал!",
              content:
                "Очаква се свързване на профила ви с картона на вашето дете.",
              date: new Date().toISOString(),
              priority: "info",
            },
          ] as ParentAnnouncement[],
        },
      };
    }

    const adminDb = getAdminDb();

    // Fetch all linked children member records
    const memberSnaps = await Promise.all(
      linkedIds.map((id) =>
        adminDb.collection(MEMBERS_COLLECTION).doc(id).get()
      )
    );

    const children: Array<{
      id: string;
      fullName: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      dateOfBirth: string | null;
      status: "active" | "inactive";
      isLicensed: boolean;
      trainingGroup: string;
      registrationDate: string | null;
    }> = [];

    const memberDocsMap = new Map<string, FirebaseFirestore.DocumentData>();

    for (const snap of memberSnaps) {
      if (snap.exists) {
        const d = snap.data() || {};
        memberDocsMap.set(snap.id, d);
        children.push({
          id: snap.id,
          fullName: `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Член",
          firstName: d.firstName || "",
          lastName: d.lastName || "",
          avatarUrl: d.avatarUrl || null,
          dateOfBirth: formatDobString(d.dateOfBirth) || null,
          status: d.status === "inactive" ? "inactive" : "active",
          isLicensed: !!d.isLicensed,
          trainingGroup: d.trainingGroup || d.group || "",
          registrationDate: formatDobString(d.registrationDate) || null,
        });
      }
    }

    // Determine selected child
    let activeChildId =
      requestedChildId && linkedIds.includes(requestedChildId)
        ? requestedChildId
        : children[0]?.id || "";

    if (!activeChildId && children.length > 0) {
      activeChildId = children[0].id;
    }

    const selectedChildSummary =
      children.find((c) => c.id === activeChildId) || null;
    const selectedChildRaw = activeChildId
      ? memberDocsMap.get(activeChildId) || {}
      : {};

    // Get permissions for active child
    const permissions: ParentMemberPermissions =
      activeChildId && parent.permissionsPerMember?.[activeChildId]
        ? parent.permissionsPerMember[activeChildId]
        : DefaultParentMemberPermissions;

    // Filter visible fields strictly according to permissions
    const visibleData = selectedChildSummary
      ? {
          id: selectedChildSummary.id,
          fullName: selectedChildSummary.fullName,
          status: permissions.showStatusBadge
            ? selectedChildSummary.status
            : "active",
          isLicensed: selectedChildSummary.isLicensed,
          // Granular permission protected fields:
          birthDate: permissions.showBirthDate
            ? selectedChildRaw.dateOfBirth || null
            : null,
          ageGroup: permissions.showAgeGroup
            ? selectedChildRaw.ageGroup || null
            : null,
          phone: permissions.showPhone ? selectedChildRaw.phone || null : null,
          address: permissions.showAddress
            ? selectedChildRaw.address || null
            : null,
          school: permissions.showSchool
            ? selectedChildRaw.school || null
            : null,
          height: permissions.showHeight
            ? selectedChildRaw.height || null
            : null,
          weight: permissions.showWeight
            ? selectedChildRaw.weight || null
            : null,
          dominantHand: permissions.showDominantHand
            ? selectedChildRaw.dominantHand || null
            : null,
          apparelSize: permissions.showApparelSize
            ? selectedChildRaw.apparelSize ||
              selectedChildRaw.tShirtSize ||
              null
            : null,
          emergencyContact: permissions.showEmergencyContact
            ? selectedChildRaw.emergencyContact ||
              selectedChildRaw.parentPhone ||
              selectedChildRaw.motherPhone ||
              selectedChildRaw.fatherPhone ||
              null
            : null,
          healthNotes: permissions.showHealthNotes
            ? selectedChildRaw.healthNotes || selectedChildRaw.notes || null
            : null,
        }
      : null;

    // Fetch pending corrections for active child
    const pendingCorrections: Record<
      string,
      { proposedValue: string; createdAt: string }
    > = {};
    if (activeChildId) {
      const corrSnap = await adminDb
        .collection(PARENT_CORRECTIONS_COLLECTION)
        .where("parentUserId", "==", parent.id)
        .where("memberId", "==", activeChildId)
        .where("status", "==", "pending")
        .get();

      for (const doc of corrSnap.docs) {
        const c = doc.data() as DataCorrectionRequest;
        pendingCorrections[c.fieldKey] = {
          proposedValue: c.proposedValue,
          createdAt: c.createdAt,
        };
      }
    }

    // Fetch submitted absences for active child
    let absences: ParentAbsence[] = [];
    if (activeChildId) {
      const absSnap = await adminDb
        .collection(PARENT_ABSENCES_COLLECTION)
        .where("parentUserId", "==", parent.id)
        .where("memberId", "==", activeChildId)
        .get();

      absences = absSnap.docs
        .map((d) => ({ ...d.data(), id: d.id }) as ParentAbsence)
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }

    // Fetch attendances & schedule events for active child
    interface AttendeeRecord {
      memberId: string;
      attended: boolean;
      name?: string;
    }

    const attendances: ParentAttendanceRecord[] = [];

    let nextTraining: {
      title: string;
      dateText: string;
      timeText: string;
      location: string;
      isToday: boolean;
      groupName: string;
    } | null = null;

    // 1. Fetch club events from the Schedule module (siteId: "bkgalabovo")
    // This is the EXACT same source used by the Admin Schedule and Public Club Schedule.
    let announcements: ParentAnnouncement[] = [];

    try {
      const now = new Date();
      // Formatted in Europe/Sofia timezone
      const todaySofiaStr = now.toLocaleDateString("en-CA", {
        timeZone: "Europe/Sofia",
      });
      const tomorrow = new Date(now.getTime() + 86400000);
      const tomorrowSofiaStr = tomorrow.toLocaleDateString("en-CA", {
        timeZone: "Europe/Sofia",
      });

      // Resolve default hall location dynamically from site settings
      let defaultHallLocation = "Спортна зала „Енергетик“";
      try {
        const siteDoc = await adminDb
          .collection("sites")
          .doc("bkgalabovo")
          .get();
        if (siteDoc.exists) {
          const sData = siteDoc.data();
          if (sData?.hallName?.trim()) {
            defaultHallLocation = sData.hallName.trim();
          } else if (sData?.address?.trim()) {
            defaultHallLocation = sData.address.split(",")[0].trim();
          }
        }
      } catch {
        // fallback
      }

      const clubEventsSnap = await adminDb
        .collection("events")
        .where("siteId", "==", "bkgalabovo")
        .get();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allClubEvents: Array<{ id: string } & Record<string, any>> =
        clubEventsSnap.docs.map((d) => ({
          id: d.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(d.data() as Record<string, any>),
        }));

      // A. Populate attendance history for the active child
      // Includes ALL scheduled training sessions for the club / child's group + any event where child is an explicit attendee
      if (activeChildId) {
        const childGroup =
          selectedChildSummary?.trainingGroup?.trim().toLowerCase() || "";
        const childRegDate = selectedChildSummary?.registrationDate
          ? new Date(selectedChildSummary.registrationDate)
          : null;

        for (const e of allClubEvents) {
          if (e.isCancelled) continue;

          const attendeesList = (
            Array.isArray(e.attendees) ? e.attendees : []
          ) as AttendeeRecord[];
          const attendeeEntry = attendeesList.find(
            (a) => a.memberId === activeChildId
          );
          const attendeeMemberIds = Array.isArray(e.attendeeMemberIds)
            ? e.attendeeMemberIds
            : [];
          const isExplicitAttendee =
            !!attendeeEntry || attendeeMemberIds.includes(activeChildId);

          const isTraining =
            e.type === "training" ||
            (typeof e.title === "string" &&
              e.title.toLowerCase().includes("трениров"));

          // If not an explicit attendee and not a training session, skip
          if (!isExplicitAttendee && !isTraining) {
            continue;
          }

          // If not explicit attendee, check if this training session matches child's group
          if (!isExplicitAttendee && isTraining) {
            const eventGroup =
              typeof e.trainingGroup === "string"
                ? e.trainingGroup.trim().toLowerCase()
                : "";
            if (eventGroup && childGroup && eventGroup !== childGroup) {
              continue;
            }
          }

          const startIso = typeof e.startDate === "string" ? e.startDate : "";
          const endIso = typeof e.endDate === "string" ? e.endDate : startIso;
          if (!startIso) continue;

          const eventStartDate = new Date(startIso);
          if (isNaN(eventStartDate.getTime())) continue;

          // If event was strictly before the child's registration date, skip
          if (
            childRegDate &&
            !isNaN(childRegDate.getTime()) &&
            eventStartDate.getTime() < childRegDate.getTime()
          ) {
            continue;
          }

          const isUpcoming = eventStartDate.getTime() > now.getTime();
          const attended = attendeeEntry
            ? !!attendeeEntry.attended
            : attendeeMemberIds.includes(activeChildId);

          // Check if parent submitted an active absence for this event's date
          const eventDateKey = eventStartDate.toLocaleDateString("en-CA", {
            timeZone: "Europe/Sofia",
          });
          const matchedAbsence = absences.find((abs) => {
            if (abs.status === "cancelled_by_parent") return false;
            const absStart = abs.startDate;
            const absEnd = abs.endDate || abs.startDate;
            return eventDateKey >= absStart && eventDateKey <= absEnd;
          });

          attendances.push({
            id: String(e.id),
            title:
              (typeof e.title === "string" && e.title.trim()) || "Тренировка",
            type: (typeof e.type === "string" && e.type.trim()) || "training",
            startDate: startIso,
            endDate: endIso,
            location:
              (typeof e.location === "string" && e.location.trim()) ||
              defaultHallLocation,
            attended,
            isUpcoming,
            isExcused: !!matchedAbsence,
            absenceReason: matchedAbsence?.reason || null,
            coachReply: matchedAbsence?.coachReply || null,
          });
        }

        // Sort attendances desc (newest first)
        attendances.sort((a, b) => b.startDate.localeCompare(a.startDate));
      }

      // B. Resolve NEXT TRAINING directly from the official Club Schedule
      // Training events (not cancelled, endDate >= now) matching the child's group if set
      const childGroup = selectedChildSummary?.trainingGroup;
      const upcomingTrainings = allClubEvents
        .filter((e) => {
          if (e.isCancelled) return false;
          const isTrain =
            e.type === "training" ||
            (typeof e.title === "string" &&
              e.title.toLowerCase().includes("трениров"));
          if (!isTrain) return false;

          const start = typeof e.startDate === "string" ? e.startDate : "";
          const end = typeof e.endDate === "string" ? e.endDate : start;
          if (!start) return false;

          // Event end time must not be in the past
          const endDateObj = new Date(end || start);
          if (endDateObj.getTime() < now.getTime()) {
            return false;
          }

          // If event has group assigned, verify child matches (or event is open to all)
          if (e.trainingGroup && childGroup && e.trainingGroup !== childGroup) {
            return false;
          }

          // If child already checked-in and attended today's session and it ended or is in progress
          if (activeChildId) {
            const attendeesList = (
              Array.isArray(e.attendees) ? e.attendees : []
            ) as AttendeeRecord[];
            const attendeeEntry = attendeesList.find(
              (a) => a.memberId === activeChildId
            );
            if (
              attendeeEntry &&
              attendeeEntry.attended &&
              endDateObj.getTime() < now.getTime()
            ) {
              return false;
            }
          }

          return true;
        })
        .sort((a, b) => {
          const aStart = typeof a.startDate === "string" ? a.startDate : "";
          const bStart = typeof b.startDate === "string" ? b.startDate : "";
          return aStart.localeCompare(bStart);
        });

      if (upcomingTrainings.length > 0) {
        const nextEv = upcomingTrainings[0];
        const evDate = new Date(nextEv.startDate as string);
        const evDateSofiaStr = evDate.toLocaleDateString("en-CA", {
          timeZone: "Europe/Sofia",
        });
        const isToday = evDateSofiaStr === todaySofiaStr;
        const isTomorrow = evDateSofiaStr === tomorrowSofiaStr;

        let dateText = evDate.toLocaleDateString("bg-BG", {
          timeZone: "Europe/Sofia",
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        dateText = dateText.charAt(0).toUpperCase() + dateText.slice(1);
        if (isToday) dateText = "Днес";
        else if (isTomorrow) dateText = "Утре";

        const startTimeFormatted = evDate.toLocaleTimeString("bg-BG", {
          timeZone: "Europe/Sofia",
          hour: "2-digit",
          minute: "2-digit",
        });

        let timeText = `${startTimeFormatted} ч.`;
        if (nextEv.endDate) {
          const endEvDate = new Date(nextEv.endDate as string);
          const endTimeFormatted = endEvDate.toLocaleTimeString("bg-BG", {
            timeZone: "Europe/Sofia",
            hour: "2-digit",
            minute: "2-digit",
          });
          timeText = `${startTimeFormatted} - ${endTimeFormatted} ч.`;
        }

        nextTraining = {
          title:
            typeof nextEv.title === "string" && nextEv.title.trim()
              ? nextEv.title.trim()
              : "Тренировка",
          dateText,
          timeText,
          location:
            typeof nextEv.location === "string" && nextEv.location.trim()
              ? nextEv.location.trim()
              : defaultHallLocation,
          isToday,
          groupName:
            (typeof nextEv.trainingGroup === "string" &&
              nextEv.trainingGroup) ||
            childGroup ||
            "Всички групи",
        };
      }

      // C. Upcoming Club Events & Tournaments for Announcements (Chronological order)
      announcements = allClubEvents
        .filter((e) => {
          if (e.isCancelled) return false;
          const isTrain =
            e.type === "training" ||
            (typeof e.title === "string" &&
              e.title.toLowerCase().includes("трениров"));
          if (isTrain) return false;

          const start = typeof e.startDate === "string" ? e.startDate : "";
          if (!start) return false;
          const startSofiaStr = new Date(start).toLocaleDateString("en-CA", {
            timeZone: "Europe/Sofia",
          });
          return startSofiaStr >= todaySofiaStr;
        })
        .sort((a, b) => {
          const aStart = typeof a.startDate === "string" ? a.startDate : "";
          const bStart = typeof b.startDate === "string" ? b.startDate : "";
          return aStart.localeCompare(bStart);
        })
        .slice(0, 5)
        .map((e) => {
          const eTitle =
            typeof e.title === "string" ? e.title : "Предстоящо събитие";
          const eLocation =
            typeof e.location === "string" && e.location.trim()
              ? e.location.trim()
              : defaultHallLocation;
          const eStartDate = typeof e.startDate === "string" ? e.startDate : "";
          const eEndDate =
            typeof e.endDate === "string" ? e.endDate : eStartDate;
          const eDescription =
            typeof e.description === "string" ? e.description : "";
          const eTournamentUrl =
            typeof e.tournamentUrl === "string" ? e.tournamentUrl : null;
          const eTournamentId =
            typeof e.tournamentId === "string" ? e.tournamentId : null;
          const eAttachmentUrl =
            typeof e.attachmentUrl === "string" ? e.attachmentUrl : null;
          const eAttachmentName =
            typeof e.attachmentName === "string" ? e.attachmentName : null;
          const eAttachmentType =
            typeof e.attachmentType === "string" ? e.attachmentType : null;
          const eImageUrl = typeof e.imageUrl === "string" ? e.imageUrl : null;
          const eType = typeof e.type === "string" ? e.type : "competition";
          const isTournament =
            eType === "competition" ||
            Boolean(eTournamentUrl) ||
            Boolean(eTournamentId);

          let periodText = "";
          if (eStartDate) {
            const s = new Date(eStartDate);
            const eDate = eEndDate ? new Date(eEndDate) : null;
            if (isValid(s)) {
              if (
                !eDate ||
                !isValid(eDate) ||
                format(s, "yyyyMMdd") === format(eDate, "yyyyMMdd")
              ) {
                const dateStr = format(s, "dd.MM.yyyy 'г.' (EEEE)", {
                  locale: bg,
                });
                const timeS = format(s, "HH:mm");
                const timeE =
                  eDate && isValid(eDate) ? format(eDate, "HH:mm") : "";
                if (
                  timeS !== "00:00" &&
                  timeE &&
                  timeE !== timeS &&
                  timeE !== "00:00"
                ) {
                  periodText = `${dateStr} | ${timeS} — ${timeE} ч.`;
                } else if (timeS !== "00:00") {
                  periodText = `${dateStr} | ${timeS} ч.`;
                } else {
                  periodText = dateStr;
                }
              } else {
                const hasHours =
                  format(s, "HH:mm") !== "00:00" ||
                  format(eDate, "HH:mm") !== "00:00";
                if (hasHours) {
                  const startStr = format(
                    s,
                    "dd.MM.yyyy 'г.' (EE) HH:mm 'ч.'",
                    {
                      locale: bg,
                    }
                  );
                  const endStr = format(
                    eDate,
                    "dd.MM.yyyy 'г.' (EE) HH:mm 'ч.'",
                    {
                      locale: bg,
                    }
                  );
                  periodText = `${startStr} — ${endStr}`;
                } else {
                  const startStr = format(s, "dd.MM.yyyy", { locale: bg });
                  const endStr = format(eDate, "dd.MM.yyyy 'г.'", {
                    locale: bg,
                  });
                  periodText = `${startStr} — ${endStr}`;
                }
              }
            }
          }

          const icon = eType === "camp" ? "⛺" : isTournament ? "🏆" : "🏸";

          return {
            id: String(e.id),
            title: `${icon} ${eTitle}`,
            content: `${eLocation ? `Място: ${eLocation}. ` : ""}${periodText ? `Период: ${periodText}` : ""}`,
            date: eStartDate || new Date().toISOString(),
            startDate: eStartDate,
            endDate: eEndDate,
            periodText,
            location: eLocation,
            description: eDescription,
            tournamentUrl: eTournamentUrl,
            tournamentId: eTournamentId,
            attachmentUrl: eAttachmentUrl,
            attachmentName: eAttachmentName,
            attachmentType: eAttachmentType,
            imageUrl: eImageUrl,
            isTournament,
            type: eType,
            priority: "info" as const,
          };
        });
    } catch (err) {
      console.warn("Error fetching schedule events for parent portal:", err);
    }

    return {
      success: true,
      data: serializeFirestoreData({
        parent,
        children,
        selectedChild: selectedChildSummary,
        permissions,
        visibleData,
        pendingCorrections,
        absences,
        attendances,
        nextTraining,
        announcements,
      }),
    };
  } catch (error) {
    console.error("getParentDashboardDataAction error:", error);
    return {
      success: false,
      error: "Грешка при зареждане на данните за родителския портал.",
      data: null,
    };
  }
}

/**
 * 22. Record parent view activity or interaction with timestamp.
 */
export async function recordParentActivityAction(data: {
  action: ParentActivityLog["action"];
  actionTitle: string;
  details?: string;
  memberId?: string;
  memberName?: string;
}) {
  try {
    const session = await getParentSession();
    if (!session) return { success: false, error: "Няма активна сесия." };

    const adminDb = getAdminDb();
    const parentRef = adminDb
      .collection(PARENT_USERS_COLLECTION)
      .doc(session.parentId);
    const parentSnap = await parentRef.get();
    if (!parentSnap.exists)
      return { success: false, error: "Родителят не е намерен." };

    const parentData = parentSnap.data() as ParentUser;
    const nowIso = new Date().toISOString();

    // Update parent presence & latest action
    await parentRef.update({
      lastActiveAt: nowIso,
      lastAction: data.actionTitle,
      lastActionAt: nowIso,
    });

    // Write to activity logs
    const logRef = adminDb.collection(PARENT_ACTIVITY_LOGS_COLLECTION).doc();
    const logObj: ParentActivityLog = {
      id: logRef.id,
      siteId: "bkgalabovo",
      parentUserId: parentData.id,
      parentName: parentData.name,
      parentRole: parentData.parentRole,
      memberId: data.memberId || null,
      memberName: data.memberName || null,
      action: data.action,
      actionTitle: data.actionTitle,
      details: data.details || "",
      timestamp: nowIso,
    };
    await logRef.set(logObj);

    return { success: true };
  } catch (err) {
    console.error("recordParentActivityAction error:", err);
    return { success: false, error: "Грешка при запис на активност." };
  }
}

/**
 * 23. Heartbeat action to update lastActiveAt while parent has the portal open.
 */
export async function recordParentHeartbeatAction() {
  try {
    const session = await getParentSession();
    if (!session) return { success: false };

    const adminDb = getAdminDb();
    const nowIso = new Date().toISOString();
    await adminDb
      .collection(PARENT_USERS_COLLECTION)
      .doc(session.parentId)
      .update({
        lastActiveAt: nowIso,
      });

    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * 24. Fetch activity logs for admin or member profile.
 */
export async function getParentActivityLogsAction(
  limitCount: number = 50,
  memberId?: string
) {
  try {
    const adminDb = getAdminDb();
    let query: FirebaseFirestore.Query = adminDb
      .collection(PARENT_ACTIVITY_LOGS_COLLECTION)
      .where("siteId", "==", "bkgalabovo");

    if (memberId) {
      query = query.where("memberId", "==", memberId);
    }

    const snap = await query.limit(limitCount).get();
    const logs = snap.docs
      .map((d) => ({ ...d.data(), id: d.id }) as ParentActivityLog)
      .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));

    return {
      success: true,
      logs: serializeFirestoreData(logs) as ParentActivityLog[],
    };
  } catch (error) {
    console.error("getParentActivityLogsAction error:", error);
    return {
      success: false,
      error: "Грешка при извличане на историята.",
      logs: [],
    };
  }
}
