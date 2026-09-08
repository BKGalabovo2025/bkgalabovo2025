"use client";

import {
  AlertCircle,
  Calendar,
  Clock,
  Database,
  Download,
  FileJson,
  HardDriveDownload,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";

interface BackupItem {
  backupId: string;
  timestamp: string;
  sofiaTime?: string;
  siteId?: string;
  stats?: Record<string, number>;
  createdAt?: string;
}

function formatBackupTime(item?: BackupItem): string {
  if (!item) return "Няма данни";
  if (item.sofiaTime) return item.sofiaTime;
  if (item.createdAt) {
    return new Date(item.createdAt).toLocaleString("bg-BG");
  }
  return item.backupId || "Няма данни";
}

function renderStatsBadges(stats?: Record<string, number>) {
  if (!stats) {
    return <span>Няма статистика</span>;
  }
  const activeEntries = Object.entries(stats).filter(([, count]) => count > 0);
  if (activeEntries.length === 0) {
    return <span>0 записа</span>;
  }
  const topFive = activeEntries.slice(0, 5);
  const remainingCount = activeEntries.length - 5;

  return (
    <>
      {topFive.map(([name, count]) => (
        <span
          key={name}
          className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800"
        >
          {name}: {count}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-zinc-400">+ още {remainingCount}</span>
      )}
    </>
  );
}

export function BackupTab() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/backup/download?list=true", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error("Грешка при зареждане на списъка с бекъпи.");
      }
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (err) {
      console.error(err);
      toast.error("Неуспешно зареждане на историята на бекъпите.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleManualBackup = async () => {
    setTriggering(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/cron/backup", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Неуспешен бекъп.");
      }

      const result = await res.json();
      toast.success(
        `Бекъпът завърши успешно! Запазени ${result.totalRecords || 0} записа.`,
        {
          duration: 5000,
        }
      );
      await fetchBackups();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Грешка при бекъп";
      toast.error(msg);
    } finally {
      setTriggering(false);
    }
  };

  const handleDownload = async (backupId = "latest") => {
    setDownloadingId(backupId);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(
        `/api/admin/backup/download?backupId=${encodeURIComponent(backupId)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Грешка при изтегляне на архива.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bkgalabovo_backup_${backupId === "latest" ? "latest" : backupId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Архивът беше изтеглен успешно.");
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Грешка при сваляне";
      toast.error(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  const latestBackup = backups[0];
  const totalLatestRecords = latestBackup?.stats
    ? Object.values(latestBackup.stats).reduce((a, b) => a + b, 0)
    : 0;

  const renderHistoryContent = () => {
    if (loading) {
      return (
        <div className="flex h-44 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      );
    }

    if (backups.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
          <AlertCircle className="size-8 text-zinc-400" />
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Все още няма създадени архиви.
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Натиснете бутона „Направи архив сега“ или изчакайте полунощ за
            първото автоматично изпълнение.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-zinc-100 dark:border-zinc-800">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
            <TableRow className="border-zinc-100 dark:border-zinc-800">
              <TableHead className="text-[11px] font-medium tracking-wider uppercase">
                Идентификатор / Дата (София)
              </TableHead>
              <TableHead className="text-[11px] font-medium tracking-wider uppercase">
                Записи
              </TableHead>
              <TableHead className="text-[11px] font-medium tracking-wider uppercase">
                Детайли по колекции
              </TableHead>
              <TableHead className="text-right text-[11px] font-medium tracking-wider uppercase">
                Действие
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backups.map((item) => {
              const total = item.stats
                ? Object.values(item.stats).reduce((a, b) => a + b, 0)
                : 0;

              return (
                <TableRow
                  key={item.backupId}
                  className="border-zinc-100 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:bg-zinc-900/30"
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {formatBackupTime(item)}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-400">
                        {item.backupId}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      {total} общо
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="flex max-w-md flex-wrap gap-1.5 text-[11px] text-zinc-500">
                      {renderStatsBadges(item.stats)}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(item.backupId)}
                      disabled={downloadingId === item.backupId}
                      className="h-8 rounded-lg px-3 text-xs"
                    >
                      {downloadingId === item.backupId ? (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 size-3.5" />
                      )}
                      Свали (.json)
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* 1. Status & Overview */}
      <BentoCard className="space-y-6 border-zinc-100 bg-white p-8 md:p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Database className="size-6" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                  Автоматичен Резервен Архив (Бекъп)
                </h3>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400"
                >
                  <span className="mr-1.5 inline-block size-2 animate-pulse rounded-full bg-emerald-500" />
                  Активен (00:00 ч.)
                </Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Защита на клубните данни чрез ежедневен пълен експорт в Vercel
                Cloud.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleDownload("latest")}
              disabled={downloadingId !== null || backups.length === 0}
              className="h-11 rounded-xl border-zinc-200 px-5 text-xs font-medium tracking-wider uppercase transition-all hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              {downloadingId === "latest" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <HardDriveDownload className="mr-2 size-4 text-primary" />
              )}
              Свали последен архив
            </Button>

            <Button
              onClick={handleManualBackup}
              disabled={triggering}
              className="h-11 rounded-xl bg-primary px-6 text-xs font-medium tracking-wider text-white uppercase shadow-none hover:bg-primary/90"
            >
              {triggering ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              {triggering ? "Архивиране..." : "Направи архив сега"}
            </Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5 dark:border-zinc-800/40 dark:bg-zinc-900/40">
            <div className="flex items-center gap-3 text-zinc-500">
              <Clock className="size-4" />
              <span className="text-xs font-medium tracking-wider uppercase">
                График на изпълнение
              </span>
            </div>
            <p className="mt-2 text-lg font-medium text-zinc-900 dark:text-white">
              Всеки ден в 00:00 ч.
            </p>
            <p className="text-[11px] text-zinc-400">
              Българско време (21:00 UTC чрез Vercel Cron)
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5 dark:border-zinc-800/40 dark:bg-zinc-900/40">
            <div className="flex items-center gap-3 text-zinc-500">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span className="text-xs font-medium tracking-wider uppercase">
                Последен успешен архив
              </span>
            </div>
            <p className="mt-2 text-lg font-medium text-zinc-900 dark:text-white">
              {formatBackupTime(latestBackup)}
            </p>
            <p className="text-[11px] text-zinc-400">
              {latestBackup
                ? `${totalLatestRecords} общо съхранени записа`
                : "Очаква първи автоматичен цикъл"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5 dark:border-zinc-800/40 dark:bg-zinc-900/40">
            <div className="flex items-center gap-3 text-zinc-500">
              <FileJson className="size-4 text-amber-500" />
              <span className="text-xs font-medium tracking-wider uppercase">
                Формат и съхранение
              </span>
            </div>
            <p className="mt-2 text-lg font-medium text-zinc-900 dark:text-white">
              Структуриран JSON
            </p>
            <p className="text-[11px] text-zinc-400">
              100% съвместим за възстановяване във всяка система
            </p>
          </div>
        </div>
      </BentoCard>

      {/* 2. History Table */}
      <BentoCard className="space-y-6 border-zinc-100 bg-white p-8 md:p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="size-5 text-primary" strokeWidth={1.5} />
            <h4 className="text-xl font-light text-zinc-900 dark:text-white">
              История на архивите
            </h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBackups}
            disabled={loading}
            className="h-9 px-3 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <RefreshCw
              className={`mr-2 size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Презареди
          </Button>
        </div>

        {renderHistoryContent()}
      </BentoCard>
    </div>
  );
}
