"use server";
import "server-only";

import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

import { logAuditEvent } from "@/lib/audit-logger";
import { ensureAdmin } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import type {
  DocumentRequest,
  DocumentType,
  ParentData,
  PublicDocumentRequestDTO,
} from "@/types/document-request.types";
import {
  DOCUMENT_TITLES,
  DocumentTypeEnum,
  ParentDataSchema,
} from "@/types/document-request.types";
import type { ActionResult } from "@/types/document-template.types";

/**
 * Creates a new document signing request for a member (Admin only).
 */
export async function createDocumentRequestAction(input: {
  memberId: string;
  documentType: DocumentType;
  idToken: string;
}): Promise<ActionResult<{ token: string; requestId: string }>> {
  try {
    const user = await ensureAdmin(input.idToken);
    const adminDb = getAdminDb();

    // Validate documentType
    const typeResult = DocumentTypeEnum.safeParse(input.documentType);
    if (!typeResult.success) {
      return { success: false, error: "Невалиден тип документ." };
    }

    // Check member exists
    const memberDoc = await adminDb
      .collection("members")
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

    let memberBirthDate: string | null = null;
    if (memberData.birthDate) {
      memberBirthDate =
        typeof memberData.birthDate === "string"
          ? memberData.birthDate
          : memberData.birthDate?.toDate?.()
            ? memberData.birthDate.toDate().toISOString()
            : null;
    }

    const siteId = (memberData.siteId as string) || "bkgalabovo";
    const documentType = typeResult.data;
    const documentTitle = DOCUMENT_TITLES[documentType] || "Клубен документ";

    // Check if an active pending request already exists for this member and doc type
    const existingSnap = await adminDb
      .collection("document_requests")
      .where("memberId", "==", input.memberId)
      .where("documentType", "==", documentType)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      const existingData = existingDoc.data();
      if (new Date(existingData.expiresAt).getTime() > Date.now()) {
        return {
          success: true,
          message: "Линкът за подписване е зареден успешно.",
          data: {
            token: existingData.token,
            requestId: existingDoc.id,
          },
        };
      }
    }

    // Fetch active template to snapshot version and text (immutability guarantee)
    let templateId: string | null = null;
    let templateVersion = 1;
    let documentLegalTextSnapshot: string | null = null;
    let documentTitleSnapshot = documentTitle;

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
        documentLegalTextSnapshot = tplData?.content || null;
        documentTitleSnapshot = tplData?.title || documentTitle;
      }
    } catch {
      // If template doc is not yet seeded, fall back smoothly
    }

    // Generate secure token (UUIDv4)
    const token = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days validity

    const newRequestData = {
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
      signedAt: null,
      signatureUrl: null,
      parentData: null,
      createdBy: {
        uid: user.uid,
        email: user.email || undefined,
      },
    };

    const docRef = await adminDb
      .collection("document_requests")
      .add(newRequestData);

    await logAuditEvent({
      action: "create_document_request",
      targetCollection: "document_requests",
      targetId: docRef.id,
      siteId,
      details: `Генериран линк за подписване: ${documentTitle} за ${memberName}`,
      userId: user.uid,
      userEmail: user.email || undefined,
      metadata: {
        memberId: input.memberId,
        documentType,
        token,
      },
    });

    return {
      success: true,
      message: "Линкът за подписване е генериран успешно.",
      data: {
        token,
        requestId: docRef.id,
      },
    };
  } catch (err: unknown) {
    console.error("Error creating document request:", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Грешка при генериране на линк.",
    };
  }
}

/**
 * Public action: Fetches safe document request details for the public signing page.
 * Strictly adheres to Least Privilege DTO to prevent data leakage.
 */
