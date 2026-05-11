import {
  AttachmentType,
  Reservation,
  ResourceRequirements,
} from "@/types/booking.types";
import { ClubService } from "@/types";

export const DEFAULT_INVENTORY: ResourceRequirements = {
  attachments: {
    arms: 2,
    hips: 2,
    legs: 2,
  },
  compressors: 2,
};

interface AvailabilitySlot {
  availableResources: ResourceRequirements;
  end: Date;
  isLocked: boolean;
  start: Date;
}

type ResourceUsage = {
  attachments: { arms: number; hips: number; legs: number };
  compressors: number;
};

/**
 * Calculates resource usage for every 15-minute segment of a given day in Sofia time.
 */
export function calculateAvailability(
  reservations: Reservation[],
  targetDate: Date,
  siteInventory: ResourceRequirements = DEFAULT_INVENTORY,
  operatingHours = { end: 22, start: 8 },
  teamMemberId?: string
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const INTERVAL_MINUTES = 15;
  const intervalMs = INTERVAL_MINUTES * 60 * 1000;

  const refParts = getSofiaParts(targetDate);
  const targetDateStr = `${refParts.year}-${refParts.month}-${refParts.day}`;

  const scanStart = new Date(targetDate.getTime() - 12 * 60 * 60 * 1000);
  const scanEnd = new Date(targetDate.getTime() + 36 * 60 * 60 * 1000);
  const scanStartTime =
    Math.floor(scanStart.getTime() / intervalMs) * intervalMs;

  for (let time = scanStartTime; time < scanEnd.getTime(); time += intervalMs) {
    const slotStart = new Date(time);
    const parts = getSofiaParts(slotStart);
    if (`${parts.year}-${parts.month}-${parts.day}` !== targetDateStr) continue;
    const slotHourDecimal = parts.hour + parts.minute / 60;
    if (
      slotHourDecimal < operatingHours.start ||
      slotHourDecimal >= operatingHours.end
    )
      continue;

    slots.push(
      createSlot(
        slotStart,
        time + intervalMs,
        reservations,
        siteInventory,
        teamMemberId
      )
    );
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Checks if a specific booking request can be accommodated given existing reservations and site capacity.
 */
export function checkAvailability(
  req: { duration: number; service: ClubService; startTime: Date },
  reservations: Reservation[],
  siteInventory: ResourceRequirements = DEFAULT_INVENTORY
): boolean {
  const reqStart = req.startTime.getTime();
  const reqEnd = reqStart + req.duration * 60000;
  const isExclusive = req.service.isExclusive === true;

  const usage = { attachments: { arms: 0, hips: 0, legs: 0 }, compressors: 0 };

  for (const res of reservations) {
    if (res.status === "cancelled") continue;

    const resStart = toTimestamp(res.startTime);
    const resEnd = toTimestamp(res.endTime);

    if (reqStart < resEnd && reqEnd > resStart) {
      if (res.isExclusive === true || isExclusive) return false;

      const ur = res.usedResources;
      if (!ur) continue;
      usage.compressors += ur.compressors || 0;

      const atts = (ur.attachments || {}) as Record<string, number | undefined>;
      usage.attachments.legs += atts.legs || 0;
      usage.attachments.arms += atts.arms || 0;
      usage.attachments.hips += atts.hips || 0;
    }
  }

  const reqRes = req.service.requiredResources;
  if (!reqRes) return true;

  const totalComp = usage.compressors + (reqRes.compressors || 0);
  const totalLegs = usage.attachments.legs + (reqRes.attachments?.legs || 0);
  const totalArms = usage.attachments.arms + (reqRes.attachments?.arms || 0);
  const totalHips = usage.attachments.hips + (reqRes.attachments?.hips || 0);

  return (
    totalComp <= (siteInventory.compressors || 0) &&
    totalLegs <= (siteInventory.attachments?.legs || 0) &&
    totalArms <= (siteInventory.attachments?.arms || 0) &&
    totalHips <= (siteInventory.attachments?.hips || 0)
  );
}

/**
 * Helper to get Sofia components from a Date
 */
export function getSofiaParts(date: Date) {
  const format = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    hour12: false,
    minute: "numeric",
    month: "numeric",
    second: "numeric",
    timeZone: "Europe/Sofia",
    year: "numeric",
  });

  const parts = format.formatToParts(date);
  const getPart = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value);

  return {
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
    month: getPart("month"),
    year: getPart("year"),
  };
}

/**
 * Checks if a specific service can fit into the calendar starting at a specific slot.
 */
