import type { Metadata } from "next";

import ParentPortalClient from "../ParentPortalClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Данни за детето | Родителски портал",
  description:
    "Картон на спортиста, контактни данни и заявка за корекция на информацията.",
};

export default function Page() {
  return <ParentPortalClient section="profile" />;
}
