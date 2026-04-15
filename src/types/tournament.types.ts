import { z } from "zod";

/**
 * Zod schema for tournament definitions.
 * This structure supports various tournament types common in badminton clubs.
 */
export const TournamentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Tournament name is required"),
  date: z.string().datetime(),
  location: z.string().optional(),
  
  // Status: planned, active, or completed
  status: z.enum(["planned", "ongoing", "finished"]).default("planned"),
  
  // Format: single_elimination, round_robin, groups_to_brackets
  format: z.enum(["single_elimination", "round_robin", "groups"]).default("single_elimination"),
  
  // Competitive category: beginner, intermediate, advanced, mixed
  category: z.string().optional(),
  
  // Lists of member IDs
  participantIds: z.array(z.string()).default([]),
  
  // Matches collection - simplified for initial structure
  matchesIds: z.array(z.string()).default([]),
  
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Tournament = z.infer<typeof TournamentSchema>;

/**
 * Match structure for tracking individual game results.
 */
export const MatchSchema = z.object({
  id: z.string().min(1),
  tournamentId: z.string().min(1),
  round: z.string().optional(), // 'R16', 'QF', 'SF', 'Final', etc.
  
  player1Id: z.string().min(1),
  player2Id: z.string().min(1),
  
  // Scores: e.g. [[21,18], [19,21], [21,15]]
  score: z.array(z.array(z.number())).optional(),
  
  winnerId: z.string().nullable().optional(),
  status: z.enum(["pending", "live", "completed"]).default("pending"),
  
  scheduledTime: z.string().datetime().optional(),
});

export type Match = z.infer<typeof MatchSchema>;
