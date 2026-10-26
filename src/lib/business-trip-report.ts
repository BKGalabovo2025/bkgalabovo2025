import { differenceInCalendarDays } from "date-fns";

import { getSiteConfig } from "@/config/sites";
import {
  getTripDecisionNumber,
  getTripOrderNumber,
} from "@/lib/business-trip-numbers";
import { formatOrgName } from "@/lib/business-trip-protocol";
import { BusinessTrip, TripExpense } from "@/types/business-trip.types";
import { ScheduleEvent } from "@/types/index";
import { Member } from "@/types/member.types";

interface PersonStat {
  id: string;
  name: string;
  role: string;
  isCoach: boolean;
  days: number;
  nights: number;
  stayed: boolean;
  note?: string;
  excluded: boolean;
}

function resolveNights(
  ovNights: number | undefined,
  ovStayedOvernight: boolean | undefined,
  defNights: number
): number {
  if (ovNights != null) return ovNights;
  if (ovStayedOvernight === false) return 0;
  return defNights;
}

function buildPersonStat(
  id: string,
  name: string,
  role: string,
  isCoach: boolean,
  ov: {
    actualDays?: number;
    actualNights?: number;
    stayedOvernight?: boolean;
    note?: string;
    excluded?: boolean;
  },
  defDays: number,
  defNights: number
): PersonStat {
  const days = ov.actualDays != null ? ov.actualDays : defDays;
  const nights = resolveNights(ov.actualNights, ov.stayedOvernight, defNights);
  const stayed = ov.stayedOvernight != null ? ov.stayedOvernight : nights > 0;
  return {
    id,
    name,
    role,
    isCoach,
    days,
    nights,
    stayed,
    note: ov.note,
    excluded: ov.excluded ?? false,
  };
}

function buildNoOvernightLine(
  noOvernight: PersonStat[],
  daysCount: number
): string {
  const names = noOvernight.map((a) => a.name).join(", ");
  const reasons = Array.from(
    new Set(noOvernight.map((a) => a.note).filter(Boolean))
  );
  const reasonStr =
    reasons.length > 0
      ? ` (${reasons.join(", ")})`
      : " (отпаднали от състезанието / ранно завръщане)";
  const dayWord = daysCount === 1 ? "ден" : "дни";
  const presWord = daysCount === 1 ? "присъствен ден" : "присъствени дни";
  return `• Състезателите ${names} приключиха своето участие в турнира по-рано${reasonStr} с реален престой от ${daysCount} ${dayWord} и не са нощували (0 нощувки). За тях дневните пари са начислени в размер на 50% (за престой без нощувка) за ${daysCount} ${presWord} и 0.00 € (0.00 лв.) за квартирни/нощувки.`;
}

function buildPartialOvernightLine(
  partialOvernight: PersonStat[],
  daysCount: number,
  nightsCount: number
): string {
  const names = partialOvernight.map((a) => a.name).join(", ");
  const reasons = Array.from(
    new Set(partialOvernight.map((a) => a.note).filter(Boolean))
  );
  const reasonStr = reasons.length > 0 ? ` (${reasons.join(", ")})` : "";
  const dayWord = daysCount === 1 ? "ден" : "дни";
  const nightWord = nightsCount === 1 ? "нощувка" : "нощувки";
  return `• Състезателите ${names} реализираха съкратен престой${reasonStr} от ${daysCount} ${dayWord} с ${nightsCount} ${nightWord}. Ведомостта е преизчислена за действителния им престой.`;
}

