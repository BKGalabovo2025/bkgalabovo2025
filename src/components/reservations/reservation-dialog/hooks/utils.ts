import { ClubService } from "@/types";
import { Site } from "@/types/site.types";
import { ReservationFormValues, PackageDay } from "../ReservationDialogContext";

interface ZoneAttachments {
  legs: number;
  arms: number;
  hips: number;
}

export interface RequiredResources {
  compressors: number;
  attachments: ZoneAttachments;
}

export function detectPackageInfo(selectedService: ClubService | undefined): { isPackage: boolean; daysCount: number } {
  if (!selectedService?.name) return { isPackage: false, daysCount: 1 };
  const nameL = selectedService.name.toLowerCase();
  if (nameL.includes("2 дни")) return { isPackage: true, daysCount: 2 };
  if (nameL.includes("3 дни") || nameL.includes("тридневен")) return { isPackage: true, daysCount: 3 };
  return { isPackage: false, daysCount: 1 };
}

export function buildZoneResources(zone1: string | undefined, zone2: string | undefined): RequiredResources | null {
  let reqComp = 0;
  const reqAtts: ZoneAttachments = { legs: 0, arms: 0, hips: 0 };

  if (zone1) {
    reqComp++;
    const z = zone1.toUpperCase();
    if (z === "КРАКА") reqAtts.legs++;
    else if (z === "РЪЦЕ") reqAtts.arms++;
    else if (z === "ТАЗ") reqAtts.hips++;
  }
  if (zone2) {
    reqComp++;
    const z = zone2.toUpperCase();
    if (z === "КРАКА") reqAtts.legs++;
    else if (z === "РЪЦЕ") reqAtts.arms++;
    else if (z === "ТАЗ") reqAtts.hips++;
  }
  if (reqComp === 0) return null;
  return { compressors: reqComp, attachments: reqAtts };
}

function buildZoneResourcesFromZoneName(zone1: string | undefined, zone2: string | undefined): RequiredResources | null {
  let reqComp = 0;
  let reqLegs = 0, reqArms = 0, reqHips = 0;

  if (zone1) {
    reqComp++;
    if (zone1 === "Крака") reqLegs++;
    else if (zone1 === "Ръце") reqArms++;
    else if (zone1 === "Таз") reqHips++;
  }
  if (zone2) {
    reqComp++;
    if (zone2 === "Крака") reqLegs++;
    else if (zone2 === "Ръце") reqArms++;
    else if (zone2 === "Таз") reqHips++;
  }
  if (reqComp === 0) return null;
  return { compressors: reqComp, attachments: { legs: reqLegs, arms: reqArms, hips: reqHips } };
}

export function toUtcIso(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}

function cleanPayload(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export function buildPackageDays(
  daysCount: number,
  baseStart: Date,
  baseEnd: Date,
  selectedZone: string | undefined,
  client2Zone: string | undefined,
): PackageDay[] {
  const days: PackageDay[] = [];
  for (let i = 0; i < daysCount; i++) {
    const nextDate = new Date(baseStart);
    nextDate.setDate(nextDate.getDate() + i);
    const nextEndTime = new Date(baseEnd);
    nextEndTime.setDate(nextEndTime.getDate() + i);
    days.push({
      dayIndex: i,
      date: nextDate,
      startTime: nextDate,
      endTime: nextEndTime,
      client1Zone: i === 0 ? selectedZone : "",
      client2Zone: i === 0 ? client2Zone : "",
    });
  }
  return days;
}

export function checkWorkingHoursLogic(date: Date, siteInfo: Site | null): string | null {
  if (!siteInfo?.schedule) return null;
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const day = dayNames[date.getDay()];
  const daySchedule = siteInfo.schedule[day as keyof typeof siteInfo.schedule];

  if (!daySchedule?.isOpen) return "Този ден е отбелязан като неработен за обекта.";

  const timeStr = date.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
  if (timeStr < daySchedule.open || timeStr > daySchedule.close) {
    return `Избраният час е извън работното време (${daySchedule.open} - ${daySchedule.close}).`;
  }
  return null;
}

export function buildFinalResources(
  isRecovery: boolean,
  service: ClubService | undefined,
  zone1: string | undefined,
  zone2: string | undefined,
) {
  if (!isRecovery) return service?.requiredResources;
  const res = buildZoneResourcesFromZoneName(zone1, zone2);
  return res ?? service?.requiredResources;
}

export function buildBasePayload(
  isRecoveryZone: boolean,
  activeBranch: string,
  price: number,
  values: ReservationFormValues,
  selectedService: ClubService | undefined,
  startIso: string | undefined,
  endIso: string | undefined,
  finalResources: unknown,
  zone1: string | undefined,
  zone2: string | undefined,
) {
  return cleanPayload({
    ...values,
    siteId: isRecoveryZone ? "recoveryzone" : activeBranch,
    startTime: startIso,
    endTime: endIso,
    totalPrice: price,
    price,
    finalPrice: price,
    currency: "EUR",
    serviceName: selectedService?.name,
    usedResources: finalResources,
    selectedZone: zone1,
    client2Zone: zone2,
    isExclusive: selectedService?.isExclusive ?? false,
    bufferAfter: selectedService?.bufferAfter ?? 5,
  });
}
