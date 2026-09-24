"use client";

import { AlertCircle, ArrowRight, Bell, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BentoCard } from "@/components/ui/bento-card";
import { useAppStore } from "@/store/use-app-store";
import { Reminder } from "@/types";

interface DashboardNotificationsProps {
  reminders: Reminder[];
}

export const DashboardNotifications = ({
  reminders,
}: DashboardNotificationsProps) => {
  const router = useRouter();
  const { activeBranch } = useAppStore();
  const isRecovery = activeBranch === "recoveryzone";

  if (!reminders || reminders.length === 0) {
    return (
      <BentoCard className="flex flex-col justify-between rounded-4xl border border-zinc-100 bg-white p-6 shadow-none dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <Bell className="size-4" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {isRecovery ? "Плащания за процедури" : "Известия и плащания"}
                </h2>
                <p className="text-[11px] text-zinc-400">
                  {isRecovery
                    ? "Възстановителни процедури"
                    : "Членски вноски & такси"}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              Всичко платено
            </span>
          </div>

          <div className="my-2 flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/40">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Няма просрочени задължения
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isRecovery
                  ? "Всички проведени процедури са коректно отчетени"
                  : "Всички присъствия и клубни абонаменти са коректно отчетени"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <Link
            href={isRecovery ? "/schedule?tab=recovery" : "/schedule"}
            className="group flex items-center justify-between text-xs font-semibold text-zinc-600 transition-colors hover:text-primary dark:text-zinc-400 dark:hover:text-white"
          >
            <span>
              {isRecovery ? "График на процедурите" : "График и присъствия"}
            </span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard className="relative flex flex-col justify-between overflow-hidden rounded-4xl border border-rose-200/80 bg-linear-to-br from-rose-50/60 via-white to-rose-50/20 p-6 shadow-none dark:border-rose-900/50 dark:from-rose-950/20 dark:via-zinc-900 dark:to-zinc-900">
      <div className="pointer-events-none absolute -top-4 -right-4 p-6 opacity-10">
        <Bell size={110} strokeWidth={1} className="text-rose-600" />
      </div>

      <div>
        <div className="relative z-10 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex size-8 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm shadow-rose-500/25">
              <AlertCircle className="size-4" strokeWidth={2.2} />
              <span className="absolute -top-1 -right-1 flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
              </span>
            </div>
            <div>
              <h2 className="text-xs font-bold text-rose-950 dark:text-rose-200">
                {isRecovery ? "Плащания за процедури" : "Известия и плащания"}
              </h2>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400/70">
                {isRecovery
                  ? "Неплатени процедури"
                  : "Неплатени такси и посещения"}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
            {reminders.length}
          </span>
        </div>

        <div className="custom-scrollbar relative z-10 max-h-72 space-y-2 overflow-y-auto pr-1">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              onClick={() => {
                if (reminder.relatedLink) {
                  router.push(reminder.relatedLink);
                } else if (reminder.memberId) {
                  router.push(
                    isRecovery
                      ? "/schedule?tab=recovery"
                      : `/members/${reminder.memberId}`
                  );
                } else {
                  router.push(
                    isRecovery ? "/schedule?tab=recovery" : "/schedule"
                  );
                }
              }}
              className="group flex cursor-pointer flex-col gap-1 rounded-2xl border border-rose-100/80 bg-white/95 p-3 backdrop-blur-xs transition-all duration-200 hover:border-rose-300 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900/95"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {reminder.memberName}
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-rose-400 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-600" />
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                {reminder.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-4 border-t border-rose-200/50 pt-3 dark:border-zinc-800">
        <Link
          href="/schedule"
          className="group flex items-center justify-between text-xs font-semibold text-rose-900 transition-colors hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-100"
        >
          <span>Към графика и посещенията</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </BentoCard>
  );
};
