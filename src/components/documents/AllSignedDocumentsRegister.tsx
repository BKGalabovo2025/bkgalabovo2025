"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FileSignature,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ViewSignedDocumentDialog } from "@/components/documents/ViewSignedDocumentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { deleteDocumentRequestAction } from "@/lib/actions/document-requests";
import { getAllClubDocumentRequestsAction } from "@/lib/actions/document-templates";
import { getCalendarYearValidity } from "@/lib/document-validity";
import { cn } from "@/lib/utils";
import { DocumentRequest } from "@/types/document-request.types";

export function AllSignedDocumentsRegister() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Signature Preview modal
  const [previewRequest, setPreviewRequest] = useState<DocumentRequest | null>(
    null
  );
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await getAllClubDocumentRequestsAction(idToken);
      if (res.success && res.data) {
        setRequests(res.data);
      } else {
        toast.error(res.error || "Неуспешно зареждане на регистъра.");
      }
    } catch (err: unknown) {
      console.error("Error loading club requests:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Грешка при зареждане на регистъра."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRequests();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleCopyLink = async (req: DocumentRequest) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/sign/${req.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(req.token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleDeleteRequest = async (req: DocumentRequest) => {
    if (!user) {
      toast.error("Не сте оторизиран.");
      return;
    }

    const confirmMsg = `Сигурни ли сте, че искате да ИЗТРИЕТЕ този документ от базата данни?\n\nДокумент: ${req.documentTitle}\nСъстезател: ${req.memberName}\nСтатус: ${req.status}\n\nТова действие ще изтрие записа перманентно от системата!`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(req.id);
    try {
      const idToken = await user.getIdToken();
      const res = await deleteDocumentRequestAction({
        requestId: req.id,
        idToken,
      });

      if (res.success) {
        toast.success("Документът беше успешно изтрит от базата данни.");
        setRequests((prev) => prev.filter((r) => r.id !== req.id));
      } else {
        toast.error(res.error || "Грешка при изтриване на документа.");
      }
    } catch (err: unknown) {
      console.error("Error deleting request:", err);
      toast.error("Възникна грешка при изтриване на записа.");
    } finally {
      setDeletingId(null);
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = requests.length;
    const completed = requests.filter((r) => r.status === "completed").length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, rate };
  }, [requests]);

  // Filtered list
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesStatus =
        selectedStatus === "all" || r.status === selectedStatus;
      const matchesSearch =
        r.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.documentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.parentData?.parentName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (r.parentData?.parentPhone || "").includes(searchQuery);

      return matchesStatus && matchesSearch;
    });
  }, [requests, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">
              Общо документи
            </span>
            <span className="flex size-7 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <FileText className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-950">
            {metrics.total}
          </p>
          <span className="text-[11px] text-zinc-400">
            Всички заявени бланки
          </span>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">
              Подписани онлайн
            </span>
            <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-950">
            {metrics.completed}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium">
            С валиден подпис от родител
          </span>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">
              Очакващи подпис
            </span>
            <span className="flex size-7 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Clock className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-950">
            {metrics.pending}
          </p>
          <span className="text-[11px] text-amber-700 font-medium">
            Активни линкове
          </span>
        </div>

        <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">
              Процент на завършеност
            </span>
            <span className="flex size-7 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-950">
            {metrics.rate}%
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            {/* eslint-disable react/forbid-dom-props */}
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${metrics.rate}%` }}
            />
            {/* eslint-enable react/forbid-dom-props */}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Търсене по състезател, родител, телефон или документ..."
            className="h-11 pl-10 rounded-2xl bg-white border-zinc-200 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950"
          >
            <option value="all">Всички статуси</option>
            <option value="completed">Подписани онлайн</option>
            <option value="pending">Очакващи подпис</option>
            <option value="expired">Изтекли</option>
            <option value="cancelled">Анулирани</option>
          </select>

          <Button
            variant="outline"
            onClick={loadRequests}
            disabled={isLoading}
            className="h-10 rounded-xl text-xs font-semibold"
            title="Презареди регистъра"
          >
            <RefreshCw
              className={cn("size-3.5 mr-1.5", isLoading && "animate-spin")}
            />
            Обнови
          </Button>
        </div>
      </div>

      {/* Register Table */}
      <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 className="size-8 animate-spin text-zinc-400 mb-3" />
            <p className="text-xs text-zinc-500 font-medium">
              Зареждане на регистъра с документи...
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <FileSignature
              className="size-12 text-zinc-300 mb-3"
              strokeWidth={1}
            />
            <h3 className="text-sm font-bold text-zinc-900">
              Няма намерени документи
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Не са открити документи отговарящи на избраните филтри.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="pb-3 pl-2">Състезател</th>
                  <th className="pb-3">Документ & Версия</th>
                  <th className="pb-3">Статус</th>
                  <th className="pb-3">Родител / Подписал</th>
                  <th className="pb-3">Годишна валидност</th>
                  <th className="pb-3">Дата на подпис</th>
                  <th className="pb-3 pr-2 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredRequests.map((req) => {
                  const isCompleted = req.status === "completed";
                  const isPending = req.status === "pending";
                  const validity = getCalendarYearValidity(
                    req.signedAt || req.createdAt
                  );

                  return (
                    <tr
                      key={req.id}
                      className="transition-colors hover:bg-zinc-50/70"
                    >
                      {/* Member */}
                      <td className="py-3.5 pl-2 font-bold text-zinc-900">
                        <Link
                          href={`/members/${req.memberId}?tab=documents`}
                          className="hover:underline flex items-center gap-2"
                        >
                          <span
                            className="flex size-6 select-none items-center justify-center rounded-full bg-zinc-100 text-[10px] text-zinc-700 font-bold"
                            aria-hidden="true"
                          >
                            {req.memberName.charAt(0)}
                          </span>
                          <span>{req.memberName}</span>
                        </Link>
                      </td>

                      {/* Document & Version */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-800">
                            {req.documentTitle}
                          </span>
                          <span className="inline-flex rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-600">
                            v{req.templateVersion || 1}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            Подписан
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            <Clock className="size-3 text-amber-600" />
                            Очаква подпис
                          </span>
                        ) : req.status === "expired" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-500">
                            Изтекъл
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold text-rose-600">
                            Анулиран
                          </span>
                        )}
                      </td>

                      {/* Parent / Signer */}
                      <td className="py-3.5 text-zinc-600">
                        {req.parentData ? (
                          <div>
                            <div className="font-medium text-zinc-900">
                              {req.parentData.parentName}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {req.parentData.parentPhone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">—</span>
                        )}
                      </td>

                      {/* Calendar Year Validity */}
                      <td className="py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold w-fit border",
                              validity.isExpired
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}
                          >
                            <Calendar className="size-3" />
                            {validity.badgeText}
                          </span>
                          {validity.isExpired && (
                            <span className="text-[10px] font-medium text-amber-700">
                              Изисква нова за {validity.currentYear} г.
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 text-zinc-500 text-[11px]">
                        {req.signedAt ? (
                          <div>
                            <span className="font-medium text-emerald-700">
                              {new Date(req.signedAt).toLocaleDateString(
                                "bg-BG"
                              )}
                            </span>
                            <span className="text-zinc-400 ml-1">
                              {new Date(req.signedAt).toLocaleTimeString(
                                "bg-BG",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                        ) : (
                          <span>
                            Изпратен на:{" "}
                            {new Date(req.createdAt).toLocaleDateString(
                              "bg-BG"
                            )}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewRequest(req)}
                            className="h-8 rounded-lg px-2.5 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-950 hover:text-white"
                            title="Пълен преглед на официалния документ, подписи и печат"
                          >
                            <Eye className="size-3.5 mr-1 text-emerald-600" />
                            Преглед
                          </Button>

                          {isPending && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(req)}
                              className="h-8 rounded-lg border-emerald-200 bg-emerald-50/50 px-2.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                              title="Копирай линк за родител"
                            >
                              <Copy className="size-3.5 mr-1 text-emerald-600" />
                              {copiedToken === req.token ? "Копиран!" : "Линк"}
                            </Button>
                          )}

                          {/* Delete button available for ALL records (pending, completed, cancelled, expired) */}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deletingId === req.id}
                            onClick={() => handleDeleteRequest(req)}
                            className="h-8 rounded-lg border-rose-200 px-2.5 text-[11px] font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                            title="Изтрий записа перманентно от базата данни"
                          >
                            {deletingId === req.id ? (
                              <Loader2 className="mr-1 size-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="mr-1 size-3.5 text-rose-600" />
                            )}
                            Изтрий
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DIALOG: UNIVERSAL DOCUMENT PREVIEW & SIGNING */}
      <ViewSignedDocumentDialog
        request={previewRequest}
        open={!!previewRequest}
        onOpenChange={(open) => !open && setPreviewRequest(null)}
        onUpdated={loadRequests}
      />
    </div>
  );
}
