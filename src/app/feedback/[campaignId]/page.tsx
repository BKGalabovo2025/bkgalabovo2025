import { Metadata } from "next";

import FeedbackSurveyClient from "./FeedbackSurveyClient";

interface Props {
  params: Promise<{
    campaignId: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Анкета за обратна връзка | Бадминтон клуб Гълъбово",
    description:
      "Споделете вашите впечатления, препоръки и обратна връзка за тренировките и лагерите на Бадминтон клуб Гълъбово.",
    openGraph: {
      title: "Анкета за обратна връзка | Бадминтон клуб Гълъбово",
      description:
        "Споделете вашите впечатления, препоръки и обратна връзка за събитията на Бадминтон клуб Гълъбово.",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Бадминтон Клуб Гълъбово & Recovery Zone",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Анкета за обратна връзка | Бадминтон клуб Гълъбово",
      description:
        "Споделете вашите впечатления и обратна връзка за събитията на Бадминтон клуб Гълъбово.",
      images: ["/og-image.jpg"],
    },
  };
}

export default async function FeedbackSurveyPage({ params }: Props) {
  const { campaignId } = await params;
  return <FeedbackSurveyClient campaignId={campaignId} />;
}
