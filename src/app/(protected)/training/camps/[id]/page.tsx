import { Metadata } from "next";

import CampDetailsClient from "./CampDetailsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Детайли за лагер | Тренировъчен процес",
  description: "Детайлен преглед и управление на лагер",
};

interface CampDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampDetailsPage({
  params,
}: CampDetailsPageProps) {
  const { id } = await params;

  return (
    <div className="flex size-full flex-col p-6">
      <CampDetailsClient campId={id} />
    </div>
  );
}
