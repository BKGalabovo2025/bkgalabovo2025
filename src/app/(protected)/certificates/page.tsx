import { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";

import { CertificatesClient } from "./CertificatesClient";

export const metadata: Metadata = {
  title: "Сертификати & Ваучери Студио | БК Гълъбово",
  description:
    "Дигитално студио за грамоти, персонални ваучери с QR код и управление на спонсори.",
};

export default function CertificatesPage() {
  return (
    <div className="space-y-8 pb-12 duration-500 animate-in fade-in">
      <PageHeader
        title="Сертификати, Грамоти & Ваучери"
        description="Генериране, споделяне, QR верификация и отчитане на персонални клубни сертификати и ваучери."
        breadcrumbs={[
          { label: "Начало", href: "/" },
          { label: "Управление" },
          { label: "Сертификати & Ваучери" },
        ]}
      />
      <CertificatesClient />
    </div>
  );
}
