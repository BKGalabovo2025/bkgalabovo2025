import {
  getDocs,
  query,
  serverTimestamp,
  orderBy,
  deleteDoc,
  doc,
  CollectionReference,
  addDoc,
  where,
} from "firebase/firestore";
import {
  getMemberAssessmentsCollection,
  getMemberAssessmentsQuery,
} from "@/lib/firebase-collections";
import { getSiteConfig } from "@/config/sites";
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

export const deleteAssessment = async (id: string): Promise<void> => {
  const assessmentRef = doc(getMemberAssessmentsCollection(), id);
  await deleteDoc(assessmentRef);
};
