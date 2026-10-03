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
    <div className="space-y-3 sm:space-y-4 pb-6 duration-500 animate-in fade-in">
      <PageHeader
        className="mb-2 sm:mb-3 space-y-1.5 sm:space-y-2"
        title="Сертификати, Грамоти & Ваучери"
        description="Генериране, споделяне, QR верификация и отчитане на клубни сертификати и ваучери."
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
