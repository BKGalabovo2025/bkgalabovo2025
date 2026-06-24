import { Metadata } from "next";
import ActiveSessionClient from "./active-session-client";

export const metadata: Metadata = {
  title: "Провеждане на тренировка | Тренировъчен процес",
  description: "Активен режим за треньори.",
};

export default function ActiveSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return <ActiveSessionClient sessionId={params.sessionId} />;
}
