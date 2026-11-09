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
  partnerName?: string;
  category: "singles" | "doubles" | "mixed";
  ageGroup?: string; // "под 11", "под 13", "под 15", "под 17", "под 19", "мъже", "жени", "ветерани"
  place: 1 | 2 | 3 | 4; // 1: Злато, 2: Сребро, 3: Бронз, 4: 3-4 място
  placementText?: string; // "1", "2", "3/4", "3"
  sourceAttachmentName?: string;
  notes?: string;
}

export interface TripRankingStatus {
  tripId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  hasRankingUploaded: boolean;
  rankingFilesCount: number;
  rankingFileNames: string[];
  reportText?: string;
  participantsCount: number;
  participantsNames: string[];
  medalsCount: number;
  tournamentType: "zonal" | "state" | "national" | "international";
}

export interface OrganizedTournament {
  id: string;
  title: string;
  month: string;
  dateRange: string;
  location: string;
  ageGroups: string;
  type: "national" | "internal" | "thematic";
  participantsCount?: number;
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
    tripsList: TripRankingStatus[];
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

  // 6. Анализ на резултатите (Медали и класирания)
  medalsAnalysis: {
    zonalCount: number;
    stateCount: number;
    nationalCount: number;
    internationalCount: number;
    totalMedals: number;
    medalsList: CompetitionMedal[];
    withoutRankingsCount: number;
    withRankingsCount: number;
    description: string;
  };

  createdAt?: string;
  updatedAt?: string;
}
