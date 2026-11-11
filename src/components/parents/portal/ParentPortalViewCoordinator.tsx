"use client";

import { Users } from "lucide-react";
import dynamic from "next/dynamic";
import React from "react";

import { ParentPortalSectionId } from "./parent-portal-sections";
import { useParentPortalContext } from "./ParentPortalContext";
import { ParentPortalHeader } from "./ParentPortalHeader";
import { ParentPortalKpiRow } from "./ParentPortalKpiRow";
import { ParentPortalNav } from "./ParentPortalNav";
import { ParentPortalSkeleton } from "./ParentPortalSkeleton";
import { PortalAttendanceTabView } from "./views/PortalAttendanceTabView";

const ParentPortalDialogs = dynamic(
  () => import("./ParentPortalDialogs").then((m) => m.ParentPortalDialogs),
  { ssr: false }
);

const PortalAbsencesTabView = dynamic(
  () =>
    import("./views/PortalAbsencesTabView").then(
      (m) => m.PortalAbsencesTabView
    ),
  { ssr: false }
);

const PortalDevelopmentTabView = dynamic(
  () =>
    import("./views/PortalDevelopmentTabView").then(
      (m) => m.PortalDevelopmentTabView
    ),
  { ssr: false }
);

const PortalDocumentsTabView = dynamic(
  () =>
    import("./views/PortalDocumentsTabView").then(
      (m) => m.PortalDocumentsTabView
    ),
  { ssr: false }
);

const PortalFinancesTabView = dynamic(
  () =>
    import("./views/PortalFinancesTabView").then(
      (m) => m.PortalFinancesTabView
    ),
  { ssr: false }
);

const PortalProfileTabView = dynamic(
  () =>
    import("./views/PortalProfileTabView").then((m) => m.PortalProfileTabView),
  { ssr: false }
);

export function ParentPortalViewCoordinator({
  section = "attendance",
}: {
  section?: ParentPortalSectionId;
}) {
  const { portal } = useParentPortalContext();
  const { parent, children, isLoading } = portal;

  if (isLoading && !parent) {
    return <ParentPortalSkeleton />;
  }

  if (!isLoading && children.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pt-10">
        <ParentPortalHeader />

        <div className="rounded-3xl border border-zinc-200/80 bg-white p-8 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shadow-2xs">
            <Users size={24} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
              Очаква се свързване на профила ви с картона на детето
            </h2>
            <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
              Вашият родителски профил е успешно регистриран в системата на
              Бадминтон Клуб Гълъбово. Ръководството на клуба ще потвърди
              връзката с картона на вашето дете, след което тук автоматично ще
              се визуализират присъствията, документите и графикът.
            </p>
          </div>
        </div>

        <ParentPortalDialogs />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      {/* ── 1. Clean Bento Header ────────────────────────────────────────── */}
      <ParentPortalHeader />

      {/* ── 2. Bento KPI Metric Cards ────────────────────────────────────── */}
      <ParentPortalKpiRow />

      {/* ── 3. Golden Hybrid Tab Navigation ─────────────────────────────── */}
      <ParentPortalNav />

      {/* ── 4. Tab Views ─────────────────────────────────────────────────── */}
      <main className="min-w-0">
        {section === "attendance" && <PortalAttendanceTabView />}
        {section === "documents" && <PortalDocumentsTabView />}
        {section === "finances" && <PortalFinancesTabView />}
        {section === "profile" && <PortalProfileTabView />}
        {section === "development" && <PortalDevelopmentTabView />}
        {section === "absences" && <PortalAbsencesTabView />}
      </main>

      {/* ── 5. Clean Modal Dialogs ───────────────────────────────────────── */}
      <ParentPortalDialogs />
    </div>
  );
}