function buildReducedStayText(
  reducedAthletes: PersonStat[],
  fullStayAthletes: PersonStat[],
  coachStat: PersonStat
): string {
  const lines: string[] = [
    "Пътуването и престоят се осъществиха с промяна в индивидуалното участие и нощувките на част от отбора:",
  ];

  const noOvernight = reducedAthletes.filter(
    (a) => a.nights === 0 || !a.stayed
  );
  const partialOvernight = reducedAthletes.filter(
    (a) => a.nights > 0 && a.stayed
  );

  if (noOvernight.length > 0) {
    lines.push(buildNoOvernightLine(noOvernight, noOvernight[0].days));
  }

  if (partialOvernight.length > 0) {
    lines.push(
      buildPartialOvernightLine(
        partialOvernight,
        partialOvernight[0].days,
        partialOvernight[0].nights
      )
    );
  }

  if (fullStayAthletes.length > 0) {
    const names = fullStayAthletes.map((a) => a.name).join(", ");
    const fullDays = fullStayAthletes[0].days;
    const fullNights = fullStayAthletes[0].nights;
    const fullDaysWord = fullDays === 1 ? "ден" : "дни";
    const fullNightsWord = fullNights === 1 ? "нощувка" : "нощувки";
    lines.push(
      `• Останалите ${fullStayAthletes.length} състезатели (${names}) и ${coachStat.name} проведоха пълен престой от ${fullDays} ${fullDaysWord} с ${fullNights} ${fullNightsWord} съгласно състезателния график.`
    );
  } else {
    const coachDayWord = coachStat.days === 1 ? "ден" : "дни";
    const coachNightWord = coachStat.nights === 1 ? "нощувка" : "нощувки";
    lines.push(
      `• ${coachStat.name} проведе престой от ${coachStat.days} ${coachDayWord} и ${coachStat.nights} ${coachNightWord} съгласно утвърдените условия.`
    );
  }

  return lines.join("\n");
}

const fmtDate = (d?: string) => {
  if (!d) return "—";
  try {
    const parts = d.split("T")[0].split("-");
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return d;
  } catch {
    return d;
  }
};

/**
 * Генерира съдържанието за точка „3. ТРАНСПОРТ, ПРЕСТОЙ И МАТЕРИАЛНО-ФИНАНСОВО ОБЕЗПЕЧАВАНЕ"
 * от Доклада за командировка.
 */
