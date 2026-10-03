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
import { saveAs } from "file-saver";
import { getDocs } from "firebase/firestore";
import JSZip from "jszip";
import {
  Bed,
  Calculator,
  Calendar,
  CalendarPlus,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  Mail,
  Pizza,
  Plus,
  Search,
  Ticket,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BusinessTripManagerDialog } from "@/components/business-trips/BusinessTripManagerDialog";
import { BusinessTripPdfTemplates } from "@/components/business-trips/BusinessTripPdfTemplates";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import {
  generatePdfFromElement,
  getPdfBlobFromElement,
} from "@/lib/html-to-pdf";
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

interface TripRowCalculations {
  total: number;
  expensesCount: number;
}

function computeTripRowTotals(
  trip: BusinessTrip,
  tripExps: TripExpense[]
): TripRowCalculations {
  const sDate = parseISO(trip.startDate);
  const eDate = parseISO(trip.endDate);
  const numDays = Math.max(1, differenceInDays(eDate, sDate) + 1);
  const numNights = Math.max(0, numDays - 1);
  const numPeople = (trip.participantsIds?.length || 0) + 1;

  const calcPerDiem = trip.financials.perDiemRateEUR * numDays * numPeople;
  const calcAccom =
    trip.financials.accommodationRateEUR * numNights * numPeople;
  const calcEntry = trip.financials.entryFeeEUR || 0;
  let calcFuel = 0;

  if (trip.vehicle?.distanceKm && trip.vehicle?.fuelNorm) {
    calcFuel = (trip.vehicle.distanceKm / 100) * trip.vehicle.fuelNorm * 1.35;
  }

  let expPerDiem = 0;
  let expAccom = 0;
  let expEntry = 0;
  let expOther = 0;

  const fuelExpenses = tripExps.filter((e) => e.expenseType === "fuel");
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
    const totalLiters = (trip.vehicle.distanceKm / 100) * trip.vehicle.fuelNorm;
    const finalFuelBGN =
      totalLiters * (Math.round(avgPricePerLiterEUR * 1.95583 * 100) / 100);
    finalFuelEUR = finalFuelBGN > 0 ? finalFuelBGN / 1.95583 : 0;
  }

  const expTransport = transportExpenses.reduce(
    (sum, e) => sum + e.amountEUR,
    0
  );

  tripExps.forEach((ex) => {
    if (ex.expenseType === "accommodation") expAccom += ex.amountEUR;
    else if (ex.expenseType === "food") expPerDiem += ex.amountEUR;
    else if (ex.expenseType === "entry_fee") expEntry += ex.amountEUR;
    else if (ex.expenseType !== "fuel" && ex.expenseType !== "transport") {
      expOther += ex.amountEUR;
    }
  });

  const total =
    (expPerDiem > 0 ? expPerDiem : calcPerDiem) +
    (expAccom > 0 ? expAccom : calcAccom) +
    (expEntry > 0 ? expEntry : calcEntry) +
    (fuelExpenses.length > 0 ? finalFuelEUR : calcFuel) +
    expTransport +
    expOther;

  return { total, expensesCount: tripExps.length };
}

function getTripStatusBadge(status?: string) {
  if (status === "approved") {
    return {
      variant: "default" as const,
      className: "border-transparent bg-blue-600 text-white",
      text: "Одобрена",
    };
  }
  if (status === "completed") {
    return {
      variant: "secondary" as const,
      className:
        "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
      text: "Отчетена",
    };
  }
  return {
    variant: "outline" as const,
    className:
      "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
    text: "Чернова",
  };
}

interface TripMobileCardProps {
  trip: BusinessTrip;
  coachName: string;
  total: number;
  expensesCount: number;
  statusBadge: {
    variant: "default" | "secondary" | "outline";
    className: string;
    text: string;
  };
  onManage: (trip: BusinessTrip) => void;
}

