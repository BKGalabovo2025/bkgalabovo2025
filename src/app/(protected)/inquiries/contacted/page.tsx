import type { Metadata } from "next";

import InquiriesPageClient from "../InquiriesPageClient";

export const metadata: Metadata = {
  title: "Свързани запитвания | БК Гълъбово",
  description: "Запитвания, с които е осъществена връзка.",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <InquiriesPageClient />;
}
