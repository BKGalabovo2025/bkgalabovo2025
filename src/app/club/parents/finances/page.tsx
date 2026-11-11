import type { Metadata } from "next";

import ParentPortalClient from "../ParentPortalClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Такси & Касови бележки | Родителски портал",
  description:
    "Месечни абонаменти, такси и електронни касови бележки за вашето дете.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <ParentPortalClient section="finances" />;
}
