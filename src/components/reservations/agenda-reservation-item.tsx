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
    <div className="flex w-full shrink-0 flex-row items-center gap-3 border-b border-zinc-100 pb-3 sm:w-[110px] sm:flex-col sm:items-start sm:border-b-0 sm:pb-0 dark:border-zinc-900">
      <div className="flex items-center gap-2 text-primary">
        <Clock className="size-4" strokeWidth={2.5} />
        <span className="text-sm font-black tracking-tight">
          {startTime.toLocaleTimeString("bg-BG", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="h-px w-4 bg-zinc-200 sm:hidden dark:bg-zinc-800" />
      <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
        до{" "}
        {endTime.toLocaleTimeString("bg-BG", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      {reservation.bufferAfter ? (
        <span className="text-[9px] font-bold tracking-tight text-amber-500/80">
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
    <div className="flex w-full min-w-0 flex-1 flex-row items-center gap-4 sm:w-auto">
      <div className="flex min-h-12 max-w-30 min-w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-zinc-900 px-3 py-2 text-center text-white shadow-lg shadow-black/10 dark:bg-white dark:text-zinc-900">
        <span className="mb-0.5 text-[8px] font-black tracking-tighter uppercase opacity-50">
          {effectiveBranch === "bkgalabovo" ? "Корт" : "Услуга"}
        </span>
        <span
          className={cn(
            "leading-tight font-bold",
            effectiveBranch === "bkgalabovo"
              ? "text-sm whitespace-nowrap"
              : "text-[11px]"
          )}
        >
          {effectiveBranch === "bkgalabovo" ? reservation.courtId : serviceName}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start gap-2">
          {effectiveBranch === "bkgalabovo" ? (
            <User className="mt-0.5 size-4 shrink-0 text-zinc-400" />
          ) : (
            <Activity className="mt-0.5 size-4 shrink-0 text-primary" />
          )}
          <h4 className="w-full min-w-0 flex-1 leading-snug font-bold break-words text-zinc-900 dark:text-white">
            {reservation.memberId || reservation.clientId ? (
              <Link
                href={`/members/${reservation.memberId || reservation.clientId}`}
                className="transition-colors hover:text-primary hover:underline"
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
                <span className="mx-1.5 font-normal text-zinc-400">&amp;</span>
                {reservation.client2Id ? (
                  <Link
                    href={`/members/${reservation.client2Id}`}
                    className="transition-colors hover:text-primary hover:underline"
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
        <div className="flex w-full min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-zinc-500">
          <div className="flex shrink-0 items-center gap-1.5">
            <Phone className="size-3 shrink-0 opacity-50" />
            {reservation.client2Phone
              ? `${reservation.clientPhone} / ${reservation.client2Phone}`
              : reservation.clientPhone}
          </div>
          {reservation.clientEmail && (
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <Tag className="size-3 shrink-0 opacity-50" />
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
    <div className="mt-2 flex w-full shrink-0 flex-row flex-wrap items-center justify-between gap-6 border-t border-zinc-100 pt-4 sm:flex-nowrap sm:justify-end 2xl:mt-0 2xl:w-auto 2xl:border-t-0 2xl:pt-0 dark:border-zinc-900">
      {/* Status & Price */}
      <div className="flex shrink-0 items-center gap-4 sm:gap-6">
        {effectiveBranch === "recoveryzone" && missingDeclarations > 0 && (
          <div className="flex flex-col items-end">
            <span className="mb-1 text-[10px] font-black tracking-[0.2em] text-rose-500 uppercase">
              Декларации
            </span>
            <span className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1 text-[9px] font-black tracking-widest text-rose-600 uppercase dark:border-rose-800 dark:bg-rose-900/20">
              Липсват ({missingDeclarations})
            </span>
          </div>
        )}

        <div className="flex flex-col items-end">
          <span className="mb-1 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
            Статус
          </span>
          <span
            className={cn(
              "rounded-lg border px-3 py-1 text-[9px] font-black tracking-widest uppercase",
              reservation.status === "paid"
                ? "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/20"
                : "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-900/20"
            )}
          >
            {reservation.status === "paid" ? "Платено" : "Неплатено"}
          </span>
        </div>
        <div className="flex min-w-[70px] flex-col items-end">
          <span className="mb-1 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
            Сума
          </span>
          <span className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
            {formatPrice(reservation.totalPrice ?? reservation.price ?? 0)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-2xl text-blue-600 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20"
                title="Изпрати потвърждение"
              >
                <Send className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-2xl border-zinc-100 p-2 dark:border-zinc-800"
            >
              <DropdownMenuItem
                asChild
                className="cursor-pointer gap-2 rounded-xl py-2.5 text-xs font-bold text-zinc-700 transition-colors focus:bg-emerald-50 focus:text-emerald-600 dark:text-zinc-300 dark:focus:bg-emerald-950/30 dark:focus:text-emerald-400"
              >
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="mt-1 cursor-pointer gap-2 rounded-xl py-2.5 text-xs font-bold text-zinc-700 transition-colors focus:bg-blue-50 focus:text-blue-600 dark:text-zinc-300 dark:focus:bg-blue-950/30 dark:focus:text-blue-400"
                onClick={sendSystemEmail}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                {isSendingEmail ? "Изпращане..." : "Имейл (системно)"}
              </DropdownMenuItem>

              <DropdownMenuItem
                className="mt-1 cursor-pointer gap-2 rounded-xl py-2.5 text-xs font-bold text-zinc-700 transition-colors focus:bg-amber-50 focus:text-amber-600 dark:text-zinc-300 dark:focus:bg-amber-950/30 dark:focus:text-amber-400"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(messageText);
                  toast.success("Текстът е копиран в клипборда!");
                }}
              >
                <Copy className="size-4" />
                Копирай текста
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {reservation.status !== "paid" && (
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-2xl text-emerald-600 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            onClick={() => onMarkAsPaid(reservation.id)}
            title="Маркирай като платено"
          >
            <CheckCircle2 className="size-5" />
          </Button>
        )}

        {reservation.status === "paid" && (
          <DonationReceiptDialog reservation={reservation}>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 rounded-2xl text-zinc-900 transition-all hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-800"
              title="Издай документ"
            >
              <FileText className="size-5" />
            </Button>
          </DonationReceiptDialog>
        )}

        {effectiveBranch === "recoveryzone" && (
          <DeclarationSignDialog reservation={reservation}>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 rounded-2xl text-blue-600 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title="Попълни декларация"
            >
              <PenTool className="size-5" />
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
            className="size-11 rounded-2xl transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Pencil className="size-4 text-zinc-400" />
          </Button>
        </ReservationDialog>

        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-2xl transition-all hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
          onClick={() => onDelete(reservation.id)}
        >
          <Trash2 className="size-4" />
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
    <div className="group relative flex flex-wrap items-center justify-between gap-4 rounded-4xl border border-zinc-100 bg-white p-4 transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-black/5 sm:p-6 lg:gap-6 2xl:flex-nowrap dark:border-zinc-900 dark:bg-zinc-950">
      {/* --- LEFT SECTION: Time & Info --- */}
      <div className="flex w-full min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 2xl:w-auto">
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
