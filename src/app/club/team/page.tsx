import { Medal, Trophy } from "lucide-react";
import { Metadata } from "next";
import { unstable_cache } from "next/cache";

import { CoachPhotoGallery } from "@/components/club/CoachPhotoGallery";
import { TeamAthletesSection } from "@/components/club/TeamAthletesSection";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNav } from "@/components/layout/public-nav";
import { Translate } from "@/components/shared/Translate";
import { TeamMemberForCard } from "@/lib/athlete-card-generator";
import { getAdminDb } from "@/lib/firebase-admin";
import { getSiteByIdAdmin } from "@/services/admin/site-service.admin";
import { calculateAgeGroup } from "@/services/member-service";
import { Member } from "@/types/member.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Отбор и Треньори | СНЦ Бадминтон Клуб Гълъбово",
  description:
    "Запознайте се с ръководството, треньорите и най-добрите състезатели на Бадминтон Клуб Гълъбово.",
};

// --- Helper type for Member with Tournaments ---
type TeamMember = TeamMemberForCard;

/**
 * Convert a raw value from Firestore Admin SDK to something that is safely
 * serialisable as a React prop (i.e. a plain JS value).
 * Firestore Timestamps arrive as objects with _seconds / _nanoseconds or
 * as a .toDate() method – turn all of these into ISO strings.
 */
function serializeValue(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  // Firestore Timestamp (admin SDK) – has _seconds or toDate()
  if (
    typeof val === "object" &&
    val !== null &&
    ("_seconds" in val ||
      ("toDate" in val &&
        typeof (val as { toDate: unknown }).toDate === "function"))
  ) {
    const ts = val as {
      _seconds?: number;
      _nanoseconds?: number;
      toDate?: () => Date;
    };
    if (ts.toDate) return ts.toDate().toISOString();
    if (ts._seconds !== undefined)
      return new Date(ts._seconds * 1000).toISOString();
    return String(val);
  }
  if (val instanceof Date) return val.toISOString();
  if (Array.isArray(val)) return val.map(serializeValue);
  if (typeof val === "object") {
    return Object.fromEntries(
      Object.entries(val as Record<string, unknown>).map(([k, v]) => [
        k,
        serializeValue(v),
      ])
    );
  }
  return val;
}

function serializeMember(m: TeamMember): TeamMember {
  return serializeValue(m) as TeamMember;
}

type PastEvent = {
  attendeeMemberIds?: string[];
  title?: string;
  endDate?: string | { toDate?: () => Date };
  [key: string]: unknown;
};

async function processEventsTournaments(
  pastEventsData: PastEvent[],
  memberTournamentMap: Map<string, Set<string>>
) {
  for (const event of pastEventsData) {
    if (Array.isArray(event.attendeeMemberIds)) {
      const eventTitle =
        typeof event.title === "string" ? event.title : "Състезание";
      for (const memberId of event.attendeeMemberIds) {
        if (!memberTournamentMap.has(memberId))
          memberTournamentMap.set(memberId, new Set());
        memberTournamentMap.get(memberId)!.add(eventTitle);
      }
    }
  }
}

type TournamentEntryResult = {
  title: string;
  docs: { data: () => Record<string, unknown> }[];
};

const _fetchEntriesDataRaw = async (): Promise<
  { title: string; members: string[]; partnerMembers: string[] }[]
> => {
  try {
    const adminDb = getAdminDb();
    const tournamentsSnapshot = await adminDb.collection("tournaments").get();
    const entriesFetches = tournamentsSnapshot.docs.map(async (tournDoc) => {
      const data = tournDoc.data();
      const snap = await tournDoc.ref.collection("entries").get();
      return {
        title: typeof data.title === "string" ? data.title : "Турнир",
        members: snap.docs
          .map((d) => d.data().memberId as string)
          .filter(Boolean),
        partnerMembers: snap.docs
          .map((d) => d.data().partnerMemberId as string)
          .filter(Boolean),
      };
    });
    return Promise.all(entriesFetches);
  } catch (err) {
    console.error("TeamPage: failed to fetch tournament entries:", err);
    return [];
  }
};

const fetchCachedTournamentEntries = unstable_cache(
  _fetchEntriesDataRaw,
  ["team-tournament-entries"],
  { revalidate: 300, tags: ["tournaments"] }
);

