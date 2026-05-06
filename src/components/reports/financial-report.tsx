"use client";

import { useState, useEffect, useMemo } from "react";
import { Sale, Member } from "@/types";
import { getSales } from "@/services/sales-service";
import { getAllMembers } from "@/services/member-service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { addDays } from "date-fns";
import {
  Loader2,
  Download,
  TrendingUp,
  PieChart as PieChartIcon,
  Calendar as CalendarIcon,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export-utils";
import { formatDateInput, formatDateShort } from "@/lib/date-utils";
import { formatPrice } from "@/lib/currency";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const FinancialReport = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
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
        (paymentType === "subscriptions" && s.subscriptionId) ||
        (paymentType === "inventory" && !s.subscriptionId);

      return isInDateRange && isTypeMatch;
    });
  }, [sales, dateFrom, dateTo, paymentType]);

  const stats = useMemo(() => {
    const subRevenue = filteredSales
      .filter((s) => s.subscriptionId)
      .reduce((acc, s) => acc + s.totalAmount, 0);
    const invRevenue = filteredSales
      .filter((s) => !s.subscriptionId)
      .reduce((acc, s) => acc + s.totalAmount, 0);

    return {
      total: subRevenue + invRevenue,
      subscriptions: subRevenue,
      inventory: invRevenue,
      chartData: [
        { name: "Абонаменти", value: subRevenue, color: "#2563eb" },
        { name: "Инвентар", value: invRevenue, color: "#10b981" },
      ].filter((d) => d.value > 0),
    };
  }, [filteredSales]);

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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !mounted) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Зареждане на финансов отчет...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              От дата
            </Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={dateFrom ? formatDateInput(dateFrom) : ""}
                onChange={handleDateChange(setDateFrom)}
                className="pl-10 rounded-xl border-slate-200 bg-white shadow-none h-11 text-xs font-bold"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              До дата
            </Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={dateTo ? formatDateInput(dateTo) : ""}
                onChange={handleDateChange(setDateTo)}
                className="pl-10 rounded-xl border-slate-200 bg-white shadow-none h-11 text-xs font-bold"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Тип приходи
            </Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger className="rounded-xl border-slate-200 bg-white shadow-none h-11 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Всички" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Всички</SelectItem>
                <SelectItem value="subscriptions">Абонаменти</SelectItem>
                <SelectItem value="inventory">Инвентар</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <Button
            variant="outline"
            onClick={() => {
              const exportData = filteredSales.map((s) => {
                const member = s.memberId ? memberMap.get(s.memberId) : null;
                return {
                  Дата: formatDateShort(s.saleDate),
                  Член: member ? `${member.firstName} ${member.lastName}` : "—",
                  Тип: s.subscriptionId ? "Абонамент" : "Инвентар",
                  Сума: s.totalAmount,
                };
              });
              exportToCSV(
                exportData,
                `Report_${formatDateInput(new Date())}.csv`
              );
            }}
            disabled={filteredSales.length === 0}
            className="rounded-xl h-11 border-slate-200 font-black text-[10px] uppercase tracking-widest"
          >
            <Download className="mr-2 h-4 w-4" /> Експорт (CSV)
          </Button>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white overflow-hidden col-span-1 lg:col-span-2">
          <CardHeader className="border-b border-slate-50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">
                  Разпределение на приходите
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Визуализация на източниците за избрания период
                </CardDescription>
              </div>
              <PieChartIcon className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-6 h-[300px]">
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
              >
                <PieChart>
                  <Pie
                    data={stats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: any) => formatPrice(Number(value))}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs font-bold uppercase tracking-widest">
                Няма данни за графиката
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative">
            <TrendingUp className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10" />
            <CardContent className="p-8 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-100/70">
                Общ Приход
              </p>
              <h3 className="text-4xl font-black mt-2">
                {formatPrice(stats.total)}
              </h3>
              <div className="mt-6 flex items-center gap-2">
                <div className="h-2 flex-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white"
                    style={{
                      width: `${(stats.subscriptions / (stats.total || 1)) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-black">
                  {Math.round((stats.subscriptions / (stats.total || 1)) * 100)}
                  %
                </span>
              </div>
              <p className="text-[10px] uppercase font-bold mt-2 text-blue-100/70">
                Дял на абонаментите
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="border-none shadow-sm bg-white p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Абонаменти
              </p>
              <p className="text-lg font-black text-blue-600 mt-1">
                {formatPrice(stats.subscriptions)}
              </p>
            </Card>
            <Card className="border-none shadow-sm bg-white p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Инвентар
              </p>
              <p className="text-lg font-black text-emerald-600 mt-1">
                {formatPrice(stats.inventory)}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50">
          <CardTitle className="text-sm font-black uppercase tracking-widest">
            Детайлен списък
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-50">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">
                  Дата
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">
                  Член
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">
                  Тип
                </TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
                  Сума
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((s) => {
                  const member = s.memberId ? memberMap.get(s.memberId) : null;
                  const memberName = member
                    ? `${member.firstName} ${member.lastName}`
                    : "—";
                  const isSub = !!s.subscriptionId;

                  return (
                    <TableRow
                      key={s.id}
                      className="border-slate-50 group hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {formatDateShort(s.saleDate)}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                        {memberName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-lg text-[9px] font-black uppercase tracking-widest border-none px-2 py-0.5",
                            isSub
                              ? "bg-blue-50 text-blue-600"
                              : "bg-emerald-50 text-emerald-600"
                          )}
                        >
                          {isSub ? "Абонамент" : "Инвентар"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-slate-900">
                        {formatPrice(s.totalAmount)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
                      Няма транзакции за този период
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {filteredSales.length > 0 && (
              <TableFooter className="bg-slate-50/80 border-t border-slate-100">
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Общо за периода:
                  </TableCell>
                  <TableCell className="text-right font-black text-lg text-slate-900">
                    {formatPrice(stats.total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReport;
