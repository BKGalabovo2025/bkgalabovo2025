import { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";

import { PartnersClient } from "./PartnersClient";

export const metadata: Metadata = {
  title: "Партньори & Спонсори | БК Гълъбово",
  description:
    "Управление на клубни партньори, спонсори, институции, лога и видимост в клубните документи и ваучери.",
};

export default function PartnersPage() {
  return (
    <div className="space-y-6 pb-12 duration-500 animate-in fade-in">
      <PageHeader
        title="Партньори & Спонсори"
        description="Официални институционални, спортни и търговски партньори на клуба, лога и присъствие в издаваните документи и ваучери."
        breadcrumbs={[
          { label: "Начало", href: "/" },
          { label: "Управление" },
          { label: "Партньори & Спонсори" },
        ]}
      />
      <PartnersClient />
    </div>
  );
}