async function fetchEntriesData(): Promise<TournamentEntryResult[]> {
  const cached = await fetchCachedTournamentEntries();
  return cached.map((entry) => ({
    title: entry.title,
    docs: [
      ...entry.members.map((m) => ({
        data: () => ({ memberId: m, partnerMemberId: undefined }),
      })),
      ...entry.partnerMembers.map((p) => ({
        data: () => ({ memberId: undefined, partnerMemberId: p }),
      })),
    ],
  }));
}

function addTournamentToMember(
  memberId: unknown,
  title: string,
  map: Map<string, Set<string>>
) {
  if (typeof memberId === "string") {
    if (!map.has(memberId)) map.set(memberId, new Set());
    map.get(memberId)!.add(title);
  }
}

function assignEntriesToMap(
  allEntriesResults: {
    title: string;
    docs: { data: () => Record<string, unknown> }[];
  }[],
  memberTournamentMap: Map<string, Set<string>>
) {
  for (const { title, docs } of allEntriesResults) {
    for (const entryDoc of docs) {
      const entry = entryDoc.data();
      addTournamentToMember(entry.memberId, title, memberTournamentMap);
      addTournamentToMember(entry.partnerMemberId, title, memberTournamentMap);
    }
  }
}

async function fetchMemberTournamentsMap(pastEventsData: PastEvent[]) {
  const memberTournamentMap = new Map<string, Set<string>>();

  // Add from events
  await processEventsTournaments(pastEventsData, memberTournamentMap);

  // Add from tournaments collection (cached)
  const allEntriesResults = await fetchEntriesData();
  assignEntriesToMap(allEntriesResults, memberTournamentMap);

  return memberTournamentMap;
}

