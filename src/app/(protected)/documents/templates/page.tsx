import { Metadata } from "next";
import React from "react";

import { DocumentTemplatesManager } from "@/components/documents/DocumentTemplatesManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Образци на бланки | Документи | БК Гълъбово",
  description:
    "Управление на клубни образци, декларации, формуляри и шаблони за документи.",
};

export default function DocumentTemplatesPage() {
  return <DocumentTemplatesManager />;
}
