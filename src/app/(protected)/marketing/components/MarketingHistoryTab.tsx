"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  History,
  Inbox,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarketingLog, MarketingStats } from "@/types/marketing.types";

interface Props {
  history: MarketingLog[];
  stats: MarketingStats;
  onDeleteLog: (id: string) => Promise<void>;
  onClearHistory?: () => Promise<void>;
}

export function MarketingHistoryTab({
  history,
  stats,
  onDeleteLog,
  onClearHistory,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<MarketingLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string, recipientName: string) => {
    if (
      window.confirm(
        `Сигурни ли сте, че искате да изтриете това изпратено съобщение за ${recipientName} от базата данни?`
      )
    ) {
      setIsDeleting(true);
      try {
        await onDeleteLog(id);
        if (selectedLog?.id === id) {
          setSelectedLog(null);
        }
        toast.success("Записът беше изтрит успешно от базата данни!");
      } catch (e) {
        console.error("Error deleting log:", e);
        toast.error("Възникна грешка при изтриването на записа.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleClearAll = async () => {
    if (
      onClearHistory &&
      window.confirm(
        "ВНИМАНИЕ: Сигурни ли сте, че искате да изчистите ЦЯЛАТА история на съобщенията от базата данни?"
      )
    ) {
      setIsDeleting(true);
      try {
        await onClearHistory();
        if (selectedLog) setSelectedLog(null);
        toast.success("Цялата история беше изчистена успешно!");
      } catch (e) {
        console.error("Error clearing history:", e);
        toast.error("Възникна грешка при изчистването на историята.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter((log) => {
      if (channelFilter !== "all" && log.channel !== channelFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = log.recipientName?.toLowerCase().includes(q);
        const matchesPhone = log.recipientPhone?.toLowerCase().includes(q);
        const matchesEmail = log.recipientEmail?.toLowerCase().includes(q);
        const matchesText = log.messageText?.toLowerCase().includes(q);
        const matchesTemplate = log.templateUsed?.toLowerCase().includes(q);
        return (
          matchesName ||
          matchesPhone ||
          matchesEmail ||
          matchesText ||
          matchesTemplate
        );
      }
      return true;
    });
  }, [history, searchQuery, channelFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Top KPI Analytics Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Sent */}
        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Общо изпратени
              </span>
              <div className="text-2xl font-black text-zinc-900 dark:text-white">
                {stats.totalSent}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Send className="size-5" />
            </div>
          </div>
        </Card>

        {/* Sent This Month */}
        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Изпратени този месец
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.sentThisMonth}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Clock className="size-5" />
            </div>
          </div>
        </Card>

        {/* Active Recipients */}
        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Уникални получатели
              </span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {stats.activeRecipientsCount}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              <Users className="size-5" />
            </div>
          </div>
        </Card>

        {/* Channels Breakdown */}
        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-2">
            <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Разпределение по канали
            </span>
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className="rounded-lg border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
              >
                WA: {stats.byChannel?.whatsapp || 0}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-lg border-purple-200 bg-purple-50 text-[10px] font-bold text-purple-800 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300"
              >
                Viber: {stats.byChannel?.viber || 0}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-lg border-blue-200 bg-blue-50 text-[10px] font-bold text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
              >
                SMS: {stats.byChannel?.sms || 0}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-lg border-rose-200 bg-rose-50 text-[10px] font-bold text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
              >
                Email: {stats.byChannel?.email || 0}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xs sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Търсене по име на родител, телефон или текст..."
            className="h-10 rounded-xl pl-9 text-xs"
          />
        </div>

        {/* Channel Filter & Clear actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="h-10 w-44 rounded-xl text-xs font-semibold">
              <SelectValue placeholder="Всички канали" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">🌟 Всички канали</SelectItem>
              <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
              <SelectItem value="viber">📱 Viber</SelectItem>
              <SelectItem value="sms">✉️ SMS</SelectItem>
              <SelectItem value="email">📧 Email</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || channelFilter !== "all") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setChannelFilter("all");
              }}
              className="h-10 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              <X className="mr-1 size-3.5" />
              Изчисти филтрите
            </Button>
          )}

          {history.length > 0 && onClearHistory && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={isDeleting}
              className="h-10 rounded-xl border border-rose-200 bg-rose-50/50 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
              title="Изчисти цялата история от базата данни"
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Изчисти историята
            </Button>
          )}
        </div>
      </div>

      {/* 3. History List */}
      {filteredHistory.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/70 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <Inbox className="mx-auto mb-3 size-10 text-zinc-300 dark:text-zinc-700" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            Няма намерени съобщения в историята
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500">
            {searchQuery || channelFilter !== "all"
              ? "Опитайте да промените критериите за търсене."
              : "Когато изпратите съобщения от таб „Бързо изпращане“, записите ще се появят тук."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((log) => {
            const formattedDate = format(
              new Date(log.sentAt),
              "dd MMM yyyy, HH:mm ч.",
              { locale: bg }
            );

            return (
              <Card
                key={log.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs transition-all hover:border-indigo-200 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1 space-y-1.5">
                    {/* Header line: Channel Badge + Date */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 rounded-lg border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold text-zinc-700 uppercase dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {log.channel === "whatsapp" && (
                          <MessageCircle className="size-3 text-emerald-600" />
                        )}
                        {log.channel === "viber" && (
                          <Phone className="size-3 text-purple-600" />
                        )}
                        {log.channel === "sms" && (
                          <MessageSquare className="size-3 text-blue-600" />
                        )}
                        {log.channel === "email" && (
                          <Mail className="size-3 text-rose-600" />
                        )}
                        <span>{log.channel}</span>
                      </Badge>

                      <Badge className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="mr-1 size-3" />
                        Изпратено
                      </Badge>

                      <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <Calendar className="size-3 text-zinc-400" />
                        {formattedDate}
                      </span>
                    </div>

                    {/* Recipient info & Template Used */}
                    <div className="flex flex-wrap items-center gap-2 text-sm font-black text-zinc-900 dark:text-white">
                      <span>{log.recipientName}</span>
                      {log.recipientPhone && (
                        <span className="text-xs font-semibold text-zinc-400">
                          ({log.recipientPhone})
                        </span>
                      )}
                      {log.templateUsed && (
                        <Badge
                          variant="secondary"
                          className="rounded-md text-[10px] font-semibold text-indigo-700 dark:text-indigo-300"
                        >
                          {log.templateUsed}
                        </Badge>
                      )}
                    </div>

                    {/* Message snippet */}
                    <p className="line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {log.messageText}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Eye className="mr-1.5 size-3.5 text-indigo-600 dark:text-indigo-400" />
                      Пълен текст
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => handleDelete(log.id, log.recipientName)}
                      className="size-8 rounded-lg p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                      title="Изтрий от историята"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-md rounded-3xl p-6">
          {selectedLog && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <History className="size-4.5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-black text-zinc-950 dark:text-white">
                      Детайли на изпратеното съобщение
                    </DialogTitle>
                    <span className="text-xs text-zinc-500">
                      До: {selectedLog.recipientName} (
                      {selectedLog.recipientPhone ||
                        selectedLog.recipientEmail ||
                        "Няма контакт"}
                      )
                    </span>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-zinc-500">Канал:</span>
                  <strong className="text-zinc-800 uppercase dark:text-zinc-200">
                    {selectedLog.channel}
                  </strong>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Пълен текст:
                  </span>
                  <div className="max-h-60 overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 text-xs leading-relaxed whitespace-pre-wrap dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                    {selectedLog.messageText}
                  </div>
                </div>

                {/* Delete button directly inside dialog */}
                <div className="flex justify-end border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() =>
                      handleDelete(selectedLog.id, selectedLog.recipientName)
                    }
                    className="rounded-xl bg-rose-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    Изтрий от базата данни
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
