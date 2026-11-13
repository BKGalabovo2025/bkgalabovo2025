import { Metadata } from "next";

import { serverCache } from "@/lib/server-cache";
import {
  getActiveStandingCampaignsAdmin,
  getPublicReviewsAdmin,
} from "@/services/admin/feedback-service.admin";
import { getSiteByIdAdmin } from "@/services/admin/site-service.admin";

import ClubReviewsClient from "./ClubReviewsClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Отзиви от родители и състезатели | Бадминтон клуб Гълъбово",
  description:
    "Прочетете реалните мнения и впечатления на родители и състезатели за лагерите, състезанията и тренировките в Бадминтон клуб Гълъбово.",
  alternates: {
    canonical: "/club/reviews",
  },
  openGraph: {
    title: "Отзиви от родители и състезатели | Бадминтон клуб Гълъбово",
    description:
      "Прочетете реалните мнения и впечатления на родители и състезатели за лагерите, състезанията и тренировките в Бадминтон клуб Гълъбово.",
    url: "https://bkgalabovo2025.vercel.app/club/reviews",
    siteName: "БК Гълъбово",
    images: [
      {
        url: "https://bkgalabovo2025.vercel.app/bk-hero.webp",
        width: 1200,
        height: 630,
        alt: "Отзиви за БК Гълъбово",
      },
    ],
    locale: "bg_BG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Отзиви от родители и състезатели | БК Гълъбово",
    description:
      "Реални мнения и впечатления за лагерите, състезанията и тренировките в БК Гълъбово.",
    images: ["https://bkgalabovo2025.vercel.app/bk-hero.webp"],
  },
};

export default async function ClubReviewsPage() {
  const [initialReviews, initialCampaigns, clubSite] = await Promise.all([
    getPublicReviewsAdmin("bkgalabovo"),
    getActiveStandingCampaignsAdmin("bkgalabovo"),
    serverCache.get(
      "site:bkgalabovo",
      () => getSiteByIdAdmin("bkgalabovo"),
      300_000
    ),
  ]);

  return (
    <ClubReviewsClient
      initialReviews={initialReviews}
      initialCampaigns={initialCampaigns}
      clubSite={clubSite}
    />
  );
}