export async function getPublicDocumentRequestAction(
  token: string
): Promise<ActionResult<PublicDocumentRequestDTO>> {
  try {
    if (!token || typeof token !== "string" || token.length < 10) {
      return { success: false, error: "Невалиден код за достъп." };
    }

    const adminDb = getAdminDb();
    const snap = await adminDb
      .collection("document_requests")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (snap.empty) {
      return {
        success: false,
        error: "Документът не е намерен или линкът е невалиден.",
      };
    }

    const docSnap = snap.docs[0];
    const rawData = docSnap.data();

    // Check expiration
    const expiresAt = new Date(rawData.expiresAt);
    const isExpired = Date.now() > expiresAt.getTime();
    let currentStatus: "pending" | "completed" | "expired" | "cancelled" =
      rawData.status;

    if (currentStatus === "pending" && isExpired) {
      currentStatus = "expired";
    }

    // Safe DTO - only return required public fields
    const safeDto: PublicDocumentRequestDTO = {
      id: docSnap.id,
      token: rawData.token,
      memberId: rawData.memberId,
      memberName: rawData.memberName,
      memberBirthDate: rawData.memberBirthDate || null,
      documentType: rawData.documentType,
      documentTitle: rawData.documentTitle,
      siteId: rawData.siteId || "bkgalabovo",
      status: currentStatus,
      createdAt: rawData.createdAt,
      expiresAt: rawData.expiresAt,
      signedAt: rawData.signedAt || null,
      parentData: rawData.parentData || null,
      signatureUrl: rawData.signatureUrl || null,
      secondParentSignatureUrl: rawData.secondParentSignatureUrl || null,
      memberSignatureUrl: rawData.memberSignatureUrl || null,
      presidentSignatureUrl: rawData.presidentSignatureUrl || null,
      presidentSignedAt: rawData.presidentSignedAt || null,
      templateId: rawData.templateId || null,
      templateVersion: rawData.templateVersion || 1,
      documentLegalTextSnapshot: rawData.documentLegalTextSnapshot || null,
      documentTitleSnapshot:
        rawData.documentTitleSnapshot || rawData.documentTitle,
    };

    return {
      success: true,
      data: safeDto,
    };
  } catch (err: unknown) {
    console.error("Error fetching public document request:", err);
    return {
      success: false,
      error: "Грешка при зареждане на документа.",
    };
  }
}

/**
 * Public action: Submits the signed document from the parent.
 */
