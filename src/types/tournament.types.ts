import { z } from 'zod';

export const TournamentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Името на турнира е задължително.'),
  location: z.string().min(1, 'Местоположението е задължително.'),
  startDate: z.date(),
  endDate: z.date(),
  registrationDeadline: z.date(),
  ageGroups: z.array(z.string()),
  status: z.enum(["Upcoming", "Ongoing", "Completed"]),
});

export type Tournament = z.infer<typeof TournamentSchema>;

export const TournamentFormSchema = TournamentSchema.omit({ id: true, status: true }).extend({
  ageGroups: z.array(z.object({ value: z.string().min(1, "Възрастовата група е задължителна.") })),
});

export type TournamentFormValues = z.infer<typeof TournamentFormSchema>;