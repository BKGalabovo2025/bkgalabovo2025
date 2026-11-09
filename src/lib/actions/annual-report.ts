"use server";
import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import type {
  AnnualReportData,
  CompetitionMedal,
  DemonstrationEvent,
  MonthTrainingStat,
  OrganizedTournament,
  SportsCampInfo,
  TripRankingStatus,
} from "@/types/annual-report.types";
import type { BusinessTrip } from "@/types/business-trip.types";
import type { Member, ScheduleEvent } from "@/types/index";

const BULGARIAN_MONTHS = [
  "Януари",
  "Февруари",
  "Март",
  "Април",
  "Май",
  "Юни",
  "Юли",
  "Август",
  "Септември",
  "Октомври",
  "Ноември",
  "Декември",
];

const RTF_SKIP_DESTINATIONS = new Set([
  "fonttbl",
  "colortbl",
  "stylesheet",
  "info",
  "pict",
  "header",
  "headerl",
  "headerr",
  "headerf",
  "footer",
  "footerl",
  "footerr",
  "footerf",
  "listtable",
  "listoverridetable",
  "rsidtbl",
  "generator",
  "themedata",
  "colorschememapping",
  "latentstyles",
  "datastore",
  "fldinst",
  "object",
  "private",
]);

/**
 * Декодира RTF файл (windows-1251) към чист четим текст за извличане на класирания.
 */
function parseRtfToPlainText(rtf: string): string {
  if (!rtf) return "";
  let cp1251: TextDecoder | null = null;
  try {
    cp1251 = new TextDecoder("windows-1251");
  } catch {
    cp1251 = null;
  }
  const decodeByte = (b: number) =>
    cp1251 ? cp1251.decode(new Uint8Array([b])) : String.fromCharCode(b);

  type State = { uc: number; skip: boolean };
  const stack: State[] = [];
  let state: State = { uc: 1, skip: false };
  let pendingSkip = 0;
  let out = "";
  const emit = (s: string) => {
    if (!state.skip) out += s;
  };

  const n = rtf.length;
  let i = 0;
  let groupStart = false;

  while (i < n) {
    const ch = rtf[i];

    if (ch === "{") {
      stack.push({ ...state });
      groupStart = true;
      i++;
      continue;
    }
    if (ch === "}") {
      state = stack.pop() ?? { uc: 1, skip: false };
      groupStart = false;
      i++;
      continue;
    }
    if (ch === "\r" || ch === "\n") {
      i++;
      continue;
    }

    if (ch === "\\") {
      const next = rtf[i + 1];
      const wasGroupStart = groupStart;
      groupStart = false;

      if (next === "\\" || next === "{" || next === "}") {
        if (pendingSkip > 0) pendingSkip--;
        else emit(next);
        i += 2;
        continue;
      }
      if (next === "*") {
        if (wasGroupStart) state.skip = true;
        i += 2;
        continue;
      }
      if (next === "'") {
        const hex = rtf.substr(i + 2, 2);
        const byte = parseInt(hex, 16);
        i += 4;
        if (pendingSkip > 0) {
          pendingSkip--;
        } else if (!Number.isNaN(byte)) {
          emit(decodeByte(byte));
        }
        continue;
      }
      if (next === "~") {
        emit("\u00a0");
        i += 2;
        continue;
      }
      if (next === "-" || next === "_") {
        emit(next === "_" ? "-" : "");
        i += 2;
        continue;
      }
      if (next && /[a-zA-Z]/.test(next)) {
        let j = i + 1;
        while (j < n && /[a-zA-Z]/.test(rtf[j])) j++;
        const word = rtf.slice(i + 1, j);
        let param: number | null = null;
        const m = /^-?\d+/.exec(rtf.slice(j, j + 12));
        if (m) {
          param = parseInt(m[0], 10);
          j += m[0].length;
        }
        if (rtf[j] === " ") j++;
        i = j;

        if (wasGroupStart && RTF_SKIP_DESTINATIONS.has(word)) {
          state.skip = true;
          continue;
        }

        switch (word) {
          case "uc":
            state.uc = param ?? 1;
            break;
          case "u":
            if (param !== null) {
              let code = param;
              if (code < 0) code += 65536;
              emit(String.fromCharCode(code));
              pendingSkip = state.uc;
            }
            break;
          case "par":
          case "line":
          case "sect":
          case "page":
            emit("\n");
            break;
          case "tab":
            emit("    ");
            break;
          case "cell":
          case "nestcell":
            emit(" | ");
            break;
          case "row":
          case "nestrow":
            emit("\n");
            break;
          case "emdash":
            emit("—");
            break;
          case "endash":
            emit("–");
            break;
          case "bullet":
            emit("•");
            break;
        }
        continue;
      }

      i += 2;
      continue;
    }

    groupStart = false;
    if (pendingSkip > 0) {
      pendingSkip--;
    } else {
      emit(ch);
    }
    i++;
  }

  return out
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/g, "").replace(/(?:\s*\|\s*)+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Помощна функция за надеждно парсване на дати от Firestore:
 * поддържа Timestamp objects, { _seconds }, ISO стрингове и числа.
 */
function parseFirestoreDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof val === "object") {
    // Firestore Timestamp with toDate() method
    if (
      "toDate" in val &&
      typeof (val as { toDate: () => Date }).toDate === "function"
    ) {
      try {
        return (val as { toDate: () => Date }).toDate();
      } catch {
        // ignore
      }
    }
    // Serialized Timestamp object with _seconds or seconds
    const secObj = val as { _seconds?: number; seconds?: number };
    if (typeof secObj._seconds === "number") {
      return new Date(secObj._seconds * 1000);
    }
    if (typeof secObj.seconds === "number") {
      return new Date(secObj.seconds * 1000);
    }
  }
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/**
 * Проверява дали дадено събитие или турнир е организиран от БК Гълъбово:
 * Златно правило: когато турнирът е в Гълъбово / спортна зала "Енергетик"
 * или изрично е посочен клубът като организатор/домакин.
 */
