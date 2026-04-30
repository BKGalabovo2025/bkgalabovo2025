import { Match, TournamentEntry } from "@/types/tournament.types";

/**
 * Генерира мачове по системата на Бергер (Round-robin).
 * Всеки играе срещу всеки в съответната категория.
 */
export function generateBergerMatches(
  tournamentId: string,
  categoryId: "singles" | "doubles" | "mixed",
  entries: TournamentEntry[]
): Omit<Match, "id">[] {
  if (entries.length < 2) return [];

  // Копираме списъка, за да не мутираме оригинала
  const players = [...entries];

  // Ако броят е нечетен, добавяме "почиващ" (BYE) фиктивен играч
  if (players.length % 2 !== 0) {
    players.push({ id: "BYE", tournamentId, categoryId } as TournamentEntry);
  }

  const numPlayers = players.length;
  const numRounds = numPlayers - 1;
  const matchesPerRound = numPlayers / 2;
  
  const matches: Omit<Match, "id">[] = [];

  for (let round = 0; round < numRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = players[match];
      const away = players[numPlayers - 1 - match];

      // Ако някой от двамата е BYE, значи другият почива в този кръг (не създаваме мач)
      if (home.id !== "BYE" && away.id !== "BYE") {
        matches.push({
          tournamentId,
          categoryId,
          stage: "Групова фаза", 
          round: round + 1,
          player1EntryId: home.id,
          player2EntryId: away.id,
          status: "pending"
        });
      }
    }
    
    // Завъртаме играчите за следващия кръг (играчът на индекс 0 остава фиксиран)
    players.splice(1, 0, players.pop()!);
  }

  return matches;
}