export default async function TeamPage() {
  // 1. Fetch site data (for coaches/therapists) – safe fallback
  let clubSite: import("@/types/site.types").Site | null = null;
  try {
    clubSite = await getSiteByIdAdmin("bkgalabovo");
  } catch (err) {
    console.error("TeamPage: failed to fetch site data:", err);
  }

  // 2. Fetch all members that are marked to be shown – safe fallback
  let publicMembers: Member[] = [];
  try {
    const adminDb = getAdminDb();
    const membersSnapshot = await adminDb
      .collection("members")
      .where("siteId", "==", "bkgalabovo")
      .where("showOnPublicTeam", "==", true)
      .get();
    publicMembers = membersSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Member
    );
  } catch (err) {
    console.error("TeamPage: failed to fetch members:", err);
  }

  // 3. Fetch all past competitions from the "events" calendar – safe fallback
  let pastEventsData: PastEvent[] = [];
  try {
    const adminDb = getAdminDb();
    const eventsSnapshot = await adminDb
      .collection("events")
      .where("siteId", "==", "bkgalabovo")
      .where("type", "==", "competition")
      .get();

    pastEventsData = eventsSnapshot.docs
      .map((doc) => doc.data() as PastEvent)
      .filter((data) => {
        let endDateStr = new Date().toISOString();
        if (data.endDate) {
          endDateStr =
            typeof data.endDate === "string"
              ? data.endDate
              : data.endDate.toDate?.().toISOString() || String(data.endDate);
        }
        return new Date(endDateStr) < new Date();
      });
  } catch (err) {
    console.error("TeamPage: failed to fetch events:", err);
  }

  // 4. Build map of memberId -> Set of tournament titles – safe fallback
  let memberTournamentMap = new Map<string, Set<string>>();
  try {
    memberTournamentMap = await fetchMemberTournamentsMap(pastEventsData);
  } catch (err) {
    console.error("TeamPage: failed to fetch tournament map:", err);
  }

  // 5. Enrich members with tournaments and age groups, then SERIALIZE to plain
  //    objects so Next.js can safely pass them from Server → Client components.
  //    (Firestore Admin Timestamps have _seconds/_nanoseconds which are not
  //    serialisable as React props.)
  const enrichedMembers: TeamMember[] = publicMembers.map((m) => {
    const memberTournaments = memberTournamentMap.get(m.id);
    const uniqueCompetitions = memberTournaments
      ? Array.from(memberTournaments)
      : [];

    const raw: TeamMember = {
      ...m,
      name:
        m.name?.trim() ||
        [m.firstName, m.middleName, m.lastName].filter(Boolean).join(" ") ||
        "Състезател",
      ageGroupDisplay:
        m.ageGroup || calculateAgeGroup(m.dateOfBirth) || "Мъже/Жени",
      tournaments: uniqueCompetitions,
    };

    return serializeMember(raw);
  });

  // 6. Group by age group
  const groupedMembers = enrichedMembers.reduce(
    (acc, member) => {
      const group = member.ageGroupDisplay;
      if (!acc[group]) acc[group] = [];
      acc[group].push(member);
      return acc;
    },
    {} as Record<string, TeamMember[]>
  );

  // Sort age groups logically if needed (e.g., U9, U11, U13...)
  const sortedAgeGroups = Object.keys(groupedMembers).sort((a, b) => {
    if (a.startsWith("U") && b.startsWith("U")) {
      return parseInt(a.slice(1)) - parseInt(b.slice(1));
    }
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-blue-500/30">
      <PublicNav clubSite={clubSite} />

      {/* Hero Section */}
      <section className="relative flex items-center overflow-hidden px-4 pt-14 pb-2 sm:px-6 sm:pt-16 sm:pb-3">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-linear-to-b from-blue-900/20 via-black/80 to-black" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 size-[1000px] -translate-1/2 rounded-full bg-blue-500/20 blur-[120px]" />
        </div>

        <div className="relative z-10 m-auto max-w-7xl text-center">
          <span className="mb-1 block text-[10px] font-bold tracking-[0.4em] text-blue-400 uppercase drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] sm:text-[11px]">
            Лицата на клуба
          </span>
          <h1 className="mb-2 text-2xl font-light tracking-tight sm:text-3xl md:text-4xl">
            Нашият <span className="font-semibold text-blue-400">Отбор</span>
          </h1>
          {clubSite?.teamIntro && (
            <p className="m-auto max-w-3xl text-xs leading-relaxed font-light text-zinc-400 sm:text-sm">
              {clubSite.teamIntro}
            </p>
          )}
        </div>
      </section>

      {/* Coaches Section */}
      {clubSite?.therapists && clubSite.therapists.length > 0 && (
        <section className="relative px-4 pt-2 pb-6 sm:px-6 sm:pt-3 sm:pb-8">
          <div className="relative z-10 m-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-2.5 sm:gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 sm:size-10">
                <Medal size={18} className="sm:size-5" />
              </div>
              <h2 className="text-xl font-light tracking-tight sm:text-2xl md:text-3xl">
                Ръководство и Треньори
              </h2>
            </div>

            <div
              className={
                clubSite.therapists.length === 1
                  ? "m-auto max-w-md"
                  : "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
              }
            >
              {clubSite.therapists.map((coach, idx) => {
                const cleanBio = coach.bio
                  ? coach.bio.replace("Провесионалният", "Професионалният")
                  : undefined;
                return (
                  <div
                    key={idx}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/50 bg-black/40 p-4 backdrop-blur-xl transition-all duration-500 hover:border-blue-500/30 sm:rounded-3xl sm:p-5"
                  >
                    <div className="pointer-events-none absolute top-0 right-0 size-64 rounded-full bg-blue-500/5 blur-[80px] transition-colors duration-700 group-hover:bg-blue-500/10" />

                    <CoachPhotoGallery coach={coach}>
                      <h3 className="mb-1 text-lg font-medium text-white sm:text-xl">
                        {coach.name}
                      </h3>
                      <p className="mb-2.5 text-[10px] font-semibold tracking-widest text-blue-400 uppercase sm:mb-3 sm:text-[11px]">
                        <Translate
                          bg={coach.role || "Треньор"}
                          en={
                            (coach.role || "Треньор").trim().toLowerCase() ===
                            "председател и треньор"
                              ? "President and Coach"
                              : undefined
                          }
                        />
                      </p>
                      {cleanBio && (
                        <p className="mb-2 text-xs leading-relaxed text-zinc-400 sm:text-xs">
                          {cleanBio}
                        </p>
                      )}
                    </CoachPhotoGallery>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Athletes Section */}
      <section className="relative border-t border-zinc-900/50 px-4 py-8 sm:px-6 sm:py-10 md:py-12">
        <div className="pointer-events-none absolute top-0 right-0 size-[800px] rounded-full bg-blue-500/5 blur-[150px]" />

        <div className="relative z-10 m-auto max-w-7xl">
          <div className="mb-8 flex items-center gap-3 sm:gap-4 md:mb-10">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400 sm:size-12">
              <Trophy size={22} className="sm:size-6" />
            </div>
            <h2 className="text-2xl font-light tracking-tight sm:text-3xl md:text-4xl">
              Нашите Състезатели
            </h2>
          </div>

          <TeamAthletesSection
            groupedMembers={groupedMembers}
            sortedAgeGroups={sortedAgeGroups}
          />
        </div>
      </section>

      <PublicFooter clubSite={clubSite} />
    </div>
  );
}
