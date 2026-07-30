"use client";

import { AlertCircle, ArrowRight, Bell, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { BentoCard } from "@/components/ui/bento-card";
import { Reminder } from "@/types";

interface DashboardNotificationsProps {
  reminders: Reminder[];
}

export const DashboardNotifications = ({
  reminders,
}: DashboardNotificationsProps) => {
  const router = useRouter();

  if (!reminders || reminders.length === 0) {
    return (
      <BentoCard className="flex h-full flex-col rounded-4xl border border-zinc-100 bg-white p-8 shadow-none">
        <h2 className="mb-6 flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
          <Bell className="size-4 text-emerald-500" strokeWidth={1.5} />
          Известия
        </h2>
        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <CheckCircle2 size={32} strokeWidth={1} className="text-zinc-300" />
          <p className="mt-4 text-center text-[10px] font-semibold tracking-widest text-zinc-700 uppercase dark:text-zinc-400">
            Няма нови известия
          </p>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard className="relative flex h-full flex-col overflow-hidden rounded-4xl border border-rose-100 bg-rose-50/30 p-8 shadow-none">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Bell size={120} strokeWidth={1} className="text-rose-600" />
      </div>

      <h2 className="relative z-10 mb-6 flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] text-rose-800 uppercase dark:text-rose-400">
        <AlertCircle className="size-4 text-rose-500" strokeWidth={2} />
        Известия ({reminders.length})
      </h2>

      <div className="custom-scrollbar relative z-10 max-h-100 space-y-3 overflow-y-auto pr-2">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            onClick={() => {
              if (reminder.relatedLink) {
                router.push(reminder.relatedLink);
              }
            }}
            className="group flex cursor-pointer flex-col gap-2 rounded-2xl border border-rose-100 bg-white p-3 transition-all duration-300 animate-in slide-in-from-left hover:border-rose-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex-1 text-sm font-semibold text-zinc-800">
                {reminder.memberName}
              </span>
              <ArrowRight className="size-4 shrink-0 text-rose-300 transition-colors group-hover:text-rose-500" />
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              {reminder.description}
            </p>
          </div>
        ))}
      </div>
    </BentoCard>
  );
};
