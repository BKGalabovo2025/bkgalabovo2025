"use server";
import "server-only";

import { revalidatePath } from "next/cache";

import { logAuditEvent } from "@/lib/audit-logger";
import { ensureAdmin } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { DocumentRequest } from "@/types/document-request.types";
import type {
  ActionResult,
  CreateDocumentTemplateInput,
  DocumentTemplate,
  UpdateDocumentTemplateInput,
} from "@/types/document-template.types";
import {
  CreateDocumentTemplateInputSchema,
  DEFAULT_OFFICIAL_TEMPLATES,
  UpdateDocumentTemplateInputSchema,
} from "@/types/document-template.types";

/**
 * Gets all document templates for the site.
 * Automatically seeds the 7 official templates if collection is empty.
 */
export async function getDocumentTemplatesAction(
  siteId?: string
): Promise<ActionResult<DocumentTemplate[]>> {
  const now = new Date().toISOString();
  try {
    const adminDb = getAdminDb();
    let queryRef: FirebaseFirestore.Query =
      adminDb.collection("document_templates");
    if (siteId) {
      queryRef = queryRef.where("siteId", "==", siteId);
    }
    const snap = await queryRef.get();

    if (snap.empty) {
      const effectiveSiteId = siteId || "bkgalabovo";
      try {
        const batch = adminDb.batch();
        for (const tpl of DEFAULT_OFFICIAL_TEMPLATES) {
          const ref = adminDb.collection("document_templates").doc(tpl.id);
          const record = {
            ...tpl,
            siteId: effectiveSiteId,
            createdAt: now,
            updatedAt: now,
          };
          batch.set(ref, record);
        }
        await batch.commit();
      } catch (seedErr) {
        console.warn(
          "Could not batch seed document templates to Firestore:",
          seedErr
        );
      }

      const defaultsWithDates = DEFAULT_OFFICIAL_TEMPLATES.map((tpl) => ({
        ...tpl,
        createdAt: now,
        updatedAt: now,
      })) as DocumentTemplate[];

      return {
        success: true,
        data: defaultsWithDates,
      };
    }

    const rawTemplates = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Add any newly introduced official templates that are not yet stored.
    // Existing (possibly edited) templates are never overwritten.
    const existingIds = new Set(rawTemplates.map((t) => t.id));
    const missingDefaults = DEFAULT_OFFICIAL_TEMPLATES.filter(
      (tpl) => !existingIds.has(tpl.id)
    );
    if (missingDefaults.length > 0) {
      const effectiveSiteId = siteId || "bkgalabovo";
      for (const tpl of missingDefaults) {
        const record = {
          ...tpl,
          siteId: effectiveSiteId,
          createdAt: now,
          updatedAt: now,
        };
        try {
          await adminDb
            .collection("document_templates")
            .doc(tpl.id)
            .create(record);
        } catch (seedErr) {
          console.warn(`Could not seed template ${tpl.id}:`, seedErr);
        }
        rawTemplates.push({ ...record });
      }
    }

    const templates = serializeFirestoreData(
      rawTemplates
    ) as DocumentTemplate[];

    // Dynamically enrich internalRules and membershipApplication templates with live fees from clubServices
    try {
      const servicesSnap = await adminDb.collection("clubServices").get();
      if (!servicesSnap.empty) {
        const rawServices = servicesSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: typeof data.name === "string" ? data.name : "",
            price: typeof data.price === "number" ? data.price : 0,
            currency: typeof data.currency === "string" ? data.currency : "EUR",
            type: typeof data.type === "string" ? data.type : "Абонамент",
            targetGroups: Array.isArray(data.targetGroups)
              ? (data.targetGroups as string[])
              : [],
          };
        });
        const { filterTrainingServicesForDocuments } =
          await import("@/lib/services-fees");
        const liveFees = filterTrainingServicesForDocuments(rawServices);

        if (liveFees.length > 0) {
          const feeCheckboxes = liveFees.map((f) => ({
            id: f.id,
            label: f.label,
            checkedByDefault: false,
          }));

          for (const tpl of templates) {
            if (tpl.id === "internalRules") {
              tpl.checkboxes = feeCheckboxes;
              const feeTextLines = liveFees
                .map((f) => `☐ ${f.name} ( ${f.price} ${f.currency} )`)
                .join("\n");
              tpl.content = tpl.content.replace(
                /6\.\s*Членствата са както следва:[\s\S]*?(?=7\.\s*Отстъпки)/i,
                `6. Членствата са както следва:\n${feeTextLines}\n`
              );
            } else if (tpl.id === "membershipApplication") {
              tpl.checkboxes = liveFees.map((f, i) => ({
                id: f.id,
                label: f.radioLabel,
                checkedByDefault: i === 0,
              }));
              const planLines = liveFees
                .map((f) => `[ ] ${f.name} (${f.price} ${f.currency})`)
                .join("\n");
              tpl.content = tpl.content.replace(
                /Избирам\/е следната форма на участие:[\s\S]*?(?=С подаването на настоящата молба)/i,
                `Избирам/е следната форма на участие:\n${planLines}\n\n`
              );
            }
          }
        }
      }
    } catch (enrichErr) {
      console.warn("Could not enrich templates with live fees:", enrichErr);
    }

    // Ensure onboardingPack is purged from templates and database
    try {
      await adminDb
        .collection("document_templates")
        .doc("onboardingPack")
        .delete();
    } catch {
      // ignore
    }
    const cleanTemplates = templates.filter((t) => t.id !== "onboardingPack");

    // Sort: by title
    cleanTemplates.sort((a, b) => a.title.localeCompare(b.title, "bg"));

    return {
      success: true,
      data: cleanTemplates,
    };
  } catch (error) {
    console.error(
      "Error in getDocumentTemplatesAction, using fallback defaults:",
      error
    );
    return {
      success: true,
      data: DEFAULT_OFFICIAL_TEMPLATES.map((tpl) => ({
        ...tpl,
        createdAt: now,
        updatedAt: now,
      })) as DocumentTemplate[],
    };
  }
}

