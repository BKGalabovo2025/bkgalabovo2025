import Image from "next/image";
import { Metadata } from "next";
import { getSiteById } from "@/services/site-service";
import { calculateAgeGroup } from "@/services/member-service";
import { getAdminDb } from "@/lib/firebase-admin";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { Trophy, Medal, MapPin, User as UserIcon } from "lucide-react";
import { Member } from "@/types/member.types";

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

type AdminDb = ReturnType<typeof getAdminDb>;
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

async function fetchEntriesData(adminDb: AdminDb) {
  const tournamentsSnapshot = await adminDb.collection("tournaments").get();
  const entriesFetches = tournamentsSnapshot.docs.map(async (tournDoc) => {
    const data = tournDoc.data();
    const snap = await tournDoc.ref.collection("entries").get();
    return {
      title: typeof data.title === "string" ? data.title : "Турнир",
      docs: snap.docs,
    };
  });
  return Promise.all(entriesFetches);
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

async function fetchMemberTournamentsMap(
  adminDb: AdminDb,
  pastEventsData: PastEvent[]
) {
  const memberTournamentMap = new Map<string, Set<string>>();

  // Add from events
  await processEventsTournaments(pastEventsData, memberTournamentMap);

  // Add from tournaments collection
  const allEntriesResults = await fetchEntriesData(adminDb);
  assignEntriesToMap(allEntriesResults, memberTournamentMap);

  return memberTournamentMap;
}

export default async function TeamPage() {
  const adminDb = getAdminDb();

  // 1. Fetch site data (for coaches/therapists)
  const clubSite = await getSiteById("bkgalabovo");

  // 2. Fetch all members that are marked to be shown
  const membersSnapshot = await adminDb
    .collection("members")
    .where("siteId", "==", "bkgalabovo")
    .where("showOnPublicTeam", "==", true)
    .get();

  const publicMembers = membersSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Member
  );

  // 3. Fetch all past competitions from the "events" calendar
  const eventsSnapshot = await adminDb
    .collection("events")
    .where("siteId", "==", "bkgalabovo")
    .where("type", "==", "competition")
    .get();

  const pastEventsData = eventsSnapshot.docs
    .map((doc) => doc.data())
    .filter((data) => {
      let endDateStr = new Date().toISOString();
      if (data.endDate) {
        endDateStr =
          typeof data.endDate === "string"
            ? data.endDate
            : data.endDate.toDate?.().toISOString() || data.endDate;
      }
      return new Date(endDateStr) < new Date();
    });

  // 4. Build map of memberId -> Set of tournament titles
  const memberTournamentMap = await fetchMemberTournamentsMap(
    adminDb,
    pastEventsData
  );

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

  // 5. Group by age group
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
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans">
      <PublicNav clubSite={clubSite} />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden min-h-[50vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-black/80 to-black z-10" />
          <div className="absolute top-1/2 left-1/2 w-[1000px] h-[1000px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-6 block drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
            Лицата на клуба
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-8">
            Нашият <span className="font-semibold text-blue-400">Отбор</span>
          </h1>
          {clubSite?.teamIntro && (
            <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto font-light leading-relaxed">
              {clubSite.teamIntro}
            </p>
          )}
        </div>
      </section>

      {/* Coaches Section */}
      {clubSite?.therapists && clubSite.therapists.length > 0 && (
        <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex items-center gap-4 mb-16">
              <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Medal size={24} />
              </div>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight">
                Ръководство и Треньори
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {clubSite.therapists.map((coach, idx) => (
                <div
                  key={idx}
                  className="bg-black/40 border border-zinc-800/50 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700" />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-40 h-40 rounded-full overflow-hidden mb-6 border-2 border-zinc-800 group-hover:border-blue-500/50 transition-colors shadow-2xl relative bg-zinc-900">
                      {coach.image ? (
                        <Image
                          src={getValidImageSrc(coach.image)}
                          alt={coach.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          <UserIcon size={64} />
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-medium text-white mb-2">
                      {coach.name}
                    </h3>
                    <p className="text-blue-400 font-semibold uppercase tracking-widest text-[11px] mb-6">
                      {coach.role || "Треньор"}
                    </p>
                    {coach.bio && (
                      <p className="text-zinc-400 text-sm leading-relaxed mb-6">
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
      <section className="py-24 px-6 relative border-t border-zinc-900/50">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-20">
            <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Trophy size={24} />
            </div>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight">
              Нашите Състезатели
            </h2>
          </div>

          {sortedAgeGroups.length === 0 ? (
            <p className="text-zinc-500 text-center py-12 text-lg">
              Все още няма добавени състезатели.
            </p>
          ) : (
            <div className="space-y-24">
              {sortedAgeGroups.map((group) => (
                <div key={group}>
                  <h3 className="text-2xl md:text-3xl font-light text-white mb-10 flex items-center gap-4">
                    <span className="w-8 h-[1px] bg-blue-500/50 block"></span>
                    Възрастова група {group}
                    <span className="h-[1px] flex-1 bg-gradient-to-r from-blue-500/50 to-transparent block"></span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groupedMembers[group].map((member) => (
                      <div
                        key={member.id}
                        className="bg-black/40 border border-zinc-800/50 rounded-[2rem] overflow-hidden backdrop-blur-xl relative group hover:border-zinc-700 transition-all duration-500 flex flex-col h-full"
                      >
                        {/* Athlete Photo */}
                        <div className="aspect-[4/5] relative bg-zinc-900 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                          {member.avatarUrl ? (
                            <Image
                              src={getValidImageSrc(member.avatarUrl)}
                              alt={member.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              priority
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-800">
                              <UserIcon size={80} />
                            </div>
                          )}

                          {/* Name Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                            <h4 className="text-xl font-medium text-white mb-1">
                              {member.name}
                            </h4>
                            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
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
                            <div className="p-6 bg-zinc-950/50 flex-1 border-t border-zinc-800/50">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4 flex items-center gap-2">
                                <MapPin size={12} />
                                Участия в Турнири
                              </p>
                              <ul className="space-y-2">
                                {member.tournaments
                                  .slice(0, 3)
                                  .map((t, idx) => (
                                    <li
                                      key={idx}
                                      className="text-sm text-zinc-300 font-light flex items-start gap-2"
                                    >
                                      <span className="w-1 h-1 rounded-full bg-blue-500/50 mt-1.5 shrink-0"></span>
                                      <span className="leading-snug">{t}</span>
                                    </li>
                                  ))}
                                {member.tournaments.length > 3 && (
                                  <li className="text-xs text-zinc-500 italic mt-2">
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