export async function submitSignedDocumentAction(input: {
  token: string;
  parentData: ParentData;
  signatureBase64: string;
  secondParentSignatureBase64?: string | null;
  memberSignatureBase64?: string | null;
  metadata?: {
    userAgent?: string;
  };
}): Promise<ActionResult<{ signedAt: string }>> {
  try {
    const { token, signatureBase64 } = input;

    // Validate token
    if (!token || typeof token !== "string") {
      return { success: false, error: "Невалиден токен." };
    }

    // Validate signature string (must be data URL or valid base64 image)
    if (!signatureBase64 || !signatureBase64.startsWith("data:image/")) {
      return {
        success: false,
        error: "Моля, положете валиден електронен подпис.",
      };
    }

    // Validate parentData
    const parentParse = ParentDataSchema.safeParse(input.parentData);
    if (!parentParse.success) {
      const issue =
        parentParse.error.issues[0]?.message || "Невалидни данни за родител.";
      return { success: false, error: issue };
    }
    const parentData = parentParse.data;

    const adminDb = getAdminDb();
    const snap = await adminDb
      .collection("document_requests")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (snap.empty) {
      return { success: false, error: "Документът не е намерен." };
    }

    const docSnap = snap.docs[0];
    const docData = docSnap.data();

    // Verify status is pending
    if (docData.status === "completed") {
      return {
        success: false,
        error:
          "Този документ вече е бил подписан и не може да се променя повторно.",
      };
    }

    if (docData.status === "cancelled") {
      return {
        success: false,
        error: "Този линк е бил анулиран от администратор.",
      };
    }

    // Check expiration
    if (new Date(docData.expiresAt).getTime() < Date.now()) {
      return {
        success: false,
        error: "Срокът за подписване на този линк е изтекъл.",
      };
    }

    const signedAt = new Date().toISOString();

    // 1. Update the document request status to completed
    const docUpdates: Record<string, unknown> = {
      status: "completed",
      signedAt,
      signatureUrl: signatureBase64,
      secondParentSignatureUrl: input.secondParentSignatureBase64 || null,
      memberSignatureUrl: input.memberSignatureBase64 || null,
      parentData,
      metadata: {
        userAgent: input.metadata?.userAgent || "Unknown",
        signedAtTimestamp: FieldValue.serverTimestamp(),
      },
    };

    // If membership application and participationType was chosen, compile the final text snapshot with the choice clearly checked
    if (
      docData.documentType === "membershipApplication" &&
      parentData.participationType &&
      typeof docData.documentLegalTextSnapshot === "string"
    ) {
      const selectedPlan = parentData.participationType;
      const compiled = docData.documentLegalTextSnapshot.replace(
        /•\s*Месечен абонамент[\s\S]*?•\s*Единично посещение[^\n]*/i,
        `[✓] Избрана форма на участие: ${selectedPlan}`
      );
      docUpdates.documentLegalTextSnapshot = compiled;
    }

    await docSnap.ref.update(docUpdates);

    // 2. Update member document flags in members collection
    const memberRef = adminDb.collection("members").doc(docData.memberId);
    const memberDoc = await memberRef.get();

    if (memberDoc.exists) {
      const docType = docData.documentType as DocumentType;
      const memberUpdates: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (parentData.participationType) {
        memberUpdates.participationType = parentData.participationType;
      }

      // Always update parent contact info if provided and member's parent contact is empty
      const existingMember = memberDoc.data() || {};
      if (parentData.parentName && !existingMember.parentName) {
        memberUpdates.parentName = parentData.parentName;
      }
      if (parentData.parentPhone && !existingMember.parentPhone) {
        memberUpdates.parentPhone = parentData.parentPhone;
      }
      if (parentData.parentEmail && !existingMember.parentEmail) {
        memberUpdates.parentEmail = parentData.parentEmail;
      }
      if (parentData.parentAddress && !existingMember.address) {
        memberUpdates.address = parentData.parentAddress;
      }
      if (parentData.secondParentName && !existingMember.secondParentName) {
        memberUpdates.secondParentName = parentData.secondParentName;
      }
      if (parentData.secondParentPhone && !existingMember.secondParentPhone) {
        memberUpdates.secondParentPhone = parentData.secondParentPhone;
      }

      // Specific document updates
      if (docType === "membershipApplication") {
        memberUpdates.hasMembershipApplication = true;
        memberUpdates.membershipApplicationHandedAt = signedAt;
        memberUpdates.membershipApplicationUrl = signatureBase64;
        memberUpdates.membershipApplicationSignatureUrl = signatureBase64;
      } else if (docType === "signedDeclaration") {
        memberUpdates.hasSignedDeclaration = true;
        memberUpdates.signedDeclarationHandedAt = signedAt;
        memberUpdates.signedDeclarationUrl = signatureBase64;
        memberUpdates.signedDeclarationSignatureUrl = signatureBase64;
      } else if (docType === "safetyInstruction") {
        memberUpdates.hasSafetyInstruction = true;
        memberUpdates.safetyInstructionHandedAt = signedAt;
        memberUpdates.safetyInstructionUrl = signatureBase64;
        memberUpdates.safetyInstructionSignatureUrl = signatureBase64;
        memberUpdates.safetyDeclarationSignatureUrl = signatureBase64;
      } else if (docType === "travelDeclaration") {
        memberUpdates.hasTravelDeclaration = true;
        memberUpdates.travelDeclarationHandedAt = signedAt;
        memberUpdates.travelDeclarationUrl = signatureBase64;
        memberUpdates.travelDeclarationSignatureUrl = signatureBase64;
      } else if (docType === "internalRules") {
        memberUpdates.hasInternalRules = true;
        memberUpdates.internalRulesHandedAt = signedAt;
        memberUpdates.internalRulesUrl = signatureBase64;
        memberUpdates.internalRulesSignatureUrl = signatureBase64;
      } else if (docType === "terminationRequest") {
        memberUpdates.hasTerminationRequest = true;
        memberUpdates.terminationRequestHandedAt = signedAt;
        memberUpdates.terminationRequestUrl = signatureBase64;
        memberUpdates.terminationRequestSignatureUrl = signatureBase64;
      }

      await memberRef.update(memberUpdates);
    }

    // 3. Log audit event
    await logAuditEvent({
      action: "sign_document_request",
      targetCollection: "document_requests",
      targetId: docSnap.id,
      siteId: docData.siteId || "bkgalabovo",
      details: `Документът "${docData.documentTitle}" за ${docData.memberName} беше успешно подписан онлайн от ${parentData.parentName}`,
      userId: "parent_online",
      userEmail: parentData.parentEmail || undefined,
      metadata: {
        memberId: docData.memberId,
        memberName: docData.memberName,
        documentType: docData.documentType,
        parentName: parentData.parentName,
        parentPhone: parentData.parentPhone,
        signedAt,
      },
    });

    // Revalidate relevant pages
    revalidatePath("/members");
    revalidatePath(`/members/${docData.memberId}`);

    return {
      success: true,
      message:
        "Документът е подписан и записан успешно в профила на състезателя!",
      data: { signedAt },
    };
  } catch (err: unknown) {
    console.error("Error submitting signed document:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Грешка при подписване на документа.",
    };
  }
}