/**
 * Creates a new custom document template (Admin only).
 */
export async function createDocumentTemplateAction(
  input: CreateDocumentTemplateInput,
  idToken: string
): Promise<ActionResult<DocumentTemplate>> {
  try {
    const user = await ensureAdmin(idToken);
    const parsed = CreateDocumentTemplateInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Невалидни данни.",
      };
    }

    const adminDb = getAdminDb();
    const now = new Date().toISOString();
    const slug =
      parsed.data.slug?.trim() ||
      `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const templateData: DocumentTemplate = {
      id: slug,
      slug,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || "",
      category: parsed.data.category || "custom",
      version: 1,
      content: parsed.data.content.trim(),
      headerType: parsed.data.headerType ?? "official_club",
      addressee: parsed.data.addressee ?? null,
      salutation: parsed.data.salutation ?? null,
      applicantLayout: parsed.data.applicantLayout ?? "none",
      checkboxes: parsed.data.checkboxes ?? [],
      signatures: parsed.data.signatures ?? {
        requireParent: true,
        requireSecondParent: false,
        requireMember: false,
        requirePresident: false,
        presidentName: "Мира Георгиева",
        presidentRole: "Председател",
      },
      closingLocation: parsed.data.closingLocation || "гр. Гълъбово",
      pageCount: parsed.data.pageCount ?? 1,
      fileUrl: parsed.data.fileUrl || null,
      fileName: parsed.data.fileName || null,
      fileType: parsed.data.fileType || null,
      fileSize: parsed.data.fileSize || null,
      isRequiredForMember: parsed.data.isRequiredForMember ?? true,
      isActive: parsed.data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      updatedBy: {
        uid: user.uid,
        email: user.email || undefined,
      },
    };

    const docRef = adminDb.collection("document_templates").doc(slug);
    await docRef.set({
      ...templateData,
      siteId: "bkgalabovo",
    });

    await logAuditEvent({
      userId: user.uid,
      userEmail: user.email,
      action: "create_document_template",
      targetCollection: "document_templates",
      details: `Създаден нов образец на документ: ${templateData.title} (v1)`,
    });

    revalidatePath("/documents");
    revalidatePath("/members");

    return {
      success: true,
      message: "Образецът на документ е създаден успешно.",
      data: templateData,
    };
  } catch (error) {
    console.error("Error in createDocumentTemplateAction:", error);
    return {
      success: false,
      error: "Грешка при създаване на образец на документ.",
    };
  }
}

/**
 * Updates an existing document template and increments its version!
 * Historical signed documents retain their snapshot and are not modified.
 */
export async function updateDocumentTemplateAction(
  id: string,
  input: UpdateDocumentTemplateInput,
  idToken: string
): Promise<ActionResult<DocumentTemplate>> {
  try {
    const user = await ensureAdmin(idToken);
    const parsed = UpdateDocumentTemplateInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Невалидни данни.",
      };
    }

    const adminDb = getAdminDb();
    const docRef = adminDb.collection("document_templates").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return { success: false, error: "Образецът не е намерен." };
    }

    const prevData = snap.data() || {};
    const prevVersion =
      typeof prevData.version === "number" ? prevData.version : 1;
    // Automatically increment version upon update
    const newVersion = prevVersion + 1;
    const now = new Date().toISOString();

    const updatedData = {
      ...prevData,
      ...parsed.data,
      id,
      version: newVersion,
      updatedAt: now,
      updatedBy: {
        uid: user.uid,
        email: user.email || undefined,
      },
    };

    await docRef.update(updatedData);

    await logAuditEvent({
      userId: user.uid,
      userEmail: user.email,
      action: "update_document_template",
      targetCollection: "document_templates",
      details: `Обновен образец на документ: ${updatedData.title} (версия ${newVersion})`,
    });

    revalidatePath("/documents");
    revalidatePath("/members");

    return {
      success: true,
      message: `Образецът е обновен успешно. Нова версия: v${newVersion}.`,
      data: updatedData as DocumentTemplate,
    };
  } catch (error) {
    console.error("Error in updateDocumentTemplateAction:", error);
    return {
      success: false,
      error: "Грешка при обновяване на образеца.",
    };
  }
}

/**
 * Toggles whether a document template is active.
 */
export async function toggleDocumentTemplateActiveAction(
  id: string,
  isActive: boolean,
  idToken: string
): Promise<ActionResult> {
  try {
    const user = await ensureAdmin(idToken);
    const adminDb = getAdminDb();
    const docRef = adminDb.collection("document_templates").doc(id);

    await docRef.update({
      isActive,
      updatedAt: new Date().toISOString(),
      updatedBy: {
        uid: user.uid,
        email: user.email || undefined,
      },
    });

    await logAuditEvent({
      userId: user.uid,
      userEmail: user.email,
      action: "update_document_template",
      targetCollection: "document_templates",
      details: `Статусът на образец ${id} е променен на ${isActive ? "активен" : "неактивен"}`,
    });

    revalidatePath("/documents");
    revalidatePath("/members");

    return {
      success: true,
      message: `Образецът е ${isActive ? "активиран" : "деактивиран"}.`,
    };
  } catch (error) {
    console.error("Error in toggleDocumentTemplateActiveAction:", error);
    return { success: false, error: "Грешка при промяна на статуса." };
  }
}

/**
 * Deletes a custom document template.
 * Default official templates are protected from accidental deletion.
 */
export async function deleteDocumentTemplateAction(
  id: string,
  idToken: string
): Promise<ActionResult> {
  try {
    const user = await ensureAdmin(idToken);
    const isProtected = DEFAULT_OFFICIAL_TEMPLATES.some((t) => t.id === id);
    if (isProtected) {
      return {
        success: false,
        error:
          "Официалните задължителни бланки на клуба не могат да бъдат изтрити. Можете да редактирате съдържанието им или да ги деактивирате.",
      };
    }

    const adminDb = getAdminDb();
    await adminDb.collection("document_templates").doc(id).delete();

    await logAuditEvent({
      userId: user.uid,
      userEmail: user.email,
      action: "delete_document_template",
      targetCollection: "document_templates",
      details: `Изтрит образец на документ ID: ${id}`,
    });

    revalidatePath("/documents");
    revalidatePath("/members");

    return {
      success: true,
      message: "Образецът е изтрит успешно.",
    };
  } catch (error) {
    console.error("Error in deleteDocumentTemplateAction:", error);
    return { success: false, error: "Грешка при изтриване на образеца." };
  }
}

/**
 * Fetches all signed and requested documents across the club for the central audit register.
 */
export async function getAllClubDocumentRequestsAction(
  idToken: string,
  siteId: string = "bkgalabovo"
): Promise<ActionResult<DocumentRequest[]>> {
  try {
    await ensureAdmin(idToken);
    const adminDb = getAdminDb();

    // Query by siteId without composite orderBy to avoid Firestore missing-index errors
    let rawRequests: Array<{
      id: string;
      createdAt?: string;
      [key: string]: unknown;
    }> = [];
    try {
      const snap = await adminDb
        .collection("document_requests")
        .where("siteId", "==", siteId)
        .get();

      rawRequests = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
    } catch (queryErr) {
      console.warn(
        "Filtered query on document_requests failed, falling back to all:",
        queryErr
      );
      const fallbackSnap = await adminDb
        .collection("document_requests")
        .limit(200)
        .get();
      rawRequests = fallbackSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
    }

    // Sort in memory by createdAt descending
    rawRequests.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return {
      success: true,
      data: serializeFirestoreData(rawRequests) as DocumentRequest[],
    };
  } catch (error) {
    console.error("Error in getAllClubDocumentRequestsAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на регистъра с подписани документи.",
      data: [],
    };
  }
}
