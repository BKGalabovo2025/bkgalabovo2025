import type { Metadata } from "next";

import ParentPortalClient from "../ParentPortalClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Спортно развитие | Родителски портал",
  description: "Ранглиста, точки, тестове и изпити по бадминтон.",
};

export default function Page() {
  return <ParentPortalClient section="development" />;
}
