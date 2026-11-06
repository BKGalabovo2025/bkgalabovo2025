import type { Metadata } from "next";

import InquiriesPageClient from "../InquiriesPageClient";

export const metadata: Metadata = {
  title: "Нови запитвания | БК Гълъбово",
  description: "Нови, необработени запитвания от уебсайта.",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <InquiriesPageClient />;
}
