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

/**
 * Форматира наименованието на юридическото лице/организация съгласно българския правопис.
 * Предотвратява дублирани и неправилно вложени кавички:
 * 'СНЦ "Бадминтон клуб Гълъбово"' -> 'СНЦ „Бадминтон клуб Гълъбово“'
 * 'СНЦ "Бадминтон клуб Гълъбово"', true -> 'СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“'
 */
export function formatOrgName(name?: string, toUpper = false): string {
  if (!name) return "";
  let clean = name.trim();

  // Премахване на случайни кавички преди СНЦ / Сдружение / СК / БК
  clean = clean.replace(
    /^[„"']+\s*(СНЦ|Сдружение(?:[^„"']*)|СК|БК|ФК)(?=\s|$)/iu,
    "$1"
  );

  // Нормализиране на завършващи двойни/смесени кавички като "" или "“ или “"
  clean = clean.replace(/["“”]{2,}$/, '"');
  clean = clean.replace(/“["“”]+$/g, "“");

  // Замяна на прави кавички "..." с български типографски кавички „...“
  if (clean.includes('"')) {
    clean = clean.replace(/"([^"]+)"/g, "„$1“");
  } else if (!clean.includes("„") && !clean.includes("“")) {
    const match = clean.match(/^(СНЦ|Сдружение(?:[^„"]*)|СК|БК|ФК)\s+(.+)$/i);
    if (match) {
      clean = `${match[1]} „${match[2].trim()}“`;
    } else {
      const inner = clean.replace(/^[„"']+|["'“]+$/g, "").trim();
      clean = `„${inner}“`;
    }
  }

  // Окончателно почистване ако е останала двойна кавичка на края
  clean = clean.replace(/“["“”]+$/g, "“");

  return toUpper ? clean.toUpperCase() : clean;
}

/**
 * Изчиства евентуални дублирани кавички в свободен текст на протокол
 */
/**
 * Определя дали дадено лице е от женски пол въз основа на картотеката или българската граматика.
 * (напр. "Мира Георгиева" -> true, "Невена Георгиева" -> true, "Пламен Михалев" -> false).
 */
export function isFemalePerson(
  name?: string,
  membersDict?: Record<string, Member>
): boolean {
  if (!name) return false;
  const clean = name.trim();

  // 1. Проверка в картотеката с членове
  if (membersDict) {
    const member = Object.values(membersDict).find(
      (m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase() === clean.toLowerCase() ||
        `${m.lastName} ${m.firstName}`.toLowerCase() === clean.toLowerCase() ||
        clean.toLowerCase().includes(m.firstName.toLowerCase())
    );
    if (member?.gender === "female") return true;
    if (member?.gender === "male") return false;
  }

  // 2. Български ономастични правила:
  const parts = clean.split(/\s+/).filter(Boolean);
  const firstName = parts[0]?.toLowerCase() || "";
  const lastName = parts[parts.length - 1]?.toLowerCase() || "";

  // Мъжки имена с традиционно окончание на -а / -я:
  const maleExceptions = new Set([
    "никола",
    "сава",
    "илиа",
    "илия",
    "коста",
    "лука",
    "страхил",
  ]);

  if (maleExceptions.has(firstName)) return false;

  // Фамилии на -ва / -на / -ска са категорично женски
  if (/(?:ва|на|ска|цка)$/iu.test(lastName)) return true;

  // Първи имена на -а или -я (Мира, Мария, Елена, Невена, Десислава...)
  if (/[ая]$/iu.test(firstName)) return true;

  return false;
}

/**
 * Изчиства евентуални дублирани кавички и остарели фрази в свободен текст на протокол
 */
export function cleanProtocolText(
  text?: string,
  isFemale?: boolean,
  clubName?: string
): string {
  if (!text) return "";
  let res = text
    // Оправя „СНЦ "..."“ или „СНЦ „...““ -> СНЦ „...“
    .replace(
      /[„"]\s*(СНЦ|Сдружение(?:[^„"]*)|СК|БК|ФК)\s+[„"]([^"”]+)["”]\s*[“"]/giu,
      "$1 „$2“"
    )
    .replace(
      /[„"]\s*(СНЦ|Сдружение(?:[^„"]*)|СК|БК|ФК)\s+[„"]([^"”]+)["”]/giu,
      "$1 „$2“"
    )
    // Оправя дублирани завършващи кавички като "" или "“ или “"
    .replace(/["“”]{2,}/g, "“");

  // Автоматично коригира стара формулировка за покана, ако е била записана преди
  if (/поканата от БФ Бадминтон/iu.test(res)) {
    const pronoun = isFemale ? "Тя" : "Той";
    res = res
      .replace(
        /(?:Той|Тя)\s+запозна членовете с поканата от БФ Бадминтон,\s*графика на състезанието/giu,
        `${pronoun} запозна присъстващите с провеждането на предстоящото състезание съгласно Спортния календар на БФ Бадминтон`
      )
      .replace(
        /поканата от БФ Бадминтон,\s*графика на състезанието/giu,
        "Спортния календар на БФ Бадминтон"
      );
  }

  // Премахване на цитиране на конкретни членове от ЗЮЛНЦ в кворума
  res = res.replace(
    /съгласно чл\.\s*\d+\s*от ЗЮЛНЦ и разпоредбите на Устава/giu,
    "съгласно Устава на сдружението"
  );

  // Граматическо съгласуване по род за председателя
  if (isFemale) {
    res = res.replace(/\bТой запозна\b/gu, "Тя запозна");
    res = res.replace(
      /бе определен\s+([^\n,]+)(?=,\s*а за протоколчик)/gu,
      "бе определена $1"
    );
  }

  // Замяна на "клубния отбор" с името на клуба при т. 1 от решението
  res = res.replace(
    /Одобрява участието на клубния отбор в/giu,
    `Одобрява участието на ${formatOrgName(clubName || "Бадминтон клуб Гълъбово")} в`
  );

  // Премахване на вписване в протоколна книга от стари/съществуващи записи
  res = res.replace(/\s*и се вписва в протоколната книга на клуба\.?/giu, ".");

  return res;
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

  const isChairFemale = isFemalePerson(chair, membersDict);
  const chairPronoun = isChairFemale ? "Тя" : "Той";
  const chairDetermined = isChairFemale ? "определена" : "определен";

  const defaultBoardMembers =
    secretary && secretary.toLowerCase() !== "член на ус"
      ? `1. ${chair} — Председател на Управителния съвет\n2. ${secretary} — Член на Управителния съвет (редовно уведомен по установения ред)`
      : `1. ${chair} — Председател на Управителния съвет\n2. Членове на Управителния съвет (редовно уведомени по установения ред)`;
  const boardMembers =
    options?.boardMembers || trip.usBoardMembers || defaultBoardMembers;

  const notesText = trip.usDecisionNotes?.trim()
    ? `\n5. ${trip.usDecisionNotes.trim()}`
    : "";

  const calendarOrg = trip.organizer?.trim() || "БФ Бадминтон";

  return cleanProtocolText(
    `Днес, ${decisionDateFmt} г., в ${meetingLocation}, в ${meetingTime} се проведе редовно заседание на Управителния съвет на ${formatOrgName(site.name)}.

ПРИСЪСТВАТ ЧЛЕНОВЕТЕ НА УПРАВИТЕЛНИЯ СЪВЕТ:
${boardMembers}

Председателят констатира, че е налице необходимият съгласно Устава на сдружението кворум. Заседанието е законно конституирано и може да взема валидни решения. За водещ заседанието бе ${chairDetermined} ${chair}, а за протоколчик — ${secretary}.

ДНЕВЕН РЕД:
Точка 1: Обсъждане и вземане на решение за официално участие на представителния клубен отбор в състезание съгласно Държавния спортен календар на ${calendarOrg}: ${trip.title} (гр./място ${destCity}, период ${periodStr}), утвърждаване на клубна делегация и финансово обезпечаване на разходите.

ПО ТОЧКА 1 ОТ ДНЕВНИЯ РЕД:
Думата бе дадена на Председателя на УС ${chair}. ${chairPronoun} запозна присъстващите с предстоящото участие на клуба в състезанието съгласно Спортния календар на ${calendarOrg} — ${trip.title}, провеждащо се в ${destCity} в периода ${periodStr}. ${chairPronoun} представи информацията за турнира и предложи клубна делегация в общ брой от ${countStr} (Ръководител/Треньор: ${coachName} и състезатели: ${playersList}). Направена бе финансова план-сметка за пътни, дневни и нощувки съгласно Наредбата за командировките в страната (НКС).

След проведени обсъждания и разисквания, заседанието пристъпи към гласуване.
Резултат от гласуването: „ЗА“ — единодушно (100%), „ПРОТИВ“ — няма, „ВЪЗДЪРЖАЛИ СЕ“ — няма.

ВЪЗ ОСНОВА НА РЕЗУЛТАТИТЕ ОТ ГЛАСУВАНЕТО, УПРАВИТЕЛНИЯТ СЪВЕТ ПРИЕ СЛЕДНОТО РЕШЕНИЕ № ${decisionNum}:
1. Одобрява участието на ${formatOrgName(site.shortName)} в ${trip.title} (${destCity}) в периода ${periodStr}.
2. Утвърждава поименния състав на делегацията с ръководител ${coachName}.
3. Одобрява финансовото обезпечаване (пътни, дневни и квартирни пари) съгласно НКС и бюджета на клуба.
4. Възлага на Председателя на УС да издаде Заповед за командировка № ${orderNum} и окомплектова счетоводното досие на състезанието.${notesText}

Поради изчерпване на дневния ред заседанието на Управителния съвет бе закрито. Настоящият протокол № ${protocolNum} се съставя в удостоверение на взетите решения.`,
    isChairFemale,
    site.shortName
  );
}

/**
 * Извлича имената на членовете на УС от текста на кворума (usBoardMembers).
 * Премахва номерация (1., 2.), булети (-, •), длъжности (— Член на УС...) и бележки в скоби.
 * Филтрира общи формулировки (напр. "Членове на Управителния съвет...") и председателя,
 * тъй като председателят се подписва отделно в полето "ПРЕДСЕДАТЕЛ НА ЗАСЕДАНИЕТО".
 */
export function extractBoardMembers(
  boardMembersText?: string,
  chairName?: string
): string[] {
  if (!boardMembersText || !boardMembersText.trim()) return [];
  const lines = boardMembersText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const cleanChair = chairName ? chairName.trim().toLowerCase() : "";
  const members: string[] = [];

  for (const line of lines) {
    // Премахва водеща номерация или булети: "1.", "2)", "•", "-" и т.н.
    const withoutNum = line.replace(/^[\s\d\.\)\-–—•*]+/u, "").trim();
    if (!withoutNum) continue;

    // Игнорираме служебни и общи редове, които не съдържат конкретно лице
    if (/^членове\s+на\s+управителния/iu.test(withoutNum)) continue;
    if (/^управителен\s+съвет/iu.test(withoutNum)) continue;
    if (/^присъстват/iu.test(withoutNum)) continue;

    // Взимаме името преди тире (—, –, -), двоеточие, запетая или отваряща скоба
    const nameMatch = withoutNum.match(/^([^—–\-–:,\(\n]+)/u);
    let rawName = (nameMatch ? nameMatch[1] : withoutNum).trim();

    // Изчистваме обръщения и титли
    rawName = rawName
      .replace(/^(?:г-н|г-жа|инж\.|д-р)\s+/iu, "")
      .replace(/\s+(?:член|председател).*$/iu, "")
      .trim();

    if (!rawName || rawName.length < 3) continue;
    if (/^членове\b/iu.test(rawName)) continue;

    // Ако името съвпада с председателя, го пропускаме (председателят е в отделна колона)
    if (cleanChair && rawName.toLowerCase() === cleanChair) continue;

    if (!members.includes(rawName)) {
      members.push(rawName);
    }
  }

  return members;
}
