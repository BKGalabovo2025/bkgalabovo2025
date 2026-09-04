"use server";
import "server-only";

import * as admin from "firebase-admin";

import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  DEFAULT_FEEDBACK_TEMPLATES,
  DEFAULT_RECOVERY_FEEDBACK_TEMPLATES,
} from "@/services/feedback-service";
import {
  FeedbackCampaign,
  FeedbackStats,
  FeedbackSubmission,
  FeedbackSubmissionStatus,
  FeedbackSurveyTemplate,
} from "@/types/feedback.types";

const CAMPAIGNS_COLLECTION = "feedback_campaigns";
const TEMPLATES_COLLECTION = "feedback_templates";
const SUBMISSIONS_COLLECTION = "feedback_submissions";

function snapToDoc<T>(doc: admin.firestore.QueryDocumentSnapshot): T {
  const data = doc.data();
  const convertTimestamps = (val: unknown): unknown => {
    if (!val) return val;
    if (typeof (val as { toDate?: () => Date }).toDate === "function") {
      return (val as { toDate: () => Date }).toDate().toISOString();
    }
    if (Array.isArray(val)) {
      return val.map(convertTimestamps);
    }
    if (typeof val === "object") {
      const copy: Record<string, unknown> = {};
      for (const key of Object.keys(val as Record<string, unknown>)) {
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

export async function getFeedbackAdminDataAction(siteId: string): Promise<{
  success: boolean;
  data?: {
    submissions: FeedbackSubmission[];
    campaigns: FeedbackCampaign[];
    templates: FeedbackSurveyTemplate[];
    stats: FeedbackStats;
  };
  error?: string;
}> {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      return { success: false, error: "Нямате активна сесия." };
    }

    const adminDb = getAdminDb();

    // 1. Fetch campaigns
    const campSnap = await adminDb
      .collection(CAMPAIGNS_COLLECTION)
      .where("siteId", "==", siteId)
      .get();
    const campaigns = campSnap.docs
      .map((d) => snapToDoc<FeedbackCampaign>(d))
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

    // 2. Fetch templates (auto-seed if empty)
    let tmplSnap = await adminDb
      .collection(TEMPLATES_COLLECTION)
      .where("siteId", "==", siteId)
      .get();

    if (tmplSnap.empty) {
      const now = new Date().toISOString();
      const templatesToSeed =
        siteId === "recoveryzone"
          ? DEFAULT_RECOVERY_FEEDBACK_TEMPLATES
          : DEFAULT_FEEDBACK_TEMPLATES;

      const batch = adminDb.batch();
      templatesToSeed.forEach((tmpl) => {
        const ref = adminDb.collection(TEMPLATES_COLLECTION).doc();
        batch.set(ref, {
          ...tmpl,
          siteId,
          createdAt: now,
          updatedAt: now,
        });
      });
      await batch.commit();

      tmplSnap = await adminDb
        .collection(TEMPLATES_COLLECTION)
        .where("siteId", "==", siteId)
        .get();
    }

    const templates = tmplSnap.docs
      .map((d) => snapToDoc<FeedbackSurveyTemplate>(d))
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

    // 3. Fetch submissions
    const subSnap = await adminDb
      .collection(SUBMISSIONS_COLLECTION)
      .where("siteId", "==", siteId)
      .get();
    const submissions = subSnap.docs
      .map((d) => snapToDoc<FeedbackSubmission>(d))
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

    // 4. Calculate stats
    const totalSubmissions = submissions.length;
    const pendingSubmissions = submissions.filter(
      (s) => s.status === "pending"
    ).length;
    const approvedSubmissions = submissions.filter(
      (s) => s.status === "approved"
    ).length;
    const rejectedSubmissions = submissions.filter(
      (s) => s.status === "rejected"
    ).length;

    const ratedSubs = submissions.filter((s) => s.overallRating > 0);
    const averageRating =
      ratedSubs.length > 0
        ? Number(
            (
              ratedSubs.reduce((acc, s) => acc + s.overallRating, 0) /
              ratedSubs.length
            ).toFixed(1)
          )
        : 5.0;

    const stats: FeedbackStats = {
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      averageRating,
      totalCampaigns: campaigns.length,
    };

    return {
      success: true,
      data: {
        submissions,
        campaigns,
        templates,
        stats,
      },
    };
  } catch (error) {
    console.error("getFeedbackAdminDataAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на данните за отзиви.",
    };
  }
}

export async function updateCampaignStatusServerAction(
  campaignId: string,
  newStatus: "active" | "closed"
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      return { success: false, error: "Нямате активна сесия." };
    }

    const adminDb = getAdminDb();
    await adminDb.collection(CAMPAIGNS_COLLECTION).doc(campaignId).update({
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("updateCampaignStatusServerAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при обновяване.",
    };
  }
}

export async function updateSubmissionStatusServerAction(
  submissionId: string,
  status: FeedbackSubmissionStatus,
  showInPublic: boolean,
  adminNotes?: string,
  highlightQuote?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      return { success: false, error: "Нямате активна сесия." };
    }

    const adminDb = getAdminDb();
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      status,
      showInPublic,
      reviewedAt: now,
      updatedAt: now,
    };

    if (adminNotes !== undefined) payload.adminNotes = adminNotes;
    if (highlightQuote !== undefined) payload.highlightQuote = highlightQuote;

    await adminDb
      .collection(SUBMISSIONS_COLLECTION)
      .doc(submissionId)
      .update(payload);

    return { success: true };
  } catch (error) {
    console.error("updateSubmissionStatusServerAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при обновяване.",
    };
  }
}

export async function deleteSubmissionServerAction(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      return { success: false, error: "Нямате активна сесия." };
    }

    const adminDb = getAdminDb();
    await adminDb.collection(SUBMISSIONS_COLLECTION).doc(submissionId).delete();
    return { success: true };
  } catch (error) {
    console.error("deleteSubmissionServerAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при изтриване.",
    };
  }
}

export async function deleteCampaignServerAction(
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      return { success: false, error: "Нямате активна сесия." };
    }

    const adminDb = getAdminDb();
    await adminDb.collection(CAMPAIGNS_COLLECTION).doc(campaignId).delete();
    return { success: true };
  } catch (error) {
    console.error("deleteCampaignServerAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при изтриване.",
    };
  }
}
