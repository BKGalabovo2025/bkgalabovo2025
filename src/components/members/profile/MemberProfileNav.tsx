"use client";

import {
  Award,
  BarChart3,
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

import { useMemberProfileContext } from "./MemberProfileContext";

interface NavTabItem {
  id: string;
  label: string;
  pathSuffix: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  badge?: string;
  specialColor?: boolean;
}

export function MemberProfileNav() {
  const pathname = usePathname();
  const { memberId } = useMemberProfileContext();

  const basePath = `/members/${memberId}`;

  const tabs: NavTabItem[] = [
    {
      id: "personal",
      label: "Данни",
      pathSuffix: "",
      icon: User,
      tooltip: "Лични данни, контакти, възрастова група и семеен профил",
    },
    {
      id: "documents",
      label: "Документи",
      pathSuffix: "/documents",
      icon: FileText,
      tooltip:
        "Медицински свидетелства, картотеки, декларации и бланки за печат",
    },
    {
      id: "parents",
      label: "Родителски достъп",
      pathSuffix: "/parents",
      icon: HeartHandshake,
      tooltip: "Връзка с родители, PIN кодове за вход и родителски контрол",
      specialColor: true,
    },
    {
      id: "sales",
      label: "Финансова история",
      pathSuffix: "/sales",
      icon: CreditCard,
      tooltip: "Заплатени такси, абонаменти, история на плащанията и фактури",
    },
    {
      id: "attendance",
      label: "Присъствия",
      pathSuffix: "/attendance",
      icon: CalendarCheck,
      tooltip:
        "Хронологичен регистър на присъствията и отсъствията от тренировки",
    },
    {
      id: "trainings",
      label: "Shadow тренировки",
      pathSuffix: "/trainings",
      icon: Zap,
      tooltip:
        "История на тренировките на Shadow тренажора, бързина и показатели",
    },
    {
      id: "volume",
      label: "Тренировъчен обем",
      pathSuffix: "/volume",
      icon: BarChart3,
      tooltip:
        "Анализ на тренировъчното натоварване, седмични часове и интензитет",
    },
    {
      id: "assessments",
      label: "Оценяване",
      pathSuffix: "/assessments",
      icon: Award,
      tooltip: "Треньорски оценки, физически нормативи и тестови показатели",
    },
    {
      id: "theory",
      label: "Теория",
      pathSuffix: "/theory",
      icon: GraduationCap,
      tooltip:
        "Резултати от тестове по правилника на бадминтона и тактически въпроси",
    },
    {
      id: "ai-workouts",
      label: "AI Програми",
      pathSuffix: "/ai-workouts",
      icon: Sparkles,
      tooltip: "Индивидуални тренировъчни планове, генерирани от AI треньора",
      specialColor: true,
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <nav
        aria-label="Подстраници на досието на члена"
        className="sticky top-14 z-20 -mx-3 border-b border-zinc-200/80 bg-white/90 px-3 py-2 backdrop-blur-md sm:top-16 sm:-mx-6 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/90"
      >
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-0.5">
          {tabs.map((tab) => {
            const href = `${basePath}${tab.pathSuffix}`;
            const isPersonal = tab.id === "personal";
            const isActive = isPersonal
              ? pathname === basePath || pathname === `${basePath}/personal`
              : pathname.startsWith(href);

            const Icon = tab.icon;

            return (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    className={cn(
                      "group flex h-9 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-semibold tracking-wider whitespace-nowrap uppercase transition-all select-none",
                      isActive
                        ? "border border-zinc-200 bg-zinc-950 text-white shadow-2xs dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-950"
                        : "border border-transparent bg-zinc-50/60 text-zinc-600 hover:border-zinc-200/80 hover:bg-zinc-100 hover:text-zinc-950 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-850 dark:hover:text-zinc-100",
                      tab.specialColor &&
                        !isActive &&
                        tab.id === "parents" &&
                        "text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300",
                      tab.specialColor &&
                        !isActive &&
                        tab.id === "ai-workouts" &&
                        "text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-3.5 transition-colors",
                        isActive
                          ? "text-white dark:text-zinc-950"
                          : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300",
                        tab.specialColor &&
                          !isActive &&
                          tab.id === "parents" &&
                          "text-emerald-600 dark:text-emerald-400",
                        tab.specialColor &&
                          !isActive &&
                          tab.id === "ai-workouts" &&
                          "text-blue-600 dark:text-blue-400"
                      )}
                    />
                    <span>{tab.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tab.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </nav>
    </TooltipProvider>
  );
}
