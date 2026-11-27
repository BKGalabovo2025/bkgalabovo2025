import "server-only";

import { format, isValid } from "date-fns";
import { bg } from "date-fns/locale";

import { BWF_FUNDAMENTAL_BY_ID } from "@/lib/bwf-fundamentals";
import { getAdminDb } from "@/lib/firebase-admin";
import { getBackupDb } from "@/lib/firebase-admin-backup";
import {
  evaluateMemberFundamentals,
  type MemberFundamentalProfile,
} from "@/lib/fundamental-engine";
import { checkIsMemberOverdue } from "@/lib/membership-utils";
import { formatDobString, serializeFirestoreData } from "@/lib/serialize-utils";
import { serverCache } from "@/lib/server-cache";
import { getAgeGroup } from "@/lib/utils";
import type { MemberAssessment } from "@/types/assessment.types";
import type { BeepTestResult } from "@/types/beep-test.types";
import { DOCUMENT_TITLES } from "@/types/document-request.types";
import {
  DataCorrectionRequest,
  DefaultParentMemberPermissions,
  ParentAbsence,
  ParentAnnouncement,
  ParentAttendanceRecord,
  ParentDocumentChecklistItem,
  ParentDocumentsData,
  ParentFeeMonthItem,
  ParentFeeStatusData,
  ParentFinancialItemDetail,
  ParentFinancialTransactionItem,
  ParentLatestBeepTest,
  ParentMemberPermissions,
  ParentRankingData,
  ParentSentDocumentItem,
  ParentSessionReportItem,
  ParentShadowAndQuizzesData,
  ParentUser,
} from "@/types/parent-portal.types";
import type { FundamentalId } from "@/types/planner.types";

const PARENT_ABSENCES_COLLECTION = "parent_absences";
const PARENT_CORRECTIONS_COLLECTION = "parent_corrections";
const MEMBERS_COLLECTION = "members";
let cachedHallLocation: { value: string; expiresAt: number } | null = null;

