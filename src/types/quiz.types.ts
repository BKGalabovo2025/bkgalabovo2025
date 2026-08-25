import { z } from "zod";

// ─── Question Types ─────────────────────────────────────────────────────────

const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["SINGLE_CHOICE", "OPEN_TEXT"]),
  text: z.string().min(1, "Въпросът не може да е празен"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.number().int().min(0).optional(),
  points: z.number().int().min(1).default(8),
  explanation: z.string().optional(),
  mediaUrl: z.string().optional(),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// ─── Quiz ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const QuizSchema = z.object({
  id: z.string().min(1),
  siteId: z.string().min(1),
  title: z.string().min(2, "Заглавието трябва да е поне 2 символа"),
  description: z.string(),
  isCustom: z.boolean().default(false),
  isBaseTemplate: z.boolean().default(false),
  baseTemplateId: z.string().optional(),
  createdById: z.string().optional(),
  questions: z.array(QuizQuestionSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Quiz = z.infer<typeof QuizSchema>;
export type QuizFormData = Omit<
  Quiz,
  "id" | "siteId" | "createdAt" | "updatedAt"
>;

// ─── Theory Result ────────────────────────────────────────────────────────────

const TheoryResultStatusSchema = z.enum(["SENT", "PENDING", "REVIEWED"]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type TheoryResultStatus = z.infer<typeof TheoryResultStatusSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TheoryResultSchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  playerName: z.string(),
  quizId: z.string().min(1),
  quizTitle: z.string(),
  siteId: z.string().min(1),
  autoScore: z.number().int().min(0),
  tacticalAnswer: z.string().optional(),
  manualScore: z.number().int().min(0).max(28).default(0),
  totalScore: z.number().int().min(0),
  status: TheoryResultStatusSchema.default("PENDING"),
  coachFeedback: z.string().optional(),
  aiScore: z.number().optional(),
  aiFeedback: z.string().optional(),
  shareToken: z.string().min(1),
  submittedAt: z.string().datetime(),
  reviewedAt: z.string().datetime().optional(),
  answers: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
});

export type TheoryResult = z.infer<typeof TheoryResultSchema>;

export interface QuizAnswerSubmission {
  token: string;
  answers: Record<string, number | string>;
}
