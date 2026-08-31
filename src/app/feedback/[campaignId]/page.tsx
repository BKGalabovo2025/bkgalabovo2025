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
      "Споделете вашите впечатления, препоръки и отзиви за събитията на Бадминтон клуб Гълъбово.",
  };
}

export default async function FeedbackSurveyPage({ params }: Props) {
  const { campaignId } = await params;
  return <FeedbackSurveyClient campaignId={campaignId} />;
}
