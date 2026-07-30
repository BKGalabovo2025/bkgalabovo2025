/* eslint-disable sonarjs/no-nested-conditional */

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useTransition } from "react";
import {
  FinancialReportData,
  generateFinancialReportAction,
} from "@/lib/actions/reports";
import { logAuditAction } from "@/lib/actions/audit";
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
  MoreVertical,
  Trash2,
  Eye,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateExcelReport, generatePdfReport } from "@/lib/export-utils";
import { formatDateInput, formatDateShort } from "@/lib/date-utils";
import { formatPrice } from "@/lib/currency";
import { useAuth } from "@/context/auth-context";
import { deleteSaleAction } from "@/lib/actions/sales";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { idToken, user } = useAuth();
  const router = useRouter();

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

  const handleRowClick = (saleId: string, isPaid: boolean, type?: string) => {
    if (isPaid) {
      if (type === "general_service") {
        router.push(`/finances/general-services/sales/${saleId}/receipt`);
      } else if (type === "inventory") {
        router.push(`/inventory/sales/${saleId}/receipt`);
      } else {
        router.push(`/sales/${saleId}/receipt`);
      }
    } else {
      router.push(`/sales/${saleId}`);
    }
  };

  const handleEdit = (saleId: string, type?: string) => {
    if (type === "general_service") {
      router.push(`/finances/general-services/sales/${saleId}/edit`);
    } else if (type === "inventory") {
      router.push(`/inventory/sales/${saleId}/edit`);
    } else {
      router.push(`/sales/${saleId}/edit`);
    }
  };

  const handleDelete = async (saleId: string) => {
    if (!idToken) return;
    if (
      !confirm(
        "Сигурни ли сте, че искате да изтриете тази продажба? Наличностите ще бъдат възстановени."
      )
    )
      return;

    setIsDeleting(saleId);
    try {
      const result = await deleteSaleAction(saleId, idToken);
      if (result.success) {
        toast.success(result.message || "Продажбата бе изтрита");
        // refresh data
        startTransition(async () => {
          const fromStr = dateFrom ? dateFrom.toISOString() : null;
          const toStr = dateTo ? dateTo.toISOString() : null;
          const newResult = await generateFinancialReportAction(
            fromStr,
            toStr,
            paymentType
          );
          setData(newResult);
        });
      } else {
        toast.error(result.message || "Грешка при изтриване");
      }
    } catch (error) {
      console.error(error);
      toast.error("Неочаквана грешка");
    } finally {
      setIsDeleting(null);
    }
  };

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
    <div className="space-y-10 duration-700 animate-in fade-in">
      {/* Top Controls */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="grid grid-cols-1 gap-6 rounded-3xl border border-zinc-100 bg-zinc-50/50 p-6 md:grid-cols-3 lg:col-span-3">
          <div className="space-y-2.5">
            <Label className="ml-1 text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
              От дата
            </Label>
            <div className="relative">
              <CalendarIcon
                className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400"
                strokeWidth={1.5}
              />
              <Input
                type="date"
                value={dateFrom ? formatDateInput(dateFrom) : ""}
                onChange={handleDateChange(setDateFrom)}
                className="h-12 rounded-xl border-zinc-100 bg-white pl-12 text-sm font-light shadow-none focus:ring-zinc-200"
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <Label className="ml-1 text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
              До дата
            </Label>
            <div className="relative">
              <CalendarIcon
                className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400"
                strokeWidth={1.5}
              />
              <Input
                type="date"
                value={dateTo ? formatDateInput(dateTo) : ""}
                onChange={handleDateChange(setDateTo)}
                className="h-12 rounded-xl border-zinc-100 bg-white pl-12 text-sm font-light shadow-none focus:ring-zinc-200"
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <Label className="ml-1 text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
              Тип приходи
            </Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger className="h-12 rounded-xl border-zinc-100 bg-white text-sm font-light shadow-none focus:ring-zinc-200">
                <div className="flex items-center gap-3">
                  <Filter className="size-4 text-zinc-400" strokeWidth={1.5} />
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
                className="flex h-12 items-center justify-between rounded-xl border-zinc-100 px-8 text-[11px] font-medium tracking-widest uppercase transition-all hover:bg-zinc-50"
              >
                <div className="flex items-center">
                  {isPending ? (
                    <Loader2
                      className="mr-3 size-4 animate-spin"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <Download className="mr-3 size-4" strokeWidth={1.5} />
                  )}
                  Експорт
                </div>
                <ChevronDown
                  className="ml-3 size-4 text-zinc-400"
                  strokeWidth={1.5}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl border-zinc-100 p-2 shadow-xl"
            >
              <DropdownMenuItem
                className="flex cursor-pointer items-center rounded-lg p-3 text-sm font-medium"
                onClick={() => {
                  const exportData = data.sales.map((s) => ({
                    date: formatDateShort(s.saleDate),
                    member: s.memberName,
                    type: "Продажба",
                    amount: s.totalAmount,
                  }));
                  const columns = [
                    { header: "Дата", key: "date", width: 15 },
                    { header: "Член", key: "member", width: 35 },
                    { header: "Тип", key: "type", width: 20 },
                    {
                      header: "Сума (лв.)",
                      key: "amount",
                      width: 15,
                      align: "right" as const,
                      isCurrency: true,
                    },
                  ];
                  generateExcelReport({
                    title: "Финансов Отчет",
                    subtitle: "Бадминтон Клуб Гълъбово",
                    metaData: `Период: ${dateFrom ? formatDateShort(dateFrom.toISOString()) : "Начало"} - ${dateTo ? formatDateShort(dateTo.toISOString()) : "Край"}`,
                    columns,
                    data: exportData,
                    totalLabel: "ОБЩО:",
                    totalValue: data.total,
                    filenamePrefix: "Financial_Report",
                  });
                  logAuditAction(
                    "export_financial_report",
                    `Експортиран финансов отчет (Excel) за период: ${dateFrom ? formatDateShort(dateFrom.toISOString()) : "Всички"} - ${dateTo ? formatDateShort(dateTo.toISOString()) : "Всички"}`,
                    user?.email || "system"
                  );
                }}
              >
                <FileSpreadsheet className="mr-3 size-4 text-emerald-600" />{" "}
                Експорт в Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex cursor-pointer items-center rounded-lg p-3 text-sm font-medium"
                onClick={() => {
                  const exportData = data.sales.map((s) => ({
                    date: formatDateShort(s.saleDate),
                    member: s.memberName,
                    type: "Продажба",
                    amount: s.totalAmount,
                  }));
                  const columns = [
                    { header: "Дата", key: "date", width: 15 },
                    { header: "Член", key: "member", width: 35 },
                    { header: "Тип", key: "type", width: 20 },
                    {
                      header: "Сума (лв.)",
                      key: "amount",
                      width: 15,
                      align: "right" as const,
                      isCurrency: true,
                    },
                  ];
                  generatePdfReport({
                    title: "Финансов Отчет",
                    subtitle: "Бадминтон Клуб Гълъбово",
                    metaData: `Период: ${dateFrom ? formatDateShort(dateFrom.toISOString()) : "Начало"} - ${dateTo ? formatDateShort(dateTo.toISOString()) : "Край"}`,
                    columns,
                    data: exportData,
                    totalLabel: "ОБЩО:",
                    totalValue: data.total,
                    filenamePrefix: "Financial_Report",
                  });
                  logAuditAction(
                    "export_financial_report",
                    `Експортиран финансов отчет (PDF) за период: ${dateFrom ? formatDateShort(dateFrom.toISOString()) : "Всички"} - ${dateTo ? formatDateShort(dateTo.toISOString()) : "Всички"}`,
                    user?.email || "system"
                  );
                }}
              >
                <FileText className="mr-3 size-4 text-red-500" /> Експорт в PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="col-span-1 overflow-hidden rounded-4xl border border-zinc-100 bg-white shadow-none lg:col-span-2">
          <CardHeader className="border-b border-zinc-50 p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                  Разпределение на приходите
                </CardTitle>
                <CardDescription className="mt-2 text-sm font-light">
                  Визуализация на източниците за избрания период
                </CardDescription>
              </div>
              <PieChartIcon
                className="size-5 text-zinc-200"
                strokeWidth={1.5}
              />
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-8">
            {isPending ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-8 animate-spin text-zinc-300" />
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
                      <span className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[11px] font-medium tracking-[0.2em] text-zinc-300 uppercase">
                Няма данни за графиката
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="group relative overflow-hidden rounded-4xl border-none bg-zinc-950 text-white shadow-none">
            <div className="absolute top-0 right-0 p-8 opacity-20 transition-opacity group-hover:opacity-30">
              <TrendingUp className="size-24 text-zinc-400" strokeWidth={1} />
            </div>
            <CardContent className="relative z-10 p-10">
              <p className="text-[11px] font-medium tracking-[0.3em] text-zinc-500 uppercase">
                Общ Приход
              </p>
              <h3 className="mt-6 mb-8 text-5xl font-light tracking-tighter">
                {isPending ? "—" : formatPrice(data.total)}
              </h3>
              <div className="space-y-3"></div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Table */}
      <Card className="overflow-hidden rounded-5xl border border-zinc-100 bg-white shadow-none">
        <CardHeader className="border-b border-zinc-50 p-8">
          <CardTitle className="text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
            Детайлен списък
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow className="h-16 border-none hover:bg-transparent">
                  <TableHead className="px-8 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                    Дата
                  </TableHead>
                  <TableHead className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                    Член
                  </TableHead>
                  <TableHead className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                    Тип
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                    Сума
                  </TableHead>
                  <TableHead className="w-15"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <Loader2 className="mx-auto size-6 animate-spin text-zinc-300" />
                    </TableCell>
                  </TableRow>
                ) : data.sales.length > 0 ? (
                  data.sales.map((s) => {
                    return (
                      <TableRow
                        key={s.id}
                        className="group h-20 border-zinc-50 transition-colors hover:bg-zinc-50/50"
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
                              "rounded-full border-none px-3 py-1 text-[9px] font-medium tracking-widest uppercase",
                              "bg-emerald-50 text-emerald-600"
                            )}
                          >
                            Продажба
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-zinc-900">
                          {formatPrice(s.totalAmount)}
                        </TableCell>
                        <TableCell
                          className="pr-6 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-xl opacity-0 transition-all group-hover:opacity-100 focus:opacity-100"
                                disabled={isDeleting === s.id}
                              >
                                {isDeleting === s.id ? (
                                  <Loader2 className="size-4 animate-spin text-zinc-400" />
                                ) : (
                                  <MoreVertical className="size-4 text-zinc-400" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 rounded-2xl border-zinc-100 p-2 shadow-xl"
                            >
                              <DropdownMenuItem
                                className="flex cursor-pointer items-center rounded-lg p-2 text-sm font-medium"
                                onClick={() =>
                                  handleRowClick(s.id, s.isPaid, s.type)
                                }
                              >
                                <Eye className="mr-3 size-4 text-zinc-400" />{" "}
                                Преглед
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex cursor-pointer items-center rounded-lg p-2 text-sm font-medium"
                                onClick={() => handleEdit(s.id, s.type)}
                              >
                                <Edit className="mr-3 size-4 text-zinc-400" />{" "}
                                Редакция
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex cursor-pointer items-center rounded-lg p-2 text-sm font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                onClick={() => handleDelete(s.id)}
                              >
                                <Trash2 className="mr-3 size-4 text-rose-500" />{" "}
                                Изтрий
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <p className="text-[11px] font-medium tracking-[0.2em] text-zinc-300 uppercase">
                        Няма транзакции за този период
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {data.sales.length > 0 && !isPending && (
                <TableFooter className="border-none bg-zinc-50/50">
                  <TableRow className="h-20 hover:bg-transparent">
                    <TableCell
                      colSpan={3}
                      className="pr-4 text-right text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase"
                    >
                      Общо за периода
                    </TableCell>
                    <TableCell className="text-right text-2xl font-light text-zinc-950">
                      {formatPrice(data.total)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          <div className="flex flex-col divide-y divide-zinc-50 md:hidden">
            {isPending ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-zinc-300" />
              </div>
            ) : data.sales.length > 0 ? (
              data.sales.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-2 bg-white p-4 transition-colors hover:bg-zinc-50/50"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      {formatDateShort(s.saleDate)}
                    </span>
                    <Badge
                      variant="outline"
                      className="rounded-full border-none bg-emerald-50 px-2 py-0.5 text-[9px] font-medium tracking-widest text-emerald-600 uppercase"
                    >
                      Продажба
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-900">
                      {s.memberName}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-zinc-900">
                        {formatPrice(s.totalAmount)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-xl"
                            disabled={isDeleting === s.id}
                          >
                            {isDeleting === s.id ? (
                              <Loader2 className="size-4 animate-spin text-zinc-400" />
                            ) : (
                              <MoreVertical className="size-4 text-zinc-400" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-2xl border-zinc-100 p-2 shadow-xl"
                        >
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center rounded-lg p-2 text-sm font-medium"
                            onClick={() =>
                              handleRowClick(s.id, s.isPaid, s.type)
                            }
                          >
                            <Eye className="mr-3 size-4 text-zinc-400" />{" "}
                            Преглед
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center rounded-lg p-2 text-sm font-medium"
                            onClick={() => handleEdit(s.id, s.type)}
                          >
                            <Edit className="mr-3 size-4 text-zinc-400" />{" "}
                            Редакция
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center rounded-lg p-2 text-sm font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                            onClick={() => handleDelete(s.id)}
                          >
                            <Trash2 className="mr-3 size-4 text-rose-500" />{" "}
                            Изтрий
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-48 items-center justify-center">
                <p className="text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                  Няма транзакции за този период
                </p>
              </div>
            )}
            {data.sales.length > 0 && !isPending && (
              <div className="mt-auto flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 p-4">
                <span className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase">
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
