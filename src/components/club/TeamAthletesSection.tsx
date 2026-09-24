"use client";

import { GraduationCap, MapPin, Share2, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import {
  getValidImageSrc,
  ShareAthleteDialog,
} from "@/components/club/ShareAthleteDialog";
import { TeamMemberForCard } from "@/lib/athlete-card-generator";

interface TeamAthletesSectionProps {
  groupedMembers: Record<string, TeamMemberForCard[]>;
  sortedAgeGroups: string[];
}

function TeamAthletesContent({
  groupedMembers,
  sortedAgeGroups,
}: TeamAthletesSectionProps) {
  const searchParams = useSearchParams();
  const [selectedAthlete, setSelectedAthlete] =
    useState<TeamMemberForCard | null>(null);

  // Flatten all members for lookup
  const allMembers = useMemo(() => {
    return Object.values(groupedMembers).flat();
  }, [groupedMembers]);

  // Deep-link check: if ?athlete=[id] is present in URL, auto open dialog
  useEffect(() => {
    const athleteId = searchParams.get("athlete");
    if (!athleteId) return;

    const matched = allMembers.find((m) => m.id === athleteId);
    if (matched) {
      setSelectedAthlete(matched);
      // Scroll to athlete card if in DOM
      setTimeout(() => {
        const el = document.getElementById(`athlete-${athleteId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  }, [searchParams, allMembers]);

  if (sortedAgeGroups.length === 0) {
    return (
      <p className="py-12 text-center text-lg text-zinc-500">
        Все още няма добавени състезатели.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-24">
        {sortedAgeGroups.map((group) => (
          <div key={group}>
            <h3 className="mb-10 flex items-center gap-4 text-2xl font-light text-white md:text-3xl">
              <span className="block h-px w-8 bg-blue-500/50" />
              Възрастова група {group}
              <span className="block h-px flex-1 bg-linear-to-r from-blue-500/50 to-transparent" />
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groupedMembers[group].map((member) => {
                const isCompetitor =
                  member.skillLevel === "advanced" ||
                  member.skillLevel === "professional";
                const levelText = isCompetitor ? "Състезател" : "Любител";
                const tournaments = member.tournaments || [];

                return (
                  <div
                    key={member.id}
                    id={`athlete-${member.id}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-4xl border border-zinc-800/50 bg-black/40 backdrop-blur-xl transition-all duration-500 hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(30,58,138,0.15)]"
                  >
                    {/* Athlete Photo Container */}
                    <div className="relative aspect-4/5 overflow-hidden bg-zinc-900">
                      <div className="absolute inset-0 z-10 bg-linear-to-t from-black via-black/30 to-transparent" />
                      {member.avatarUrl ? (
                        <Image
                          src={getValidImageSrc(member.avatarUrl)}
                          alt={member.name}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-zinc-800">
                          <UserIcon size={80} />
                        </div>
                      )}

                      {/* Quick Share Button on photo overlay */}
                      <button
                        onClick={() => setSelectedAthlete(member)}
                        title="Сподели картичка на състезателя"
                        aria-label={`Сподели картичка на ${member.name}`}
                        className="absolute top-4 right-4 z-20 flex size-10 items-center justify-center rounded-2xl border border-white/20 bg-black/60 text-white shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:border-blue-400 hover:bg-blue-600 hover:text-white"
                      >
                        <Share2 size={16} />
                      </button>

                      {/* Name & Badges Overlay */}
                      <div className="absolute inset-x-0 bottom-0 z-20 p-6">
                        <h4 className="mb-1 text-xl font-medium text-white drop-shadow-md">
                          {member.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase ${
                              isCompetitor
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {levelText}
                          </span>
                          <span className="rounded-md border border-zinc-700 bg-black/50 px-2 py-0.5 text-[11px] text-zinc-300">
                            {member.ageGroupDisplay}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Athlete Details & School */}
                    <div className="flex flex-1 flex-col justify-between border-t border-zinc-800/50 bg-zinc-950/60 p-6">
                      <div className="space-y-4">
                        {/* School / Kindergarten */}
                        {member.educationInstitution && (
                          <div className="flex items-start gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2.5">
                            <GraduationCap className="mt-0.5 size-4 shrink-0 text-blue-400" />
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                                Училище / Градина
                              </p>
                              <p className="truncate text-xs font-medium text-zinc-200">
                                {member.educationInstitution}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Tournaments List */}
                        <div>
                          <p className="mb-2.5 flex items-center justify-between text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase">
                            <span className="flex items-center gap-1.5">
                              <MapPin size={12} />
                              Участия в Турнири
                            </span>
                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-300">
                              {tournaments.length}
                            </span>
                          </p>

                          {tournaments.length === 0 ? (
                            <p className="text-xs text-zinc-500 italic">
                              В подготовка за турнири
                            </p>
                          ) : (
                            <ul className="space-y-1.5">
                              {tournaments.slice(0, 3).map((t, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-xs font-light text-zinc-300"
                                >
                                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-blue-500/50" />
                                  <span className="line-clamp-1 leading-snug">
                                    {t}
                                  </span>
                                </li>
                              ))}
                              {tournaments.length > 3 && (
                                <li className="text-[11px] text-zinc-500 italic">
                                  + още {tournaments.length - 3} състезания
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Share Card Trigger Button */}
                      <button
                        onClick={() => setSelectedAthlete(member)}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 py-3 text-xs font-semibold text-blue-300 transition-all duration-300 hover:border-blue-400/50 hover:bg-blue-600 hover:text-white"
                      >
                        <Share2 size={14} />
                        <span>Сподели картичка (FB / IG)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Share Athlete Dialog */}
      <ShareAthleteDialog
        member={selectedAthlete}
        open={Boolean(selectedAthlete)}
        onOpenChange={(open) => {
          if (!open) setSelectedAthlete(null);
        }}
      />
    </>
  );
}

export function TeamAthletesSection(props: TeamAthletesSectionProps) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-zinc-500">
          Зареждане на състезателите...
        </div>
      }
    >
      <TeamAthletesContent {...props} />
    </Suspense>
  );
}
