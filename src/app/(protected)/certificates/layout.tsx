import type { Metadata } from "next";
import React from "react";

import { CertificatesProvider } from "@/components/certificates/CertificatesContext";
import { CertificatesLayoutClient } from "@/components/certificates/CertificatesLayoutClient";

export const metadata: Metadata = {
  title: "Сертификати & Ваучери Студио | БК Гълъбово",
  description:
    "Дигитално студио за клубни сертификати, персонални ваучери с QR код и регистър на издадените документи.",
};

export default function CertificatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CertificatesProvider>
      <CertificatesLayoutClient>{children}</CertificatesLayoutClient>
    </CertificatesProvider>
  );
}
