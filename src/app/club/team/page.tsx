import { MapPin, Medal, Trophy, User as UserIcon } from "lucide-react";
import { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Image from "next/image";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNav } from "@/components/layout/public-nav";
import { Translate } from "@/components/shared/Translate";
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
type TeamMember = Member & {
  ageGroupDisplay: string;
  tournaments: string[];
};

const getValidImageSrc = (src: string | undefined | null) => {
  if (!src) return "";
  let cleanSrc = src.replace(/\\/g, "/");
  if (cleanSrc.startsWith("public/")) cleanSrc = cleanSrc.substring(6);
  if (cleanSrc.startsWith("/public/")) cleanSrc = cleanSrc.substring(7);
  if (
    cleanSrc.startsWith("http://") ||
    cleanSrc.startsWith("https://") ||
    cleanSrc.startsWith("/")
  )
    return cleanSrc;
  return `/${cleanSrc}`;
};

type PastEvent = {
  attendeeMemberIds?: string[];
  title?: string;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((doc: any) => doc.data())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((data: any) => {
        let endDateStr = new Date().toISOString();
        if (data.endDate) {
          endDateStr =
            typeof data.endDate === "string"
              ? data.endDate
              : data.endDate.toDate?.().toISOString() || data.endDate;
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

  // 5. Enrich members with tournaments and age groups
  const enrichedMembers: TeamMember[] = publicMembers.map((m) => {
    const memberTournaments = memberTournamentMap.get(m.id);
    const uniqueCompetitions = memberTournaments
      ? Array.from(memberTournaments)
      : [];

    return {
      ...m,
      ageGroupDisplay:
        m.ageGroup || calculateAgeGroup(m.dateOfBirth) || "Мъже/Жени",
      tournaments: uniqueCompetitions,
    };
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
      <section className="relative flex min-h-[50vh] items-center overflow-hidden px-6 pt-40 pb-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-blue-900/20 via-black/80 to-black" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 size-[1000px] -translate-1/2 rounded-full bg-blue-500/20 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl text-center">
          <span className="mb-6 block text-[11px] font-bold tracking-[0.4em] text-blue-400 uppercase drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
            Лицата на клуба
          </span>
          <h1 className="mb-8 text-5xl font-light tracking-tight md:text-7xl lg:text-8xl">
            Нашият <span className="font-semibold text-blue-400">Отбор</span>
          </h1>
          {clubSite?.teamIntro && (
            <p className="mx-auto max-w-3xl text-lg leading-relaxed font-light text-zinc-400 md:text-xl">
              {clubSite.teamIntro}
            </p>
          )}
        </div>
      </section>

      {/* Coaches Section */}
      {clubSite?.therapists && clubSite.therapists.length > 0 && (
        <section className="relative px-6 py-24">
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="mb-16 flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <Medal size={24} />
              </div>
              <h2 className="text-4xl font-light tracking-tight md:text-5xl">
                Ръководство и Треньори
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {clubSite.therapists.map((coach, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-5xl border border-zinc-800/50 bg-black/40 p-8 backdrop-blur-xl transition-all duration-500 hover:border-blue-500/30"
                >
                  <div className="pointer-events-none absolute top-0 right-0 size-64 rounded-full bg-blue-500/5 blur-[80px] transition-colors duration-700 group-hover:bg-blue-500/10" />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="relative mb-6 size-40 overflow-hidden rounded-full border-2 border-zinc-800 bg-zinc-900 shadow-2xl transition-colors group-hover:border-blue-500/50">
                      {coach.image ? (
                        <Image
                          src={getValidImageSrc(coach.image)}
                          alt={coach.name}
                          fill
                          sizes="160px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-zinc-700">
                          <UserIcon size={64} />
                        </div>
                      )}
                    </div>
                    <h3 className="mb-2 text-2xl font-medium text-white">
                      {coach.name}
                    </h3>
                    <p className="mb-6 text-[11px] font-semibold tracking-widest text-blue-400 uppercase">
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
                    {coach.bio && (
                      <p className="mb-6 text-sm leading-relaxed text-zinc-400">
                        {coach.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Athletes Section */}
      <section className="relative border-t border-zinc-900/50 px-6 py-24">
        <div className="pointer-events-none absolute top-0 right-0 size-[800px] rounded-full bg-blue-500/5 blur-[150px]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-20 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <Trophy size={24} />
            </div>
            <h2 className="text-4xl font-light tracking-tight md:text-5xl">
              Нашите Състезатели
            </h2>
          </div>

          {sortedAgeGroups.length === 0 ? (
            <p className="py-12 text-center text-lg text-zinc-500">
              Все още няма добавени състезатели.
            </p>
          ) : (
            <div className="space-y-24">
              {sortedAgeGroups.map((group) => (
                <div key={group}>
                  <h3 className="mb-10 flex items-center gap-4 text-2xl font-light text-white md:text-3xl">
                    <span className="block h-px w-8 bg-blue-500/50"></span>
                    Възрастова група {group}
                    <span className="block h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent"></span>
                  </h3>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {groupedMembers[group].map((member) => (
                      <div
                        key={member.id}
                        className="group relative flex h-full flex-col overflow-hidden rounded-4xl border border-zinc-800/50 bg-black/40 backdrop-blur-xl transition-all duration-500 hover:border-zinc-700"
                      >
                        {/* Athlete Photo */}
                        <div className="relative aspect-[4/5] overflow-hidden bg-zinc-900">
                          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/20 to-transparent" />
                          {member.avatarUrl ? (
                            <Image
                              src={getValidImageSrc(member.avatarUrl)}
                              alt={member.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              priority
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-zinc-800">
                              <UserIcon size={80} />
                            </div>
                          )}

                          {/* Name Overlay */}
                          <div className="absolute inset-x-0 bottom-0 z-20 p-6">
                            <h4 className="mb-1 text-xl font-medium text-white">
                              {member.name}
                            </h4>
                            <p className="text-xs font-medium tracking-wider text-zinc-400 uppercase">
                              {member.skillLevel === "advanced" ||
                              member.skillLevel === "professional"
                                ? "Състезател"
                                : "Любител"}
                            </p>
                          </div>
                        </div>

                        {/* Athlete Details */}
                        {member.tournaments &&
                          member.tournaments.length > 0 && (
                            <div className="flex-1 border-t border-zinc-800/50 bg-zinc-950/50 p-6">
                              <p className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase">
                                <MapPin size={12} />
                                Участия в Турнири
                              </p>
                              <ul className="space-y-2">
                                {member.tournaments
                                  .slice(0, 3)
                                  .map((t, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-2 text-sm font-light text-zinc-300"
                                    >
                                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-blue-500/50"></span>
                                      <span className="leading-snug">{t}</span>
                                    </li>
                                  ))}
                                {member.tournaments.length > 3 && (
                                  <li className="mt-2 text-xs text-zinc-500 italic">
                                    и още {member.tournaments.length - 3}...
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <PublicFooter clubSite={clubSite} />
    </div>
  );
}
