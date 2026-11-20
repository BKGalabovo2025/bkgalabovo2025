import {
  CourtAllocationStrategy,
  CourtSlot,
  ShadowPlayer,
} from "@/hooks/shadow-trainer/types";

export interface CourtLogisticsResult {
  slots: CourtSlot[];
  activePlayers: ShadowPlayer[];
  restingPlayers: ShadowPlayer[];
  totalCapacity: number;
}

/**
 * Calculates court assignments for badminton shadow training in a sports hall.
 *
 * @param allPlayers - All registered players for the session
 * @param courtsCount - Physical full courts available in the hall (1 to 6)
 * @param strategy - "two_per_court" (2 players per court across net) or "one_per_court" (1 player per court)
 * @param currentActivePlayers - Optional pre-rotated active players for the current set
 */
export function calculateCourtAssignments(
  allPlayers: ShadowPlayer[],
  courtsCount: number,
  strategy: CourtAllocationStrategy = "two_per_court",
  currentActivePlayers?: ShadowPlayer[]
): CourtLogisticsResult {
  const safeCourts = Math.max(1, Math.min(6, Math.round(courtsCount || 1)));
  const capacity = strategy === "two_per_court" ? safeCourts * 2 : safeCourts;

  const activePlayers = currentActivePlayers
    ? currentActivePlayers.slice(0, capacity)
    : allPlayers.slice(0, capacity);

  // Remaining players who are resting during this set
  const activeIds = new Set(activePlayers.map((p) => p.id));
  const restingPlayers = allPlayers.filter((p) => !activeIds.has(p.id));

  const slots: CourtSlot[] = [];

  if (strategy === "one_per_court") {
    // Strategy: Maximum Space (1 player per court, 1/2 court view)
    for (let i = 0; i < safeCourts; i++) {
      const player = activePlayers[i] || null;
      slots.push({
        courtNumber: i + 1,
        isFullCourt: false,
        halfA: player,
        halfB: null,
      });
    }
  } else {
    // Strategy: Full Court utilization (up to 2 players per court, Field A & Field B across net)
    for (let i = 0; i < safeCourts; i++) {
      const playerA = activePlayers[i * 2] || null;
      const playerB = activePlayers[i * 2 + 1] || null;

      slots.push({
        courtNumber: i + 1,
        isFullCourt: true,
        halfA: playerA,
        halfB: playerB,
      });
    }
  }

  return {
    slots,
    activePlayers,
    restingPlayers,
    totalCapacity: capacity,
  };
}

/**
 * Splits players into waves/groups based on hall capacity.
 * E.g. 8 players with capacity 6:
 * Wave 1: 6 players (working on courts in Part 1)
 * Wave 2: 2 players (working on courts in Part 2)
 */
export function splitPlayersIntoWaves(
  allPlayers: ShadowPlayer[],
  capacity: number
): ShadowPlayer[][] {
  const safeCap = Math.max(1, capacity);
  if (allPlayers.length <= safeCap) {
    return [allPlayers];
  }
  const waves: ShadowPlayer[][] = [];
  for (let i = 0; i < allPlayers.length; i += safeCap) {
    waves.push(allPlayers.slice(i, i + safeCap));
  }
  return waves;
}

/**
 * Swaps two players by their IDs in the active players list.
 */
export function swapPlayers(
  allPlayers: ShadowPlayer[],
  playerId1: string,
  playerId2: string
): ShadowPlayer[] {
  if (playerId1 === playerId2) return allPlayers;
  const idx1 = allPlayers.findIndex((p) => p.id === playerId1);
  const idx2 = allPlayers.findIndex((p) => p.id === playerId2);
  if (idx1 === -1 || idx2 === -1) return allPlayers;

  const copy = [...allPlayers];
  const temp = copy[idx1];
  copy[idx1] = copy[idx2];
  copy[idx2] = temp;
  return copy;
}

/**
 * Moves a player directly to a specific court slot (half A or half B).
 * If the target slot is occupied, swaps them.
 * If empty, moves the player to the target slot index.
 */
export function movePlayerToCourtSlot(
  allPlayers: ShadowPlayer[],
  playerId: string,
  targetCourtNumber: number,
  targetHalf: "A" | "B" = "A",
  strategy: CourtAllocationStrategy = "two_per_court",
  courtsCount: number = 1
): ShadowPlayer[] {
  const safeCourts = Math.max(1, Math.min(6, Math.round(courtsCount || 1)));
  const courtIdx = Math.max(0, Math.min(safeCourts - 1, targetCourtNumber - 1));

  let targetIndex = 0;
  if (strategy === "one_per_court") {
    targetIndex = courtIdx;
  } else {
    targetIndex = courtIdx * 2 + (targetHalf === "B" ? 1 : 0);
  }

  const currentIdx = allPlayers.findIndex((p) => p.id === playerId);
  if (currentIdx === -1) return allPlayers;
  if (currentIdx === targetIndex) return allPlayers;

  const copy = [...allPlayers];
  if (targetIndex < copy.length) {
    // Target is occupied: swap them
    const temp = copy[currentIdx];
    copy[currentIdx] = copy[targetIndex];
    copy[targetIndex] = temp;
    return copy;
  }

  // Target index is beyond current list length: move item to the end
  const [removed] = copy.splice(currentIdx, 1);
  copy.push(removed);
  return copy;
}

/**
 * Moves a player from an active court slot to the bench (resting players).
 * If resting players exist, swaps with the first resting player so court remains occupied.
 * Otherwise, moves the player to the resting zone (index >= capacity).
 */
export function movePlayerToBench(
  allPlayers: ShadowPlayer[],
  playerId: string,
  courtsCount: number,
  strategy: CourtAllocationStrategy = "two_per_court"
): ShadowPlayer[] {
  const safeCourts = Math.max(1, Math.min(6, Math.round(courtsCount || 1)));
  const capacity = strategy === "two_per_court" ? safeCourts * 2 : safeCourts;

  const currentIdx = allPlayers.findIndex((p) => p.id === playerId);
  if (currentIdx === -1) return allPlayers;
  if (currentIdx >= capacity) return allPlayers; // Already on bench

  const copy = [...allPlayers];
  if (copy.length > capacity) {
    // Swap with first player on bench
    const temp = copy[currentIdx];
    copy[currentIdx] = copy[capacity];
    copy[capacity] = temp;
    return copy;
  }

  // No players on bench: move to end
  const [removed] = copy.splice(currentIdx, 1);
  copy.push(removed);
  return copy;
}
