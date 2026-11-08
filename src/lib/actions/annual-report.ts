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

// Стандартни бройки тренировки по подразбиране за Бадминтон Клуб Гълъбово (общо 150)
const DEFAULT_2025_TRAININGS: number[] = [
  12, 12, 12, 14, 13, 12, 12, 12, 13, 14, 12, 12,
];

/**
 * Извлича или генерира пълните данни за годишния отчет на треньора / клуба.
 */
export async function getAnnualReportAction(
  year: number = 2025,
  coachId?: string,
  siteId: string = "bkgalabovo"
): Promise<{ success: boolean; data?: AnnualReportData; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const cleanSiteId = siteId || "bkgalabovo";
    const docKey = `${cleanSiteId}_${year}_${coachId || "default"}`;

    // 1. Проверяваме дали вече има записан персонализиран отчет в колекция annual_reports
    const savedDoc = await adminDb
      .collection("annual_reports")
      .doc(docKey)
      .get();
    if (savedDoc.exists) {
      const data = savedDoc.data() as AnnualReportData;
      return { success: true, data: { ...data, id: savedDoc.id } };
    }

    // 2. Извличаме събития от календара за съответната година
    const startOfYear = `${year}-01-01T00:00:00.000Z`;
    const endOfYear = `${year}-12-31T23:59:59.999Z`;

    const [eventsSnap, tripsSnap, membersSnap] = await Promise.all([
      adminDb
        .collection("events")
        .where("startDate", ">=", startOfYear)
        .where("startDate", "<=", endOfYear)
        .get(),
      adminDb
        .collection("business_trips")
        .where("startDate", ">=", startOfYear)
        .where("startDate", "<=", endOfYear)
        .get(),
      adminDb.collection("members").get(),
    ]);

    // Картотека на членовете за търсене на имена
    const membersMap = new Map<string, Member>();
    membersSnap.docs.forEach((doc) => {
      membersMap.set(doc.id, { id: doc.id, ...doc.data() } as Member);
    });

    // Изчисляване на тренировките по месеци от събитията (ако има такива)
    const monthlyCounts = new Array(12).fill(0);
    let realTrainingEventsCount = 0;

    eventsSnap.docs.forEach((d) => {
      const ev = d.data() as ScheduleEvent;
      const isTraining =
        ev.type === "training" ||
        (ev.title && ev.title.toLowerCase().includes("тренировк"));
      if (isTraining && ev.startDate) {
        const m = new Date(ev.startDate).getMonth();
        if (m >= 0 && m < 12) {
          monthlyCounts[m]++;
          realTrainingEventsCount++;
        }
      }
    });

    // Ако няма достатъчно въведени събития в базата за миналата година, използваме официалния разчет
    const monthlyStats: MonthTrainingStat[] = BULGARIAN_MONTHS.map(
      (name, idx) => ({
        month: idx + 1,
        monthName: name,
        conductedCount:
          realTrainingEventsCount > 20
            ? monthlyCounts[idx]
            : DEFAULT_2025_TRAININGS[idx],
      })
    );
    const totalTrainings = monthlyStats.reduce(
      (sum, m) => sum + m.conductedCount,
      0
    );

    // 3. Сканиране на командировките за медали и съвпадения на състезатели
    const detectedMedals: CompetitionMedal[] = [];
    const trips = tripsSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as BusinessTrip),
    }));

    for (const trip of trips) {
      const tripAthletes: string[] = [];
      if (trip.participantsIds && Array.isArray(trip.participantsIds)) {
        trip.participantsIds.forEach((pid) => {
          const m = membersMap.get(pid);
          if (m) {
            tripAthletes.push(`${m.firstName} ${m.lastName}`.trim());
          }
        });
      }

      // Търсене в текста на доклада и протоколите
      const textCorpus = [
        trip.reportText || "",
        trip.protocolText || "",
        trip.title || "",
        trip.destination || "",
      ].join(" ");

      // Проверка за клубна принадлежност
      const isClubTrip =
        textCorpus.includes("Гълъбово") ||
        textCorpus.includes("БК") ||
        trip.siteId === "bkgalabovo";

      if (isClubTrip && tripAthletes.length > 0) {
        // Определяме типа турнир според заглавието на командировката
        const titleLower = (trip.title || "").toLowerCase();
        let tType: "zonal" | "state" | "national" | "international" =
          "national";
        if (
          titleLower.includes("международ") ||
          titleLower.includes("international")
        ) {
          tType = "international";
        } else if (
          titleLower.includes("държавн") ||
          titleLower.includes("длп") ||
          titleLower.includes("доп")
        ) {
          tType = "state";
        } else if (
          titleLower.includes("зоналн") ||
          titleLower.includes("зонално")
        ) {
          tType = "zonal";
        }

        // Автоматично търсене на призови места по ключови фрази
        tripAthletes.forEach((athleteName) => {
          const athleteLower = athleteName.toLowerCase();
          if (textCorpus.toLowerCase().includes(athleteLower)) {
            // Търсене около името за класиране
            const athleteIdx = textCorpus.toLowerCase().indexOf(athleteLower);
            const context = textCorpus.slice(
              Math.max(0, athleteIdx - 80),
              Math.min(textCorpus.length, athleteIdx + athleteLower.length + 80)
            );

            let place: 1 | 2 | 3 | 4 | null = null;
            if (
              context.includes("1 място") ||
              context.includes("1-во") ||
              context.includes("златен") ||
              context.includes("шампион")
            ) {
              place = 1;
            } else if (
              context.includes("2 място") ||
              context.includes("2-ро") ||
              context.includes("сребър")
            ) {
              place = 2;
            } else if (
              context.includes("3 място") ||
              context.includes("3-то") ||
              context.includes("бронз") ||
              context.includes("3-4")
            ) {
              place = 3;
            }

            if (place) {
              detectedMedals.push({
                id: `${trip.id}_${athleteName}_${place}`,
                tripId: trip.id,
                tournamentName: trip.title || "Състезание",
                tournamentType: tType,
                date: (trip.startDate || "").split("T")[0],
                athleteName,
                category: "singles",
                place,
                sourceAttachmentName: trip.matchProtocols?.[0]?.name,
              });
            }
          }
        });
      }
    }

    // 4. Стандартни организирани турнири за годината
    const defaultOrganizedTournaments: OrganizedTournament[] = [
      {
        id: "tour-1",
        title: "Национална верига по бадминтон „Млади таланти“",
        month: "Февруари",
        dateRange: `Февруари ${year}`,
        ageGroups: "Деца под 11, 13 и 15 г.",
        type: "national",
      },
      {
        id: "tour-2",
        title: "Национална верига по бадминтон за мъже и жени",
        month: "Февруари",
        dateRange: `Февруари ${year}`,
        ageGroups: "Мъже, жени и юноши под 13 г. нагоре",
        type: "national",
      },
      {
        id: "tour-3",
        title: "Национална верига по бадминтон „Млади таланти“",
        month: "Декември",
        dateRange: `Декември ${year}`,
        ageGroups: "Деца под 11, 13 и 15 г.",
        type: "national",
      },
      {
        id: "tour-4",
        title: "Ежемесечни вътрешни турнири на клуба",
        month: "Всеки месец",
        dateRange: `Целогодишно ${year}`,
        ageGroups: "Всички картотекирани състезатели и подготвителни групи",
        type: "internal",
      },
      {
        id: "tour-5",
        title: "Традиционен коледен турнир за деца и родители",
        month: "Декември",
        dateRange: `Декември ${year}`,
        ageGroups: "Деца заедно с техните родители (двойки и забавни игри)",
        type: "thematic",
      },
    ];

    // 5. Летен спортен лагер
    const defaultSportsCamp: SportsCampInfo = {
      title: "Летен спортно-подготвителен лагер Приморско",
      dateRange: `02 – 07 август ${year} г.`,
      location: "гр. Приморско",
      facility: "ММЦ „Хелиос“",
      sessionsCount: 12,
      participantsCount: 18,
      focusAreas: [
        "Бързина и Експлозивност: Чрез специфични упражнения за работа с крака и реакции.",
        "Издръжливост: За повишаване на устойчивостта при продължителни мачове и натоварване.",
        "Ловкост и Координация: За прецизност и бърза смяна на посоката в корта.",
      ],
      description:
        "В рамките на лагера се осъществиха интензивни тренировъчни занимания, посветени на цялостната физическа и тактическа подготовка на състезателите за предстоящите зонални и отборни първенства.",
    };

    // 6. Демонстрации и събития
    const defaultDemonstrations: DemonstrationEvent[] = [
      {
        id: "demo-1",
        title: "Европейски ден на спорта – „Спорт без отпадъци“",
        date: `26.09.${year} г.`,
        partner: "ПГЕЕ гр. Гълъбово",
        participants: "Янина Калъчева, Михаела Иванова, Невена Динева",
        description:
          "Бадминтонът беше представен чрез демонстрация на основни удари и движения от ученичките от ПГЕЕ Гълъбово под мотото „Спорт без отпадъци“.",
      },
      {
        id: "demo-2",
        title: "Инициатива „Be Active“",
        date: `Септември ${year} г.`,
        partner: "Второ ОУ „Христо Ботев“ гр. Гълъбово",
        participants: "Ученици от V до VII клас",
        description:
          "Провеждане на открити бадминтон демонстрации за насърчаване на физическата активност, здравословния начин на живот и устойчивите навици сред подрастващите.",
      },
      {
        id: "demo-3",
        title: "Национална кампания „Бъди смел, бъди добър“",
        date: `23 – 30 септември ${year} г.`,
        partner: "ДАЗД и Община Гълъбово",
        participants:
          "Деца от 3-та и 4-та подготвителна група на ДГ „Радост“ и ученици от I до IV клас на Второ ОУ „Христо Ботев“",
        description:
          "Седмица на спортните дейности на открито с масови демонстрационни игри по бадминтон за насърчаване на добротата и спорта.",
      },
    ];

    // Медали: ако няма намерени от командировки, подаваме официалните 56 медала за 2025
    const zonalCount =
      detectedMedals.filter((m) => m.tournamentType === "zonal").length || 11;
    const stateCount =
      detectedMedals.filter((m) => m.tournamentType === "state").length || 1;
    const nationalCount =
      detectedMedals.filter((m) => m.tournamentType === "national").length ||
      41;
    const internationalCount =
      detectedMedals.filter((m) => m.tournamentType === "international")
        .length || 3;
    const totalMedals =
      zonalCount + stateCount + nationalCount + internationalCount;

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
        description: `През ${year} година „Бадминтон клуб Гълъбово” осигури целогодишен тренировъчен процес за всички възрастови групи – от подрастващи състезатели до любители и ветерани. Състезателите на клуба демонстрираха висока мотивация и спортен дух, като през ${year} г. взеха участие във всички планирани Зонални лични и отборни първенства, както и в Държавните лични и отборни шампионати.`,
      },

      competitions: {
        description: `Подготовката за състезания бе водещ приоритет през ${year} година. Проведени бяха специализирани тактически лагери и кондиционни тренировки, осигуряващи отличното представяне на клуба в държавния спортен календар.`,
        tripsCount: trips.length,
      },

      organizedTournaments: {
        list: defaultOrganizedTournaments,
        description: `Освен Националните турнири, клубът ежемесечно провежда Вътрешни турнири за децата, трениращи в клуба, както и традиционния тематичен Коледен турнир за деца и родители.`,
      },

      sportsCamp: defaultSportsCamp,

      demonstrations: {
        list: defaultDemonstrations,
        description: `През годината клубът активно се включи в различни обществени инициативи за популяризиране на спорта и здравословния начин на живот сред младите хора в град Гълъбово.`,
      },

      medalsAnalysis: {
        zonalCount,
        stateCount,
        nationalCount,
        internationalCount,
        totalMedals,
        medalsList: detectedMedals,
        description: `Спечелените общо ${totalMedals} медала през ${year} г. доказват високото спортно майсторство на нашите състезатели и ефективността на тренировъчната методика на „Бадминтон клуб Гълъбово”.`,
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
