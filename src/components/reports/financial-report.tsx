"use client";

import { useState, useEffect, useMemo } from "react";
import { useIsMounted } from "@/hooks/useIsMounted";
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
  const isMounted = useIsMounted();

  // Filters
  const [dateFrom, setDateFrom] = useState<Date | undefined>(() =>
    addDays(new Date(), -30)
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(() => new Date());
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

  if (!isMounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4">
        <Loader2
          className="h-8 w-8 animate-spin text-zinc-300"
          strokeWidth={1.5}
        />
        <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
          {!isMounted ? "Инициализиране..." : "Зареждане на отчета..."}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Top Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100">
          <div className="space-y-2.5">
            <Label className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1">
              От дата
            </Label>
            <div className="relative">
              <CalendarIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                strokeWidth={1.5}
              />
              <Input
                type="date"
                value={dateFrom ? formatDateInput(dateFrom) : ""}
                onChange={handleDateChange(setDateFrom)}
                className="pl-12 rounded-xl border-zinc-100 bg-white shadow-none h-12 text-sm font-light focus:ring-zinc-200"
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <Label className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1">
              До дата
            </Label>
            <div className="relative">
              <CalendarIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                strokeWidth={1.5}
              />
              <Input
                type="date"
                value={dateTo ? formatDateInput(dateTo) : ""}
                onChange={handleDateChange(setDateTo)}
                className="pl-12 rounded-xl border-zinc-100 bg-white shadow-none h-12 text-sm font-light focus:ring-zinc-200"
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <Label className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1">
              Тип приходи
            </Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger className="h-12 rounded-xl border-zinc-100 bg-white shadow-none text-sm font-light focus:ring-zinc-200">
                <div className="flex items-center gap-3">
                  <Filter className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                  <SelectValue placeholder="Всички" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 shadow-2xl">
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
            className="rounded-xl h-12 border-zinc-100 font-medium text-[11px] uppercase tracking-widest px-8 transition-all hover:bg-zinc-50"
          >
            <Download className="mr-3 h-4 w-4" strokeWidth={1.5} /> Експорт
            (CSV)
          </Button>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border border-zinc-100 shadow-none bg-white rounded-4xl overflow-hidden col-span-1 lg:col-span-2">
          <CardHeader className="border-b border-zinc-50 p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                  Разпределение на приходите
                </CardTitle>
                <CardDescription className="text-sm font-light mt-2">
                  Визуализация на източниците за избрания период
                </CardDescription>
              </div>
              <PieChartIcon
                className="h-5 w-5 text-zinc-200"
                strokeWidth={1.5}
              />
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={0.8}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid #f4f4f5",
                      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.05)",
                      fontSize: "12px",
                      fontWeight: "300",
                    }}
                    formatter={(value: unknown) => formatPrice(Number(value))}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-[10px] uppercase tracking-widest font-medium text-zinc-400">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-300">
                Няма данни за графиката
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-none bg-zinc-950 text-white rounded-4xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity">
              <TrendingUp className="h-24 w-24 text-zinc-400" strokeWidth={1} />
            </div>
            <CardContent className="p-10 relative z-10">
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-500">
                Общ Приход
              </p>
              <h3 className="text-5xl font-light tracking-tighter mt-6 mb-8">
                {formatPrice(stats.total)}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-medium text-zinc-500 tracking-widest">
                    Дял на абонаментите
                  </span>
                  <span className="text-[10px] font-medium tracking-widest">
                    {Math.round(
                      (stats.subscriptions / (stats.total || 1)) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-1000"
                    style={{
                      width: `${(stats.subscriptions / (stats.total || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card className="border border-zinc-100 shadow-none bg-white p-6 rounded-3xl">
              <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                Абонаменти
              </p>
              <p className="text-xl font-light text-zinc-900 mt-2">
                {formatPrice(stats.subscriptions)}
              </p>
            </Card>
            <Card className="border border-zinc-100 shadow-none bg-white p-6 rounded-3xl">
              <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                Инвентар
              </p>
              <p className="text-xl font-light text-zinc-900 mt-2">
                {formatPrice(stats.inventory)}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <Card className="border border-zinc-100 shadow-none bg-white rounded-5xl overflow-hidden">
        <CardHeader className="border-b border-zinc-50 p-8">
          <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">
            Детайлен списък
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none hover:bg-transparent h-16">
                <TableHead className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 px-8">
                  Дата
                </TableHead>
                <TableHead className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                  Член
                </TableHead>
                <TableHead className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                  Тип
                </TableHead>
                <TableHead className="text-right text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 pr-8">
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
                      className="border-zinc-50 group hover:bg-zinc-50/50 transition-colors h-20"
                    >
                      <TableCell className="px-8 text-[11px] font-medium text-zinc-400">
                        {formatDateShort(s.saleDate)}
                      </TableCell>
                      <TableCell className="text-sm font-light text-zinc-600">
                        {memberName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full text-[9px] font-medium uppercase tracking-widest border-none px-3 py-1",
                            isSub
                              ? "bg-zinc-100 text-zinc-600"
                              : "bg-emerald-50 text-emerald-600"
                          )}
                        >
                          {isSub ? "Абонамент" : "Инвентар"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8 font-medium text-sm text-zinc-900">
                        {formatPrice(s.totalAmount)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-300">
                      Няма транзакции за този период
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {filteredSales.length > 0 && (
              <TableFooter className="bg-zinc-50/50 border-none">
                <TableRow className="h-20 hover:bg-transparent">
                  <TableCell
                    colSpan={3}
                    className="text-right text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 pr-4"
                  >
                    Общо за периода
                  </TableCell>
                  <TableCell className="text-right pr-8 font-light text-2xl text-zinc-950">
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