/**
 * Admin action: Cancel/revoke an existing document request.
 */
export async function cancelDocumentRequestAction(input: {
  requestId: string;
  idToken: string;
}): Promise<ActionResult> {
  try {
    const user = await ensureAdmin(input.idToken);
    const adminDb = getAdminDb();

    const docRef = adminDb.collection("document_requests").doc(input.requestId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return { success: false, error: "Заявката не е намерена." };
    }

    const data = snap.data() || {};
    if (data.status === "completed") {
      return {
        success: false,
        error: "Подписан документ не може да бъде анулиран.",
      };
    }

    await docRef.update({
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      cancelledBy: {
        uid: user.uid,
        email: user.email || undefined,
      },
    });

    return {
      success: true,
      message: "Линкът за подписване е анулиран успешно.",
    };
  } catch (err: unknown) {
    console.error("Error cancelling document request:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Грешка при анулиране на заявката.",
    };
  }
}

/**
 * Admin action: Permanently delete a document request from the database (Firestore).
 * Cleans up the record from `document_requests` and, if it was a completed signed document,
 * resets the member's profile document fields (if no other completed request exists).
 */
export async function deleteDocumentRequestAction(input: {
  requestId: string;
  idToken: string;
}): Promise<ActionResult> {
  try {
    const user = await ensureAdmin(input.idToken);
    const adminDb = getAdminDb();

    const docRef = adminDb.collection("document_requests").doc(input.requestId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return {
        success: false,
        error: "Заявката не е намерена в базата данни.",
      };
    }

    const docData = snap.data() || {};

    // 1. If completed, clean member profile fields if no other completed request exists
    if (docData.memberId && docData.status === "completed") {
      const otherCompletedSnap = await adminDb
        .collection("document_requests")
        .where("memberId", "==", docData.memberId)
        .where("documentType", "==", docData.documentType)
        .where("status", "==", "completed")
        .get();

      // Only clean member profile if this was the only completed document of this type
      const otherDocs = otherCompletedSnap.docs.filter(
        (d) => d.id !== input.requestId
      );
      if (otherDocs.length === 0) {
        const memberRef = adminDb.collection("members").doc(docData.memberId);
        const memberSnap = await memberRef.get();
        if (memberSnap.exists) {
          const memberUpdates: Record<string, unknown> = {};
          const docType = docData.documentType;

          if (docType === "membership_application") {
            memberUpdates.hasMembershipApplication = false;
            memberUpdates.membershipApplicationUrl = FieldValue.delete();
            memberUpdates.membershipApplicationSignatureUrl =
              FieldValue.delete();
            memberUpdates.membershipApplicationHandedAt = FieldValue.delete();
          } else if (docType === "internal_rules") {
            memberUpdates.hasInternalRules = false;
            memberUpdates.internalRulesUrl = FieldValue.delete();
            memberUpdates.internalRulesSignatureUrl = FieldValue.delete();
            memberUpdates.internalRulesHandedAt = FieldValue.delete();
          } else if (docType === "safety_instruction") {
            memberUpdates.hasSafetyInstruction = false;
            memberUpdates.safetyInstructionUrl = FieldValue.delete();
            memberUpdates.safetyInstructionSignatureUrl = FieldValue.delete();
            memberUpdates.safetyInstructionHandedAt = FieldValue.delete();
            memberUpdates.safetyDeclarationSignatureUrl = FieldValue.delete();
          } else if (docType === "travel_declaration") {
            memberUpdates.hasTravelDeclaration = false;
            memberUpdates.travelDeclarationUrl = FieldValue.delete();
            memberUpdates.travelDeclarationSignatureUrl = FieldValue.delete();
            memberUpdates.travelDeclarationHandedAt = FieldValue.delete();
          } else if (docType === "informed_consent") {
            memberUpdates.hasSignedDeclaration = false;
            memberUpdates.signedDeclarationUrl = FieldValue.delete();
            memberUpdates.signedDeclarationSignatureUrl = FieldValue.delete();
            memberUpdates.signedDeclarationHandedAt = FieldValue.delete();
          } else if (docType === "full_membership_pack") {
            memberUpdates.hasMembershipApplication = false;
            memberUpdates.membershipApplicationUrl = FieldValue.delete();
            memberUpdates.membershipApplicationSignatureUrl =
              FieldValue.delete();
            memberUpdates.membershipApplicationHandedAt = FieldValue.delete();
            memberUpdates.hasSignedDeclaration = false;
            memberUpdates.signedDeclarationUrl = FieldValue.delete();
            memberUpdates.signedDeclarationSignatureUrl = FieldValue.delete();
            memberUpdates.signedDeclarationHandedAt = FieldValue.delete();
            memberUpdates.hasSafetyInstruction = false;
            memberUpdates.safetyInstructionUrl = FieldValue.delete();
            memberUpdates.safetyInstructionSignatureUrl = FieldValue.delete();
            memberUpdates.safetyInstructionHandedAt = FieldValue.delete();
            memberUpdates.hasInternalRules = false;
            memberUpdates.internalRulesUrl = FieldValue.delete();
            memberUpdates.internalRulesSignatureUrl = FieldValue.delete();
            memberUpdates.internalRulesHandedAt = FieldValue.delete();
          }

          if (Object.keys(memberUpdates).length > 0) {
            await memberRef.update(memberUpdates);
          }
        }
      }
    }

    // 2. Delete the document request record from Firestore
    await docRef.delete();

    // 3. Log audit event
    await logAuditEvent({
      action: "delete_document_request",
      targetCollection: "document_requests",
      targetId: input.requestId,
      siteId: docData.siteId || "bkgalabovo",
      details: `Документът "${docData.documentTitle || docData.documentType}" за ${docData.memberName || "състезател"} беше изтрит от базата данни от ${user.email || user.uid}`,
      userId: user.uid,
      userEmail: user.email || undefined,
      metadata: {
        memberId: docData.memberId,
        memberName: docData.memberName,
        documentType: docData.documentType,
        status: docData.status,
      },
    });

    // 4. Revalidate cache
    revalidatePath("/documents");
    revalidatePath("/members");
    if (docData.memberId) {
      revalidatePath(`/members/${docData.memberId}`);
    }

    return {
      success: true,
      message: "Документът беше успешно изтрит от базата данни.",
    };
  } catch (err: unknown) {
    console.error("Error deleting document request:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Грешка при изтриване на записа от базата данни.",
    };
  }
}

