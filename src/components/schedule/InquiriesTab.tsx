"use client";
/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Archive,
  Calendar,
  CheckCircle2,
  Edit3,
  HelpCircle,
  Inbox,
  Loader2,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  Undo2,
  UserCheck,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EditInquiryDialog } from "@/components/schedule/EditInquiryDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/store/use-app-store";
import { EventInquiry, InquiryStatus } from "@/types/inquiry.types";

const statusConfig: Record<
  InquiryStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  new: {
    label: "Ново",
    bg: "bg-rose-500/10",
    text: "text-rose-500 dark:text-rose-400",
    border: "border-rose-500/20",
  },
  contacted: {
    label: "Свързан",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  enrolled: {
    label: "Записан",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  archived: {
    label: "Архивиран",
    bg: "bg-zinc-500/10",
    text: "text-zinc-500 dark:text-zinc-400",
    border: "border-zinc-500/20",
  },
};

const levelLabels: Record<string, string> = {
  beginner: "Начинаещ",
  intermediate: "Средно ниво",
  advanced: "Напреднал",
};

interface InquiriesTabProps {
  onNewCountChange?: (count: number) => void;
}

export function InquiriesTab({ onNewCountChange }: InquiriesTabProps) {
  const { idToken } = useAuth();
  const { activeBranch } = useAppStore();
  const isRecovery = activeBranch === "recoveryzone";
  const siteId = isRecovery ? "recoveryzone" : "all";

  const [inquiries, setInquiries] = useState<EventInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "all">(
    "all"
  );
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "bkgalabovo" | "recoveryzone"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Edit & Delete modal states
  const [editingInquiry, setEditingInquiry] = useState<EventInquiry | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingInquiry, setDeletingInquiry] = useState<EventInquiry | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStatusHelp, setShowStatusHelp] = useState(false);

  const fetchInquiries = async () => {
    if (!idToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/inquiries?siteId=${siteId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.inquiries)) {
        setInquiries(data.inquiries);
        const newCount = data.inquiries.filter(
          (inq: EventInquiry) => inq.status === "new"
        ).length;
        onNewCountChange?.(newCount);
      } else {
        toast.error(data.error || "Грешка при зареждане на запитванията.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Неуспешна връзка със сървъра.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idToken, siteId]);

  const handleUpdateStatus = async (id: string, newStatus: InquiryStatus) => {
    if (!idToken) return;
    setUpdatingId(id);
    try {
      const res = await fetch("/api/inquiries", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setInquiries((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item
          )
        );
        toast.success(
          `Статусът е променен на "${statusConfig[newStatus].label}".`
        );

        // Recalculate new count
        const updatedNewCount = inquiries
          .map((item) =>
            item.id === id ? { ...item, status: newStatus } : item
          )
          .filter((i) => i.status === "new").length;
        onNewCountChange?.(updatedNewCount);
      } else {
        const d = await res.json();
        toast.error(d.error || "Грешка при обновяване.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Неуспешно обновяване на статуса.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteInquiry = async () => {
    if (!deletingInquiry?.id || !idToken) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/inquiries?id=${deletingInquiry.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (res.ok) {
        setInquiries((prev) => prev.filter((i) => i.id !== deletingInquiry.id));
        toast.success("Запитването беше изтрито успешно.");
        const updatedNewCount = inquiries
          .filter((i) => i.id !== deletingInquiry.id)
          .filter((i) => i.status === "new").length;
        onNewCountChange?.(updatedNewCount);
        setIsDeleteDialogOpen(false);
        setDeletingInquiry(null);
      } else {
        const d = await res.json();
        toast.error(d.error || "Грешка при изтриване на запитването.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Неуспешна връзка при изтриване.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      if (!isRecovery && sourceFilter !== "all") {
        if (sourceFilter === "recoveryzone" && inq.siteId !== "recoveryzone")
          return false;
        if (sourceFilter === "bkgalabovo" && inq.siteId === "recoveryzone")
          return false;
      }
      if (statusFilter !== "all" && inq.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = inq.name.toLowerCase().includes(query);
        const matchesPhone = inq.phone.includes(query);
        const matchesEvent = inq.eventTitle.toLowerCase().includes(query);
        const matchesProc = (inq.procedureName || "")
          .toLowerCase()
          .includes(query);
        return matchesName || matchesPhone || matchesEvent || matchesProc;
      }
      return true;
    });
  }, [inquiries, statusFilter, sourceFilter, searchQuery, isRecovery]);

  const newInquiriesCount = inquiries.filter((i) => i.status === "new").length;
  const clubCount = inquiries.filter((i) => i.siteId !== "recoveryzone").length;
  const recoveryCount = inquiries.filter(
    (i) => i.siteId === "recoveryzone"
  ).length;

  return (
    <div className="space-y-6">
      {/* Status Explanation Banner / Toggle */}
      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-4 text-emerald-500" />
            <span className="text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200">
              Ръководство за статусите на запитванията
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowStatusHelp(!showStatusHelp)}
            className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {showStatusHelp
              ? "Скрий разясненията"
              : "Какво означават СВЪРЗАН и ЗАПИСАН?"}
          </button>
        </div>

        {showStatusHelp && (
          <div className="mt-3 grid grid-cols-1 gap-3 border-t border-zinc-200/60 pt-3 text-xs sm:grid-cols-2 lg:grid-cols-4 dark:border-zinc-800">
            <div className="rounded-xl bg-white p-3 shadow-2xs dark:bg-zinc-950">
              <div className="flex items-center gap-1.5 font-bold text-rose-500">
                <span className="size-2 rounded-full bg-rose-500" />
                <span>НОВО</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Току-що изпратено запитване от клиент през сайта. Очаква първи
                контакт или телефонно обаждане от екипа.
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 shadow-2xs dark:bg-zinc-950">
              <div className="flex items-center gap-1.5 font-bold text-amber-500">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>СВЪРЗАН</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Екипът се е свързал с клиента по телефона/чат. Проведен е
                разговор и са обсъдени свободните часове и детайли.
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 shadow-2xs dark:bg-zinc-950">
              <div className="flex items-center gap-1.5 font-bold text-emerald-500">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>ЗАПИСАН</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Клиентът е потвърдил и е окончателно записан в графика за час
                или тренировка. Участието е потвърдено.
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 shadow-2xs dark:bg-zinc-950">
              <div className="flex items-center gap-1.5 font-bold text-zinc-500">
                <span className="size-2 rounded-full bg-zinc-400" />
                <span>АРХИВ</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Приключило, отминало или отложено запитване, преместено за
                отчетност, без да задръства активния списък.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Source/Branch Filter (Visible only when Club Admin views all) */}
      {!isRecovery && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <span className="mr-2 text-xs font-extrabold tracking-wider text-zinc-500 uppercase">
            Източник на запитването:
          </span>
          <button
            type="button"
            onClick={() => setSourceFilter("all")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              sourceFilter === "all"
                ? "bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            }`}
          >
            <span>Всички запитвания</span>
            <span className="py-0.2 rounded-full bg-zinc-200 px-1.5 text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {inquiries.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter("bkgalabovo")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              sourceFilter === "bkgalabovo"
                ? "bg-blue-600 text-white shadow-xs"
                : "border border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
            }`}
          >
            <span>🏸 БК Гълъбово</span>
            <span className="py-0.2 rounded-full bg-blue-100 px-1.5 text-[10px] text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {clubCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter("recoveryzone")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              sourceFilter === "recoveryzone"
                ? "bg-emerald-600 text-white shadow-xs"
                : "border border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
            }`}
          >
            <span>🌿 Recovery Zone by ZM</span>
            <span className="py-0.2 rounded-full bg-emerald-100 px-1.5 text-[10px] text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              {recoveryCount}
            </span>
          </button>
        </div>
      )}

      {/* Top Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "all", label: "Всички", count: inquiries.length },
            { key: "new", label: "Нови", count: newInquiriesCount },
            {
              key: "contacted",
              label: "Свързан",
              count: inquiries.filter((i) => i.status === "contacted").length,
            },
            {
              key: "enrolled",
              label: "Записан",
              count: inquiries.filter((i) => i.status === "enrolled").length,
            },
            {
              key: "archived",
              label: "Архив",
              count: inquiries.filter((i) => i.status === "archived").length,
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                statusFilter === item.key
                  ? "bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`py-0.2 rounded-full px-1.5 text-[10px] ${
                  item.key === "new" && item.count > 0
                    ? "bg-rose-500 text-white"
                    : statusFilter === item.key
                      ? "bg-zinc-800 text-zinc-300 dark:bg-zinc-200 dark:text-zinc-800"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right side search + refresh */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="inquiries-search-input"
              name="inquiries-search-input"
              placeholder="Търси име, телефон, събитие..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-xl pl-9 text-xs"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchInquiries}
            disabled={isLoading}
            className="size-10 shrink-0 rounded-xl"
            title="Опресни"
          >
            <RefreshCw
              className={`size-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Inquiries List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="mt-3 text-xs tracking-wider uppercase">
            Зареждане на запитванията...
          </p>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 py-16 text-center dark:border-zinc-800">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-900">
            <Inbox className="size-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
            Няма намерени запитвания
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {statusFilter !== "all"
              ? "Няма запитвания с избран статус."
              : "Все още няма изпратени запитвания от уебсайта."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredInquiries.map((inq) => {
            const config = statusConfig[inq.status] || statusConfig.new;
            const isUpdating = updatingId === inq.id;

            return (
              <Card
                key={inq.id}
                className="overflow-hidden rounded-3xl border-zinc-200 bg-white transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                <CardContent className="p-6">
                  {/* Card Header: Event Title + Status Badge & Source Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${
                            inq.siteId === "recoveryzone"
                              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          }`}
                        >
                          {inq.siteId === "recoveryzone"
                            ? "🌿 Recovery Zone"
                            : "🏸 БК Гълъбово"}
                        </span>
                        <span
                          className={`text-[10px] font-semibold text-zinc-400 uppercase`}
                        >
                          {inq.siteId === "recoveryzone"
                            ? "Процедура"
                            : "Тренировка/Събитие"}
                        </span>
                      </div>
                      <h4 className="mt-1 text-base font-bold text-zinc-900 dark:text-white">
                        {inq.procedureName || inq.eventTitle}
                      </h4>
                      {(inq.eventDate || inq.preferredTimeSlot) && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                          <Calendar
                            className={`size-3 ${inq.siteId === "recoveryzone" ? "text-emerald-600" : "text-primary"}`}
                          />
                          <span>{inq.eventDate || inq.preferredTimeSlot}</span>
                          {inq.eventTime && <span>• {inq.eventTime}</span>}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${config.bg} ${config.text} ${config.border}`}
                      >
                        {config.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingInquiry(inq);
                          setIsEditDialogOpen(true);
                        }}
                        className="size-8 rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        title="Редактирай запитване"
                      >
                        <Edit3 className="size-4 text-blue-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Candidate Details */}
                  <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 text-xs sm:grid-cols-2 dark:border-zinc-900 dark:bg-zinc-900/50">
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                        {inq.siteId === "recoveryzone" ? "Клиент" : "Кандидат"}
                      </span>
                      <p className="mt-0.5 font-bold text-zinc-900 dark:text-white">
                        {inq.name}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {inq.siteId === "recoveryzone"
                          ? inq.goal
                            ? `Цел: ${inq.goal}`
                            : "Възстановителна процедура"
                          : inq.target === "child"
                            ? `За дете${inq.childAge ? ` (${inq.childAge})` : ""}`
                            : "За възрастен / любител"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                        Телефон за връзка
                      </span>
                      <div className="mt-0.5 flex items-center gap-2">
                        <a
                          href={`tel:${inq.phone.replace(/\s+/g, "")}`}
                          className="font-bold text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {inq.phone}
                        </a>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        {inq.siteId === "recoveryzone"
                          ? inq.preferredTimeSlot
                            ? `Час: ${inq.preferredTimeSlot}`
                            : inq.preferredZone
                              ? `Зона: ${inq.preferredZone}`
                              : ""
                          : inq.level
                            ? `Ниво: ${levelLabels[inq.level] || inq.level}`
                            : ""}
                      </p>
                    </div>
                  </div>

                  {/* Notes / Questions if present */}
                  {inq.notes && (
                    <div className="mt-3 rounded-xl bg-zinc-100/70 p-3 text-xs text-zinc-700 italic dark:bg-zinc-900 dark:text-zinc-300">
                      <span className="font-semibold text-zinc-500 not-italic">
                        Въпрос/Бележка:{" "}
                      </span>
                      &quot;{inq.notes}&quot;
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-900">
                    <span className="text-[11px] text-zinc-400">
                      Получено:{" "}
                      {new Date(inq.createdAt).toLocaleDateString("bg-BG")} в{" "}
                      {new Date(inq.createdAt).toLocaleTimeString("bg-BG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      ч.
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <a
                        href={`tel:${inq.phone.replace(/\s+/g, "")}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                        title="Обаждане по телефон"
                      >
                        <Phone className="size-3.5 text-emerald-500" />
                        <span>Обади се</span>
                      </a>

                      {/* Quick Status Toggles */}
                      {inq.status === "new" && (
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={() =>
                            handleUpdateStatus(inq.id!, "contacted")
                          }
                          className="h-9 rounded-xl bg-amber-500/15 text-xs font-bold text-amber-700 hover:bg-amber-500/25 dark:text-amber-300"
                          title="Отбележи като свързан с клиента"
                        >
                          <CheckCircle2 className="mr-1 size-3.5" />
                          Свързан
                        </Button>
                      )}

                      {inq.status === "contacted" && (
                        <>
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() =>
                              handleUpdateStatus(inq.id!, "enrolled")
                            }
                            className="h-9 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500"
                            title="Потвърди записването на клиента"
                          >
                            <UserCheck className="mr-1 size-3.5" />
                            Записан
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(inq.id!, "new")}
                            className="h-9 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                            title="Върни статус в Ново"
                          >
                            <Undo2 className="mr-1 size-3.5" />В Ново
                          </Button>
                        </>
                      )}

                      {inq.status === "enrolled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isUpdating}
                          onClick={() =>
                            handleUpdateStatus(inq.id!, "contacted")
                          }
                          className="h-9 rounded-xl text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:text-amber-400"
                          title="Върни статус в Свързан"
                        >
                          <Undo2 className="mr-1 size-3.5" />В Свързан
                        </Button>
                      )}

                      {/* Archive / Unarchive */}
                      {inq.status !== "archived" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isUpdating}
                          onClick={() =>
                            handleUpdateStatus(inq.id!, "archived")
                          }
                          className="h-9 rounded-xl text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          title="Премести в архив"
                        >
                          <Archive className="size-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(inq.id!, "new")}
                          className="h-9 rounded-xl text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          title="Върни в активни (Нови)"
                        >
                          <Undo2 className="mr-1 size-3.5" />
                          Върни
                        </Button>
                      )}

                      {/* Delete Action */}
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isUpdating}
                        onClick={() => {
                          setDeletingInquiry(inq);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="size-9 rounded-xl text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400"
                        title="Изтрий запитването постоянно"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Inquiry Modal */}
      <EditInquiryDialog
        inquiry={editingInquiry}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingInquiry(null);
        }}
        onSaved={(updated) => {
          setInquiries((prev) =>
            prev.map((i) => (i.id === updated.id ? updated : i))
          );
          const updatedNewCount = inquiries
            .map((i) => (i.id === updated.id ? updated : i))
            .filter((i) => i.status === "new").length;
          onNewCountChange?.(updatedNewCount);
        }}
        idToken={idToken}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на запитване</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате постоянно да изтриете запитването от{" "}
              <strong className="text-zinc-900 dark:text-white">
                {deletingInquiry?.name}
              </strong>{" "}
              за{" "}
              <strong className="text-zinc-900 dark:text-white">
                {deletingInquiry?.eventTitle || deletingInquiry?.procedureName}
              </strong>
              ?
              <br />
              <br />
              <span className="text-rose-500">
                Внимание: Това действие е окончателно и запитването няма да може
                да бъде възстановено.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInquiry}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isDeleting ? "Изтриване..." : "Изтрий запитването"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
