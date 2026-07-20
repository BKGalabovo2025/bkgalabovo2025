"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { marketingService } from "@/services/marketing-service";

import { Reservation } from "@/types/reservation";
import { ClubService } from "@/types";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import {
  Clock,
  User,
  Activity,
  Phone,
  Tag,
  CheckCircle2,
  FileText,
  Pencil,
  Trash2,
  Send,
  Mail,
  MessageCircle,
  Copy,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ReservationDialog } from "./reservation-dialog";
import { DonationReceiptDialog } from "./donation-receipt-dialog";
import { DeclarationSignDialog } from "@/components/declarations/DeclarationSignDialog";
import { toast } from "sonner";
import { ViewDeclarationButton } from "@/components/declarations/ViewDeclarationButton";
import { PenTool } from "lucide-react";

interface AgendaReservationItemProps {
  reservation: Reservation;
  services: ClubService[];
  effectiveBranch: string;
  mode?: "courts" | "recovery";
  onMarkAsPaid: (id: string) => void;
  onDelete: (id: string) => void;
}

function TimeColumn({
  reservation,
  startTime,
  endTime,
}: {
  reservation: Reservation;
  startTime: Date;
  endTime: Date;
}) {
  return (
    <div className="flex flex-row sm:flex-col items-center sm:items-start gap-3 w-full sm:w-[110px] shrink-0 pb-3 sm:pb-0 border-b sm:border-b-0 border-zinc-100 dark:border-zinc-900">
      <div className="flex items-center gap-2 text-primary">
        <Clock className="w-4 h-4" strokeWidth={2.5} />
        <span className="font-black text-sm tracking-tight">
          {startTime.toLocaleTimeString("bg-BG", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="h-px w-4 bg-zinc-200 dark:bg-zinc-800 sm:hidden" />
      <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
        до{" "}
        {endTime.toLocaleTimeString("bg-BG", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      {reservation.bufferAfter ? (
        <span className="text-[9px] text-amber-500/80 font-bold tracking-tight">
          + {reservation.bufferAfter} мин.
        </span>
      ) : null}
    </div>
  );
}

function ClientInfo({
  reservation,
  effectiveBranch,
  serviceName,
}: {
  reservation: Reservation;
  effectiveBranch: string;
  serviceName: string;
}) {
  return (
    <div className="flex flex-row items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
      <div className="shrink-0 flex flex-col items-center justify-center min-w-[3rem] min-h-[3rem] py-2 px-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg shadow-black/10 max-w-[120px] text-center">
        <span className="text-[8px] font-black uppercase tracking-tighter opacity-50 mb-0.5">
          {effectiveBranch === "bkgalabovo" ? "Корт" : "Услуга"}
        </span>
        <span
          className={cn(
            "font-bold leading-tight",
            effectiveBranch === "bkgalabovo"
              ? "text-sm whitespace-nowrap"
              : "text-[11px]"
          )}
        >
          {effectiveBranch === "bkgalabovo" ? reservation.courtId : serviceName}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {effectiveBranch === "bkgalabovo" ? (
            <User className="shrink-0 w-4 h-4 text-zinc-400 mt-0.5" />
          ) : (
            <Activity className="shrink-0 w-4 h-4 text-primary mt-0.5" />
          )}
          <h4 className="font-bold text-zinc-900 dark:text-white leading-snug break-words w-full flex-1 min-w-0">
            {reservation.memberId || reservation.clientId ? (
              <Link
                href={`/members/${reservation.memberId || reservation.clientId}`}
                className="hover:underline hover:text-primary transition-colors"
              >
                {reservation.clientName}
                {reservation.selectedZone
                  ? ` (${reservation.selectedZone})`
                  : ""}
              </Link>
            ) : (
              <span>
                {reservation.clientName}
                {reservation.selectedZone
                  ? ` (${reservation.selectedZone})`
                  : ""}
              </span>
            )}

            {reservation.client2Name && (
              <>
                <span className="mx-1.5 text-zinc-400 font-normal">&amp;</span>
                {reservation.client2Id ? (
                  <Link
                    href={`/members/${reservation.client2Id}`}
                    className="hover:underline hover:text-primary transition-colors"
                  >
                    {reservation.client2Name}
                    {reservation.client2Zone
                      ? ` (${reservation.client2Zone})`
                      : ""}
                  </Link>
                ) : (
                  <span>
                    {reservation.client2Name}
                    {reservation.client2Zone
                      ? ` (${reservation.client2Zone})`
                      : ""}
                  </span>
                )}
              </>
            )}
          </h4>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-zinc-500 text-xs font-medium w-full min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Phone className="shrink-0 w-3 h-3 opacity-50" />
            {reservation.client2Phone
              ? `${reservation.clientPhone} / ${reservation.client2Phone}`
              : reservation.clientPhone}
          </div>
          {reservation.clientEmail && (
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Tag className="shrink-0 w-3 h-3 opacity-50" />
              <span className="truncate">{reservation.clientEmail}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusAndActions({
  reservation,
  effectiveBranch,
  mode,
  onMarkAsPaid,
  onDelete,
}: AgendaReservationItemProps) {
  const neededDeclarations = reservation.client2Name ? 2 : 1;
  const missingDeclarations =
    neededDeclarations - (reservation.declarationsCount || 0);

  const { user } = useAuth();
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const sendSystemEmail = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!reservation.clientEmail || !user) {
      toast.error("Липсва имейл адрес на клиента или не сте влезли.");
      return;
    }

    setIsSendingEmail(true);
    try {
      const date = reservation.startTime.toDate().toLocaleDateString("bg-BG");
      const start = reservation.startTime
        .toDate()
        .toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
      const end = reservation.endTime
        .toDate()
        .toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });

      const isRecoveryZone = effectiveBranch === "recoveryzone";
      const loc = isRecoveryZone
        ? reservation.serviceName || "Възстановителна процедура"
        : `Корт ${reservation.courtId}`;
      const name = reservation.clientName || "";
      const text = `Здравейте, ${name}!\n\nУспешно запазихте час на ${date} от ${start} до ${end} за ${loc}.\nОчакваме Ви!`;

      const token = await user.getIdToken();
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: reservation.clientEmail,
          subject: "Потвърждение за резервация",
          template: "reservationConfirmation",
          data: {
            clientName: name,
            messageText: text,
            startTime: reservation.startTime.toDate().toISOString(),
            endTime: reservation.endTime.toDate().toISOString(),
            courtId: loc,
            isRecoveryZone: isRecoveryZone,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Грешка при изпращане на имейл");
      }

      // Log to marketing history if memberId exists
      if (reservation.memberId || reservation.clientId) {
        const logData = {
          siteId: effectiveBranch,
          recipientId: reservation.memberId || reservation.clientId,
          recipientName: name,
          recipientPhone: reservation.clientEmail,
          messageText: `Тема: Потвърждение за резервация\n\n${text}`,
          templateUsed: "reservationConfirmation",
          sentBy: user.uid,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await marketingService.logMessage(logData as any);
      }

      toast.success("Имейлът е изпратен успешно чрез системата!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Грешка при изпращане.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const startTimeDate = reservation.startTime.toDate();
  const endTimeDate = reservation.endTime.toDate();
  const dateStr = startTimeDate.toLocaleDateString("bg-BG");
  const startTimeStr = startTimeDate.toLocaleTimeString("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTimeStr = endTimeDate.toLocaleTimeString("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const serviceTypeStr =
    effectiveBranch === "recoveryzone"
      ? "Възстановителна процедура"
      : "Корт " + reservation.courtId;
  const messageText =
    "Здравейте, " +
    (reservation.clientName || "") +
    "!\n\nУспешно запазихте час на " +
    dateStr +
    " от " +
    startTimeStr +
    " до " +
    endTimeStr +
    " за " +
    serviceTypeStr +
    ".\nОчакваме Ви!";

  const rawPhone = (reservation.clientPhone || "").replace(/[^0-9+]/g, "");
  const phoneStr = rawPhone.startsWith("0")
    ? "+359" + rawPhone.slice(1)
    : rawPhone;
  const waLink =
    "https://wa.me/" + phoneStr + "?text=" + encodeURIComponent(messageText);

  return (
    <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-6 w-full 2xl:w-auto shrink-0 pt-4 2xl:pt-0 border-t 2xl:border-t-0 border-zinc-100 dark:border-zinc-900 mt-2 2xl:mt-0">
      {/* Status & Price */}
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        {effectiveBranch === "recoveryzone" && missingDeclarations > 0 && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-1">
              Декларации
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800">
              Липсват ({missingDeclarations})
            </span>
          </div>
        )}

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
            Статус
          </span>
          <span
            className={cn(
              "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border",
              reservation.status === "paid"
                ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800"
                : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800"
            )}
          >
            {reservation.status === "paid" ? "Платено" : "Неплатено"}
          </span>
        </div>
        <div className="flex flex-col items-end min-w-[70px]">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
            Сума
          </span>
          <span className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
            {formatPrice(reservation.totalPrice ?? reservation.price ?? 0)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-all"
                title="Изпрати потвърждение"
              >
                <Send className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-2xl p-2 border-zinc-100 dark:border-zinc-800"
            >
              <DropdownMenuItem
                asChild
                className="rounded-xl text-xs font-bold cursor-pointer gap-2 py-2.5 text-zinc-700 dark:text-zinc-300 focus:bg-emerald-50 dark:focus:bg-emerald-950/30 focus:text-emerald-600 dark:focus:text-emerald-400 transition-colors"
              >
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="rounded-xl text-xs font-bold cursor-pointer gap-2 py-2.5 mt-1 text-zinc-700 dark:text-zinc-300 focus:bg-blue-50 dark:focus:bg-blue-950/30 focus:text-blue-600 dark:focus:text-blue-400 transition-colors"
                onClick={sendSystemEmail}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {isSendingEmail ? "Изпращане..." : "Имейл (системно)"}
              </DropdownMenuItem>

              <DropdownMenuItem
                className="rounded-xl text-xs font-bold cursor-pointer gap-2 py-2.5 mt-1 text-zinc-700 dark:text-zinc-300 focus:bg-amber-50 dark:focus:bg-amber-950/30 focus:text-amber-600 dark:focus:text-amber-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(messageText);
                  toast.success("Текстът е копиран в клипборда!");
                }}
              >
                <Copy className="w-4 h-4" />
                Копирай текста
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {reservation.status !== "paid" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 transition-all"
            onClick={() => onMarkAsPaid(reservation.id)}
            title="Маркирай като платено"
          >
            <CheckCircle2 className="w-5 h-5" />
          </Button>
        )}

        {reservation.status === "paid" && (
          <DonationReceiptDialog reservation={reservation}>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-all"
              title="Издай документ"
            >
              <FileText className="w-5 h-5" />
            </Button>
          </DonationReceiptDialog>
        )}

        {effectiveBranch === "recoveryzone" && (
          <DeclarationSignDialog reservation={reservation}>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-all"
              title="Попълни декларация"
            >
              <PenTool className="w-5 h-5" />
            </Button>
          </DeclarationSignDialog>
        )}

        {(reservation.declarationsCount ?? 0) > 0 && (
          <ViewDeclarationButton reservationId={reservation.id} />
        )}

        <ReservationDialog
          reservation={reservation}
          mode={mode}
          onSave={() => {}}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <Pencil className="w-4 h-4 text-zinc-400" />
          </Button>
        </ReservationDialog>

        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-all"
          onClick={() => onDelete(reservation.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function AgendaReservationItem(props: AgendaReservationItemProps) {
  const { reservation, services, effectiveBranch } = props;
  const startTime = reservation.startTime.toDate();
  const endTime = reservation.endTime.toDate();

  const getServiceName = () => {
    const svcName =
      reservation.serviceName ||
      services.find((s) => s.id === reservation.serviceId)?.name;
    return svcName || "Услуга";
  };

  return (
    <div className="group relative flex flex-wrap 2xl:flex-nowrap gap-4 lg:gap-6 p-4 sm:p-6 rounded-4xl border transition-all duration-300 bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 hover:border-primary/20 hover:shadow-xl hover:shadow-black/5 items-center justify-between">
      {/* --- LEFT SECTION: Time & Info --- */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full 2xl:w-auto flex-1 min-w-0">
        <TimeColumn
          reservation={reservation}
          startTime={startTime}
          endTime={endTime}
        />
        <ClientInfo
          reservation={reservation}
          effectiveBranch={effectiveBranch}
          serviceName={getServiceName()}
        />
      </div>

      {/* --- RIGHT SECTION: Status & Buttons --- */}
      <StatusAndActions {...props} />
    </div>
  );
}
