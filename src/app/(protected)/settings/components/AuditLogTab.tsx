import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { Loader2, RefreshCw, Shield } from "lucide-react";

import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/use-settings-store";

export function AuditLogTab() {
  const { auditLogs, fetchLogs, loadingLogs } = useSettingsStore();

  return (
    <div className="grid grid-cols-1 gap-6">
      <BentoCard className="space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="size-5 text-indigo-500" strokeWidth={1.5} />
            <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
              История на промените
            </h3>
          </div>
          <Button
            variant="outline"
            onClick={fetchLogs}
            disabled={loadingLogs}
            className="h-10 rounded-xl px-4 text-xs font-medium tracking-widest uppercase"
          >
            <RefreshCw
              className={`mr-2 size-4 ${loadingLogs ? "animate-spin" : ""}`}
            />
            Обнови
          </Button>
        </div>

        {loadingLogs ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.length === 0 ? (
              <p className="text-sm font-light text-zinc-500">
                Няма намерени записи.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 md:flex-row md:items-center md:justify-between dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {log.action}
                    </span>
                    <span className="text-xs text-zinc-500">{log.details}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
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
