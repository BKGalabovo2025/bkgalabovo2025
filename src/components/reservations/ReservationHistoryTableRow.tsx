"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Activity,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  MapPin,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { PenTool } from "lucide-react";

import { DeclarationSignDialog } from "@/components/declarations/DeclarationSignDialog";
import { ViewDeclarationButton } from "@/components/declarations/ViewDeclarationButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Reservation } from "@/types";

import { DonationReceiptDialog } from "./donation-receipt-dialog";
import { ReservationDialog } from "./reservation-dialog";

export interface ReservationData {
  id: string;
  clientName?: string;
  selectedZone?: string;
  client2Name?: string;
  client2Zone?: string;
  clientPhone?: string;
  client2Phone?: string;
  status: string;
  startTime: { toDate: () => Date };
  endTime: { toDate: () => Date };
  totalPrice?: number;
  price?: number;
  bufferAfter?: number;
  courtId?: string | number;
  serviceId?: string;
  serviceName?: string;
  currency?: string;
  createdBy?: { userName?: string; uid?: string; email?: string };
  teamMemberName?: string;
  siteId?: string;
  createdAt?: string | Date | { toDate: () => Date };
  declarationsCount?: number;
}

interface ServiceData {
  id: string;
  name: string;
}

const getReservationTitle = (res: ReservationData) => {
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

const getStatusLabel = (status: string) => {
  switch (status) {
    case "paid":
      return "Платена";
    case "unpaid":
      return "Неплатена";
    case "cancelled":
      return "Отказана";
    case "confirmed":
      return "Потвърдена";
    case "scheduled":
      return "Планирана";
    case "completed":
      return "Завършена";
    case "pending":
      return "Изчакваща";
    default:
      return status;
  }
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case "paid":
    case "completed":
    case "confirmed":
      return "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20";
    case "cancelled":
      return "bg-red-500/10 text-red-600";
    case "pending":
    case "unpaid":
      return "bg-amber-500/10 text-amber-600";
    default:
      return "bg-zinc-500/10 text-zinc-600";
  }
};

interface ReservationHistoryTableRowProps {
  reservation: ReservationData;
  services: ServiceData[];
  isPackageTail: boolean;
  mode?: "courts" | "recovery";
  handleMarkAsPaid: (id: string) => void;
  handleDeleteReservation: (id: string) => void;
  onViewInCalendar: (date: Date) => void;
}

