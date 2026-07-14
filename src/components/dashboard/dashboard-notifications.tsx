"use client";

import { BentoCard } from "@/components/ui/bento-card";
import { AlertCircle, Bell, ArrowRight, CheckCircle2 } from "lucide-react";
import { Reminder } from "@/types";
import { useRouter } from "next/navigation";

interface DashboardNotificationsProps {
  reminders: Reminder[];
}

export const DashboardNotifications = ({
  reminders,
}: DashboardNotificationsProps) => {
  const router = useRouter();

  if (!reminders || reminders.length === 0) {
    return (
      <BentoCard className="p-8 h-full flex flex-col border border-zinc-100 bg-white shadow-none rounded-4xl">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-6 flex items-center gap-3">
          <Bell className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
          Известия
        </h2>
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <CheckCircle2 size={32} strokeWidth={1} className="text-zinc-300" />
          <p className="text-[10px] uppercase tracking-widest mt-4 font-semibold text-zinc-700 dark:text-zinc-400 text-center">
            Няма нови известия
          </p>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard className="p-8 h-full flex flex-col border border-rose-100 bg-rose-50/30 shadow-none rounded-4xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Bell size={120} strokeWidth={1} className="text-rose-600" />
      </div>

      <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-rose-800 dark:text-rose-400 mb-6 flex items-center gap-3 relative z-10">
        <AlertCircle className="h-4 w-4 text-rose-500" strokeWidth={2} />
        Известия ({reminders.length})
      </h2>

      <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar relative z-10">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            onClick={() => {
              if (reminder.relatedLink) {
                router.push(reminder.relatedLink);
              }
            }}
            className="flex flex-col gap-2 p-3 rounded-2xl bg-white border border-rose-100 cursor-pointer hover:border-rose-300 hover:shadow-sm transition-all group animate-in slide-in-from-left duration-300"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-zinc-800 flex-1">
                {reminder.memberName}
              </span>
              <ArrowRight className="h-4 w-4 text-rose-300 group-hover:text-rose-500 transition-colors shrink-0" />
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {reminder.description}
            </p>
          </div>
        ))}
      </div>
    </BentoCard>
  );
};
