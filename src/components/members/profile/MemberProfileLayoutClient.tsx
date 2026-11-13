"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { PageHeader } from "@/components/layout/page-header";
import { AiWorkoutGeneratorModal } from "@/components/training/AiWorkoutGeneratorModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Family } from "@/hooks/useMemberProfile";
import { Member, Sale, ScheduleEvent } from "@/types";

import {
  getActiveMemberSectionId,
  getMemberSectionHref,
  MEMBER_PROFILE_SECTIONS,
} from "./member-profile-sections";
import {
  MemberProfileProvider,
  useMemberProfileContext,
} from "./MemberProfileContext";
import { MemberProfileHeader } from "./MemberProfileHeader";
import { MemberProfileNav } from "./MemberProfileNav";

interface MemberProfileLayoutClientProps {
  memberId: string;
  initialData: {
    member: Member;
    family: Family | null;
    familyMembers: Member[];
    attendances: ScheduleEvent[];
    sales: Sale[];
  };
  children: React.ReactNode;
}

function MemberProfileInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    member,
    fullName,
    isAiWorkoutModalOpen,
    setIsAiWorkoutModalOpen,
    error,
  } = useMemberProfileContext();

  if (error) {
    return (
      <div className="p-6">
        <Alert
          variant="destructive"
          className="rounded-2xl border-none shadow-lg"
        >
          <AlertTitle className="font-bold tracking-tight uppercase">
            Грешка при зареждане
          </AlertTitle>
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const memberId = member.id!;
  const activeSectionId = getActiveMemberSectionId(pathname, memberId);
  const activeSection = activeSectionId
    ? MEMBER_PROFILE_SECTIONS.find((s) => s.id === activeSectionId)
    : undefined;
  const isAiWorkoutNew =
    pathname === `/members/${memberId}/ai-workouts/new` ||
    pathname.startsWith(`/members/${memberId}/ai-workouts/new/`);

  const breadcrumbs: { label: string; href?: string }[] = [
    { label: "Начало", href: "/dashboard" },
    { label: "Членове", href: "/members" },
  ];

  if (isAiWorkoutNew) {
    breadcrumbs.push(
      { label: fullName, href: `/members/${memberId}` },
      { label: "AI Програми", href: `/members/${memberId}/ai-workouts` },
      { label: "Нова AI Програма" }
    );
  } else if (activeSection) {
    breadcrumbs.push(
      { label: fullName, href: `/members/${memberId}` },
      { label: activeSection.label }
    );
  } else {
    breadcrumbs.push({ label: fullName });
  }

  const activeIndex = activeSectionId
    ? MEMBER_PROFILE_SECTIONS.findIndex((s) => s.id === activeSectionId)
    : -1;
  const prevSection =
    activeIndex > 0 ? MEMBER_PROFILE_SECTIONS[activeIndex - 1] : null;
  const nextSection =
    activeIndex >= 0 && activeIndex < MEMBER_PROFILE_SECTIONS.length - 1
      ? MEMBER_PROFILE_SECTIONS[activeIndex + 1]
      : null;

  return (
    <div className="space-y-6 pb-16 duration-500 animate-in fade-in">
      <PageHeader
        title={fullName}
        description={`Управление на профил, членство, документи и тренировъчен процес за ${fullName}.`}
        breadcrumbs={breadcrumbs}
      />

      <MemberProfileHeader />

      <MemberProfileNav />

      <main className="pt-2">{children}</main>

      {!isAiWorkoutNew && (prevSection || nextSection) && (
        <nav
          aria-label="Навигация между секциите"
          className="flex items-center justify-between gap-3 border-t border-zinc-200/80 pt-6 dark:border-zinc-800"
        >
          <div>
            {prevSection && (
              <Link
                href={getMemberSectionHref(memberId, prevSection)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-4 py-2.5 text-xs font-medium text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <span aria-hidden="true">←</span>
                <span>Предишна секция: {prevSection.label}</span>
              </Link>
            )}
          </div>
          <div>
            {nextSection && (
              <Link
                href={getMemberSectionHref(memberId, nextSection)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-4 py-2.5 text-xs font-medium text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <span>Следваща секция: {nextSection.label}</span>
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </nav>
      )}

      <AiWorkoutGeneratorModal
        open={isAiWorkoutModalOpen}
        onOpenChange={setIsAiWorkoutModalOpen}
        member={member}
      />
    </div>
  );
}

export function MemberProfileLayoutClient({
  memberId,
  initialData,
  children,
}: MemberProfileLayoutClientProps) {
  return (
    <MemberProfileProvider memberId={memberId} initialData={initialData}>
      <MemberProfileInner>{children}</MemberProfileInner>
    </MemberProfileProvider>
  );
}