export function buildStaySectionText(
  trip: BusinessTrip,
  membersDict: Record<string, Member>
): string {
  const startD = new Date(trip.startDate);
  const endD = new Date(trip.endDate);
  const plannedDays = Math.max(1, differenceInCalendarDays(endD, startD) + 1);
  const plannedNights = Math.max(0, differenceInCalendarDays(endD, startD));
  const defDays = trip.actualDays != null ? trip.actualDays : plannedDays;
  const defNights =
    trip.actualNights != null ? trip.actualNights : plannedNights;

  const overrides = trip.participantOverrides ?? {};

  const coach = membersDict[trip.coachId];
  const coachName =
    trip.coachName ||
    (coach
      ? `${coach.firstName} ${coach.lastName}`
      : "Треньорът/Ръководителят");
  const coachRole =
    trip.coachRole || (coach?.isCoach ? "Треньор" : "Ръководител");

  const coachStat = buildPersonStat(
    "coach",
    coachName,
    coachRole,
    true,
    overrides["coach"] ?? {},
    defDays,
    defNights
  );

  const participantIds = trip.participantsIds || [];
  const athletesStats: PersonStat[] = participantIds.map((pid) => {
    const m = membersDict[pid];
    const name = m ? `${m.firstName} ${m.lastName}` : pid;
    const role = m?.isCoach ? "Треньор" : "Състезател";
    return buildPersonStat(
      pid,
      name,
      role,
      Boolean(m?.isCoach),
      overrides[pid] ?? {},
      defDays,
      defNights
    );
  });

  const activeAthletes = athletesStats.filter((p) => !p.excluded);

  const reducedAthletes = activeAthletes.filter(
    (a) =>
      a.nights < plannedNights ||
      a.days < plannedDays ||
      !a.stayed ||
      a.nights === 0
  );

  const fullStayAthletes = activeAthletes.filter(
    (a) => !reducedAthletes.some((ra) => ra.id === a.id)
  );

  let stayText = "";
  if (reducedAthletes.length > 0 && plannedNights > 0) {
    stayText = buildReducedStayText(
      reducedAthletes,
      fullStayAthletes,
      coachStat
    );
  } else if (defDays < plannedDays || defNights < plannedNights) {
    const dayWord = defDays === 1 ? "ден" : "дни";
    const nightWord = defNights === 1 ? "нощувка" : "нощувки";
    stayText = `• Престой: Отборът приключи своето участие по-рано от предвиденото в предварителния график. Реалният престой на състава бе ${defDays} ${dayWord} и ${defNights} ${nightWord} (вместо планираните ${plannedDays} дни / ${plannedNights} нощи). Финансовата ведомост за командировъчни разходи е преизчислена за действителния престой.`;
  } else if (plannedNights === 0 || defNights === 0) {
    const dayWord = defDays === 1 ? "ден" : "дни";
    stayText = `• Престой и настаняване: Отборът участва в режим на ежедневно пътуване (всеки ден отиване и връщане без нощувка) в рамките на ${defDays} ${dayWord}. Не са ползвани хотелски услуги.`;
  } else {
    const dayWord = plannedDays === 1 ? "ден" : "дни";
    const nightWord = plannedNights === 1 ? "нощувка" : "нощувки";
    stayText = `• Престой и настаняване: Пътуването и престоят се осъществиха изцяло съгласно предварителния график (общо ${plannedDays} ${dayWord} и ${plannedNights} ${nightWord} на място). Всички участници проведоха пълния престой съгласно състезателната програма.`;
  }

  // Транспорт
  const vehicle = trip.vehicle;
  const isDailyCommute = vehicle?.commuteMode === "daily_commute";
  let singleKm = vehicle?.distanceKm ?? 0;
  if (vehicle?.singleRoundTripKm && vehicle.singleRoundTripKm > 0) {
    singleKm = vehicle.singleRoundTripKm;
  } else if (isDailyCommute && vehicle?.distanceKm && plannedDays > 0) {
    singleKm = Math.round(vehicle.distanceKm / plannedDays);
  }

  let actualTrips = isDailyCommute ? defDays : 1;
  if (vehicle?.actualTripsCount != null) {
    actualTrips = vehicle.actualTripsCount;
  }

  const totalEffectiveKm = isDailyCommute
    ? Math.round(actualTrips * singleKm * 10) / 10
    : (vehicle?.distanceKm ?? singleKm);

  let transportLine = "";
  if (trip.transportType === "free") {
    transportLine = `• Транспорт: Организиран и осигурен безплатно от организатора/домакина (без транспортен разход за клуба).`;
  } else if (
    trip.transportType === "fuel_only" ||
    trip.transportType === "club_paid"
  ) {
    const tripWord = actualTrips === 1 ? "курс" : "курса";
    if (isDailyCommute) {
      const commuteTypeWord =
        actualTrips === 1 ? "еднодневно пътуване" : "ежедневно пътуване";
      transportLine = `• Транспорт с МПС (${commuteTypeWord} без нощувка): Осъществени са ${actualTrips} ${tripWord} (отиване и връщане) по маршрут гр. Гълъбово – ${trip.destination || "дестинацията"} – гр. Гълъбово (1 курс = ${singleKm} км, общо ${totalEffectiveKm} км по пътен лист).`;
    } else {
      transportLine = `• Транспорт с МПС: Осъществено е двупосочно пътуване по маршрут гр. Гълъбово – ${trip.destination || "дестинацията"} – гр. Гълъбово (общо ${totalEffectiveKm} км по пътен лист).`;
    }
  } else if (trip.transportType === "public") {
    if (isDailyCommute) {
      const commuteTypeWord =
        actualTrips === 1 ? "еднодневно пътуване" : "ежедневно пътуване";
      transportLine = `• Обществен транспорт (${commuteTypeWord}): Закупени са билети за ${actualTrips} ${actualTrips === 1 ? "ден" : "дни"} състезателно пътуване на отбора.`;
    } else {
      transportLine = `• Обществен транспорт: Закупени са двупосочни билети за пътуването на отбора.`;
    }
  } else {
    transportLine = `• Транспорт: Осъществен съгласно утвърдените условия в Заповедта за командировка.`;
  }

  // Финансово обезпечаване
  const perDiemRate = trip.financials?.perDiemRateEUR ?? 11;
  const financeLine = `• Финансово обезпечаване: На командированите лица са начислени и изплатени полагащите се командировъчни пари (дневни в размер на ${perDiemRate.toFixed(2)} € на ден на лице съгласно Наредбата за командировките в страната), подробно отразени във Финансовата ведомост.`;

  return [stayText, transportLine, financeLine].filter(Boolean).join("\n");
}

