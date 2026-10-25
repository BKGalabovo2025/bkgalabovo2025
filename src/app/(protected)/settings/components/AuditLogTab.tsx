import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { Loader2, RefreshCw, Shield } from "lucide-react";

import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/use-settings-store";

export function AuditLogTab() {
  const { auditLogs, fetchLogs, loadingLogs } = useSettingsStore();

  return (
    <div className="grid grid-cols-1 gap-4">
      <BentoCard className="space-y-4 border-zinc-200/80 bg-white p-4.5 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="size-5 text-indigo-500" strokeWidth={1.5} />
            <h3 className="text-xl font-light text-zinc-900 sm:text-2xl dark:text-white">
              История на промените
            </h3>
          </div>
          <Button
            variant="outline"
            onClick={fetchLogs}
            disabled={loadingLogs}
            className="h-9 rounded-xl px-3.5 text-xs font-medium tracking-widest uppercase"
          >
            <RefreshCw
              className={`mr-2 size-3.5 ${loadingLogs ? "animate-spin" : ""}`}
            />
            Обнови
          </Button>
        </div>

        {loadingLogs ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-xs font-light text-zinc-500">
                Няма намерени записи.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 sm:p-3.5 md:flex-row md:items-center md:justify-between dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {log.action}
                    </span>
                    <span className="text-xs text-zinc-500">{log.details}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {log.userEmail}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {typeof log.timestamp === "number"
                        ? format(
                            new Date(log.timestamp),
                            "dd MMM yyyy, HH:mm",
                            {
                              locale: bg,
                            }
                          )
                        : log.timestamp}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </BentoCard>
    </div>
  );
}
