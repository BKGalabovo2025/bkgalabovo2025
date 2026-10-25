"use client";
/* eslint-disable react/forbid-dom-props */

/* eslint-disable @next/next/no-img-element */

import { differenceInCalendarDays, format } from "date-fns";
import { bg } from "date-fns/locale";
import React from "react";

import { getSiteConfig } from "@/config/sites";
import {
  calculateTripTransportTotals,
  getEffectiveTripRates,
} from "@/lib/business-trip-calc";
import {
  getTripAttendanceNumber,
  getTripDecisionNumber,
  getTripFuelNumber,
  getTripOrderNumber,
  getTripProtocolNumber,
  getTripReportNumber,
  getTripStatementNumber,
  resolveTripNumbers,
} from "@/lib/business-trip-numbers";
import {
  cleanProtocolText,
  extractBoardMembers,
  formatOrgName,
  isFemalePerson,
} from "@/lib/business-trip-protocol";
import {
  generateDefaultReportText,
  updateReportTextStaySection,
} from "@/lib/business-trip-report";
import { BusinessTrip, TripExpense } from "@/types/business-trip.types";
import { ScheduleEvent } from "@/types/index";
import { Member } from "@/types/member.types";

interface BusinessTripPdfTemplatesProps {
  trip: BusinessTrip;
  event?: ScheduleEvent;
  membersDict: Record<string, Member>;
  expenses: TripExpense[];
  showBgn?: boolean;
  idSuffix?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EUR_BGN = 1.95583;

// ─── Currency helpers ─────────────────────────────────────────────────────────
const fmtEUR = (eur: number) => `€${eur.toFixed(2)} EUR`;
const eurToBgn = (eur: number) => eur * EUR_BGN;
const roundEUR = (eur: number) => Math.round(eur);

// ─── Bulgarian number to words (for Словом) ───────────────────────────────────
const _ones = [
  "",
  "един",
  "два",
  "три",
  "четири",
  "пет",
  "шест",
  "седем",
  "осем",
  "девет",
  "десет",
  "единадесет",
  "дванадесет",
  "тринадесет",
  "четиринадесет",
  "петнадесет",
  "шестнадесет",
  "седемнадесет",
  "осемнадесет",
  "деветнадесет",
];
const _tens = [
  "",
  "",
  "двадесет",
  "тридесет",
  "четиридесет",
  "петдесет",
  "шестдесет",
  "седемдесет",
  "осемдесет",
  "деветдесет",
];
const _hund = [
  "",
  "сто",
  "двеста",
  "триста",
  "четиристотин",
  "петстотин",
  "шестотин",
  "седемстотин",
  "осемстотин",
  "деветстотин",
];

function convertNumberToWords(n: number): string {
  if (n === 0) return "";
  if (n < 20) return _ones[n];
  if (n < 100) {
    const o = n % 10;
    const tensStr = _tens[Math.floor(n / 10)];
    return o !== 0 ? `${tensStr} и ${_ones[o]}` : tensStr;
  }
  if (n < 1000) {
    const r = n % 100;
    const hundStr = _hund[Math.floor(n / 100)];
    if (r !== 0) {
      return r <= 20 || r % 10 === 0
        ? `${hundStr} и ${convertNumberToWords(r)}`
        : `${hundStr} ${convertNumberToWords(r)}`;
    }
    return hundStr;
  }
  const th = Math.floor(n / 1000);
  const r = n % 1000;
  let ts = "";
  if (th === 1) ts = "хиляда";
  else if (th === 2) ts = "две хиляди";
  if (!ts) ts = `${convertNumberToWords(th)} хиляди`;
  if (r !== 0) {
    return r <= 20 || (r < 100 && r % 10 === 0) || r % 100 === 0
      ? `${ts} и ${convertNumberToWords(r)}`
      : `${ts} ${convertNumberToWords(r)}`;
  }
  return ts;
}

function numToWordsBG(amount: number, isEur: boolean = false): string {
  if (amount <= 0) return isEur ? "нула евро" : "нула лева";
  const i = Math.floor(amount);
  const c = Math.round((amount - i) * 100);

  let w = convertNumberToWords(i) || "нула";

  if (isEur && i % 1000 < 10) {
    if (i % 10 === 1 && i % 100 !== 11) w = w.replace(/един$/, "едно");
    else if (i % 10 === 2 && i % 100 !== 12) w = w.replace(/два$/, "две");
  }

  const getBGNWord = (num: number) => (num === 1 ? "лев" : "лева");
  const getBGNCoins = (num: number) => (num === 1 ? "стотинка" : "стотинки");
  const getEURCoins = (num: number) => (num === 1 ? "цент" : "цента");

  const bw = isEur ? "евро" : getBGNWord(i);
  const cw = isEur ? getEURCoins(c) : getBGNCoins(c);

  return `${w} ${bw} и ${c} ${cw}`;
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const PAGE_A4: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: "10pt",
  lineHeight: 1.5,
  color: "#1e293b",
  backgroundColor: "#fff",
  padding: "12mm 15mm 12mm 15mm",
  boxSizing: "border-box",
};
const PAGE_A4_REPORT: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: "8.5pt",
  lineHeight: 1.42,
  color: "#1e293b",
  backgroundColor: "#fff",
  padding: "10mm 15mm 10mm 15mm",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
};
const PAGE_LAND: React.CSSProperties = {
  width: "297mm",
  minHeight: "210mm",
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: "9pt",
  lineHeight: 1.4,
  color: "#1e293b",
  backgroundColor: "#fff",
  padding: "10mm",
  boxSizing: "border-box",
};
const PAGE_LAND_PAGE: React.CSSProperties = {
  width: "297mm",
  height: "210mm",
  minHeight: "210mm",
  maxHeight: "210mm",
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: "8.5pt",
  lineHeight: 1.35,
  color: "#1e293b",
  backgroundColor: "#fff",
  padding: "8mm 10mm",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  overflow: "hidden",
  position: "relative",
};
const TH: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  padding: "4pt 4pt",
  textAlign: "center",
  fontWeight: "600",
  verticalAlign: "middle",
  fontSize: "8pt",
  backgroundColor: "#f8fafc",
  color: "#0f172a",
};
const TD: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  padding: "4pt 4pt",
  verticalAlign: "middle",
  fontSize: "8pt",
};

