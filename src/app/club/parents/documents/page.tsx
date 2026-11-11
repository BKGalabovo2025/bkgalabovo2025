import type { Metadata } from "next";

import ParentPortalClient from "../ParentPortalClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Документи & Картотека | Родителски портал",
  description:
    "Електронно подписване на декларации, картотека и медицински свидетелства.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <ParentPortalClient section="documents" />;
}
