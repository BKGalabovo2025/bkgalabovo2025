import { Metadata } from "next";

import ActiveSessionClient from "./active-session-client";

export const metadata: Metadata = {
  title: "Провеждане на тренировка | Тренировъчен процес",
  description: "Активен режим за треньори.",
};

export default async function ActiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <ActiveSessionClient sessionId={sessionId} />;
}
