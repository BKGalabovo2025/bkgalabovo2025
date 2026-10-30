import { Metadata } from "next";

import {
  getActiveStandingCampaignsAdmin,
  getPublicReviewsAdmin,
} from "@/services/admin/feedback-service.admin";

import RecoveryReviewsClient from "./RecoveryReviewsClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Отзиви от клиенти | Recovery Zone by ZM",
  description:
    "Реални отзиви и оценки от спортисти и клиенти за възстановителните процедури с Hyperice Normatec 3 в Recovery Zone by ZM.",
};

export default async function RecoveryReviewsPage() {
  const [initialReviews, initialCampaigns] = await Promise.all([
    getPublicReviewsAdmin("recoveryzone"),
    getActiveStandingCampaignsAdmin("recoveryzone"),
  ]);

  return (
    <RecoveryReviewsClient
      initialReviews={initialReviews}
      initialCampaigns={initialCampaigns}
    />
  );
}
