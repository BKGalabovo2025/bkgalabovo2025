import type { Metadata } from "next";

import ParentPortalClient from "../ParentPortalClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Спортно развитие | Родителски портал",
  description: "Ранглиста, точки, тестове и изпити по бадминтон.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <ParentPortalClient section="development" />;
}
