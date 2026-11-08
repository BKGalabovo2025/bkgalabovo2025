export interface MonthTrainingStat {
  month: number; // 1 - 12
  monthName: string; // "Януари", "Февруари"...
  conductedCount: number;
  notes?: string;
}

export interface CompetitionMedal {
  id: string;
  tripId?: string;
  tournamentName: string;
  tournamentType: "zonal" | "state" | "national" | "international";
  date: string;
  athleteName: string;
  athleteId?: string;
  category: "singles" | "doubles" | "mixed";
  ageGroup?: string; // "под 11", "под 13", "под 15", "мъже", "жени"
  place: 1 | 2 | 3 | 4; // 1: Злато, 2: Сребро, 3: Бронз, 4: 3-4 място
  sourceAttachmentName?: string;
}

export interface OrganizedTournament {
  id: string;
  title: string;
  month: string;
  dateRange: string;
  ageGroups: string;
  type: "national" | "internal" | "thematic";
}

export interface SportsCampInfo {
  title: string;
  dateRange: string;
  location: string;
  facility: string;
  sessionsCount: number;
  participantsCount: number;
  focusAreas: string[];
  description: string;
}

export interface DemonstrationEvent {
  id: string;
  title: string;
  date: string;
  partner: string;
  participants: string;
  description: string;
}

export interface AnnualReportData {
  id?: string;
  siteId: string;
  year: number;
  coachId: string;
  coachName: string;
  coachRole: string;
  organizationName: string;

  // 1 & 2. Тренировъчен процес и състезания
  trainings: {
    monthly: MonthTrainingStat[];
    totalCount: number;
    description: string;
  };
  competitions: {
    description: string;
    tripsCount: number;
  };

  // 3. Организиране и провеждане на състезания
  organizedTournaments: {
    list: OrganizedTournament[];
    description: string;
  };

  // 4. Летен спортен лагер
  sportsCamp: SportsCampInfo;

  // 5. Демонстрации и събития
  demonstrations: {
    list: DemonstrationEvent[];
    description: string;
  };

  // 6. Анализ на резултатите (Медали)
  medalsAnalysis: {
    zonalCount: number;
    stateCount: number;
    nationalCount: number;
    internationalCount: number;
    totalMedals: number;
    medalsList: CompetitionMedal[];
    description: string;
  };

  createdAt?: string;
  updatedAt?: string;
}
