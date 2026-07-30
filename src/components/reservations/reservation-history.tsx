"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { useReservations } from "@/hooks/useReservations";
import {
  deleteReservationAction,
  markReservationAsPaidAction,
} from "@/lib/actions/reservations";
import { getAllRecoveryServices } from "@/services/club-service";
import { useAppStore } from "@/store/use-app-store";
import { ClubService } from "@/types";

import {
  ReservationHistoryMobileCard,
  ReservationHistoryTableRow,
} from "./ReservationHistoryTableRow";

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
        <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        Зареждане на историята...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Търсене по име, телефон или имейл..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl border-zinc-200 bg-white pl-10 dark:border-zinc-800 dark:bg-zinc-950"
          />
        </div>
        <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
          Намерени: {filteredReservations.length}
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm shadow-black/2 md:block dark:border-zinc-800 dark:bg-zinc-950">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
            <TableRow className="border-zinc-100 hover:bg-transparent dark:border-zinc-800">
              <TableHead className="h-12 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                Дата и Час
              </TableHead>
              <TableHead className="h-12 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                Клиент
              </TableHead>
              <TableHead className="h-12 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                Ресурс / Услуга
              </TableHead>
              <TableHead className="h-12 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                Статус
              </TableHead>
              <TableHead className="h-12 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                Цена
              </TableHead>
              <TableHead className="h-12 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                Направена от
              </TableHead>
              <TableHead className="w-50 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReservations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-48 text-center font-medium text-zinc-500"
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

      <div className="flex flex-col gap-4 md:hidden">
        {filteredReservations.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-center font-medium text-zinc-500">
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
