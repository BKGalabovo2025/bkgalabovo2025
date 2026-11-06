import type { Metadata } from "next";

import InquiriesPageClient from "../InquiriesPageClient";

export const metadata: Metadata = {
  title: "Архив на запитванията | БК Гълъбово",
  description: "Архивирани запитвания от уебсайта.",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <InquiriesPageClient />;
}
