import { Metadata } from "next";

import { feedbackService } from "@/services/feedback-service";

import FeedbackSurveyClient from "./FeedbackSurveyClient";

interface Props {
  params: Promise<{
    campaignId: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { campaignId } = await params;
  let title = "Анкета за обратна връзка | Бадминтон клуб Гълъбово";
  let description =
    "Споделете вашите впечатления, препоръки и обратна връзка за събитията и тренировките.";
  let siteName = "Бадминтон Клуб Гълъбово";
  let ogImage = "/og-image.jpg";

  try {
    const campaign = await feedbackService.getCampaignById(campaignId);
    if (campaign) {
      const isRecovery =
        campaign.siteId === "recoveryzone" || campaign.eventType === "recovery";
      siteName = isRecovery ? "Recovery Zone by ZM" : "Бадминтон клуб Гълъбово";
      title = `${campaign.title} | ${siteName}`;
      if (campaign.description) {
        description = campaign.description;
      }
      if (isRecovery) {
        ogImage = "/1.png";
      }
    }
  } catch {
    // fallback to defaults
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function FeedbackSurveyPage({ params }: Props) {
  const { campaignId } = await params;
  return <FeedbackSurveyClient campaignId={campaignId} />;
}
