"use server";
import "server-only";

// Cache invalidation trigger
import crypto from "crypto";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

import { buildParentDashboardData } from "@/lib/actions/parent-portal-dashboard";
import { ensureAdmin } from "@/lib/auth-utils";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
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
  notifyAdminParentSessionReport,
  notifyParentApproved,
  notifyParentCorrectionApproved,
  notifyParentCreatedManually,
  notifyParentPasswordReset,
  notifyParentRejected,
  ParentSessionReportData,
  sendDirectParentMessageEmail,
} from "@/lib/parent-email-templates";
import { arePhoneNumbersEqual, normalizePhoneNumber } from "@/lib/phone-utils";
import { formatDobString, serializeFirestoreData } from "@/lib/serialize-utils";
import { serverCache } from "@/lib/server-cache";
import { getAgeGroup } from "@/lib/utils";
import {
  DOCUMENT_TITLES,
  type DocumentRequest,
  type DocumentType,
  DocumentTypeEnum,
} from "@/types/document-request.types";
import { DEFAULT_OFFICIAL_TEMPLATES } from "@/types/document-template.types";
import {
  DataCorrectionRequest,
  DefaultParentMemberPermissions,
  ParentAbsence,
  ParentAccessRequest,
  ParentActivityLog,
  ParentCommunicationLog,
  ParentMemberPermissions,
  ParentRole,
  ParentUser,
} from "@/types/parent-portal.types";

const PARENT_REQUESTS_COLLECTION = "parent_requests";
const PARENT_USERS_COLLECTION = "parent_users";
const PARENT_ABSENCES_COLLECTION = "parent_absences";
const PARENT_CORRECTIONS_COLLECTION = "parent_corrections";
const MEMBERS_COLLECTION = "members";

interface CachedMemberSummary {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  phone: string;
  parentPhone: string;
  motherPhone: string;
  fatherPhone: string;
  motherName: string;
  fatherName: string;
  familyId: string | null;
  avatarUrl: string | null;
}

let cachedMembersData: {
  data: CachedMemberSummary[];
  expiresAt: number;
} | null = null;

let cachedAdminParentPortalData: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  expiresAt: number;
} | null = null;

function invalidateAdminParentPortalCache(): void {
  cachedAdminParentPortalData = null;
  cachedMembersData = null;
  try {
    revalidateTag("admin-parent-portal-data", "max");
  } catch {
    // Ignore outside Next.js request/cache context (e.g. unit tests)
  }
}

