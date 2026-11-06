import type { Metadata } from "next";

import { ContactsSectionView } from "@/components/marketing/views/ContactsSectionView";

export const metadata: Metadata = {
  title: "Контакти & CRM | Маркетинг | БК Гълъбово",
  description:
    "Директни телефонни обаждания, бързи бележки и управление на статусите на контакти.",
};

export default function MarketingIndexPage() {
  return <ContactsSectionView />;
}