export function isServiceAvailableAcrossSlots(
  service: ClubService,
  slots: AvailabilitySlot[],
  startIndex: number,
  serviceDurationSegments: number,
  siteInventory: ResourceRequirements
): boolean {
  if (startIndex + serviceDurationSegments > slots.length) return false;

  const isExclusive = service.isExclusive === true;

  for (let i = 0; i < serviceDurationSegments; i++) {
    const slot = slots[startIndex + i];
    if (!hasRequiredResources(slot, service, isExclusive, siteInventory))
      return false;
  }

  return true;
}

function accumulateReservationUsage(
  res: Reservation,
  start: Date,
  endTime: number,
  teamMemberId: string | undefined,
  usage: ResourceUsage
): boolean {
  const resStart = toTimestamp(res.startTime);
  const resEnd = toTimestamp(res.endTime) + (res.bufferAfter || 0) * 60 * 1000;
  if (!(start.getTime() < resEnd && endTime > resStart)) return false;

  const isLocked =
    res.isExclusive === true ||
    (!!teamMemberId && res.teamMemberId === teamMemberId);

  const ur = res.usedResources as ResourceRequirements | undefined;
  if (ur) {
    const atts = (ur.attachments || {}) as Record<string, number | undefined>;
    usage.compressors += ur.compressors || 0;
    usage.attachments.legs += atts.legs || 0;
    usage.attachments.arms += atts.arms || 0;
    usage.attachments.hips += atts.hips || 0;
  }

  return isLocked;
}

function createSlot(
  start: Date,
  endTime: number,
  reservations: Reservation[],
  inventory: ResourceRequirements,
  teamMemberId?: string
): AvailabilitySlot {
  const end = new Date(endTime);
  const usage: ResourceUsage = {
    attachments: { arms: 0, hips: 0, legs: 0 },
    compressors: 0,
  };
  let isLocked = false;

  for (const res of reservations) {
    if (res.status === "cancelled") continue;
    const locked = accumulateReservationUsage(
      res,
      start,
      endTime,
      teamMemberId,
      usage
    );
    if (locked) isLocked = true;
  }

  return {
    availableResources: {
      attachments: {
        arms: Math.max(
          0,
          (inventory.attachments?.arms ?? 0) - usage.attachments.arms
        ),
        hips: Math.max(
          0,
          (inventory.attachments?.hips ?? 0) - usage.attachments.hips
        ),
        legs: Math.max(
          0,
          (inventory.attachments?.legs ?? 0) - usage.attachments.legs
        ),
      },
      compressors: Math.max(
        0,
        (inventory.compressors || 0) - usage.compressors
      ),
    },
    end,
    isLocked,
    start,
  };
}

function getRequiredAttachments(service: ClubService): Record<string, number> {
  const resources = service.requiredResources;
  const atts = (resources?.attachments || {}) as Record<
    string,
    number | undefined
  >;
  return {
    arms: atts.arms || 0,
    hips: atts.hips || 0,
    legs: atts.legs || 0,
  };
}

function hasRequiredResources(
  slot: AvailabilitySlot,
  service: ClubService,
  isExclusive: boolean,
  siteInventory: ResourceRequirements
): boolean {
  if (slot.isLocked) return false;
  if (isExclusive && !isSlotEmpty(slot, siteInventory)) return false;

  const reqComp = service.requiredResources?.compressors || 0;
  if (slot.availableResources.compressors < reqComp) return false;

  const reqAttachments = getRequiredAttachments(service);
  const types: AttachmentType[] = ["legs", "arms", "hips"];

  return types.every(
    (t) =>
      (slot.availableResources.attachments[t] || 0) >= (reqAttachments[t] || 0)
  );
}

function isSlotEmpty(
  slot: AvailabilitySlot,
  inventory: ResourceRequirements
): boolean {
  if (!inventory) return true;
  if (slot.availableResources.compressors !== (inventory.compressors || 0))
    return false;

  const types: AttachmentType[] = ["legs", "arms", "hips"];
  const invAtts = inventory.attachments || {};

  return types.every(
    (t) => (slot.availableResources.attachments[t] || 0) === (invAtts[t] || 0)
  );
}

function toTimestamp(val: unknown): number {
  if (!val) return 0;
  if (typeof val === "string") return new Date(val).getTime();
  if (val instanceof Date) return val.getTime();
  if (
    val &&
    typeof val === "object" &&
    "toDate" in val &&
    typeof (val as { toDate: () => Date }).toDate === "function"
  ) {
    return (val as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}
