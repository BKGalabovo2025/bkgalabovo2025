export type AssessmentAgeGroup =
  | "U9"
  | "U11"
  | "U13"
  | "U15"
  | "U17"
  | "U19"
  | "Мъже и Жени";

export type BadmintonTest = {
  id: string;
  ageGroup: AssessmentAgeGroup;
  name: string;
  source: string;
  description: string;
  equipment: string;
  scoring: string;
  focus: string;
  maxScore?: number; // Used for progress charts if applicable
  scoreUnit?: string; // e.g., "т.", "сек.", "бр."
  scoreType: "number" | "time" | "percentage" | "text"; // Determine how to validate and display
};

export type MemberAssessment = {
  id: string;
  siteId: string;
  memberId: string;
  memberName: string;
  date: string; // ISO 8601
  testId: string;
  testName: string;
  ageGroupAtTest: AssessmentAgeGroup; // The category of the test, regardless of member's actual age
  score: number; // For charts
  scoreDisplay: string; // What the coach typed (e.g., "15.4", "8/10")
  notes?: string;
  recordedBy: {
    userId: string;
    userName: string;
  };
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};