/**
 * Генерира опис на приложенията спрямо прикачените файлове и фактури.
 */
export function buildReportApplicationsText(
  trip: BusinessTrip,
  _expenses: TripExpense[] = [],
  attachMatchProtocols: boolean = false
): string {
  const lines: string[] = [];

  // 1. Официален съдийски протокол
  const matchProtos = trip.matchProtocols || [];
  if (matchProtos.length > 0) {
    const names = matchProtos.map((p) => p.name).join("; ");
    lines.push(`• Официални съдийски протоколи от срещите: ${names};`);
  } else if (attachMatchProtocols || trip.attachMatchProtocols) {
    lines.push(
      `• Официални съдийски протоколи от изиграните срещи на турнира;`
    );
  }

  // 2. Оригинални разходооправдателни документи (общо, без изброяване)
  lines.push(`• Оригиналните разходооправдателни документи.`);

  return lines.join("\n");
}

/**
 * Генерира целия текст на Доклада за командировка по подразбиране по единен стандарт.
 */
export function generateDefaultReportText(
  trip: BusinessTrip,
  membersDict: Record<string, Member>,
  attachMatchProtocols: boolean = false,
  expenses: TripExpense[] = [],
  event?: ScheduleEvent | null
): string {
  const site = getSiteConfig();
  const coach = membersDict[trip.coachId];
  const coachName =
    trip.coachName ||
    (coach ? `${coach.firstName} ${coach.lastName}` : "Треньор/Ръководител");
  const coachRole =
    trip.coachRole || (coach?.isCoach ? "Треньор" : "Ръководител");

  const rawParticipantIds =
    trip.participantsIds && trip.participantsIds.length > 0
      ? trip.participantsIds
      : (event?.attendees
          ?.map((a) => a.memberId)
          .filter((id) => {
            const m = membersDict[id];
            return m && !m.isCoach;
          }) ?? []);

  const athletesMembers = rawParticipantIds
    .map((id) => membersDict[id])
    .filter(Boolean) as Member[];

  const athletesCount = athletesMembers.length;
  const athletesNames = athletesMembers.map(
    (m) => `${m.firstName} ${m.lastName}`
  );
  const athletesStr =
    athletesCount > 0 ? athletesNames.join(", ") : "състезателите на клуба";

  const startStr = fmtDate(trip.startDate);
  const endStr = fmtDate(trip.endDate);
  const destCity = trip.destination || "гр. Хасково";
  const organizer =
    (event as { organizer?: string } | undefined)?.organizer ||
    trip.organizer ||
    "Българска федерация бадминтон (БФБ)";
  const hostClub =
    (event as { hostClub?: string } | undefined)?.hostClub ||
    trip.hostClub ||
    `БК ${trip.destination || "домакин"}`;
  const orderNum = getTripOrderNumber(trip);
  const orderDate = fmtDate(trip.orderDate || trip.startDate);
  const decisionNum = getTripDecisionNumber(trip);
  const decisionDate = fmtDate(trip.usDecisionDate || trip.startDate);
  const protocolNum = trip.usProtocolNumber?.trim()
    ? ` (Протокол № ${trip.usProtocolNumber.trim()})`
    : "";

  const staySection = buildStaySectionText(trip, membersDict);
  const appSection = buildReportApplicationsText(
    trip,
    expenses,
    attachMatchProtocols
  );

  return `1. ПРОВЕЖДАНЕ И ОФИЦИАЛНО УЧАСТИЕ:
В периода от ${startStr} г. до ${endStr} г. представителният отбор на ${formatOrgName(site.name)} взе официално участие в състезанието ${trip.title}, проведено в ${destCity}. Турнирът се организира от ${organizer} с клуб домакин ${hostClub}. Участието се осъществи въз основа на Заповед за командировка № ${orderNum} от ${orderDate} г. и Решение на УС № ${decisionNum} от ${decisionDate} г.${protocolNum ? `${protocolNum}.` : ""} Отборът бе ръководен от ${coachName} (${coachRole}) с делегация от ${athletesCount} командировани състезатели: ${athletesStr}.

2. СПОРТНО-ТЕХНИЧЕСКИ РЕЗУЛТАТИ И ПРЕДСТАВЯНЕ:
Състезателите на клуба взеха участие в утвърдените турнирни дисциплини съгласно Държавния спортен календар на БФ Бадминтон. Отборът демонстрира отлична състезателна подготовка, висок спортен дух, отборен синхрон и стриктна дисциплина на и извън корта. Всички срещи се проведоха при спазване на състезателния правилник и указанията на треньора. Поставените цели за турнира и спортно-техническото представяне са изпълнени успешно.

3. ТРАНСПОРТ, ПРЕСТОЙ И МАТЕРИАЛНО-ФИНАНСОВО ОБЕЗПЕЧАВАНЕ:
${staySection}

4. ЗАКЛЮЧЕНИЕ И ПРИЛОЖЕНИЯ:
Възложените задачи са изпълнени. Прилагат се оригиналните разходооправдателни документи. Настоящият доклад се представя в законоустановения 3-дневен срок от Наредбата за командировките в страната.

Приложения:
${appSection}`;
}

