import { Metadata } from "next";
import AssessmentsClient from "./assessments-client";

export const metadata: Metadata = {
  title: "Тестове и Оценяване | Тренировъчен процес",
  description:
    "Бадминтон тестове по методиката на BWF за различни възрастови групи.",
};

export default function AssessmentsPage() {
  return <AssessmentsClient />;
}
