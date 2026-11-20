"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import React from "react";

import { HEATMAP_ZONE_LABELS } from "./CourtHeatmapPreview";

export interface ProtocolAthlete {
  id: string;
  name: string;
  ageGroup?: string;
  rpe?: number;
  timeSec?: number;
  actionsCount?: number;
}

export interface ShadowOfficialProtocolProps {
  date?: string | Date;
  coachName?: string;
  mode?: string;
  preset?: string;
  cornersMode?: string;
  ageGroup?: string;
  durationMs?: number;
  completedSets?: number;
  totalSets?: number;
  workSec?: number;
  restSec?: number;
  paceSec?: number;
  drillPattern?: string;
  notes?: string;
  heatmap?: Record<string, number>;
  athletes: ProtocolAthlete[];
  agilityTestTimeSec?: number;
  agilityActionsDone?: number;
  signatureUrl?: string | null;
  coachSignatureUrl?: string | null;
}

function getRpeLabel(score?: number): string {
  if (!score) return "—";
  if (score <= 2) return "Много леко";
  if (score <= 4) return "Леко";
  if (score === 5) return "Умерено";
  if (score <= 7) return "Тежко";
  if (score <= 9) return "Много тежко";
  return "Максимум";
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} сек`;
  return `${minutes} мин ${seconds} сек`;
}

export const ShadowOfficialProtocol = React.forwardRef<
  HTMLDivElement,
  ShadowOfficialProtocolProps
>(function ShadowOfficialProtocol(props, ref) {
  const {
    date = new Date(),
    coachName = "Мира Георгиева",
    mode = "standard",
    preset = "custom",
    cornersMode = "6-corners",
    ageGroup = "U13-U15",
    durationMs = 0,
    completedSets = 3,
    totalSets = 3,
    workSec = 45,
    restSec = 30,
    paceSec = 2.5,
    drillPattern = "random",
    notes,
    heatmap = {},
    athletes = [],
    agilityTestTimeSec,
    agilityActionsDone,
    signatureUrl,
  } = props;

  const sessionDate = typeof date === "string" ? new Date(date) : date;
  const formattedDate = format(sessionDate, "dd MMMM yyyy г., HH:mm 'ч.'", {
    locale: bg,
  });
  const protocolNumber = `SHD-${format(sessionDate, "yyyyMMdd")}-${sessionDate.getTime().toString().slice(-4)}`;

  const isAgility = mode === "agility_test";
  const title = isAgility
    ? "ОФИЦИАЛЕН ПРОТОКОЛ ОТ КОНТРОЛЕН НОРМАТИВ ЗА БЪРЗИНА (AGILITY TEST)"
    : "ОФИЦИАЛЕН ПРОТОКОЛ ОТ ТРЕНИРОВЪЧНА СЕСИЯ ПО ДВИЖЕНИЯ (SHADOW FOOTWORK)";

  const totalHits = Object.values(heatmap).reduce(
    (sum, val) => sum + (typeof val === "number" ? val : 0),
    0
  );

  const isCoachMira =
    (coachName || "").toLowerCase().includes("мира") ||
    (coachName || "").toLowerCase().includes("георгиева");
  const effectiveCoachSig =
    props.coachSignatureUrl || (isCoachMira ? signatureUrl : null);

  return (
    <div
      ref={ref}
      className="printable-area mx-auto w-[794px] min-w-[794px] bg-white p-10 font-serif text-slate-900 shadow-lg print:m-0 print:w-full print:min-w-0 print:p-6 print:shadow-none"
    >
      {/* Official Club Letterhead */}
      <div className="mb-6 border-b-2 border-slate-900 pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/LOGO.webp"
              alt="Бадминтон клуб Гълъбово"
              className="size-16 shrink-0 object-contain print:size-14"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/icons/LOGO.jpg";
              }}
            />
            <div className="space-y-0.5 text-[9.5pt] leading-tight">
              <p className="font-bold tracking-tight text-slate-950 uppercase">
                СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“
              </p>
              <p className="italic text-slate-700">
                гр. Гълъбово, п.к. 6280, обл. Стара Загора, ул. „Иван Вазов“ №22
              </p>
              <p className="text-slate-800">
                тел.:{" "}
                <span className="font-semibold text-slate-950">
                  +359 899 82 99 23
                </span>{" "}
                – Мира Георгиева • e-mail: bkgalabovo@gmail.com
              </p>
            </div>
          </div>

          <div className="text-right text-[8.5pt]">
            <p className="font-mono font-bold text-slate-900">
              № {protocolNumber}
            </p>
            <p className="text-slate-600">{formattedDate}</p>
          </div>
        </div>
      </div>

      {/* Main Document Header */}
      <div className="mb-6 text-center">
        <h1 className="text-base font-black tracking-tight uppercase text-slate-950 sm:text-lg">
          {title}
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Спортно-технически отчет и аналитичен протокол на тренировъчното
          натоварване
        </p>
      </div>

      {/* Session Metadata Grid */}
      <div className="mb-6 rounded-lg border border-slate-300 bg-slate-50/80 p-4 text-[9.5pt]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div>
            <span className="font-bold text-slate-900">Водещ треньор:</span>{" "}
            <span className="text-slate-800">{coachName}</span>
          </div>
          <div>
            <span className="font-bold text-slate-900">Дата и час:</span>{" "}
            <span className="text-slate-800">{formattedDate}</span>
          </div>
          <div>
            <span className="font-bold text-slate-900">
              Режим &amp; Пресет:
            </span>{" "}
            <span className="text-slate-800">
              {isAgility ? "Спринт тест (Agility)" : "Интервално натоварване"} •{" "}
              {preset}
            </span>
          </div>
          <div>
            <span className="font-bold text-slate-900">Възрастова група:</span>{" "}
            <span className="text-slate-800">{ageGroup}</span>
          </div>
          <div>
            <span className="font-bold text-slate-900">Общо времетраене:</span>{" "}
            <span className="text-slate-800">{formatDuration(durationMs)}</span>
          </div>
          <div>
            <span className="font-bold text-slate-900">Серии &amp; Ритъм:</span>{" "}
            <span className="text-slate-800">
              {completedSets} от {totalSets} серии (Работа: {workSec}s, Почивка:{" "}
              {restSec}s, Темпо: {paceSec}s)
            </span>
          </div>
          <div>
            <span className="font-bold text-slate-900">
              Кортове &amp; Ъгли:
            </span>{" "}
            <span className="text-slate-800">
              {cornersMode} • Модел: {drillPattern}
            </span>
          </div>
          <div>
            <span className="font-bold text-slate-900">Общ обем удари:</span>{" "}
            <span className="text-slate-800">
              {isAgility
                ? `${agilityActionsDone || 20} движения`
                : `${totalHits} регистрирани отигравания`}
            </span>
          </div>
        </div>
      </div>

      {/* Athletes Performance Table */}
      <div className="mb-6">
        <h2 className="mb-2 text-xs font-bold tracking-wider text-slate-900 uppercase">
          1. Участници и индивидуални резултати
        </h2>
        <table className="w-full border-collapse border border-slate-300 text-[9pt]">
          <thead>
            <tr className="bg-slate-100 text-slate-900">
              <th className="border border-slate-300 p-2 text-center w-10">
                №
              </th>
              <th className="border border-slate-300 p-2 text-left">
                Име на състезателя
              </th>
              <th className="border border-slate-300 p-2 text-center w-24">
                Категория
              </th>
              {isAgility ? (
                <>
                  <th className="border border-slate-300 p-2 text-center w-32">
                    Време (сек)
                  </th>
                  <th className="border border-slate-300 p-2 text-center w-28">
                    Статус
                  </th>
                </>
              ) : (
                <>
                  <th className="border border-slate-300 p-2 text-center w-28">
                    Серии
                  </th>
                  <th className="border border-slate-300 p-2 text-center w-32">
                    RPE Оценка (1-10)
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {athletes.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="border border-slate-300 p-4 text-center italic text-slate-500"
                >
                  Няма регистрирани индивидуални състезатели.
                </td>
              </tr>
            ) : (
              athletes.map((a, idx) => {
                const rpe = a.rpe || 5;
                const time =
                  a.timeSec ||
                  (agilityTestTimeSec
                    ? agilityTestTimeSec
                    : Number((durationMs / 1000).toFixed(1)));
                return (
                  <tr key={a.id || idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 text-center font-bold">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-300 p-2 font-bold text-slate-950">
                      {a.name}
                    </td>
                    <td className="border border-slate-300 p-2 text-center text-slate-700">
                      {a.ageGroup || ageGroup}
                    </td>
                    {isAgility ? (
                      <>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold text-slate-950">
                          {time}s
                        </td>
                        <td className="border border-slate-300 p-2 text-center text-emerald-800 font-semibold">
                          Контролен тест
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border border-slate-300 p-2 text-center text-slate-700">
                          {completedSets} / {totalSets}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          <span className="font-bold text-slate-950">
                            {rpe}/10
                          </span>{" "}
                          <span className="text-[8pt] text-slate-600">
                            ({getRpeLabel(rpe)})
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Heatmap & Tactical Distribution */}
      {totalHits > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-xs font-bold tracking-wider text-slate-900 uppercase">
            2. Тактическо разпределение по зони на корта (Heatmap)
          </h2>
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-300 bg-slate-50 p-3 text-[8.5pt]">
            {Object.entries(heatmap).map(([zoneKey, count]) => {
              const label = HEATMAP_ZONE_LABELS[zoneKey] || zoneKey;
              const pct = Math.round((count / totalHits) * 100);
              return (
                <div
                  key={zoneKey}
                  className="flex items-center justify-between rounded border border-slate-200 bg-white p-1.5"
                >
                  <span className="font-medium text-slate-800">{label}:</span>
                  <span className="font-mono font-bold text-slate-950">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Coach Evaluation & Remarks */}
      <div className="mb-8">
        <h2 className="mb-1 text-xs font-bold tracking-wider text-slate-900 uppercase">
          3. Треньорски бележки и констатации
        </h2>
        <div className="min-h-16 rounded-lg border border-slate-300 bg-slate-50/50 p-3 text-[9pt] italic text-slate-800">
          {notes && notes.trim().length > 0
            ? notes
            : "Упражнението е проведено съгласно планирания протокол. Състезателите демонстрират добра двигателна дисциплина и спазване на тайминга за сплит степ."}
        </div>
      </div>

      {/* Official Signatures Block */}
      <div className="mt-10 border-t border-slate-300 pt-6">
        <div className="flex items-end justify-between text-[9.5pt]">
          <div className="space-y-1">
            <p className="font-bold text-slate-900">Водещ треньор:</p>
            {effectiveCoachSig ? (
              <div className="flex flex-col items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={effectiveCoachSig}
                  alt="Подпис на треньора"
                  className="h-10 w-auto object-contain"
                />
                <p className="font-bold text-slate-950">/ {coachName} /</p>
              </div>
            ) : (
              <div>
                <p className="text-slate-800">
                  ...................................................
                </p>
                <p className="font-bold text-slate-950">/ {coachName} /</p>
              </div>
            )}
          </div>

          <div className="space-y-1 text-right">
            <p className="font-bold text-slate-900">Председател на СКБ:</p>
            {signatureUrl ? (
              <div className="flex flex-col items-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signatureUrl}
                  alt="Електронен подпис"
                  className="h-10 w-auto object-contain"
                />
                <p className="font-bold text-slate-950">/ Мира Георгиева /</p>
              </div>
            ) : (
              <div>
                <p className="text-slate-800">
                  ...................................................
                </p>
                <p className="font-bold text-slate-950">/ Мира Георгиева /</p>
              </div>
            )}
            <p className="text-[7.5pt] italic text-slate-500">
              (печат и подпис)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
