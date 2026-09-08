// This component is designed specifically for printing.
import React from "react";

import { formatDateTimeDisplay } from "@/lib/date-utils";
import { Member, ScheduleEvent, ScheduleEventType } from "@/types";

// Removed local formatDate as we use the centralized one.

interface PrintableEventProps {
  event: ScheduleEvent;
  members: Member[];
  eventTypeTranslations: Record<ScheduleEventType, string>;
}

export const PrintableEvent: React.FC<PrintableEventProps> = ({
  event,
  members,
  eventTypeTranslations,
}) => {
  if (!event) return null;

  const translatedEventType = event.type
    ? eventTypeTranslations[event.type]
    : "Няма посочен";

  const isCamp = event.type === "camp";

  return (
    <div className="printable-area p-4 font-sans text-sm">
      <h1 className="mb-4 border-b pb-2 text-xl font-bold">
        {isCamp ? "Организационен списък за лагер" : "Детайли за събитието"}
      </h1>
      <div className="mb-6 grid grid-cols-3 gap-x-4 gap-y-2">
        <p className="col-span-1 font-semibold">Заглавие:</p>
        <p className="col-span-2">{event.title}</p>

        <p className="col-span-1 font-semibold">Начало:</p>
        <p className="col-span-2">{formatDateTimeDisplay(event.startDate)}</p>

        <p className="col-span-1 font-semibold">Край:</p>
        <p className="col-span-2">{formatDateTimeDisplay(event.endDate)}</p>

        <p className="col-span-1 font-semibold">Място:</p>
        <p className="col-span-2">{event.location || "Няма посочено"}</p>

        <p className="col-span-1 font-semibold">Тип:</p>
        <p className="col-span-2">{translatedEventType}</p>

        {event.tournamentUrl && (
          <>
            <p className="col-span-1 font-semibold">Линк към турнира:</p>
            <p className="col-span-2 break-all text-blue-700 underline">
              {event.tournamentUrl}
            </p>
          </>
        )}

        {event.attachmentUrl && (
          <>
            <p className="col-span-1 font-semibold">Прикачен документ:</p>
            <p className="col-span-2">
              <span className="font-medium">
                {event.attachmentName || "Наредба за състезанието"}
              </span>{" "}
              <span className="text-xs text-gray-500">
                (виж отделна страница 2)
              </span>
            </p>
          </>
        )}

        {event.description && (
          <>
            <p className="col-span-1 font-semibold">Описание / Бележки:</p>
            <p className="col-span-2 break-words whitespace-pre-wrap">
              {event.description}
            </p>
          </>
        )}

        {isCamp && event.totalCampPrice !== undefined && (
          <>
            <p className="col-span-1 mt-2 font-semibold">Обща цена:</p>
            <p className="col-span-2 mt-2">{event.totalCampPrice} EUR</p>
          </>
        )}
      </div>

      {isCamp && event.attendees && event.attendees.length > 0 ? (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-bold">Участници</h2>
          <table className="w-full border-collapse border border-gray-300 text-left text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Име</th>
                <th className="border border-gray-300 p-2 text-center">
                  Статус
                </th>
                <th className="border border-gray-300 p-2 text-center">
                  Медицинско
                </th>
                <th className="border border-gray-300 p-2 text-center">Стая</th>
                <th className="border border-gray-300 p-2 text-right">
                  Капаро
                </th>
                <th className="border border-gray-300 p-2 text-right">
                  Остатък
                </th>
              </tr>
            </thead>
            <tbody>
              {event.attendees.map((a, i) => {
                const deposit = a.campDepositPaid || 0;
                const remainder = a.campRemainderPaid || 0;
                const member = (members || []).find((m) => m.id === a.memberId);
                const isCoach = member?.isCoach;

                let statusText = "Член";
                if (a.isCampLeader) statusText = "Ръководител";
                else if (isCoach) statusText = "Треньор";
                else if (
                  !member ||
                  a.isGuest ||
                  member.isGuest ||
                  !member.isClubMember
                )
                  statusText = "Гост";

                return (
                  <tr key={a.memberId || i}>
                    <td className="border border-gray-300 p-2 font-medium">
                      {a.name}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {statusText}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {a.campMedicalProvided ? "Да" : "Не"}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {a.campRoom || "—"}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {deposit > 0 ? `${deposit} €` : "—"}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {remainder > 0 ? `${remainder} €` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        event.attendees &&
        event.attendees.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-semibold">Присъстващи:</p>
            <p className="leading-relaxed">
              {(event.attendees || [])
                .map((a) => {
                  const member = (members || []).find(
                    (m) => m.id === a.memberId
                  );
                  return member
                    ? `${member.firstName} ${member.lastName}`
                    : a.name || "Неизвестен";
                })
                .join(", ")}
            </p>
          </div>
        )
      )}

      <p
        className="mt-8 border-t pt-2 text-xs text-gray-500"
        suppressHydrationWarning
      >
        Генерирано на: {formatDateTimeDisplay(new Date())}
      </p>

      {event.attachmentUrl && (
        <div className="print-page-break mt-12 break-before-page pt-8 print:break-before-page">
          <div className="mb-6 flex items-center justify-between border-b-2 border-black pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight uppercase">
                Бадминтон Клуб Гълъбово
              </h2>
              <p className="text-xs text-gray-600">
                Официална Наредба / Прикачен документ към събитието
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="font-semibold">Страница 2 от 2</p>
              <p className="text-gray-500">
                {formatDateTimeDisplay(new Date())}
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4 text-xs">
            <div className="grid grid-cols-3 gap-y-2">
              <span className="font-semibold text-gray-700">
                Относно събитие:
              </span>
              <span className="col-span-2 font-bold text-gray-900">
                {event.title}
              </span>

              <span className="font-semibold text-gray-700">Име на файла:</span>
              <span className="col-span-2 text-gray-900">
                {event.attachmentName || "Наредба за състезанието"}
              </span>

              <span className="font-semibold text-gray-700">
                Тип на документа:
              </span>
              <span className="col-span-2 text-gray-900 uppercase">
                {event.attachmentType || "Документ"}
              </span>

              <span className="font-semibold text-gray-700">
                Директен линк:
              </span>
              <span className="col-span-2 break-all text-blue-700 underline">
                {event.attachmentUrl}
              </span>
            </div>
          </div>

          <div className="w-full overflow-hidden rounded border border-gray-300">
            <iframe
              src={event.attachmentUrl}
              title={event.attachmentName || "Наредба"}
              className="h-220 w-full border-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