export function ReservationHistoryTableRow({
  reservation: res,
  services,
  isPackageTail,
  mode,
  handleMarkAsPaid,
  handleDeleteReservation,
  onViewInCalendar,
}: ReservationHistoryTableRowProps) {
  const startTime = res.startTime.toDate();
  const endTime = res.endTime.toDate();
  const displayPrice = res.totalPrice ?? res.price ?? 0;

  return (
    <TableRow className="border-zinc-50 transition-colors hover:bg-zinc-50/50 dark:border-zinc-900 dark:hover:bg-zinc-900/50">
      <TableCell className="py-4">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {format(startTime, "dd MMM yyyy", { locale: bg })}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <Clock className="size-3" />
            {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
          </div>
          {res.bufferAfter ? (
            <div className="text-[9px] font-bold tracking-tight text-amber-500/80">
              + {res.bufferAfter} мин. почистване
            </div>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {getReservationTitle(res)}
          </span>
          <span className="text-[10px] font-medium tracking-tight text-zinc-400 uppercase">
            {res.client2Phone
              ? `${res.clientPhone} / ${res.client2Phone}`
              : res.clientPhone}
          </span>
        </div>
      </TableCell>
      <TableCell>
        {res.courtId ? (
          <Badge
            variant="outline"
            className="gap-1.5 rounded-lg border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-bold whitespace-nowrap dark:border-zinc-800 dark:bg-zinc-900"
          >
            <MapPin className="size-3 text-primary" />
            Корт {res.courtId}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="gap-1.5 rounded-lg border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-bold dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Activity className="size-3 text-emerald-500" />
            {(() => {
              const svcName =
                res.serviceName ||
                services.find((s) => s.id === res.serviceId)?.name;
              return svcName || "Услуга";
            })()}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Badge
          className={`rounded-lg border-none px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase shadow-none ${getStatusStyles(
            res.status
          )}`}
        >
          {getStatusLabel(res.status)}
        </Badge>
      </TableCell>
      <TableCell>
        {isPackageTail ? (
          <span className="text-xs font-bold text-zinc-400 italic">
            в пакета
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {displayPrice}
            <span className="text-[10px] text-zinc-400">
              {res.currency || "EUR"}
            </span>
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
            <User className="size-3 text-primary" />
          </div>
          <span className="max-w-30 truncate text-xs font-medium text-zinc-500">
            {res.createdBy?.userName || res.teamMemberName || "Система"}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          {res.status !== "paid" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-emerald-600 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              onClick={() => handleMarkAsPaid(res.id)}
              title="Маркирай като платено"
            >
              <CheckCircle2 className="size-4" />
            </Button>
          )}

          {res.status === "paid" && !isPackageTail && (
            <DonationReceiptDialog reservation={res as unknown as Reservation}>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-zinc-900 transition-all hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-800"
                title="Издай документ"
              >
                <FileText className="size-4" />
              </Button>
            </DonationReceiptDialog>
          )}

          {res.siteId === "recoveryzone" && (
            <DeclarationSignDialog reservation={res as unknown as Reservation}>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-zinc-900 transition-all hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-800"
                title="Декларация"
              >
                <PenTool className="size-4" />
              </Button>
            </DeclarationSignDialog>
          )}

          {(res.declarationsCount ?? 0) > 0 && (
            <div onClick={(e) => e.stopPropagation()}>
              <ViewDeclarationButton reservationId={res.id} />
            </div>
          )}

          <ReservationDialog
            reservation={res as unknown as Reservation}
            mode={mode}
            onSave={() => {}}
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Редактирай"
            >
              <Pencil className="size-4 text-zinc-400" />
            </Button>
          </ReservationDialog>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg transition-all hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
            onClick={() => handleDeleteReservation(res.id)}
            title="Изтрий"
          >
            <Trash2 className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewInCalendar(startTime)}
            className="group size-8 rounded-lg transition-all hover:bg-primary hover:text-white"
            title="Виж в календара"
          >
            <Eye className="size-4 transition-transform group-hover:scale-110" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ReservationHistoryMobileCard({
  reservation: res,
  services,
  isPackageTail,
  mode,
  handleMarkAsPaid,
  handleDeleteReservation,
  onViewInCalendar,
}: ReservationHistoryTableRowProps) {
  const startTime = res.startTime.toDate();
  const endTime = res.endTime.toDate();
  const displayPrice = res.totalPrice ?? res.price ?? 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {format(startTime, "dd MMM yyyy", { locale: bg })}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <Clock className="size-3" />
            {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
          </div>
        </div>
        <Badge
          className={`rounded-lg border-none px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase shadow-none ${getStatusStyles(
            res.status
          )}`}
        >
          {getStatusLabel(res.status)}
        </Badge>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          {getReservationTitle(res)}
        </span>
        <span className="text-xs font-medium text-zinc-500">
          {res.client2Phone
            ? `${res.clientPhone} / ${res.client2Phone}`
            : res.clientPhone}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {res.courtId ? (
          <Badge
            variant="outline"
            className="gap-1.5 rounded-lg border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-bold dark:border-zinc-800 dark:bg-zinc-900"
          >
            <MapPin className="size-3 text-primary" />
            Корт {res.courtId}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="gap-1.5 rounded-lg border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-bold dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Activity className="size-3 text-emerald-500" />
            {res.serviceName ||
              services.find((s) => s.id === res.serviceId)?.name ||
              "Услуга"}
          </Badge>
        )}

        {isPackageTail ? (
          <span className="text-xs font-bold text-zinc-400 italic">
            в пакета
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {displayPrice}
            <span className="text-[10px] text-zinc-400">
              {res.currency || "EUR"}
            </span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
            <User className="size-3 text-primary" />
          </div>
          <span className="max-w-30 truncate text-xs font-medium text-zinc-500">
            {res.createdBy?.userName || res.teamMemberName || "Система"}
          </span>
        </div>

        <div className="flex items-center justify-end gap-1">
          {res.status !== "paid" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-emerald-600 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              onClick={() => handleMarkAsPaid(res.id)}
            >
              <CheckCircle2 className="size-4" />
            </Button>
          )}

          {res.status === "paid" && !isPackageTail && (
            <DonationReceiptDialog reservation={res as unknown as Reservation}>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-zinc-900 transition-all hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-800"
              >
                <FileText className="size-4" />
              </Button>
            </DonationReceiptDialog>
          )}

          <ReservationDialog
            reservation={res as unknown as Reservation}
            mode={mode}
            onSave={() => {}}
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Pencil className="size-4 text-zinc-400" />
            </Button>
          </ReservationDialog>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg transition-all hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
            onClick={() => handleDeleteReservation(res.id)}
          >
            <Trash2 className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewInCalendar(startTime)}
            className="group size-8 rounded-lg transition-all hover:bg-primary hover:text-white"
            title="Виж в календара"
          >
            <Eye className="size-4 transition-transform group-hover:scale-110" />
          </Button>
        </div>
      </div>
    </div>
  );
}
