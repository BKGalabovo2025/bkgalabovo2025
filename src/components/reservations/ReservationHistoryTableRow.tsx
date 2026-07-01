"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Clock,
  MapPin,
  Eye,
  Activity,
  CheckCircle2,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import { Reservation } from "@/types";
import { ReservationDialog } from "./reservation-dialog";
import { DonationReceiptDialog } from "./donation-receipt-dialog";

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
    <TableRow className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 border-zinc-50 dark:border-zinc-900 transition-colors">
      <TableCell className="py-4">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {format(startTime, "dd MMM yyyy", { locale: bg })}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <Clock className="h-3 w-3" />
            {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
          </div>
          {res.bufferAfter ? (
            <div className="text-[9px] text-amber-500/80 font-bold tracking-tight">
              + {res.bufferAfter} мин. почистване
            </div>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            {getReservationTitle(res)}
          </span>
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-tight">
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
            className="rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-bold text-[10px] gap-1.5 py-1 px-2.5 whitespace-nowrap"
          >
            <MapPin className="h-3 w-3 text-primary" />
            Корт {res.courtId}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-bold text-[10px] gap-1.5 py-1 px-2.5"
          >
            <Activity className="h-3 w-3 text-emerald-500" />
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
          className={`rounded-lg font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 border-none shadow-none ${getStatusStyles(
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
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
            {displayPrice}
            <span className="text-[10px] text-zinc-400">
              {res.currency || "EUR"}
            </span>
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-medium text-zinc-500 truncate max-w-[120px]">
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
              className="h-8 w-8 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 transition-all"
              onClick={() => handleMarkAsPaid(res.id)}
              title="Маркирай като платено"
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}

          {res.status === "paid" && !isPackageTail && (
            <DonationReceiptDialog reservation={res as unknown as Reservation}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-all"
                title="Издай документ"
              >
                <FileText className="w-4 h-4" />
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
              className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              title="Редактирай"
            >
              <Pencil className="w-4 h-4 text-zinc-400" />
            </Button>
          </ReservationDialog>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-all"
            onClick={() => handleDeleteReservation(res.id)}
            title="Изтрий"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewInCalendar(startTime)}
            className="h-8 w-8 rounded-lg hover:bg-primary hover:text-white transition-all group"
            title="Виж в календара"
          >
            <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
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
    <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-4 shadow-sm">
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
            {format(startTime, "dd MMM yyyy", { locale: bg })}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <Clock className="h-3 w-3" />
            {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
          </div>
        </div>
        <Badge
          className={`rounded-lg font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 border-none shadow-none ${getStatusStyles(
            res.status
          )}`}
        >
          {getStatusLabel(res.status)}
        </Badge>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
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
            className="rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-bold text-[10px] gap-1.5 py-1 px-2.5"
          >
            <MapPin className="h-3 w-3 text-primary" />
            Корт {res.courtId}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-bold text-[10px] gap-1.5 py-1 px-2.5"
          >
            <Activity className="h-3 w-3 text-emerald-500" />
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
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
            {displayPrice}
            <span className="text-[10px] text-zinc-400">
              {res.currency || "EUR"}
            </span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-medium text-zinc-500 truncate max-w-[120px]">
            {res.createdBy?.userName || res.teamMemberName || "Система"}
          </span>
        </div>

        <div className="flex items-center justify-end gap-1">
          {res.status !== "paid" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 transition-all"
              onClick={() => handleMarkAsPaid(res.id)}
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}

          {res.status === "paid" && !isPackageTail && (
            <DonationReceiptDialog reservation={res as unknown as Reservation}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-all"
              >
                <FileText className="w-4 h-4" />
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
              className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <Pencil className="w-4 h-4 text-zinc-400" />
            </Button>
          </ReservationDialog>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-all"
            onClick={() => handleDeleteReservation(res.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewInCalendar(startTime)}
            className="h-8 w-8 rounded-lg hover:bg-primary hover:text-white transition-all group"
            title="Виж в календара"
          >
            <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
