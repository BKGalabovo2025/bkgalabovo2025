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
  writeBatch,
} from "firebase/firestore";

import { INITIAL_BWF_EXERCISES } from "@/lib/badminton-exercises";
import { db } from "@/lib/firebase";
import {
  AnnualPlan,
  Exercise,
  PlannerSession,
  SessionAttendance,
  TrainingTemplate,
} from "@/types/planner.types";

const EXERCISES_COLLECTION = "exercises";
const SESSIONS_COLLECTION = "planner_sessions";
const ATTENDANCE_COLLECTION = "training_attendance";
const FOCUS_TAGS_COLLECTION = "focus_tags";
const ANNUAL_PLANS_COLLECTION = "annual_plans";
const TRAINING_TEMPLATES_COLLECTION = "training_templates";

export const plannerService = {
  // ================= EXERCISES =================
  async getExercises(siteId: string): Promise<Exercise[]> {
    const q = query(
      collection(db, EXERCISES_COLLECTION),
      where("siteId", "==", siteId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Exercise
    );
  },

  async addExercise(
    siteId: string,
    data: Omit<Exercise, "id" | "siteId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const newDocRef = doc(collection(db, EXERCISES_COLLECTION));
    const exercise: Omit<Exercise, "id"> = {
      ...data,
      siteId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(newDocRef, exercise);
    return newDocRef.id;
  },

  async updateExercise(id: string, data: Partial<Exercise>): Promise<void> {
    const docRef = doc(db, EXERCISES_COLLECTION, id);
    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
  },

  async deleteExercise(id: string): Promise<void> {
    await deleteDoc(doc(db, EXERCISES_COLLECTION, id));
  },

  async injectSeedExercises(siteId: string): Promise<number> {
    // First, fetch existing to avoid duplicates
    const existing = await this.getExercises(siteId);
    const existingNames = new Set(existing.map((e) => e.name));

    const batch = writeBatch(db);
    let addedCount = 0;

    INITIAL_BWF_EXERCISES.forEach((ex) => {
      if (!existingNames.has(ex.name)) {
        const docRef = doc(collection(db, EXERCISES_COLLECTION));
        batch.set(docRef, {
          ...ex,
          siteId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      await batch.commit();
    }

    return addedCount;
  },

  // ================= SESSIONS =================
  async getSessions(siteId: string): Promise<PlannerSession[]> {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where("siteId", "==", siteId),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as PlannerSession
    );
  },

  async getSessionsByCampId(
    siteId: string,
    campId: string
  ): Promise<PlannerSession[]> {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where("siteId", "==", siteId),
      where("campId", "==", campId),
      orderBy("date", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as PlannerSession
    );
  },

  async addSession(
    siteId: string,
    data: Omit<PlannerSession, "id" | "siteId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const newDocRef = doc(collection(db, SESSIONS_COLLECTION));
    const session: Omit<PlannerSession, "id"> = {
      ...data,
      siteId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(newDocRef, session);
    return newDocRef.id;
  },

  async updateSession(
    id: string,
    data: Partial<PlannerSession>
  ): Promise<void> {
    const docRef = doc(db, SESSIONS_COLLECTION, id);
    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
  },

  async deleteSession(id: string): Promise<void> {
    const docRef = doc(db, SESSIONS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // ================= ATTENDANCE =================
  async saveAttendanceBatch(
    siteId: string,
    sessionId: string,
    attendanceData: Omit<
      SessionAttendance,
      "id" | "siteId" | "sessionId" | "createdAt" | "updatedAt"
    >[]
  ): Promise<void> {
    const batch = writeBatch(db);

    // In a real scenario, we might want to delete existing attendance for this session first, or merge.
    // For simplicity, we just add them.
    attendanceData.forEach((att) => {
      const docRef = doc(collection(db, ATTENDANCE_COLLECTION));
      batch.set(docRef, {
        ...att,
        sessionId,
        siteId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
    await batch.commit();

    // Auto-evaluate skill levels asynchronously.
    // We pass data directly to avoid circular import chains.
    import("./skill-evaluation-service")
      .then(({ evaluateMemberSkillLevelFromData }) => {
        attendanceData.forEach(async (att) => {
          try {
            // Load beep tests and assessments for this member
            const [beepMod, assessMod] = await Promise.all([
              import("./beep-test-service"),
              import("./assessment-service"),
            ]);
            const [allAtt, beepTests, assessments] = await Promise.all([
              plannerService.getMemberAttendance(siteId, att.memberId),
              beepMod.beepTestService.getMemberResults(siteId, att.memberId),
              assessMod.getAssessmentsByMemberId(att.memberId),
            ]);
            await evaluateMemberSkillLevelFromData(
              att.memberId,
              allAtt,
              beepTests,
              assessments
            );
          } catch (err) {
            console.error("skill-eval error for", att.memberId, err);
          }
        });
      })
      .catch(console.error);
  },

  async getMemberAttendance(
    siteId: string,
    memberId: string
  ): Promise<SessionAttendance[]> {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where("siteId", "==", siteId),
      where("memberId", "==", memberId),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as SessionAttendance
    );
  },

  // ================= ANNUAL PLANS & TEMPLATES =================
  async getAnnualPlans(siteId: string): Promise<AnnualPlan[]> {
    const q = query(
      collection(db, ANNUAL_PLANS_COLLECTION),
      where("siteId", "==", siteId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as AnnualPlan
    );
  },

  async updateAnnualPlan(id: string, data: Partial<AnnualPlan>): Promise<void> {
    const docRef = doc(db, ANNUAL_PLANS_COLLECTION, id);
    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
  },

  async getTrainingTemplates(siteId: string): Promise<TrainingTemplate[]> {
    const q = query(
      collection(db, TRAINING_TEMPLATES_COLLECTION),
      where("siteId", "==", siteId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as TrainingTemplate
    );
  },

  // ================= SETTINGS / TAGS =================
  async getFocusTags(siteId: string): Promise<string[]> {
    try {
      const q = query(
        collection(db, FOCUS_TAGS_COLLECTION),
        where("siteId", "==", siteId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return [
          "Обща Подготовка",
          "Clear",
          "Smash",
          "Drop",
          "Мрежа",
          "Защита",
          "Двойки",
          "Сингъл",
          "ОФП",
        ];
      }

      // Assuming documents have a 'name' field
      return snapshot.docs.map((doc) => doc.data().name as string);
    } catch {
      return [
        "Обща Подготовка",
        "Clear",
        "Smash",
        "Drop",
        "Мрежа",
        "Защита",
        "Двойки",
        "Сингъл",
        "ОФП",
      ];
    }
  },
};
