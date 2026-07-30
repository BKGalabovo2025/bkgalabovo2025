"use client";

import { Phone } from "lucide-react";
import Image from "next/image";
import React from "react";

import { cn } from "@/lib/utils";
import { Therapist } from "@/types/site.types";

interface TeamSectionProps {
  therapists: Therapist[];
  teamIntro: string;
}

export function TeamSection({ therapists, teamIntro }: TeamSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!therapists || therapists.length === 0) return null;

  const displayIntro =
    teamIntro ||
    "Ние сме активни хора, които вярват в силата на правилното възстановяване.";
  const shouldTruncate = displayIntro.length > 200;

  return (
    <section
      id="team"
      className="relative overflow-hidden bg-zinc-950 px-6 py-32"
    >
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[800px] -translate-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
          <div>
            <p className="mb-6 bg-linear-to-r from-purple-400 to-emerald-400 bg-clip-text text-[10px] font-bold tracking-[0.4em] text-transparent uppercase">
              Нашият Екип
            </p>
            <h2 className="leading-0.95 mb-10 text-5xl font-light tracking-tight md:text-7xl">
              Хора със <br />
              <span className="bg-linear-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
                споделена мисия
              </span>
            </h2>
            <div className="space-y-6">
              <div
                className={cn(
                  "text-lg leading-relaxed font-light whitespace-pre-wrap text-zinc-400 transition-all duration-700",
                  !isExpanded && shouldTruncate
                    ? "relative max-h-32 overflow-hidden"
                    : "max-h-500"
                )}
              >
                {displayIntro}
                {!isExpanded && shouldTruncate && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-zinc-950 to-transparent" />
                )}
              </div>
              {shouldTruncate && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="group mt-2 inline-flex items-center gap-2 text-xs font-bold tracking-widest text-emerald-400 uppercase transition-colors hover:text-emerald-300"
                >
                  <span className="h-px w-8 bg-emerald-500/30 transition-all group-hover:w-12" />
                  {isExpanded ? "Свий текста" : "Прочети цялата мисия"}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {therapists.map((member, idx) => (
              <div
                key={member.id || idx}
                className="group relative rounded-4xl border border-white/5 bg-zinc-900/40 p-8 transition-all duration-500 hover:bg-zinc-900"
              >
                <div className="relative mb-6 size-24 overflow-hidden rounded-3xl border border-white/10 transition-colors group-hover:border-emerald-500/30">
                  <Image
                    src={member.image || "/1.png"}
                    alt={member.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <h3 className="mb-2 text-2xl font-medium text-zinc-100">
                  {member.name}
                </h3>
                <p className="mb-6 bg-linear-to-r from-purple-400 to-emerald-400 bg-clip-text text-xs font-bold tracking-widest text-transparent uppercase">
                  {member.role || "Терапевт"}
                </p>
                <p className="mb-8 text-sm leading-relaxed font-light text-zinc-500">
                  {member.bio}
                </p>

                <div className="flex items-center gap-4">
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400 transition-all hover:bg-linear-to-r hover:from-purple-500 hover:to-emerald-500 hover:text-white"
                    >
                      <Phone size={18} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
