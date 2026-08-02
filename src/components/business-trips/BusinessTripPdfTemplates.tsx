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
  event: ScheduleEvent;
  membersDict: Record<string, Member>;
  expenses: TripExpense[];
  showBgn?: boolean;
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
}: BusinessTripPdfTemplatesProps) {
  if (!trip || !event) return null;

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
  const numDays = Math.max(1, differenceInCalendarDays(endD, startD) + 1);
  const numNights = Math.max(0, differenceInCalendarDays(endD, startD));

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
    )[event?.type] || "";
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
  const hasAccom = (accomEUR > 0 && numNights > 0) || actualAccomTotalEUR > 0;

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
  const destCity = trip.destination || "___________";
  const routeLabel = `Гълъбово — ${destCity} — Гълъбово`;

  const transportShort: Record<string, string> = {
    club_paid: "Клубен транспорт",
    free: "Безплатен (организиран)",
    fuel_only: trip.vehicle?.brand
      ? `Лично МПС ${trip.vehicle.brand}`
      : "Лично МПС",
    public: "Обществен транспорт",
  };
  const tShort = transportShort[trip.transportType] ?? trip.transportType;

  const secs = [
    hasPerDiem && "diem",
    "transport",
    hasAccom && "accom",
    "entry",
  ].filter(Boolean);
  const sn = (s: string) => secs.indexOf(s) + 1;
  const mol = site.contact.mol || "М. Георгиева";

  return (
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <div id="pdf-order-template" style={PAGE_A4}>
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
          На основание Наредбата за командировките в страната и Държавния
          спортен календар на Б Ф Бадминтон,
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
            <strong>{perDiemBGN.toFixed(2)} лв.</strong> ({fmtEUR(perDiemEUR)})
            за <strong>{numDays}</strong> {numDays === 1 ? "ден" : "дни"}.
          </p>
        )}
        {hasFuel ? (
          <p style={{ marginBottom: "4pt" }}>
            {sn("transport")}. Пътуването да се извърши с: лек автомобил
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;а/ лично МПС, вид лек, марка{" "}
            <strong>{trip.vehicle?.brand || "неопределена"}</strong>, рег. №{" "}
            <strong>{trip.vehicle?.regNumber || "неопределен"}</strong>, с
            разход на <strong>{fuelNorm > 0 ? fuelNorm : "0"} л/100 км.</strong>{" "}
            (срещу фактура)
          </p>
        ) : (
          <p style={{ marginBottom: "4pt" }}>
            {sn("transport")}. Пътуването да се извърши с:{" "}
            <strong>{tShort}</strong> (срещу фактура или билет).
          </p>
        )}
        {hasAccom && (
          <p style={{ marginBottom: "4pt" }}>
            {sn("accom")}. Нощувки — <strong>{totalPeople}</strong>{" "}
            {totalPeople === 1 ? "човек" : "човека"}{" "}
            {trip.financials.accommodationRateEUR > 0 ? (
              <>
                по <strong>{accomBGN.toFixed(2)} лв.</strong> (
                {fmtEUR(accomEUR)}) (срещу фактура){" "}
              </>
            ) : (
              <>(срещу фактура) </>
            )}{" "}
            за <strong>{numNights}</strong> {numNights === 1 ? "нощ" : "нощи"}.
          </p>
        )}
        <p style={{ marginBottom: "4pt" }}>
          {sn("entry")}. Входни такси за участие (срещу фактура, ако има).
        </p>
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
      <div id="pdf-statement-template" style={PAGE_LAND}>
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
              src="/logo.png"
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
              <strong style={{ color: "#0f172a" }}>{event.title}</strong>
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
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "10pt",
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
                Пътни пари
              </th>
              <th colSpan={3} style={TH}>
                Дневни пари
              </th>
              <th colSpan={3} style={TH}>
                Кв. пари
              </th>
              <th rowSpan={2} style={{ ...TH, width: "65pt" }}>
                Общо
              </th>
              <th rowSpan={2} style={{ ...TH, width: "48pt" }}>
                Подпис
              </th>
            </tr>
            <tr>
              <th style={{ ...TH, width: "28pt" }}>отиване</th>
              <th style={{ ...TH, width: "28pt" }}>връщане</th>
              <th style={{ ...TH, width: "22pt" }}>дни</th>
              <th style={{ ...TH, width: "38pt" }}>за 1 ден</th>
              <th style={{ ...TH, width: "42pt" }}>сума</th>
              <th style={{ ...TH, width: "22pt" }}>нощ</th>
              <th style={{ ...TH, width: "38pt" }}>за 1 нощ</th>
              <th style={{ ...TH, width: "42pt" }}>сума</th>
            </tr>
          </thead>
          <tbody>
            {allPeople.map((p, i) => (
              <tr key={i}>
                <td style={{ ...TD, textAlign: "center" }}>{i + 1}.</td>
                <td style={TD}>{p.name}</td>
                <td style={{ ...TD, textAlign: "center" }}>{p.role}</td>
                <td style={{ ...TD, textAlign: "center" }}>{routeLabel}</td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {i === 0 && transportTotalBGN > 0
                    ? (transportTotalBGN / 2).toFixed(2)
                    : ""}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {i === 0 && transportTotalBGN > 0
                    ? (transportTotalBGN / 2).toFixed(2)
                    : ""}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {hasPerDiem ? numDays : "—"}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {hasPerDiem ? `${perDiemBGN.toFixed(2)} лв.` : "—"}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {hasPerDiem ? `${dTotalBGNppRounded.toFixed(2)} лв.` : "—"}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {hasAccom ? numNights : "—"}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {hasAccom
                    ? `${(aTotalBGNppRounded / (numNights || 1)).toFixed(2)} лв.`
                    : "—"}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {hasAccom ? `${aTotalBGNppRounded.toFixed(2)} лв.` : "—"}
                </td>
                <td style={{ ...TD, textAlign: "center", fontWeight: "bold" }}>
                  {(
                    ppTotalBGNRounded + (i === 0 ? transportTotalBGN : 0)
                  ).toFixed(2)}{" "}
                  лв.
                </td>
                <td style={TD}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: "9pt" }}>
          <strong>Словом: </strong>
          {grandBGN > 0
            ? `${numToWordsBG(grandBGN, false)} (${numToWordsBG(grandEUR, true)})`
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
        <div id="pdf-fuel-report-template" style={PAGE_LAND}>
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
              fontSize: "16pt",
              letterSpacing: "4px",
              marginBottom: "4pt",
              color: "#0f172a",
            }}
          >
            ОТЧЕТ
          </p>
          <p
            style={{
              textAlign: "center",
              fontSize: "11pt",
              margin: "0 0 10pt 0",
              color: "#475569",
            }}
          >
            към Нареждане № {orderNum} от {orderDate} г.
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
                  Единична цена за 1 л в лв. и (EUR)
                </th>
                <th style={{ ...TH, width: "70pt" }}>
                  За изплащане лв. и (EUR)
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
                  {avgPricePerLiterBGN > 0
                    ? `${avgPricePerLiterBGN.toFixed(2)} лв. (€${avgPricePerLiterEUR.toFixed(2)})`
                    : ""}
                </td>
                <td style={{ ...TD, textAlign: "center", fontWeight: "bold" }}>
                  {finalFuelBGN > 0
                    ? `${finalFuelBGN.toFixed(2)} лв. (€${finalFuelEUR.toFixed(2)})`
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
                  {finalFuelBGN > 0
                    ? `${finalFuelBGN.toFixed(2)} лв. (€${finalFuelEUR.toFixed(2)})`
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
      <div id="pdf-attendance-template" style={PAGE_A4}>
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
              {event.title || trip.title}
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
          📝 СПИСЪК НА УЧАСТНИЦИТЕ
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
              <th style={{ ...TH, width: "24pt" }}>№</th>
              <th style={{ ...TH, textAlign: "left" }}>
                Три имена на участника
              </th>
              <th style={{ ...TH, width: "100pt" }}>Длъжност / Роля</th>
              <th style={{ ...TH, width: "120pt" }}>
                Възрастова група / Категория
              </th>
            </tr>
          </thead>
          <tbody>
            {allPeople.map((p, i) => (
              <tr key={i}>
                <td style={{ ...TD, textAlign: "center" }}>{i + 1}.</td>
                <td style={{ ...TD, fontWeight: "500" }}>{p.name}</td>
                <td style={{ ...TD, textAlign: "center" }}>{p.role}</td>
                <td style={{ ...TD, textAlign: "center", color: "#64748b" }}>
                  {p.role === "Треньор" || p.role === "Ръководител"
                    ? "—"
                    : "...................."}
                </td>
              </tr>
            ))}
            {/* Добавяме празни редове, ако участниците са по-малко от 5, за да изглежда като бланка */}
            {Array.from({ length: Math.max(0, 5 - allPeople.length) }).map(
              (_, i) => (
                <tr key={`empty-${i}`}>
                  <td style={{ ...TD, textAlign: "center" }}>
                    {allPeople.length + i + 1}.
                  </td>
                  <td style={TD}>&nbsp;</td>
                  <td style={TD}>&nbsp;</td>
                  <td style={TD}>&nbsp;</td>
                </tr>
              )
            )}
          </tbody>
        </table>

        <div
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "12pt",
            backgroundColor: "#f8fafc",
            marginBottom: "20pt",
          }}
        >
          <p
            style={{
              fontWeight: "700",
              fontSize: "10pt",
              marginBottom: "8pt",
              color: "#0f172a",
            }}
          >
            🛡️ УДОСТОВЕРЕНИЕ ОТ РЪКОВОДИТЕЛЯ НА ГРУПАТА
          </p>
          <p style={{ margin: "4pt 0" }}>
            Общ брой присъствали лица: <strong>{totalPeople}</strong> (буквом:{" "}
            {numToWordsBG(totalPeople, false).replace(" лева", "")})
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
              </strong>{" "}
              бр.
            </li>
            <li>
              Състезатели:{" "}
              <strong>
                {allPeople.filter((p) => p.role === "Състезател").length}
              </strong>{" "}
              бр.
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
              Дата: {fmtDate(trip.endDate || trip.startDate)} г.
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
            <p style={{ margin: "0 0 4pt 0", fontWeight: "600" }}>
              Главен съдия / Организатор на турнира:
            </p>
            <p
              style={{
                margin: "0 0 16pt 0",
                fontSize: "8pt",
                color: "#64748b",
              }}
            >
              (опционално – за потвърждение от федерацията/домакина)
            </p>
            <p style={{ margin: "0 0 20pt 0" }}>
              Подпис: ............................................
            </p>
            <p style={{ margin: 0 }}>
              Печат: ............................................
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
