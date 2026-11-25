"use client";

import { ExternalLink, Handshake, Sparkles } from "lucide-react";
import Link from "next/link";
import React from "react";

import { ModuleHubBar } from "@/components/layout/ModuleHubBar";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useCertificatesContext } from "./CertificatesContext";
import { CertificatesNav } from "./CertificatesNav";

interface CertificatesLayoutClientProps {
  children: React.ReactNode;
}

export function CertificatesLayoutClient({
  children,
}: CertificatesLayoutClientProps) {
  const { isRecoveryZone, sponsors, issuedCertificates } =
    useCertificatesContext();

  return (
    <div className="mx-auto max-w-7xl space-y-3.5 pb-6 duration-500 animate-in fade-in">
      <ModuleHubBar hub="recognition" />
      <PageHeader
        className="mb-2 space-y-1.5"
        title="Сертификати, Грамоти & Ваучери"
        description="Генериране, споделяне, QR верификация и отчитане на клубни сертификати и ваучери."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Управление" },
          { label: "Сертификати & Ваучери", href: "/certificates" },
        ]}
      >
        <Badge
          variant="outline"
          className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
            isRecoveryZone
              ? "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
              : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
          }`}
        >
          <Sparkles className="mr-1 inline size-3" />
          <span>
            {isRecoveryZone ? "Recovery Zone by ZM" : "БАДМИНТОН КЛУБ ГЪЛЪБОВО"}
          </span>
        </Badge>
      </PageHeader>

      {/* Hierarchical Subpage Navigation Bar */}
      <div className="sticky top-16 z-20 -mx-1 flex flex-col gap-2 backdrop-blur-md sm:top-20 sm:flex-row sm:items-center sm:justify-between p-1">
        <CertificatesNav issuedCount={issuedCertificates.length} />

        <Button
          asChild
          variant="outline"
          className="h-9 w-full rounded-xl border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 shadow-xs hover:border-blue-500 hover:text-blue-600 sm:w-auto dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:text-blue-400"
        >
          <Link
            href="/partners"
            className="flex items-center justify-center gap-1.5"
          >
            <Handshake className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span>Партньори ({sponsors.length})</span>
            <ExternalLink className="size-3 opacity-60" />
          </Link>
        </Button>
      </div>

      {/* Section Content */}
      <div className="duration-300 animate-in fade-in-50">{children}</div>
    </div>
  );
}
