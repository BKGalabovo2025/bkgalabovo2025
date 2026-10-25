import { format } from "date-fns";
import { bg } from "date-fns/locale";

import { SiteConfig } from "@/config/sites";
import {
  getTripDecisionNumber,
  getTripOrderNumber,
  getTripProtocolNumber,
} from "@/lib/business-trip-numbers";
import { BusinessTrip } from "@/types/business-trip.types";
import { Member } from "@/types/member.types";

export interface ProtocolTextOptions {
  meetingDate?: string;
  meetingTime?: string;
  meetingLocation?: string;
  meetingChair?: string;
  meetingSecretary?: string;
  boardMembers?: string;
  protocolNumber?: string;
}

export function formatProtocolDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const clean = dateStr.replace(/\s*г\.?$/u, "").trim();
  const ddmmyyyy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(clean);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    return `${d.padStart(2, "0")}.${m.padStart(2, "0")}.${y}`;
  }
  try {
    return format(new Date(clean), "dd.MM.yyyy", { locale: bg });
  } catch {
    return clean;
  }
}

/**
 * Генерира стандартния пълен текст на протокола от заседание на УС.
 * Позволява пълно редактиране в диалога за протоколи.
 */
export function generateDefaultProtocolText(
  trip: BusinessTrip,
  site: SiteConfig,
  membersDict: Record<string, Member>,
  options?: ProtocolTextOptions
): string {
  const coach = membersDict[trip.coachId];
  const coachName =
    trip.coachName ||
    (coach ? `${coach.firstName} ${coach.lastName}` : "неопределен");

  const effectiveTripParticipantIds =
    trip.participantsIds && trip.participantsIds.length > 0
      ? trip.participantsIds
      : [];

  const partMembers = effectiveTripParticipantIds
    .map((id) => membersDict[id])
    .filter(Boolean) as Member[];

  const playersList =
    partMembers
      .filter((m) => !m.isCoach)
      .map((m) => `${m.firstName} ${m.lastName}`)
      .join(", ") || "представителни състезатели на клуба";

  const totalPeople =
    (coach ? 1 : 0) + partMembers.filter((m) => !m.isCoach).length;
  const countStr =
    totalPeople > 0
      ? `${totalPeople} ${totalPeople === 1 ? "човек" : "души"}`
      : "клубна делегация";

  const destCity = trip.destination || "състезателния център";
  const startFmt = formatProtocolDate(trip.startDate);
  const endFmt = formatProtocolDate(trip.endDate);
  const periodStr =
    trip.startDate === trip.endDate || startFmt === endFmt
      ? `${startFmt} г.`
      : `${startFmt} г. — ${endFmt} г.`;

  const orderNum = getTripOrderNumber(trip);
  const decisionNum = getTripDecisionNumber(trip);
  const protocolNum =
    options?.protocolNumber?.trim() || getTripProtocolNumber(trip);

  const decisionDateFmt = formatProtocolDate(
    options?.meetingDate ||
      trip.usDecisionDate ||
      trip.orderDate ||
      trip.startDate
  );
  const meetingTime = options?.meetingTime || trip.usMeetingTime || "18:00 ч.";
  const meetingLocation =
    options?.meetingLocation ||
    trip.usMeetingLocation ||
    "гр. Гълъбово, в седалището на сдружението";

  const mol = site.contact.mol || "М. Георгиева";
  const chair = options?.meetingChair || trip.usMeetingChair || mol;
  const secretary =
    options?.meetingSecretary || trip.usMeetingSecretary || "член на УС";

  const defaultBoardMembers = `1. ${chair} — Председател на Управителния съвет\n2. Членове на Управителния съвет (редовно уведомени по установения ред)`;
  const boardMembers =
    options?.boardMembers || trip.usBoardMembers || defaultBoardMembers;

  const notesText = trip.usDecisionNotes?.trim()
    ? `\n5. ${trip.usDecisionNotes.trim()}`
    : "";

  return `Днес, ${decisionDateFmt} г., в ${meetingLocation}, в ${meetingTime} се проведе редовно заседание на Управителния съвет на „${site.name}“.

ПРИСЪСТВАТ ЧЛЕНОВЕТЕ НА УПРАВИТЕЛНИЯ СЪВЕТ:
${boardMembers}

Председателят констатира, че присъства необходимият съгласно чл. 32 от ЗЮЛНЦ и разпоредбите на Устава кворум. Заседанието е законно конституирано и може да взема валидни решения. За водещ заседанието бе определен ${chair}, а за протоколчик — ${secretary}.

ДНЕВЕН РЕД:
Точка 1: Обсъждане и вземане на решение за официално участие на представителния клубен отбор в състезание: ${trip.title} (гр./място ${destCity}, период ${periodStr}), утвърждаване на клубна делегация и финансово обезпечаване на разходите.

ПО ТОЧКА 1 ОТ ДНЕВНИЯ РЕД:
Думата бе дадена на Председателя на УС ${chair}. Той запозна членовете с поканата от БФ Бадминтон, графика на състезанието и предложи клубна делегация в общ брой от ${countStr} (Ръководител/Треньор: ${coachName} и състезатели: ${playersList}). Направена бе финансова план-сметка за пътни, дневни и нощувки съгласно Наредбата за командировките в страната (НКС).

След проведени обсъждания и разисквания, заседанието пристъпи към гласуване.
Резултат от гласуването: „ЗА“ — единодушно (100%), „ПРОТИВ“ — няма, „ВЪЗДЪРЖАЛИ СЕ“ — няма.

ВЪЗ ОСНОВА НА РЕЗУЛТАТИТЕ ОТ ГЛАСУВАНЕТО, УПРАВИТЕЛНИЯТ СЪВЕТ ПРИЕ СЛЕДНОТО РЕШЕНИЕ № ${decisionNum}:
1. Одобрява участието на клубния отбор в ${trip.title} (${destCity}) в периода ${periodStr}.
2. Утвърждава поименния състав на делегацията с ръководител ${coachName}.
3. Одобрява финансовото обезпечаване (пътни, дневни и квартирни пари) съгласно НКС и бюджета на клуба.
4. Възлага на Председателя на УС да издаде Заповед за командировка № ${orderNum} и окомплектова счетоводното досие на състезанието.${notesText}

Поради изчерпване на дневния ред заседанието на Управителния съвет бе закрито. Настоящият протокол № ${protocolNum} се съставя в удостоверение на взетите решения и се вписва в протоколната книга на клуба.`;
}
