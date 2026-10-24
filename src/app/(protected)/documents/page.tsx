import { Metadata } from "next";

import DocumentsClient from "./documents-client";

export const metadata: Metadata = {
  title: "Документи & Бланки | Бадминтон клуб Гълъбово",
  description:
    "Управление на клубни образци на документи, онлайн попълване и електронен регистър на подписани документи.",
};

export default function DocumentsPage() {
  return <DocumentsClient />;
}
