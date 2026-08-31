import { Metadata } from "next";

import ClubReviewsClient from "./ClubReviewsClient";

export const metadata: Metadata = {
  title: "Отзиви от родители и състезатели | Бадминтон клуб Гълъбово",
  description:
    "Прочетете реалните мнения и впечатления на родители и състезатели за лагерите, състезанията и тренировките в Бадминтон клуб Гълъбово.",
};

export default function ClubReviewsPage() {
  return <ClubReviewsClient />;
}
