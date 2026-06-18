"use client";

import { Reservation } from "@/types/reservation";
import { ClubService } from "@/types";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { Clock, User, Activity, Phone, Tag, CheckCircle2, FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReservationDialog } from "./reservation-dialog";
import { DonationReceiptDialog } from "./donation-receipt-dialog";

interface AgendaReservationItemProps {
  reservation: Reservation;
  services: ClubService[];
  effectiveBranch: string;
  mode?: "courts" | "recovery";
  onMarkAsPaid: (id: string) => void;
  onDelete: (id: string) => void;
}

const getReservationTitle = (res: Reservation) => {
  const c1Name = res.clientName;
  const c1Zone = res.selectedZone ? ` (${res.selectedZone})` : "";
  const c1Str = `${c1Name}${c1Zone}`;

  if (res.client2Name || res.client2Zone) {
    const c2Name = res.client2Name || "Клиент 2";
    const c2Zone = res.client2Zone ? ` (${res.client2Zone})` : "";
    return `${c1Str} & ${c2Name}${c2Zone}`;
  }
  return c1Str;
};

export function AgendaReservationItem({
  reservation,
  services,
  effectiveBranch,
  mode,
  onMarkAsPaid,
  onDelete,
}: AgendaReservationItemProps) {
  const startTime = reservation.startTime.toDate();
  const endTime = reservation.endTime.toDate();

  const getServiceName = () => {
    const svcName = reservation.serviceName || services.find((s) => s.id === reservation.serviceId)?.name;
    return svcName || "Услуга";
  };

  return (
    <div className="group relative flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-4xl border transition-all duration-300 bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 hover:border-primary/20 hover:shadow-xl hover:shadow-black/5">
      {/* Time Column */}
      <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:w-32 shrink-0">
        <div className="flex items-center gap-2 text-primary">
          <Clock className="w-4 h-4" strokeWidth={2.5} />
          <span className="font-black text-sm tracking-tight">
            {startTime.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="h-px w-4 bg-zinc-200 dark:bg-zinc-800 md:hidden" />
        <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
          до {endTime.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
        </span>
        {reservation.bufferAfter ? (
          <span className="text-[9px] text-amber-500/80 font-bold tracking-tight">
            + {reservation.bufferAfter} мин. почистване
          </span>
        ) : null}
      </div>

      {/* Content Column */}
      <div className="flex-1 flex flex-col md:flex-row md:items-center gap-6">
        {/* Court Badge */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center min-w-12 min-h-12 py-2 px-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg shadow-black/10 max-w-[200px] text-center">
            <span className="text-[8px] font-black uppercase tracking-tighter opacity-50 mb-0.5">
              {effectiveBranch === "bkgalabovo" ? "Корт" : "Услуга"}
            </span>
            <span
              className={cn(
                "font-bold leading-tight",
                effectiveBranch === "bkgalabovo" ? "text-sm whitespace-nowrap" : "text-[11px]"
              )}
            >
              {effectiveBranch === "bkgalabovo" ? reservation.courtId : getServiceName()}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {effectiveBranch === "bkgalabovo" ? (
                <User className="w-4 h-4 text-zinc-400" />
              ) : (
                <Activity className="w-4 h-4 text-primary" />
              )}
              <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-primary transition-colors">
                {getReservationTitle(reservation)}
              </h4>
            </div>
            <div className="flex items-center gap-4 text-zinc-500 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 opacity-50" />
                {reservation.client2Phone
                  ? `${reservation.clientPhone} / ${reservation.client2Phone}`
                  : reservation.clientPhone}
              </div>
              {reservation.clientEmail && (
                <div className="hidden sm:flex items-center gap-1.5">
                  <Tag className="w-3 h-3 opacity-50" />
                  {reservation.clientEmail}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status & Price */}
        <div className="md:ml-auto flex items-center gap-6">
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
          <div className="flex flex-col items-end min-w-[80px]">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
              Сума
            </span>
            <span className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
              {formatPrice(reservation.totalPrice ?? reservation.price ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-900">
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

        <ReservationDialog reservation={reservation} mode={mode} onSave={() => {}}>
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
