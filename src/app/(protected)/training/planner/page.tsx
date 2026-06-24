import { Metadata } from "next";
import PlannerClient from "./planner-client";

export const metadata: Metadata = {
  title: "Универсален Планировчик | Тренировъчен процес",
  description: "Планиране на тренировъчни сесии и лагери.",
};

export default function PlannerPage() {
  return <PlannerClient />;
}
