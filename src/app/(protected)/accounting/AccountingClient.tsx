"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/forbid-dom-props */

import {
  differenceInDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { bg } from "date-fns/locale";
import ExcelJS from "exceljs";
import { getDocs } from "firebase/firestore";
import {
  Bed,
  Calculator,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  Mail,
  Pizza,
  Ticket,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BusinessTripManagerDialog } from "@/components/business-trips/BusinessTripManagerDialog";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSiteConfig } from "@/config/sites";
import { useAuth } from "@/context/auth-context";
import { formatDateShort } from "@/lib/date-utils";
import { getEventsQuery } from "@/lib/firebase-collections";
import { generatePdfFromElement } from "@/lib/html-to-pdf";
import { businessTripService } from "@/services/business-trip-service";
import { getAllMembers } from "@/services/member-service";
import { docToScheduleEvent } from "@/services/schedule-service";
import {
  BusinessTrip,
  convertEurToBgn,
  TripExpense,
} from "@/types/business-trip.types";
import { ScheduleEvent } from "@/types/index";
import { Member } from "@/types/member.types";

export default function AccountingClient() {
  const site = getSiteConfig();
  const [trips, setTrips] = useState<BusinessTrip[]>([]);
  const [expenses, setExpenses] = useState<Record<string, TripExpense[]>>({});
  const [membersDict, setMembersDict] = useState<Record<string, Member>>({});
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { user } = useAuth();

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(
    null
  );
  const [isTripManagerOpen, setIsTripManagerOpen] = useState(false);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    startOfMonth(new Date())
  );
  const [activityFilter, setActivityFilter] = useState<
    "all" | "commercial" | "non-commercial"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "approved" | "completed"
  >("all");

  const siteId = "bkgalabovo"; // Ideally from context

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchedTrips = await businessTripService.getTrips(siteId);
        setTrips(fetchedTrips);

        const fetchedMembers = await getAllMembers();
        const dict: Record<string, Member> = {};
        fetchedMembers.forEach((m) => {
          dict[m.id!] = m;
        });
        setMembersDict(dict);

        // Fetch events so we can map trips to their events for editing
        const snapshot = await getDocs(getEventsQuery());
        const evts = snapshot.docs
          .map(docToScheduleEvent)
          .filter(Boolean) as ScheduleEvent[];
        setEvents(evts);

        // Fetch all expenses for all trips... this might be heavy, but it's an admin view.
        // We can optimize by fetching only for filtered trips later.
        const expensesMap: Record<string, TripExpense[]> = {};
        for (const trip of fetchedTrips) {
          if (trip.id) {
            expensesMap[trip.id] = await businessTripService.getExpensesByTrip(
              trip.id
            );
          }
        }
        setExpenses(expensesMap);
      } catch (error) {
        console.error(error);
        toast.error("Грешка при зареждане на данните");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [siteId]);

  const loadData = async () => {
    // Only refresh trips and expenses to reflect edits/deletions quickly
    try {
      const fetchedTrips = await businessTripService.getTrips(siteId);
      setTrips(fetchedTrips);

      const expensesMap: Record<string, TripExpense[]> = {};
      for (const trip of fetchedTrips) {
        if (trip.id) {
          expensesMap[trip.id] = await businessTripService.getExpensesByTrip(
            trip.id
          );
        }
      }
      setExpenses(expensesMap);
    } catch (e) {
      console.error("Error refreshing data after edit", e);
    }
  };

  const handleManageTrip = (trip: BusinessTrip) => {
    const ev = events.find((e) => e.id === trip.eventId);
    if (!ev) {
      toast.error("Събитието не е намерено. Моля, презаредете страницата.");
      return;
    }
    setSelectedEvent(ev);
    setIsTripManagerOpen(true);
  };

  // Derived state (filtered data)
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      // 1. Month filter
      const tripDate = parseISO(trip.startDate);
      const isSameMonth =
        tripDate.getFullYear() === selectedMonth.getFullYear() &&
        tripDate.getMonth() === selectedMonth.getMonth();
      if (!isSameMonth) return false;

      // 2. Activity filter
      if (
        activityFilter === "commercial" &&
        !trip.financials.isCommercialActivity
      )
        return false;
      if (
        activityFilter === "non-commercial" &&
        trip.financials.isCommercialActivity
      )
        return false;

      // 3. Status filter
      if (statusFilter !== "all" && trip.status !== statusFilter) return false;

      return true;
    });
  }, [trips, selectedMonth, activityFilter, statusFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    let totalKM = 0;
    let totalPerDiem = 0;
    let totalAccommodation = 0;
    let totalFuelAndTransport = 0;
    let totalOther = 0;
    let totalEntryFees = 0;

    filteredTrips.forEach((trip) => {
      const sDate = parseISO(trip.startDate);
      const eDate = parseISO(trip.endDate);
      const numDays = differenceInDays(eDate, sDate) + 1;
      const numNights = Math.max(0, numDays - 1);
      const numPeople = (trip.participantsIds?.length || 0) + 1;

      const calcPerDiem = trip.financials.perDiemRateEUR * numDays * numPeople;
      const calcAccom =
        trip.financials.accommodationRateEUR * numNights * numPeople;
      const calcEntry = trip.financials.entryFeeEUR || 0;
      let calcFuel = 0;

      if (trip.vehicle && trip.vehicle.distanceKm) {
        totalKM += trip.vehicle.distanceKm;
        if (trip.vehicle.fuelNorm) {
          calcFuel =
            (trip.vehicle.distanceKm / 100) * trip.vehicle.fuelNorm * 1.35; // Default 1.35
        }
      }

      const tripExp = expenses[trip.id!] || [];
      let expPerDiem = 0,
        expAccom = 0,
        expEntry = 0,
        expOther = 0;

      const fuelExpenses = tripExp.filter((e) => e.expenseType === "fuel");
      const transportExpenses = tripExp.filter(
        (e) => e.expenseType === "transport"
      );

      const avgPricePerLiterEUR =
        fuelExpenses.length > 0
          ? fuelExpenses.reduce((sum, e) => sum + e.amountEUR, 0) /
            fuelExpenses.length
          : 0;

      let finalFuelEUR = calcFuel;
      if (
        fuelExpenses.length > 0 &&
        trip.vehicle &&
        trip.vehicle.distanceKm &&
        trip.vehicle.fuelNorm
      ) {
        const totalLiters =
          (trip.vehicle.distanceKm / 100) * trip.vehicle.fuelNorm;
        const avgPricePerLiterBGN = avgPricePerLiterEUR * 1.95583;
        const roundedPricePerLiterBGN =
          Math.round(avgPricePerLiterBGN * 100) / 100;
        const finalFuelBGN = totalLiters * roundedPricePerLiterBGN;
        finalFuelEUR = finalFuelBGN > 0 ? finalFuelBGN / 1.95583 : 0;
      }

      const expTransport = transportExpenses.reduce(
        (sum, e) => sum + e.amountEUR,
        0
      );

      tripExp.forEach((ex) => {
        if (ex.expenseType === "accommodation") expAccom += ex.amountEUR;
        else if (ex.expenseType === "food") expPerDiem += ex.amountEUR;
        else if (ex.expenseType === "entry_fee") expEntry += ex.amountEUR;
        else if (ex.expenseType !== "fuel" && ex.expenseType !== "transport")
          expOther += ex.amountEUR;
      });

      totalPerDiem += expPerDiem > 0 ? expPerDiem : calcPerDiem;
      totalAccommodation += expAccom > 0 ? expAccom : calcAccom;
      totalEntryFees += expEntry > 0 ? expEntry : calcEntry;
      totalFuelAndTransport +=
        (fuelExpenses.length > 0 ? finalFuelEUR : calcFuel) + expTransport;
      totalOther += expOther;
    });

    const totalEur =
      totalPerDiem +
      totalAccommodation +
      totalFuelAndTransport +
      totalOther +
      totalEntryFees;

    return {
      totalKM,
      totalPerDiem,
      totalAccommodation,
      totalFuelAndTransport,
      totalEntryFees,
      totalOther,
      totalEur,
      totalBgn: convertEurToBgn(totalEur),
    };
  }, [filteredTrips, expenses]);

  // Handlers for month navigation
  const prevMonth = () => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(d);
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Отчет Разходи");

    sheet.columns = [
      { header: "Дата", key: "date", width: 15 },
      { header: "Командировка / Събитие", key: "event", width: 30 },
      { header: "Треньор", key: "coach", width: 25 },
      { header: "Дейност", key: "activity", width: 15 },
      { header: "Гориво/Транспорт (EUR)", key: "transport", width: 25 },
      { header: "Нощувки (EUR)", key: "accommodation", width: 20 },
      { header: "Дневни/Храна (EUR)", key: "food", width: 20 },
      { header: "Други (EUR)", key: "other", width: 15 },
      { header: "Общо (EUR)", key: "totalEur", width: 15 },
      { header: "Общо (BGN)", key: "totalBgn", width: 15 },
    ];

    filteredTrips.forEach((trip) => {
      const coach = membersDict[trip.coachId];
      const coachName = coach
        ? `${coach.firstName} ${coach.lastName}`
        : "Неизвестен";

      let trans = 0,
        acc = 0,
        food = 0,
        other = 0;

      // Auto vehicle cost
      if (trip.vehicle && trip.vehicle.distanceKm && trip.vehicle.fuelNorm) {
        trans += (trip.vehicle.distanceKm / 100) * trip.vehicle.fuelNorm * 1.35;
      }

      // Receipt costs
      const exps = expenses[trip.id!] || [];
      exps.forEach((ex) => {
        if (ex.expenseType === "fuel" || ex.expenseType === "transport")
          trans += ex.amountEUR;
        else if (ex.expenseType === "accommodation") acc += ex.amountEUR;
        else if (ex.expenseType === "food") food += ex.amountEUR;
        else other += ex.amountEUR;
      });

      const totalEur = trans + acc + food + other;

      sheet.addRow({
        date: formatDateShort(trip.startDate),
        event: trip.title,
        coach: coachName,
        activity: trip.financials.isCommercialActivity
          ? "Стопанска"
          : "Нестопанска",
        transport: trans.toFixed(2),
        accommodation: acc.toFixed(2),
        food: food.toFixed(2),
        other: other.toFixed(2),
        totalEur: totalEur.toFixed(2),
        totalBgn: convertEurToBgn(totalEur).toFixed(2),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Otchet_${format(selectedMonth, "MM_yyyy")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintProtocol = async () => {
    setIsGeneratingPdf(true);
    toast.info("Генериране на PDF протокол...");
    setTimeout(async () => {
      const el = document.getElementById("pdf-protocol-template");
      if (el) {
        await generatePdfFromElement(
          el,
          `Protokol_${format(selectedMonth, "MM_yyyy")}.pdf`
        );
        toast.success("Протоколът е генериран успешно!");
      }
      setIsGeneratingPdf(false);
    }, 100);
  };

  const handlePreviewProtocol = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      const el = document.getElementById("pdf-protocol-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          m.previewPdfFromElement(el, "portrait").finally(() =>
            setIsGeneratingPdf(false)
          );
        });
      } else {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  const handleEmailProtocol = () => {
    const email = window.prompt(
      "Моля, въведете имейл адрес, на който да изпратим документа:",
      user?.email || "bkgalabovo2014@gmail.com"
    );
    if (!email) return;

    setIsGeneratingPdf(true);
    toast.info("Подготовка на имейл...");
    setTimeout(() => {
      const el = document.getElementById("pdf-protocol-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          m.getPdfBase64FromElement(el, "portrait")
            .then(async (base64Data) => {
              const filename = `Protokol_${format(selectedMonth, "MM_yyyy")}.pdf`;
              const attachmentContent = base64Data.split(",")[1] || base64Data;

              const token = await user?.getIdToken();

              const res = await fetch("/api/send-email", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  to: email,
                  subject: `Месечен приемо-предавателен протокол (${format(selectedMonth, "MM.yyyy")})`,
                  template: "marketing",
                  data: {
                    messageText: `Прикачен е месечният приемо-предавателен протокол от ${site.shortName} за отчетен месец ${format(selectedMonth, "MM.yyyy")}.`,
                  },
                  attachments: [
                    {
                      filename,
                      content: attachmentContent,
                      encoding: "base64",
                    },
                  ],
                }),
              });

              if (!res.ok) throw new Error("Failed to send email");
              toast.success("Протоколът е изпратен успешно!");
            })
            .catch((e) => {
              console.error(e);
              toast.error("Възникна грешка при изпращането.");
            })
            .finally(() => setIsGeneratingPdf(false));
        });
      } else {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Зареждане на счетоводни данни...
      </div>
    );
  }

  return (
    <div className="relative space-y-8 pb-12 duration-500 animate-in fade-in">
      <PageHeader
        title="Счетоводни отчети"
        description="Глобален преглед на всички транспортни разходи и командировки по месеци."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Отчети" },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="rounded-xl border-slate-200"
          >
            <FileDown className="mr-2 size-4" /> Експорт (Excel)
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                disabled={isGeneratingPdf}
                className="rounded-xl bg-zinc-950 text-white shadow-sm hover:bg-zinc-800"
              >
                {isGeneratingPdf ? "Зареждане..." : "Печат Протокол (PDF)"}
                <ChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={handlePreviewProtocol}
                className="cursor-pointer"
              >
                <Eye className="mr-2 size-4" />
                <span>Преглед на протокол</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handlePrintProtocol}
                className="cursor-pointer"
              >
                <FileDown className="mr-2 size-4" />
                <span>Изтегли PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleEmailProtocol}
                className="cursor-pointer"
              >
                <Mail className="mr-2 size-4" />
                <span>Изпрати по имейл</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>

      {/* Filters */}
      <BentoCard className="flex flex-wrap items-center gap-4 border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mr-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevMonth}
            className="size-9"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="min-w-30 text-center font-semibold text-zinc-900 capitalize">
            {format(selectedMonth, "MMMM yyyy", { locale: bg })}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            className="size-9"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={activityFilter}
            onValueChange={(val: any) => setActivityFilter(val)}
          >
            <SelectTrigger className="h-9 w-45">
              <SelectValue placeholder="Вид дейност" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички дейности</SelectItem>
              <SelectItem value="non-commercial">Нестопанска</SelectItem>
              <SelectItem value="commercial">Стопанска</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(val: any) => setStatusFilter(val)}
          >
            <SelectTrigger className="h-9 w-45">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички статуси</SelectItem>
              <SelectItem value="draft">Чернови</SelectItem>
              <SelectItem value="approved">Одобрени</SelectItem>
              <SelectItem value="completed">Приключени</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </BentoCard>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <BentoCard className="border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:border-blue-900/30 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2.5 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              <Calculator className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Общо Разходи (EUR)
              </p>
              <h4 className="text-2xl font-bold text-blue-950 dark:text-blue-100">
                €{kpis.totalEur.toFixed(2)}
              </h4>
            </div>
          </div>
          <p className="mt-4 text-xs font-medium text-blue-600/80">
            Равносметка: {kpis.totalBgn.toFixed(2)} BGN
          </p>
        </BentoCard>

        <BentoCard className="p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-2.5 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
              <Car className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Транспорт & Гориво
              </p>
              <h4 className="text-xl font-bold text-zinc-900 dark:text-white">
                €{kpis.totalFuelAndTransport.toFixed(2)}
              </h4>
            </div>
          </div>
          <p className="text-xs text-zinc-400">
            Вкл. {kpis.totalKM} изминати км
          </p>
        </BentoCard>

        <BentoCard className="p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2.5 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
              <Bed className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Нощувки / Квартирни
              </p>
              <h4 className="text-xl font-bold text-zinc-900 dark:text-white">
                €{kpis.totalAccommodation.toFixed(2)}
              </h4>
            </div>
          </div>
        </BentoCard>

        <BentoCard className="p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <Pizza className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Дневни & Храна
              </p>
              <h4 className="text-xl font-bold text-zinc-900 dark:text-white">
                €{kpis.totalPerDiem.toFixed(2)}
              </h4>
            </div>
          </div>
        </BentoCard>

        <BentoCard className="p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-full bg-pink-100 p-2.5 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300">
              <Ticket className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Такси участие</p>
              <h4 className="text-xl font-bold text-zinc-900 dark:text-white">
                €{kpis.totalEntryFees.toFixed(2)}
              </h4>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* Table */}
      <BentoCard>
        <div className="border-b border-zinc-100 p-6 dark:border-zinc-800">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
            Детайлен опис на командировките
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Командировка</TableHead>
                <TableHead>Треньор</TableHead>
                <TableHead>Дейност</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Сума (EUR)</TableHead>
                <TableHead className="text-right">Документи</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-zinc-500"
                  >
                    Няма намерени записи за този период.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrips.map((trip) => {
                  const coach = membersDict[trip.coachId];
                  const coachName = coach
                    ? `${coach.firstName} ${coach.lastName}`
                    : "Неизвестен";

                  let total = 0;
                  const sDate = parseISO(trip.startDate);
                  const eDate = parseISO(trip.endDate);
                  const numDays = Math.max(
                    1,
                    differenceInDays(eDate, sDate) + 1
                  );
                  const numNights = Math.max(0, numDays - 1);
                  const numPeople = (trip.participantsIds?.length || 0) + 1;

                  const calcPerDiem =
                    trip.financials.perDiemRateEUR * numDays * numPeople;
                  const calcAccom =
                    trip.financials.accommodationRateEUR *
                    numNights *
                    numPeople;
                  const calcEntry = trip.financials.entryFeeEUR || 0;
                  let calcFuel = 0;

                  if (trip.vehicle?.distanceKm && trip.vehicle?.fuelNorm) {
                    calcFuel =
                      (trip.vehicle.distanceKm / 100) *
                      trip.vehicle.fuelNorm *
                      1.35;
                  }

                  const tripExps = expenses[trip.id!] || [];
                  let expPerDiem = 0,
                    expAccom = 0,
                    expEntry = 0,
                    expOther = 0;

                  const fuelExpenses = tripExps.filter(
                    (e) => e.expenseType === "fuel"
                  );
                  const transportExpenses = tripExps.filter(
                    (e) => e.expenseType === "transport"
                  );

                  const avgPricePerLiterEUR =
                    fuelExpenses.length > 0
                      ? fuelExpenses.reduce((sum, e) => sum + e.amountEUR, 0) /
                        fuelExpenses.length
                      : 0;

                  let finalFuelEUR = calcFuel;
                  if (
                    fuelExpenses.length > 0 &&
                    trip.vehicle?.distanceKm &&
                    trip.vehicle?.fuelNorm
                  ) {
                    const totalLiters =
                      (trip.vehicle.distanceKm / 100) * trip.vehicle.fuelNorm;
                    const finalFuelBGN =
                      totalLiters *
                      (Math.round(avgPricePerLiterEUR * 1.95583 * 100) / 100);
                    finalFuelEUR =
                      finalFuelBGN > 0 ? finalFuelBGN / 1.95583 : 0;
                  }

                  const expTransport = transportExpenses.reduce(
                    (sum, e) => sum + e.amountEUR,
                    0
                  );

                  tripExps.forEach((ex) => {
                    if (ex.expenseType === "accommodation")
                      expAccom += ex.amountEUR;
                    else if (ex.expenseType === "food")
                      expPerDiem += ex.amountEUR;
                    else if (ex.expenseType === "entry_fee")
                      expEntry += ex.amountEUR;
                    else if (
                      ex.expenseType !== "fuel" &&
                      ex.expenseType !== "transport"
                    )
                      expOther += ex.amountEUR;
                  });

                  total =
                    (expPerDiem > 0 ? expPerDiem : calcPerDiem) +
                    (expAccom > 0 ? expAccom : calcAccom) +
                    (expEntry > 0 ? expEntry : calcEntry) +
                    (fuelExpenses.length > 0 ? finalFuelEUR : calcFuel) +
                    expTransport +
                    expOther;

                  const getStatusVariant = (s: string) => {
                    if (s === "approved") return "default";
                    if (s === "completed") return "secondary";
                    return "outline";
                  };

                  const getStatusClass = (s: string) => {
                    if (s === "completed")
                      return "border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
                    return "";
                  };

                  const getStatusText = (s: string) => {
                    if (s === "draft") return "Чернова";
                    if (s === "approved") return "Одобрена";
                    if (s === "completed") return "Отчетена";
                    return s;
                  };

                  return (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">
                        {formatDateShort(trip.startDate)}
                      </TableCell>
                      <TableCell>{trip.title}</TableCell>
                      <TableCell>{coachName}</TableCell>
                      <TableCell>
                        {trip.financials.isCommercialActivity ? (
                          <Badge
                            variant="outline"
                            className="border-orange-200 bg-orange-50 text-orange-600"
                          >
                            Стопанска
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-green-200 bg-green-50 text-green-600"
                          >
                            Нестопанска
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusVariant(trip.status || "")}
                          className={`capitalize ${getStatusClass(trip.status || "")}`}
                        >
                          {getStatusText(trip.status || "")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        €{total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {tripExps.length > 0 ? (
                          <span className="text-sm text-zinc-500">
                            {tripExps.length} фактури
                          </span>
                        ) : (
                          <span className="text-sm text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageTrip(trip)}
                        >
                          Управление
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </BentoCard>

      {/* Hidden PDF Template for Protocol */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div
          id="pdf-protocol-template"
          className="bg-white p-12 text-black"
          style={{
            width: "210mm",
            minHeight: "297mm",
            fontFamily: "Arial, sans-serif",
            fontSize: "10pt",
            color: "#000",
            lineHeight: "1.5",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: "10pt",
              marginBottom: "12pt",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10pt" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Logo"
                style={{ height: "45pt", objectFit: "contain" }}
              />
              <div>
                <p
                  style={{
                    fontWeight: "700",
                    fontSize: "14pt",
                    margin: 0,
                    color: "#0f172a",
                    textAlign: "left",
                  }}
                >
                  &bdquo;{site.shortName.toUpperCase()}&ldquo;
                </p>
                {site.bulstat && (
                  <p
                    style={{
                      fontSize: "9pt",
                      margin: "2pt 0 0 0",
                      color: "#64748b",
                      textAlign: "left",
                    }}
                  >
                    БУЛСТАТ: {site.bulstat} | {site.contact.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", margin: "20pt 0" }}>
            <h2 style={{ fontSize: "14pt", fontWeight: "bold" }}>
              МЕСЕЧЕН ПРИЕМО-ПРЕДАВАТЕЛЕН ПРОТОКОЛ
            </h2>
            <p style={{ fontSize: "11pt", marginTop: "4pt" }}>
              За отчитане на транспортни и командировъчни разходи
            </p>
            <p
              style={{ fontSize: "11pt", marginTop: "8pt", fontWeight: "bold" }}
            >
              Отчетен месец:{" "}
              <span style={{ textTransform: "capitalize" }}>
                {format(selectedMonth, "MMMM yyyy", { locale: bg })}
              </span>
            </p>
          </div>

          <p
            style={{
              fontSize: "11pt",
              marginBottom: "16pt",
              textIndent: "20pt",
              textAlign: "justify",
            }}
          >
            Днес, {format(endOfMonth(selectedMonth), "dd.MM.yyyy")} г., се
            състави настоящият приемо-предавателен протокол, удостоверяващ
            предаването на първични счетоводни документи (фактури, фискални
            бонове, билети и др.), ведно с прилежащите им Заповеди за
            командировки, Пътни листи и отчети, доказващи извършените разходи за
            дейността на клуба през месец{" "}
            {format(selectedMonth, "MMMM yyyy", { locale: bg })}.
          </p>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "10pt",
              marginBottom: "20pt",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid #0f172a",
                    padding: "6pt 8pt",
                    backgroundColor: "#f8fafc",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  №
                </th>
                <th
                  style={{
                    border: "1px solid #0f172a",
                    padding: "6pt 8pt",
                    backgroundColor: "#f8fafc",
                    fontWeight: "bold",
                    textAlign: "left",
                  }}
                >
                  Командировка / Събитие
                </th>
                <th
                  style={{
                    border: "1px solid #0f172a",
                    padding: "6pt 8pt",
                    backgroundColor: "#f8fafc",
                    fontWeight: "bold",
                    textAlign: "left",
                  }}
                >
                  Водач / Треньор
                </th>
                <th
                  style={{
                    border: "1px solid #0f172a",
                    padding: "6pt 8pt",
                    backgroundColor: "#f8fafc",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Вид дейност
                </th>
                <th
                  style={{
                    border: "1px solid #0f172a",
                    padding: "6pt 8pt",
                    backgroundColor: "#f8fafc",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Документи (бр.)
                </th>
                <th
                  style={{
                    border: "1px solid #0f172a",
                    padding: "6pt 8pt",
                    backgroundColor: "#f8fafc",
                    fontWeight: "bold",
                    textAlign: "right",
                  }}
                >
                  Сума (EUR)
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map((trip, idx) => {
                const coach = membersDict[trip.coachId];
                const coachName = coach
                  ? `${coach.firstName} ${coach.lastName}`
                  : "Неизвестен";
                let total = 0;
                const sDate = parseISO(trip.startDate);
                const eDate = parseISO(trip.endDate);
                const numDays = differenceInDays(eDate, sDate) + 1;
                const numNights = Math.max(0, numDays - 1);
                const numPeople = (trip.participantsIds?.length || 0) + 1;

                const calcPerDiem =
                  trip.financials.perDiemRateEUR * numDays * numPeople;
                const calcAccom =
                  trip.financials.accommodationRateEUR * numNights * numPeople;
                const calcEntry = trip.financials.entryFeeEUR || 0;
                let calcFuel = 0;

                if (
                  trip.vehicle &&
                  trip.vehicle.distanceKm &&
                  trip.vehicle.fuelNorm
                ) {
                  calcFuel =
                    (trip.vehicle.distanceKm / 100) *
                    trip.vehicle.fuelNorm *
                    1.35;
                }

                const tripExps = expenses[trip.id!] || [];
                let expPerDiem = 0,
                  expAccom = 0,
                  expEntry = 0,
                  expOther = 0;

                const fuelExpenses = tripExps.filter(
                  (e) => e.expenseType === "fuel"
                );
                const transportExpenses = tripExps.filter(
                  (e) => e.expenseType === "transport"
                );

                const avgPricePerLiterEUR =
                  fuelExpenses.length > 0
                    ? fuelExpenses.reduce((sum, e) => sum + e.amountEUR, 0) /
                      fuelExpenses.length
                    : 0;

                let finalFuelEUR = calcFuel;
                if (
                  fuelExpenses.length > 0 &&
                  trip.vehicle &&
                  trip.vehicle.distanceKm &&
                  trip.vehicle.fuelNorm
                ) {
                  const totalLiters =
                    (trip.vehicle.distanceKm / 100) * trip.vehicle.fuelNorm;
                  const avgPricePerLiterBGN = avgPricePerLiterEUR * 1.95583;
                  const roundedPricePerLiterBGN =
                    Math.round(avgPricePerLiterBGN * 100) / 100;
                  const finalFuelBGN = totalLiters * roundedPricePerLiterBGN;
                  finalFuelEUR = finalFuelBGN > 0 ? finalFuelBGN / 1.95583 : 0;
                }

                const expTransport = transportExpenses.reduce(
                  (sum, e) => sum + e.amountEUR,
                  0
                );

                tripExps.forEach((ex) => {
                  if (ex.expenseType === "accommodation")
                    expAccom += ex.amountEUR;
                  else if (ex.expenseType === "food")
                    expPerDiem += ex.amountEUR;
                  else if (ex.expenseType === "entry_fee")
                    expEntry += ex.amountEUR;
                  else if (
                    ex.expenseType !== "fuel" &&
                    ex.expenseType !== "transport"
                  )
                    expOther += ex.amountEUR;
                });

                total =
                  (expPerDiem > 0 ? expPerDiem : calcPerDiem) +
                  (expAccom > 0 ? expAccom : calcAccom) +
                  (expEntry > 0 ? expEntry : calcEntry) +
                  (fuelExpenses.length > 0 ? finalFuelEUR : calcFuel) +
                  expTransport +
                  expOther;

                return (
                  <tr key={trip.id}>
                    <td
                      style={{
                        border: "1px solid #0f172a",
                        padding: "6pt 8pt",
                        textAlign: "center",
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      style={{
                        border: "1px solid #0f172a",
                        padding: "6pt 8pt",
                      }}
                    >
                      {trip.title}, от {format(sDate, "dd.MM.yyyy")} до{" "}
                      {format(eDate, "dd.MM.yyyy")} в {trip.destination}
                    </td>
                    <td
                      style={{
                        border: "1px solid #0f172a",
                        padding: "6pt 8pt",
                      }}
                    >
                      {coachName}
                    </td>
                    <td
                      style={{
                        border: "1px solid #0f172a",
                        padding: "6pt 8pt",
                        textAlign: "center",
                      }}
                    >
                      {trip.financials.isCommercialActivity
                        ? "Стопанска"
                        : "Нестопанска"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #0f172a",
                        padding: "6pt 8pt",
                        textAlign: "center",
                      }}
                    >
                      {tripExps.length + (trip.vehicle?.distanceKm ? 1 : 0)}
                    </td>
                    <td
                      style={{
                        border: "1px solid #0f172a",
                        padding: "6pt 8pt",
                        textAlign: "right",
                      }}
                    >
                      €{total.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ fontWeight: "bold" }}>
                <td
                  colSpan={5}
                  style={{
                    border: "1px solid #0f172a",
                    padding: "6pt 8pt",
                    textAlign: "right",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  ОБЩО ЗА МЕСЕЦА (EUR):
                </td>
                <td
                  style={{
                    border: "1px solid #0f172a",
                    padding: "6pt 8pt",
                    textAlign: "right",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  €{kpis.totalEur.toFixed(2)}
                </td>
              </tr>
              <tr style={{ fontWeight: "bold" }}>
                <td
                  colSpan={5}
                  style={{
                    border: "1px solid #0f172a",
                    padding: "6pt 8pt",
                    textAlign: "right",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  РАВНОСМЕТКА В ЛЕВА (BGN):
                </td>
                <td
                  style={{
                    border: "1px solid #0f172a",
                    padding: "6pt 8pt",
                    textAlign: "right",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  {kpis.totalBgn.toFixed(2)} лв.
                </td>
              </tr>
            </tbody>
          </table>

          <p
            style={{
              fontSize: "11pt",
              textIndent: "20pt",
              textAlign: "justify",
              marginBottom: "40pt",
            }}
          >
            Долуподписаният Председател на {site.name} декларира, че отразените
            в протокола разходи са реално извършени, свързани са изцяло с
            основната дейност на сдружението и приложените към тях
            разходооправдателни документи отговарят на изискванията на Закона за
            счетоводството (ЗСч) и ЗКПО. Всички командировъчни разходи са
            оформени съгласно Наредбата за командировките в страната (НКС).
          </p>

          <div className="mt-24 flex justify-between px-10">
            <div className="text-center">
              <p className="mb-8 font-bold">ПРЕДАЛ (Председател):</p>
              <p>.......................................</p>
              <p className="text-xs text-gray-500">(подпис)</p>
            </div>
            <div className="text-center">
              <p className="mb-10">ПРИЕЛ (Счетоводител):</p>
              <p>.......................................</p>
              <p className="text-xs">(подпис)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reused Trip Manager Dialog from Schedule route */}
      {selectedEvent && (
        <BusinessTripManagerDialog
          event={selectedEvent}
          open={isTripManagerOpen}
          onOpenChange={(open) => {
            setIsTripManagerOpen(open);
            if (!open) {
              loadData(); // refresh table if they edited/deleted anything
            }
          }}
        />
      )}
    </div>
  );
}
