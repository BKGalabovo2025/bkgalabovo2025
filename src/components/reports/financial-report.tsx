/* eslint-disable sonarjs/no-nested-conditional */

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useTransition } from "react";
import {
  FinancialReportData,
  generateFinancialReportAction,
} from "@/lib/actions/reports";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import {
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Download,
  TrendingUp,
  PieChart as PieChartIcon,
  Calendar as CalendarIcon,
  Filter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exportFinancialToExcel,
  exportFinancialToPdf,
} from "@/lib/export-utils";
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

interface FinancialReportProps {
  initialData: FinancialReportData;
}

const FinancialReport = ({ initialData }: FinancialReportProps) => {
  const [data, setData] = useState<FinancialReportData>(initialData);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [dateFrom, setDateFrom] = useState<Date | undefined>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [dateTo, setDateTo] = useState<Date | undefined>(() => new Date());
  const [paymentType, setPaymentType] = useState<string>("all");

  useEffect(() => {
    startTransition(async () => {
      const fromStr = dateFrom ? dateFrom.toISOString() : null;
      const toStr = dateTo ? dateTo.toISOString() : null;
      const result = await generateFinancialReportAction(
        fromStr,
        toStr,
        paymentType
      );
      setData(result);
    });
  }, [dateFrom, dateTo, paymentType]);

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
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={data.sales.length === 0 || isPending}
                className="rounded-xl h-12 border-zinc-100 font-medium text-[11px] uppercase tracking-widest px-8 transition-all hover:bg-zinc-50 flex items-center justify-between"
              >
                <div className="flex items-center">
                  {isPending ? (
                    <Loader2
                      className="mr-3 h-4 w-4 animate-spin"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <Download className="mr-3 h-4 w-4" strokeWidth={1.5} />
                  )}
                  Експорт
                </div>
                <ChevronDown
                  className="ml-3 h-4 w-4 text-zinc-400"
                  strokeWidth={1.5}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl p-2 shadow-xl border-zinc-100"
            >
              <DropdownMenuItem
                className="text-sm font-medium rounded-lg cursor-pointer p-3 flex items-center"
                onClick={() => {
                  const exportData = data.sales.map((s) => ({
                    date: formatDateShort(s.saleDate),
                    member: s.memberName,
                    type: "Продажба",
                    amount: s.totalAmount,
                  }));
                  exportFinancialToExcel({
                    title: "Финансов Отчет",
                    subtitle: "Бадминтон Клуб Гълъбово",
                    period: `${dateFrom ? formatDateShort(dateFrom.toISOString()) : "Начало"} - ${dateTo ? formatDateShort(dateTo.toISOString()) : "Край"}`,
                    rows: exportData,
                    total: data.total,
                  });
                }}
              >
                <FileSpreadsheet className="mr-3 h-4 w-4 text-emerald-600" />{" "}
                Експорт в Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sm font-medium rounded-lg cursor-pointer p-3 flex items-center"
                onClick={() => {
                  const exportData = data.sales.map((s) => ({
                    date: formatDateShort(s.saleDate),
                    member: s.memberName,
                    type: "Продажба",
                    amount: s.totalAmount,
                  }));
                  exportFinancialToPdf({
                    title: "Финансов Отчет",
                    subtitle: "Бадминтон Клуб Гълъбово",
                    period: `${dateFrom ? formatDateShort(dateFrom.toISOString()) : "Начало"} - ${dateTo ? formatDateShort(dateTo.toISOString()) : "Край"}`,
                    rows: exportData,
                    total: data.total,
                  });
                }}
              >
                <FileText className="mr-3 h-4 w-4 text-red-500" /> Експорт в PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            {isPending ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 text-zinc-300 animate-spin" />
              </div>
            ) : data.chartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={1}
                minHeight={1}
              >
                <PieChart>
                  <Pie
                    data={data.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.chartData.map((entry: any, index: number) => (
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
                {isPending ? "—" : formatPrice(data.total)}
              </h3>
              <div className="space-y-3"></div>
            </CardContent>
          </Card>
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
          <div className="hidden md:block">
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
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center">
                      <Loader2 className="h-6 w-6 text-zinc-300 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data.sales.length > 0 ? (
                  data.sales.map((s) => {
                    return (
                      <TableRow
                        key={s.id}
                        className="border-zinc-50 group hover:bg-zinc-50/50 transition-colors h-20"
                      >
                        <TableCell className="px-8 text-[11px] font-medium text-zinc-400">
                          {formatDateShort(s.saleDate)}
                        </TableCell>
                        <TableCell className="text-sm font-light text-zinc-600">
                          {s.memberName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full text-[9px] font-medium uppercase tracking-widest border-none px-3 py-1",
                              "bg-emerald-50 text-emerald-600"
                            )}
                          >
                            Продажба
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
              {data.sales.length > 0 && !isPending && (
                <TableFooter className="bg-zinc-50/50 border-none">
                  <TableRow className="h-20 hover:bg-transparent">
                    <TableCell
                      colSpan={3}
                      className="text-right text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 pr-4"
                    >
                      Общо за периода
                    </TableCell>
                    <TableCell className="text-right pr-8 font-light text-2xl text-zinc-950">
                      {formatPrice(data.total)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          <div className="md:hidden flex flex-col divide-y divide-zinc-50">
            {isPending ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-zinc-300 animate-spin" />
              </div>
            ) : data.sales.length > 0 ? (
              data.sales.map((s) => (
                <div
                  key={s.id}
                  className="p-4 flex flex-col gap-2 bg-white hover:bg-zinc-50/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
                      {formatDateShort(s.saleDate)}
                    </span>
                    <Badge
                      variant="outline"
                      className="rounded-full text-[9px] font-medium uppercase tracking-widest border-none px-2 py-0.5 bg-emerald-50 text-emerald-600"
                    >
                      Продажба
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-medium text-zinc-900">
                      {s.memberName}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900">
                      {formatPrice(s.totalAmount)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                  Няма транзакции за този период
                </p>
              </div>
            )}
            {data.sales.length > 0 && !isPending && (
              <div className="p-4 bg-zinc-50/50 flex justify-between items-center mt-auto border-t border-zinc-100">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                  Общо за периода
                </span>
                <span className="text-xl font-semibold text-zinc-950">
                  {formatPrice(data.total)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReport;