export async function buildParentDashboardData(
  parent: ParentUser | null,
  requestedChildId?: string
) {
  try {
    if (!parent) {
      return { success: false, error: "UNAUTHORIZED", data: null };
    }

    const linkedIds = parent.linkedMemberIds || [];
    if (linkedIds.length === 0) {
      return {
        success: true,
        data: {
          parent,
          children: [],
          selectedChild: null,
          permissions: DefaultParentMemberPermissions,
          visibleData: null,
          pendingCorrections: {},
          absences: [],
          attendances: [] as ParentAttendanceRecord[],
          nextTraining: null,
          announcements: [
            {
              id: "welcome",
              title: "Добре дошли в родителския портал!",
              content:
                "Очаква се свързване на профила ви с картона на вашето дете.",
              date: new Date().toISOString(),
              priority: "info",
            },
          ] as ParentAnnouncement[],
          documentsData: null as ParentDocumentsData | null,
          feeStatus: null as ParentFeeStatusData | null,
          rankingData: null as ParentRankingData | null,
          shadowAndQuizzes: null as ParentShadowAndQuizzesData | null,
        },
      };
    }

    const cacheKey = `parent-dashboard:${parent.id}:${requestedChildId || "default"}`;
    const TTL_MS = 60_000; // 60s server cache to coalesce rapid page navigation & protect Firestore quota

    return await serverCache.get(
      cacheKey,
      async () => {
        const adminDb = getAdminDb();

        // Fetch all linked children member records with resilient fallback
        const memberSnaps = await Promise.all(
          linkedIds.map(async (id) => {
            const cleanId = decodeURIComponent(id || "").trim();
            let snap = await adminDb
              .collection(MEMBERS_COLLECTION)
              .doc(cleanId)
              .get()
              .catch(() => null);

            if (!snap || !snap.exists) {
              const backupDb = getBackupDb();
              if (backupDb) {
                const bSnap = await backupDb
                  .collection(MEMBERS_COLLECTION)
                  .doc(cleanId)
                  .get()
                  .catch(() => null);
                if (bSnap?.exists) snap = bSnap;
              }
            }

            if (!snap || !snap.exists) {
              const qSnap = await adminDb
                .collection(MEMBERS_COLLECTION)
                .where("id", "==", cleanId)
                .limit(1)
                .get()
                .catch(() => null);
              if (qSnap && !qSnap.empty) snap = qSnap.docs[0];
            }

            return { id: cleanId, snap };
          })
        );

        const children: Array<{
          id: string;
          fullName: string;
          firstName: string;
          lastName: string;
          avatarUrl: string | null;
          dateOfBirth: string | null;
          status: "active" | "inactive";
          isLicensed: boolean;
          trainingGroup: string;
          registrationDate: string | null;
        }> = [];

        const memberDocsMap = new Map<string, FirebaseFirestore.DocumentData>();

        for (const item of memberSnaps) {
          if (item.snap && item.snap.exists) {
            const d = item.snap.data() || {};
            memberDocsMap.set(item.id, d);
            children.push({
              id: item.id,
              fullName:
                `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Член",
              firstName: d.firstName || "",
              lastName: d.lastName || "",
              avatarUrl: d.avatarUrl || null,
              dateOfBirth: formatDobString(d.dateOfBirth) || null,
              status: d.status === "inactive" ? "inactive" : "active",
              isLicensed: !!d.isLicensed,
              trainingGroup: d.trainingGroup || d.group || "",
              registrationDate: formatDobString(d.registrationDate) || null,
            });
          }
        }

        // Determine selected child
        let activeChildId =
          requestedChildId && linkedIds.includes(requestedChildId)
            ? requestedChildId
            : children[0]?.id || "";

        if (!activeChildId && children.length > 0) {
          activeChildId = children[0].id;
        }

        const selectedChildSummary =
          children.find((c) => c.id === activeChildId) || null;
        const selectedChildRaw = activeChildId
          ? memberDocsMap.get(activeChildId) || {}
          : {};

        // Get permissions for active child
        const permissions: ParentMemberPermissions =
          activeChildId && parent.permissionsPerMember?.[activeChildId]
            ? parent.permissionsPerMember[activeChildId]
            : DefaultParentMemberPermissions;

        // Filter visible fields strictly according to permissions
        const visibleData = selectedChildSummary
          ? {
              id: selectedChildSummary.id,
              fullName: selectedChildSummary.fullName,
              status: permissions.showStatusBadge
                ? selectedChildSummary.status
                : "active",
              isLicensed: selectedChildSummary.isLicensed,
              // Granular permission protected fields mapped to MemberSchema:
              birthDate: permissions.showBirthDate
                ? formatDobString(selectedChildRaw.dateOfBirth) ||
                  selectedChildSummary.dateOfBirth ||
                  null
                : null,
              ageGroup: permissions.showAgeGroup
                ? selectedChildRaw.ageGroup ||
                  getAgeGroup(
                    selectedChildSummary.dateOfBirth ||
                      selectedChildRaw.dateOfBirth
                  ) ||
                  null
                : null,
              phone: permissions.showPhone
                ? selectedChildRaw.phone || null
                : null,
              address: permissions.showAddress
                ? selectedChildRaw.address || null
                : null,
              school: permissions.showSchool
                ? selectedChildRaw.educationInstitution ||
                  selectedChildRaw.school ||
                  null
                : null,
              apparelSize: permissions.showApparelSize
                ? selectedChildRaw.apparelSize ||
                  selectedChildRaw.tShirtSize ||
                  null
                : null,
              emergencyContact: permissions.showEmergencyContact
                ? (() => {
                    const emName =
                      typeof selectedChildRaw.emergencyContactName === "string"
                        ? selectedChildRaw.emergencyContactName.trim()
                        : "";
                    const emPhone =
                      typeof selectedChildRaw.emergencyContactPhone === "string"
                        ? selectedChildRaw.emergencyContactPhone.trim()
                        : "";
                    const emRole =
                      selectedChildRaw.emergencyContactRole === "mother"
                        ? "Майка"
                        : selectedChildRaw.emergencyContactRole === "father"
                          ? "Баща"
                          : "";
                    if (emName || emPhone) {
                      return `${emName}${emRole ? ` (${emRole})` : ""}${emPhone ? `${emName ? " - " : ""}${emPhone}` : ""}`.trim();
                    }
                    return (
                      selectedChildRaw.emergencyContact ||
                      selectedChildRaw.parentPhone ||
                      selectedChildRaw.motherPhone ||
                      selectedChildRaw.fatherPhone ||
                      null
                    );
                  })()
                : null,
              healthNotes: permissions.showHealthNotes
                ? selectedChildRaw.healthConditionNotes ||
                  selectedChildRaw.healthNotes ||
                  null
                : null,
            }
          : null;

        // Fetch pending corrections for active child
        const pendingCorrections: Record<
          string,
          { proposedValue: string; createdAt: string }
        > = {};
        if (activeChildId) {
          const corrSnap = await adminDb
            .collection(PARENT_CORRECTIONS_COLLECTION)
            .where("parentUserId", "==", parent.id)
            .where("memberId", "==", activeChildId)
            .where("status", "==", "pending")
            .get();

          for (const doc of corrSnap.docs) {
            const c = doc.data() as DataCorrectionRequest;
            pendingCorrections[c.fieldKey] = {
              proposedValue: c.proposedValue,
              createdAt: c.createdAt,
            };
          }
        }

        // Fetch submitted absences for active child
        let absences: ParentAbsence[] = [];
        if (activeChildId) {
          const absSnap = await adminDb
            .collection(PARENT_ABSENCES_COLLECTION)
            .where("parentUserId", "==", parent.id)
            .where("memberId", "==", activeChildId)
            .get();

          absences = absSnap.docs
            .map((d) => ({ ...d.data(), id: d.id }) as ParentAbsence)
            .sort((a, b) =>
              (b.createdAt || "").localeCompare(a.createdAt || "")
            );
        }

        // Fetch attendances & schedule events for active child
        interface AttendeeRecord {
          memberId: string;
          attended: boolean;
          name?: string;
        }

        const attendances: ParentAttendanceRecord[] = [];

        let nextTraining: {
          title: string;
          dateText: string;
          timeText: string;
          location: string;
          isToday: boolean;
          groupName: string;
        } | null = null;

        // 1. Fetch club events from the Schedule module (siteId: "bkgalabovo")
        // This is the EXACT same source used by the Admin Schedule and Public Club Schedule.
        let announcements: ParentAnnouncement[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let allClubEvents: Array<{ id: string } & Record<string, any>> = [];

        try {
          const now = new Date();
          // Formatted in Europe/Sofia timezone
          const todaySofiaStr = now.toLocaleDateString("en-CA", {
            timeZone: "Europe/Sofia",
          });
          const tomorrow = new Date(now.getTime() + 86400000);
          const tomorrowSofiaStr = tomorrow.toLocaleDateString("en-CA", {
            timeZone: "Europe/Sofia",
          });

          // Resolve default hall location dynamically from site settings (with in-memory cache to save reads)
          let defaultHallLocation = "Спортна зала „Енергетик“";
          if (cachedHallLocation && Date.now() < cachedHallLocation.expiresAt) {
            defaultHallLocation = cachedHallLocation.value;
          } else {
            try {
              const siteDoc = await adminDb
                .collection("sites")
                .doc("bkgalabovo")
                .get();
              if (siteDoc.exists) {
                const sData = siteDoc.data();
                if (sData?.hallName?.trim()) {
                  defaultHallLocation = sData.hallName.trim();
                } else if (sData?.address?.trim()) {
                  defaultHallLocation = sData.address.split(",")[0].trim();
                }
                cachedHallLocation = {
                  value: defaultHallLocation,
                  expiresAt: Date.now() + 3600_000, // 1 hour cache
                };
              }
            } catch {
              // fallback
            }
          }

          // Bound event query to the last 6 months (matching parent fee & attendance window) to avoid full collection scans
          const sixMonthsAgoIso = new Date(
            now.getFullYear(),
            now.getMonth() - 6,
            1
          ).toISOString();

          let clubEventsSnap: FirebaseFirestore.QuerySnapshot;
          try {
            clubEventsSnap = await adminDb
              .collection("events")
              .where("siteId", "==", "bkgalabovo")
              .where("startDate", ">=", sixMonthsAgoIso)
              .get();
          } catch {
            clubEventsSnap = await adminDb
              .collection("events")
              .where("siteId", "==", "bkgalabovo")
              .get();
          }

          allClubEvents = clubEventsSnap.docs.map((d) => ({
            id: d.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(d.data() as Record<string, any>),
          }));

          // A. Populate attendance history for the active child
          // Includes ALL scheduled training sessions for the club / child's group + any event where child is an explicit attendee
          if (activeChildId) {
            const childGroup =
              selectedChildSummary?.trainingGroup?.trim().toLowerCase() || "";
            const childRegDate = selectedChildSummary?.registrationDate
              ? new Date(selectedChildSummary.registrationDate)
              : null;

            for (const e of allClubEvents) {
              if (e.isCancelled) continue;

              const attendeesList = (
                Array.isArray(e.attendees) ? e.attendees : []
              ) as AttendeeRecord[];
              const attendeeEntry = attendeesList.find(
                (a) => a.memberId === activeChildId
              );
              const attendeeMemberIds = Array.isArray(e.attendeeMemberIds)
                ? e.attendeeMemberIds
                : [];
              const isExplicitAttendee =
                !!attendeeEntry || attendeeMemberIds.includes(activeChildId);

              const isTraining =
                e.type === "training" ||
                (typeof e.title === "string" &&
                  e.title.toLowerCase().includes("трениров"));

              // If not an explicit attendee and not a training session, skip
              if (!isExplicitAttendee && !isTraining) {
                continue;
              }

              // If not explicit attendee, check if this training session matches child's group
              if (!isExplicitAttendee && isTraining) {
                const eventGroup =
                  typeof e.trainingGroup === "string"
                    ? e.trainingGroup.trim().toLowerCase()
                    : "";
                if (eventGroup && childGroup && eventGroup !== childGroup) {
                  continue;
                }
              }

              const startIso =
                typeof e.startDate === "string" ? e.startDate : "";
              const endIso =
                typeof e.endDate === "string" ? e.endDate : startIso;
              if (!startIso) continue;

              const eventStartDate = new Date(startIso);
              if (isNaN(eventStartDate.getTime())) continue;

              // If event was strictly before the child's registration date, skip
              if (
                childRegDate &&
                !isNaN(childRegDate.getTime()) &&
                eventStartDate.getTime() < childRegDate.getTime()
              ) {
                continue;
              }

              const isUpcoming = eventStartDate.getTime() > now.getTime();
              const attended = attendeeEntry
                ? !!attendeeEntry.attended
                : attendeeMemberIds.includes(activeChildId);

              // Check if parent submitted an active absence for this event's date
              const eventDateKey = eventStartDate.toLocaleDateString("en-CA", {
                timeZone: "Europe/Sofia",
              });
              const matchedAbsence = absences.find((abs) => {
                if (abs.status === "cancelled_by_parent") return false;
                const absStart = abs.startDate;
                const absEnd = abs.endDate || abs.startDate;
                return eventDateKey >= absStart && eventDateKey <= absEnd;
              });

              attendances.push({
                id: String(e.id),
                title:
                  (typeof e.title === "string" && e.title.trim()) ||
                  "Тренировка",
                type:
                  (typeof e.type === "string" && e.type.trim()) || "training",
                startDate: startIso,
                endDate: endIso,
                location:
                  (typeof e.location === "string" && e.location.trim()) ||
                  defaultHallLocation,
                attended,
                isUpcoming,
                isExcused: !!matchedAbsence,
                absenceReason: matchedAbsence?.reason || null,
                coachReply: matchedAbsence?.coachReply || null,
              });
            }

            // Sort attendances desc (newest first)
            attendances.sort((a, b) => b.startDate.localeCompare(a.startDate));
          }

          // B. Resolve NEXT TRAINING directly from the official Club Schedule
          // Training events (not cancelled, endDate >= now) matching the child's group if set
          const childGroup = selectedChildSummary?.trainingGroup;
          const upcomingTrainings = allClubEvents
            .filter((e) => {
              if (e.isCancelled) return false;
              const isTrain =
                e.type === "training" ||
                (typeof e.title === "string" &&
                  e.title.toLowerCase().includes("трениров"));
              if (!isTrain) return false;

              const start = typeof e.startDate === "string" ? e.startDate : "";
              const end = typeof e.endDate === "string" ? e.endDate : start;
              if (!start) return false;

              // Event end time must not be in the past
              const endDateObj = new Date(end || start);
              if (endDateObj.getTime() < now.getTime()) {
                return false;
              }

              // If event has group assigned, verify child matches (or event is open to all)
              if (
                e.trainingGroup &&
                childGroup &&
                e.trainingGroup !== childGroup
              ) {
                return false;
              }

              // If child already checked-in and attended today's session and it ended or is in progress
              if (activeChildId) {
                const attendeesList = (
                  Array.isArray(e.attendees) ? e.attendees : []
                ) as AttendeeRecord[];
                const attendeeEntry = attendeesList.find(
                  (a) => a.memberId === activeChildId
                );
                if (
                  attendeeEntry &&
                  attendeeEntry.attended &&
                  endDateObj.getTime() < now.getTime()
                ) {
                  return false;
                }
              }

              return true;
            })
            .sort((a, b) => {
              const aStart = typeof a.startDate === "string" ? a.startDate : "";
              const bStart = typeof b.startDate === "string" ? b.startDate : "";
              return aStart.localeCompare(bStart);
            });

          if (upcomingTrainings.length > 0) {
            const nextEv = upcomingTrainings[0];
            const evDate = new Date(nextEv.startDate as string);
            const evDateSofiaStr = evDate.toLocaleDateString("en-CA", {
              timeZone: "Europe/Sofia",
            });
            const isToday = evDateSofiaStr === todaySofiaStr;
            const isTomorrow = evDateSofiaStr === tomorrowSofiaStr;

            let dateText = evDate.toLocaleDateString("bg-BG", {
              timeZone: "Europe/Sofia",
              weekday: "long",
              day: "numeric",
              month: "long",
            });
            dateText = dateText.charAt(0).toUpperCase() + dateText.slice(1);
            if (isToday) dateText = "Днес";
            else if (isTomorrow) dateText = "Утре";

            const startTimeFormatted = evDate.toLocaleTimeString("bg-BG", {
              timeZone: "Europe/Sofia",
              hour: "2-digit",
              minute: "2-digit",
            });

            let timeText = `${startTimeFormatted} ч.`;
            if (nextEv.endDate) {
              const endEvDate = new Date(nextEv.endDate as string);
              const endTimeFormatted = endEvDate.toLocaleTimeString("bg-BG", {
                timeZone: "Europe/Sofia",
                hour: "2-digit",
                minute: "2-digit",
              });
              timeText = `${startTimeFormatted} - ${endTimeFormatted} ч.`;
            }

            nextTraining = {
              title:
                typeof nextEv.title === "string" && nextEv.title.trim()
                  ? nextEv.title.trim()
                  : "Тренировка",
              dateText,
              timeText,
              location:
                typeof nextEv.location === "string" && nextEv.location.trim()
                  ? nextEv.location.trim()
                  : defaultHallLocation,
              isToday,
              groupName:
                (typeof nextEv.trainingGroup === "string" &&
                  nextEv.trainingGroup) ||
                childGroup ||
                "Всички групи",
            };
          }

          // C. Upcoming Club Events & Tournaments for Announcements (Chronological order)
          announcements = allClubEvents
            .filter((e) => {
              if (e.isCancelled) return false;
              const isTrain =
                e.type === "training" ||
                (typeof e.title === "string" &&
                  e.title.toLowerCase().includes("трениров"));
              if (isTrain) return false;

              const start = typeof e.startDate === "string" ? e.startDate : "";
              if (!start) return false;
              const startSofiaStr = new Date(start).toLocaleDateString(
                "en-CA",
                {
                  timeZone: "Europe/Sofia",
                }
              );
              return startSofiaStr >= todaySofiaStr;
            })
            .sort((a, b) => {
              const aStart = typeof a.startDate === "string" ? a.startDate : "";
              const bStart = typeof b.startDate === "string" ? b.startDate : "";
              return aStart.localeCompare(bStart);
            })
            .slice(0, 5)
            .map((e) => {
              const eTitle =
                typeof e.title === "string" ? e.title : "Предстоящо събитие";
              const eLocation =
                typeof e.location === "string" && e.location.trim()
                  ? e.location.trim()
                  : defaultHallLocation;
              const eStartDate =
                typeof e.startDate === "string" ? e.startDate : "";
              const eEndDate =
                typeof e.endDate === "string" ? e.endDate : eStartDate;
              const eDescription =
                typeof e.description === "string" ? e.description : "";
              const eTournamentUrl =
                typeof e.tournamentUrl === "string" ? e.tournamentUrl : null;
              const eTournamentId =
                typeof e.tournamentId === "string" ? e.tournamentId : null;
              const eAttachmentUrl =
                typeof e.attachmentUrl === "string" ? e.attachmentUrl : null;
              const eAttachmentName =
                typeof e.attachmentName === "string" ? e.attachmentName : null;
              const eAttachmentType =
                typeof e.attachmentType === "string" ? e.attachmentType : null;
              const eImageUrl =
                typeof e.imageUrl === "string" ? e.imageUrl : null;
              const eType = typeof e.type === "string" ? e.type : "competition";
              const isTournament =
                eType === "competition" ||
                Boolean(eTournamentUrl) ||
                Boolean(eTournamentId);

              let periodText = "";
              if (eStartDate) {
                const s = new Date(eStartDate);
                const eDate = eEndDate ? new Date(eEndDate) : null;
                if (isValid(s)) {
                  if (
                    !eDate ||
                    !isValid(eDate) ||
                    format(s, "yyyyMMdd") === format(eDate, "yyyyMMdd")
                  ) {
                    const dateStr = format(s, "dd.MM.yyyy 'г.' (EEEE)", {
                      locale: bg,
                    });
                    const timeS = format(s, "HH:mm");
                    const timeE =
                      eDate && isValid(eDate) ? format(eDate, "HH:mm") : "";
                    if (
                      timeS !== "00:00" &&
                      timeE &&
                      timeE !== timeS &&
                      timeE !== "00:00"
                    ) {
                      periodText = `${dateStr} | ${timeS} — ${timeE} ч.`;
                    } else if (timeS !== "00:00") {
                      periodText = `${dateStr} | ${timeS} ч.`;
                    } else {
                      periodText = dateStr;
                    }
                  } else {
                    const hasHours =
                      format(s, "HH:mm") !== "00:00" ||
                      format(eDate, "HH:mm") !== "00:00";
                    if (hasHours) {
                      const startStr = format(
                        s,
                        "dd.MM.yyyy 'г.' (EE) HH:mm 'ч.'",
                        {
                          locale: bg,
                        }
                      );
                      const endStr = format(
                        eDate,
                        "dd.MM.yyyy 'г.' (EE) HH:mm 'ч.'",
                        {
                          locale: bg,
                        }
                      );
                      periodText = `${startStr} — ${endStr}`;
                    } else {
                      const startStr = format(s, "dd.MM.yyyy", { locale: bg });
                      const endStr = format(eDate, "dd.MM.yyyy 'г.'", {
                        locale: bg,
                      });
                      periodText = `${startStr} — ${endStr}`;
                    }
                  }
                }
              }

              const icon = eType === "camp" ? "⛺" : isTournament ? "🏆" : "🏸";

              return {
                id: String(e.id),
                title: `${icon} ${eTitle}`,
                content: `${eLocation ? `Място: ${eLocation}. ` : ""}${periodText ? `Период: ${periodText}` : ""}`,
                date: eStartDate || new Date().toISOString(),
                startDate: eStartDate,
                endDate: eEndDate,
                periodText,
                location: eLocation,
                description: eDescription,
                tournamentUrl: eTournamentUrl,
                tournamentId: eTournamentId,
                attachmentUrl: eAttachmentUrl,
                attachmentName: eAttachmentName,
                attachmentType: eAttachmentType,
                imageUrl: eImageUrl,
                isTournament,
                type: eType,
                priority: "info" as const,
              };
            });
        } catch (err) {
          console.warn(
            "Error fetching schedule events for parent portal:",
            err
          );
        }

        // ---------------------------------------------------------------------------
        // 2. Fetch Optional Extended Sections Controlled by Admin Permissions
        // ---------------------------------------------------------------------------
        let documentsData: ParentDocumentsData | null = null;
        let feeStatus: ParentFeeStatusData | null = null;
        let rankingData: ParentRankingData | null = null;
        let shadowAndQuizzes: ParentShadowAndQuizzesData | null = null;

        if (activeChildId) {
          // A. Documents & Medical Certificate Status + Sent Document Requests
          try {
            const docReqsSnap = await adminDb
              .collection("document_requests")
              .where("memberId", "==", activeChildId)
              .get();

            const sentDocuments: ParentSentDocumentItem[] = docReqsSnap.docs
              .map((d) => {
                const raw = d.data();
                const isExpired =
                  raw.status === "pending" &&
                  raw.expiresAt &&
                  new Date(raw.expiresAt).getTime() < Date.now();
                return {
                  id: d.id,
                  token: String(raw.token || ""),
                  memberId: String(raw.memberId || activeChildId),
                  memberName: String(
                    raw.memberName || selectedChildSummary?.fullName || ""
                  ),
                  documentType: String(raw.documentType || ""),
                  documentTitle: String(
                    raw.documentTitleSnapshot || raw.documentTitle || "Документ"
                  ),
                  status: (isExpired ? "expired" : raw.status || "pending") as
                    "pending" | "completed" | "expired" | "cancelled",
                  createdAt: String(raw.createdAt || ""),
                  expiresAt: String(raw.expiresAt || ""),
                  viewedByParentAt: raw.viewedByParentAt || null,
                  signedAt: raw.signedAt || null,
                  signatureUrl: raw.signatureUrl || null,
                  secondParentSignatureUrl:
                    raw.secondParentSignatureUrl || null,
                  memberSignatureUrl: raw.memberSignatureUrl || null,
                  presidentSignatureUrl: raw.presidentSignatureUrl || null,
                  presidentSignedAt: raw.presidentSignedAt || null,
                  parentData: raw.parentData || null,
                  documentLegalTextSnapshot:
                    raw.documentLegalTextSnapshot || null,
                  documentTitleSnapshot:
                    raw.documentTitleSnapshot || raw.documentTitle || null,
                };
              })
              .filter((d) => d.status !== "cancelled")
              .sort((a, b) =>
                (b.createdAt || "").localeCompare(a.createdAt || "")
              );

            const hasPendingSentDocs = sentDocuments.some(
              (d) => d.status === "pending"
            );

            if (
              permissions.showDocumentsStatus !== false ||
              hasPendingSentDocs
            ) {
              // Periodic medical certificate validity (6 months / 180 days from issueDate)
              const medIssueStr = formatDobString(
                selectedChildRaw.medicalCertificateDate
              );
              let medExpiresAt: string | null = null;
              let medIsExpired = false;
              let daysUntilExpiry: number | null = null;

              if (medIssueStr) {
                const issueDateObj = new Date(medIssueStr);
                if (!isNaN(issueDateObj.getTime())) {
                  const expDate = new Date(issueDateObj.getTime());
                  expDate.setMonth(expDate.getMonth() + 6);
                  medExpiresAt = expDate.toISOString().slice(0, 10);
                  const diffMs = expDate.getTime() - Date.now();
                  daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                  medIsExpired = daysUntilExpiry < 0;
                }
              }

              const hasMedCert =
                Boolean(selectedChildRaw.hasMedicalCertificate) ||
                Boolean(medIssueStr);

              const checklist: ParentDocumentChecklistItem[] =
                permissions.showDocumentsStatus !== false
                  ? [
                      {
                        key: "membershipApplication",
                        title: DOCUMENT_TITLES.membershipApplication,
                        hasDocument: Boolean(
                          selectedChildRaw.hasMembershipApplication
                        ),
                        handedAt:
                          selectedChildRaw.membershipApplicationHandedAt ||
                          null,
                        signatureUrl:
                          selectedChildRaw.membershipApplicationSignatureUrl ||
                          selectedChildRaw.membershipApplicationUrl ||
                          null,
                      },
                      {
                        key: "signedDeclaration",
                        title: DOCUMENT_TITLES.signedDeclaration,
                        hasDocument: Boolean(
                          selectedChildRaw.hasSignedDeclaration
                        ),
                        handedAt:
                          selectedChildRaw.signedDeclarationHandedAt || null,
                        signatureUrl:
                          selectedChildRaw.signedDeclarationUrl || null,
                      },
                      {
                        key: "travelDeclaration",
                        title: DOCUMENT_TITLES.travelDeclaration,
                        hasDocument: Boolean(
                          selectedChildRaw.hasTravelDeclaration
                        ),
                        handedAt:
                          selectedChildRaw.travelDeclarationHandedAt || null,
                        signatureUrl:
                          selectedChildRaw.travelDeclarationUrl || null,
                      },
                      {
                        key: "safetyInstruction",
                        title: DOCUMENT_TITLES.safetyInstruction,
                        hasDocument: Boolean(
                          selectedChildRaw.hasSafetyInstruction
                        ),
                        handedAt:
                          selectedChildRaw.safetyInstructionHandedAt || null,
                        signatureUrl:
                          selectedChildRaw.safetyDeclarationSignatureUrl ||
                          selectedChildRaw.safetyInstructionUrl ||
                          null,
                      },
                      {
                        key: "internalRules",
                        title: DOCUMENT_TITLES.internalRules,
                        hasDocument: Boolean(selectedChildRaw.hasInternalRules),
                        handedAt:
                          selectedChildRaw.internalRulesHandedAt || null,
                        signatureUrl:
                          selectedChildRaw.internalRulesSignatureUrl ||
                          selectedChildRaw.internalRulesUrl ||
                          null,
                      },
                      {
                        key: "amateurContract",
                        title: DOCUMENT_TITLES.amateurContract,
                        hasDocument: Boolean(
                          selectedChildRaw.hasAmateurContract
                        ),
                        handedAt:
                          selectedChildRaw.amateurContractHandedAt || null,
                        signatureUrl:
                          selectedChildRaw.amateurContractSignatureUrl ||
                          selectedChildRaw.amateurContractUrl ||
                          null,
                      },
                      {
                        key: "licenseApplication",
                        title: DOCUMENT_TITLES.licenseApplication,
                        hasDocument: Boolean(
                          selectedChildRaw.hasLicenseApplication ||
                          selectedChildRaw.isLicensed
                        ),
                        handedAt:
                          selectedChildRaw.licenseApplicationHandedAt ||
                          selectedChildRaw.isLicensedHandedAt ||
                          null,
                        signatureUrl:
                          selectedChildRaw.licenseApplicationSignatureUrl ||
                          selectedChildRaw.licenseApplicationUrl ||
                          null,
                      },
                    ]
                  : [];

              documentsData = {
                medicalCertificate: {
                  hasCertificate: hasMedCert,
                  issueDate: medIssueStr || null,
                  expiresAt: medExpiresAt,
                  isExpired: medIsExpired,
                  daysUntilExpiry,
                  url:
                    (selectedChildRaw.medicalCertificateUrl as string) || null,
                  fileName:
                    (selectedChildRaw.medicalCertificateFileName as string) ||
                    null,
                  status:
                    (selectedChildRaw.medicalCertificateStatus as
                      "valid" | "pending_review" | "rejected" | "expired") ||
                    (hasMedCert ? "valid" : undefined),
                  uploadedAt:
                    (selectedChildRaw.medicalCertificateUploadedAt as string) ||
                    null,
                },
                checklist,
                sentDocuments,
              };
            }
          } catch (err) {
            console.warn("Error fetching parent documents data:", err);
          }

          // B. Monthly Fee & Club Subscription Status
          if (permissions.showFeeStatus !== false) {
            try {
              const nowDate = new Date();
              const currentMonthKey = format(nowDate, "yyyy-MM");
              const currentMonthRawLabel = format(nowDate, "LLLL yyyy", {
                locale: bg,
              });
              const currentMonthLabel =
                currentMonthRawLabel.charAt(0).toUpperCase() +
                currentMonthRawLabel.slice(1);

              // Query sales for this child (and family if familyId is present)
              const salesSnap = await adminDb
                .collection("sales")
                .where("memberId", "==", activeChildId)
                .get();

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const childSales: Array<{ id: string } & Record<string, any>> =
                salesSnap.docs.map((d) => ({
                  id: d.id,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ...(d.data() as Record<string, any>),
                }));

              if (selectedChildRaw.familyId) {
                try {
                  const familyMemberIds = new Set<string>();
                  for (const [mId, mData] of memberDocsMap.entries()) {
                    if (
                      mId !== activeChildId &&
                      mData.familyId === selectedChildRaw.familyId
                    ) {
                      familyMemberIds.add(mId);
                    }
                  }
                  const famMembersSnap = await adminDb
                    .collection(MEMBERS_COLLECTION)
                    .where("familyId", "==", selectedChildRaw.familyId)
                    .get();
                  for (const fmDoc of famMembersSnap.docs) {
                    if (fmDoc.id !== activeChildId) {
                      familyMemberIds.add(fmDoc.id);
                    }
                  }

                  const otherFamilyMemberIds = Array.from(familyMemberIds);
                  for (let i = 0; i < otherFamilyMemberIds.length; i += 10) {
                    const chunk = otherFamilyMemberIds.slice(i, i + 10);
                    const famSalesSnap = await adminDb
                      .collection("sales")
                      .where("memberId", "in", chunk)
                      .get();
                    for (const fd of famSalesSnap.docs) {
                      if (!childSales.some((cs) => cs.id === fd.id)) {
                        childSales.push({
                          id: fd.id,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          ...(fd.data() as Record<string, any>),
                        });
                      }
                    }
                  }
                } catch {
                  // ignore
                }
              }

              childSales.sort((a, b) =>
                String(b.saleDate || b.createdAt || "").localeCompare(
                  String(a.saleDate || a.createdAt || "")
                )
              );

              let unpaidSalesCount = 0;
              let unpaidSalesAmount = 0;

              const isSubscriptionItemName = (name: string): boolean => {
                const lower = name.toLowerCase();
                return (
                  lower.includes("месечна") ||
                  lower.includes("такса") ||
                  lower.includes("членски") ||
                  lower.includes("абонамент") ||
                  lower.includes("годишна")
                );
              };

              const transactions: ParentFinancialTransactionItem[] =
                childSales.map((s) => {
                  const isPaid =
                    s.isPaid === true ||
                    s.status === "paid" ||
                    s.status === "completed";
                  const amount = Number(s.totalAmount || s.amount || 0);
                  if (!isPaid && s.status !== "cancelled") {
                    unpaidSalesCount++;
                    unpaidSalesAmount += amount;
                  }

                  const itemsList = Array.isArray(s.items) ? s.items : [];
                  const mappedItems: ParentFinancialItemDetail[] =
                    itemsList.map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (it: any) => {
                        const qty = Number(it?.quantity || 1);
                        const price = Number(it?.price || 0);
                        const itemTotal = Number((qty * price).toFixed(2));
                        return {
                          name: String(
                            it?.name || it?.serviceName || "Артикул"
                          ),
                          quantity: qty,
                          price,
                          total: itemTotal,
                        };
                      }
                    );

                  const itemNames = mappedItems
                    .map((it) => it.name)
                    .join(" ")
                    .toLowerCase();
                  let type:
                    | "inventory"
                    | "subscription"
                    | "service"
                    | "general_service" = "service";
                  let typeLabel = "🏸 Тренировка / Такса";

                  if (
                    s.type === "inventory" ||
                    s.category === "inventory" ||
                    itemNames.includes("ракета") ||
                    itemNames.includes("грип") ||
                    itemNames.includes("перца") ||
                    itemNames.includes("перо") ||
                    itemNames.includes("кордаж") ||
                    itemNames.includes("екип") ||
                    itemNames.includes("тениска") ||
                    itemNames.includes("шорти") ||
                    itemNames.includes("чорапи") ||
                    itemNames.includes("сак") ||
                    itemNames.includes("бутилка") ||
                    itemNames.includes("магазин")
                  ) {
                    type = "inventory";
                    typeLabel = "🛍️ Магазин / Екипировка";
                  } else if (
                    s.type === "subscription" ||
                    isSubscriptionItemName(itemNames) ||
                    (s.targetMonthLabels && s.targetMonthLabels.length > 0)
                  ) {
                    type = "subscription";
                    typeLabel = "💳 Членски внос / Абонамент";
                  } else if (s.type === "general_service") {
                    type = "general_service";
                    typeLabel = "🏸 Клубна услуга";
                  }

                  const desc =
                    mappedItems
                      .map(
                        (it) =>
                          `${it.name}${it.quantity > 1 ? ` (x${it.quantity})` : ""}`
                      )
                      .join(", ") ||
                    s.description ||
                    s.notes ||
                    typeLabel;

                  const rawDate = String(s.saleDate || s.createdAt || "");
                  let issueDate = "";
                  if (rawDate) {
                    try {
                      issueDate = format(new Date(rawDate), "dd.MM.yyyy г.");
                    } catch {
                      issueDate = rawDate.slice(0, 10);
                    }
                  }

                  return {
                    id: s.id,
                    receiptNumber: (s.id || "").substring(0, 8).toUpperCase(),
                    date: rawDate,
                    issueDate,
                    amount: Number(amount.toFixed(2)),
                    description: desc,
                    isPaid,
                    status: String(
                      s.status || (isPaid ? "completed" : "pending")
                    ),
                    type,
                    typeLabel,
                    paymentMethod: String(s.paymentMethod || "В брой"),
                    items: mappedItems,
                    note: s.note ? String(s.note) : null,
                    targetMonthLabels: Array.isArray(s.targetMonthLabels)
                      ? s.targetMonthLabels
                      : undefined,
                    targetEventDates: Array.isArray(s.targetEventDates)
                      ? s.targetEventDates
                      : undefined,
                  };
                });

              const recentPayments = transactions.slice(0, 8).map((t) => ({
                id: t.id,
                date: t.date,
                amount: t.amount,
                description: t.description,
                isPaid: t.isPaid,
              }));

              // Monthly breakdown for the last 6 months from allClubEvents
              const monthMap = new Map<
                string,
                { paid: number; unpaid: number; total: number }
              >();
              for (let i = 0; i < 6; i++) {
                const d = new Date(
                  nowDate.getFullYear(),
                  nowDate.getMonth() - i,
                  1
                );
                const mKey = format(d, "yyyy-MM");
                monthMap.set(mKey, { paid: 0, unpaid: 0, total: 0 });
              }

              for (const ev of allClubEvents) {
                if (ev.isCancelled) continue;
                const startIso =
                  typeof ev.startDate === "string" ? ev.startDate : "";
                if (!startIso) continue;
                const mKey = startIso.slice(0, 7);
                const bucket = monthMap.get(mKey);
                if (!bucket) continue;

                const attendeesList = Array.isArray(ev.attendees)
                  ? ev.attendees
                  : [];

                const entry = attendeesList.find(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (a: any) => a?.memberId === activeChildId && a?.attended
                );
                if (entry) {
                  bucket.total++;
                  if (entry.paymentStatus === "paid") {
                    bucket.paid++;
                  } else {
                    bucket.unpaid++;
                  }
                }
              }

              // Check if member has a paid subscription sale in a given month
              const paidSubscriptionMonths = new Set<string>();
              for (const s of childSales) {
                const isPaid =
                  s.isPaid === true ||
                  s.status === "paid" ||
                  s.status === "completed";
                if (isPaid) {
                  const sDate = String(s.saleDate || s.createdAt || "");
                  if (sDate.length >= 7) {
                    paidSubscriptionMonths.add(sDate.slice(0, 7));
                  }
                }
              }

              const lastPaymentDateStr =
                formatDobString(selectedChildRaw.lastPaymentDate) ||
                recentPayments.find((p) => p.isPaid)?.date?.slice(0, 10) ||
                null;

              if (lastPaymentDateStr && lastPaymentDateStr.length >= 7) {
                paidSubscriptionMonths.add(lastPaymentDateStr.slice(0, 7));
              }

              const overdueCheck = checkIsMemberOverdue({
                id: activeChildId,
                lastPaymentDate:
                  selectedChildRaw.lastPaymentDate || lastPaymentDateStr,
                registrationDate:
                  selectedChildRaw.registrationDate || new Date().toISOString(),
                status: selectedChildSummary?.status || "active",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any);
              const isOverdue = Boolean(overdueCheck.isOverdue);

              const monthlyBreakdown: ParentFeeMonthItem[] = Array.from(
                monthMap.entries()
              ).map(([mKey, counts]) => {
                const [yStr, mStr] = mKey.split("-");
                const dObj = new Date(Number(yStr), Number(mStr) - 1, 1);
                const rawLbl = format(dObj, "LLLL yyyy", { locale: bg });
                const monthLabel =
                  rawLbl.charAt(0).toUpperCase() + rawLbl.slice(1);

                const hasPaidSubInMonth = paidSubscriptionMonths.has(mKey);
                let status: "paid" | "unpaid" | "partial" | "no_trainings" =
                  "no_trainings";

                if (counts.total === 0) {
                  status = hasPaidSubInMonth ? "paid" : "no_trainings";
                } else if (counts.unpaid === 0 || hasPaidSubInMonth) {
                  status = "paid";
                } else if (counts.paid > 0) {
                  status = "partial";
                } else {
                  status = "unpaid";
                }

                return {
                  monthKey: mKey,
                  monthLabel,
                  totalTrainings: counts.total,
                  paidTrainings: hasPaidSubInMonth ? counts.total : counts.paid,
                  unpaidTrainings: hasPaidSubInMonth ? 0 : counts.unpaid,
                  status,
                };
              });

              const currMonthEntry = monthlyBreakdown[0];
              let currentMonthStatus:
                "paid" | "unpaid" | "partial" | "active_subscription" =
                "active_subscription";

              if (paidSubscriptionMonths.has(currentMonthKey) || !isOverdue) {
                currentMonthStatus = "paid";
              } else if (
                currMonthEntry?.status === "unpaid" ||
                unpaidSalesCount > 0
              ) {
                currentMonthStatus = "unpaid";
              } else if (currMonthEntry?.status === "partial") {
                currentMonthStatus = "partial";
              } else if (isOverdue) {
                currentMonthStatus = "unpaid";
              }

              feeStatus = {
                currentMonthKey,
                currentMonthLabel,
                currentMonthStatus,
                isOverdue: isOverdue || unpaidSalesCount > 0,
                lastPaymentDate: lastPaymentDateStr,
                unpaidSalesCount,
                unpaidSalesAmount: Number(unpaidSalesAmount.toFixed(2)),
                transactions,
                recentPayments,
                monthlyBreakdown,
              };
            } catch (err) {
              console.warn("Error computing parent fee status:", err);
            }
          }

          // C. Club Ranking (Optional)
          if (permissions.showRanking) {
            rankingData = {
              rankingPoints: Number(selectedChildRaw.rankingPoints || 0),
              rankingPosition:
                typeof selectedChildRaw.rankingPosition === "number" &&
                selectedChildRaw.rankingPosition > 0
                  ? selectedChildRaw.rankingPosition
                  : null,
              isLicensed: Boolean(selectedChildRaw.isLicensed),
            };
          }

          // D. Shadow Badminton & Educational Quizzes (Optional)
          if (permissions.showShadowAndQuizzes) {
            try {
              const [trainingsSnap, quizSnap] = await Promise.all([
                adminDb
                  .collection("trainings")
                  .where("memberIds", "array-contains", activeChildId)
                  .get(),
                adminDb
                  .collection("theory_results")
                  .where("playerId", "==", activeChildId)
                  .get(),
              ]);

              const shadowDocs = trainingsSnap.docs
                .map((d) => d.data())
                .filter((t) => t.type === "shadow" || Boolean(t.shadowDetails))
                .sort((a, b) =>
                  String(b.date || "").localeCompare(String(a.date || ""))
                );

              let reactionSum = 0;
              let reactionCount = 0;
              let totalDurationMs = 0;
              const paceHistory: Array<{ date: string; paceSec: number }> = [];

              for (const s of shadowDocs) {
                if (typeof s.durationMs === "number") {
                  totalDurationMs += s.durationMs;
                }
                if (typeof s.shadowDetails?.paceSec === "number") {
                  reactionSum += s.shadowDetails.paceSec;
                  reactionCount++;
                  paceHistory.push({
                    date: s.date ? String(s.date).slice(0, 10) : "",
                    paceSec: s.shadowDetails.paceSec,
                  });
                }
              }

              const chronologicalPaceHistory = paceHistory.reverse().slice(-8);
              const totalShadowMinutes = Math.round(totalDurationMs / 60000);

              let perseveranceBadge: ParentShadowAndQuizzesData["perseveranceBadge"] =
                null;
              if (totalShadowMinutes >= 120) {
                perseveranceBadge = {
                  title: "Елитен Footwork Атлет",
                  level: "gold",
                  icon: "🏆",
                };
              } else if (totalShadowMinutes >= 60) {
                perseveranceBadge = {
                  title: "Златно Постоянство",
                  level: "gold",
                  icon: "🥇",
                };
              } else if (totalShadowMinutes >= 30) {
                perseveranceBadge = {
                  title: "Сребърно Постоянство",
                  level: "silver",
                  icon: "🥈",
                };
              } else if (totalShadowMinutes >= 10) {
                perseveranceBadge = {
                  title: "Бронзов Старт",
                  level: "bronze",
                  icon: "🥉",
                };
              } else if (shadowDocs.length > 0) {
                perseveranceBadge = {
                  title: "Активен Footwork Играч",
                  level: "starter",
                  icon: "⚡",
                };
              }

              const quizDocs = quizSnap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .sort((a, b) =>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  String((b as any).submittedAt || "").localeCompare(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    String((a as any).submittedAt || "")
                  )
                );

              let fundamentalProfile: MemberFundamentalProfile | null = null;
              let latestBeepTest: ParentLatestBeepTest | null = null;
              const recentSessionReports: ParentSessionReportItem[] = [];

              try {
                const [assessmentsSnap, beepSnap, plannerAttSnap] =
                  await Promise.all([
                    adminDb
                      .collection("member_assessments")
                      .where("memberId", "==", activeChildId)
                      .get(),
                    adminDb
                      .collection("beep_test_results")
                      .where("memberId", "==", activeChildId)
                      .get(),
                    adminDb
                      .collection("training_attendance")
                      .where("memberId", "==", activeChildId)
                      .get(),
                  ]);

                const assessments: MemberAssessment[] =
                  assessmentsSnap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Omit<MemberAssessment, "id">),
                  }));

                const beepResults: BeepTestResult[] = beepSnap.docs
                  .map((d) => ({
                    id: d.id,
                    ...(d.data() as Omit<BeepTestResult, "id">),
                  }))
                  .sort((a, b) =>
                    String(b.date || "").localeCompare(String(a.date || ""))
                  );

                if (beepResults.length > 0) {
                  const latest = beepResults[0];
                  latestBeepTest = {
                    date: String(latest.date || ""),
                    level: Number(latest.level || 0),
                    shuttle: Number(latest.shuttle || 0),
                    vo2Max:
                      typeof latest.vo2max === "number"
                        ? latest.vo2max
                        : undefined,
                    score: latest.score ? String(latest.score) : undefined,
                  };
                }

                fundamentalProfile = evaluateMemberFundamentals({
                  memberId: activeChildId,
                  birthDate:
                    typeof selectedChildRaw.dateOfBirth === "string"
                      ? selectedChildRaw.dateOfBirth
                      : null,
                  assessments,
                  beepResults,
                });

                // Fetch published planner session reports for recent attendances
                const attDocs = plannerAttSnap.docs
                  .map((d) => d.data())
                  .filter((a) => Boolean(a.sessionId))
                  .sort((a, b) =>
                    String(b.date || "").localeCompare(String(a.date || ""))
                  )
                  .slice(0, 12);

                const uniqueSessionIds = Array.from(
                  new Set(attDocs.map((a) => String(a.sessionId)))
                );

                if (uniqueSessionIds.length > 0) {
                  const sessionSnaps = await Promise.all(
                    uniqueSessionIds.map((sid) =>
                      adminDb
                        .collection("planner_sessions")
                        .doc(sid)
                        .get()
                        .catch(() => null)
                    )
                  );
                  const sessionMap = new Map<string, Record<string, unknown>>();
                  for (const sSnap of sessionSnaps) {
                    if (sSnap && sSnap.exists) {
                      sessionMap.set(
                        sSnap.id,
                        (sSnap.data() || {}) as Record<string, unknown>
                      );
                    }
                  }

                  for (const att of attDocs) {
                    if (recentSessionReports.length >= 6) break;
                    const sid = String(att.sessionId);
                    const sData = sessionMap.get(sid);
                    if (!sData) continue;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const smartPlan = sData.smartPlan as any;
                    if (smartPlan?.publishedToParentPortal !== true) continue;

                    const primaryFid = (smartPlan?.primaryFundamentalId ||
                      smartPlan?.fundamentalId) as FundamentalId | undefined;
                    const fundamentalTitle =
                      primaryFid && BWF_FUNDAMENTAL_BY_ID[primaryFid]
                        ? BWF_FUNDAMENTAL_BY_ID[primaryFid].title
                        : typeof smartPlan?.fundamentalTitle === "string"
                          ? smartPlan.fundamentalTitle
                          : undefined;

                    const note =
                      (typeof att.notes === "string" && att.notes.trim()) ||
                      (typeof smartPlan?.parentSummary === "string" &&
                        smartPlan.parentSummary.trim()) ||
                      (typeof sData.notes === "string" && sData.notes.trim()) ||
                      undefined;

                    recentSessionReports.push({
                      sessionId: sid,
                      date: String(att.date || sData.date || ""),
                      title: String(sData.title || "Тренировка"),
                      fundamentalTitle,
                      note,
                      effort:
                        typeof att.effort === "number" ? att.effort : undefined,
                      rpe: typeof att.rpe === "number" ? att.rpe : undefined,
                    });
                  }
                }
              } catch (devErr) {
                console.warn(
                  "Error fetching fundamentals/beep/session reports for parent portal:",
                  devErr
                );
              }

              shadowAndQuizzes = {
                shadowSessionsCount: shadowDocs.length,
                totalShadowMinutes,
                perseveranceBadge,
                paceHistory: chronologicalPaceHistory,
                lastShadowDate: shadowDocs[0]?.date || null,
                averageReactionSec:
                  reactionCount > 0
                    ? Number((reactionSum / reactionCount).toFixed(2))
                    : null,
                quizzesCompletedCount: quizDocs.length,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                recentQuizzes: quizDocs.slice(0, 6).map((q: any) => ({
                  id: String(q.id),
                  title: String(q.quizTitle || "Теоретичен тест"),
                  totalScore: Number(q.totalScore || q.autoScore || 0),
                  submittedAt: String(q.submittedAt || ""),
                  status: String(q.status || "COMPLETED"),
                  coachFeedback: q.coachFeedback || q.aiFeedback || null,
                })),
                fundamentalProfile,
                recentSessionReports,
                latestBeepTest,
              };
            } catch (err) {
              console.warn("Error fetching shadow and quizzes data:", err);
            }
          }
        }

        return {
          success: true,
          data: serializeFirestoreData({
            parent,
            children,
            selectedChild: selectedChildSummary,
            permissions,
            visibleData,
            pendingCorrections,
            absences,
            attendances,
            nextTraining,
            announcements,
            documentsData,
            feeStatus,
            rankingData,
            shadowAndQuizzes,
          }),
        };
      },
      TTL_MS
    );
  } catch (error) {
    console.error("getParentDashboardDataAction error:", error);
    return {
      success: false,
      error: "Грешка при зареждане на данните за родителския портал.",
      data: null,
    };
  }
}
