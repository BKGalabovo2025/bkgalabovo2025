import type { Metadata } from "next";

import InquiriesPageClient from "../InquiriesPageClient";

export const metadata: Metadata = {
  title: "Записани по запитвания | БК Гълъбово",
  description: "Запитвания, завършили със записване.",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <InquiriesPageClient />;
}
