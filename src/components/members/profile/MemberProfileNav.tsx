"use client";

import {
  Award,
  BarChart3,
  Briefcase,
  CalendarCheck,
  CreditCard,
  FileText,
  GraduationCap,
  HeartHandshake,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  getActiveMemberSectionId,
  getMemberSectionHref,
  MEMBER_PROFILE_SECTIONS,
  type MemberProfileSectionId,
} from "./member-profile-sections";
import { useMemberProfileContext } from "./MemberProfileContext";

function isMinorMember(dateOfBirth?: string | null): boolean {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age < 18;
}

const SECTION_ICONS: Record<
  MemberProfileSectionId,
  React.ComponentType<{ className?: string }>
> = {
  personal: User,
  documents: FileText,
  parents: HeartHandshake,
  sales: CreditCard,
  attendance: CalendarCheck,
  trainings: Zap,
  volume: BarChart3,
  assessments: Award,
  theory: GraduationCap,
  "ai-workouts": Sparkles,
  trips: Briefcase,
};

const ACCENT_CLASSES = {
  emerald: {
    link: "border-emerald-200/80 bg-emerald-50/40 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    link: "border-blue-200/80 bg-blue-50/40 text-blue-800 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300",
    icon: "text-blue-600 dark:text-blue-400",
  },
} as const;

export function MemberProfileNav() {
  const pathname = usePathname();
  const { memberId, member, isOverdue } = useMemberProfileContext();

  const activeId = getActiveMemberSectionId(pathname, memberId);

  const isClubNonGuest =
    Boolean(member.isClubMember) &&
    !member.isGuest &&
    member.memberType !== "guest";
  const hasMissingDocs =
    isClubNonGuest &&
    (!member.signedDeclarationUrl || !member.medicalCertificateUrl);

  const hasParentContact = Boolean(
    member.parentName ||
    member.parentPhone ||
    member.parentEmail ||
    member.fatherName ||
    member.fatherPhone ||
    member.motherName ||
    member.motherPhone ||
    member.secondParentName ||
    member.secondParentPhone
  );
  const needsParentLink =
    isMinorMember(member.dateOfBirth) && !hasParentContact;

  const getStatusDotClass = (
    sectionId: MemberProfileSectionId
  ): string | null => {
    if (sectionId === "sales" && isOverdue) {
      return "bg-rose-500";
    }
    if (sectionId === "documents" && hasMissingDocs) {
      return "bg-amber-500";
    }
    if (sectionId === "parents" && needsParentLink) {
      return "bg-amber-500";
    }
    return null;
  };

  return (
    <TooltipProvider delayDuration={150}>
      <nav
        aria-label="Подстраници на досието на члена"
        className="sticky top-14 z-20 -mx-3 border-b border-zinc-200/80 bg-white/95 px-3 py-2.5 backdrop-blur-md sm:top-16 sm:-mx-6 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/95"
      >
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-2">
          {MEMBER_PROFILE_SECTIONS.map((section) => {
            const href = getMemberSectionHref(memberId, section);
            const isActive = section.id === activeId;
            const Icon = SECTION_ICONS[section.id];
            const accent = section.accent
              ? ACCENT_CLASSES[section.accent]
              : null;
            const statusDotClass = getStatusDotClass(section.id);

            return (
              <Tooltip key={section.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex h-9 w-full items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-all select-none",
                      isActive
                        ? "border-zinc-950 bg-zinc-950 text-white shadow-xs dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                        : "border-zinc-200/80 bg-zinc-50/80 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                      !isActive && accent?.link
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        isActive
                          ? "text-white dark:text-zinc-950"
                          : "text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200",
                        !isActive && accent?.icon
                      )}
                    />
                    <span className="truncate">{section.label}</span>
                    {statusDotClass && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "ml-auto size-1.5 shrink-0 rounded-full",
                          statusDotClass
                        )}
                      />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{section.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </nav>
    </TooltipProvider>
  );
}
