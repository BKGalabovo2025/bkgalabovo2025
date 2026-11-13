import { Metadata } from "next";

import { serverCache } from "@/lib/server-cache";
import {
  getActiveStandingCampaignsAdmin,
  getPublicReviewsAdmin,
} from "@/services/admin/feedback-service.admin";
import { getSiteByIdAdmin } from "@/services/admin/site-service.admin";

import RecoveryReviewsClient from "./RecoveryReviewsClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Отзиви от клиенти | Recovery Zone by ZM",
  description:
    "Реални отзиви и оценки от спортисти и клиенти за възстановителните процедури с Hyperice Normatec 3 в Recovery Zone by ZM.",
  alternates: {
    canonical: "/recovery-zone/reviews",
  },
  openGraph: {
    title: "Отзиви от клиенти | Recovery Zone by ZM",
    description:
      "Реални отзиви и оценки от спортисти и клиенти за възстановителните процедури с Hyperice Normatec 3 в Recovery Zone by ZM.",
    url: "https://bkgalabovo2025.vercel.app/recovery-zone/reviews",
    siteName: "Recovery Zone",
    images: [
      {
        url: "https://bkgalabovo2025.vercel.app/recovery-zone/rz-logo-horizontal.png",
        width: 1200,
        height: 630,
        alt: "Recovery Zone by ZM Отзиви",
      },
    ],
    locale: "bg_BG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Отзиви от клиенти | Recovery Zone by ZM",
    description:
      "Реални отзиви и оценки от спортисти и клиенти за възстановителните процедури с Hyperice Normatec 3.",
    images: [
      "https://bkgalabovo2025.vercel.app/recovery-zone/rz-logo-horizontal.png",
    ],
  },
};

export default async function RecoveryReviewsPage() {
  const [initialReviews, initialCampaigns, site] = await Promise.all([
    getPublicReviewsAdmin("recoveryzone"),
    getActiveStandingCampaignsAdmin("recoveryzone"),
    serverCache.get(
      "site:recoveryzone",
      () => getSiteByIdAdmin("recoveryzone"),
      300_000
    ),
  ]);

  return (
    <RecoveryReviewsClient
      initialReviews={initialReviews}
      initialCampaigns={initialCampaigns}
      site={site}
    />
  );
}
