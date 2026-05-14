import { useReservations } from "@/hooks/useReservations";
import { useAppStore } from "@/store/use-app-store";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Clock, MapPin, Eye, Search, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ReservationHistoryProps {
  onViewInCalendar: (date: Date) => void;
}

export function ReservationHistory({
  onViewInCalendar,
}: ReservationHistoryProps) {
  const { activeBranch: siteId } = useAppStore();
  const { reservations, isLoading } = useReservations(siteId);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReservations = reservations.filter(
    (res) =>
      res.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.clientPhone.includes(searchTerm) ||
      (res.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false)
  );

  if (isLoading) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        Зареждане на историята...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Търсене по име, телефон или имейл..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
          />
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Намерени: {filteredReservations.length}
        </div>
      </div>

      <div className="border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm shadow-black/2 bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
            <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 h-12">
                Дата и Час
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 h-12">
                Клиент
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 h-12">
                Ресурс / Услуга
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 h-12">
                Статус
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 h-12">
                Цена
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 h-12">
                Направена от
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReservations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-48 text-center text-zinc-500 font-medium"
                >
                  Няма намерени резервации.
                </TableCell>
              </TableRow>
            ) : (
              filteredReservations.map((res) => {
                const startTime = res.startTime.toDate();
                const endTime = res.endTime.toDate();
                const displayPrice = res.totalPrice ?? res.price ?? 0;

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

                return (
                  <TableRow
                    key={res.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 border-zinc-50 dark:border-zinc-900 transition-colors"
                  >
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {format(startTime, "dd MMM yyyy", { locale: bg })}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                          <Clock className="h-3 w-3" />
                          {format(startTime, "HH:mm")} -{" "}
                          {format(endTime, "HH:mm")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {res.clientName}
                        </span>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-tight">
                          {res.clientPhone}
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
                          {res.serviceName || "Услуга"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`rounded-lg font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 border-none shadow-none ${getStatusStyles(res.status)}`}
                      >
                        {getStatusLabel(res.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                        {displayPrice}{" "}
                        <span className="text-[10px] text-zinc-400">
                          {res.currency || "EUR"}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-zinc-500 truncate max-w-[120px]">
                          {res.createdBy?.userName ||
                            res.teamMemberName ||
                            "Система"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewInCalendar(startTime)}
                        className="h-8 w-8 rounded-lg hover:bg-primary hover:text-white transition-all group"
                        title="Виж в календара"
                      >
                        <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