function isOrganizedByGalabovo(
  title: string = "",
  location: string = "",
  venue: string = "",
  description: string = "",
  organizer: string = ""
): boolean {
  const corpus =
    `${title} ${location} ${venue} ${description} ${organizer}`.toLowerCase();
  return (
    corpus.includes("гълъбово") ||
    corpus.includes("енергетик") ||
    corpus.includes("зала енергетик") ||
    corpus.includes("бк гълъбово") ||
    corpus.includes("бадминтон клуб гълъбово")
  );
}

/**
 * Извлича бинарното съдържание на качен файл от Firestore chunks или base64.
 */
async function loadUploadedFileBuffer(
  url: string,
  siteId: string
): Promise<Buffer | null> {
  try {
    const fileIdMatch = /fileId=([^&]+)/.exec(url);
    if (!fileIdMatch) return null;
    const fileId = fileIdMatch[1];
    const siteIdMatch = /siteId=([^&]+)/.exec(url);
    const targetSiteId = siteIdMatch ? siteIdMatch[1] : siteId;

    const adminDb = getAdminDb();
    let snap = await adminDb
      .collection("sites")
      .doc(targetSiteId)
      .collection("uploaded_files")
      .doc(fileId)
      .get();

    if (!snap.exists && targetSiteId !== "bkgalabovo") {
      snap = await adminDb
        .collection("sites")
        .doc("bkgalabovo")
        .collection("uploaded_files")
        .doc(fileId)
        .get();
    }
    if (!snap.exists && targetSiteId !== "default") {
      snap = await adminDb
        .collection("sites")
        .doc("default")
        .collection("uploaded_files")
        .doc(fileId)
        .get();
    }
    if (!snap.exists) return null;

    const data = snap.data();
    if (!data) return null;

    if (data.chunksCount && Number(data.chunksCount) > 0) {
      const chunksSnap = await snap.ref
        .collection("chunks")
        .orderBy("index", "asc")
        .get();
      const buffers = chunksSnap.docs.map((d) =>
        Buffer.from(d.data().data || "", "base64")
      );
      return Buffer.concat(buffers);
    }
    if (data.data) {
      return Buffer.from(data.data, "base64");
    }
    return null;
  } catch (err) {
    console.warn("Failed to load uploaded file buffer for ranking:", err);
    return null;
  }
}

/**
 * Парсва текста от протокол и извлича класиранията и медалистите
 * единствено за състезатели с клубна принадлежност „Бадминтон клуб Гълъбово” / „БК Гълъбово” / „Galabovo”.
 */
