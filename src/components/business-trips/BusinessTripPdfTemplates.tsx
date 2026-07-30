"use client";
/* eslint-disable react/forbid-dom-props */
/* eslint-disable react/no-unescaped-entities */

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import React from "react";

import { BusinessTrip, convertEurToBgn } from "@/types/business-trip.types";
import { Member } from "@/types/member.types";
import { Tournament, TournamentEntry } from "@/types/tournament.types";

interface BusinessTripPdfTemplatesProps {
  trip: BusinessTrip | null;
  tournament: Tournament | null;
  entries: TournamentEntry[];
  membersDict: Record<string, Member>;
  showBgn: boolean;
}

export function BusinessTripPdfTemplates({
  trip,
  tournament,
  membersDict,
  showBgn,
}: BusinessTripPdfTemplatesProps) {
  if (!trip || !tournament) return null;

  const coach = membersDict[trip.coachId];
  const coachName = coach
    ? `${coach.firstName} ${coach.lastName}`
    : "_________________";

  const participantNames = trip.participantsIds
    .map((id) => {
      const m = membersDict[id];
      return m ? `${m.firstName} ${m.lastName}` : "";
    })
    .filter(Boolean);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd.MM.yyyy", { locale: bg });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (eurAmount: number) => {
    if (showBgn) {
      return `€${eurAmount.toFixed(2)} (${convertEurToBgn(eurAmount).toFixed(2)} лв.)`;
    }
    return `€${eurAmount.toFixed(2)}`;
  };

  const transportLabels: Record<string, string> = {
    club_paid: "Служебен/Нает транспорт",
    free: "Безплатен (организиран)",
    fuel_only: "Личен автомобил (с пътен лист)",
    public: "Обществен транспорт",
  };

  return (
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      {/* 1. ЗАПОВЕД ЗА КОМАНДИРОВКА */}
      <div
        id="pdf-order-template"
        className="bg-white p-12 text-black"
        style={{
          width: "210mm",
          minHeight: "297mm",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold uppercase">
            Спортен Клуб "Бадминтон Клуб Гълъбово"
          </h1>
          <p className="text-sm">Град Гълъбово, Булстат: 176735165</p>
        </div>

        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold">ЗАПОВЕД</h2>
          <p className="text-lg">
            № {trip.id ? trip.id.substring(0, 6).toUpperCase() : "____"} /{" "}
            {formatDate(trip.createdAt || trip.startDate)} г.
          </p>
        </div>

        <div className="mb-6 space-y-4 text-justify leading-relaxed">
          <p>
            На основание Наредбата за командировките в страната (2026 г.) и във
            връзка с изпълнение на спортния календар на клуба,
          </p>
          <p className="text-center font-bold">НАРЕЖДАМ:</p>

          <p>
            1. Командировам лицето:{" "}
            <span className="border-b border-black px-2 font-bold">
              {coachName}
            </span>
          </p>
          <p>
            На длъжност:{" "}
            <span className="border-b border-black px-2 font-bold">
              Треньор / Ръководител
            </span>
          </p>

          <p>
            2. Със следния маршрут: от гр.{" "}
            <span className="border-b border-black px-2 font-bold">
              Гълъбово
            </span>{" "}
            до гр.{" "}
            <span className="border-b border-black px-2 font-bold">
              {trip.destination}
            </span>{" "}
            и обратно.
          </p>

          <p>
            3. Цел на командировката:{" "}
            <span className="border-b border-black px-2 font-bold">
              {trip.title}
            </span>
          </p>

          <p>
            4. Времетраене: от{" "}
            <span className="font-bold">{formatDate(trip.startDate)}</span> до{" "}
            <span className="font-bold">{formatDate(trip.endDate)}</span>
          </p>

          <p>
            5. Начин на пътуване:{" "}
            <span className="border-b border-black px-2 font-bold">
              {transportLabels[trip.transportType] || trip.transportType}
            </span>
          </p>

          {participantNames.length > 0 && (
            <div className="border-l-2 border-gray-300 pl-4">
              <p className="mb-2 font-semibold">
                Придружител на следните състезатели:
              </p>
              <ul className="list-disc pl-5">
                {participantNames.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-6 font-bold">Финансови условия:</p>
          <ul className="list-none space-y-2 pl-4">
            <li>
              - Дневни пари:{" "}
              <span className="font-bold">
                {formatCurrency(
                  trip.financials.perDiemOverrideEUR ||
                    trip.financials.perDiemRateEUR
                )}
              </span>
            </li>
            <li>
              - Квартирни пари:{" "}
              <span className="font-bold">
                {trip.financials.accommodationRateEUR > 0
                  ? "Според представена фактура"
                  : "Не се изплащат"}
              </span>
            </li>
            <li>
              - Пътни пари:{" "}
              <span className="font-bold">
                {trip.transportType === "free"
                  ? "Безплатен транспорт"
                  : "Според представен пътен лист / билети"}
              </span>
            </li>
          </ul>

          <p className="mt-4">
            Разходите да бъдат отчетени по: <br />[{" "}
            {trip.financials.isCommercialActivity ? " " : "X"} ] Нестопанска
            (регламентирана) дейност <br />[{" "}
            {trip.financials.isCommercialActivity ? "X" : " "} ] Стопанска
            дейност
          </p>
        </div>

        <div className="mt-20 flex justify-between px-10">
          <div className="text-center">
            <p className="mb-10">КОМАНДИРОВАН:</p>
            <p>.......................................</p>
            <p className="text-xs">({coachName})</p>
          </div>
          <div className="text-center">
            <p className="mb-10">УПРАВИТЕЛ / ПРЕДСЕДАТЕЛ:</p>
            <p>.......................................</p>
            <p className="text-xs">(Печат и Подпис)</p>
          </div>
        </div>
      </div>

      {/* 2. ПЪТЕН ЛИСТ */}
      <div
        id="pdf-waybill-template"
        className="bg-white p-12 text-black"
        style={{
          width: "210mm",
          minHeight: "297mm",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold uppercase">
            Спортен Клуб "Бадминтон Клуб Гълъбово"
          </h1>
        </div>

        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold">ПЪТЕН ЛИСТ ЗА МПС</h2>
          <p className="text-lg">
            Към Заповед №{" "}
            {trip.id ? trip.id.substring(0, 6).toUpperCase() : "____"}
          </p>
        </div>

        <div className="space-y-6 text-lg">
          <div className="grid grid-cols-2 gap-4">
            <p>
              Водач:{" "}
              <span className="border-b border-black px-2 font-bold">
                {coachName}
              </span>
            </p>
            <p>
              Дата:{" "}
              <span className="border-b border-black px-2 font-bold">
                {formatDate(trip.startDate)}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <p>
              Автомобил (Марка/Модел):{" "}
              <span className="border-b border-black px-2 font-bold">
                {trip.vehicle?.brand || "____________________"}
              </span>
            </p>
            <p>
              Рег. №:{" "}
              <span className="border-b border-black px-2 font-bold">
                {trip.vehicle?.regNumber || "________________"}
              </span>
            </p>
          </div>

          <table className="mt-8 w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2">Маршрут (от - до)</th>
                <th className="border border-black p-2">Изминати км</th>
                <th className="border border-black p-2">
                  Разходна норма (л/100км)
                </th>
                <th className="border border-black p-2">
                  Изразходвано гориво (литри)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-4 text-center">
                  Гълъбово - {trip.destination} - Гълъбово
                </td>
                <td className="border border-black p-4 text-center">
                  {trip.vehicle?.distanceKm || 0}
                </td>
                <td className="border border-black p-4 text-center">
                  {trip.vehicle?.fuelNorm || 0}
                </td>
                <td className="border border-black p-4 text-center">
                  {trip.vehicle?.distanceKm && trip.vehicle?.fuelNorm
                    ? (
                        (trip.vehicle.distanceKm / 100) *
                        trip.vehicle.fuelNorm
                      ).toFixed(2)
                    : 0}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 space-y-2 text-sm">
            <p>Цена на горивото: ____________ / литър</p>
            <p className="mt-4 text-lg font-bold">
              ОБЩО ЗА ИЗПЛАЩАНЕ ЗА ГОРИВО: ____________________
            </p>
          </div>
        </div>

        <div className="mt-32 flex justify-between px-10">
          <div className="text-center">
            <p className="mb-10">ВОДАЧ:</p>
            <p>.......................................</p>
          </div>
          <div className="text-center">
            <p className="mb-10">РАЗРЕШИЛ ПЪТУВАНЕТО:</p>
            <p>.......................................</p>
          </div>
        </div>
      </div>
    </div>
  );
}
