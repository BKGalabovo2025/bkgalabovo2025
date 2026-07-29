// This component is designed specifically for printing.
import React from "react";
import { ScheduleEvent, Member, ScheduleEventType } from "@/types";
import { formatDateTimeDisplay } from "@/lib/date-utils";

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
    </div>
  );
};
