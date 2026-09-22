import { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";

import MarketingClient from "./MarketingClient";

export const metadata: Metadata = {
  title: "Маркетинг и Комуникация | БК Гълъбово",
  description: "Изпращане на рекламни и информационни съобщения.",
};

export default function MarketingPage() {
  return (
    <div className="space-y-8 pb-12 duration-500 animate-in fade-in">
      <PageHeader
        title="Маркетинг и Комуникация"
        description="Директна комуникация, телефонни обаждания и официални имейли до състезатели, родители и клиенти."
        breadcrumbs={[{ label: "Начало", href: "/" }, { label: "Комуникация" }]}
      />
      <MarketingClient />
    </div>
  );
}