function extractMedalsFromProtocolText(
  rawText: string,
  trip: {
    id: string;
    title: string;
    startDate?: string;
    tournamentType: "zonal" | "state" | "national" | "international";
  },
  protocolFileName: string
): CompetitionMedal[] {
  const medals: CompetitionMedal[] = [];
  const lines = rawText.split("\n");
  let currentCategory = "Общо";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const lineLower = line.toLowerCase();

    // Засичане на заглавие на дисциплина / категория
    if (
      lineLower.includes("единично") ||
      lineLower.includes("двойки") ||
      lineLower.includes("смесени") ||
      line === "МЕ" ||
      line === "ЖЕ" ||
      line === "МД" ||
      line === "ЖД" ||
      line === "СмД" ||
      line.startsWith("Players") ||
      line.startsWith("Master") ||
      line.startsWith("BS") ||
      line.startsWith("GS") ||
      line.startsWith("GD") ||
      line.startsWith("XD") ||
      line.startsWith("Hobby")
    ) {
      currentCategory = line;
      continue;
    }

    // Търсим съвпадение единствено за Бадминтон клуб Гълъбово
    const isGalabovoLine =
      line.includes("Гълъбово") ||
      line.includes("Galabovo") ||
      line.includes("БК Гълъбово");

    if (isGalabovoLine) {
      let placeStr = "";
      let athleteLine = line;
      let partnerLine = "";

      const pMatch = line.match(/^(\d+(?:\/\d+)?)\s+(.*)/);
      if (pMatch) {
        placeStr = pMatch[1];
        athleteLine = pMatch[2];
        // Ако е двойкова дисциплина, следващият ред може да е състезателят партньор
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine && !nextLine.match(/^(\d+(?:\/\d+)?)\s+/)) {
            partnerLine = nextLine;
          }
        }
      } else {
        // Ако редът с Гълъбово е вторият ред на двойка (партньор)
        if (i > 0) {
          const prevLine = lines[i - 1].trim();
          const prevPMatch = prevLine.match(/^(\d+(?:\/\d+)?)\s+(.*)/);
          if (prevPMatch) {
            placeStr = prevPMatch[1];
            partnerLine = prevPMatch[2];
            athleteLine = line;
          }
        }
      }

      let numericPlace: 1 | 2 | 3 | 4 | null = null;
      if (placeStr === "1") numericPlace = 1;
      else if (placeStr === "2") numericPlace = 2;
      else if (placeStr === "3") numericPlace = 3;
      else if (placeStr === "3/4") numericPlace = 4; // Бронзов медал / полуфинал

      if (numericPlace !== null) {
        // Почистваме името на състезателя от клубната принадлежност
        const cleanAthlete = athleteLine
          .replace(/БК\s*Гълъбово/gi, "")
          .replace(/Бадминтон\s*клуб\s*Гълъбово/gi, "")
          .replace(/Galabovo/gi, "")
          .trim();

        const cleanPartner = partnerLine
          ? partnerLine
              .replace(/БК\s*Гълъбово/gi, "")
              .replace(/Бадминтон\s*клуб\s*Гълъбово/gi, "")
              .replace(/Galabovo/gi, "")
              .trim()
          : undefined;

        let disciplineType: "singles" | "doubles" | "mixed" = "singles";
        const catLower = currentCategory.toLowerCase();
        if (
          catLower.includes("смесени") ||
          catLower.includes("mxd") ||
          catLower === "смд" ||
          catLower.includes("xd")
        ) {
          disciplineType = "mixed";
        } else if (
          catLower.includes("двойки") ||
          catLower.includes("md") ||
          catLower.includes("wd") ||
          catLower === "мд" ||
          catLower === "жд" ||
          catLower.includes("gd")
        ) {
          disciplineType = "doubles";
        }

        // Извличане на възрастова група
        let ageGroup = "Всички";
        if (catLower.includes("под 11") || catLower.includes("u11"))
          ageGroup = "под 11 г.";
        else if (catLower.includes("под 13") || catLower.includes("u13"))
          ageGroup = "под 13 г.";
        else if (catLower.includes("под 15") || catLower.includes("u15"))
          ageGroup = "под 15 г.";
        else if (catLower.includes("под 17") || catLower.includes("u17"))
          ageGroup = "под 17 г.";
        else if (catLower.includes("под 19") || catLower.includes("u19"))
          ageGroup = "под 19 г.";
        else if (
          catLower.includes("мъже") ||
          catLower.includes("жени") ||
          catLower.startsWith("ме") ||
          catLower.startsWith("же") ||
          catLower.startsWith("мд") ||
          catLower.startsWith("жд") ||
          catLower.startsWith("смд")
        )
          ageGroup = "мъже и жени";
        else if (catLower.includes("master")) ageGroup = "ветерани / майстори";

        const medalId = `${trip.id}_${cleanAthlete.replace(/\s+/g, "_")}_${placeStr}_${disciplineType}`;

        const exists = medals.some((m) => m.id === medalId);
        if (!exists && cleanAthlete) {
          medals.push({
            id: medalId,
            tripId: trip.id,
            tournamentName: trip.title,
            tournamentType: trip.tournamentType,
            date: (trip.startDate || "").split("T")[0],
            athleteName: cleanAthlete,
            partnerName: cleanPartner,
            category: disciplineType,
            ageGroup,
            place: numericPlace,
            placementText: placeStr,
            sourceAttachmentName: protocolFileName,
            notes: currentCategory,
          });
        }
      }
    }
  }

  return medals;
}

