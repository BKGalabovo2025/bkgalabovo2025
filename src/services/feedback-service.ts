import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  FeedbackCampaign,
  FeedbackStats,
  FeedbackSubmission,
  FeedbackSubmissionStatus,
  FeedbackSurveyTemplate,
} from "@/types/feedback.types";

const TEMPLATES_COLLECTION = "feedback_templates";
const CAMPAIGNS_COLLECTION = "feedback_campaigns";
const SUBMISSIONS_COLLECTION = "feedback_submissions";

export const DEFAULT_FEEDBACK_TEMPLATES: Omit<
  FeedbackSurveyTemplate,
  "id" | "siteId" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Лагер - Пълна обратна връзка от родители и състезатели",
    description:
      "Цялостна оценка на лагера: тренировки, организация, база, храна, атмосфера и впечатления.",
    eventType: "camp",
    isDefault: true,
    questions: [
      {
        id: "q_org",
        type: "rating",
        label: "Организация и комуникация преди и по време на лагера",
        description: "Информация, график, пътуване, координация",
        required: true,
        category: "organization",
      },
      {
        id: "q_training",
        type: "rating",
        label: "Качество и интензитет на тренировките",
        description: "Треньорски подход, разнообразни упражнения, мотивация",
        required: true,
        category: "coaching",
      },
      {
        id: "q_hotel_food",
        type: "rating",
        label: "Условия на настаняване и храна",
        description: "Хотелска база, удобство и хранене",
        required: true,
        category: "facilities",
      },
      {
        id: "q_atmosphere",
        type: "rating",
        label: "Атмосфера, екипен дух и грижа за децата",
        description: "Внимание към всяко дете, приятелска среда",
        required: true,
        category: "atmosphere",
      },
      {
        id: "q_future",
        type: "select",
        label: "Бихте ли записали детето си отново на бъдещ лагер на клуба?",
        required: true,
        options: [
          "Категорично да!",
          "По-скоро да",
          "Зависи от периода и мястото",
        ],
        category: "general",
      },
      {
        id: "q_liked",
        type: "text",
        label: "Какво най-много хареса на детето (или на Вас) от лагера?",
        description: "Любими моменти, игри, тренировки или преживявания",
        required: false,
        category: "general",
      },
      {
        id: "q_improvements",
        type: "text",
        label: "Имате ли препоръки или забележки за следващия лагер?",
        required: false,
        category: "general",
      },
    ],
  },
  {
    name: "Състезания и Турнири - Обратна връзка",
    description:
      "Оценка на подготовката, представянето, воденето на мачовете и мотивацията.",
    eventType: "competition",
    isDefault: true,
    questions: [
      {
        id: "q_comp_org",
        type: "rating",
        label: "Организация и водене на отбора по време на състезанието",
        required: true,
        category: "organization",
      },
      {
        id: "q_coach_guidance",
        type: "rating",
        label: "Треньорски наставления и психологическа подкрепа",
        required: true,
        category: "coaching",
      },
      {
        id: "q_motivation",
        type: "select",
        label: "Как се чувства състезателят след състезанието?",
        required: true,
        options: [
          "Много мотивиран и зареден за победа!",
          "Доволен от представянето си",
          "Амбициран да работи над слабостите си",
        ],
        category: "atmosphere",
      },
      {
        id: "q_comp_notes",
        type: "text",
        label: "Вашите коментари или препоръки относно състезанието:",
        required: false,
        category: "general",
      },
    ],
  },
  {
    name: "Целогодишен тренировъчен процес",
    description:
      "Оценка на тренировките в залата, индивидуалния напредък и отношението на треньорите.",
    eventType: "training",
    isDefault: true,
    questions: [
      {
        id: "q_progress",
        type: "rating",
        label: "Напредък и спортно развитие на състезателя",
        required: true,
        category: "coaching",
      },
      {
        id: "q_comm",
        type: "rating",
        label: "Комуникация с треньорите и ръководството на клуба",
        required: true,
        category: "organization",
      },
      {
        id: "q_discipline",
        type: "rating",
        label: "Дисциплина, мотивация и позитивна атмосфера в групата",
        required: true,
        category: "atmosphere",
      },
      {
        id: "q_training_feedback",
        type: "text",
        label: "Какво бихте искали да добавим или подобрим в тренировките?",
        required: false,
        category: "general",
      },
    ],
  },
  {
    name: "Общ отзив за Бадминтон клуб Гълъбово",
    description:
      "Обща обратна връзка за дейността на клуба, треньорите и условията.",
    eventType: "general",
    isDefault: true,
    questions: [
      {
        id: "q_overall_club",
        type: "rating",
        label: "Цялостно удовлетворение от дейността на клуба",
        required: true,
        category: "general",
      },
      {
        id: "q_recommend",
        type: "boolean",
        label: "Препоръчвате ли Бадминтон клуб Гълъбово на Ваши приятели?",
        required: true,
        category: "general",
      },
      {
        id: "q_general_feedback",
        type: "text",
        label: "Вашето мнение или съобщение към екипа на клуба:",
        required: false,
        category: "general",
      },
    ],
  },
];

