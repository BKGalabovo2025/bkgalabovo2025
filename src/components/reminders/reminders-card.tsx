import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BellRing, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { Reminder } from "@/types";

interface RemindersCardProps {
  reminders: Reminder[];
}

const getReminderIcon = (type: Reminder["type"]) => {
  switch (type) {
    case "error":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    default:
      return <BellRing className="h-5 w-5 text-blue-500" />;
  }
};

// This function constructs the correct link based on the reminder type
const getReminderLink = (reminder: Reminder): string => {
  switch (reminder.type) {
    case "payment":
      // Payment reminders should link to the member's detail page
      return `/members/${reminder.relatedId}`;
    // In the future, other reminder types can have their links constructed here
    // case 'inventory':
    //   return `/inventory/${reminder.relatedId}`;
    default:
      // Fallback for unknown types
      return "#";
  }
};

export function RemindersCard({ reminders }: RemindersCardProps) {
  return (
    <div className="premium-card p-0 overflow-hidden flex flex-col h-full">
      <div className="px-10 py-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700">
            <BellRing className="h-6 w-6 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-xl font-black font-heading text-zinc-950 dark:text-white uppercase tracking-tight">Напомняния</h3>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Важни известия и задачи</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        {reminders && reminders.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {reminders.map((reminder, index) => {
              const link = getReminderLink(reminder);
              return (
                <div
                  key={`${reminder.id}-${index}`}
                  className="flex items-start gap-6 px-10 py-8 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-all group"
                >
                  <div className={cn(
                    "h-12 w-12 flex items-center justify-center rounded-2xl shadow-sm border transition-all group-hover:scale-110 shrink-0",
                    reminder.type === "error" ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30 text-red-500" :
                    reminder.type === "warning" ? "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30 text-amber-500" :
                    "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 text-blue-500"
                  )}>
                    {getReminderIcon(reminder.type)}
                  </div>
                  <div className="space-y-2 grow">
                    <p className="text-lg font-black font-heading text-zinc-950 dark:text-zinc-100 leading-none tracking-tight">
                      {reminder.title}
                    </p>
                    <p className="text-sm text-zinc-500 font-bold leading-relaxed">
                      {reminder.description}
                    </p>
                    <Link
                      href={link}
                      className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2 transition-all group-hover:translate-x-1"
                    >
                      Преглед <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 px-10 text-center">
            <div className="h-20 w-20 bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 opacity-40">
              <BellRing className="h-10 w-10 text-zinc-400" />
            </div>
            <h4 className="text-xl font-black font-heading text-zinc-950 dark:text-white uppercase mb-2">Всичко е наред</h4>
            <p className="font-bold text-zinc-500 uppercase text-xs tracking-widest">Нямате нови известия</p>
          </div>
        )}
      </div>
    </div>
  );
}
