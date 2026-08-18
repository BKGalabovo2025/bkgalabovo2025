export type BeepTestPeriod =
  | "Предсезонна подготовка (Август-Септември)"
  | "Средата на сезона (Януари-Февруари)"
  | "Край на сезона (Май-Юни)"
  | "Специален Лагер";

export type BadmintonScore =
  "Лош" | "Среден" | "Добър" | "Отличен" | "Елитен състезател";

export interface BeepTestResult {
  id: string;
  memberId: string;
  siteId: string;
  date: string;
  period: BeepTestPeriod;

  // Raw Results
  level: number;
  shuttle: number;

  // Analytics
  vo2max: number;
  score: BadmintonScore;

  createdAt: string;
  updatedAt: string;
}