function cleanPayload<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

export const feedbackService = {
  // ================= TEMPLATES =================
  async getTemplates(siteId: string): Promise<FeedbackSurveyTemplate[]> {
    const q = query(
      collection(db, TEMPLATES_COLLECTION),
      where("siteId", "==", siteId)
    );
    const snapshot = await getDocs(q);

    // If empty, auto-seed defaults
    if (snapshot.empty) {
      await this.seedDefaultTemplates(siteId);
      const seededSnap = await getDocs(q);
      const list = seededSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as FeedbackSurveyTemplate
      );
      return list.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }

    const list = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as FeedbackSurveyTemplate
    );
    return list.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
  },

  async seedDefaultTemplates(siteId: string): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    DEFAULT_FEEDBACK_TEMPLATES.forEach((tmpl) => {
      const docRef = doc(collection(db, TEMPLATES_COLLECTION));
      batch.set(docRef, {
        ...tmpl,
        siteId,
        createdAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();
  },

  async saveTemplate(
    siteId: string,
    data: Omit<
      FeedbackSurveyTemplate,
      "id" | "siteId" | "createdAt" | "updatedAt"
    >,
    templateId?: string
  ): Promise<string> {
    const now = new Date().toISOString();
    if (templateId) {
      const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
      await updateDoc(
        docRef,
        cleanPayload({
          ...data,
          updatedAt: now,
        })
      );
      return templateId;
    }

    const docRef = doc(collection(db, TEMPLATES_COLLECTION));
    await setDoc(
      docRef,
      cleanPayload({
        ...data,
        siteId,
        createdAt: now,
        updatedAt: now,
      })
    );
    return docRef.id;
  },

  async deleteTemplate(templateId: string): Promise<void> {
    await deleteDoc(doc(db, TEMPLATES_COLLECTION, templateId));
  },

  // ================= CAMPAIGNS (SURVEY LINKS FOR EVENTS) =================
  async getCampaigns(siteId: string): Promise<FeedbackCampaign[]> {
    const q = query(
      collection(db, CAMPAIGNS_COLLECTION),
      where("siteId", "==", siteId)
    );
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as FeedbackCampaign
    );
    return list.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
  },

  async getCampaignById(campaignId: string): Promise<FeedbackCampaign | null> {
    const docRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as FeedbackCampaign;
  },

  async createCampaign(
    siteId: string,
    data: Omit<
      FeedbackCampaign,
      | "id"
      | "siteId"
      | "responseCount"
      | "averageRating"
      | "createdAt"
      | "updatedAt"
    >
  ): Promise<string> {
    const docRef = doc(collection(db, CAMPAIGNS_COLLECTION));
    const now = new Date().toISOString();

    const campaign: Omit<FeedbackCampaign, "id"> = {
      ...data,
      siteId,
      status: data.status || "active",
      responseCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, cleanPayload(campaign));
    return docRef.id;
  },

  async updateCampaign(
    campaignId: string,
    data: Partial<FeedbackCampaign>
  ): Promise<void> {
    const docRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
    await updateDoc(
      docRef,
      cleanPayload({
        ...data,
        updatedAt: new Date().toISOString(),
      })
    );
  },

  async deleteCampaign(campaignId: string): Promise<void> {
    await deleteDoc(doc(db, CAMPAIGNS_COLLECTION, campaignId));
  },

  // ================= SUBMISSIONS (REVIEWS & MODERATION) =================
  async submitFeedback(
    campaignId: string,
    data: Omit<
      FeedbackSubmission,
      | "id"
      | "campaignId"
      | "status"
      | "showInPublic"
      | "createdAt"
      | "updatedAt"
    >
  ): Promise<string> {
    // 1. Load campaign to get siteId, event info and questions
    const campaign = await this.getCampaignById(campaignId);
    if (!campaign) {
      throw new Error("Анкетата не е намерена или е невалидна.");
    }

    const docRef = doc(collection(db, SUBMISSIONS_COLLECTION));
    const now = new Date().toISOString();

    const questionBreakdown = (campaign.questions || [])
      .map((q) => ({
        questionId: q.id,
        label: q.label,
        type: q.type,
        answer: data.answers[q.id],
      }))
      .filter((item) => item.answer !== undefined && item.answer !== "");

    const submission: Omit<FeedbackSubmission, "id"> = {
      ...data,
      campaignId,
      campaignTitle: campaign.title,
      eventType: campaign.eventType,
      eventId: campaign.eventId,
      eventTitle: campaign.eventTitle,
      siteId: campaign.siteId,
      questionBreakdown,
      status: "pending", // Waiting for admin moderation
      showInPublic: false,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, cleanPayload(submission));

    // 2. Update campaign statistics
    try {
      const allSubs = await this.getSubmissions(campaign.siteId, {
        campaignId,
      });
      const totalRatings = allSubs.reduce(
        (sum, s) => sum + (s.overallRating || 0),
        data.overallRating || 5
      );
      const newCount = allSubs.length + 1;
      const newAvg = Number((totalRatings / newCount).toFixed(1));

      await this.updateCampaign(campaignId, {
        responseCount: newCount,
        averageRating: newAvg,
      });
    } catch (e) {
      console.warn("Failed to update campaign stats", e);
    }

    return docRef.id;
  },

  async getSubmissions(
    siteId: string,
    filters?: {
      campaignId?: string;
      status?: FeedbackSubmissionStatus;
      eventType?: string;
    }
  ): Promise<FeedbackSubmission[]> {
    let q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where("siteId", "==", siteId)
    );

    if (filters?.campaignId) {
      q = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where("siteId", "==", siteId),
        where("campaignId", "==", filters.campaignId)
      );
    }

    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as FeedbackSubmission
    );

    if (filters?.status) {
      results = results.filter((r) => r.status === filters.status);
    }
    if (filters?.eventType && filters.eventType !== "all") {
      results = results.filter((r) => r.eventType === filters.eventType);
    }

    return results.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
  },

  async updateSubmissionStatus(
    submissionId: string,
    status: FeedbackSubmissionStatus,
    showInPublic: boolean,
    adminNotes?: string,
    highlightQuote?: string
  ): Promise<void> {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    const now = new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      status,
      showInPublic,
      updatedAt: now,
      reviewedAt: now,
    };

    if (adminNotes !== undefined) updatePayload.adminNotes = adminNotes;
    if (highlightQuote !== undefined)
      updatePayload.highlightQuote = highlightQuote;

    await updateDoc(docRef, cleanPayload(updatePayload));
  },

  async deleteSubmission(submissionId: string): Promise<void> {
    await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, submissionId));
  },

  // ================= PUBLIC REVIEWS SHOWCASE =================
  async getPublicReviews(
    siteId: string,
    eventType?: string
  ): Promise<FeedbackSubmission[]> {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where("siteId", "==", siteId),
      where("status", "==", "approved"),
      where("showInPublic", "==", true)
    );

    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as FeedbackSubmission
    );

    if (eventType && eventType !== "all") {
      results = results.filter((r) => r.eventType === eventType);
    }

    return results.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
  },

  // ================= STATS FOR ADMIN DASHBOARD =================
  async getFeedbackStats(siteId: string): Promise<FeedbackStats> {
    const [submissions, campaigns] = await Promise.all([
      this.getSubmissions(siteId),
      this.getCampaigns(siteId),
    ]);

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

    return {
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      averageRating,
      totalCampaigns: campaigns.length,
    };
  },
};
