import { Metadata } from "next";

import {
  getActiveStandingCampaignsAdmin,
  getPublicReviewsAdmin,
} from "@/services/admin/feedback-service.admin";

import ClubReviewsClient from "./ClubReviewsClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Отзиви от родители и състезатели | Бадминтон клуб Гълъбово",
  description:
    "Прочетете реалните мнения и впечатления на родители и състезатели за лагерите, състезанията и тренировките в Бадминтон клуб Гълъбово.",
};

export default async function ClubReviewsPage() {
  const [initialReviews, initialCampaigns] = await Promise.all([
    getPublicReviewsAdmin("bkgalabovo"),
    getActiveStandingCampaignsAdmin("bkgalabovo"),
  ]);

  return (
    <ClubReviewsClient
      initialReviews={initialReviews}
      initialCampaigns={initialCampaigns}
    />
  );
}
