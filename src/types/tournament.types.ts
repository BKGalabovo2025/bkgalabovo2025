import { z } from "zod";

// Схема за валидация с Zod
export const tournamentSchema = z.object({
  id: z.string().optional(), // ID от Firestore
  name: z.string().min(3, { message: "Името трябва да е поне 3 символа" }),
  description: z.string().optional(),
  startDate: z.date({ required_error: "Началната дата е задължителна" }),
  endDate: z.date({ required_error: "Крайната дата е задължителна" }),
  location: z.string().optional(),
  ageGroups: z.array(z.string()).min(1, { message: "Изберете поне една възрастова група" }),
  fee: z.number().min(0).optional(),
  registrationDeadline: z.date({ required_error: "Крайният срок за записване е задължителен" }),
  status: z.enum(["Upcoming", "Ongoing", "Completed"]).default("Upcoming"),
});

// TypeScript тип, изведен от схемата
export type Tournament = z.infer<typeof tournamentSchema>;