function TripMobileCard({
  trip,
  coachName,
  total,
  expensesCount,
  statusBadge,
  onManage,
}: TripMobileCardProps) {
  return (
    <div className="space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 transition-colors dark:border-zinc-800/80 dark:bg-zinc-800/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            📅 {formatDateShort(trip.startDate)}
          </span>
          <h4
            className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            title={trip.title}
          >
            {trip.title}
          </h4>
          {trip.destination && (
            <p
              className="truncate text-xs text-zinc-500 dark:text-zinc-400"
              title={trip.destination}
            >
              📍 {trip.destination}
            </p>
          )}
        </div>
        <Badge
          variant={statusBadge.variant}
          className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium capitalize ${statusBadge.className}`}
        >
          {statusBadge.text}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200/60 pt-1.5 text-xs dark:border-zinc-800/60">
        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <span className="max-w-35 truncate">👤 {coachName}</span>
          <span>•</span>
          {trip.financials.isCommercialActivity ? (
            <Badge
              variant="outline"
              className="border-orange-200 bg-orange-50 px-1.5 py-0.2 text-[10px] font-medium text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400"
            >
              Стопанска
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 px-1.5 py-0.2 text-[10px] font-medium text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-400"
            >
              Нестопанска
            </Badge>
          )}
        </div>

        <div className="text-right">
          <span className="font-bold text-zinc-900 dark:text-white">
            €{total.toFixed(2)}
          </span>
          <span className="ml-1 text-[10px] text-zinc-400">
            ({convertEurToBgn(total).toFixed(2)} лв.)
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-zinc-500">
          {expensesCount > 0 ? `🧾 ${expensesCount} фактури` : "Няма фактури"}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 border-zinc-200 px-3 text-xs hover:border-blue-300 hover:text-blue-600 dark:border-zinc-700 dark:hover:border-blue-700"
          onClick={() => onManage(trip)}
        >
          Управление
        </Button>
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 8;

export default function AccountingClient() {
  const site = getSiteConfig();
  const [trips, setTrips] = useState<BusinessTrip[]>([]);
  const [expenses, setExpenses] = useState<Record<string, TripExpense[]>>({});
  const [membersDict, setMembersDict] = useState<Record<string, Member>>({});
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const { user } = useAuth();

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(
    null
  );
  const [isTripManagerOpen, setIsTripManagerOpen] = useState(false);
  const [isSelectEventOpen, setIsSelectEventOpen] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState("");

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
  const [tripSearchQuery, setTripSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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

      // 4. Search query
      if (tripSearchQuery.trim()) {
        const q = tripSearchQuery.toLowerCase();
        const coach = membersDict[trip.coachId];
        const coachName = coach
          ? `${coach.firstName} ${coach.lastName}`.toLowerCase()
          : "";
        const titleMatches = trip.title.toLowerCase().includes(q);
        const destMatches = (trip.destination || "").toLowerCase().includes(q);
        const coachMatches = coachName.includes(q);
        if (!titleMatches && !destMatches && !coachMatches) return false;
      }

      return true;
    });
  }, [
    trips,
    selectedMonth,
    activityFilter,
    statusFilter,
    tripSearchQuery,
    membersDict,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, activityFilter, statusFilter, tripSearchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTrips.length / ITEMS_PER_PAGE)
  );
  const paginatedTrips = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTrips.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTrips, currentPage]);

  const existingTripEventIds = useMemo(() => {
    return new Set(trips.map((t) => t.eventId).filter(Boolean));
  }, [trips]);

  const selectableEvents = useMemo(() => {
    return events
      .filter((ev) => {
        if (!eventSearchQuery.trim()) return true;
        const q = eventSearchQuery.toLowerCase();
        return (
          ev.title.toLowerCase().includes(q) ||
          (ev.location && ev.location.toLowerCase().includes(q))
        );
      })
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
  }, [events, eventSearchQuery]);

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

  const goToCurrentMonth = () => {
    setSelectedMonth(startOfMonth(new Date()));
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const handleDownloadAll = async () => {
    if (filteredTrips.length === 0) {
      toast.error("Няма командировки за този месец.");
      return;
    }

    setIsZipping(true);
    toast.info("Генериране на пакета с документи... Моля, изчакайте.");

    try {
      const zip = new JSZip();

      // 1. Generate Monthly Protocol
      const protocolEl = document.getElementById("pdf-protocol-template");
      if (protocolEl) {
        const protocolBlob = await getPdfBlobFromElement(
          protocolEl,
          "portrait"
        );
        zip.file(
          `Месечен_протокол_${format(selectedMonth, "MM_yyyy")}.pdf`,
          protocolBlob
        );
      }

      // 2. Loop through all filtered trips to generate their PDFs
      for (let i = 0; i < filteredTrips.length; i++) {
        const trip = filteredTrips[i];
        const tId = trip.id;

        // Sanitize trip title to avoid Windows ZIP invalid folder names (remove slashes, colons, etc.)
        const safeTitle = (trip.title || "Командировка")
          .replace(/[<>:"\/\\|?*]+/g, "-")
          .trim();

        const tripFolder = zip.folder(`Командировка_${i + 1}_${safeTitle}`);
        if (!tripFolder) continue;

        // 0. Board Decision
        const decisionEl = document.getElementById(
          `pdf-board-decision-template-${tId}`
        );
        if (decisionEl) {
          const blob = await getPdfBlobFromElement(decisionEl, "portrait");
          tripFolder.file(`00_Решение_УС_${safeTitle}.pdf`, blob);
        }

        // Order
        const orderEl = document.getElementById(`pdf-order-template-${tId}`);
        if (orderEl) {
          const blob = await getPdfBlobFromElement(orderEl, "portrait");
          tripFolder.file(`01_Заповед_${safeTitle}.pdf`, blob);
        }

        // Statement
        const statementEl = document.getElementById(
          `pdf-statement-template-${tId}`
        );
        if (statementEl) {
          const blob = await getPdfBlobFromElement(statementEl, "landscape");
          tripFolder.file(`02_Ведомост_${safeTitle}.pdf`, blob);
        }

        // Attendance
        const attEl = document.getElementById(`pdf-attendance-template-${tId}`);
        if (attEl) {
          const blob = await getPdfBlobFromElement(attEl, "portrait");
          tripFolder.file(`03_Присъствен_лист_${safeTitle}.pdf`, blob);
        }

        // Fuel (if exists)
        const fuelEl = document.getElementById(
          `pdf-fuel-report-template-${tId}`
        );
        if (fuelEl) {
          const blob = await getPdfBlobFromElement(fuelEl, "landscape");
          tripFolder.file(`04_Пътен_лист_${safeTitle}.pdf`, blob);
        }

        // Attachments
        const tripExps = expenses[tId!] || [];
        for (let j = 0; j < tripExps.length; j++) {
          const exp = tripExps[j];
          if (exp.attachmentUrl) {
            try {
              const response = await fetch(exp.attachmentUrl);
              const blob = await response.blob();
              // Determine extension
              let ext = "pdf";
              if (blob.type.includes("image")) {
                ext = blob.type.split("/")[1] || "png";
              }
              const filename = `05_Фактура_${exp.expenseType}_${exp.documentNumber || j + 1}.${ext}`;
              tripFolder.file(filename, blob);
            } catch (err) {
              console.error("Failed to fetch attachment:", err);
            }
          }
        }
      }

      if (Object.keys(zip.files).length === 0) {
        toast.error("Не бяха намерени документи за архивиране.");
        setIsZipping(false);
        return;
      }

      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      saveAs(
        content,
        `Счетоводен_Пакет_${format(selectedMonth, "MM_yyyy")}.zip`
      );
      toast.success("Пакетът беше изтеглен успешно!");
    } catch (error) {
      console.error(error);
      toast.error("Грешка при генерирането на пакета.");
    } finally {
      setIsZipping(false);
    }
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
    <div className="relative space-y-3 pb-6 duration-500 animate-in fade-in">
      {/* ── Compact Page Header ── */}
      <PageHeader
        title="Счетоводни отчети"
        description="Глобален преглед на разходите и командировките по месеци."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Отчети" },
        ]}
      >
        <div className="grid w-full grid-cols-2 items-center gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:gap-2">
          <Button
            size="sm"
            onClick={() => {
              setEventSearchQuery("");
              setIsSelectEventOpen(true);
            }}
            className="col-span-2 h-8 justify-center rounded-lg bg-emerald-600 px-2.5 text-xs text-white shadow-xs hover:bg-emerald-700 sm:col-span-1"
          >
            <Plus className="mr-1.5 size-3.5" />
            Нова командировка
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8 justify-center rounded-lg border-slate-200 px-2.5 text-xs"
          >
            <FileDown className="mr-1.5 size-3.5" /> Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            disabled={isZipping || filteredTrips.length === 0}
            className="h-8 justify-center rounded-lg border-indigo-200 bg-indigo-50/60 px-2.5 text-xs text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200"
          >
            <FileDown className="mr-1.5 size-3.5" />
            {isZipping ? "Генериране..." : "ZIP Пакет"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                disabled={isGeneratingPdf}
                className="col-span-2 h-8 justify-center rounded-lg bg-zinc-950 px-2.5 text-xs text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:col-span-1"
              >
                {isGeneratingPdf ? "Зареждане..." : "Протокол"}
                <ChevronDown className="ml-1 size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={handlePreviewProtocol}
                className="cursor-pointer text-xs"
              >
                <Eye className="mr-2 size-3.5" />
                <span>Преглед на протокол</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handlePrintProtocol}
                className="cursor-pointer text-xs"
              >
                <FileDown className="mr-2 size-3.5" />
                <span>Изтегли PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleEmailProtocol}
                className="cursor-pointer text-xs"
              >
                <Mail className="mr-2 size-3.5" />
                <span>Изпрати по имейл</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>

      {/* ── Compact Streamlined Toolbar (Month + Search + Filters) ── */}
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200/80 bg-white p-2 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-1.5 md:justify-start">
          <Button
            variant="outline"
            size="icon"
            onClick={prevMonth}
            aria-label="Предишен месец"
            className="size-7.5 shrink-0 rounded-lg"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <div className="min-w-28 text-center text-xs font-semibold capitalize text-zinc-900 dark:text-zinc-100">
            {format(selectedMonth, "MMMM yyyy", { locale: bg })}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            aria-label="Следващ месец"
            className="size-7.5 shrink-0 rounded-lg"
          >
            <ChevronRight className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToCurrentMonth}
            className="h-7.5 shrink-0 px-2 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Текущ
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="relative min-w-36 flex-1 sm:w-48 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Търси събитие, треньор..."
              value={tripSearchQuery}
              onChange={(e) => setTripSearchQuery(e.target.value)}
              className="h-7.5 w-full pl-7 text-xs"
            />
          </div>

          <Select
            value={activityFilter}
            onValueChange={(val: any) => setActivityFilter(val)}
          >
            <SelectTrigger className="h-7.5 min-w-28 flex-1 text-xs sm:w-30 sm:flex-none">
              <SelectValue placeholder="Дейност" />
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
            <SelectTrigger className="h-7.5 min-w-26 flex-1 text-xs sm:w-28 sm:flex-none">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички статуси</SelectItem>
              <SelectItem value="draft">Чернови</SelectItem>
              <SelectItem value="approved">Одобрени</SelectItem>
              <SelectItem value="completed">Отчетени</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── 5-Metric Ribbon (Compact Single Row on Laptop, 2-Col on Mobile) ── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {/* Общо Разходи */}
        <div className="col-span-2 flex flex-col justify-between rounded-xl border border-blue-200/70 bg-linear-to-br from-blue-50/70 to-indigo-50/40 p-2.5 shadow-2xs dark:border-blue-900/40 dark:from-blue-950/20 dark:to-indigo-950/20 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
              Общо Разходи
            </span>
            <div className="rounded-md bg-blue-100 p-1 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              <Calculator className="size-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <p className="text-base font-bold tracking-tight text-blue-950 dark:text-blue-100">
              €{kpis.totalEur.toFixed(2)}
            </p>
            <p className="text-[10px] font-medium text-blue-600/90 dark:text-blue-400">
              {kpis.totalBgn.toFixed(2)} лв.
            </p>
          </div>
        </div>

        {/* Транспорт & Гориво */}
        <div className="flex flex-col justify-between rounded-xl border border-orange-200/70 bg-white p-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500">
              Транспорт &amp; Гориво
            </span>
            <div className="rounded-md bg-orange-100 p-1 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
              <Car className="size-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
              €{kpis.totalFuelAndTransport.toFixed(2)}
            </p>
            <p className="text-[10px] text-orange-600 dark:text-orange-400">
              {kpis.totalKM} км •{" "}
              {convertEurToBgn(kpis.totalFuelAndTransport).toFixed(2)} лв.
            </p>
          </div>
        </div>

        {/* Нощувки / Квартирни */}
        <div className="flex flex-col justify-between rounded-xl border border-purple-200/70 bg-white p-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500">
              Нощувки
            </span>
            <div className="rounded-md bg-purple-100 p-1 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
              <Bed className="size-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
              €{kpis.totalAccommodation.toFixed(2)}
            </p>
            <p className="text-[10px] text-purple-600 dark:text-purple-400">
              {convertEurToBgn(kpis.totalAccommodation).toFixed(2)} лв.
            </p>
          </div>
        </div>

        {/* Дневни & Храна */}
        <div className="flex flex-col justify-between rounded-xl border border-emerald-200/70 bg-white p-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500">
              Дневни &amp; Храна
            </span>
            <div className="rounded-md bg-emerald-100 p-1 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <Pizza className="size-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
              €{kpis.totalPerDiem.toFixed(2)}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
              {convertEurToBgn(kpis.totalPerDiem).toFixed(2)} лв.
            </p>
          </div>
        </div>

        {/* Такси турнир */}
        <div className="flex flex-col justify-between rounded-xl border border-pink-200/70 bg-white p-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500">
              Такси турнир
            </span>
            <div className="rounded-md bg-pink-100 p-1 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300">
              <Ticket className="size-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
              €{kpis.totalEntryFees.toFixed(2)}
            </p>
            <p className="text-[10px] text-pink-600 dark:text-pink-400">
              {convertEurToBgn(kpis.totalEntryFees).toFixed(2)} лв.
            </p>
          </div>
        </div>
      </div>

      {/* ── Compact Table ── */}
      <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between border-b border-zinc-100 px-3.5 py-2 dark:border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">
            Детайлен опис на командировките
          </h3>
          <Badge variant="outline" className="text-[10px] font-normal">
            {filteredTrips.length}{" "}
            {filteredTrips.length === 1 ? "командировка" : "командировки"}
          </Badge>
        </div>

        {/* 1. Mobile Cards View (<md) */}
        <div className="space-y-2.5 p-2 md:hidden">
          {filteredTrips.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Няма намерени записи за този период.
            </div>
          ) : (
            paginatedTrips.map((trip) => {
              const coach = membersDict[trip.coachId];
              const coachName = coach
                ? `${coach.firstName} ${coach.lastName}`
                : "Неизвестен";

              const tripExps = expenses[trip.id!] || [];
              const { total, expensesCount } = computeTripRowTotals(
                trip,
                tripExps
              );
              const statusBadge = getTripStatusBadge(trip.status);

              return (
                <TripMobileCard
                  key={trip.id}
                  trip={trip}
                  coachName={coachName}
                  total={total}
                  expensesCount={expensesCount}
                  statusBadge={statusBadge}
                  onManage={handleManageTrip}
                />
              );
            })
          )}
        </div>

        {/* 2. Desktop Table View (>=md) */}
        <div className="hidden max-h-[calc(100vh-360px)] min-h-50 overflow-auto md:block">
          <Table className="w-full text-xs">
            <TableHeader className="sticky top-0 z-10 bg-zinc-50/95 backdrop-blur-xs dark:bg-zinc-900/95">
              <TableRow className="border-b text-[11px]">
                <TableHead className="w-20 px-2.5 py-2">Дата</TableHead>
                <TableHead className="min-w-40 max-w-60 px-2.5 py-2">
                  Командировка
                </TableHead>
                <TableHead className="min-w-25 max-w-35 px-2.5 py-2">
                  Треньор
                </TableHead>
                <TableHead className="w-24 p-2">Дейност</TableHead>
                <TableHead className="w-24 p-2">Статус</TableHead>
                <TableHead className="w-24 px-2.5 py-2 text-right">
                  Сума (EUR)
                </TableHead>
                <TableHead className="w-20 p-2 text-right">Документи</TableHead>
                <TableHead className="w-24 px-2.5 py-2 text-right">
                  Действия
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-xs text-zinc-500"
                  >
                    Няма намерени записи за този период.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTrips.map((trip) => {
                  const coach = membersDict[trip.coachId];
                  const coachName = coach
                    ? `${coach.firstName} ${coach.lastName}`
                    : "Неизвестен";

                  const tripExps = expenses[trip.id!] || [];
                  const { total, expensesCount } = computeTripRowTotals(
                    trip,
                    tripExps
                  );
                  const statusBadge = getTripStatusBadge(trip.status);

                  return (
                    <TableRow
                      key={trip.id}
                      className="border-b transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                    >
                      <TableCell className="whitespace-nowrap px-2.5 py-1.5 font-medium text-zinc-600 dark:text-zinc-400">
                        {formatDateShort(trip.startDate)}
                      </TableCell>
                      <TableCell className="min-w-40 max-w-60 px-2.5 py-1.5">
                        <span
                          className="block truncate font-medium text-zinc-900 dark:text-zinc-100"
                          title={trip.title}
                        >
                          {trip.title}
                        </span>
                        {trip.destination && (
                          <span
                            className="block truncate text-[10px] text-zinc-400"
                            title={trip.destination}
                          >
                            📍 {trip.destination}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="min-w-25 max-w-35 px-2.5 py-1.5">
                        <span className="block truncate" title={coachName}>
                          {coachName}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1.5">
                        {trip.financials.isCommercialActivity ? (
                          <Badge
                            variant="outline"
                            className="border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400"
                          >
                            Стопанска
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-green-200 bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-400"
                          >
                            Нестопанска
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1.5">
                        <Badge
                          variant={statusBadge.variant}
                          className={`px-1.5 py-0.5 text-[10px] font-medium capitalize ${statusBadge.className}`}
                        >
                          {statusBadge.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2.5 py-1.5 text-right">
                        <span className="font-bold text-zinc-900 dark:text-white">
                          €{total.toFixed(2)}
                        </span>
                        <span className="block text-[10px] text-zinc-400">
                          {convertEurToBgn(total).toFixed(2)} лв.
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2.5 py-1.5 text-right">
                        {expensesCount > 0 ? (
                          <span className="text-[11px] text-zinc-500">
                            {expensesCount} фактури
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2.5 py-1.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 border-zinc-200 px-2 text-xs hover:border-blue-300 hover:text-blue-600 dark:border-zinc-700 dark:hover:border-blue-700"
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

        {/* ── Compact Adaptive Pagination Bar ── */}
        {filteredTrips.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-2 border-t border-zinc-100 px-3.5 py-2 text-xs text-muted-foreground sm:flex-row dark:border-zinc-800">
            <span>
              Показване на {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredTrips.length)} от{" "}
              {filteredTrips.length}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="h-6.5 px-2 text-[11px]"
                >
                  Предишна
                </Button>
                <span className="text-[11px]">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="h-6.5 px-2 text-[11px]"
                >
                  Следваща
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

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
                src="/icons/LOGO.jpg"
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
              {/* eslint-disable-next-line sonarjs/cognitive-complexity */}
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
                      {3 + (trip.vehicle?.distanceKm ? 1 : 0) + tripExps.length}
                      <div
                        style={{
                          fontSize: "7pt",
                          color: "#64748b",
                          marginTop: "2pt",
                          lineHeight: "1.2",
                        }}
                      >
                        (Заповед, Ведомост, Присъств. лист
                        {trip.vehicle?.distanceKm ? ", Отчет гориво" : ""}
                        {tripExps.length > 0
                          ? `, +${tripExps.length} разх. док.`
                          : ""}
                        )
                      </div>
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

      {/* Dialog for selecting an event to create/manage business trip */}
      <Dialog open={isSelectEventOpen} onOpenChange={setIsSelectEventOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <CalendarPlus className="size-5 text-emerald-600" />
              Създаване / Управление на командировка
            </DialogTitle>
            <DialogDescription>
              Изберете събитие (турнир или лагер) от календара, за което да
              създадете или управлявате командировка, разходи и ведомости.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Търсене по име на събитие или град..."
              value={eventSearchQuery}
              onChange={(e) => setEventSearchQuery(e.target.value)}
              className="rounded-xl pl-9"
            />
          </div>

          <div className="mt-4 max-h-[50vh] flex-1 space-y-2 overflow-y-auto pr-1">
            {selectableEvents.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Няма намерени събития.
              </div>
            ) : (
              selectableEvents.map((ev) => {
                const hasTrip = existingTripEventIds.has(ev.id);
                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setSelectedEvent(ev);
                      setIsSelectEventOpen(false);
                      setIsTripManagerOpen(true);
                    }}
                    className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-3.5 transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 transition-colors group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-emerald-400">
                          {ev.title}
                        </span>
                        {hasTrip ? (
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          >
                            Има командировка
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-300 text-xs text-emerald-700 dark:text-emerald-400"
                          >
                            + Нова
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {format(parseISO(ev.startDate), "dd.MM.yyyy", {
                            locale: bg,
                          })}
                          {ev.endDate && ev.endDate !== ev.startDate && (
                            <>
                              {" "}
                              -{" "}
                              {format(parseISO(ev.endDate), "dd.MM.yyyy", {
                                locale: bg,
                              })}
                            </>
                          )}
                        </span>
                        {ev.location && <span>📍 {ev.location}</span>}
                        <span>
                          👥 {ev.attendeeMemberIds?.length || 0} участници
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-lg text-xs group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:group-hover:bg-emerald-950/50"
                    >
                      {hasTrip ? "Преглед" : "Създай"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Hidden Templates for ZIP Generation */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        {filteredTrips.map((trip) => {
          const tripEvent = events.find((e) => e.id === trip.eventId);
          return (
            <BusinessTripPdfTemplates
              key={trip.id}
              trip={trip}
              event={tripEvent}
              membersDict={membersDict}
              expenses={expenses[trip.id!] || []}
              idSuffix={`-${trip.id}`}
            />
          );
        })}
      </div>
    </div>
  );
}