function invalidateParentDashboardCache(parentUserId?: string): void {
  if (parentUserId) {
    serverCache.invalidatePattern(`parent-dashboard:${parentUserId}`);
  } else {
    serverCache.invalidatePattern("parent-dashboard:");
  }
}

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

    invalidateAdminParentPortalCache();
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
      lastAction: "Смяна на парола",
      lastActionAt: new Date().toISOString(),
    });

    invalidateAdminParentPortalCache();
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
    await ensureAdmin();
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
    revalidatePath("/parents");
    serverCache.invalidatePattern("members:");
    invalidateParentDashboardCache();
    invalidateAdminParentPortalCache();
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
    await ensureAdmin();
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

    invalidateAdminParentPortalCache();
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
    await ensureAdmin();
    const parentName = data.parentName.trim();
    const parentPhone = normalizePhoneNumber(data.parentPhone);
    const parentEmail = data.parentEmail.trim().toLowerCase();
    const tempPassword =
      data.initialPassword?.trim() ||
      crypto.randomBytes(6).toString("base64url").slice(0, 8);

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
    invalidateAdminParentPortalCache();
    invalidateParentDashboardCache(targetParentRef.id);

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
    await ensureAdmin();
    const adminDb = getAdminDb();
    await adminDb.collection(PARENT_USERS_COLLECTION).doc(parentUserId).update({
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    invalidateAdminParentPortalCache();
    invalidateParentDashboardCache(parentUserId);
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
    await ensureAdmin();
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
    invalidateAdminParentPortalCache();
    invalidateParentDashboardCache(parentUserId);
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
    await ensureAdmin();
    const adminDb = getAdminDb();
    const parentRef = adminDb
      .collection(PARENT_USERS_COLLECTION)
      .doc(parentUserId);
    const snap = await parentRef.get();
    if (!snap.exists) {
      return { success: false, error: "Родителят не е намерен." };
    }

    const data = snap.data() as ParentUser;
    const tempPassword = crypto
      .randomBytes(6)
      .toString("base64url")
      .slice(0, 8);
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
    invalidateParentDashboardCache(parentUserId);
    invalidateAdminParentPortalCache();

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
 * 10c. Send parent session activity report to admin email.
 * Writes ZERO documents to Firestore (0 quota usage), delivering full session tracking via email.
 */
export async function sendParentSessionReportAction(
  report: ParentSessionReportData
) {
  try {
    const parent = await getActiveParentUserAction();
    if (!parent) {
      return { success: false, error: "UNAUTHORIZED" };
    }
    if (!report || !report.actions || report.actions.length === 0) {
      return { success: true, skipped: true };
    }
    const sent = await notifyAdminParentSessionReport(report);
    return { success: sent };
  } catch (error) {
    console.error(
      "[parent-portal] Failed to send parent session email report:",
      error
    );
    return { success: false, error: (error as Error).message };
  }
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

    invalidateAdminParentPortalCache();
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

    // Date validation: must be valid YYYY-MM-DD and today or future date in Europe/Sofia
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.startDate)) {
      return {
        success: false,
        error: "Невалиден формат на началната дата.",
      };
    }
    if (data.endDate && !dateRegex.test(data.endDate)) {
      return {
        success: false,
        error: "Невалиден формат на крайната дата.",
      };
    }

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Sofia",
    }).format(new Date());
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

    // Invalidate cached parent dashboard for fresh response
    invalidateParentDashboardCache(parent.id);
    invalidateAdminParentPortalCache();

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

    serverCache.invalidatePattern(`parent-dashboard:${parent.id}`);

    invalidateAdminParentPortalCache();
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
    await ensureAdmin();
    const adminDb = getAdminDb();
    const absRef = adminDb
      .collection(PARENT_ABSENCES_COLLECTION)
      .doc(absenceId);
    const absSnap = await absRef.get();
    await absRef.update({
      status: "seen",
      coachReply: coachReply?.trim() || "",
      reviewedAt: new Date().toISOString(),
    });
    const absData = absSnap.exists ? (absSnap.data() as ParentAbsence) : null;
    invalidateParentDashboardCache(absData?.parentUserId);
    invalidateAdminParentPortalCache();
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

    // Invalidate cached parent dashboard
    invalidateParentDashboardCache(parent.id);
    invalidateAdminParentPortalCache();

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
    await ensureAdmin();
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

    // Map parent portal field keys to official MemberSchema fields
    const val = corr.proposedValue.trim();
    const memberUpdates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    switch (corr.fieldKey) {
      case "fullName": {
        const parts = val.split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
          memberUpdates.firstName = parts[0];
        } else if (parts.length === 2) {
          memberUpdates.firstName = parts[0];
          memberUpdates.lastName = parts[1];
        } else if (parts.length > 2) {
          memberUpdates.firstName = parts[0];
          memberUpdates.middleName = parts.slice(1, -1).join(" ");
          memberUpdates.lastName = parts[parts.length - 1];
        }
        break;
      }
      case "birthDate": {
        memberUpdates.dateOfBirth = val;
        const calcGroup = getAgeGroup(val);
        if (calcGroup) {
          memberUpdates.ageGroup = calcGroup;
        }
        break;
      }
      case "ageGroup":
        memberUpdates.ageGroup = val;
        break;
      case "phone":
        memberUpdates.phone = val;
        break;
      case "address":
        memberUpdates.address = val;
        break;
      case "school":
        memberUpdates.educationInstitution = val;
        break;
      case "apparelSize":
        memberUpdates.apparelSize = val;
        break;
      case "emergencyContact": {
        memberUpdates.hasEmergencyContact = true;
        const phoneMatch = val.match(/(\+?\d[\d\s-]{5,}\d)/);
        if (phoneMatch) {
          const extractedPhone = normalizePhoneNumber(phoneMatch[1]);
          memberUpdates.emergencyContactPhone =
            extractedPhone || phoneMatch[1].trim();
          const namePart = val
            .replace(phoneMatch[0], "")
            .replace(/[()\-–—]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          if (namePart.length >= 2) {
            memberUpdates.emergencyContactName = namePart;
          } else {
            const existingData = memberSnap.data() || {};
            if (!existingData.emergencyContactName && corr.parentName) {
              memberUpdates.emergencyContactName = corr.parentName;
            }
          }
        } else {
          memberUpdates.emergencyContactPhone = val;
        }
        break;
      }
      case "healthNotes":
        memberUpdates.healthConditionNotes = val;
        break;
      default:
        memberUpdates[corr.fieldKey] = val;
        break;
    }

    // Automatically update the mapped fields in the member card!
    await memberRef.update(memberUpdates);

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

    revalidatePath("/members");
    revalidatePath(`/members/${corr.memberId}`);
    serverCache.invalidatePattern("members:");
    invalidateParentDashboardCache();
    invalidateAdminParentPortalCache();
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
    await ensureAdmin();
    const adminDb = getAdminDb();
    const corrRef = adminDb
      .collection(PARENT_CORRECTIONS_COLLECTION)
      .doc(correctionId);
    const corrSnap = await corrRef.get();
    await corrRef.update({
      status: "rejected",
      adminComment: adminComment?.trim() || "",
      resolvedAt: new Date().toISOString(),
    });
    const corrData = corrSnap.exists
      ? (corrSnap.data() as DataCorrectionRequest)
      : null;
    invalidateParentDashboardCache(corrData?.parentUserId);
    invalidateAdminParentPortalCache();
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
    await ensureAdmin();
    const adminDb = getAdminDb();
    await adminDb
      .collection(PARENT_USERS_COLLECTION)
      .doc(parentUserId)
      .delete();
    revalidatePath("/parents");
    invalidateParentDashboardCache(parentUserId);
    invalidateAdminParentPortalCache();
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
    await ensureAdmin();
    const now = Date.now();
    if (
      cachedAdminParentPortalData &&
      cachedAdminParentPortalData.expiresAt > now
    ) {
      return {
        success: true,
        data: cachedAdminParentPortalData.data,
      };
    }

    const fetchRaw = async () => {
      const adminDb = getAdminDb();
      let members: CachedMemberSummary[];

      if (cachedMembersData && cachedMembersData.expiresAt > Date.now()) {
        members = cachedMembersData.data;
      } else {
        const membersSnap = await adminDb
          .collection(MEMBERS_COLLECTION)
          .where("siteId", "==", "bkgalabovo")
          .limit(1000)
          .get();

        members = membersSnap.docs.map((d) => {
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

        cachedMembersData = {
          data: members,
          expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes cache
        };
      }

      const [reqsSnap, usersSnap, absSnap, corrsSnap, docReqsSnap] =
        await Promise.all([
          adminDb
            .collection(PARENT_REQUESTS_COLLECTION)
            .where("siteId", "==", "bkgalabovo")
            .limit(500)
            .get(),
          adminDb
            .collection(PARENT_USERS_COLLECTION)
            .where("siteId", "==", "bkgalabovo")
            .limit(500)
            .get(),
          adminDb
            .collection(PARENT_ABSENCES_COLLECTION)
            .where("siteId", "==", "bkgalabovo")
            .limit(500)
            .get(),
          adminDb
            .collection(PARENT_CORRECTIONS_COLLECTION)
            .where("siteId", "==", "bkgalabovo")
            .limit(500)
            .get(),
          adminDb
            .collection("document_requests")
            .where("siteId", "==", "bkgalabovo")
            .limit(500)
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

      const documentRequests: DocumentRequest[] = docReqsSnap.docs
        .map((d) => ({ ...d.data(), id: d.id }) as DocumentRequest)
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

      let communications: ParentCommunicationLog[] = [];
      try {
        const commsSnap = await adminDb
          .collection("parent_communications")
          .where("siteId", "==", "bkgalabovo")
          .limit(60)
          .get();
        communications = commsSnap.docs
          .map((d) => ({ ...d.data(), id: d.id }) as ParentCommunicationLog)
          .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      } catch (commErr) {
        console.warn("Failed to load parent communications:", commErr);
      }

      const activityLogs: ParentActivityLog[] = [];

      const pendingRequestsCount = requests.filter(
        (r) => r.status === "pending"
      ).length;
      const pendingAbsencesCount = absences.filter(
        (a) => a.status === "submitted"
      ).length;
      const pendingCorrectionsCount = corrections.filter(
        (c) => c.status === "pending"
      ).length;

      const calcNow = Date.now();
      const sevenDaysAgoMs = calcNow - 7 * 24 * 60 * 60 * 1000;
      const recentlySignedDocsCount = documentRequests.filter(
        (dr) =>
          dr.status === "completed" &&
          dr.signedAt &&
          new Date(dr.signedAt).getTime() >= sevenDaysAgoMs
      ).length;
      const pendingSentDocsCount = documentRequests.filter(
        (dr) => dr.status === "pending"
      ).length;

      const onlineParentsCount = parents.filter(
        (p) =>
          p.lastActiveAt &&
          calcNow - new Date(p.lastActiveAt).getTime() < 4 * 60 * 1000
      ).length;

      return serializeFirestoreData({
        requests,
        parents,
        absences,
        corrections,
        documentRequests,
        members,
        activityLogs,
        communications,
        onlineParentsCount,
        stats: {
          pendingRequestsCount,
          pendingAbsencesCount,
          pendingCorrectionsCount,
          recentlySignedDocsCount,
          pendingSentDocsCount,
          onlineParentsCount,
          totalPending:
            pendingRequestsCount +
            pendingAbsencesCount +
            pendingCorrectionsCount,
        },
      });
    };

    const fetchCached = unstable_cache(fetchRaw, ["admin-parent-portal-data"], {
      revalidate: 180,
      tags: ["admin-parent-portal-data"],
    });

    let responseData;
    try {
      responseData = await fetchCached();
    } catch (cacheErr) {
      if (String(cacheErr).includes("incrementalCache")) {
        responseData = await fetchRaw();
      } else {
        throw cacheErr;
      }
    }

    cachedAdminParentPortalData = {
      data: responseData,
      expiresAt: now + 180 * 1000, // 3 minutes server cache TTL
    };

    return {
      success: true,
      data: responseData,
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
  const parent = await getActiveParentUserAction();
  return buildParentDashboardData(parent, requestedChildId);
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
    const nowIso = new Date().toISOString();

    // Update parent presence & latest action directly on parent user doc (0 extra collection writes)
    await adminDb
      .collection(PARENT_USERS_COLLECTION)
      .doc(session.parentId)
      .update({
        lastActiveAt: nowIso,
        lastAction: data.actionTitle,
        lastActionAt: nowIso,
      });

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
 * Retained for backwards-compatibility; returns empty to protect Firestore quota.
 */
export async function getParentActivityLogsAction(
  _limitCount: number = 50,
  _memberId?: string
) {
  return {
    success: true,
    logs: [] as ParentActivityLog[],
  };
}

/**
 * 25. Send an official club document directly to a parent's profile for preview and online signing (Admin action).
 * Pulls the latest template from `document_templates/{documentType}` (or DEFAULT_OFFICIAL_TEMPLATES).
 */
export async function sendDocumentToParentPortalAction(input: {
  memberId: string;
  parentUserId?: string;
  documentType: DocumentType;
}) {
  try {
    await ensureAdmin();
    const typeResult = DocumentTypeEnum.safeParse(input.documentType);
    if (!typeResult.success) {
      return { success: false, error: "Невалиден тип документ." };
    }

    const adminDb = getAdminDb();
    const memberDoc = await adminDb
      .collection(MEMBERS_COLLECTION)
      .doc(input.memberId)
      .get();

    if (!memberDoc.exists) {
      return { success: false, error: "Състезателят не е намерен." };
    }

    const memberData = memberDoc.data() || {};
    const memberName =
      (memberData.name as string) ||
      [memberData.firstName, memberData.middleName, memberData.lastName]
        .filter(Boolean)
        .join(" ") ||
      "Член на клуба";

    const memberBirthDate =
      formatDobString(memberData.dateOfBirth || memberData.birthDate) || null;
    const siteId = (memberData.siteId as string) || "bkgalabovo";
    const documentType = typeResult.data;
    const documentTitle = DOCUMENT_TITLES[documentType] || "Клубен документ";

    // Always pull the latest template version from `document_templates/{documentType}`
    const defaultTpl = DEFAULT_OFFICIAL_TEMPLATES.find(
      (t) => t.id === documentType
    );
    let templateId: string | null = defaultTpl?.id || documentType;
    let templateVersion = defaultTpl?.version || 1;
    let documentLegalTextSnapshot: string | null = defaultTpl?.content || null;
    let documentTitleSnapshot = defaultTpl?.title || documentTitle;

    try {
      const tplSnap = await adminDb
        .collection("document_templates")
        .doc(documentType)
        .get();
      if (tplSnap.exists) {
        const tplData = tplSnap.data();
        templateId = tplSnap.id;
        templateVersion =
          typeof tplData?.version === "number" ? tplData.version : 1;
        documentLegalTextSnapshot =
          tplData?.content || documentLegalTextSnapshot;
        documentTitleSnapshot = tplData?.title || documentTitleSnapshot;
      }
    } catch {
      // fallback to defaultTpl
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Check if an active pending request already exists for this member + documentType
    const existingSnap = await adminDb
      .collection("document_requests")
      .where("memberId", "==", input.memberId)
      .where("documentType", "==", documentType)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    let requestId: string;
    let token: string;

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      const existingData = existingDoc.data();
      requestId = existingDoc.id;
      token = existingData.token;

      // Refresh with the latest template version & extend expiry
      await existingDoc.ref.update({
        documentTitle: documentTitleSnapshot,
        templateId,
        templateVersion,
        documentLegalTextSnapshot,
        documentTitleSnapshot,
        expiresAt: expiresAt.toISOString(),
        sentToParentUserId:
          input.parentUserId || existingData.sentToParentUserId || null,
      });
    } else {
      token = crypto.randomUUID();
      const newReq = {
        token,
        memberId: input.memberId,
        memberName,
        memberBirthDate,
        siteId,
        documentType,
        documentTitle: documentTitleSnapshot,
        templateId,
        templateVersion,
        documentLegalTextSnapshot,
        documentTitleSnapshot,
        status: "pending",
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        viewedByParentAt: null,
        sentToParentUserId: input.parentUserId || null,
        signedAt: null,
        signatureUrl: null,
        parentData: null,
      };
      const docRef = await adminDb.collection("document_requests").add(newReq);
      requestId = docRef.id;
    }

    // Ensure showDocumentsStatus is enabled on linked parent(s) so they see the Documents section
    try {
      const parentSnap = await adminDb
        .collection(PARENT_USERS_COLLECTION)
        .where("linkedMemberIds", "array-contains", input.memberId)
        .get();
      for (const pDoc of parentSnap.docs) {
        if (input.parentUserId && pDoc.id !== input.parentUserId) continue;
        const pData = pDoc.data() as ParentUser;
        const currPerms =
          pData.permissionsPerMember?.[input.memberId] ||
          DefaultParentMemberPermissions;
        if (currPerms.showDocumentsStatus === false) {
          await pDoc.ref.update({
            [`permissionsPerMember.${input.memberId}.showDocumentsStatus`]: true,
          });
        }
        invalidateParentDashboardCache(pDoc.id);
      }
      if (input.parentUserId) {
        invalidateParentDashboardCache(input.parentUserId);
      }
    } catch {
      // non-blocking
    }

    revalidatePath("/parents");
    revalidatePath(`/members/${input.memberId}`);
    revalidatePath("/club/parents");
    invalidateAdminParentPortalCache();

    return {
      success: true,
      requestId,
      token,
      documentTitle: documentTitleSnapshot,
    };
  } catch (err) {
    console.error("sendDocumentToParentPortalAction error:", err);
    return {
      success: false,
      error: "Грешка при изпращане на документа до родителския профил.",
    };
  }
}

/**
 * 26. Mark a sent document as viewed by the parent in the Parent Portal.
 * Updates `viewedByParentAt` on `document_requests` and updates the parent's `lastAction` so Admin sees it immediately.
 */
export async function markDocumentViewedByParentAction(requestId: string) {
  try {
    const parent = await getActiveParentUserAction();
    if (!parent) {
      return { success: false, error: "UNAUTHORIZED" };
    }

    const adminDb = getAdminDb();
    const docRef = adminDb.collection("document_requests").doc(requestId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return { success: false, error: "Документът не е намерен." };
    }

    const docData = snap.data() || {};
    if (
      !docData.memberId ||
      !parent.linkedMemberIds.includes(docData.memberId)
    ) {
      return { success: false, error: "Нямате достъп до този документ." };
    }
    const nowIso = new Date().toISOString();
    const viewedByParentAt = docData.viewedByParentAt || nowIso;

    if (!docData.viewedByParentAt) {
      await docRef.update({ viewedByParentAt });
    }

    const actionTitle = `👁️ Прегледан документ: ${docData.documentTitleSnapshot || docData.documentTitle || "Документ"}`;
    await adminDb.collection(PARENT_USERS_COLLECTION).doc(parent.id).update({
      lastActiveAt: nowIso,
      lastAction: actionTitle,
      lastActionAt: nowIso,
    });

    invalidateAdminParentPortalCache();
    invalidateParentDashboardCache(parent.id);

    return {
      success: true,
      viewedByParentAt,
    };
  } catch (err) {
    console.error("markDocumentViewedByParentAction error:", err);
    return { success: false, error: "Грешка при отбелязване на преглед." };
  }
}

/**
 * 27. Get active excused absences for a specific date (used by /schedule AttendeesDialog).
 * Returns a map of memberId -> { reason: string; note: string; status: string }
 */
export async function getActiveAbsencesForDateAction(
  dateStr: string,
  memberIds?: string[]
): Promise<{
  success: boolean;
  absences: Record<
    string,
    { reason: string; note: string; status: string; type: string }
  >;
}> {
  try {
    const { ensureAdminFromSession } = await import("@/lib/auth-utils");
    await ensureAdminFromSession();
    const adminDb = getAdminDb();
    const snap = await adminDb
      .collection(PARENT_ABSENCES_COLLECTION)
      .where("siteId", "==", "bkgalabovo")
      .get();

    const result: Record<
      string,
      { reason: string; note: string; status: string; type: string }
    > = {};

    const targetDate = dateStr.split("T")[0];

    const matchingAbsences = snap.docs
      .map((doc) => doc.data() as ParentAbsence)
      .filter((data) => {
        if (data.status === "cancelled_by_parent") return false;
        if (
          memberIds &&
          memberIds.length > 0 &&
          !memberIds.includes(data.memberId)
        ) {
          return false;
        }
        const start = (data.startDate || "").split("T")[0];
        const end = (data.endDate || data.startDate || "").split("T")[0];
        return Boolean(start && start <= targetDate && end >= targetDate);
      })
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

    matchingAbsences.forEach((data) => {
      result[data.memberId] = {
        reason: data.reason || "Извинено отсъствие",
        note: data.note || "",
        status: data.status,
        type: data.type,
      };
    });

    return { success: true, absences: result };
  } catch (err) {
    console.error("getActiveAbsencesForDateAction error:", err);
    return { success: false, absences: {} };
  }
}

/**
 * 28. Link an additional child member to an existing parent user.
 */
export async function linkChildToParentAction(
  parentId: string,
  memberId: string
) {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const parentRef = adminDb.collection(PARENT_USERS_COLLECTION).doc(parentId);
    const snap = await parentRef.get();

    if (!snap.exists) {
      return { success: false, error: "Родителят не е намерен." };
    }

    const parentData = snap.data() as ParentUser;
    const currentLinked = parentData.linkedMemberIds || [];

    if (currentLinked.includes(memberId)) {
      return { success: true, message: "Детето вече е свързано." };
    }

    const updatedLinked = [...currentLinked, memberId];
    const updatedPerms = {
      ...(parentData.permissionsPerMember || {}),
      [memberId]: DefaultParentMemberPermissions,
    };

    await parentRef.update({
      linkedMemberIds: updatedLinked,
      permissionsPerMember: updatedPerms,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/parents");
    revalidatePath(`/members/${memberId}`);
    invalidateAdminParentPortalCache();
    invalidateParentDashboardCache(parentId);

    return { success: true };
  } catch (err) {
    console.error("linkChildToParentAction error:", err);
    return { success: false, error: "Грешка при свързване на детето." };
  }
}

/**
 * 29. Unlink a child member from an existing parent user.
 */
export async function unlinkChildFromParentAction(
  parentId: string,
  memberId: string
) {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const parentRef = adminDb.collection(PARENT_USERS_COLLECTION).doc(parentId);
    const snap = await parentRef.get();

    if (!snap.exists) {
      return { success: false, error: "Родителят не е намерен." };
    }

    const parentData = snap.data() as ParentUser;
    const currentLinked = parentData.linkedMemberIds || [];

    const updatedLinked = currentLinked.filter((id) => id !== memberId);
    const updatedPerms = { ...(parentData.permissionsPerMember || {}) };
    delete updatedPerms[memberId];

    await parentRef.update({
      linkedMemberIds: updatedLinked,
      permissionsPerMember: updatedPerms,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/parents");
    revalidatePath(`/members/${memberId}`);
    invalidateAdminParentPortalCache();
    invalidateParentDashboardCache(parentId);

    return { success: true };
  } catch (err) {
    console.error("unlinkChildFromParentAction error:", err);
    return { success: false, error: "Грешка при разкачане на детето." };
  }
}

/**
 * Uploads a physical medical certificate (photo / scan / PDF) by authenticated parent.
 */
export async function uploadParentMedicalCertificateAction(input: {
  memberId: string;
  fileBase64: string;
  fileName?: string;
  certificateDate: string;
}): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    const session = await getParentSession();
    if (!session) {
      return { success: false, error: "Не сте оторизиран родител." };
    }

    if (
      !input.certificateDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.certificateDate) ||
      Number.isNaN(Date.parse(input.certificateDate))
    ) {
      return {
        success: false,
        error: "Невалидна дата на медицинското свидетелство.",
      };
    }

    const MAX_CERT_BYTES = 10 * 1024 * 1024;
    if (!input.fileBase64 || input.fileBase64.length > 15 * 1024 * 1024) {
      return {
        success: false,
        error: "Файлът е твърде голям (максимум 10MB).",
      };
    }
    const rawBase64 = input.fileBase64.includes(",")
      ? input.fileBase64.split(",")[1] || ""
      : input.fileBase64;
    if (Buffer.byteLength(rawBase64, "base64") > MAX_CERT_BYTES) {
      return {
        success: false,
        error: "Файлът е твърде голям (максимум 10MB).",
      };
    }

    const adminDb = getAdminDb();
    const parentDoc = await adminDb
      .collection(PARENT_USERS_COLLECTION)
      .doc(session.parentId)
      .get();
    if (!parentDoc.exists) {
      return { success: false, error: "Родителският профил не е намерен." };
    }

    const parentData = parentDoc.data() || {};
    const linkedIds: string[] = parentData.linkedMemberIds || [];
    if (!linkedIds.includes(input.memberId)) {
      return {
        success: false,
        error: "Нямате достъп до досието на този състезател.",
      };
    }

    const memberRef = adminDb.collection("members").doc(input.memberId);
    const memberDoc = await memberRef.get();
    if (!memberDoc.exists) {
      return { success: false, error: "Състезателят не е намерен." };
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
      console.warn(
        "Storage upload fallback for parent medical cert:",
        storageErr
      );
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
      medicalCertificateStatus: "pending_review",
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/club/parents");
    revalidatePath(`/members/${input.memberId}`);
    serverCache.invalidatePattern(`parent-dashboard:${session.parentId}`);

    return { success: true, fileUrl };
  } catch (error) {
    console.error("uploadParentMedicalCertificateAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при изпращане на медицинското свидетелство.",
    };
  }
}

/**
 * 31. Log a phone call with a specific parent.
 */
export async function logParentCallAction(input: {
  parentId: string;
  parentName: string;
  parentPhone: string;
  memberId?: string | null;
  memberName?: string | null;
  outcome: string;
  notes: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const nowIso = new Date().toISOString();
    const docRef = adminDb.collection("parent_communications").doc();

    const data: Omit<ParentCommunicationLog, "id"> = {
      siteId: "bkgalabovo",
      parentId: input.parentId,
      parentName: input.parentName,
      parentPhone: input.parentPhone,
      memberId: input.memberId || null,
      memberName: input.memberName || null,
      channel: "phone",
      outcome: input.outcome,
      messageText: input.notes.trim() || input.outcome,
      status: "completed",
      createdAt: nowIso,
      createdBy: "Треньор / Администратор",
    };

    await docRef.set(data);
    revalidatePath("/parents");

    invalidateAdminParentPortalCache();
    return { success: true };
  } catch (error) {
    console.error("logParentCallAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при записване на проведения разговор.",
    };
  }
}

/**
 * 32. Send an individual email to a specific parent regarding their child.
 */
export async function sendIndividualParentEmailAction(input: {
  parentId: string;
  parentName: string;
  parentEmail: string;
  memberId?: string | null;
  memberName?: string | null;
  subject: string;
  messageText: string;
  templateTitle?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAdmin();
    const parentEmail = input.parentEmail.trim().toLowerCase();
    if (!parentEmail || !parentEmail.includes("@")) {
      return { success: false, error: "Родителят няма валиден имейл адрес." };
    }
    if (!input.subject.trim()) {
      return { success: false, error: "Моля, въведете тема на имейла." };
    }
    if (!input.messageText.trim()) {
      return { success: false, error: "Моля, въведете текст на съобщението." };
    }

    const sent = await sendDirectParentMessageEmail({
      to: parentEmail,
      parentName: input.parentName,
      childName: input.memberName || undefined,
      subject: input.subject.trim(),
      messageText: input.messageText.trim(),
    });

    if (!sent) {
      return {
        success: false,
        error:
          "Неуспешно изпращане. Моля, проверете настройките на пощенския сървър (EMAIL_USER / EMAIL_PASS).",
      };
    }

    const adminDb = getAdminDb();
    const nowIso = new Date().toISOString();
    const docRef = adminDb.collection("parent_communications").doc();

    const data: Omit<ParentCommunicationLog, "id"> = {
      siteId: "bkgalabovo",
      parentId: input.parentId,
      parentName: input.parentName,
      parentEmail,
      memberId: input.memberId || null,
      memberName: input.memberName || null,
      channel: "email",
      subject: input.subject.trim(),
      messageText: input.messageText.trim(),
      templateTitle: input.templateTitle || "Индивидуален имейл",
      status: "sent",
      createdAt: nowIso,
      createdBy: "Треньор / Администратор",
    };

    await docRef.set(data);
    revalidatePath("/parents");

    invalidateAdminParentPortalCache();
    return { success: true };
  } catch (error) {
    console.error("sendIndividualParentEmailAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Възникна грешка при изпращането на индивидуалния имейл.",
    };
  }
}

/**
 * 33. Retrieve parent communication logs (calls & individual emails).
 */
export async function getParentCommunicationsAction(input?: {
  parentId?: string;
  limitCount?: number;
}): Promise<{
  success: boolean;
  data?: ParentCommunicationLog[];
  error?: string;
}> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    let q = adminDb
      .collection("parent_communications")
      .where("siteId", "==", "bkgalabovo");

    if (input?.parentId) {
      q = q.where("parentId", "==", input.parentId);
    }

    const snap = await q.limit(input?.limitCount || 60).get();
    const list: ParentCommunicationLog[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ParentCommunicationLog, "id">),
    }));

    list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return { success: true, data: serializeFirestoreData(list) };
  } catch (error) {
    console.error("getParentCommunicationsAction error:", error);
    return {
      success: false,
      error: "Грешка при зареждане на комуникационния лог.",
      data: [],
    };
  }
}
