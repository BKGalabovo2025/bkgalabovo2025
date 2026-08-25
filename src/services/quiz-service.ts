import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/lib/firebase";
import { DEFAULT_QUIZZES } from "@/lib/quizzes-data";
import type {
  Quiz,
  QuizAnswerSubmission,
  QuizFormData,
  TheoryResult,
} from "@/types/quiz.types";

const QUIZZES_COLLECTION = "quizzes";
const THEORY_RESULTS_COLLECTION = "theory_results";

export const quizService = {
  // ═══════════════════════════════════════════════════════
  //  QUIZ CRUD
  // ═══════════════════════════════════════════════════════

  async getQuizzes(siteId: string): Promise<Quiz[]> {
    const q = query(
      collection(db, QUIZZES_COLLECTION),
      where("siteId", "==", siteId),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Quiz);
  },

  async createQuiz(
    siteId: string,
    data: QuizFormData,
    createdById?: string
  ): Promise<string> {
    const newRef = doc(collection(db, QUIZZES_COLLECTION));
    const quiz: Omit<Quiz, "id"> = {
      ...data,
      siteId,
      createdById: createdById ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(newRef, quiz);
    return newRef.id;
  },

  async updateQuiz(id: string, data: Partial<QuizFormData>): Promise<void> {
    await updateDoc(doc(db, QUIZZES_COLLECTION, id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteQuiz(id: string): Promise<void> {
    await deleteDoc(doc(db, QUIZZES_COLLECTION, id));
  },

  async resetQuizToDefault(id: string, baseTemplateId: string): Promise<void> {
    const template = DEFAULT_QUIZZES.find((q) => q.id === baseTemplateId);
    if (!template) throw new Error("Base template not found");
    await updateDoc(doc(db, QUIZZES_COLLECTION, id), {
      title: template.title,
      description: template.description,
      questions: template.questions,
      updatedAt: new Date().toISOString(),
    });
  },

  // Seed базовите 10 теста ако още не съществуват
  async seedBaseQuizzes(siteId: string): Promise<void> {
    const existing = await this.getQuizzes(siteId);
    const existingBaseIds = existing
      .filter((q) => q.isBaseTemplate)
      .map((q) => q.baseTemplateId);

    for (const template of DEFAULT_QUIZZES) {
      if (!existingBaseIds.includes(template.id)) {
        const newRef = doc(collection(db, QUIZZES_COLLECTION));
        const quiz: Omit<Quiz, "id"> = {
          siteId,
          title: template.title,
          description: template.description,
          questions: template.questions,
          isCustom: false,
          isBaseTemplate: true,
          baseTemplateId: template.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(newRef, quiz);
      }
    }
  },

  // ═══════════════════════════════════════════════════════
  //  THEORY RESULTS — SUBMIT (детето предава теста)
  // ═══════════════════════════════════════════════════════

  async submitResult(
    submission: QuizAnswerSubmission & {
      playerId: string;
      playerName: string;
      quizId: string;
      quizTitle: string;
      siteId: string;
      autoScore: number;
      tacticalAnswer?: string;
    }
  ): Promise<string> {
    const shareToken = uuidv4();
    const newRef = doc(collection(db, THEORY_RESULTS_COLLECTION));
    const result: Omit<TheoryResult, "id"> = {
      playerId: submission.playerId,
      playerName: submission.playerName,
      quizId: submission.quizId,
      quizTitle: submission.quizTitle,
      siteId: submission.siteId,
      autoScore: submission.autoScore,
      tacticalAnswer: submission.tacticalAnswer || "",
      manualScore: 0,
      totalScore: submission.autoScore,
      status: "SENT",
      shareToken,
      submittedAt: new Date().toISOString(),
    };
    await setDoc(newRef, result);
    return shareToken;
  },

  // Детето предава отговорите — записва autoScore и тактически текст
  async submitTacticalAnswer(
    resultId: string,
    autoScore: number,
    tacticalAnswer: string,
    answers: Record<string, number | string>
  ): Promise<void> {
    await updateDoc(doc(db, THEORY_RESULTS_COLLECTION, resultId), {
      autoScore,
      totalScore: autoScore,
      tacticalAnswer,
      answers,
      status: "PENDING",
      submittedAt: new Date().toISOString(),
    });
  },

  async getResultByToken(
    token: string,
    siteId?: string
  ): Promise<TheoryResult | null> {
    const q = query(
      collection(db, THEORY_RESULTS_COLLECTION),
      where("shareToken", "==", token),
      ...(siteId ? [where("siteId", "==", siteId)] : [])
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as TheoryResult;
  },

  async getResultsByMember(playerId: string): Promise<TheoryResult[]> {
    const q = query(
      collection(db, THEORY_RESULTS_COLLECTION),
      where("playerId", "==", playerId),
      orderBy("submittedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as TheoryResult
    );
  },

  async getPendingResults(siteId: string): Promise<TheoryResult[]> {
    const q = query(
      collection(db, THEORY_RESULTS_COLLECTION),
      where("siteId", "==", siteId),
      where("status", "==", "PENDING"),
      orderBy("submittedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as TheoryResult
    );
  },

  async getSentResults(siteId: string): Promise<TheoryResult[]> {
    const q = query(
      collection(db, THEORY_RESULTS_COLLECTION),
      where("siteId", "==", siteId),
      where("status", "==", "SENT"),
      orderBy("submittedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as TheoryResult
    );
  },

  async getReviewedResults(siteId: string): Promise<TheoryResult[]> {
    const q = query(
      collection(db, THEORY_RESULTS_COLLECTION),
      where("siteId", "==", siteId),
      where("status", "==", "REVIEWED"),
      orderBy("reviewedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as TheoryResult
    );
  },

  async deleteResult(resultId: string): Promise<void> {
    await deleteDoc(doc(db, THEORY_RESULTS_COLLECTION, resultId));
  },

  // Треньорът одобрява и дава оценка
  async reviewResult(
    resultId: string,
    manualScore: number,
    autoScore: number,
    coachFeedback: string,
    aiExplanations?: Record<string, string>
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      manualScore,
      totalScore: autoScore + manualScore,
      coachFeedback,
      status: "REVIEWED",
      reviewedAt: new Date().toISOString(),
    };
    if (aiExplanations !== undefined) {
      updateData.aiExplanations = aiExplanations;
    }
    await updateDoc(doc(db, THEORY_RESULTS_COLLECTION, resultId), updateData);
  },

  // Генериране на Viber линк
  generateViberLink(
    playerName: string,
    quizTitle: string,
    quizUrl: string
  ): string {
    const message = `Здравей ${playerName}! 🏸 Твоят треньор те кани да попълниш тест: "${quizTitle}". Натисни линка по-долу:`;
    return `viber://send?text=${encodeURIComponent(message + "\n" + quizUrl)}`;
  },
};