export function BusinessTripPdfTemplates({
  trip: tripProp,
  event,
  membersDict,
  expenses = [],
  idSuffix = "",
}: BusinessTripPdfTemplatesProps) {
  if (!tripProp) return null;
  const trip = resolveTripNumbers(tripProp);

  const site = getSiteConfig();

  const coach = membersDict[trip.coachId];
  const coachName =
    trip.coachName ||
    (coach ? `${coach.firstName} ${coach.lastName}` : "___________________");
  const coachRole =
    trip.coachRole || (coach?.isCoach ? "Треньор" : "Ръководител");

  const participantOverrides = trip.participantOverrides ?? {};

  const effectiveTripParticipantIds =
    trip.participantsIds && trip.participantsIds.length > 0
      ? trip.participantsIds
      : (event?.attendees
          ?.map((a) => a.memberId)
          .filter((id) => {
            const m = membersDict[id];
            return m && !m.isCoach;
          }) ?? []);

  const partMembers = effectiveTripParticipantIds
    .map((id) => membersDict[id])
    .filter(Boolean) as Member[];

  // Build allPeople with per-person overrides; filter out excluded participants
  const allPeopleRaw = [
    {
      name: coachName,
      role: coachRole,
      member: coach,
      ovKey: "coach" as string,
    },
    ...partMembers.map((m) => ({
      name: `${m.firstName} ${m.lastName}`,
      role: m.isCoach ? "Треньор" : "Състезател",
      member: m,
      ovKey: m.id as string,
    })),
  ];

  // Първоначално планиран състав (за Решение на УС и Нареждане за командировка, издадени ПРЕДИ пътуването)
  const plannedPeople = allPeopleRaw;
  const totalPlannedPeople = plannedPeople.length;

  // Действителен състав за финансовата ведомост (изключва лица с excluded: true)
  const allPeople = allPeopleRaw.filter(
    (p) => !(participantOverrides[p.ovKey]?.excluded ?? false)
  );
  const totalPeople = allPeople.length;

  const fmtDate = (d?: string) => {
    if (!d) return "—";
    const clean = d.replace(/\s*г\.?$/u, "").trim();
    const ddmmyyyy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(clean);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year}`;
    }
    try {
      return format(new Date(clean), "dd.MM.yyyy", { locale: bg });
    } catch {
      return clean;
    }
  };
  const startD = new Date(trip.startDate);
  const endD = new Date(trip.endDate);
  // Първоначално планирани дни и нощи по дати на командировката (за Решение на УС и Нареждане)
  const plannedDays = Math.max(1, differenceInCalendarDays(endD, startD) + 1);
  const plannedNights = Math.max(0, differenceInCalendarDays(endD, startD));
  // Действително реализирани дни/нощи на отбора (използват се САМО във Ведомостта)
  const numDays =
    trip.actualDays != null && trip.actualDays >= 0
      ? trip.actualDays
      : plannedDays;
  const numNights =
    trip.actualNights != null && trip.actualNights >= 0
      ? trip.actualNights
      : plannedNights;

  const perDiemEUR = roundEUR(
    trip.financials.perDiemOverrideEUR || trip.financials.perDiemRateEUR
  );
  const perDiemBGN = eurToBgn(perDiemEUR);
  const hasPerDiem = perDiemEUR > 0;
  const accomEUR = trip.financials.accommodationRateEUR ?? 0;
  const accomBGN = eurToBgn(accomEUR);
  const hasFuel = trip.transportType === "fuel_only";
  const fuelNorm = trip.vehicle?.fuelNorm ?? 0;
  const transportCalc = calculateTripTransportTotals(trip);
  const distKm =
    transportCalc.effectiveDistanceKm > 0
      ? transportCalc.effectiveDistanceKm
      : (trip.vehicle?.distanceKm ?? 0);
  const isDailyCommute = transportCalc.isDailyCommute;
  const singleKm = transportCalc.singleRoundTripKm;
  const actualTrips = transportCalc.actualTripsCount;

  const eventLabel =
    (
      {
        competition: "състезание",
        camp: "лагер-сбор",
        training: "тренировка",
        event: "мероприятие",
      } as Record<string, string>
    )[event?.type || ""] || "";
  const cleanTitle = trip.title.replace(/^[Кк]омандировка:\s*/u, "");
  const isSameDay = differenceInCalendarDays(endD, startD) === 0;
  const yearStr = format(startD, "yyyy");
  const dateRangeStr = isSameDay
    ? `на ${format(startD, "dd.MM.yyyy")} г.`
    : `от ${format(startD, "dd.MM.yyyy")} г. до ${format(endD, "dd.MM.yyyy")} г.`;
  const titleWithLabel = eventLabel
    ? `${eventLabel} - ${cleanTitle}, ${dateRangeStr} в ${trip.destination}`
    : `${cleanTitle}, ${dateRangeStr} в ${trip.destination}`;

  const totalLiters =
    distKm > 0 && fuelNorm > 0 ? (distKm / 100) * fuelNorm : 0;
  const fuelExpenses = expenses.filter((e) => e.expenseType === "fuel");
  const avgPricePerLiterEUR =
    fuelExpenses.length > 0
      ? fuelExpenses.reduce((sum, e) => sum + e.amountEUR, 0) /
        fuelExpenses.length
      : 0;
  const roundedPricePerLiterBGN =
    Math.round(eurToBgn(avgPricePerLiterEUR) * 100) / 100;
  const avgPricePerLiterBGN = eurToBgn(avgPricePerLiterEUR);
  const finalFuelBGN = totalLiters * roundedPricePerLiterBGN;
  const finalFuelEUR = finalFuelBGN > 0 ? finalFuelBGN / 1.95583 : 0;

  const entryEUR = trip.financials.entryFeeEUR ?? 0;
  const hasEntryFee = Boolean(trip.financials.hasEntryFee ?? entryEUR > 0);

  const accomExpenses = expenses.filter(
    (e) => e.expenseType === "accommodation"
  );
  const actualAccomTotalEUR = accomExpenses.reduce(
    (sum, e) => sum + e.amountEUR,
    0
  );

  const coverage = trip.expensesCoverage;
  const coverageHasAccom =
    coverage === "food_and_sleep" || coverage === "transport_food_sleep";
  const coverageExcludesAccom =
    coverage === "food_only" ||
    coverage === "transport_only" ||
    coverage === "transport_and_food";

  // Планирани нощувки (за Решение на УС и Нареждане)
  const hasPlannedAccom =
    (coverageHasAccom && plannedNights > 0) ||
    (!coverageExcludesAccom &&
      ((accomEUR > 0 && plannedNights > 0) ||
        (plannedNights > 0 && (trip.financials.perDiemRateEUR ?? 0) >= 20)));

  // Действителни нощувки (за финансовата ведомост)
  const hasAccom =
    (coverageHasAccom && numNights > 0) ||
    (!coverageExcludesAccom &&
      ((accomEUR > 0 && numNights > 0) ||
        actualAccomTotalEUR > 0 ||
        (numNights > 0 && (trip.financials.perDiemRateEUR ?? 0) >= 20)));

  const transportExpenses = expenses.filter(
    (e) => e.expenseType === "transport"
  );
  const baseTransportEUR = transportExpenses.reduce(
    (sum, e) => sum + e.amountEUR,
    0
  );
  const transportTotalEUR = baseTransportEUR + finalFuelEUR;
  const transportTotalBGN = eurToBgn(baseTransportEUR) + finalFuelBGN;

  // Person-nights and person-days across non-excluded participants
  const totalPersonNights = allPeople.reduce((sum, p) => {
    const pOv = participantOverrides[p.ovKey];
    let pNights: number;
    if (pOv?.actualNights != null && pOv.actualNights >= 0) {
      pNights = pOv.actualNights;
    } else if (pOv?.stayedOvernight === false) {
      pNights = 0;
    } else {
      pNights = numNights;
    }
    return sum + pNights;
  }, 0);

  // Rate per night
  let accomRatePerNightEUR: number;
  if (actualAccomTotalEUR > 0) {
    accomRatePerNightEUR =
      totalPersonNights > 0 ? actualAccomTotalEUR / totalPersonNights : 0;
  } else {
    accomRatePerNightEUR = accomEUR;
  }
  const accomRatePerNightBGN =
    Math.round(eurToBgn(accomRatePerNightEUR) * 100) / 100;

  // Individual person calculation function
  const getPersonCalc = (p: (typeof allPeople)[0], globalIndex: number) => {
    const isFirstPerson = globalIndex === 0;
    const pOv = participantOverrides[p.ovKey];
    const pDays =
      pOv?.actualDays != null && pOv.actualDays >= 0 ? pOv.actualDays : numDays;
    let pNights: number;
    if (pOv?.actualNights != null && pOv.actualNights >= 0) {
      pNights = pOv.actualNights;
    } else if (pOv?.stayedOvernight === false) {
      pNights = 0;
    } else {
      pNights = numNights;
    }

    // Когато командированият не нощува, дневните пари са ставката за без нощувка (11 € или 50% от пълната)
    const { fullRate, noStayRate } = getEffectiveTripRates(perDiemEUR);
    const isNoStay = pNights === 0 || pOv?.stayedOvernight === false;
    let pPerDiemRateEUR: number;
    if (pOv?.perDiemRateEUR != null && pOv.perDiemRateEUR > 6) {
      pPerDiemRateEUR = pOv.perDiemRateEUR;
    } else if (isNoStay) {
      pPerDiemRateEUR = noStayRate;
    } else {
      pPerDiemRateEUR = fullRate;
    }
    const pPerDiemRateBGN = eurToBgn(pPerDiemRateEUR);

    const pDiemEURpp = hasPerDiem ? roundEUR(pPerDiemRateEUR * pDays) : 0;
    const pDiemBGNpp = Math.round(eurToBgn(pDiemEURpp) * 100) / 100;

    const pAcomEURpp = hasAccom ? roundEUR(accomRatePerNightEUR * pNights) : 0;
    const pAcomBGNpp = Math.round(eurToBgn(pAcomEURpp) * 100) / 100;

    const personTransportEUR = isFirstPerson ? transportTotalEUR : 0;
    const personTransportBGN = isFirstPerson ? transportTotalBGN : 0;

    const personTotalEUR = pDiemEURpp + pAcomEURpp + personTransportEUR;
    const personTotalBGN = pDiemBGNpp + pAcomBGNpp + personTransportBGN;

    return {
      pDays,
      pNights,
      isNoStay,
      pPerDiemRateEUR,
      pPerDiemRateBGN,
      pDiemEURpp,
      pDiemBGNpp,
      pAcomEURpp,
      pAcomBGNpp,
      personTransportEUR,
      personTransportBGN,
      personTotalEUR,
      personTotalBGN,
    };
  };

  const allPersonCalcs = allPeople.map((p, idx) => getPersonCalc(p, idx));

  const grandEUR = allPersonCalcs.reduce((sum, c) => sum + c.personTotalEUR, 0);
  const grandBGN = allPersonCalcs.reduce((sum, c) => sum + c.personTotalBGN, 0);

  const orderNum = getTripOrderNumber(trip);
  const decisionNum = getTripDecisionNumber(trip);
  const protocolNum = getTripProtocolNumber(trip);
  const statementNum = getTripStatementNumber(trip);
  const fuelNum = getTripFuelNumber(trip);
  const attendanceNum = getTripAttendanceNumber(trip);
  const reportNum = getTripReportNumber(trip);

  const orderDate = fmtDate(trip.orderDate || trip.createdAt || trip.startDate);
  const decisionDate = trip.usDecisionDate
    ? fmtDate(trip.usDecisionDate)
    : orderDate;

  const getDecisionHeader = (): string => {
    const raw = decisionNum;
    const cleanNum = raw.startsWith("№") ? raw : `№ ${raw}`;
    if (cleanNum.includes("/") || cleanNum.toLowerCase().includes("от")) {
      return cleanNum;
    }
    const cleanDate = decisionDate.replace(/\s*г\.?$/u, "").trim();
    return `${cleanNum} / ${cleanDate} г.`;
  };

  const getProtocolHeader = (): string => {
    const raw = protocolNum;
    const cleanNum = raw.startsWith("№") ? raw : `№ ${raw}`;
    if (cleanNum.includes("/") || cleanNum.toLowerCase().includes("от")) {
      return cleanNum;
    }
    const cleanDate = decisionDate.replace(/\s*г\.?$/u, "").trim();
    return `${cleanNum} / ${cleanDate} г.`;
  };

  const destCity = trip.destination || "___________";
  const routeLabel = `Гълъбово — ${destCity} — Гълъбово`;

  const transportShort: Record<string, string> = {
    club_paid: "Клубен транспорт",
    free: "Безплатен (организиран)",
    fuel_only: trip.vehicle?.brand
      ? `Лично МПС ${trip.vehicle.brand}`
      : "Лично МПС",
    public: "Обществен транспорт (влак, автобус, самолет)",
  };
  const tShort = transportShort[trip.transportType] ?? trip.transportType;

  const plannedSecs = [
    hasPerDiem && "diem",
    "transport",
    hasPlannedAccom && "accom",
    hasEntryFee && "entry",
  ].filter(Boolean);
  const snPlanned = (s: string) => plannedSecs.indexOf(s) + 1;

  const mol = site.contact.mol || "М. Георгиева";
  const chair = trip.usMeetingChair?.trim() || mol;
  const secretary = trip.usMeetingSecretary?.trim() || "Член на УС";
  const meetingLocation =
    trip.usMeetingLocation?.trim() ||
    "гр. Гълъбово, в седалището на сдружението";
  const meetingTime = trip.usMeetingTime?.trim() || "18:00 ч.";

  const renderDecisionTransportText = () => {
    if (hasFuel) {
      return (
        <span style={{ marginLeft: "15pt", display: "inline-block" }}>
          Съгласно Наредбата за командировките в страната разрешава пътуването
          да се извърши с: <strong>лично МПС</strong>, вид лек автомобил, марка{" "}
          <strong>{trip.vehicle?.brand || "неопределена"}</strong>, рег. №{" "}
          <strong>{trip.vehicle?.regNumber || "неопределен"}</strong>
          {trip.vehicle?.fuelType
            ? `, вид гориво: ${trip.vehicle.fuelType}`
            : ""}
          , при разходна норма{" "}
          <strong>{fuelNorm > 0 ? fuelNorm : "0"} л/100 км</strong>. Разходът за
          изразходвано гориво се отчита по официални разходни норми за маршрута{" "}
          <em>{routeLabel}</em> ({distKm > 0 ? `${distKm} км` : "по отчет"}) и
          се възстановява на водача срещу представен пътен лист (Отчет за
          гориво) и разходооправдателен документ (фактура / фискален бон на
          името на клуба).
        </span>
      );
    }
    if (trip.transportType === "free") {
      return (
        <span style={{ marginLeft: "15pt", display: "inline-block" }}>
          Транспортът е организиран и осигурен безплатно. Не се начисляват пътни
          пари на командированите лица.
        </span>
      );
    }
    if (trip.transportType === "public") {
      return (
        <span style={{ marginLeft: "15pt", display: "inline-block" }}>
          Пътуването да се осъществи с:{" "}
          <strong>обществен транспорт (влак, автобус, самолет)</strong> срещу
          представени оригинални билети за отиване и връщане.
        </span>
      );
    }
    return (
      <span style={{ marginLeft: "15pt", display: "inline-block" }}>
        Пътуването да се осъществи с: <strong>{tShort}</strong> срещу
        представени билети или първични транспортни документи.
      </span>
    );
  };

  const renderOrderTransportText = () => {
    if (hasFuel) {
      return (
        <p style={{ marginBottom: "4pt" }}>
          {snPlanned("transport")}. Транспорт:{" "}
          <strong>Разрешавам пътуването да се извърши с лично МПС</strong>, вид
          лек автомобил, марка{" "}
          <strong>{trip.vehicle?.brand || "неопределена"}</strong>, рег. №{" "}
          <strong>{trip.vehicle?.regNumber || "неопределен"}</strong>
          {trip.vehicle?.fuelType
            ? `, вид гориво: ${trip.vehicle.fuelType}`
            : ""}
          , с разходна норма{" "}
          <strong>{fuelNorm > 0 ? fuelNorm : "0"} л/100 км</strong>. Разходът за
          гориво се отчита по официални разходни норми срещу представен пътен
          лист и разходооправдателен документ (фактура / касов бон за заредено
          гориво на името на клуба).
        </p>
      );
    }
    if (trip.transportType === "free") {
      return (
        <p style={{ marginBottom: "4pt" }}>
          {snPlanned("transport")}. Транспорт: Транспортът е организиран и
          осигурен безплатно. Не се начисляват пътни пари на командированите
          лица.
        </p>
      );
    }
    if (trip.transportType === "public") {
      return (
        <p style={{ marginBottom: "4pt" }}>
          {snPlanned("transport")}. Транспорт: Пътуването да се извърши с:{" "}
          <strong>обществен транспорт (влак, автобус, самолет)</strong> — срещу
          представени оригинални билети за отиване и връщане.
        </p>
      );
    }
    return (
      <p style={{ marginBottom: "4pt" }}>
        {snPlanned("transport")}. Транспорт: Пътуването да се извърши с:{" "}
        <strong>{tShort}</strong> (срещу фактура или билет).
      </p>
    );
  };

  return (
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      {/* ══════════════════════════════════════════════════════
          DOC 0.0: ПРОТОКОЛ НА УПРАВИТЕЛНИЯ СЪВЕТ (BOARD PROTOCOL / MINUTES)
      ══════════════════════════════════════════════════════ */}
      <div id={`pdf-board-protocol-template${idSuffix}`} style={PAGE_A4}>
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
                }}
              >
                {formatOrgName(site.shortName, true)}
              </p>
              {site.bulstat && (
                <p
                  style={{
                    fontSize: "9pt",
                    margin: "2pt 0 0 0",
                    color: "#64748b",
                  }}
                >
                  БУЛСТАТ: {site.bulstat} | {site.contact.address}
                </p>
              )}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "12pt" }}>
          <p
            style={{
              fontWeight: "800",
              fontSize: "13pt",
              letterSpacing: "3px",
              margin: 0,
              color: "#0f172a",
            }}
          >
            П Р О Т О К О Л
          </p>
          <p
            style={{
              fontSize: "11pt",
              fontWeight: "700",
              marginTop: "4pt",
              color: "#0f172a",
            }}
          >
            ОТ ЗАСЕДАНИЕ НА УПРАВИТЕЛНИЯ СЪВЕТ НА{" "}
            {formatOrgName(site.name, true)}
          </p>
          <p style={{ fontSize: "11pt", marginTop: "4pt", color: "#475569" }}>
            <span>{getProtocolHeader()}</span>
          </p>
        </div>

        {trip.protocolText && trip.protocolText.trim() !== "" ? (
          <div
            style={{
              lineHeight: "1.4",
              textAlign: "justify",
              fontSize: "8.2pt",
              color: "#1e293b",
              whiteSpace: "pre-line",
            }}
          >
            {cleanProtocolText(
              trip.protocolText,
              isFemalePerson(chair, membersDict),
              site.shortName
            )
              .split(/\n\s*\n/)
              .map((para, i) => (
                <p
                  key={i}
                  style={{
                    margin: "3pt 0",
                    textIndent:
                      para.startsWith("•") ||
                      para.startsWith("1.") ||
                      para.startsWith("2.") ||
                      para.startsWith("3.") ||
                      para.startsWith("4.") ||
                      para.startsWith("5.") ||
                      para.startsWith("ПРИСЪСТВАТ") ||
                      para.startsWith("ДНЕВЕН РЕД") ||
                      para.startsWith("ПО ТОЧКА") ||
                      para.startsWith("ВЪЗ ОСНОВА") ||
                      para.includes(":")
                        ? "0"
                        : "15pt",
                  }}
                >
                  {para}
                </p>
              ))}
          </div>
        ) : (
          <div
            style={{
              lineHeight: "1.45",
              textAlign: "justify",
              fontSize: "8.5pt",
              color: "#1e293b",
            }}
          >
            <p style={{ marginBottom: "5pt", textIndent: "15pt" }}>
              Днес, <strong>{decisionDate} г.</strong>, в {meetingLocation}, в{" "}
              {meetingTime} се проведе заседание на Управителния съвет на{" "}
              {formatOrgName(site.name)}.
            </p>

            <p style={{ marginBottom: "3pt", fontWeight: "700" }}>
              ПРИСЪСТВАТ ЧЛЕНОВЕТЕ НА УПРАВИТЕЛНИЯ СЪВЕТ:
            </p>
            <div style={{ marginLeft: "15pt", marginBottom: "5pt" }}>
              {trip.usBoardMembers?.trim() ? (
                <div style={{ whiteSpace: "pre-line" }}>
                  {trip.usBoardMembers.trim()}
                </div>
              ) : (
                <>
                  <p style={{ margin: "2pt 0" }}>
                    1. <strong>{chair}</strong> — Председател на Управителния
                    съвет
                  </p>
                  <p style={{ margin: "2pt 0" }}>
                    2. Членове на Управителния съвет (редовно уведомени по
                    установения ред).
                  </p>
                </>
              )}
            </div>

            <p style={{ marginBottom: "5pt", textIndent: "15pt" }}>
              Председателят констатира, че е налице необходимият съгласно Устава
              на сдружението кворум. Заседанието е законно конституирано и може
              да взема валидни решения. За водещ заседанието бе{" "}
              {isFemalePerson(chair, membersDict) ? "определена" : "определен"}{" "}
              <strong>{chair}</strong>, а за протоколчик —{" "}
              <strong>{secretary}</strong>.
            </p>

            <p
              style={{
                marginBottom: "3pt",
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: "1px",
              }}
            >
              ДНЕВЕН РЕД:
            </p>
            <div
              style={{
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                padding: "6pt 10pt",
                borderRadius: "6px",
                marginBottom: "6pt",
              }}
            >
              <p style={{ margin: 0 }}>
                <strong>Точка 1:</strong> Обсъждане и вземане на решение за
                официално участие на представителния клубен отбор в състезание
                съгласно Държавния спортен календар на{" "}
                {trip.organizer?.trim() || "БФ Бадминтон"}:{" "}
                <strong>{trip.title}</strong> (гр./място{" "}
                <strong>{destCity}</strong>, период{" "}
                <strong>
                  {fmtDate(trip.startDate)} г.
                  {trip.startDate !== trip.endDate
                    ? ` — ${fmtDate(trip.endDate)} г.`
                    : ""}
                </strong>
                ), утвърждаване на клубна делегация и финансово обезпечаване на
                разходите.
              </p>
            </div>

            <p style={{ marginBottom: "4pt", textIndent: "15pt" }}>
              <strong>ПО ТОЧКА 1 ОТ ДНЕВНИЯ РЕД:</strong> Думата бе дадена на
              Председателя на УС <strong>{chair}</strong>.{" "}
              {isFemalePerson(chair, membersDict) ? "Тя" : "Той"} запозна
              присъстващите с предстоящото участие на клуба в състезанието
              съгласно Спортния календар на{" "}
              {trip.organizer?.trim() || "БФ Бадминтон"} —{" "}
              <strong>{trip.title}</strong>, провеждащо се в {destCity} в
              периода{" "}
              <strong>
                {fmtDate(trip.startDate)} г.
                {trip.startDate !== trip.endDate
                  ? ` — ${fmtDate(trip.endDate)} г.`
                  : ""}
              </strong>
              . {isFemalePerson(chair, membersDict) ? "Тя" : "Той"} представи
              информацията за турнира и предложи клубна делегация в общ брой от{" "}
              <strong>
                {totalPlannedPeople}{" "}
                {totalPlannedPeople === 1 ? "човек" : "души"}
              </strong>{" "}
              (Ръководител/Треньор: <strong>{coachName}</strong> и състезатели:{" "}
              <em>
                {plannedPeople
                  .filter(
                    (p) => p.role !== "Треньор" && p.role !== "Ръководител"
                  )
                  .map((p) => p.name)
                  .join(", ") || "—"}
              </em>
              ). Направена бе финансова план-сметка за пътни, дневни и нощувки
              съгласно Наредбата за командировките в страната (НКС).
            </p>

            <p style={{ marginBottom: "5pt", textIndent: "15pt" }}>
              След проведени обсъждания и разисквания, заседанието пристъпи към
              гласуване.{" "}
              <strong>
                Резултат от гласуването: „ЗА“ — единодушно (100%), „ПРОТИВ“ —
                няма, „ВЪЗДЪРЖАЛИ СЕ“ — няма.
              </strong>
            </p>

            <p
              style={{
                textAlign: "center",
                fontWeight: "700",
                margin: "6pt 0",
                letterSpacing: "1px",
              }}
            >
              ВЪЗ ОСНОВА НА РЕЗУЛТАТИТЕ ОТ ГЛАСУВАНЕТО, УПРАВИТЕЛНИЯТ СЪВЕТ ПРИЕ
              СЛЕДНОТО РЕШЕНИЕ № {decisionNum}:
            </p>

            <div style={{ marginLeft: "12pt", marginBottom: "6pt" }}>
              <p style={{ margin: "2pt 0" }}>
                <strong>1.</strong> Одобрява участието на{" "}
                {formatOrgName(site.shortName)} в <strong>{trip.title}</strong>{" "}
                ({destCity}) в периода {fmtDate(trip.startDate)} г.
                {trip.startDate !== trip.endDate
                  ? ` — ${fmtDate(trip.endDate)} г.`
                  : ""}
                .
              </p>
              <p style={{ margin: "2pt 0" }}>
                <strong>2.</strong> Утвърждава поименния състав на делегацията с
                ръководител <strong>{coachName}</strong>.
              </p>
              <p style={{ margin: "2pt 0" }}>
                <strong>3.</strong> Одобрява финансовото обезпечаване (пътни,
                дневни и квартирни пари) съгласно НКС и бюджета на клуба.
              </p>
              <p style={{ margin: "2pt 0" }}>
                <strong>4.</strong> Възлага на Председателя на УС да издаде
                Заповед за командировка <strong>№ {orderNum}</strong> и
                окомплектова счетоводното досие на състезанието.
              </p>
              {trip.usDecisionNotes?.trim() && (
                <p style={{ margin: "2pt 0" }}>
                  <strong>5.</strong> {trip.usDecisionNotes.trim()}
                </p>
              )}
            </div>

            <p style={{ margin: "4pt 0 0 0", textIndent: "15pt" }}>
              Поради изчерпване на дневния ред заседанието на Управителния съвет
              бе закрито. Настоящият протокол № {protocolNum} се съставя в
              удостоверение на взетите решения.
            </p>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "20pt",
            marginTop: "auto",
            paddingTop: "6pt",
          }}
        >
          <div
            style={{
              flex: 1,
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "8pt",
              textAlign: "center",
              backgroundColor: "#f8fafc",
            }}
          >
            <p
              style={{
                fontWeight: "700",
                fontSize: "8.5pt",
                margin: 0,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Председател на заседанието
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "36pt",
              }}
            >
              {trip.signatures?.chairman ? (
                <img
                  src={trip.signatures.chairman}
                  alt="signature"
                  style={{ height: "32pt", objectFit: "contain" }}
                />
              ) : (
                <span style={{ color: "#cbd5e1" }}>
                  ..................................
                </span>
              )}
            </div>
            <p style={{ fontSize: "8pt", margin: 0, color: "#94a3b8" }}>
              / {chair} /
            </p>
          </div>

          <div
            style={{
              flex: 1,
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "8pt",
              textAlign: "center",
              backgroundColor: "#f8fafc",
            }}
          >
            <p
              style={{
                fontWeight: "700",
                fontSize: "8.5pt",
                margin: 0,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Членове на УС
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
                minHeight: "36pt",
                fontSize: "8pt",
                color: "#64748b",
                gap: "2pt",
                paddingLeft: "8pt",
                paddingRight: "8pt",
                width: "100%",
              }}
            >
              {(() => {
                const extracted = extractBoardMembers(
                  trip.usBoardMembers,
                  chair
                );
                const displayMembers =
                  extracted.length > 0
                    ? extracted
                    : secretary &&
                        secretary.trim().toLowerCase() !== "член на ус"
                      ? [secretary]
                      : [];

                if (displayMembers.length === 0) {
                  return (
                    <>
                      <p
                        style={{
                          margin: "1pt 0",
                          width: "100%",
                          textAlign: "left",
                        }}
                      >
                        1. ........................................ (подпис)
                      </p>
                      <p
                        style={{
                          margin: "1pt 0",
                          width: "100%",
                          textAlign: "left",
                        }}
                      >
                        2. ........................................ (подпис)
                      </p>
                    </>
                  );
                }

                return displayMembers.map((mName, idx) => (
                  <p
                    key={idx}
                    style={{
                      margin: "1pt 0",
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    {idx + 1}. ........................................ /{" "}
                    {mName} /
                  </p>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DOC 0: РЕШЕНИЕ НА УПРАВИТЕЛНИЯ СЪВЕТ (BOARD DECISION)
      ══════════════════════════════════════════════════════ */}
      <div id={`pdf-board-decision-template${idSuffix}`} style={PAGE_A4}>
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
                }}
              >
                {formatOrgName(site.shortName, true)}
              </p>
              {site.bulstat && (
                <p
                  style={{
                    fontSize: "9pt",
                    margin: "2pt 0 0 0",
                    color: "#64748b",
                  }}
                >
                  БУЛСТАТ: {site.bulstat} | {site.contact.address}
                </p>
              )}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "14pt" }}>
          <p
            style={{
              fontWeight: "800",
              fontSize: "13pt",
              letterSpacing: "3px",
              margin: 0,
              color: "#0f172a",
            }}
          >
            Р Е Ш Е Н И Е
          </p>
          <p
            style={{
              fontSize: "11pt",
              fontWeight: "700",
              marginTop: "4pt",
              color: "#0f172a",
            }}
          >
            НА УПРАВИТЕЛНИЯ СЪВЕТ НА {formatOrgName(site.name, true)}
          </p>
          <p style={{ fontSize: "11pt", marginTop: "4pt", color: "#475569" }}>
            <span>{getDecisionHeader()}</span>
          </p>
        </div>

        <p
          style={{
            marginBottom: "8pt",
            textAlign: "justify",
            textIndent: "15pt",
            lineHeight: "1.5",
          }}
        >
          Днес, <strong>{decisionDate} г.</strong>, Управителният съвет на{" "}
          {formatOrgName(site.name)}, на основание Устава на сдружението,
          Държавния спортен календар на БФ Бадминтон и разпоредбите на Наредбата
          за командировките в страната (НКС), проведе заседание относно
          финансовото, организационното и транспортното обезпечаване на
          предстоящо спортно участие.
        </p>

        <p
          style={{
            textAlign: "center",
            fontWeight: "700",
            fontSize: "11pt",
            margin: "12pt 0 8pt 0",
            letterSpacing: "2px",
            color: "#0f172a",
          }}
        >
          УПРАВИТЕЛНИЯТ СЪВЕТ РЕШИ:
        </p>

        <div style={{ lineHeight: "1.6", textAlign: "justify" }}>
          <p style={{ marginBottom: "6pt" }}>
            <strong>1.</strong> Одобрява участието на състезатели и треньори на{" "}
            {formatOrgName(site.name)} в: <strong>{trip.title}</strong>,
            провеждащо се в периода{" "}
            <strong>
              {fmtDate(trip.startDate)} г.
              {trip.startDate !== trip.endDate
                ? ` — ${fmtDate(trip.endDate)} г.`
                : ""}
            </strong>{" "}
            в гр./място <strong>{destCity}</strong>.
          </p>

          <p style={{ marginBottom: "6pt" }}>
            <strong>2.</strong> Утвърждава състава на официалната клубна
            делегация в общ брой от <strong>{totalPlannedPeople}</strong>{" "}
            {totalPlannedPeople === 1 ? "човек" : "души"}:
          </p>
          <div style={{ marginLeft: "18pt", marginBottom: "8pt" }}>
            <p style={{ margin: "2pt 0" }}>
              • Ръководител / Треньор: <strong>{coachName}</strong> ({coachRole}
              )
            </p>
            <p style={{ margin: "2pt 0" }}>
              • Състезатели:{" "}
              <strong>
                {plannedPeople
                  .filter(
                    (p) => p.role !== "Треньор" && p.role !== "Ръководител"
                  )
                  .map((p) => p.name)
                  .join(", ") || "—"}
              </strong>
            </p>
          </div>

          <p style={{ marginBottom: "6pt" }}>
            <strong>3.</strong> Транспортни условия и придвижване:
            <br />
            {renderDecisionTransportText()}
          </p>

          <p style={{ marginBottom: "6pt" }}>
            <strong>4.</strong> Финансово осигуряване на командированите лица:
            <br />
            <span
              style={{ marginLeft: "15pt", display: "block", marginTop: "2pt" }}
            >
              а/ <strong>Дневни пари:</strong>{" "}
              {hasPerDiem ? (
                <>
                  по <strong>{fmtEUR(perDiemEUR)}</strong> (
                  {perDiemBGN.toFixed(2)} лв.) / на ден за едно лице за{" "}
                  <strong>{plannedDays}</strong>{" "}
                  {plannedDays === 1 ? "ден" : "дни"}.
                </>
              ) : (
                "не се дължат (осигурена храна)."
              )}
            </span>
            <span
              style={{ marginLeft: "15pt", display: "block", marginTop: "2pt" }}
            >
              б/ <strong>Нощувки / Квартирни:</strong>{" "}
              {!hasPlannedAccom && "не се предвиждат нощувки."}
              {hasPlannedAccom && trip.financials.accommodationRateEUR > 0 && (
                <>
                  по <strong>{fmtEUR(accomEUR)}</strong> ({accomBGN.toFixed(2)}{" "}
                  лв.) / на нощ за едно лице за <strong>{plannedNights}</strong>{" "}
                  {plannedNights === 1 ? "нощ" : "нощи"} (срещу фактура).
                </>
              )}
              {hasPlannedAccom && trip.financials.accommodationRateEUR <= 0 && (
                <>
                  настаняване срещу представена фактура на името на клуба за{" "}
                  <strong>{plannedNights}</strong>{" "}
                  {plannedNights === 1 ? "нощ" : "нощи"}.
                </>
              )}
            </span>
            {hasEntryFee && (
              <span
                style={{
                  marginLeft: "15pt",
                  display: "block",
                  marginTop: "2pt",
                }}
              >
                в/ <strong>Входни такси за турнира:</strong>{" "}
                {entryEUR > 0 ? (
                  <>
                    в размер на <strong>{fmtEUR(entryEUR)}</strong> (
                    {eurToBgn(entryEUR).toFixed(2)} лв.) за отбора срещу
                    официална квитанция/фактура от организатора.
                  </>
                ) : (
                  "съгласно наредбата на състезанието срещу официална квитанция/фактура от организатора."
                )}
              </span>
            )}
          </p>

          {trip.usDecisionNotes && (
            <p style={{ marginBottom: "6pt" }}>
              <strong>5.</strong> Допълнителни разпореждания на УС:
              <br />
              <span
                style={{
                  marginLeft: "15pt",
                  display: "block",
                  marginTop: "2pt",
                }}
              >
                {trip.usDecisionNotes}
              </span>
            </p>
          )}

          <p style={{ marginBottom: "10pt" }}>
            <strong>{trip.usDecisionNotes ? "6." : "5."}</strong> Възлага на
            Председателя на Управителния съвет (<strong>{mol}</strong>) да
            издаде писмена Заповед (Нареждане за командировка) на основание
            настоящото Решение и да организира финансовото отчитане.
          </p>
        </div>

        <p
          style={{
            marginTop: "14pt",
            marginBottom: "18pt",
            fontSize: "10pt",
            fontWeight: "600",
            color: "#0f172a",
          }}
        >
          Разходите по настоящото решение са изцяло за сметка на „
          {site.shortName}“ гр. Гълъбово.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "20pt",
            gap: "20pt",
          }}
        >
          <div
            style={{
              flex: 1,
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "10pt",
              textAlign: "center",
              minHeight: "60pt",
            }}
          >
            <p
              style={{
                fontWeight: "700",
                fontSize: "9pt",
                margin: 0,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Председател на УС
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "45pt",
              }}
            >
              {trip.signatures?.chairman ? (
                <img
                  src={trip.signatures.chairman}
                  alt="signature"
                  style={{ height: "40pt", objectFit: "contain" }}
                />
              ) : (
                <span style={{ color: "#cbd5e1" }}>
                  ..................................
                </span>
              )}
            </div>
            <p style={{ fontSize: "8pt", margin: 0, color: "#94a3b8" }}>
              / {mol} /
            </p>
          </div>

          <div
            style={{
              flex: 1,
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "10pt",
              textAlign: "center",
              minHeight: "60pt",
              backgroundColor: "#f8fafc",
            }}
          >
            <p
              style={{
                fontWeight: "700",
                fontSize: "9pt",
                margin: 0,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Членове на Управителния съвет
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "45pt",
                fontSize: "8.5pt",
                color: "#64748b",
              }}
            >
              {(() => {
                const extracted = extractBoardMembers(trip.usBoardMembers, mol);
                if (extracted.length > 0) {
                  return extracted.map((mName, idx) => (
                    <p key={idx} style={{ margin: "2pt 0" }}>
                      {idx + 1}. ........................................ /{" "}
                      {mName} /
                    </p>
                  ));
                }
                return (
                  <>
                    <p style={{ margin: "2pt 0" }}>
                      1. ........................................ (подпис)
                    </p>
                    <p style={{ margin: "2pt 0" }}>
                      2. ........................................ (подпис)
                    </p>
                  </>
                );
              })()}
            </div>
            <p style={{ fontSize: "8pt", margin: 0, color: "#94a3b8" }}>
              {protocolNum && protocolNum !== "____"
                ? `Протокол № ${protocolNum} от заседание на УС`
                : "Протокол от заседание на УС"}
            </p>
          </div>
        </div>
      </div>

      <div id={`pdf-order-template${idSuffix}`} style={PAGE_A4}>
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
                }}
              >
                {formatOrgName(site.shortName, true)}
              </p>
              {site.bulstat && (
                <p
                  style={{
                    fontSize: "9pt",
                    margin: "2pt 0 0 0",
                    color: "#64748b",
                  }}
                >
                  БУЛСТАТ: {site.bulstat} | {site.contact.address}
                </p>
              )}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: "14pt" }}>
          <p
            style={{
              fontWeight: "800",
              fontSize: "13pt",
              letterSpacing: "4px",
              margin: 0,
            }}
          >
            Н А Р Е Ж Д А Н Е
          </p>
          <p style={{ fontSize: "11pt", marginTop: "4pt", color: "#475569" }}>
            № {orderNum} / {orderDate} г.
          </p>
        </div>
        <p style={{ marginBottom: "8pt", textAlign: "justify" }}>
          На основание Наредбата за командировките в страната, Държавния спортен
          календар на Б Ф Бадминтон
          {trip.usDecision ? (
            <>
              {" "}
              и Решение на Управителния съвет{" "}
              <strong>
                {trip.usDecision.startsWith("№")
                  ? trip.usDecision
                  : `№ ${trip.usDecision}`}
              </strong>
              {trip.usDecisionDate
                ? ` от ${fmtDate(trip.usDecisionDate)} г.`
                : ` от ${decisionDate} г.`}
            </>
          ) : (
            <>
              {" "}
              и Решение на Управителния съвет № {decisionNum} от {decisionDate}{" "}
              г.
            </>
          )}
          ,
        </p>
        <p
          style={{
            textAlign: "center",
            fontWeight: "700",
            fontSize: "12pt",
            marginBottom: "10pt",
            letterSpacing: "3px",
            color: "#0f172a",
          }}
        >
          К О М А Н Д И Р О В А М:
        </p>
        <p style={{ marginBottom: "8pt", lineHeight: "1.5" }}>
          До <strong style={{ color: "#0f172a" }}>{destCity}</strong> и обратно
          до гр. Гълъбово, за участие в:{" "}
          <strong style={{ color: "#0f172a" }}>{trip.title}</strong> (
          {fmtDate(trip.startDate)}
          {trip.startDate !== trip.endDate ? ` - ${fmtDate(trip.endDate)}` : ""}
          ), на следните служебни лица:
        </p>
        <div
          style={{ marginLeft: "16pt", marginBottom: "16pt", marginTop: "4pt" }}
        >
          {plannedPeople.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "3pt 0",
              }}
            >
              <span style={{ width: "24pt", color: "#475569" }}>{i + 1}.</span>
              <strong
                style={{ fontWeight: "600", width: "180pt", color: "#0f172a" }}
              >
                {p.name}
              </strong>
              <span style={{ color: "#64748b" }}>— {p.role.toLowerCase()}</span>
            </div>
          ))}
        </div>
        <p style={{ marginBottom: "6pt" }}>
          На групата от <strong>{totalPlannedPeople}</strong>{" "}
          {totalPlannedPeople === 1 ? "човек" : "човека"} да се осигурят
          средства, както следва:
        </p>
        {hasPerDiem && (
          <p style={{ marginBottom: "4pt" }}>
            {snPlanned("diem")}. Дневни на <strong>{totalPlannedPeople}</strong>{" "}
            {totalPlannedPeople === 1 ? "човек" : "човека"} по{" "}
            <strong>{fmtEUR(perDiemEUR)}</strong> ({perDiemBGN.toFixed(2)} лв.)
            / на ден за едно лице за <strong>{plannedDays}</strong>{" "}
            {plannedDays === 1 ? "ден" : "дни"}.
          </p>
        )}
        {renderOrderTransportText()}
        {hasPlannedAccom && (
          <p style={{ marginBottom: "4pt" }}>
            {snPlanned("accom")}. Нощувки —{" "}
            <strong>{totalPlannedPeople}</strong>{" "}
            {totalPlannedPeople === 1 ? "човек" : "човека"}{" "}
            {trip.financials.accommodationRateEUR > 0 ? (
              <>
                по <strong>{fmtEUR(accomEUR)}</strong> ({accomBGN.toFixed(2)}{" "}
                лв.) / на нощ за едно лице (срещу фактура){" "}
              </>
            ) : (
              <>(срещу фактура) </>
            )}{" "}
            за <strong>{plannedNights}</strong>{" "}
            {plannedNights === 1 ? "нощ" : "нощи"}.
          </p>
        )}
        {hasEntryFee && (
          <p style={{ marginBottom: "4pt" }}>
            {snPlanned("entry")}. Входни такси за участие{" "}
            {entryEUR > 0 ? (
              <>
                — общо <strong>{fmtEUR(entryEUR)}</strong> (
                {eurToBgn(entryEUR).toFixed(2)} лв.) (срещу фактура или
                квитанция от организатора).
              </>
            ) : (
              "(срещу фактура или квитанция от организатора)."
            )}
          </p>
        )}
        <p
          style={{
            marginTop: "12pt",
            marginBottom: "20pt",
            fontSize: "11pt",
            fontWeight: "600",
            color: "#0f172a",
          }}
        >
          Разходите за командировката са за сметка на{" "}
          {formatOrgName(site.shortName)} гр. Гълъбово.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "24pt",
            gap: "20pt",
          }}
        >
          <div
            style={{
              flex: 1,
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "10pt",
              textAlign: "center",
              minHeight: "60pt",
            }}
          >
            <p
              style={{
                fontWeight: "700",
                fontSize: "9pt",
                margin: 0,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Подпис на Командирования
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "50pt",
              }}
            >
              {trip.signatures?.coach ? (
                <img
                  src={trip.signatures.coach}
                  alt="signature"
                  style={{ height: "45pt", objectFit: "contain" }}
                />
              ) : (
                <span style={{ color: "#cbd5e1" }}>
                  ..................................
                </span>
              )}
            </div>
            <p style={{ fontSize: "8pt", margin: 0, color: "#94a3b8" }}>
              / {coachName} /
            </p>
          </div>
          <div
            style={{
              flex: 1,
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "10pt",
              textAlign: "center",
              minHeight: "60pt",
              backgroundColor: "#f8fafc",
            }}
          >
            <p
              style={{
                fontWeight: "700",
                fontSize: "9pt",
                margin: 0,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Печат и Подпис на Председателя
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "50pt",
              }}
            >
              {trip.signatures?.chairman ? (
                <img
                  src={trip.signatures.chairman}
                  alt="signature"
                  style={{ height: "45pt", objectFit: "contain" }}
                />
              ) : (
                <span style={{ color: "#cbd5e1" }}>
                  ..................................
                </span>
              )}
            </div>
            <p style={{ fontSize: "8pt", margin: 0, color: "#94a3b8" }}>
              / {mol} /
            </p>
          </div>
        </div>
      </div>
      {/* ══════════════════════════════════════════════════════
          DOC 2: ВЕДОМОСТ ЗА ИЗПЛАТЕНИ СУМИ (1 или 2 страници А4)
      ══════════════════════════════════════════════════════ */}
      {(() => {
        const isMultiPage = totalPeople > 6;
        const page2Count = isMultiPage
          ? Math.min(7, Math.floor(totalPeople / 2))
          : 0;
        const page1Count = isMultiPage ? totalPeople - page2Count : totalPeople;

        const page1People = allPeople.slice(0, page1Count);
        const page2People = isMultiPage ? allPeople.slice(page1Count) : [];

        const renderTableHeader = () => (
          <thead>
            <tr>
              <th rowSpan={2} style={{ ...TH, width: "16pt" }}>
                №
              </th>
              <th rowSpan={2} style={{ ...TH, width: "95pt" }}>
                Име
              </th>
              <th rowSpan={2} style={{ ...TH, width: "48pt" }}>
                Длъжност
              </th>
              <th rowSpan={2} style={{ ...TH, width: "90pt" }}>
                Маршрут
              </th>
              <th colSpan={2} style={TH}>
                Пътни пари (EUR / лв.)
              </th>
              <th colSpan={3} style={TH}>
                Дневни пари (EUR / лв.)
              </th>
              <th colSpan={3} style={TH}>
                Кв. пари (EUR / лв.)
              </th>
              <th rowSpan={2} style={{ ...TH, width: "68pt" }}>
                Общо (EUR / лв.)
              </th>
              <th rowSpan={2} style={{ ...TH, width: "48pt" }}>
                Подпис
              </th>
            </tr>
            <tr>
              <th style={{ ...TH, width: "32pt" }}>отиване</th>
              <th style={{ ...TH, width: "32pt" }}>връщане</th>
              <th style={{ ...TH, width: "20pt" }}>дни</th>
              <th style={{ ...TH, width: "42pt" }}>за 1 ден</th>
              <th style={{ ...TH, width: "46pt" }}>сума</th>
              <th style={{ ...TH, width: "20pt" }}>нощ</th>
              <th style={{ ...TH, width: "42pt" }}>за 1 нощ</th>
              <th style={{ ...TH, width: "46pt" }}>сума</th>
            </tr>
          </thead>
        );

        const renderPersonRow = (
          p: (typeof allPeople)[0],
          globalIndex: number
        ) => {
          const isFirstPerson = globalIndex === 0;
          const {
            pDays,
            pNights,
            pPerDiemRateEUR,
            pPerDiemRateBGN,
            pDiemEURpp,
            pDiemBGNpp,
            pAcomEURpp,
            pAcomBGNpp,
            personTotalEUR,
            personTotalBGN,
          } = getPersonCalc(p, globalIndex);

          let accomRateCell: React.ReactNode = "—";
          let accomTotalCell: React.ReactNode = "—";

          if (hasAccom) {
            if (pNights > 0 && accomRatePerNightEUR > 0) {
              accomRateCell = (
                <div>
                  <span style={{ fontWeight: "600", color: "#0f172a" }}>
                    {accomRatePerNightEUR.toFixed(2)} €
                  </span>
                  <div
                    style={{
                      fontSize: "6.5pt",
                      color: "#64748b",
                      lineHeight: "1.1",
                    }}
                  >
                    ({accomRatePerNightBGN.toFixed(2)} лв.)
                  </div>
                </div>
              );
              accomTotalCell = (
                <div>
                  <span style={{ fontWeight: "600", color: "#0f172a" }}>
                    {pAcomEURpp.toFixed(2)} €
                  </span>
                  <div
                    style={{
                      fontSize: "6.5pt",
                      color: "#64748b",
                      lineHeight: "1.1",
                    }}
                  >
                    ({pAcomBGNpp.toFixed(2)} лв.)
                  </div>
                </div>
              );
            } else if (pNights === 0) {
              accomRateCell = (
                <span style={{ fontSize: "7.5pt", color: "#94a3b8" }}>—</span>
              );
              accomTotalCell = (
                <span style={{ fontSize: "7.5pt", color: "#94a3b8" }}>
                  0.00 €
                </span>
              );
            } else {
              accomRateCell = (
                <span style={{ fontSize: "7.5pt", color: "#64748b" }}>
                  (по фактура)
                </span>
              );
              accomTotalCell = (
                <span style={{ fontSize: "7.5pt", color: "#64748b" }}>
                  (по фактура)
                </span>
              );
            }
          }

          return (
            <tr key={`${p.name}_${globalIndex}`}>
              <td style={{ ...TD, textAlign: "center" }}>{globalIndex + 1}.</td>
              <td style={TD}>{p.name}</td>
              <td style={{ ...TD, textAlign: "center" }}>{p.role}</td>
              <td style={{ ...TD, textAlign: "center" }}>{routeLabel}</td>
              <td style={{ ...TD, textAlign: "center" }}>
                {isFirstPerson && transportTotalEUR > 0 ? (
                  <div>
                    <span style={{ fontWeight: "600", color: "#0f172a" }}>
                      {(transportTotalEUR / 2).toFixed(2)} €
                    </span>
                    <div
                      style={{
                        fontSize: "6.5pt",
                        color: "#64748b",
                        lineHeight: "1.1",
                      }}
                    >
                      ({(transportTotalBGN / 2).toFixed(2)} лв.)
                    </div>
                  </div>
                ) : (
                  ""
                )}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {isFirstPerson && transportTotalEUR > 0 ? (
                  <div>
                    <span style={{ fontWeight: "600", color: "#0f172a" }}>
                      {(transportTotalEUR / 2).toFixed(2)} €
                    </span>
                    <div
                      style={{
                        fontSize: "6.5pt",
                        color: "#64748b",
                        lineHeight: "1.1",
                      }}
                    >
                      ({(transportTotalBGN / 2).toFixed(2)} лв.)
                    </div>
                  </div>
                ) : (
                  ""
                )}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasPerDiem ? pDays : "—"}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasPerDiem ? (
                  <div>
                    <span style={{ fontWeight: "600", color: "#0f172a" }}>
                      {pPerDiemRateEUR.toFixed(2)} €
                    </span>
                    <div
                      style={{
                        fontSize: "6.5pt",
                        color: "#64748b",
                        lineHeight: "1.1",
                      }}
                    >
                      ({pPerDiemRateBGN.toFixed(2)} лв.)
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasPerDiem ? (
                  <div>
                    <span style={{ fontWeight: "600", color: "#0f172a" }}>
                      {pDiemEURpp.toFixed(2)} €
                    </span>
                    <div
                      style={{
                        fontSize: "6.5pt",
                        color: "#64748b",
                        lineHeight: "1.1",
                      }}
                    >
                      ({pDiemBGNpp.toFixed(2)} лв.)
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasAccom ? pNights : "—"}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>{accomRateCell}</td>
              <td style={{ ...TD, textAlign: "center" }}>{accomTotalCell}</td>
              <td style={{ ...TD, textAlign: "center" }}>
                <div>
                  <span style={{ fontWeight: "700", color: "#0f172a" }}>
                    {personTotalEUR.toFixed(2)} €
                  </span>
                  <div
                    style={{
                      fontSize: "6.5pt",
                      color: "#64748b",
                      lineHeight: "1.1",
                    }}
                  >
                    ({personTotalBGN.toFixed(2)} лв.)
                  </div>
                </div>
              </td>
              <td style={TD}>&nbsp;</td>
            </tr>
          );
        };

        const renderSubtotalRow = (
          label: string,
          slice: typeof allPeople,
          hasTransport: boolean,
          startIndex: number = 0
        ) => {
          const sliceCalcs = slice.map((p, idx) =>
            getPersonCalc(p, startIndex + idx)
          );
          const sliceTransportEUR = hasTransport ? transportTotalEUR : 0;
          const sliceTransportBGN = hasTransport ? transportTotalBGN : 0;
          const sliceDays = sliceCalcs.reduce((s, c) => s + c.pDays, 0);
          const slicePerDiemEUR = sliceCalcs.reduce(
            (s, c) => s + c.pDiemEURpp,
            0
          );
          const slicePerDiemBGN = sliceCalcs.reduce(
            (s, c) => s + c.pDiemBGNpp,
            0
          );
          const sliceNights = sliceCalcs.reduce((s, c) => s + c.pNights, 0);
          const sliceAccomEUR = sliceCalcs.reduce(
            (s, c) => s + c.pAcomEURpp,
            0
          );
          const sliceAccomBGN = sliceCalcs.reduce(
            (s, c) => s + c.pAcomBGNpp,
            0
          );
          const sliceTotalEUR = sliceCalcs.reduce(
            (s, c) => s + c.personTotalEUR,
            0
          );
          const sliceTotalBGN = sliceCalcs.reduce(
            (s, c) => s + c.personTotalBGN,
            0
          );

          return (
            <tr style={{ fontWeight: "bold", backgroundColor: "#f8fafc" }}>
              <td
                colSpan={4}
                style={{ ...TD, textAlign: "right", paddingRight: "8pt" }}
              >
                МЕЖДИНЕН СБОР ({label}):
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {sliceTransportEUR > 0 ? (
                  <div>
                    <span style={{ fontWeight: "700", color: "#0f172a" }}>
                      {(sliceTransportEUR / 2).toFixed(2)} €
                    </span>
                    <div
                      style={{
                        fontSize: "6.5pt",
                        color: "#64748b",
                        fontWeight: "normal",
                        lineHeight: "1.1",
                      }}
                    >
                      ({(sliceTransportBGN / 2).toFixed(2)} лв.)
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {sliceTransportEUR > 0 ? (
                  <div>
                    <span style={{ fontWeight: "700", color: "#0f172a" }}>
                      {(sliceTransportEUR / 2).toFixed(2)} €
                    </span>
                    <div
                      style={{
                        fontSize: "6.5pt",
                        color: "#64748b",
                        fontWeight: "normal",
                        lineHeight: "1.1",
                      }}
                    >
                      ({(sliceTransportBGN / 2).toFixed(2)} лв.)
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasPerDiem ? sliceDays : "—"}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>—</td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasPerDiem ? (
                  <div>
                    <span style={{ fontWeight: "700", color: "#0f172a" }}>
                      {slicePerDiemEUR.toFixed(2)} €
                    </span>
                    <div
                      style={{
                        fontSize: "6.5pt",
                        color: "#64748b",
                        fontWeight: "normal",
                        lineHeight: "1.1",
                      }}
                    >
                      ({slicePerDiemBGN.toFixed(2)} лв.)
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasAccom ? sliceNights : "—"}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>—</td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasAccom
                  ? (() => {
                      if (sliceAccomEUR > 0) {
                        return (
                          <div>
                            <span
                              style={{ fontWeight: "700", color: "#0f172a" }}
                            >
                              {sliceAccomEUR.toFixed(2)} €
                            </span>
                            <div
                              style={{
                                fontSize: "6.5pt",
                                color: "#64748b",
                                fontWeight: "normal",
                                lineHeight: "1.1",
                              }}
                            >
                              ({sliceAccomBGN.toFixed(2)} лв.)
                            </div>
                          </div>
                        );
                      }
                      return (
                        <span style={{ fontSize: "7.5pt", color: "#94a3b8" }}>
                          0.00 €
                        </span>
                      );
                    })()
                  : "—"}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                <div>
                  <span style={{ fontWeight: "800", color: "#0f172a" }}>
                    {sliceTotalEUR.toFixed(2)} €
                  </span>
                  <div
                    style={{
                      fontSize: "6.5pt",
                      color: "#64748b",
                      fontWeight: "normal",
                      lineHeight: "1.1",
                    }}
                  >
                    ({sliceTotalBGN.toFixed(2)} лв.)
                  </div>
                </div>
              </td>
              <td style={TD}>&nbsp;</td>
            </tr>
          );
        };

        const renderGrandTotalRow = () => {
          const totalDays = allPersonCalcs.reduce((s, c) => s + c.pDays, 0);
          const totalDiemEUR = allPersonCalcs.reduce(
            (s, c) => s + c.pDiemEURpp,
            0
          );
          const totalDiemBGN = allPersonCalcs.reduce(
            (s, c) => s + c.pDiemBGNpp,
            0
          );
          const totalNights = allPersonCalcs.reduce((s, c) => s + c.pNights, 0);
          const totalAccomEUR = allPersonCalcs.reduce(
            (s, c) => s + c.pAcomEURpp,
            0
          );
          const totalAccomBGN = allPersonCalcs.reduce(
            (s, c) => s + c.pAcomBGNpp,
            0
          );

          return (
            <tr style={{ fontWeight: "bold", backgroundColor: "#f8fafc" }}>
              <td
                colSpan={4}
                style={{ ...TD, textAlign: "right", paddingRight: "8pt" }}
              >
                ВСИЧКО:
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {transportTotalEUR > 0 ? (
                  <div>
                    <span style={{ fontWeight: "700", color: "#0f172a" }}>
                      {(transportTotalEUR / 2).toFixed(2)} €
                    </span>
                    <div
                      style={{
                        fontSize: "6.5pt",
                        color: "#64748b",
                        fontWeight: "normal",
                        lineHeight: "1.1",
                      }}
                    >
                      ({(transportTotalBGN / 2).toFixed(2)} лв.)
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {transportTotalEUR > 0 ? (
                  <div>
                    <span style={{ fontWeight: "700", color: "#0f172a" }}>
                      {(transportTotalEUR / 2).toFixed(2)} €
                    </span>
                    <div
                      style={{
                        fontSize: "6.5pt",
                        color: "#64748b",
                        fontWeight: "normal",
                        lineHeight: "1.1",
                      }}
                    >
                      ({(transportTotalBGN / 2).toFixed(2)} лв.)
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasPerDiem ? totalDays : "—"}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>—</td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasPerDiem ? (
                  <div>
                    <span style={{ fontWeight: "700", color: "#0f172a" }}>
                      {totalDiemEUR.toFixed(2)} €
                    </span>
                    <div
                      style={{
                        fontSize: "6.5pt",
                        color: "#64748b",
                        fontWeight: "normal",
                        lineHeight: "1.1",
                      }}
                    >
                      ({totalDiemBGN.toFixed(2)} лв.)
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasAccom ? totalNights : "—"}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>—</td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasAccom
                  ? (() => {
                      if (totalAccomEUR > 0) {
                        return (
                          <div>
                            <span
                              style={{ fontWeight: "700", color: "#0f172a" }}
                            >
                              {totalAccomEUR.toFixed(2)} €
                            </span>
                            <div
                              style={{
                                fontSize: "6.5pt",
                                color: "#64748b",
                                fontWeight: "normal",
                                lineHeight: "1.1",
                              }}
                            >
                              ({totalAccomBGN.toFixed(2)} лв.)
                            </div>
                          </div>
                        );
                      }
                      return (
                        <span style={{ fontSize: "7.5pt", color: "#94a3b8" }}>
                          0.00 €
                        </span>
                      );
                    })()
                  : "—"}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                <div>
                  <span style={{ fontWeight: "800", color: "#0f172a" }}>
                    {grandEUR.toFixed(2)} €
                  </span>
                  <div
                    style={{
                      fontSize: "6.5pt",
                      color: "#64748b",
                      fontWeight: "normal",
                      lineHeight: "1.1",
                    }}
                  >
                    ({grandBGN.toFixed(2)} лв.)
                  </div>
                </div>
              </td>
              <td style={TD}>&nbsp;</td>
            </tr>
          );
        };

        const renderSignaturesAndDocs = () => {
          const nonFuelExpenses = expenses.filter(
            (e) => e.expenseType !== "fuel"
          );

          return (
            <div style={{ marginTop: "6pt" }}>
              <p style={{ fontSize: "8.5pt", margin: "4pt 0" }}>
                <strong>Словом: </strong>
                {grandEUR > 0
                  ? `${numToWordsBG(grandEUR, true)} (${numToWordsBG(grandBGN, false)})`
                  : "...................."}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "8pt",
                  gap: "20pt",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "6pt 8pt",
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  <p
                    style={{
                      fontWeight: "600",
                      fontSize: "7.5pt",
                      margin: 0,
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Получил (Командирован)
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "32pt",
                    }}
                  >
                    {trip.signatures?.coach ? (
                      <img
                        src={trip.signatures.coach}
                        alt="signature"
                        style={{ height: "30pt", objectFit: "contain" }}
                      />
                    ) : (
                      <span style={{ color: "#cbd5e1" }}>
                        ..................................
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "7.5pt",
                      margin: 0,
                      marginTop: "4pt",
                      color: "#94a3b8",
                    }}
                  >
                    / {coachName} /
                  </p>
                </div>

                <div
                  style={{
                    flex: 1,
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "6pt 8pt",
                    textAlign: "center",
                    position: "relative",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <p
                    style={{
                      fontWeight: "600",
                      fontSize: "7.5pt",
                      margin: 0,
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Изплатил (Председател)
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "32pt",
                    }}
                  >
                    {trip.signatures?.chairman ? (
                      <img
                        src={trip.signatures.chairman}
                        alt="signature"
                        style={{ height: "30pt", objectFit: "contain" }}
                      />
                    ) : (
                      <span style={{ color: "#cbd5e1" }}>
                        ..................................
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "7.5pt",
                      margin: 0,
                      marginTop: "4pt",
                      color: "#94a3b8",
                    }}
                  >
                    / {mol} /
                  </p>
                </div>
              </div>

              {nonFuelExpenses.length > 0 && (
                <div
                  style={{
                    marginTop: "8pt",
                    fontSize: "7.5pt",
                    borderTop: "1px dashed #cbd5e1",
                    paddingTop: "6pt",
                  }}
                >
                  <p style={{ fontWeight: "600", margin: "0 0 3pt 0" }}>
                    Приложени разходооправдателни документи:
                  </p>
                  {nonFuelExpenses.map((exp, idx) => {
                    const docDate = exp.documentDate
                      ? format(new Date(exp.documentDate), "dd.MM.yyyy")
                      : "............";

                    const getExpenseTypeLabel = (t: string) => {
                      if (t === "transport") return "Транспорт";
                      if (t === "accommodation") return "Нощувки";
                      if (t === "entry_fee") return "Входна такса";
                      if (t === "food") return "Храна";
                      return "Друг разход";
                    };

                    const typeLabel = getExpenseTypeLabel(exp.expenseType);
                    let finalExpAmount = exp.amountEUR;
                    if (
                      exp.expenseType === "entry_fee" &&
                      exp.amountEUR === 0
                    ) {
                      finalExpAmount = entryEUR;
                    } else if (
                      exp.expenseType === "accommodation" &&
                      exp.amountEUR === 0
                    ) {
                      finalExpAmount = totalPeople * accomEUR * numNights;
                    }

                    return (
                      <p key={idx} style={{ margin: "1.5pt 0" }}>
                        {idx + 1}. {typeLabel} —{" "}
                        {exp.documentNumber
                          ? `Фактура/Бон № ${exp.documentNumber}`
                          : "Документ № ...................."}{" "}
                        от {docDate} г. на стойност {finalExpAmount} EUR
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          );
        };

        const renderHeader = () => (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: "8pt",
              marginBottom: "8pt",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8pt" }}>
              <img
                src="/icons/LOGO.jpg"
                alt="Logo"
                style={{ height: "35pt", objectFit: "contain" }}
              />
              <div>
                <p
                  style={{
                    fontWeight: "700",
                    fontSize: "11pt",
                    margin: 0,
                    color: "#0f172a",
                  }}
                >
                  {formatOrgName(site.shortName, true)}
                </p>
                {site.bulstat && (
                  <p
                    style={{
                      fontSize: "8pt",
                      margin: "2pt 0 0 0",
                      color: "#64748b",
                    }}
                  >
                    БУЛСТАТ: {site.bulstat} | {site.contact.address}
                  </p>
                )}
              </div>
            </div>
            <div
              style={{ textAlign: "right", fontSize: "8pt", color: "#475569" }}
            >
              <p style={{ margin: 0 }}>
                Спортна проява:{" "}
                <strong style={{ color: "#0f172a" }}>
                  {event?.title || trip.title}
                </strong>
              </p>
              <p style={{ margin: "2pt 0" }}>
                От {fmtDate(trip.startDate)} г. до {fmtDate(trip.endDate)} г. в{" "}
                {destCity}
              </p>
              <p style={{ margin: 0 }}>
                Нареждане № {orderNum} от {orderDate} г. | Решение на УС №{" "}
                {decisionNum}
              </p>
            </div>
          </div>
        );

        const renderStatementTitle = (subtitle: string) => (
          <div style={{ marginBottom: "6pt", textAlign: "center" }}>
            <p
              style={{
                fontWeight: "800",
                fontSize: "13pt",
                letterSpacing: "4px",
                margin: 0,
                color: "#0f172a",
              }}
            >
              В Е Д О М О С Т № {statementNum}
            </p>
            <p
              style={{
                fontSize: "8pt",
                color: "#64748b",
                margin: "2pt 0 0 0",
                fontWeight: "500",
              }}
            >
              {subtitle}
            </p>
          </div>
        );

        if (isMultiPage) {
          return (
            <div
              id={`pdf-statement-template${idSuffix}`}
              style={{
                width: "297mm",
                backgroundColor: "#fff",
              }}
            >
              {/* ─── СТРАНИЦА 1 ─── */}
              <div className="pdf-page" style={PAGE_LAND_PAGE}>
                <div>
                  {renderHeader()}
                  {renderStatementTitle("за изплатени суми за командировка")}
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginBottom: "6pt",
                    }}
                  >
                    {renderTableHeader()}
                    <tbody>
                      {page1People.map((p, i) => renderPersonRow(p, i))}
                      {renderSubtotalRow("Лист 1", page1People, true)}
                    </tbody>
                  </table>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "7.5pt",
                    color: "#94a3b8",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "4pt",
                    marginTop: "auto",
                  }}
                >
                  <span>
                    {trip.title} — {site.name}
                  </span>
                  <span>Лист 1 от 2</span>
                </div>
              </div>

              {/* ─── СТРАНИЦА 2 ─── */}
              <div className="pdf-page" style={PAGE_LAND_PAGE}>
                <div>
                  {renderHeader()}
                  {renderStatementTitle("Продължение — Лист 2")}
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginBottom: "6pt",
                    }}
                  >
                    {renderTableHeader()}
                    <tbody>
                      {page2People.map((p, i) =>
                        renderPersonRow(p, page1Count + i)
                      )}
                      {renderSubtotalRow(
                        "Лист 2",
                        page2People,
                        false,
                        page1Count
                      )}
                      {renderGrandTotalRow()}
                    </tbody>
                  </table>
                  {renderSignaturesAndDocs()}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "7.5pt",
                    color: "#94a3b8",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "4pt",
                    marginTop: "auto",
                  }}
                >
                  <span>
                    {trip.title} — {site.name}
                  </span>
                  <span>Лист 2 от 2</span>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            id={`pdf-statement-template${idSuffix}`}
            style={{
              width: "297mm",
              backgroundColor: "#fff",
            }}
          >
            <div className="pdf-page" style={PAGE_LAND_PAGE}>
              <div>
                {renderHeader()}
                {renderStatementTitle("за изплатени суми за командировка")}
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "6pt",
                  }}
                >
                  {renderTableHeader()}
                  <tbody>
                    {allPeople.map((p, i) => renderPersonRow(p, i))}
                    {renderGrandTotalRow()}
                  </tbody>
                </table>
                {renderSignaturesAndDocs()}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "7.5pt",
                  color: "#94a3b8",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "4pt",
                  marginTop: "auto",
                }}
              >
                <span>
                  {trip.title} — {site.name}
                </span>
                <span>Лист 1 от 1</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════
          DOC 3: ОТЧЕТ ЗА ГОРИВО (само за fuel_only)
      ══════════════════════════════════════════════════════ */}
      {hasFuel && (
        <div id={`pdf-fuel-report-template${idSuffix}`} style={PAGE_LAND}>
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
                  }}
                >
                  {formatOrgName(site.shortName, true)}
                </p>
                {site.bulstat && (
                  <p
                    style={{
                      fontSize: "9pt",
                      margin: "2pt 0 0 0",
                      color: "#64748b",
                    }}
                  >
                    БУЛСТАТ: {site.bulstat} | {site.contact.address}
                  </p>
                )}
              </div>
            </div>
            <div
              style={{
                textAlign: "center",
                fontSize: "9pt",
                marginRight: "100pt",
              }}
            >
              <p style={{ fontWeight: "600", margin: 0, color: "#0f172a" }}>
                ОДОБРЯВАМ
              </p>
              <p style={{ margin: "2pt 0 4pt 0", color: "#475569" }}>
                Председател:
              </p>
              {trip.signatures?.chairman ? (
                <img
                  src={trip.signatures.chairman}
                  alt="signature"
                  style={{ height: "35pt", objectFit: "contain" }}
                />
              ) : (
                <p style={{ margin: 0 }}>/ {mol} /</p>
              )}
            </div>
          </div>
          <p
            style={{
              textAlign: "center",
              fontWeight: "800",
              fontSize: "15pt",
              letterSpacing: "3px",
              marginBottom: "4pt",
              color: "#0f172a",
            }}
          >
            ПЪТЕН ЛИСТ № {fuelNum} — ОТЧЕТ ЗА РАЗХОД НА ГОРИВО
          </p>
          <p
            style={{
              textAlign: "center",
              fontSize: "11pt",
              margin: "0 0 10pt 0",
              color: "#475569",
            }}
          >
            към Нареждане за командировка № {orderNum} от {orderDate} г.
            (Решение на УС № {decisionNum})
          </p>
          <p style={{ marginBottom: "4pt" }}>
            От <strong>{coachName}</strong>,&nbsp; длъжност{" "}
            <strong>{coachRole}</strong>
          </p>
          <p style={{ marginBottom: "18pt", lineHeight: "1.5" }}>
            За разход на{" "}
            <strong>
              {trip.vehicle?.fuelType ||
                "бензин А-.......... / дизелово гориво, газ"}
            </strong>{" "}
            за личен лек автомобил, марка/ модел{" "}
            <strong>{trip.vehicle?.brand || "неопределена"}</strong>
            ,&nbsp; рег. №{" "}
            <strong>{trip.vehicle?.regNumber || "неопределен"}</strong>,
            използван за служебни цели — <strong>{titleWithLabel}</strong>
            {trip.usDecision ? (
              <>
                {" "}
                съгласно решение на УС <strong>{trip.usDecision}</strong>
              </>
            ) : null}
          </p>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "20pt",
            }}
          >
            <thead>
              <tr>
                <th style={{ ...TH, width: "18pt" }}>№</th>
                <th style={TH}>Спортни мероприятия</th>
                <th style={{ ...TH, width: "55pt" }}>Общо изминати км.</th>
                <th style={{ ...TH, width: "50pt" }}>Норма за 100 км</th>
                <th style={{ ...TH, width: "55pt" }}>Общо разход литри</th>
                <th style={{ ...TH, width: "80pt" }}>
                  Единична цена за 1 л в EUR (лв.)
                </th>
                <th style={{ ...TH, width: "70pt" }}>
                  За изплащане в EUR (лв.)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...TD, textAlign: "center" }}>1.</td>
                <td style={TD}>
                  {trip.title.replace(/^[Кк]омандировка:\s*/u, "")}
                  <br />
                  <span style={{ fontSize: "8pt", color: "#555" }}>
                    {routeLabel}
                    {isDailyCommute && actualTrips > 0 && singleKm > 0 && (
                      <>
                        <br />
                        <strong style={{ color: "#1e3a8a" }}>
                          {actualTrips === 1
                            ? "Еднодневно пътуване:"
                            : "Ежедневно пътуване:"}{" "}
                          {actualTrips} {actualTrips === 1 ? "курс" : "курса"}{" "}
                          (отиване и връщане) по {singleKm} км = {distKm} км
                        </strong>
                      </>
                    )}
                  </span>
                </td>
                <td
                  style={{
                    ...TD,
                    textAlign: "center",
                    fontWeight: isDailyCommute ? "bold" : "normal",
                  }}
                >
                  {distKm > 0 ? distKm : ""}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {fuelNorm > 0 ? fuelNorm : ""}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {totalLiters > 0 ? totalLiters.toFixed(2) : ""}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {avgPricePerLiterEUR > 0
                    ? `€${avgPricePerLiterEUR.toFixed(2)} (${avgPricePerLiterBGN.toFixed(2)} лв.)`
                    : ""}
                </td>
                <td style={{ ...TD, textAlign: "center", fontWeight: "bold" }}>
                  {finalFuelEUR > 0
                    ? `€${finalFuelEUR.toFixed(2)} (${finalFuelBGN.toFixed(2)} лв.)`
                    : ""}
                </td>
              </tr>
              <tr style={{ fontWeight: "bold" }}>
                <td colSpan={2} style={{ ...TD, textAlign: "center" }}>
                  ВСИЧКО:
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {distKm > 0 ? distKm : ""}
                </td>
                <td style={TD}>&nbsp;</td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {totalLiters > 0 ? totalLiters.toFixed(2) : ""}
                </td>
                <td style={TD}>&nbsp;</td>
                <td style={{ ...TD, textAlign: "center", fontWeight: "bold" }}>
                  {finalFuelEUR > 0
                    ? `€${finalFuelEUR.toFixed(2)} (${finalFuelBGN.toFixed(2)} лв.)`
                    : ""}
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: "10pt", marginBottom: "16pt" }}>
            {(() => {
              const fuelExpenses = expenses.filter(
                (e) => e.expenseType === "fuel"
              );
              if (fuelExpenses.length > 0) {
                return fuelExpenses.map((exp, idx) => {
                  const docDate = exp.documentDate
                    ? format(new Date(exp.documentDate), "dd.MM.yyyy")
                    : "............";
                  return (
                    <p
                      key={idx}
                      style={{ paddingLeft: idx === 0 ? "0" : "118pt" }}
                    >
                      {idx === 0 ? "Приложение: фискален бон    № " : "№ "}
                      {exp.documentNumber ||
                        "..........................."} / {docDate} г.
                    </p>
                  );
                });
              }
              // Fallback to 3 empty lines if no fuel expenses found
              return (
                <>
                  <p>
                    Приложение: фискален бон &nbsp;&nbsp; №
                    ........................... / ............ {yearStr} г.
                  </p>
                  <p style={{ paddingLeft: "118pt" }}>
                    № ........................... / ............ {yearStr} г.
                  </p>
                  <p style={{ paddingLeft: "118pt" }}>
                    № ........................... / ............ {yearStr} г.
                  </p>
                </>
              );
            })()}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "20pt",
            }}
          >
            <div style={{ flex: 1, fontSize: "11pt", color: "#475569" }}>
              <p>гр. Гълъбово &nbsp;&nbsp; .............. {yearStr} г.</p>
            </div>

            <div
              style={{
                flex: 1,
                maxWidth: "250pt",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "10pt",
                textAlign: "center",
                backgroundColor: "#f8fafc",
              }}
            >
              <p
                style={{
                  fontWeight: "700",
                  fontSize: "9pt",
                  margin: 0,
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Подпис (Отчел)
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "50pt",
                }}
              >
                {trip.signatures?.coach ? (
                  <img
                    src={trip.signatures.coach}
                    alt="signature"
                    style={{ height: "45pt", objectFit: "contain" }}
                  />
                ) : (
                  <span style={{ color: "#cbd5e1" }}>
                    ..................................
                  </span>
                )}
              </div>
              <p style={{ fontSize: "8pt", margin: 0, color: "#94a3b8" }}>
                / {coachName} /
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          DOC 4: ПРИСЪСТВЕН ЛИСТ (ATTENDANCE)
      ══════════════════════════════════════════════════════ */}
      {(() => {
        const athletes = allPeople.filter(
          (p) => p.role !== "Треньор" && p.role !== "Ръководител"
        );
        const useTwoCols = athletes.length > 8;

        return (
          <div
            id={`pdf-attendance-template${idSuffix}`}
            className="pdf-page"
            style={{
              ...PAGE_A4,
              minHeight: "297mm",
              maxHeight: "297mm",
              boxSizing: "border-box",
              padding: "10mm 15mm",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
            }}
          >
            <div>
              {/* Хедър с лого и данни за клуба */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "2px solid #e2e8f0",
                  paddingBottom: "8pt",
                  marginBottom: "10pt",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10pt" }}
                >
                  <img
                    src="/icons/LOGO.jpg"
                    alt="Logo"
                    style={{ height: "40pt", objectFit: "contain" }}
                  />
                  <div>
                    <p
                      style={{
                        fontWeight: "700",
                        fontSize: "13pt",
                        margin: 0,
                        color: "#0f172a",
                      }}
                    >
                      {formatOrgName(site.shortName, true)}
                    </p>
                    {site.bulstat && (
                      <p
                        style={{
                          fontSize: "8.5pt",
                          margin: "2pt 0 0 0",
                          color: "#64748b",
                        }}
                      >
                        БУЛСТАТ: {site.bulstat} | {site.contact.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Заглавие на списъка */}
              <div style={{ textAlign: "center", marginBottom: "10pt" }}>
                <p
                  style={{
                    fontWeight: "800",
                    fontSize: "13pt",
                    letterSpacing: "2px",
                    margin: 0,
                    color: "#0f172a",
                  }}
                >
                  С П И С Ъ К № {attendanceNum}
                </p>
                <p
                  style={{
                    fontSize: "10.5pt",
                    marginTop: "3pt",
                    marginBottom: 0,
                    color: "#0f172a",
                    fontWeight: "600",
                  }}
                >
                  на състезателите от {formatOrgName(site.shortName, true)}
                </p>
                <p
                  style={{
                    fontSize: "9pt",
                    marginTop: "2pt",
                    marginBottom: 0,
                    color: "#64748b",
                  }}
                >
                  към Нареждане за командировка № {orderNum} от {orderDate} г.
                </p>
                <p
                  style={{
                    fontSize: "10pt",
                    marginTop: "2pt",
                    marginBottom: 0,
                    color: "#475569",
                  }}
                >
                  участници на{" "}
                  <strong style={{ color: "#0f172a" }}>
                    {event?.title || trip.title}
                  </strong>
                </p>
                <p
                  style={{
                    fontSize: "9.5pt",
                    marginTop: "2pt",
                    marginBottom: 0,
                    color: "#475569",
                  }}
                >
                  {fmtDate(trip.startDate)} г. - {fmtDate(trip.endDate)} г. —{" "}
                  {destCity}
                </p>
              </div>

              {/* Организатор и клуб домакин */}
              <div
                style={{
                  marginBottom: "10pt",
                  fontSize: "9.5pt",
                  lineHeight: "1.4",
                }}
              >
                <p style={{ margin: "2pt 0" }}>
                  <strong>Организатор:</strong>{" "}
                  {trip.organizer ||
                    "..............................................."}
                </p>
                <p style={{ margin: "2pt 0" }}>
                  <strong>Клуб домакин:</strong>{" "}
                  {trip.hostClub ||
                    "..............................................."}
                </p>
              </div>

              {/* Подзаглавие Списък на участниците */}
              <p
                style={{
                  fontWeight: "700",
                  fontSize: "10pt",
                  margin: "0 0 6pt 0",
                  color: "#0f172a",
                }}
              >
                СПИСЪК НА УЧАСТНИЦИТЕ
              </p>

              {/* Списък със състезатели */}
              <div
                style={{
                  marginBottom: "10pt",
                  fontSize: "9.5pt",
                  lineHeight: "1.35",
                  ...(useTwoCols
                    ? {
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        columnGap: "30pt",
                        rowGap: "2pt",
                      }
                    : {}),
                }}
              >
                {athletes.map((p, i) => (
                  <p key={i} style={{ margin: useTwoCols ? 0 : "2pt 0" }}>
                    {i + 1}. {p.name}
                  </p>
                ))}
              </div>

              {/* Удостоверение от ръководителя */}
              <div style={{ marginBottom: "10pt", fontSize: "9.5pt" }}>
                <p
                  style={{
                    fontWeight: "700",
                    fontSize: "9.5pt",
                    margin: "0 0 4pt 0",
                    color: "#0f172a",
                  }}
                >
                  УДОСТОВЕРЕНИЕ ОТ РЪКОВОДИТЕЛЯ НА ГРУПАТА
                </p>
                <p style={{ margin: "2pt 0" }}>
                  Общ брой присъствали лица: <strong>{totalPeople}</strong>
                </p>
                <p style={{ margin: "2pt 0" }}>от които:</p>
                <ul style={{ margin: "2pt 0 2pt 18pt", padding: 0 }}>
                  <li style={{ margin: "1pt 0" }}>
                    Треньорски състав / Ръководители:{" "}
                    <strong>
                      {
                        allPeople.filter(
                          (p) =>
                            p.role === "Треньор" || p.role === "Ръководител"
                        ).length
                      }
                    </strong>
                  </li>
                  <li style={{ margin: "1pt 0" }}>
                    Състезатели: <strong>{athletes.length}</strong>
                  </li>
                </ul>
              </div>
            </div>

            {/* Подписи в долната част */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "12pt",
                paddingTop: "8pt",
                fontSize: "9pt",
              }}
            >
              <div>
                <p style={{ margin: "0 0 2pt 0" }}>
                  Дата: {fmtDate(trip.startDate || trip.endDate)} г.
                </p>
                <p style={{ margin: 0 }}>гр. Гълъбово</p>
                <div style={{ marginTop: "10pt" }}>
                  <p style={{ margin: "0 0 2pt 0", fontWeight: "600" }}>
                    Ръководител на групата / Треньор:
                  </p>
                  <p style={{ margin: "0 0 10pt 0" }}>
                    Име и фамилия: {coachName}
                  </p>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <span style={{ marginRight: "10pt" }}>Подпис:</span>
                    {trip.signatures?.coach ? (
                      <img
                        src={trip.signatures.coach}
                        alt="signature"
                        style={{ height: "35pt", objectFit: "contain" }}
                      />
                    ) : (
                      <span style={{ color: "#cbd5e1" }}>
                        ..................................
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  width: "250pt",
                  borderLeft: "2px dashed #cbd5e1",
                  paddingLeft: "16pt",
                }}
              >
                <p style={{ margin: "0 0 6pt 0", fontWeight: "600" }}>
                  Главен съдия / Клуб Домакин / или Организатор:
                </p>
                <p style={{ margin: "0 0 6pt 0" }}>
                  Дата: {fmtDate(trip.startDate || trip.endDate)} г.
                </p>
                <p style={{ margin: "0 0 12pt 0" }}>
                  Подпис: ............................................
                </p>
                <p style={{ margin: "0 0 3pt 0" }}>
                  Печат: ............................................
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "7.5pt",
                    color: "#64748b",
                    lineHeight: "1.2",
                  }}
                >
                  (печат се поставя само ако се подписва от{" "}
                  {trip.hostClub || "клуба домакин"} или представител на{" "}
                  {trip.organizer || "организацията"}. При подпис от гл.съдия -
                  печат не се изисква.)
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════
          DOC 5: ДОКЛАД ЗА ИЗВЪРШЕНАТА РАБОТА (REPORT)
      ══════════════════════════════════════════════════════ */}
      {(() => {
        const defaultReportText = generateDefaultReportText(
          trip,
          membersDict,
          Boolean(trip.attachMatchProtocols),
          expenses,
          event
        );

        const displayReportText =
          trip.reportText && trip.reportText.trim().length > 0
            ? updateReportTextStaySection(
                trip.reportText.trim(),
                trip,
                membersDict
              )
            : defaultReportText;

        // Приблизителна оценка на редовете: при дълъг текст докладът заема точно 2 листа А4
        const estimatedLines = displayReportText
          .split("\n")
          .reduce((sum, l) => sum + Math.max(1, Math.ceil(l.length / 100)), 0);
        const reportSheets = estimatedLines > 38 ? 2 : 1;

        return (
          <div
            id={`pdf-report-template${idSuffix}`}
            style={{
              ...PAGE_A4_REPORT,
              minHeight: `${297 * reportSheets}mm`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "2px solid #e2e8f0",
                paddingBottom: "6pt",
                marginBottom: "8pt",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8pt" }}
              >
                <img
                  src="/icons/LOGO.jpg"
                  alt="Logo"
                  style={{ height: "36pt", objectFit: "contain" }}
                />
                <div>
                  <p
                    style={{
                      fontWeight: "700",
                      fontSize: "12pt",
                      margin: 0,
                      color: "#0f172a",
                    }}
                  >
                    {formatOrgName(site.shortName, true)}
                  </p>
                  {site.bulstat && (
                    <p
                      style={{
                        fontSize: "8pt",
                        margin: "1pt 0 0 0",
                        color: "#64748b",
                      }}
                    >
                      БУЛСТАТ: {site.bulstat} | {site.contact.address}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right", fontSize: "8pt" }}>
                <p style={{ margin: 0, fontWeight: "700", color: "#0f172a" }}>
                  УТВЪРЖДАВАМ:
                </p>
                <p style={{ margin: "1pt 0" }}>
                  Председател на УС: ....................
                </p>
                <p style={{ margin: "1pt 0", color: "#64748b" }}>
                  / {site.contact.mol || "М. Георгиева"} /
                </p>
                <p style={{ margin: "1pt 0" }}>
                  Дата: {fmtDate(trip.endDate || trip.startDate)} г.
                </p>
              </div>
            </div>

            <div style={{ textAlign: "center", marginBottom: "8pt" }}>
              <p
                style={{
                  fontWeight: "800",
                  fontSize: "12pt",
                  letterSpacing: "1.5px",
                  margin: 0,
                  color: "#0f172a",
                }}
              >
                Д О К Л А Д № {reportNum}
              </p>
              <p
                style={{
                  fontSize: "10pt",
                  marginTop: "2pt",
                  marginBottom: 0,
                  color: "#0f172a",
                  fontWeight: "700",
                }}
              >
                ЗА ИЗВЪРШЕНАТА РАБОТА И СПОРТНИ РЕЗУЛТАТИ
              </p>
              <p
                style={{
                  fontSize: "8pt",
                  color: "#64748b",
                  margin: "1pt 0 0 0",
                }}
              >
                (съгласно Наредбата за командировките в страната)
              </p>
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "4pt",
                padding: "6pt 10pt",
                marginBottom: "8pt",
                fontSize: "8.5pt",
                lineHeight: "1.35",
              }}
            >
              <p style={{ margin: "1pt 0" }}>
                <strong>ОТ:</strong> {coachName} — {coachRole}
              </p>
              <p style={{ margin: "1pt 0" }}>
                <strong>ОТНОСНО:</strong> Командировка за участие в:{" "}
                <strong>{trip.title}</strong>
              </p>
              <p style={{ margin: "1pt 0" }}>
                <strong>НА ОСНОВАНИЕ:</strong> Нареждане №{" "}
                <strong>{orderNum}</strong> от {orderDate} г. и Решение на УС{" "}
                <strong>{getDecisionHeader()}</strong>
              </p>
              <p style={{ margin: "1pt 0" }}>
                <strong>МЯСТО И ПЕРИОД:</strong> {destCity} (
                {fmtDate(trip.startDate)} г. — {fmtDate(trip.endDate)} г.)
              </p>
            </div>

            <div
              style={{
                fontSize: "8.5pt",
                lineHeight: "1.42",
                textAlign: "justify",
                whiteSpace: "pre-line",
                color: "#1e293b",
                marginBottom: "10pt",
                flex: "1 1 auto",
              }}
            >
              {displayReportText}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: "auto",
                paddingTop: "12pt",
                pageBreakInside: "avoid",
              }}
            >
              <div style={{ fontSize: "8.5pt" }}>
                <p style={{ margin: "0 0 2pt 0" }}>
                  Дата: {fmtDate(trip.endDate || trip.startDate)} г.
                </p>
                <p style={{ margin: 0 }}>гр. Гълъбово</p>
              </div>

              <div style={{ textAlign: "right", fontSize: "8.5pt" }}>
                <p style={{ margin: "0 0 2pt 0", fontWeight: "600" }}>
                  Докладчик (Командировано лице):
                </p>
                <p style={{ margin: "0 0 4pt 0" }}>{coachName}</p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                  }}
                >
                  <span style={{ marginRight: "8pt" }}>Подпис:</span>
                  {trip.signatures?.coach ? (
                    <img
                      src={trip.signatures.coach}
                      alt="signature"
                      style={{ height: "30pt", objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ color: "#cbd5e1" }}>
                      ........................................
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