/**
 * Актуализира раздел 3 в съществуващ текст на доклад,
 * запазвайки авторските бележки в раздел 1, 2 и 4.
 */
export function updateReportTextStaySection(
  existingText: string | undefined,
  trip: BusinessTrip,
  membersDict: Record<string, Member>
): string {
  const stayText = buildStaySectionText(trip, membersDict);

  if (!existingText || existingText.trim() === "") {
    return generateDefaultReportText(
      trip,
      membersDict,
      Boolean(trip.attachMatchProtocols)
    );
  }

  const marker3 = "3. ТРАНСПОРТ";
  const marker3Old = "3. ПРЕСТОЙ";
  const marker4 = "4. ЗАКЛЮЧЕНИЕ";

  let idx3 = existingText.toUpperCase().indexOf(marker3.toUpperCase());
  if (idx3 === -1) {
    idx3 = existingText.toUpperCase().indexOf(marker3Old.toUpperCase());
  }

  if (idx3 !== -1) {
    const idx4 = existingText
      .toUpperCase()
      .indexOf(marker4.toUpperCase(), idx3);
    const before = existingText.slice(0, idx3);
    const after = idx4 !== -1 ? "\n" + existingText.slice(idx4) : "";
    return `${before}3. ТРАНСПОРТ, ПРЕСТОЙ И МАТЕРИАЛНО-ФИНАНСОВО ОБЕЗПЕЧАВАНЕ:\n${stayText}${after}`;
  }

  return `${existingText}\n\n3. ТРАНСПОРТ, ПРЕСТОЙ И МАТЕРИАЛНО-ФИНАНСОВО ОБЕЗПЕЧАВАНЕ:\n${stayText}`;
}
