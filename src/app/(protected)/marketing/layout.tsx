import type { Metadata } from "next";
import React from "react";

import { MarketingProvider } from "@/components/marketing/MarketingContext";
import { MarketingLayoutClient } from "@/components/marketing/MarketingLayoutClient";

export const metadata: Metadata = {
  title: "Маркетинг & CRM Център | БК Гълъбово",
  description:
    "Директна комуникация, телефонни разговори, имейл кампании и шаблони за състезатели и клиенти.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingProvider>
      <MarketingLayoutClient>{children}</MarketingLayoutClient>
    </MarketingProvider>
  );
}
