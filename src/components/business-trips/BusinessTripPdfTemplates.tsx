"use client";
/* eslint-disable react/forbid-dom-props */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable sonarjs/cognitive-complexity */

import { differenceInCalendarDays, format } from "date-fns";
import { bg } from "date-fns/locale";
import React from "react";

import { getSiteConfig } from "@/config/sites";
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
  trip,
  event,
  membersDict,
  expenses = [],
  idSuffix = "",
}: BusinessTripPdfTemplatesProps) {
  if (!trip) return null;

  const site = getSiteConfig();

  const coach = membersDict[trip.coachId];
  const coachName =
    trip.coachName ||
    (coach ? `${coach.firstName} ${coach.lastName}` : "___________________");
  const coachRole =
    trip.coachRole || (coach?.isCoach ? "Треньор" : "Ръководител");

  const partMembers = trip.participantsIds
    .map((id) => membersDict[id])
    .filter(Boolean) as Member[];
  const allPeople = [
    { name: coachName, role: coachRole, member: coach },
    ...partMembers.map((m) => ({
      name: `${m.firstName} ${m.lastName}`,
      role: m.isCoach ? "Треньор" : "Състезател",
      member: m,
    })),
  ];
  const totalPeople = allPeople.length;

  const fmtDate = (d?: string) => {
    if (!d) return "—";
    try {
      return format(new Date(d), "dd.MM.yyyy", { locale: bg });
    } catch {
      return d;
    }
  };
  const startD = new Date(trip.startDate);
  const endD = new Date(trip.endDate);
  const plannedDays = Math.max(1, differenceInCalendarDays(endD, startD) + 1);
  const plannedNights = Math.max(0, differenceInCalendarDays(endD, startD));
  // Use actual days/nights if user has set them (e.g. early return)
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
  const distKm = trip.vehicle?.distanceKm ?? 0;

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

  const dTotalEURpp = perDiemEUR * numDays;
  const accomExpenses = expenses.filter(
    (e) => e.expenseType === "accommodation"
  );
  const actualAccomTotalEUR = accomExpenses.reduce(
    (sum, e) =>
      sum +
      (e.amountEUR > 0 ? e.amountEUR : accomEUR * numNights * totalPeople),
    0
  );
  const aTotalEURpp =
    actualAccomTotalEUR > 0
      ? actualAccomTotalEUR / totalPeople
      : accomEUR * numNights;
  const coverage = trip.expensesCoverage;
  const coverageHasAccom =
    coverage === "food_and_sleep" || coverage === "transport_food_sleep";
  const coverageExcludesAccom =
    coverage === "food_only" ||
    coverage === "transport_only" ||
    coverage === "transport_and_food";

  const hasAccom =
    (coverageHasAccom && numNights > 0) ||
    (!coverageExcludesAccom &&
      ((accomEUR > 0 && numNights > 0) ||
        actualAccomTotalEUR > 0 ||
        (numNights > 0 && (trip.financials.perDiemRateEUR ?? 0) >= 20)));

  const dTotalBGNppRounded = Math.round(eurToBgn(dTotalEURpp) * 100) / 100;
  const aTotalBGNppRounded = Math.round(eurToBgn(aTotalEURpp) * 100) / 100;
  const ppTotalBGNRounded = dTotalBGNppRounded + aTotalBGNppRounded;

  const ppTotalEUR = dTotalEURpp + aTotalEURpp;
  const transportExpenses = expenses.filter(
    (e) => e.expenseType === "transport"
  );
  const baseTransportEUR = transportExpenses.reduce(
    (sum, e) => sum + e.amountEUR,
    0
  );
  const transportTotalEUR = baseTransportEUR + finalFuelEUR;
  const transportTotalBGN = eurToBgn(baseTransportEUR) + finalFuelBGN;

  const grandEUR = totalPeople * ppTotalEUR + transportTotalEUR;
  const grandBGN = totalPeople * ppTotalBGNRounded + transportTotalBGN;

  const orderNum = trip.id ? trip.id.substring(0, 6).toUpperCase() : "______";
  const orderDate = fmtDate(trip.orderDate || trip.createdAt || trip.startDate);
  const decisionDate = trip.usDecisionDate
    ? fmtDate(trip.usDecisionDate)
    : orderDate;

  const getDecisionHeader = (): string => {
    if (trip.usDecision) {
      const cleanNum = trip.usDecision.startsWith("№")
        ? trip.usDecision
        : `№ ${trip.usDecision}`;
      if (cleanNum.includes("/") || cleanNum.toLowerCase().includes("от")) {
        return cleanNum;
      }
      return `${cleanNum} / ${decisionDate} г.`;
    }
    return `№ ${orderNum}-УС / ${decisionDate} г.`;
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

  const secs = [
    hasPerDiem && "diem",
    "transport",
    hasAccom && "accom",
    hasEntryFee && "entry",
  ].filter(Boolean);
  const sn = (s: string) => secs.indexOf(s) + 1;
  const mol = site.contact.mol || "М. Георгиева";

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
          {sn("transport")}. Транспорт:{" "}
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
          {sn("transport")}. Транспорт: Транспортът е организиран и осигурен
          безплатно. Не се начисляват пътни пари на командированите лица.
        </p>
      );
    }
    if (trip.transportType === "public") {
      return (
        <p style={{ marginBottom: "4pt" }}>
          {sn("transport")}. Транспорт: Пътуването да се извърши с:{" "}
          <strong>обществен транспорт (влак, автобус, самолет)</strong> — срещу
          представени оригинални билети за отиване и връщане.
        </p>
      );
    }
    return (
      <p style={{ marginBottom: "4pt" }}>
        {sn("transport")}. Транспорт: Пътуването да се извърши с:{" "}
        <strong>{tShort}</strong> (срещу фактура или билет).
      </p>
    );
  };

  return (
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
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
                „{site.shortName.toUpperCase()}"
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
            НА УПРАВИТЕЛНИЯ СЪВЕТ НА „{site.name.toUpperCase()}“
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
          Днес, <strong>{decisionDate} г.</strong>, Управителният съвет на „
          {site.name}“, на основание Устава на сдружението, Държавния спортен
          календар на БФ Бадминтон и разпоредбите на Наредбата за командировките
          в страната (НКС), проведе заседание относно финансовото,
          организационното и транспортното обезпечаване на предстоящо спортно
          участие.
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
            <strong>1.</strong> Одобрява участието на състезатели и треньори на
            „{site.name}“ в: <strong>{trip.title}</strong>, провеждащо се в
            периода{" "}
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
            делегация в общ брой от <strong>{totalPeople}</strong>{" "}
            {totalPeople === 1 ? "човек" : "души"}:
          </p>
          <div style={{ marginLeft: "18pt", marginBottom: "8pt" }}>
            <p style={{ margin: "2pt 0" }}>
              • Ръководител / Треньор: <strong>{coachName}</strong> ({coachRole}
              )
            </p>
            <p style={{ margin: "2pt 0" }}>
              • Състезатели:{" "}
              <strong>
                {allPeople
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
                  <strong>{numDays}</strong> {numDays === 1 ? "ден" : "дни"}.
                </>
              ) : (
                "не се дължат (осигурена храна)."
              )}
            </span>
            <span
              style={{ marginLeft: "15pt", display: "block", marginTop: "2pt" }}
            >
              б/ <strong>Нощувки / Квартирни:</strong>{" "}
              {!hasAccom && "не се предвиждат нощувки."}
              {hasAccom && trip.financials.accommodationRateEUR > 0 && (
                <>
                  по <strong>{fmtEUR(accomEUR)}</strong> ({accomBGN.toFixed(2)}{" "}
                  лв.) / на нощ за едно лице за <strong>{numNights}</strong>{" "}
                  {numNights === 1 ? "нощ" : "нощи"} (срещу фактура).
                </>
              )}
              {hasAccom && trip.financials.accommodationRateEUR <= 0 && (
                <>
                  настаняване срещу представена фактура на името на клуба за{" "}
                  <strong>{numNights}</strong>{" "}
                  {numNights === 1 ? "нощ" : "нощи"}.
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
                height: "45pt",
                fontSize: "8.5pt",
                color: "#64748b",
              }}
            >
              <p style={{ margin: "2pt 0" }}>
                1. ........................................ (подпис)
              </p>
              <p style={{ margin: "2pt 0" }}>
                2. ........................................ (подпис)
              </p>
            </div>
            <p style={{ fontSize: "8pt", margin: 0, color: "#94a3b8" }}>
              {trip.usProtocolNumber
                ? `Протокол № ${trip.usProtocolNumber} от заседание на УС`
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
                „{site.shortName.toUpperCase()}"
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
                : ""}
            </>
          ) : (
            <> и Решение на Управителния съвет № {orderNum}-УС</>
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
          {allPeople.map((p, i) => (
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
          На групата от <strong>{totalPeople}</strong>{" "}
          {totalPeople === 1 ? "човек" : "човека"} да се осигурят средства,
          както следва:
        </p>
        {hasPerDiem && (
          <p style={{ marginBottom: "4pt" }}>
            {sn("diem")}. Дневни на <strong>{totalPeople}</strong>{" "}
            {totalPeople === 1 ? "човек" : "човека"} по{" "}
            <strong>{fmtEUR(perDiemEUR)}</strong> ({perDiemBGN.toFixed(2)} лв.)
            / на ден за едно лице за <strong>{numDays}</strong>{" "}
            {numDays === 1 ? "ден" : "дни"}.
          </p>
        )}
        {renderOrderTransportText()}
        {hasAccom && (
          <p style={{ marginBottom: "4pt" }}>
            {sn("accom")}. Нощувки — <strong>{totalPeople}</strong>{" "}
            {totalPeople === 1 ? "човек" : "човека"}{" "}
            {trip.financials.accommodationRateEUR > 0 ? (
              <>
                по <strong>{fmtEUR(accomEUR)}</strong> ({accomBGN.toFixed(2)}{" "}
                лв.) / на нощ за едно лице (срещу фактура){" "}
              </>
            ) : (
              <>(срещу фактура) </>
            )}{" "}
            за <strong>{numNights}</strong> {numNights === 1 ? "нощ" : "нощи"}.
          </p>
        )}
        {hasEntryFee && (
          <p style={{ marginBottom: "4pt" }}>
            {sn("entry")}. Входни такси за участие{" "}
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
          Разходите за командировката са за сметка на „{site.shortName}" гр.
          Гълъбово.
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
      <div id={`pdf-statement-template${idSuffix}`} style={PAGE_LAND}>
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
                „{site.shortName.toUpperCase()}"
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
              Нареждане № {orderNum} от {orderDate} г.
            </p>
          </div>
        </div>
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
            В Е Д О М О С Т
          </p>
          <p
            style={{
              fontSize: "8pt",
              color: "#64748b",
              margin: "2pt 0 0 0",
              fontWeight: "500",
            }}
          >
            за изплатени суми за командировка (Основна валута: EUR € | Втора
            валута: BGN лв., фиксиран курс 1.95583)
          </p>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "8pt",
          }}
        >
          <thead>
            <tr>
              <th rowSpan={2} style={{ ...TH, width: "16pt" }}>
                №
              </th>
              <th rowSpan={2} style={{ ...TH, width: "85pt" }}>
                Име
              </th>
              <th rowSpan={2} style={{ ...TH, width: "48pt" }}>
                Длъжност
              </th>
              <th rowSpan={2} style={{ ...TH, width: "85pt" }}>
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
              <th style={{ ...TH, width: "44pt" }}>за 1 ден</th>
              <th style={{ ...TH, width: "48pt" }}>сума</th>
              <th style={{ ...TH, width: "20pt" }}>нощ</th>
              <th style={{ ...TH, width: "44pt" }}>за 1 нощ</th>
              <th style={{ ...TH, width: "48pt" }}>сума</th>
            </tr>
          </thead>
          <tbody>
            {allPeople.map((p, i) => {
              const personTransportEUR = i === 0 ? transportTotalEUR : 0;
              const personTransportBGN = i === 0 ? transportTotalBGN : 0;
              const personTotalEUR = ppTotalEUR + personTransportEUR;
              const personTotalBGN = ppTotalBGNRounded + personTransportBGN;

              let accomRateCell: React.ReactNode = "—";
              let accomTotalCell: React.ReactNode = "—";

              if (hasAccom) {
                if (aTotalEURpp > 0) {
                  const rateEUR = aTotalEURpp / (numNights || 1);
                  const rateBGN = aTotalBGNppRounded / (numNights || 1);
                  accomRateCell = (
                    <div>
                      <span style={{ fontWeight: "600", color: "#0f172a" }}>
                        {rateEUR.toFixed(2)} €
                      </span>
                      <div
                        style={{
                          fontSize: "7pt",
                          color: "#64748b",
                          lineHeight: "1.1",
                        }}
                      >
                        ({rateBGN.toFixed(2)} лв.)
                      </div>
                    </div>
                  );
                  accomTotalCell = (
                    <div>
                      <span style={{ fontWeight: "600", color: "#0f172a" }}>
                        {aTotalEURpp.toFixed(2)} €
                      </span>
                      <div
                        style={{
                          fontSize: "7pt",
                          color: "#64748b",
                          lineHeight: "1.1",
                        }}
                      >
                        ({aTotalBGNppRounded.toFixed(2)} лв.)
                      </div>
                    </div>
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
                <tr key={i}>
                  <td style={{ ...TD, textAlign: "center" }}>{i + 1}.</td>
                  <td style={TD}>{p.name}</td>
                  <td style={{ ...TD, textAlign: "center" }}>{p.role}</td>
                  <td style={{ ...TD, textAlign: "center" }}>{routeLabel}</td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    {i === 0 && transportTotalEUR > 0 ? (
                      <div>
                        <span style={{ fontWeight: "600", color: "#0f172a" }}>
                          {(transportTotalEUR / 2).toFixed(2)} €
                        </span>
                        <div
                          style={{
                            fontSize: "7pt",
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
                    {i === 0 && transportTotalEUR > 0 ? (
                      <div>
                        <span style={{ fontWeight: "600", color: "#0f172a" }}>
                          {(transportTotalEUR / 2).toFixed(2)} €
                        </span>
                        <div
                          style={{
                            fontSize: "7pt",
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
                    {hasPerDiem ? numDays : "—"}
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    {hasPerDiem ? (
                      <div>
                        <span style={{ fontWeight: "600", color: "#0f172a" }}>
                          {perDiemEUR.toFixed(2)} €
                        </span>
                        <div
                          style={{
                            fontSize: "7pt",
                            color: "#64748b",
                            lineHeight: "1.1",
                          }}
                        >
                          ({perDiemBGN.toFixed(2)} лв.)
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
                          {dTotalEURpp.toFixed(2)} €
                        </span>
                        <div
                          style={{
                            fontSize: "7pt",
                            color: "#64748b",
                            lineHeight: "1.1",
                          }}
                        >
                          ({dTotalBGNppRounded.toFixed(2)} лв.)
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    {hasAccom ? numNights : "—"}
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    {accomRateCell}
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    {accomTotalCell}
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <div>
                      <span style={{ fontWeight: "700", color: "#0f172a" }}>
                        {personTotalEUR.toFixed(2)} €
                      </span>
                      <div
                        style={{
                          fontSize: "7pt",
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
            })}
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
                        fontSize: "7pt",
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
                        fontSize: "7pt",
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
                {hasPerDiem ? numDays * totalPeople : "—"}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>—</td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasPerDiem ? (
                  <div>
                    <span style={{ fontWeight: "700", color: "#0f172a" }}>
                      {(dTotalEURpp * totalPeople).toFixed(2)} €
                    </span>
                    <div
                      style={{
                        fontSize: "7pt",
                        color: "#64748b",
                        fontWeight: "normal",
                        lineHeight: "1.1",
                      }}
                    >
                      ({(dTotalBGNppRounded * totalPeople).toFixed(2)} лв.)
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasAccom ? numNights * totalPeople : "—"}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>—</td>
              <td style={{ ...TD, textAlign: "center" }}>
                {(() => {
                  if (!hasAccom) return "—";
                  if (aTotalEURpp > 0) {
                    return (
                      <div>
                        <span style={{ fontWeight: "700", color: "#0f172a" }}>
                          {(aTotalEURpp * totalPeople).toFixed(2)} €
                        </span>
                        <div
                          style={{
                            fontSize: "7pt",
                            color: "#64748b",
                            fontWeight: "normal",
                            lineHeight: "1.1",
                          }}
                        >
                          ({(aTotalBGNppRounded * totalPeople).toFixed(2)} лв.)
                        </div>
                      </div>
                    );
                  }
                  return (
                    <span
                      style={{
                        fontSize: "7.5pt",
                        color: "#64748b",
                        fontWeight: "normal",
                      }}
                    >
                      (по фактура)
                    </span>
                  );
                })()}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                <div>
                  <span style={{ fontWeight: "800", color: "#0f172a" }}>
                    {grandEUR.toFixed(2)} €
                  </span>
                  <div
                    style={{
                      fontSize: "7pt",
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
          </tbody>
        </table>
        <p style={{ fontSize: "9pt", margin: "8pt 0" }}>
          <strong>Словом: </strong>
          {grandEUR > 0
            ? `${numToWordsBG(grandEUR, true)} (${numToWordsBG(grandBGN, false)})`
            : "...................."}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "16pt",
            gap: "20pt",
          }}
        >
          <div
            style={{
              flex: 1,
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "8pt",
              textAlign: "center",
              position: "relative",
            }}
          >
            <p
              style={{
                fontWeight: "600",
                fontSize: "8pt",
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
                height: "40pt",
              }}
            >
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
            <p
              style={{
                fontSize: "8pt",
                margin: 0,
                marginTop: "6pt",
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
              padding: "8pt",
              textAlign: "center",
              position: "relative",
              backgroundColor: "#f8fafc",
            }}
          >
            <p
              style={{
                fontWeight: "600",
                fontSize: "8pt",
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
                height: "40pt",
              }}
            >
              {trip.signatures?.chairman ? (
                <img
                  src={trip.signatures.chairman}
                  alt="signature"
                  style={{ height: "35pt", objectFit: "contain" }}
                />
              ) : (
                <span style={{ color: "#cbd5e1" }}>
                  ..................................
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: "8pt",
                margin: 0,
                marginTop: "6pt",
                color: "#94a3b8",
              }}
            >
              / {mol} /
            </p>
          </div>
        </div>

        {(() => {
          const nonFuelExpenses = expenses.filter(
            (e) => e.expenseType !== "fuel"
          );
          if (nonFuelExpenses.length === 0) return null;

          return (
            <div
              style={{
                marginTop: "20pt",
                fontSize: "9pt",
                borderTop: "1px dashed #cbd5e1",
                paddingTop: "10pt",
              }}
            >
              <p style={{ fontWeight: "600", marginBottom: "6pt" }}>
                Приложени разходооправдателни документи (извън гориво):
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
                if (exp.expenseType === "entry_fee" && exp.amountEUR === 0) {
                  finalExpAmount = entryEUR;
                } else if (
                  exp.expenseType === "accommodation" &&
                  exp.amountEUR === 0
                ) {
                  finalExpAmount = totalPeople * accomEUR * numNights;
                }

                return (
                  <p key={idx} style={{ margin: "2pt 0" }}>
                    {idx + 1}. {typeLabel} —{" "}
                    {exp.documentNumber
                      ? `Фактура/Бон № ${exp.documentNumber}`
                      : "Документ № ...................."}{" "}
                    от {docDate} г. на стойност {finalExpAmount} EUR
                  </p>
                );
              })}
            </div>
          );
        })()}
      </div>

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
                  „{site.shortName.toUpperCase()}"
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
            ПЪТЕН ЛИСТ — ОТЧЕТ ЗА РАЗХОД НА ГОРИВО
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
                  </span>
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
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
      <div id={`pdf-attendance-template${idSuffix}`} style={PAGE_A4}>
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
                „{site.shortName.toUpperCase()}"
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

        <div style={{ textAlign: "center", marginBottom: "16pt" }}>
          <p
            style={{
              fontWeight: "800",
              fontSize: "14pt",
              letterSpacing: "2px",
              margin: 0,
              color: "#0f172a",
            }}
          >
            С П И С Ъ К
          </p>
          <p
            style={{
              fontSize: "11pt",
              marginTop: "4pt",
              color: "#0f172a",
              fontWeight: "600",
            }}
          >
            на състезателите от „БАДМИНТОН КЛУБ ГЪЛЪБОВО“
          </p>
          <p style={{ fontSize: "11pt", marginTop: "4pt", color: "#475569" }}>
            участници на{" "}
            <strong style={{ color: "#0f172a" }}>
              {event?.title || trip.title}
            </strong>
          </p>
          <p style={{ fontSize: "11pt", marginTop: "2pt", color: "#475569" }}>
            {fmtDate(trip.startDate)} г. - {fmtDate(trip.endDate)} г. —{" "}
            {destCity}
          </p>
        </div>

        <div style={{ marginBottom: "16pt", lineHeight: "1.6" }}>
          <p>
            <strong>Организатор:</strong>{" "}
            {trip.organizer ||
              "..............................................."}
          </p>
          <p>
            <strong>Клуб домакин:</strong>{" "}
            {trip.hostClub || "..............................................."}
          </p>
        </div>

        <p
          style={{
            fontWeight: "700",
            fontSize: "11pt",
            marginBottom: "8pt",
            color: "#0f172a",
          }}
        >
          СПИСЪК НА УЧАСТНИЦИТЕ
        </p>

        <div
          style={{ marginBottom: "20pt", lineHeight: "1.8", fontSize: "11pt" }}
        >
          {allPeople
            .filter((p) => p.role !== "Треньор" && p.role !== "Ръководител")
            .map((p, i) => (
              <p key={i} style={{ margin: "4pt 0" }}>
                {i + 1}. {p.name}
              </p>
            ))}
        </div>

        <div style={{ marginBottom: "20pt" }}>
          <p
            style={{
              fontWeight: "700",
              fontSize: "10pt",
              marginBottom: "8pt",
              color: "#0f172a",
            }}
          >
            УДОСТОВЕРЕНИЕ ОТ РЪКОВОДИТЕЛЯ НА ГРУПАТА
          </p>
          <p style={{ margin: "4pt 0" }}>
            Общ брой присъствали лица: <strong>{totalPeople}</strong>
          </p>
          <p style={{ margin: "4pt 0" }}>от които:</p>
          <ul style={{ margin: "4pt 0 4pt 20pt", padding: 0 }}>
            <li>
              Треньорски състав / Ръководители:{" "}
              <strong>
                {
                  allPeople.filter(
                    (p) => p.role === "Треньор" || p.role === "Ръководител"
                  ).length
                }
              </strong>
            </li>
            <li>
              Състезатели:{" "}
              <strong>
                {allPeople.filter((p) => p.role === "Състезател").length}
              </strong>
            </li>
          </ul>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "30pt",
          }}
        >
          <div>
            <p style={{ margin: "0 0 4pt 0" }}>
              Дата: {fmtDate(trip.startDate || trip.endDate)} г.
            </p>
            <p style={{ margin: 0 }}>гр. Гълъбово</p>
            <div style={{ marginTop: "16pt" }}>
              <p style={{ margin: "0 0 4pt 0", fontWeight: "600" }}>
                Ръководител на групата / Треньор:
              </p>
              <p style={{ margin: "0 0 20pt 0" }}>Име и фамилия: {coachName}</p>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <span style={{ marginRight: "10pt" }}>Подпис:</span>
                {trip.signatures?.coach ? (
                  <img
                    src={trip.signatures.coach}
                    alt="signature"
                    style={{ height: "40pt", objectFit: "contain" }}
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
              paddingLeft: "20pt",
            }}
          >
            <p style={{ margin: "0 0 10pt 0", fontWeight: "600" }}>
              Главен съдия / Клуб Домакин / или Организатор:
            </p>
            <p style={{ margin: "0 0 12pt 0" }}>
              Дата: {fmtDate(trip.startDate || trip.endDate)} г.
            </p>
            <p style={{ margin: "0 0 20pt 0" }}>
              Подпис: ............................................
            </p>
            <p style={{ margin: "0 0 4pt 0" }}>
              Печат: ............................................
            </p>
            <p style={{ margin: 0, fontSize: "8pt", color: "#64748b" }}>
              (печат се поставя само ако се подписва от{" "}
              {trip.hostClub || "клуба домакин"} или представител на{" "}
              {trip.organizer || "организацията"}. При подпис от гл.съдия -
              печат не се изисква.)
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DOC 5: ДОКЛАД ЗА ИЗВЪРШЕНАТА РАБОТА (REPORT)
      ══════════════════════════════════════════════════════ */}
      <div id={`pdf-report-template${idSuffix}`} style={PAGE_A4}>
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
                „{site.shortName.toUpperCase()}“
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

          <div style={{ textAlign: "right", fontSize: "9pt" }}>
            <p style={{ margin: 0, fontWeight: "700", color: "#0f172a" }}>
              УТВЪРЖДАВАМ:
            </p>
            <p style={{ margin: "2pt 0" }}>
              Председател на УС: ....................
            </p>
            <p style={{ margin: "1pt 0", color: "#64748b" }}>
              / {site.contact.mol || "М. Георгиева"} /
            </p>
            <p style={{ margin: "2pt 0" }}>
              Дата: {fmtDate(trip.endDate || trip.startDate)} г.
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "14pt" }}>
          <p
            style={{
              fontWeight: "800",
              fontSize: "14pt",
              letterSpacing: "2px",
              margin: 0,
              color: "#0f172a",
            }}
          >
            Д О К Л А Д
          </p>
          <p
            style={{
              fontSize: "11pt",
              marginTop: "4pt",
              color: "#0f172a",
              fontWeight: "700",
            }}
          >
            ЗА ИЗВЪРШЕНАТА РАБОТА И СПОРТНИ РЕЗУЛТАТИ
          </p>
          <p style={{ fontSize: "9pt", color: "#64748b", marginTop: "2pt" }}>
            (съгласно Наредбата за командировките в страната)
          </p>
        </div>

        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "4pt",
            padding: "8pt 12pt",
            marginBottom: "14pt",
            fontSize: "9pt",
            lineHeight: "1.5",
          }}
        >
          <p style={{ margin: "2pt 0" }}>
            <strong>ОТ:</strong> {coachName} — {coachRole}
          </p>
          <p style={{ margin: "2pt 0" }}>
            <strong>ОТНОСНО:</strong> Командировка за участие в:{" "}
            <strong>{trip.title}</strong>
          </p>
          <p style={{ margin: "2pt 0" }}>
            <strong>НА ОСНОВАНИЕ:</strong> Заповед № <strong>{orderNum}</strong>{" "}
            от {orderDate} г. и Решение на УС{" "}
            <strong>{getDecisionHeader()}</strong>
          </p>
          <p style={{ margin: "2pt 0" }}>
            <strong>МЯСТО И ПЕРИОД:</strong> {destCity} (
            {fmtDate(trip.startDate)} г. — {fmtDate(trip.endDate)} г.)
          </p>
        </div>

        <div
          style={{
            fontSize: "10pt",
            lineHeight: "1.6",
            textAlign: "justify",
            whiteSpace: "pre-line",
            minHeight: "340pt",
            color: "#1e293b",
          }}
        >
          {trip.reportText?.trim() ||
            `1. ПРОВЕЖДАНЕ И ОФИЦИАЛНО УЧАСТИЕ:
В периода от ${fmtDate(trip.startDate)} г. до ${fmtDate(trip.endDate)} г. отборът на „${site.name}“ взе участие в ${trip.title}, проведено в ${destCity}. В състезанието участваха ${allPeople.filter((p) => p.role !== "Треньор" && p.role !== "Ръководител").length} състезатели под ръководството на ${coachName} (${coachRole}).

2. ПОСТИГНАТИ РЕЗУЛТАТИ И СПОРТНО-ТЕХНИЧЕСКА ОЦЕНКА:
Състезателите (${
              allPeople
                .filter((p) => p.role !== "Треньор" && p.role !== "Ръководител")
                .map((p) => p.name)
                .join(", ") || "състезателите на клуба"
            }) взеха участие в предвидените дисциплини съгласно календара на БФ Бадминтон. Показаха висок спортен дух, отборен синхрон и отлична дисциплина. Поставените цели за спортно-техническо представяне бяха изпълнени.

3. ПРЕСТОЙ, НАСТАНЯВАНЕ И ТРАНСПОРТ:
Пътуването и престоят се осъществиха съгласно утвърдените финансови и организационни параметри. 
(Забележка при съкращаване на престоя: ако състезателите са отпаднали на втори ден и престоят е съкратен, напр.: „Състезателите приключиха участие в турнира на втория ден (${fmtDate(trip.endDate)} г.), поради което отборът се завърна същия ден. Ползвана е 1 нощувка вместо планираните 2.“)

4. ЗАКЛЮЧЕНИЕ И ПРИЛОЖЕНИЯ:
Възложените задачи със Заповед за командировка № ${orderNum} са изпълнени. Към настоящия доклад се прилагат следните отчетни документи:${trip.attachMatchProtocols ? "\n• Официални съдийски протоколи от изиграните срещи на състезателите;" : ""}
• Присъствен списък / удостоверение за присъствие, заверено от главния съдия/домакина;
• Финансова ведомост за изплатени средства;
• Разходооправдателни документи (фактури за нощувки и разходи).
Настоящият доклад се представя в законоустановения 3-дневен срок съгласно Наредбата за командировките в страната.`}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: "30pt",
          }}
        >
          <div>
            <p style={{ margin: "0 0 4pt 0" }}>
              Дата: {fmtDate(trip.endDate || trip.startDate)} г.
            </p>
            <p style={{ margin: 0 }}>гр. Гълъбово</p>
          </div>

          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0 0 4pt 0", fontWeight: "600" }}>
              Докладчик (Командировано лице):
            </p>
            <p style={{ margin: "0 0 10pt 0" }}>{coachName}</p>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
              }}
            >
              <span style={{ marginRight: "10pt" }}>Подпис:</span>
              {trip.signatures?.coach ? (
                <img
                  src={trip.signatures.coach}
                  alt="signature"
                  style={{ height: "35pt", objectFit: "contain" }}
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
    </div>
  );
}