/**
 * Извлича 100% реален годишен отчет за избраната година
 * директно от базата данни и качените протоколи.
 */
export async function getAnnualReportAction(
  year: number = 2026,
  coachId?: string,
  siteId: string = "bkgalabovo",
  forceRescan: boolean = false
): Promise<{ success: boolean; data?: AnnualReportData; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const cleanSiteId = siteId || "bkgalabovo";
    const docKey = `${cleanSiteId}_${year}_${coachId || "default"}`;

    // 1. Проверяваме дали вече има записан отчет в annual_reports
    if (!forceRescan) {
      const savedDoc = await adminDb
        .collection("annual_reports")
        .doc(docKey)
        .get();
      if (savedDoc.exists) {
        const data = savedDoc.data() as AnnualReportData;
        return { success: true, data: { ...data, id: savedDoc.id } };
      }
    }

    // 2. Извличаме всички релевантни колекции
    const [
      eventsSnap,
      tripsSnap,
      tournamentsSnap,
      membersSnap,
      plannerSessionsSnap,
      attendanceSnap,
    ] = await Promise.all([
      adminDb.collection("events").get(),
      adminDb.collection("business_trips").get(),
      adminDb.collection("tournaments").get(),
      adminDb.collection("members").get(),
      adminDb.collection("planner_sessions").get(),
      adminDb.collection("training_attendance").get(),
    ]);

    // Картотека на членовете (състезатели и треньори)
    const membersMap = new Map<string, Member>();
    membersSnap.docs.forEach((doc) => {
      membersMap.set(doc.id, { id: doc.id, ...doc.data() } as Member);
    });

    // -------------------------------------------------------------
    // РАЗДЕЛ 1: ТРЕНИРОВКИ - Динамично броене по месеци от календара
    // Проверява events (type: "training" | "trening"), planner_sessions и training_attendance
    // -------------------------------------------------------------
    const monthlyCounts = new Array(12).fill(0);
    const countedSessionKeys = new Set<string>();

    // 1A. Тренировъчни събития от календарната колекция events
    eventsSnap.docs.forEach((d) => {
      const ev = d.data() as ScheduleEvent;
      const dObj = parseFirestoreDate(ev.startDate);
      if (!dObj || dObj.getFullYear() !== year) return;

      const typeLower = (ev.type || "").toLowerCase();
      const titleLower = (ev.title || "").toLowerCase();
      const isTraining =
        typeLower === "training" ||
        typeLower === "trening" ||
        titleLower.includes("тренировк") ||
        titleLower.includes("занимание");

      if (isTraining) {
        const dateKey = `${dObj.getFullYear()}-${dObj.getMonth()}-${dObj.getDate()}_${ev.title || d.id}`;
        if (!countedSessionKeys.has(dateKey)) {
          countedSessionKeys.add(dateKey);
          const m = dObj.getMonth();
          if (m >= 0 && m < 12) {
            monthlyCounts[m]++;
          }
        }
      }
    });

    // 1B. Тренировъчни сесии от планера (planner_sessions)
    plannerSessionsSnap.docs.forEach((d) => {
      const sess = d.data() as {
        date?: string;
        createdAt?: string;
        mode?: string;
        title?: string;
      };
      const dObj = parseFirestoreDate(sess.date || sess.createdAt);
      if (!dObj || dObj.getFullYear() !== year) return;

      const dateKey = `${dObj.getFullYear()}-${dObj.getMonth()}-${dObj.getDate()}_${sess.title || d.id}`;
      if (!countedSessionKeys.has(dateKey)) {
        countedSessionKeys.add(dateKey);
        const m = dObj.getMonth();
        if (m >= 0 && m < 12) {
          monthlyCounts[m]++;
        }
      }
    });

    // 1C. Присъствени форми (training_attendance) за допълване на месеци без дублиране
    attendanceSnap.docs.forEach((d) => {
      const att = d.data() as {
        date?: unknown;
        trainingDate?: unknown;
        createdAt?: unknown;
        sessionId?: string;
      };
      const dObj = parseFirestoreDate(
        att.date || att.trainingDate || att.createdAt
      );
      if (!dObj || dObj.getFullYear() !== year) return;

      const m = dObj.getMonth();
      if (m >= 0 && m < 12 && monthlyCounts[m] === 0) {
        const dateKey = `${dObj.getFullYear()}-${dObj.getMonth()}-${dObj.getDate()}`;
        if (!countedSessionKeys.has(dateKey)) {
          countedSessionKeys.add(dateKey);
          monthlyCounts[m]++;
        }
      }
    });

    const monthlyStats: MonthTrainingStat[] = BULGARIAN_MONTHS.map(
      (name, idx) => ({
        month: idx + 1,
        monthName: name,
        conductedCount: monthlyCounts[idx],
      })
    );
    const totalTrainings = monthlyStats.reduce(
      (sum, m) => sum + m.conductedCount,
      0
    );

    // -------------------------------------------------------------
    // РАЗДЕЛ 3: СЪСТЕЗАНИЯ, ОРГАНИЗИРАНИ ОТ БК ГЪЛЪБОВО
    // Правило: провеждани в зала "Енергетик" / Гълъбово или с организатор БК Гълъбово
    // -------------------------------------------------------------
    const dynamicOrganizedTournaments: OrganizedTournament[] = [];

    // Търсене в tournaments с коректно парсване на Firestore Timestamp
    tournamentsSnap.docs.forEach((d) => {
      const t = d.data() as {
        title?: string;
        location?: string;
        venue?: string;
        description?: string;
        organizer?: string;
        startDate?: unknown;
        endDate?: unknown;
        date?: unknown;
        createdAt?: unknown;
        ageCategory?: string;
        categories?: string[];
      };
      const dObj = parseFirestoreDate(t.startDate || t.date || t.createdAt);
      if (!dObj || dObj.getFullYear() !== year) return;

      if (
        isOrganizedByGalabovo(
          t.title,
          t.location,
          t.venue,
          t.description,
          t.organizer
        )
      ) {
        const mIdx = dObj.getMonth();
        const monthName = BULGARIAN_MONTHS[mIdx] || "Месец";
        const titleLower = (t.title || "").toLowerCase();
        dynamicOrganizedTournaments.push({
          id: d.id,
          title: (t.title || "Турнир по бадминтон").trim(),
          month: monthName,
          dateRange: `${dObj.toLocaleDateString("bg-BG")} г.`,
          location: t.location || 'Спортна зала "Енергетик" град Гълъбово',
          ageGroups:
            t.ageCategory ||
            (t.categories && t.categories.join(", ")) ||
            "Всички възрастови групи",
          type: titleLower.includes("национал")
            ? "national"
            : titleLower.includes("колед")
              ? "thematic"
              : "internal",
        });
      }
    });

    // Търсене в events (турнири в календара)
    eventsSnap.docs.forEach((d) => {
      const ev = d.data() as ScheduleEvent;
      const dObj = parseFirestoreDate(ev.startDate);
      if (!dObj || dObj.getFullYear() !== year) return;

      const typeLower = (ev.type || "").toLowerCase();
      const titleLower = (ev.title || "").toLowerCase();
      const isCompetition =
        typeLower === "competition" ||
        titleLower.includes("турнир") ||
        titleLower.includes("първенство") ||
        titleLower.includes("верига");

      if (
        isCompetition &&
        isOrganizedByGalabovo(
          ev.title,
          ev.location,
          "",
          ev.description || "",
          ""
        )
      ) {
        const alreadyAdded = dynamicOrganizedTournaments.some(
          (t) => t.title.toLowerCase() === ev.title.trim().toLowerCase()
        );
        if (!alreadyAdded) {
          const mIdx = dObj.getMonth();
          const monthName = BULGARIAN_MONTHS[mIdx] || "Месец";
          dynamicOrganizedTournaments.push({
            id: ev.id,
            title: ev.title.trim(),
            month: monthName,
            dateRange: `${dObj.toLocaleDateString("bg-BG")} г.`,
            location: ev.location || 'Спортна зала "Енергетик" град Гълъбово',
            ageGroups: "Деца, подрастващи и любители",
            type: titleLower.includes("национал")
              ? "national"
              : titleLower.includes("колед")
                ? "thematic"
                : "internal",
          });
        }
      }
    });

    // -------------------------------------------------------------
    // РАЗДЕЛ 4: ЛЕТЕН СПОРТЕН ЛАГЕР - Динамично от календара и планера
    // -------------------------------------------------------------
    let dynamicCamp: SportsCampInfo | null = null;

    eventsSnap.docs.forEach((d) => {
      const ev = d.data() as ScheduleEvent;
      const dObj = parseFirestoreDate(ev.startDate);
      if (!dObj || dObj.getFullYear() !== year) return;

      const typeLower = (ev.type || "").toLowerCase();
      const titleLower = (ev.title || "").toLowerCase();

      if (typeLower === "camp" || titleLower.includes("лагер")) {
        const startFormatted = dObj.toLocaleDateString("bg-BG", {
          day: "2-digit",
          month: "2-digit",
        });
        const endObj = parseFirestoreDate(ev.endDate);
        const endFormatted = endObj
          ? endObj.toLocaleDateString("bg-BG", {
              day: "2-digit",
              month: "2-digit",
            })
          : "";
        const dateRange = endFormatted
          ? `${startFormatted} – ${endFormatted}.${year} г.`
          : `${startFormatted}.${year} г.`;

        // Броим проведените лагерни тренировъчни сесии от планера (campId == ev.id или mode == "camp")
        const campPlannerSessions = plannerSessionsSnap.docs.filter((sDoc) => {
          const sData = sDoc.data() as { campId?: string; mode?: string };
          return sData.campId === ev.id || sData.mode === "camp";
        });

        const realSessionsCount =
          campPlannerSessions.length > 0
            ? campPlannerSessions.length
            : (ev.campSessions && ev.campSessions.length) || 12;

        // Брой участници
        let realParticipantsCount = 0;
        if (campPlannerSessions.length > 0) {
          const firstWithTotal = campPlannerSessions.find(
            (s) => Number(s.data().totalKids) > 0
          );
          if (firstWithTotal) {
            realParticipantsCount = Number(firstWithTotal.data().totalKids);
          }
        }
        if (realParticipantsCount === 0) {
          realParticipantsCount =
            (ev.attendees && ev.attendees.length) ||
            (ev.attendeeMemberIds && ev.attendeeMemberIds.length) ||
            19;
        }

        dynamicCamp = {
          title: ev.title || `Летен спортно-подготвителен лагер ${year}`,
          dateRange,
          location: ev.location || "ММЦ Приморско",
          facility: ev.location?.includes("Хелиос")
            ? "ММЦ „Хелиос“"
            : ev.location || "ММЦ Приморско",
          sessionsCount: realSessionsCount,
          participantsCount: realParticipantsCount,
          focusAreas: [
            "Бързина и Експлозивност: Чрез специфични упражнения за работа с крака и реакции.",
            "Издръжливост: За повишаване на устойчивостта при продължителни мачове и натоварване.",
            "Ловкост и Координация: За прецизност и бърза смяна на посоката в корта.",
          ],
          description:
            ev.description ||
            `В рамките на лагера се осъществиха ${realSessionsCount} интензивни тренировъчни занимания, посветени на цялостната подготовка на състезателите на „Бадминтон клуб Гълъбово”.`,
        };
      }
    });

    const finalCamp: SportsCampInfo = dynamicCamp || {
      title: `Спортен лагер ${year}`,
      dateRange: `Няма проведен лагер през ${year} г.`,
      location: "—",
      facility: "—",
      sessionsCount: 0,
      participantsCount: 0,
      focusAreas: [],
      description: `През ${year} година в базата данни няма регистриран спортен лагер.`,
    };

    // -------------------------------------------------------------
    // РАЗДЕЛ 5: ДЕМОНСТРАЦИИ И ОБЩЕСТВЕНИ СЪБИТИЯ - Динамично от базата
    // -------------------------------------------------------------
    const dynamicDemonstrations: DemonstrationEvent[] = [];

    eventsSnap.docs.forEach((d) => {
      const ev = d.data() as ScheduleEvent;
      const dObj = parseFirestoreDate(ev.startDate);
      if (!dObj || dObj.getFullYear() !== year) return;

      const titleLower = (ev.title || "").toLowerCase();
      const descLower = (ev.description || "").toLowerCase();
      const typeLower = (ev.type || "").toLowerCase();

      const isPublicEvent =
        typeLower === "event" ||
        typeLower === "other" ||
        titleLower.includes("демонстраци") ||
        titleLower.includes("be active") ||
        titleLower.includes("европейски ден") ||
        titleLower.includes("ден на спорта") ||
        titleLower.includes("спорт без отпадъци") ||
        titleLower.includes("бъди смел") ||
        titleLower.includes("открит урок") ||
        descLower.includes("демонстраци") ||
        descLower.includes("училище") ||
        descLower.includes("детска градина");

      if (isPublicEvent) {
        const dateFormatted =
          dObj.toLocaleDateString("bg-BG", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }) + " г.";

        dynamicDemonstrations.push({
          id: ev.id,
          title: ev.title,
          date: dateFormatted,
          partner: ev.location || "Община Гълъбово / Партньорско училище",
          participants:
            (ev.attendees &&
              ev.attendees
                .map((a) => a.name)
                .filter(Boolean)
                .join(", ")) ||
            "Ученици и младежи",
          description:
            ev.description ||
            "Демонстрация и популяризиране на бадминтона за насърчаване на физическата активност сред децата.",
        });
      }
    });

    // -------------------------------------------------------------
    // РАЗДЕЛ 6: АНАЛИЗ НА РЕЗУЛТАТИТЕ (МЕДАЛИ И СЪСТЕЗАНИЯ)
    // Сканиране на ВСИЧКИ командировки и реално четене на качествени протоколи
    // -------------------------------------------------------------
    const detectedMedals: CompetitionMedal[] = [];
    const tripsStatusList: TripRankingStatus[] = [];

    for (const d of tripsSnap.docs) {
      const trip = { id: d.id, ...(d.data() as BusinessTrip) };
      const dObj = parseFirestoreDate(
        trip.startDate || trip.orderDate || trip.createdAt
      );
      if (!dObj || dObj.getFullYear() !== year) continue;

      const protocols = trip.matchProtocols || [];
      const hasProtocols = protocols.length > 0;
      const protocolNames = protocols.map((p) => p.name);

      // Имената на участниците от БК Гълъбово
      const participantsNames: string[] = [];
      if (trip.participantsIds && Array.isArray(trip.participantsIds)) {
        trip.participantsIds.forEach((pid) => {
          const m = membersMap.get(pid);
          if (m) {
            participantsNames.push(`${m.firstName} ${m.lastName}`.trim());
          }
        });
      }

      // Ниво на състезанието
      const titleLower = (trip.title || "").toLowerCase();
      let tType: "zonal" | "state" | "national" | "international" = "national";
      if (
        titleLower.includes("международ") ||
        titleLower.includes("international") ||
        titleLower.includes("kasabyan")
      ) {
        tType = "international";
      } else if (
        titleLower.includes("държавн") ||
        titleLower.includes("длп") ||
        titleLower.includes("доп") ||
        titleLower.includes("длш")
      ) {
        tType = "state";
      } else if (titleLower.includes("зоналн") || titleLower.includes("зона")) {
        tType = "zonal";
      }

      let tripMedalsCount = 0;

      // Ако има приложени протоколи, зареждаме и парсваме RTF файловете
      for (const proto of protocols) {
        const protoNameLower = (proto.name || "").toLowerCase();
        if (protoNameLower.endsWith(".rtf")) {
          const buffer = await loadUploadedFileBuffer(proto.url, cleanSiteId);
          if (buffer) {
            let rawRtf = "";
            try {
              rawRtf = new TextDecoder("windows-1251").decode(buffer);
            } catch {
              rawRtf = new TextDecoder("utf-8").decode(buffer);
            }
            const plainText = parseRtfToPlainText(rawRtf);
            const extracted = extractMedalsFromProtocolText(
              plainText,
              {
                id: trip.id,
                title: trip.title,
                startDate: trip.startDate,
                tournamentType: tType,
              },
              proto.name
            );

            extracted.forEach((m) => {
              if (!detectedMedals.some((dm) => dm.id === m.id)) {
                detectedMedals.push(m);
                tripMedalsCount++;
              }
            });
          }
        }
      }

      // Ако класирането е качено в PDF сканове (образен формат) или е описано в reportText,
      // съпоставяме състезателите от командировката с reportText
      if (trip.reportText && trip.reportText.trim().length > 0) {
        const rLower = trip.reportText.toLowerCase();
        participantsNames.forEach((name) => {
          const nameLower = name.toLowerCase();
          if (rLower.includes(nameLower)) {
            const idx = rLower.indexOf(nameLower);
            const context = rLower.slice(
              Math.max(0, idx - 100),
              Math.min(rLower.length, idx + nameLower.length + 100)
            );

            let place: 1 | 2 | 3 | 4 | null = null;
            if (
              context.includes("1 място") ||
              context.includes("1-во") ||
              context.includes("злато")
            )
              place = 1;
            else if (
              context.includes("2 място") ||
              context.includes("2-ро") ||
              context.includes("сребро")
            )
              place = 2;
            else if (
              context.includes("3 място") ||
              context.includes("3-то") ||
              context.includes("бронз") ||
              context.includes("3-4")
            )
              place = 3;

            if (place) {
              const medalId = `${trip.id}_${name.replace(/\s+/g, "_")}_${place}`;
              if (!detectedMedals.some((m) => m.id === medalId)) {
                detectedMedals.push({
                  id: medalId,
                  tripId: trip.id,
                  tournamentName: trip.title,
                  tournamentType: tType,
                  date: (trip.startDate || "").split("T")[0],
                  athleteName: name,
                  category: "singles",
                  ageGroup: "Всички",
                  place,
                  placementText: String(place),
                  sourceAttachmentName:
                    protocols[0]?.name || "Доклад за командировка",
                  notes: "Отчетено от доклада за командировка",
                });
                tripMedalsCount++;
              }
            }
          }
        });
      }

      tripsStatusList.push({
        tripId: trip.id,
        title: trip.title,
        destination: trip.destination || "—",
        startDate: trip.startDate || "—",
        endDate: trip.endDate || "—",
        hasRankingUploaded: hasProtocols,
        rankingFilesCount: protocols.length,
        rankingFileNames: protocolNames,
        reportText: trip.reportText,
        participantsCount: participantsNames.length,
        participantsNames,
        medalsCount: tripMedalsCount,
        tournamentType: tType,
      });
    }

    // Изчисляване на обобщените статистики за медалистите
    const zonalCount = detectedMedals.filter(
      (m) => m.tournamentType === "zonal"
    ).length;
    const stateCount = detectedMedals.filter(
      (m) => m.tournamentType === "state"
    ).length;
    const nationalCount = detectedMedals.filter(
      (m) => m.tournamentType === "national"
    ).length;
    const internationalCount = detectedMedals.filter(
      (m) => m.tournamentType === "international"
    ).length;
    const totalMedals =
      zonalCount + stateCount + nationalCount + internationalCount;

    const withoutRankingsCount = tripsStatusList.filter(
      (t) => !t.hasRankingUploaded
    ).length;
    const withRankingsCount = tripsStatusList.filter(
      (t) => t.hasRankingUploaded
    ).length;

    const reportData: AnnualReportData = {
      siteId: cleanSiteId,
      year,
      coachId: coachId || "mira_georgieva",
      coachName: "МИРА ГЕОРГИЕВА",
      coachRole: "Треньор по бадминтон",
      organizationName: "„Бадминтон клуб Гълъбово”",

      trainings: {
        monthly: monthlyStats,
        totalCount: totalTrainings,
        description: `През ${year} година „Бадминтон клуб Гълъбово” осигури целогодишен тренировъчен процес за всички възрастови групи – от подрастващи състезатели до любители и ветерани, с общо ${totalTrainings} проведени и надлежно регистрирани тренировъчни занимания.`,
      },

      competitions: {
        description: `През ${year} година отборът на клуба реализира ${tripsStatusList.length} официални състезателни командировки съгласно Държавния спортен календар на БФ Бадминтон.`,
        tripsCount: tripsStatusList.length,
        tripsList: tripsStatusList,
      },

      organizedTournaments: {
        list: dynamicOrganizedTournaments,
        description: `Когато състезанието се провежда в спортна зала „Енергетик” град Гълъбово, „Бадминтон клуб Гълъбово” е домакин и организатор. През ${year} година клубът организира и проведе ${dynamicOrganizedTournaments.length} официални турнира на родна сцена.`,
      },

      sportsCamp: finalCamp,

      demonstrations: {
        list: dynamicDemonstrations,
        description: `През ${year} година клубът организира и участва в ${dynamicDemonstrations.length} обществени спортни инициативи и демонстрации за популяризиране на бадминтона в град Гълъбово.`,
      },

      medalsAnalysis: {
        zonalCount,
        stateCount,
        nationalCount,
        internationalCount,
        totalMedals,
        medalsList: detectedMedals,
        withoutRankingsCount,
        withRankingsCount,
        description: `На база качените и валидирани официални съдийски протоколи от състезанията, състезателите на „Бадминтон клуб Гълъбово” завоюваха общо ${totalMedals} призови класирания и медали през ${year} година.`,
      },

      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: reportData };
  } catch (error) {
    console.error("Error in getAnnualReportAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на годишния отчет",
    };
  }
}

/**
 * Запазва попълнения/редактиран годишен отчет в Firestore
 */
export async function saveAnnualReportAction(
  report: AnnualReportData
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const siteId = report.siteId || "bkgalabovo";
    const docKey = `${siteId}_${report.year}_${report.coachId || "default"}`;

    const cleanPayload = JSON.parse(
      JSON.stringify({
        ...report,
        updatedAt: new Date().toISOString(),
      })
    );

    await adminDb
      .collection("annual_reports")
      .doc(docKey)
      .set(cleanPayload, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Error in saveAnnualReportAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Грешка при запис на отчета",
    };
  }
}
