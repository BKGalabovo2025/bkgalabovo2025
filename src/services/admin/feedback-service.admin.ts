import { getAdminDb } from "@/lib/firebase-admin";
import { serverCache } from "@/lib/server-cache";
import { FeedbackCampaign, FeedbackSubmission } from "@/types/feedback.types";

const CAMPAIGNS_COLLECTION = "feedback_campaigns";
const SUBMISSIONS_COLLECTION = "feedback_submissions";

function serializeDoc<T>(val: T): T {
  if (val === null || val === undefined) return val;
  if (
    typeof val === "object" &&
    "toDate" in (val as Record<string, unknown>) &&
    typeof (val as { toDate?: unknown }).toDate === "function"
  ) {
    return (val as unknown as { toDate: () => Date })
      .toDate()
      .toISOString() as unknown as T;
  }
  if (Array.isArray(val)) {
    return val.map(serializeDoc) as unknown as T;
  }
  if (typeof val === "object") {
    return Object.fromEntries(
      Object.entries(val as Record<string, unknown>).map(([k, v]) => [
        k,
        serializeDoc(v),
      ])
    ) as T;
  }
  return val;
}

const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);

export async function getPublicReviewsAdmin(
  siteId: string
): Promise<FeedbackSubmission[]> {
  return serverCache.get(
    `feedback:public-reviews:${siteId}`,
    async () => {
      return withTimeout(
        (async () => {
          try {
            const db = getAdminDb();
            const snapshot = await db
              .collection(SUBMISSIONS_COLLECTION)
              .where("siteId", "==", siteId)
              .where("status", "==", "approved")
              .where("showInPublic", "==", true)
              .get();

            const results = snapshot.docs.map((d) =>
              serializeDoc({ id: d.id, ...d.data() } as FeedbackSubmission)
            );

            return results.sort(
              (a, b) =>
                new Date(b.createdAt || 0).getTime() -
                new Date(a.createdAt || 0).getTime()
            );
          } catch (error) {
            console.error("getPublicReviewsAdmin error:", error);
            return [];
          }
        })(),
        3500,
        []
      );
    },
    120_000
  );
}

export async function getActiveStandingCampaignsAdmin(
  siteId: string
): Promise<FeedbackCampaign[]> {
  return serverCache.get(
    `feedback:standing-campaigns:${siteId}`,
    async () => {
      return withTimeout(
        (async () => {
          try {
            const db = getAdminDb();
            const snapshot = await db
              .collection(CAMPAIGNS_COLLECTION)
              .where("siteId", "==", siteId)
              .get();

            const list = snapshot.docs
              .map((d) =>
                serializeDoc({ id: d.id, ...d.data() } as FeedbackCampaign)
              )
              .sort(
                (a, b) =>
                  new Date(b.createdAt || 0).getTime() -
                  new Date(a.createdAt || 0).getTime()
              );

            return list.filter(
              (c) =>
                c.status === "active" &&
                (c.isStanding || c.eventType === "general" || !c.eventId)
            );
          } catch (error) {
            console.error("getActiveStandingCampaignsAdmin error:", error);
            return [];
          }
        })(),
        3500,
        []
      );
    },
    120_000
  );
}

export async function getCampaignByIdAdmin(
  campaignId: string
): Promise<FeedbackCampaign | null> {
  if (!campaignId) return null;
  return serverCache.get(
    `feedback:campaign:${campaignId}`,
    async () => {
      return withTimeout(
        (async () => {
          try {
            const db = getAdminDb();
            const docSnap = await db
              .collection(CAMPAIGNS_COLLECTION)
              .doc(campaignId)
              .get();
            if (!docSnap.exists) return null;
            return serializeDoc({
              id: docSnap.id,
              ...docSnap.data(),
            } as FeedbackCampaign);
          } catch (error) {
            console.error("getCampaignByIdAdmin error:", error);
            return null;
          }
        })(),
        3500,
        null
      );
    },
    60_000
  );
}
