import {
  addDoc,
  CollectionReference,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { getSiteConfig } from "@/config/sites";
import {
  getMemberAssessmentsCollection,
  getMemberAssessmentsQuery,
} from "@/lib/firebase-collections";
import { MemberAssessment } from "@/types/assessment.types";

export const getAssessmentsByMemberId = async (
  memberId: string
): Promise<MemberAssessment[]> => {
  if (!memberId) return [];

  const q = query(
    getMemberAssessmentsQuery(),
    where("memberId", "==", memberId),
    orderBy("date", "desc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as MemberAssessment);
};

export const addAssessment = async (
  assessmentData: Omit<
    MemberAssessment,
    "id" | "createdAt" | "updatedAt" | "siteId"
  >
): Promise<string> => {
  const dataToAdd = {
    ...assessmentData,
    siteId: getSiteConfig().id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    getMemberAssessmentsCollection() as CollectionReference<
      Omit<MemberAssessment, "id">
    >,
    dataToAdd
  );
  return docRef.id;
};

export const getAllAssessments = async (
  siteId: string
): Promise<MemberAssessment[]> => {
  const q = query(getMemberAssessmentsQuery(), where("siteId", "==", siteId));

  const querySnapshot = await getDocs(q);
  const docs = querySnapshot.docs.map((doc) => doc.data() as MemberAssessment);

  return docs.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const deleteAssessment = async (id: string): Promise<void> => {
  const assessmentRef = doc(getMemberAssessmentsCollection(), id);
  await deleteDoc(assessmentRef);
};
