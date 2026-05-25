"use client";

import { useEffect, useState } from "react";
import { getSales } from "@/services/sales-service";
import { getAllMembers } from "@/services/member-service";
import { Sale, Member } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/currency";

const InventorySalesHistory = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Load sales and members concurrently
        const [fetchedSales, fetchedMembers] = await Promise.all([
          getSales(),
          getAllMembers(),
        ]);

        // Build member ID to name dictionary
        const dict: Record<string, string> = {};
        fetchedMembers.forEach((m: Member) => {
          dict[m.id] = `${m.firstName} ${m.lastName}`;
        });
        setMembersMap(dict);
        setSales(fetchedSales);
      } catch (err) {
        setError("Грешка при зареждане на историята на продажбите.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getClientName = (memberId: string) => {
    if (memberId === "GUEST_EXTERNAL") {
      return "Външен клиент";
    }
    return membersMap[memberId] || "Неизвестен член";
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-none overflow-hidden">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-900">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
          История на продажбите
        </h3>
      </div>
      <div className="p-0">
        {loading && (
          <div className="p-8 text-center text-[11px] uppercase tracking-widest text-zinc-400 font-medium animate-pulse">
            Зареждане на продажбите...
          </div>
        )}
        {error && (
          <div className="p-8 text-center text-[11px] uppercase tracking-widest text-rose-400 font-medium">
            {error}
          </div>
        )}
        {!loading && !error && (
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                  Дата
                </TableHead>
                <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                  Купувач / Клиент
                </TableHead>
                <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                  Продадени Артикули
                </TableHead>
                <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                  Начин на плащане
                </TableHead>
                <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                  Статус
                </TableHead>
                <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6 text-right">
                  Сума
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow
                  key={sale.id}
                  className="border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <TableCell className="px-6 py-4 text-[11px] font-medium text-zinc-400">
                    {new Date(sale.saleDate).toLocaleString("bg-BG")}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {getClientName(sale.memberId)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-xs font-light text-zinc-650 dark:text-zinc-350">
                    <div className="flex flex-col gap-1">
                      {sale.items && sale.items.length > 0 ? (
                        sale.items.map((item, idx) => (
                          <span key={idx}>
                            {item.name}{" "}
                            <strong className="font-semibold text-zinc-900 dark:text-white">
                              x{item.quantity}
                            </strong>
                          </span>
                        ))
                      ) : (
                        <span>--</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400 font-light">
                    {sale.paymentMethod || "В брой"}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border shadow-none ${
                        sale.isPaid
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                          : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                      }`}
                    >
                      {sale.isPaid ? "Платено" : "Неплатено"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right font-semibold text-sm text-zinc-900 dark:text-white">
                    {formatPrice(sale.totalAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && sales.length === 0 && (
          <div className="p-12 text-center text-[11px] uppercase tracking-widest text-zinc-400 font-medium">
            Няма регистрирани продажби.
          </div>
        )}
      </div>
    </div>
  );
};

export default InventorySalesHistory;
