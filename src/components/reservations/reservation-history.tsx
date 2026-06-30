"use client";

import { useReservations } from "@/hooks/useReservations";
import { useAppStore } from "@/store/use-app-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  deleteReservationAction,
  markReservationAsPaidAction,
} from "@/lib/actions/reservations";
import { getAllRecoveryServices } from "@/services/club-service";
import {
  ReservationHistoryTableRow,
  ReservationHistoryMobileCard,
} from "./ReservationHistoryTableRow";
import { ClubService } from "@/types";

interface ReservationHistoryProps {
  onViewInCalendar: (date: Date) => void;
  mode?: "courts" | "recovery";
}

export function ReservationHistory({
  onViewInCalendar,
  mode,
}: ReservationHistoryProps) {
  const { activeBranch } = useAppStore();
  const { getFreshToken } = useAuth();
  const [services, setServices] = useState<ClubService[]>([]);
  const effectiveBranch = mode === "recovery" ? "recoveryzone" : activeBranch;
  const { reservations, isLoading } = useReservations(effectiveBranch);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (mode === "recovery") {
      getAllRecoveryServices().then((data) => setServices(data));
    }
  }, [mode]);

  const handleDeleteReservation = async (id: string) => {
    const token = await getFreshToken(true);
    if (!token) return;
    try {
      const result = await deleteReservationAction(token, id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch {
      toast.error("Грешка при изтриване.");
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    const token = await getFreshToken(true);
    if (!token) return;
    try {
      const result = await markReservationAsPaidAction(token, id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Грешка при актуализиране на плащане.");
    }
  };

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

      <div className="border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm shadow-black/2 bg-white dark:bg-zinc-950 hidden md:block">
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
              <TableHead className="w-[200px] text-right"></TableHead>
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
              (() => {
                const seenPackages = new Set<string>();
                return filteredReservations.map((res) => {
                  const isPackageHead = res.packageGroupId
                    ? !seenPackages.has(res.packageGroupId)
                    : false;
                  if (res.packageGroupId) {
                    seenPackages.add(res.packageGroupId);
                  }
                  const isPackageTail = res.packageGroupId && !isPackageHead;

                  return (
                    <ReservationHistoryTableRow
                      key={res.id}
                      reservation={res}
                      services={services}
                      isPackageTail={!!isPackageTail}
                      mode={mode}
                      handleMarkAsPaid={handleMarkAsPaid}
                      handleDeleteReservation={handleDeleteReservation}
                      onViewInCalendar={onViewInCalendar}
                    />
                  );
                });
              })()
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden flex flex-col gap-4">
        {filteredReservations.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-center text-zinc-500 font-medium">
            Няма намерени резервации.
          </div>
        ) : (
          (() => {
            const seenPackages = new Set<string>();
            return filteredReservations.map((res) => {
              const isPackageHead = res.packageGroupId
                ? !seenPackages.has(res.packageGroupId)
                : false;
              if (res.packageGroupId) {
                seenPackages.add(res.packageGroupId);
              }
              const isPackageTail = res.packageGroupId && !isPackageHead;

              return (
                <ReservationHistoryMobileCard
                  key={res.id}
                  reservation={res}
                  services={services}
                  isPackageTail={!!isPackageTail}
                  mode={mode}
                  handleMarkAsPaid={handleMarkAsPaid}
                  handleDeleteReservation={handleDeleteReservation}
                  onViewInCalendar={onViewInCalendar}
                />
              );
            });
          })()
        )}
      </div>
    </div>
  );
}
