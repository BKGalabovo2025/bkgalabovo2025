import type { Metadata } from "next";
import React from "react";

import NewRecoverySessionClient from "@/app/(protected)/finances/recovery/new/client-page";
import { getSiteByIdAdmin } from "@/services/admin/site-service.admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Добави процедура | Възстановяване - БК Гълъбово",
  description:
    "Добавяне на нова възстановителна процедура, криотерапия, сауна, масаж или пакет в Recovery Zone.",
};

export default async function NewRecoverySessionCatalogPage() {
  const site = await getSiteByIdAdmin("recoveryzone");

  const siteInventory = site?.inventory
    ? {
        compressors: site.inventory.compressors || 0,
        attachments: {
          arms: site.inventory.attachments?.arms || 0,
          legs: site.inventory.attachments?.legs || 0,
          hips: site.inventory.attachments?.hips || 0,
        },
      }
    : undefined;

  return <NewRecoverySessionClient siteInventory={siteInventory} />;
}
