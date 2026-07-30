"use client";
/* eslint-disable react/forbid-dom-props */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */

import { differenceInCalendarDays, format } from "date-fns";
import { bg } from "date-fns/locale";
import React from "react";

import { getSiteConfig } from "@/config/sites";
import { BusinessTrip } from "@/types/business-trip.types";
import { ScheduleEvent } from "@/types/index";
import { Member } from "@/types/member.types";
import { Tournament, TournamentEntry } from "@/types/tournament.types";

interface BusinessTripPdfTemplatesProps {
  trip: BusinessTrip | null;
  tournament: Tournament | null;
  event: ScheduleEvent | null;
  entries: TournamentEntry[];
  membersDict: Record<string, Member>;
  showBgn: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EUR_BGN = 1.95583;

// ─── Currency helpers ─────────────────────────────────────────────────────────
const fmtEUR = (eur: number) => `€${eur.toFixed(2)}`;
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
    if (o !== 0) {
      return `${tensStr} и ${_ones[o]}`;
    }
    return tensStr;
  }
  if (n < 1000) {
    const r = n % 100;
    const hundStr = _hund[Math.floor(n / 100)];
    if (r !== 0) {
      return `${hundStr} ${convertNumberToWords(r)}`;
    }
    return hundStr;
  }
  const th = Math.floor(n / 1000);
  const r = n % 1000;
  let ts = `${convertNumberToWords(th)} хиляди`;
  if (th === 1) ts = "хиляда";
  else if (th === 2) ts = "две хиляди";
  if (r !== 0) {
    return `${ts} ${convertNumberToWords(r)}`;
  }
  return ts;
}

function numToWordsBG(amount: number): string {
  if (amount <= 0) return "нула лева";
  const i = Math.floor(amount);
  const c = Math.round((amount - i) * 100);
  const w = convertNumberToWords(i) || "нула";
  const bw = i === 1 ? "лев" : "лева";
  if (c === 0) {
    return `${w} ${bw}`;
  }
  return `${w} ${bw} и ${c} стотинки`;
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const PAGE_A4: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  fontFamily: "Times New Roman,Times,serif",
  fontSize: "11pt",
  lineHeight: 1.6,
  color: "#000",
  backgroundColor: "#fff",
  padding: "18mm 18mm 18mm 22mm",
  boxSizing: "border-box",
};
const PAGE_LAND: React.CSSProperties = {
  width: "297mm",
  minHeight: "210mm",
  fontFamily: "Times New Roman,Times,serif",
  fontSize: "9pt",
  lineHeight: 1.4,
  color: "#000",
  backgroundColor: "#fff",
  padding: "12mm 10mm 12mm 12mm",
  boxSizing: "border-box",
};
const TH: React.CSSProperties = {
  border: "1px solid #000",
  padding: "3px 4px",
  textAlign: "center",
  fontWeight: "bold",
  verticalAlign: "middle",
  fontSize: "8pt",
};
const TD: React.CSSProperties = {
  border: "1px solid #000",
  padding: "3px 4px",
  verticalAlign: "middle",
  fontSize: "8pt",
};

// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line sonarjs/cognitive-complexity
export function BusinessTripPdfTemplates({
  trip,
  event,
  membersDict,
}: BusinessTripPdfTemplatesProps) {
  if (!trip || !event) return null;

  const site = getSiteConfig();

  // People
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
    { name: coachName, role: coachRole },
    ...partMembers.map((m) => ({
      name: `${m.firstName} ${m.lastName}`,
      role: m.isCoach ? "Треньор" : "Състезател",
    })),
  ];
  const totalPeople = allPeople.length;

  // Dates
  const fmtDate = (d?: string) => {
    if (!d) {
      return "—";
    }
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
  const yearStr = format(startD, "yyyy");

  // Financials
  const perDiemEUR = roundEUR(
    trip.financials.perDiemOverrideEUR || trip.financials.perDiemRateEUR
  );
  const perDiemBGN = eurToBgn(perDiemEUR);
  const hasPerDiem = perDiemEUR > 0;
  const accomEUR = trip.financials.accommodationRateEUR ?? 0;
  const accomBGN = eurToBgn(accomEUR);
  const hasAccom = accomEUR > 0 && numNights > 0;
  const hasFuel = trip.transportType === "fuel_only";
  const fuelNorm = trip.vehicle?.fuelNorm ?? 0;
  const distKm = trip.vehicle?.distanceKm ?? 0;
  const totalLiters =
    distKm > 0 && fuelNorm > 0 ? (distKm / 100) * fuelNorm : 0;

  const dTotalEURpp = perDiemEUR * numDays;
  const dTotalBGNpp = eurToBgn(dTotalEURpp);
  const aTotalEURpp = accomEUR * numNights;
  const aTotalBGNpp = eurToBgn(aTotalEURpp);
  const entryEUR = trip.financials.entryFeeEUR ?? 0;
  const hasEntryFee = entryEUR > 0;

  const ppTotalEUR = dTotalEURpp + aTotalEURpp + entryEUR;
  const ppTotalBGN = eurToBgn(ppTotalEUR);
  const grandEUR = totalPeople * ppTotalEUR;
  const grandBGN = eurToBgn(grandEUR);

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

  // Section numbering for НАРЕЖДАНЕ
  const secs: string[] = [];
  if (hasPerDiem) secs.push("diem");
  secs.push("transport");
  if (hasAccom) secs.push("accom");
  if (hasEntryFee) secs.push("entry");
  const sn = (s: string) => secs.indexOf(s) + 1;

  const mol = site.contact.mol || "М. Георгиева";

  return (
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      {/* ══════════════════════════════════════════════════════
          DOC 1: НАРЕЖДАНЕ ЗА КОМАНДИРОВКА
      ══════════════════════════════════════════════════════ */}
      <div id="pdf-order-template" style={PAGE_A4}>
        <div style={{ textAlign: "center", marginBottom: "10pt" }}>
          <p style={{ fontWeight: "bold", fontSize: "14pt" }}>
            „{site.shortName.toUpperCase()}"
          </p>
          {site.bulstat && (
            <p style={{ fontSize: "9pt" }}>
              БУЛСТАТ: {site.bulstat} | {site.contact.address}
            </p>
          )}
        </div>

        <div style={{ textAlign: "center", marginBottom: "16pt" }}>
          <p
            style={{
              fontWeight: "bold",
              fontSize: "13pt",
              letterSpacing: "5px",
            }}
          >
            Н А Р Е Ж Д А Н Е
          </p>
          <p style={{ fontSize: "12pt" }}>
            № {orderNum} / {orderDate} г.
          </p>
        </div>

        <p style={{ marginBottom: "10pt" }}>
          На основание Наредбата за командировките в страната и Държавния
          спортен календар на Б Ф Бадминтон,
        </p>

        <p
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "13pt",
            marginBottom: "12pt",
            letterSpacing: "3px",
          }}
        >
          К О М А Н Д И Р О В А М:
        </p>

        <p style={{ marginBottom: "4pt" }}>
          До гр. <strong>{destCity}</strong> и обратно на
        </p>
        <div
          style={{
            borderTop: "1px solid #000",
            borderBottom: "1px solid #000",
            padding: "2pt 0",
            marginBottom: "4pt",
          }}
        >
          <p style={{ textAlign: "center", fontSize: "10pt" }}>
            следните служебни лица:
          </p>
        </div>

        <div
          style={{ marginLeft: "24pt", marginBottom: "18pt", marginTop: "6pt" }}
        >
          {allPeople.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "5pt",
              }}
            >
              <span>
                {i + 1}.&nbsp;&nbsp;{p.name}
              </span>
              <span style={{ minWidth: "90pt" }}>— {p.role.toLowerCase()}</span>
            </div>
          ))}
        </div>

        <p style={{ marginBottom: "10pt" }}>
          На групата от <strong>{totalPeople}</strong> / ........... / човека да
          се осигурят средства, както следва:
        </p>

        {hasPerDiem && (
          <p style={{ marginBottom: "8pt" }}>
            {sn("diem")}. Дневни на <strong>{totalPeople}</strong> / ...........
            / човека по <strong>{perDiemBGN.toFixed(2)}</strong> /
            ............... / лв. ({fmtEUR(perDiemEUR)}) за{" "}
            <strong>{numDays}</strong> / .......... / дни.
          </p>
        )}

        {hasFuel ? (
          <p style={{ marginBottom: "8pt" }}>
            {sn("transport")}. Пътуването да се извърши с: лек автомобил
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;а/ лично МПС, вид лек, марка{" "}
            <strong>{trip.vehicle?.brand || "........................"}</strong>
            , рег. №{" "}
            <strong>
              {trip.vehicle?.regNumber || "........................"}
            </strong>
            , с разход на <strong>{fuelNorm > 0 ? fuelNorm : "......."}</strong>{" "}
            л/100 км., с цена ......... лв. / л.
          </p>
        ) : (
          <p style={{ marginBottom: "8pt" }}>
            {sn("transport")}. Пътуването да се извърши с:{" "}
            <strong>{tShort}</strong>.
          </p>
        )}

        {hasAccom && (
          <p style={{ marginBottom: "8pt" }}>
            {sn("accom")}. Нощувки — <strong>{totalPeople}</strong> / .........
            / човека по <strong>{accomBGN.toFixed(2)}</strong> / ............. /
            лв. ({fmtEUR(accomEUR)}) за <strong>{numNights}</strong> /
            ........... / нощи.
          </p>
        )}

        {trip.financials.entryFeeEUR ? (
          <p style={{ marginBottom: "8pt" }}>
            {sn("entry")}. Входни такси за участие —{" "}
            <strong>{eurToBgn(trip.financials.entryFeeEUR).toFixed(2)}</strong>{" "}
            / ............. / лв. ({fmtEUR(trip.financials.entryFeeEUR)}).
          </p>
        ) : (
          <p style={{ marginBottom: "8pt" }}>
            {sn("entry")}. Входни такси за участие (ако има).
          </p>
        )}

        <p style={{ marginTop: "14pt", marginBottom: "20pt" }}>
          Разходите за командировката са за сметка на „{site.shortName}" гр.
          Гълъбово.
        </p>

        <div style={{ textAlign: "center", marginTop: "30pt" }}>
          <p style={{ fontWeight: "bold" }}>ПРЕДСЕДАТЕЛ:</p>
          {trip.signatures?.chairman ? (
            <img
              src={trip.signatures.chairman}
              alt="signature"
              style={{ height: "40pt", marginTop: "4pt" }}
            />
          ) : (
            <p>/ {mol} /</p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DOC 2: ВЕДОМОСТ (landscape A4)
      ══════════════════════════════════════════════════════ */}
      <div id="pdf-statement-template" style={PAGE_LAND}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "6pt",
          }}
        >
          <div>
            <p style={{ fontWeight: "bold", fontSize: "11pt" }}>
              „{site.shortName.toUpperCase()}"&nbsp;&nbsp; гр. ГЪЛЪБОВО
            </p>
          </div>
          <div
            style={{ textAlign: "right", fontSize: "8pt", maxWidth: "200pt" }}
          >
            <p>
              Спортна проява: <strong>{event.title}</strong>
            </p>
            <p>
              Състояла се на {fmtDate(trip.startDate)} г. до{" "}
              {fmtDate(trip.endDate)} г. в гр. {destCity}
            </p>
            <p>
              Нареждане № {orderNum} от {orderDate} г.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: "6pt" }}>
          <p
            style={{
              fontWeight: "bold",
              fontSize: "13pt",
              letterSpacing: "3px",
            }}
          >
            В Е Д О М О С Т
          </p>
          <p style={{ fontSize: "9pt" }}>за командировъчни пари</p>
          <p style={{ fontSize: "9pt" }}>
            изплатени за времето от {fmtDate(trip.startDate)} г. до{" "}
            {fmtDate(trip.endDate)} г.
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
                Име, презиме и фамилия
              </th>
              <th rowSpan={2} style={{ ...TH, width: "48pt" }}>
                Длъжност
              </th>
              <th rowSpan={2} style={{ ...TH, width: "65pt" }}>
                Маршрут на пътуването
              </th>
              <th rowSpan={2} style={{ ...TH, width: "52pt" }}>
                Превозно средство
              </th>
              <th colSpan={2} style={TH}>
                Пътни пари лв. и (EUR)
              </th>
              <th colSpan={3} style={TH}>
                Дневни пари
              </th>
              <th colSpan={2} style={TH}>
                Кв. пари
              </th>
              <th rowSpan={2} style={{ ...TH, width: "52pt" }}>
                Обща сума за получаване лв. и (EUR)
              </th>
              <th rowSpan={2} style={{ ...TH, width: "48pt" }}>
                Подпис на получателя
              </th>
            </tr>
            <tr>
              <th style={{ ...TH, width: "28pt" }}>за отиване</th>
              <th style={{ ...TH, width: "28pt" }}>за връщане</th>
              <th style={{ ...TH, width: "22pt" }}>брой дни</th>
              <th style={{ ...TH, width: "38pt" }}>за 1 ден лв.(EUR)</th>
              <th style={{ ...TH, width: "42pt" }}>сума лв.(EUR)</th>
              <th style={{ ...TH, width: "22pt" }}>брой нощ.</th>
              <th style={{ ...TH, width: "42pt" }}>сума лв.(EUR)</th>
            </tr>
          </thead>
          <tbody>
            {allPeople.map((p, i) => (
              <tr key={i}>
                <td style={{ ...TD, textAlign: "center" }}>{i + 1}.</td>
                <td style={TD}>{p.name}</td>
                <td style={{ ...TD, textAlign: "center" }}>{p.role}</td>
                <td style={{ ...TD, textAlign: "center", fontSize: "7pt" }}>
                  {routeLabel}
                </td>
                <td style={{ ...TD, textAlign: "center", fontSize: "7pt" }}>
                  {tShort}
                </td>
                <td style={{ ...TD, textAlign: "center" }}></td>
                <td style={{ ...TD, textAlign: "center" }}></td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {hasPerDiem ? numDays : "—"}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {hasPerDiem
                    ? `${perDiemBGN.toFixed(2)} (${fmtEUR(perDiemEUR)})`
                    : "—"}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {hasPerDiem
                    ? `${dTotalBGNpp.toFixed(2)} (€${dTotalEURpp.toFixed(2)})`
                    : "—"}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {hasAccom ? numNights : "—"}
                </td>
                <td style={{ ...TD, textAlign: "center" }}>
                  {hasAccom
                    ? `${aTotalBGNpp.toFixed(2)} (€${aTotalEURpp.toFixed(2)})`
                    : "—"}
                </td>
                <td style={{ ...TD, textAlign: "center", fontWeight: "bold" }}>
                  {ppTotalBGN > 0
                    ? `${ppTotalBGN.toFixed(2)} лв. (€${ppTotalEUR.toFixed(2)})`
                    : "—"}
                </td>
                <td style={TD}>&nbsp;</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 15 - allPeople.length) }).map(
              (_, i) => (
                <tr key={`e${i}`}>
                  <td style={{ ...TD, textAlign: "center" }}>
                    {allPeople.length + i + 1}.
                  </td>
                  {Array.from({ length: 13 }).map((__, j) => (
                    <td key={j} style={{ ...TD, height: "14pt" }}>
                      &nbsp;
                    </td>
                  ))}
                </tr>
              )
            )}
            <tr style={{ fontWeight: "bold" }}>
              <td
                colSpan={4}
                style={{ ...TD, textAlign: "center", fontWeight: "bold" }}
              >
                Всичко:
              </td>
              <td style={TD}></td>
              <td style={TD}></td>
              <td style={TD}></td>
              <td style={TD}></td>
              <td style={TD}></td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasPerDiem && grandBGN > 0
                  ? `${(totalPeople * dTotalBGNpp).toFixed(2)} (€${(totalPeople * dTotalEURpp).toFixed(2)})`
                  : ""}
              </td>
              <td style={TD}></td>
              <td style={{ ...TD, textAlign: "center" }}>
                {hasAccom && grandBGN > 0
                  ? `${(totalPeople * aTotalBGNpp).toFixed(2)} (€${(totalPeople * aTotalEURpp).toFixed(2)})`
                  : ""}
              </td>
              <td style={{ ...TD, textAlign: "center" }}>
                {grandBGN > 0
                  ? `${grandBGN.toFixed(2)} лв. (€${grandEUR.toFixed(2)})`
                  : ""}
              </td>
              <td style={TD}></td>
            </tr>
          </tbody>
        </table>

        <p style={{ fontSize: "9pt", marginBottom: "8pt" }}>
          <strong>Словом: </strong>
          {grandBGN > 0
            ? `${numToWordsBG(grandBGN)} (${fmtEUR(grandEUR)})`
            : ".............................................................................................."}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "16pt",
            fontSize: "9pt",
          }}
        >
          <div>
            <p>Изготвил: .................................</p>
            <p style={{ fontSize: "8pt" }}>/ длъжност, име и фамилия /</p>
          </div>
          <div>
            <p>Изплатил (Председател):</p>
            {trip.signatures?.chairman ? (
              <img
                src={trip.signatures.chairman}
                alt="signature"
                style={{ height: "30pt" }}
              />
            ) : (
              <p>.................................</p>
            )}
          </div>
          <div>
            <p>Получил (Командирован):</p>
            {trip.signatures?.coach ? (
              <img
                src={trip.signatures.coach}
                alt="signature"
                style={{ height: "30pt" }}
              />
            ) : (
              <p>.................................</p>
            )}
          </div>
        </div>
        <p style={{ marginTop: "10pt", fontSize: "9pt" }}>
          гр. Гълъбово &nbsp;&nbsp;&nbsp; {fmtDate(trip.endDate)} г.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          DOC 3: ОТЧЕТ ЗА ГОРИВО (само за fuel_only)
      ══════════════════════════════════════════════════════ */}
      {hasFuel && (
        <div id="pdf-fuel-report-template" style={PAGE_A4}>
          <div style={{ textAlign: "center", marginBottom: "10pt" }}>
            <p style={{ fontWeight: "bold", fontSize: "14pt" }}>
              „{site.shortName.toUpperCase()}"
            </p>
          </div>
          <div
            style={{
              textAlign: "right",
              marginBottom: "14pt",
              fontSize: "11pt",
            }}
          >
            <p>Одобрявам</p>
            <p>Председател:</p>
            {trip.signatures?.chairman ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "4pt",
                }}
              >
                <img
                  src={trip.signatures.chairman}
                  alt="signature"
                  style={{ height: "40pt" }}
                />
              </div>
            ) : (
              <p>/ {mol} /</p>
            )}
          </div>
          <p
            style={{
              textAlign: "center",
              letterSpacing: "3px",
              fontWeight: "bold",
              marginBottom: "6pt",
            }}
          >
            О Т Ч Е Т за м. {format(startD, "MMMM yyyy", { locale: bg })} г.
          </p>
          <p style={{ marginBottom: "4pt" }}>
            От <strong>{coachName}</strong>,&nbsp; длъжност{" "}
            <strong>{coachRole}</strong>
          </p>
          <p style={{ marginBottom: "18pt" }}>
            За разход на бензин А-.......... / дизелово гориво, газ / за личен
            лек автомобил, марка/ модел{" "}
            <strong>{trip.vehicle?.brand || "........................"}</strong>
            ,&nbsp; рег. №{" "}
            <strong>
              {trip.vehicle?.regNumber || "........................"}
            </strong>
            , използван за служебни цели — състезания, лагер-сборове, тренировки
            и др. съгласно решение на УС № ..... от ....... {yearStr} г.
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
                <td style={{ ...TD, textAlign: "center" }}>&nbsp;</td>
                <td style={{ ...TD, textAlign: "center" }}>&nbsp;</td>
              </tr>
              {[2, 3, 4, 5, 6].map((n) => (
                <tr key={n}>
                  <td style={{ ...TD, textAlign: "center" }}>{n}.</td>
                  <td style={{ ...TD, height: "18pt" }}>&nbsp;</td>
                  {[0, 1, 2, 3, 4].map((j) => (
                    <td key={j} style={TD}>
                      &nbsp;
                    </td>
                  ))}
                </tr>
              ))}
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
                <td style={TD}>&nbsp;</td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: "10pt", marginBottom: "16pt" }}>
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
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20pt",
              fontSize: "11pt",
            }}
          >
            <p>гр. Гълъбово &nbsp;&nbsp; .............. {yearStr} г.</p>
            <div>
              <p>подпис (Отчел):</p>
              {trip.signatures?.coach ? (
                <img
                  src={trip.signatures.coach}
                  alt="signature"
                  style={{ height: "30pt", marginTop: "4pt" }}
                />
              ) : (
                <p>......................</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