/**
 * Admin action: Fetch all document requests for a member.
 */
export async function getMemberDocumentRequestsAction(input: {
  memberId: string;
  idToken: string;
}): Promise<ActionResult<DocumentRequest[]>> {
  try {
    await ensureAdmin(input.idToken);
    const adminDb = getAdminDb();

    const snap = await adminDb
      .collection("document_requests")
      .where("memberId", "==", input.memberId)
      .get();

    const requests: DocumentRequest[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
      } as DocumentRequest;
    });

    // In-memory sort by createdAt descending
    requests.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return {
      success: true,
      data: serializeFirestoreData(requests) as DocumentRequest[],
    };
  } catch (err: unknown) {
    console.error("Error fetching member document requests:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Грешка при зареждане на историята на заявките.",
    };
  }
}

/**
 * Admin action: Electronically sign a document request as the Club President.
 */
export async function signAsPresidentAction(input: {
  requestId: string;
  idToken: string;
  signatureBase64: string;
}): Promise<ActionResult<{ presidentSignedAt: string }>> {
  try {
    const adminUser = await ensureAdmin(input.idToken);
    const adminDb = getAdminDb();

    if (!input.requestId) {
      return { success: false, error: "Липсва ID на документа." };
    }

    if (
      !input.signatureBase64 ||
      !input.signatureBase64.startsWith("data:image/")
    ) {
      return {
        success: false,
        error: "Моля, положете валиден подпис на председател.",
      };
    }

    const docRef = adminDb.collection("document_requests").doc(input.requestId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return { success: false, error: "Документът не е намерен." };
    }

    const presidentSignedAt = new Date().toISOString();

    await docRef.update({
      presidentSignatureUrl: input.signatureBase64,
      presidentSignedAt,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await logAuditEvent({
      action: "sign_document_request",
      targetCollection: "document_requests",
      targetId: input.requestId,
      siteId: "bkgalabovo",
      details: `Председателят подписа електронно документ: ${docSnap.data()?.documentTitle || input.requestId}`,
      userId: adminUser.uid,
      userEmail: adminUser.email || undefined,
    });

    return {
      success: true,
      message: "Документът беше подписан успешно от Председателя!",
      data: { presidentSignedAt },
    };
  } catch (err: unknown) {
    console.error("President sign error:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Грешка при подписване като председател.",
    };
  }
}
