"use client";

import { ArrowRight, CheckCircle2, Clock, Inbox, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppStore } from "@/store/use-app-store";
import { EventInquiry } from "@/types/inquiry.types";

export function InquiriesNotificationCard() {
  const router = useRouter();
  const { activeBranch } = useAppStore();
  const isRecovery = activeBranch === "recoveryzone";
  const siteId = isRecovery ? "recoveryzone" : "all";

  const [inquiries, setInquiries] = useState<EventInquiry[]>([]);

  const fetchInquiries = useCallback(async () => {
    try {
      const res = await fetch(`/api/inquiries?siteId=${siteId}`);
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
      }
    } catch {
      // silently handle
    }
  }, [siteId]);

  useEffect(() => {
    fetchInquiries();
    const interval = setInterval(fetchInquiries, 45000);
    return () => clearInterval(interval);
  }, [fetchInquiries]);

  const stats = useMemo(() => {
    const total = inquiries.length;
    const newItems = inquiries.filter((i) => i.status === "new");
    const contacted = inquiries.filter((i) => i.status === "contacted").length;
    const enrolled = inquiries.filter((i) => i.status === "enrolled").length;
    const archived = inquiries.filter((i) => i.status === "archived").length;

    const clubInquiries = inquiries.filter((i) => i.siteId !== "recoveryzone");
    const recoveryInquiries = inquiries.filter(
      (i) => i.siteId === "recoveryzone"
    );

    const clubNewCount = clubInquiries.filter((i) => i.status === "new").length;
    const recoveryNewCount = recoveryInquiries.filter(
      (i) => i.status === "new"
    ).length;

    return {
      total,
      newCount: newItems.length,
      newItems,
      contacted,
      enrolled,
      archived,
      clubTotal: clubInquiries.length,
      recoveryTotal: recoveryInquiries.length,
      clubNewCount,
      recoveryNewCount,
    };
  }, [inquiries]);

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-zinc-200/70 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`relative flex size-9 items-center justify-center rounded-xl ${
                isRecovery
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                  : "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
              }`}
            >
              <Inbox className="size-4.5" strokeWidth={2.2} />
              {stats.newCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-900 uppercase dark:text-zinc-100">
                {isRecovery ? "Запитвания за сесии" : "Запитвания от сайта"}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {isRecovery
                  ? "Recovery Zone by ZM"
                  : "Управление & Бизнес Център (Клуб + Зона)"}
              </p>
            </div>
          </div>

          <div>
            {stats.newCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-extrabold text-white">
                {stats.newCount} {stats.newCount === 1 ? "ново" : "нови"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Обработени
              </span>
            )}
          </div>
        </div>

        {/* Breakdown for Club Admin to distinguish between Club & Recovery Zone */}
        {!isRecovery && (
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-1.5 dark:border-blue-900/40 dark:bg-blue-950/30">
              <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                🏸 БК Гълъбово:
              </span>
              <span className="font-extrabold text-blue-900 dark:text-blue-200">
                {stats.clubNewCount > 0
                  ? `${stats.clubNewCount} нови`
                  : `${stats.clubTotal} общо`}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-1.5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                🌿 Релакс зона:
              </span>
              <span className="font-extrabold text-emerald-900 dark:text-emerald-200">
                {stats.recoveryNewCount > 0
                  ? `${stats.recoveryNewCount} нови`
                  : `${stats.recoveryTotal} общо`}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        {stats.newCount > 0 ? (
          <div className="custom-scrollbar max-h-64 space-y-2 overflow-y-auto pr-1">
            {stats.newItems.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push("/inquiries")}
                className="group flex cursor-pointer flex-col gap-1.5 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 transition-colors hover:border-amber-400 dark:border-zinc-800 dark:bg-zinc-800/40"
              >
                {!isRecovery && (
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase ${
                        item.siteId === "recoveryzone"
                          ? "border border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                          : "border border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                      }`}
                    >
                      {item.siteId === "recoveryzone"
                        ? "🌿 Recovery Zone"
                        : "🏸 БК Гълъбово"}
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </p>
                    <p className="text-[11px] font-medium text-amber-800 dark:text-amber-400">
                      {item.procedureName || item.eventTitle}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-amber-500 transition-transform group-hover:translate-x-0.5" />
                </div>

                <div className="flex items-center justify-between border-t border-amber-100/70 pt-1.5 text-[10px] text-zinc-500 dark:border-zinc-800">
                  <a
                    href={`tel:${item.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    <Phone className="size-3" />
                    <span>{item.phone}</span>
                  </a>

                  <span className="flex items-center gap-1 text-zinc-400">
                    <Clock className="size-3" />
                    {new Date(item.createdAt).toLocaleDateString("bg-BG", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="size-4.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Няма нови чакащи запитвания
              </p>
              <p className="text-[11px] text-zinc-400">
                {isRecovery
                  ? "Всички получени онлайн заявки за възстановяване са обработени"
                  : "Всички получени онлайн заявки са обработени"}
              </p>
            </div>
          </div>
        )}

        {/* Status Counter Pills */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px]">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {stats.total}
            </span>
            <span className="text-[9px] font-semibold text-zinc-400 uppercase">
              Всички
            </span>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="block text-xs font-bold text-amber-600 dark:text-amber-400">
              {stats.contacted}
            </span>
            <span className="text-[9px] font-semibold text-zinc-400 uppercase">
              Свързан
            </span>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {stats.enrolled}
            </span>
            <span className="text-[9px] font-semibold text-zinc-400 uppercase">
              Записан
            </span>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="block text-xs font-bold text-zinc-500 dark:text-zinc-400">
              {stats.archived}
            </span>
            <span className="text-[9px] font-semibold text-zinc-400 uppercase">
              Архив
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <Link
          href="/inquiries"
          className="group flex items-center justify-between text-xs font-semibold text-zinc-600 transition-colors hover:text-primary dark:text-zinc-400 dark:hover:text-white"
        >
          <span>
            {isRecovery
              ? "Към регистъра на запитванията (Релакс зона)"
              : "Към регистъра на запитванията"}
          </span>
          <ArrowRight className="size-4 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>
      </div>
    </div>
  );
}
