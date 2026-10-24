"use client";

import {
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  History,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { ViewSignedDocumentDialog } from "@/components/documents/ViewSignedDocumentDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {
  cancelDocumentRequestAction,
  deleteDocumentRequestAction,
  getMemberDocumentRequestsAction,
} from "@/lib/actions/document-requests";
import { getCalendarYearValidity } from "@/lib/document-validity";
import { cn } from "@/lib/utils";
import { DocumentRequest } from "@/types/document-request.types";

interface DocumentRequestsHistoryProps {
  memberId: string;
  refreshKey?: number;
  onRefresh?: () => void;
}

export function DocumentRequestsHistory({
  memberId,
  refreshKey = 0,
  onRefresh,
}: DocumentRequestsHistoryProps) {
  const { idToken, getFreshToken } = useAuth();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewRequest, setPreviewRequest] = useState<DocumentRequest | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const token = idToken || (await getFreshToken());
      if (!token) return;
      setLoading(true);
      const res = await getMemberDocumentRequestsAction({
        memberId,
        idToken: token,
      });
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, idToken, refreshKey]);

  const handleCopyLink = async (token: string) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://bkgalabovo2025.vercel.app";
    const fullUrl = `${origin}/sign/${token}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Линкът за подписване е копиран!");
    } catch {
      toast.error("Грешка при копиране на линка.");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    const token = idToken || (await getFreshToken());
    if (!token) return;
    if (!window.confirm("Сигурни ли сте, че искате да анулирате този линк?"))
      return;

    try {
      const res = await cancelDocumentRequestAction({
        requestId,
        idToken: token,
      });
      if (res.success) {
        toast.success("Линкът е анулиран успешно.");
        fetchRequests();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.error || "Грешка при анулиране.");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      toast.error("Възникна грешка при анулиране.");
    }
  };

  const handleDeleteRequest = async (req: DocumentRequest) => {
    const token = idToken || (await getFreshToken());
    if (!token) return;

    const confirmMsg = `Сигурни ли сте, че искате да ИЗТРИЕТЕ този документ от базата данни?\n\nДокумент: ${req.documentTitle}\nСтатус: ${req.status}\n\nТова действие ще изтрие записа перманентно от системата!`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(req.id);
    try {
      const res = await deleteDocumentRequestAction({
        requestId: req.id,
        idToken: token,
      });
      if (res.success) {
        toast.success("Документът беше изтрит успешно от базата данни.");
        setRequests((prev) => prev.filter((r) => r.id !== req.id));
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.error || "Грешка при изтриване на документа.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Възникна грешка при изтриване на записа.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 pt-6 border-t border-zinc-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="size-4 text-zinc-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
            История на изпратени линкове за онлайн подписване
          </h4>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={fetchRequests}
          disabled={loading}
          className="h-7 px-2 text-[11px] text-zinc-500 hover:text-zinc-900"
        >
          Обнови списъка
        </Button>
      </div>

      {loading && requests.length === 0 ? (
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6 text-center text-xs text-zinc-400">
          Зареждане на история на линковете...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/40 p-6 text-center text-xs text-zinc-400">
          Все още няма генерирани линкове за онлайн подписване за този
          състезател.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-100">
                <tr>
                  <th className="px-4 py-3">Документ</th>
                  <th className="px-4 py-3">Годишна валидност</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Подписал</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {requests.map((req) => {
                  const validity = getCalendarYearValidity(
                    req.signedAt || req.createdAt
                  );
                  const signedDate = req.signedAt
                    ? new Date(req.signedAt).toLocaleDateString("bg-BG", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : null;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        <div>{req.documentTitle}</div>
                        <div className="text-[10px] text-zinc-400">
                          Изпратен на:{" "}
                          {new Date(req.createdAt).toLocaleDateString("bg-BG")}
                        </div>
                      </td>

                      {/* Calendar Year Validity */}
                      <td className="px-4 py-3">
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
                            <span className="text-[9px] font-medium text-amber-700">
                              Изисква нова за {validity.currentYear} г.
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {req.status === "completed" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                            <CheckCircle2 className="size-3" /> Подписан
                          </span>
                        )}
                        {req.status === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            <Clock className="size-3" /> Очаква подпис
                          </span>
                        )}
                        {req.status === "expired" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600">
                            <Clock className="size-3" /> Изтекъл
                          </span>
                        )}
                        {req.status === "cancelled" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700">
                            <XCircle className="size-3" /> Анулиран
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {req.parentData?.parentName ? (
                          <div>
                            <p className="font-semibold text-zinc-900">
                              {req.parentData.parentName}
                            </p>
                            {signedDate && (
                              <p className="text-[10px] text-zinc-400">
                                {signedDate} ч.
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            title="Пълен преглед на документа с положените подписи"
                            onClick={() => setPreviewRequest(req)}
                            className="h-8 px-2.5 text-[11px] font-semibold border-zinc-200 hover:bg-zinc-950 hover:text-white"
                          >
                            <Eye className="size-3.5 mr-1 text-emerald-600" />{" "}
                            Преглед
                          </Button>

                          {req.status === "pending" && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="Копирай линк"
                                onClick={() => handleCopyLink(req.token)}
                                className="h-8 px-2 text-xs text-zinc-600 hover:text-zinc-950"
                              >
                                <Copy className="size-3.5 mr-1" /> Копирай
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="Анулирай линк"
                                onClick={() => handleCancelRequest(req.id)}
                                className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50"
                              >
                                <Ban className="size-3.5" />
                              </Button>
                            </>
                          )}

                          {/* Permanent Delete Action Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === req.id}
                            title="Изтрий перманентно от базата данни"
                            onClick={() => handleDeleteRequest(req)}
                            className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            {deletingId === req.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Universal Document Preview & Signing Dialog */}
      <ViewSignedDocumentDialog
        request={previewRequest}
        open={!!previewRequest}
        onOpenChange={(open) => !open && setPreviewRequest(null)}
        onUpdated={fetchRequests}
      />
    </div>
  );
}
