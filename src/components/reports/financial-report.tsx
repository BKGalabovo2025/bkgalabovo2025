"use client";

import { useState, useEffect, useMemo } from "react";
import { Sale, Member } from "@/types";
import { getSales } from "@/services/sales-service";
import { getAllMembers } from "@/services/member-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDays, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import { Loader2, Download, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export-utils";

const FinancialReport = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters - state now holds Date objects
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    addDays(new Date(), -30)
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [paymentType, setPaymentType] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [allSales, allMembers] = await Promise.all([
          getSales(),
          getAllMembers(),
        ]);
        setSales(allSales);
        setMembers(allMembers);
      } catch (error) {
        console.error("Failed to fetch financial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  const filteredSales = useMemo(() => {
    const startDate = dateFrom ? new Date(dateFrom) : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);

    const endDate = dateTo ? new Date(dateTo) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    return sales.filter((s) => {
      const saleDate = new Date(s.saleDate);

      const isInDateRange =
        (!startDate || saleDate >= startDate) &&
        (!endDate || saleDate <= endDate);

      const isTypeMatch =
        paymentType === "all" ||
        (paymentType === "Членски внос" && s.subscriptionId) ||
        (paymentType === "inventory" && !s.subscriptionId);

      return isInDateRange && isTypeMatch;
    });
  }, [sales, dateFrom, dateTo, paymentType]);

  const totalAmount = useMemo(
    () => filteredSales.reduce((acc, s) => acc + s.totalAmount, 0),
    [filteredSales]
  );

  const handleDateChange =
    (setter: (date: Date | undefined) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateString = e.target.value;
      if (dateString) {
        const [year, month, day] = dateString.split("-").map(Number);
        setter(new Date(year, month - 1, day));
      } else {
        setter(undefined);
      }
    };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-end gap-6 bg-zinc-50 dark:bg-zinc-800/30 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-wrap items-end gap-6 grow">
          <div className="space-y-2">
            <Label htmlFor="dateFrom" className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">От дата</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom ? format(dateFrom, "yyyy-MM-dd") : ""}
              onChange={handleDateChange(setDateFrom)}
              className="w-[180px] h-11 rounded-2xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo" className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">До дата</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo ? format(dateTo, "yyyy-MM-dd") : ""}
              onChange={handleDateChange(setDateTo)}
              className="w-[180px] h-11 rounded-2xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Тип плащане</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger className="w-[200px] h-11 rounded-2xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold">
                <SelectValue placeholder="Тип плащане" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xl">
                <SelectItem value="all">Всички</SelectItem>
                <SelectItem value="Членски внос">Членски внос</SelectItem>
                <SelectItem value="inventory">Продажба инвентар</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          variant="outline"
          className="h-11 px-6 rounded-2xl border-zinc-200 dark:border-zinc-700 font-bold gap-2 hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-sm"
          onClick={() => {
            const exportData = filteredSales.map((s) => {
              const member = s.memberId ? memberMap.get(s.memberId) : null;
              return {
                Дата: new Date(s.saleDate).toLocaleDateString("bg-BG"),
                Член: member
                  ? `${member.firstName} ${member.lastName}`
                  : "Н/А",
                Тип: s.subscriptionId
                  ? "Членски внос"
                  : "Продажба инвентар",
                "Сума (лв)": s.totalAmount.toFixed(2),
              };
            });
            exportToCSV(
              exportData,
              `Финансов-отчет-${format(new Date(), "yyyy-MM-dd")}.csv`
            );
          }}
          disabled={filteredSales.length === 0}
        >
          <Download className="h-4 w-4" />
          Експорт (CSV)
        </Button>
      </div>

      <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-32 text-center flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-zinc-500 font-bold font-heading">Зареждане на данни...</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50/80 dark:bg-zinc-800/80">
              <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest pl-8 py-5">Дата</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-5">Член / Клиент</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-5">Тип</TableHead>
                <TableHead className="text-right pr-8 font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-5">Сума</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((s) => {
                  const member = s.memberId ? memberMap.get(s.memberId) : null;
                  const memberName = member
                    ? `${member.firstName} ${member.lastName}`
                    : "Н/А";
                  const isSubscription = !!s.subscriptionId;
                  
                  return (
                    <TableRow key={s.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <TableCell className="pl-8 py-5 text-zinc-500 font-bold">
                        {new Date(s.saleDate).toLocaleDateString("bg-BG")}
                      </TableCell>
                      <TableCell className="py-5 font-black font-heading text-zinc-900 dark:text-white">{memberName}</TableCell>
                      <TableCell className="py-5">
                        <Badge variant="outline" className={cn(
                          "rounded-lg px-2.5 py-0.5 font-black text-[9px] uppercase tracking-widest",
                          isSubscription ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-amber-50 text-amber-600 border-amber-100"
                        )}>
                          {isSubscription ? "Членски внос" : "Продажба инвентар"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8 py-5 font-black text-lg font-heading text-zinc-900 dark:text-white">
                        {formatPrice(s.totalAmount)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-32 opacity-40">
                    <div className="flex flex-col items-center gap-4">
                      <BarChart className="h-16 w-16" />
                      <p className="text-xl font-black font-heading">Няма намерени записи</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {!isLoading && filteredSales.length > 0 && (
        <div className="flex justify-end pr-8">
          <div className="bg-zinc-900 dark:bg-white p-6 rounded-3xl shadow-xl shadow-zinc-900/20 dark:shadow-none min-w-[250px]">
            <p className="text-zinc-400 dark:text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Обща сума за периода</p>
            <p className="text-4xl font-black font-heading text-white dark:text-zinc-950 tracking-tight">
              {formatPrice(totalAmount)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReport;
