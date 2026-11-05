import { Metadata } from "next";
import React from "react";

import DocumentTemplatesPage from "./templates/page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Документи & Бланки | Бадминтон клуб Гълъбово",
  description:
    "Управление на клубни образци на документи, онлайн попълване и електронен регистър на подписани документи.",
};

export default function DocumentsIndexPage() {
  return <DocumentTemplatesPage />;
}
