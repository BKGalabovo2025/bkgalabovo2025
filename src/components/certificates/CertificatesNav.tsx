"use client";

import { FileCheck2, Palette, Printer, UploadCloud } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { cn } from "@/lib/utils";

import {
  CERTIFICATE_SECTIONS,
  type CertificateSectionId,
  getActiveCertificateSectionId,
} from "./certificate-sections";

const SECTION_ICONS: Record<CertificateSectionId, typeof UploadCloud> = {
  issue: UploadCloud,
  studio: Printer,
  templates: Palette,
  issued: FileCheck2,
};

interface CertificatesNavProps {
  className?: string;
  issuedCount?: number;
}

export function CertificatesNav({
  className,
  issuedCount,
}: CertificatesNavProps) {
  const pathname = usePathname();
  const activeSection = getActiveCertificateSectionId(pathname) || "issue";

  return (
    <nav
      aria-label="Навигация в сертификати и ваучери"
      className={cn(
        "no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-zinc-200/80 bg-zinc-100/90 p-1.5 backdrop-blur-xs sm:w-fit dark:border-zinc-800 dark:bg-zinc-900/60",
        className
      )}
    >
      {CERTIFICATE_SECTIONS.map((section) => {
        const Icon = SECTION_ICONS[section.id] || section.icon;
        const isActive = activeSection === section.id;
        const href = section.pathSuffix
          ? `/certificates${section.pathSuffix.startsWith("/") ? section.pathSuffix : `/${section.pathSuffix}`}`
          : "/certificates";

        return (
          <Link
            key={section.id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            title={section.tooltip}
            className={cn(
              "group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200",
              isActive
                ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                isActive
                  ? section.id === "issue"
                    ? "text-blue-600 dark:text-blue-400"
                    : section.id === "studio"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : section.id === "templates"
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
              )}
            />
            <span>
              {section.label}
              {section.id === "issued" && typeof issuedCount === "number"
                ? ` (${issuedCount})`
                : ""}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
