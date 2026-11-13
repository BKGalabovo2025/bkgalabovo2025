"use client";

import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  MapPin,
  Maximize2,
  Search,
  Share2,
  User as UserIcon,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { getValidImageSrc } from "@/components/club/ShareAthleteDialog";
import { TeamMemberForCard } from "@/lib/athlete-card-generator";
import { cn } from "@/lib/utils";

const ShareAthleteDialog = dynamic(
  () =>
    import("@/components/club/ShareAthleteDialog").then(
      (mod) => mod.ShareAthleteDialog
    ),
  { ssr: false }
);

const AthleteProfileDialog = dynamic(
  () =>
    import("@/components/club/AthleteProfileDialog").then(
      (mod) => mod.AthleteProfileDialog
    ),
  { ssr: false }
);

interface TeamAthletesSectionProps {
  groupedMembers: Record<string, TeamMemberForCard[]>;
  sortedAgeGroups: string[];
}

type LevelFilter = "all" | "competitor" | "amateur";

function getAthleteName(member: TeamMemberForCard): string {
  return (
    member.name?.trim() ||
    [member.firstName, member.middleName, member.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Състезател"
  );
}

function isCompetitorMember(member: TeamMemberForCard): boolean {
  return (
    member.skillLevel === "advanced" || member.skillLevel === "professional"
  );
}

function updateAthleteQueryParam(athleteId: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (athleteId) {
    url.searchParams.set("athlete", athleteId);
  } else {
    url.searchParams.delete("athlete");
  }
  window.history.replaceState(
    window.history.state,
    "",
    url.pathname + (url.search ? url.search : "") + url.hash
  );
}

function clearAthleteQueryParam() {
  updateAthleteQueryParam(null);
}

function updateShareQueryParam(athleteId: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (athleteId) {
    url.searchParams.set("share", athleteId);
  } else {
    url.searchParams.delete("share");
  }
  window.history.replaceState(
    window.history.state,
    "",
    url.pathname + (url.search ? url.search : "") + url.hash
  );
}

function TeamAthletesContent({
  groupedMembers,
  sortedAgeGroups,
}: TeamAthletesSectionProps) {
  const [selectedAthlete, setSelectedAthlete] =
    useState<TeamMemberForCard | null>(null);
  const [activeProfileAthlete, setActiveProfileAthlete] =
    useState<TeamMemberForCard | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [notFoundAthleteId, setNotFoundAthleteId] = useState<string | null>(
    null
  );
  const [highlightedAthleteId, setHighlightedAthleteId] = useState<
    string | null
  >(null);

  // Flatten all members for lookup
  const allMembers = useMemo(() => {
    return Object.values(groupedMembers).flat();
  }, [groupedMembers]);

  const levelCounts = useMemo(() => {
    const competitor = allMembers.filter(isCompetitorMember).length;
    return {
      all: allMembers.length,
      competitor,
      amateur: allMembers.length - competitor,
    };
  }, [allMembers]);

  const filteredGroups = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return sortedAgeGroups
      .map((group) => {
        const members = (groupedMembers[group] || []).filter((member) => {
          if (levelFilter === "competitor" && !isCompetitorMember(member)) {
            return false;
          }
          if (levelFilter === "amateur" && isCompetitorMember(member)) {
            return false;
          }
          if (normalizedQuery) {
            const name = getAthleteName(member).toLowerCase();
            if (!name.includes(normalizedQuery)) {
              return false;
            }
          }
          return true;
        });
        return { group, members };
      })
      .filter((entry) => entry.members.length > 0);
  }, [groupedMembers, sortedAgeGroups, searchQuery, levelFilter]);

  const toggleAthleteExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Deep-link check: if ?athlete=[id] is present in URL, open full profile modal & highlight card
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncAthleteFromUrl = () => {
      const athleteId = new URLSearchParams(window.location.search).get(
        "athlete"
      );
      if (!athleteId) {
        setActiveProfileAthlete(null);
        return;
      }

      const matched = allMembers.find((m) => m.id === athleteId);
      if (matched) {
        setNotFoundAthleteId(null);
        setHighlightedAthleteId(matched.id);
        setActiveProfileAthlete(matched);
        setExpandedIds((prev) => new Set(prev).add(matched.id));
        setTimeout(() => {
          const el = document.getElementById(`athlete-${athleteId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      } else {
        setNotFoundAthleteId(athleteId);
      }
    };

    syncAthleteFromUrl();
    window.addEventListener("popstate", syncAthleteFromUrl);
    return () => window.removeEventListener("popstate", syncAthleteFromUrl);
  }, [allMembers]);

  // Deep-link check: if ?share=[id] is present in URL, auto-open ShareAthleteDialog
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncShareFromUrl = () => {
      const shareId = new URLSearchParams(window.location.search).get("share");
      if (!shareId) {
        setSelectedAthlete(null);
        return;
      }
      const matched = allMembers.find((m) => m.id === shareId);
      if (matched) {
        setSelectedAthlete(matched);
      }
    };
    syncShareFromUrl();
    window.addEventListener("popstate", syncShareFromUrl);
    return () => window.removeEventListener("popstate", syncShareFromUrl);
  }, [allMembers]);

  if (sortedAgeGroups.length === 0) {
    return (
      <p className="py-12 text-center text-lg text-zinc-400">
        Все още няма добавени състезатели.
      </p>
    );
  }

  return (
    <>
      {notFoundAthleteId && (
        <div
          role="status"
          className="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <span>
              Търсеният състезател не беше намерен в актуалния списък на отбора.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setNotFoundAthleteId(null);
              clearAthleteQueryParam();
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/30 hover:text-white"
          >
            <X className="size-3.5" />
            <span>Затвори</span>
          </button>
        </div>
      )}

      {/* Search & Level Filter Controls */}
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-zinc-800/70 bg-zinc-950/60 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-500"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Търси състезател по име..."
            aria-label="Търси състезател по име"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 px-10 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Изчисти търсенето"
              className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: "Всички", count: levelCounts.all },
              {
                id: "competitor",
                label: "Състезател",
                count: levelCounts.competitor,
              },
              { id: "amateur", label: "Любител", count: levelCounts.amateur },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setLevelFilter(pill.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                levelFilter === pill.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white"
              )}
            >
              <span>{pill.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  levelFilter === pill.id
                    ? "bg-white/20 text-white"
                    : "bg-zinc-800 text-zinc-300"
                )}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800/70 bg-black/40 p-12 text-center backdrop-blur-xl">
          <p className="text-base font-medium text-zinc-300">
            Няма намерени състезатели по зададените критерии.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setLevelFilter("all");
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/20 hover:text-white"
          >
            Изчисти филтрите
          </button>
        </div>
      ) : (
        <div className="space-y-10 sm:space-y-12">
          {filteredGroups.map(({ group, members }, groupIdx) => (
            <div key={group}>
              <h3 className="mb-6 flex items-center gap-3 text-xl font-light text-white sm:gap-4 sm:text-2xl">
                <span className="block h-px w-8 bg-blue-500/50" />
                Възрастова група {group}
                <span className="block h-px flex-1 bg-linear-to-r from-blue-500/50 to-transparent" />
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {members.map((member, memberIdx) => {
                  const isAboveTheFold = groupIdx === 0 && memberIdx < 4;
                  const isCompetitor = isCompetitorMember(member);
                  const levelText = isCompetitor ? "Състезател" : "Любител";
                  const tournaments = member.tournaments || [];
                  const athleteName = getAthleteName(member);
                  const validAvatar = getValidImageSrc(member.avatarUrl);
                  const isExpanded = expandedIds.has(member.id);

                  return (
                    <div
                      key={member.id}
                      id={`athlete-${member.id}`}
                      className={cn(
                        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white backdrop-blur-xl transition-all duration-500 hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(30,58,138,0.15)] dark:bg-black/40",
                        highlightedAthleteId === member.id
                          ? "border-blue-500 ring-2 ring-blue-500/70 shadow-[0_0_35px_rgba(59,130,246,0.3)]"
                          : "border-slate-200 dark:border-zinc-800/50"
                      )}
                    >
                      {/* Athlete Photo Container - Click to enlarge full photo & details */}
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={`Отвори профила и снимката на ${athleteName}`}
                        onClick={() => {
                          setActiveProfileAthlete(member);
                          setHighlightedAthleteId(member.id);
                          updateAthleteQueryParam(member.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setActiveProfileAthlete(member);
                            setHighlightedAthleteId(member.id);
                            updateAthleteQueryParam(member.id);
                          }
                        }}
                        className="keep-dark relative aspect-4/3 cursor-pointer overflow-hidden bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <div className="absolute inset-0 z-10 bg-linear-to-t from-black via-black/30 to-transparent" />
                        {validAvatar ? (
                          <Image
                            src={validAvatar}
                            alt={athleteName}
                            fill
                            unoptimized={
                              validAvatar.startsWith("data:") ||
                              validAvatar.includes("/api/upload")
                            }
                            priority={isAboveTheFold}
                            loading={isAboveTheFold ? "eager" : "lazy"}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-zinc-800">
                            <UserIcon size={64} />
                          </div>
                        )}

                        {/* Subtle enlarge indicator on hover */}
                        <div className="keep-dark pointer-events-none absolute top-2.5 left-2.5 z-20 flex size-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/90 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                          <Maximize2 size={13} />
                        </div>

                        {/* Quick Share Button on photo overlay */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAthlete(member);
                            updateShareQueryParam(member.id);
                          }}
                          title="Сподели профила"
                          aria-label={`Сподели профила на ${athleteName}`}
                          className="keep-dark absolute top-2.5 right-2.5 z-20 flex size-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/90 backdrop-blur-md transition-all hover:scale-105 hover:bg-blue-600 hover:text-white"
                        >
                          <Share2 size={14} />
                        </button>

                        {/* Name & Age Group Overlay */}
                        <div className="keep-dark absolute inset-x-0 bottom-0 z-20 p-3.5 sm:p-4">
                          <h4 className="mb-1 text-base font-semibold text-white drop-shadow-md sm:text-lg wrap-break-word">
                            {athleteName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                                isCompetitor
                                  ? "bg-blue-500/30 text-blue-200 border border-blue-400/40"
                                  : "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40"
                              }`}
                            >
                              {levelText}
                            </span>
                            <span className="rounded-md border border-white/20 bg-black/50 px-2 py-0.5 text-[10px] font-medium text-zinc-200">
                              {member.ageGroupDisplay}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Athlete Details: School & Tournaments */}
                      <div className="flex flex-1 flex-col gap-2.5 border-t border-slate-200 bg-white p-3.5 sm:p-4 dark:border-zinc-800/50 dark:bg-zinc-950/60">
                        {member.educationInstitution && (
                          <div className="flex items-start gap-2 text-xs text-zinc-300">
                            <GraduationCap className="mt-0.5 size-3.5 shrink-0 text-blue-400" />
                            <span className="leading-snug font-medium wrap-break-word">
                              {member.educationInstitution}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-1 flex-col">
                          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold tracking-wider text-blue-400 uppercase">
                            <span className="flex items-center gap-1.5">
                              <MapPin size={12} />
                              Състезания
                            </span>
                            <span className="text-zinc-400">
                              {tournaments.length}
                            </span>
                          </div>

                          {tournaments.length === 0 ? (
                            <p className="text-xs text-zinc-500 italic">
                              В подготовка за турнири
                            </p>
                          ) : (
                            <div>
                              <ul className="space-y-1">
                                {(isExpanded
                                  ? tournaments
                                  : tournaments.slice(0, 2)
                                ).map((t, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-xs text-zinc-300"
                                  >
                                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
                                    <span className="leading-snug wrap-break-word">
                                      {t}
                                    </span>
                                  </li>
                                ))}
                              </ul>

                              {tournaments.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => toggleAthleteExpand(member.id)}
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="size-3.5" />
                                      <span>Свий</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="size-3.5" />
                                      <span>
                                        Още {tournaments.length - 2} състезания
                                      </span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enlarged Athlete Profile Dialog (?athlete=[id]) */}
      {activeProfileAthlete && (
        <AthleteProfileDialog
          member={activeProfileAthlete}
          open={Boolean(activeProfileAthlete)}
          onOpenChange={(open) => {
            if (!open) {
              setActiveProfileAthlete(null);
              clearAthleteQueryParam();
            }
          }}
        />
      )}

      {/* Share Athlete Dialog (?share=[id]) */}
      {selectedAthlete && (
        <ShareAthleteDialog
          member={selectedAthlete}
          open={Boolean(selectedAthlete)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedAthlete(null);
              updateShareQueryParam(null);
            }
          }}
        />
      )}
    </>
  );
}

export function TeamAthletesSection(props: TeamAthletesSectionProps) {
  return <TeamAthletesContent {...props} />;
}
