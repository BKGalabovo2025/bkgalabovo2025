import { differenceInCalendarDays } from "date-fns";

import { getSiteConfig } from "@/config/sites";
import { BusinessTrip } from "@/types/business-trip.types";
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
    lines.push(
      `• Останалите ${fullStayAthletes.length} състезатели (${names}) и ${coachStat.name} проведоха пълен престой от ${fullDays} дни с ${fullNights} нощувки съгласно състезателния график.`
    );
  } else {
    lines.push(
      `• ${coachStat.name} проведе престой от ${coachStat.days} дни и ${coachStat.nights} нощувки съгласно утвърдените условия.`
    );
  }

  return lines.join("\n");
}

/**
 * Генерира съдържанието за точка „3. ПРЕСТОЙ, НАСТАНЯВАНЕ И ТРАНСПОРТ" от Доклада за командировка.
 * Автоматично отчита ранно отпадане на състезатели, липса на нощувка, съкратен престой
 * и преизчислени дневни/квартирни във ведомостта.
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

  const athletesStats: PersonStat[] = trip.participantsIds.map((pid) => {
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

  if (reducedAthletes.length > 0) {
    return buildReducedStayText(reducedAthletes, fullStayAthletes, coachStat);
  }

  // Общо съкращаване на отбора (всички са се върнали по-рано)
  if (defDays < plannedDays || defNights < plannedNights) {
    const dayWord = defDays === 1 ? "ден" : "дни";
    const nightWord = defNights === 1 ? "нощувка" : "нощувки";
    return `Отборът приключи своето участие по-рано от предвиденото в предварителния график. Реалният престой на целия състав бе ${defDays} ${dayWord} и ${defNights} ${nightWord} (вместо планираните ${plannedDays} дни / ${plannedNights} нощи). Финансовата ведомост за командировъчни разходи е преизчислена за действително реализирания брой дни и нощувки.`;
  }

  // Пълен престой по график
  const dayWord = plannedDays === 1 ? "ден" : "дни";
  const nightWord = plannedNights === 1 ? "нощувка" : "нощувки";
  return `Пътуването и престоят се осъществиха изцяло съгласно предварителния план и утвърдените условия (общо ${plannedDays} ${dayWord} и ${plannedNights} ${nightWord}). Всички участници проведоха пълния престой и ползваха предвидените нощувки.`;
}

/**
 * Генерира целия текст на Доклада за командировка по подразбиране,
 * като интегрира автоматично информацията за реалния престой и отпадналите състезатели.
 */
export function generateDefaultReportText(
  trip: BusinessTrip,
  membersDict: Record<string, Member>,
  attachMatchProtocols: boolean = false
): string {
  const site = getSiteConfig();
  const coach = membersDict[trip.coachId];
  const coachName =
    trip.coachName ||
    (coach ? `${coach.firstName} ${coach.lastName}` : "Треньор/Ръководител");
  const coachRole =
    trip.coachRole || (coach?.isCoach ? "Треньор" : "Ръководител");

  const athletesNames = trip.participantsIds
    .map((id) => membersDict[id])
    .filter(Boolean)
    .filter((m) => !m.isCoach)
    .map((m) => `${m.firstName} ${m.lastName}`);

  const athletesCount = athletesNames.length;
  const athletesStr =
    athletesCount > 0 ? athletesNames.join(", ") : "състезателите на клуба";

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

  const startStr = fmtDate(trip.startDate);
  const endStr = fmtDate(trip.endDate);
  const dest = trip.destination || "мястото на състезанието";

  const protocolLine = attachMatchProtocols
    ? `\n• Официални съдийски протоколи от изиграните срещи на състезателите;`
    : "";

  const staySection = buildStaySectionText(trip, membersDict);

  return `1. ПРОВЕЖДАНЕ И ОФИЦИАЛНО УЧАСТИЕ:\nВ периода от ${startStr} г. до ${endStr} г. отборът на „${site.name}" взе участие в ${trip.title}, проведено в ${dest}. В състезанието участваха ${athletesCount} състезатели под ръководството на ${coachName} (${coachRole}).\n\n2. ПОСТИГНАТИ РЕЗУЛТАТИ И СПОРТНО-ТЕХНИЧЕСКА ОЦЕНКА:\nСъстезателите (${athletesStr}) се състезаваха в определените дисциплини и възрастови групи съгласно Държавния спортен календар на БФ Бадминтон. Показаха висок спортен дух, дисциплина и стриктно спазване на състезателния правилник. Поставените цели бяха изпълнени.\n\n3. ПРЕСТОЙ, НАСТАНЯВАНЕ И ТРАНСПОРТ:\n${staySection}\n\n4. ЗАКЛЮЧЕНИЕ И ПРИЛОЖЕНИЯ:\nВъзложените задачи със Заповедта за командировка са изпълнени. Към настоящия доклад се прилагат следните отчетни документи:${protocolLine}\n• Присъствен списък / удостоверение за присъствие, заверено от главния съдия/домакина;\n• Финансова ведомост за изплатени средства;\n• Разходооправдателни документи (фактури за нощувки и разходи).\nНастоящият доклад се представя в законоустановения 3-дневен срок съгласно Наредбата за командировките в страната.`;
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

  // Ако съдържа шаблонен раздел 3 — заменяме само него.
  // Използваме indexOf + slice вместо сложен regex за избягване на backtracking.
  const marker3 = "3. ПРЕСТОЙ";
  const marker4 = "4. ЗАКЛЮЧЕНИЕ";
  const idx3 = existingText.toUpperCase().indexOf(marker3.toUpperCase());
  if (idx3 !== -1) {
    const idx4 = existingText
      .toUpperCase()
      .indexOf(marker4.toUpperCase(), idx3);
    const before = existingText.slice(0, idx3);
    const after = idx4 !== -1 ? "\n" + existingText.slice(idx4) : "";
    return `${before}3. ПРЕСТОЙ, НАСТАНЯВАНЕ И ТРАНСПОРТ:\n${stayText}${after}`;
  }

  // Ако не следва точния шаблон, прибавяме забележката
  return `${existingText}\n\n3. ПРЕСТОЙ И НАСТАНЯВАНЕ (АКТУАЛИЗИРАНО):\n${stayText}`;
}
