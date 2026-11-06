import type { Metadata } from "next";

import ParentPortalClient from "../ParentPortalClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Заявени отсъствия | Родителски портал",
  description:
    "Предварително уведомяване на треньора за предстоящи отсъствия от тренировки.",
};

export default function Page() {
  return <ParentPortalClient section="absences" />;
}
