export type ModuleHubId =
  "planning" | "testing" | "competitions" | "communication" | "recognition";

export interface ModuleHubTab {
  id: string;
  label: string;
  href: string;
  matchPrefixes: readonly string[];
  description?: string;
}

export interface ModuleHubConfig {
  id: ModuleHubId;
  ariaLabel: string;
  tabs: readonly ModuleHubTab[];
}

export const MODULE_HUBS: Record<ModuleHubId, ModuleHubConfig> = {
  planning: {
    id: "planning",
    ariaLabel: "Навигация в Планиране и Тренировки",
    tabs: [
      {
        id: "planner",
        label: "Тренировъчни сесии",
        href: "/training/planner",
        matchPrefixes: ["/training/planner"],
      },
      {
        id: "annual-plans",
        label: "Годишни планове",
        href: "/training/annual-plans",
        matchPrefixes: ["/training/annual-plans"],
      },
      {
        id: "exercises",
        label: "База упражнения",
        href: "/training/exercises",
        matchPrefixes: ["/training/exercises"],
      },
    ],
  },
  testing: {
    id: "testing",
    ariaLabel: "Навигация в Тестове и Теория",
    tabs: [
      {
        id: "assessments",
        label: "BWF Оценяване",
        href: "/training/assessments",
        matchPrefixes: ["/training/assessments"],
      },
      {
        id: "beep-test",
        label: "Бийп Тест (VO2 Max)",
        href: "/training/beep-test",
        matchPrefixes: ["/training/beep-test"],
      },
      {
        id: "theory",
        label: "Теория и Викторини",
        href: "/training/theory",
        matchPrefixes: ["/training/theory"],
      },
    ],
  },
  competitions: {
    id: "competitions",
    ariaLabel: "Навигация в Турнири и Ранглиста",
    tabs: [
      {
        id: "tournaments",
        label: "Турнири",
        href: "/tournaments",
        matchPrefixes: ["/tournaments"],
      },
      {
        id: "rankings",
        label: "Ранглиста",
        href: "/rankings",
        matchPrefixes: ["/rankings"],
      },
    ],
  },
  communication: {
    id: "communication",
    ariaLabel: "Навигация в Комуникация и CRM",
    tabs: [
      {
        id: "inquiries",
        label: "Запитвания",
        href: "/inquiries",
        matchPrefixes: ["/inquiries"],
      },
      {
        id: "marketing",
        label: "Маркетинг & CRM",
        href: "/marketing",
        matchPrefixes: ["/marketing"],
      },
      {
        id: "feedback",
        label: "Отзиви и Анкети",
        href: "/feedback",
        matchPrefixes: ["/feedback"],
      },
    ],
  },
  recognition: {
    id: "recognition",
    ariaLabel: "Навигация в Сертификати и Партньори",
    tabs: [
      {
        id: "certificates",
        label: "Сертификати & Ваучери",
        href: "/certificates",
        matchPrefixes: ["/certificates"],
      },
      {
        id: "partners",
        label: "Партньори & Спонсори",
        href: "/partners",
        matchPrefixes: ["/partners"],
      },
    ],
  },
};
