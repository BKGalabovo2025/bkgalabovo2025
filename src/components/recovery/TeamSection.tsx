"use client";

import React from "react";
import Image from "next/image";
import { Therapist } from "@/types/site.types";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamSectionProps {
  therapists: Therapist[];
  teamIntro: string;
}

export function TeamSection({ therapists, teamIntro }: TeamSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!therapists || therapists.length === 0) return null;

  const displayIntro = teamIntro || "Ние сме активни хора, които вярват в силата на правилното възстановяване.";
  const shouldTruncate = displayIntro.length > 200;

  return (
    <section
      id="team"
      className="py-32 px-6 bg-zinc-950 relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] bg-linear-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-6 font-bold">
              Нашият Екип
            </p>
            <h2 className="text-5xl md:text-7xl font-light tracking-tight mb-10 leading-[0.95]">
              Хора със <br />
              <span className="bg-linear-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
                споделена мисия
              </span>
            </h2>
            <div className="space-y-6">
              <div className={cn(
                "text-zinc-400 text-lg font-light leading-relaxed whitespace-pre-wrap transition-all duration-700",
                !isExpanded && shouldTruncate ? "max-h-32 overflow-hidden relative" : "max-h-[2000px]"
              )}>
                {displayIntro}
                {!isExpanded && shouldTruncate && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-zinc-950 to-transparent pointer-events-none" />
                )}
              </div>
              {shouldTruncate && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-2 mt-2 text-xs font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors group"
                >
                  <span className="h-px w-8 bg-emerald-500/30 group-hover:w-12 transition-all" />
                  {isExpanded ? "Свий текста" : "Прочети цялата мисия"}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {therapists.map((member, idx) => (
              <div
                key={member.id || idx}
                className="group relative bg-zinc-900/40 border border-white/5 rounded-4xl p-8 hover:bg-zinc-900 transition-all duration-500"
              >
                <div className="relative w-24 h-24 rounded-3xl overflow-hidden mb-6 border border-white/10 group-hover:border-emerald-500/30 transition-colors">
                  <Image
                    src={member.image || "/logo.png"}
                    alt={member.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <h3 className="text-2xl font-medium text-zinc-100 mb-2">
                  {member.name}
                </h3>
                <p className="bg-linear-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent text-xs uppercase tracking-widest font-bold mb-6">
                  {member.role || "Терапевт"}
                </p>
                <p className="text-zinc-500 text-sm font-light leading-relaxed mb-8">
                  {member.bio}
                </p>

                <div className="flex items-center gap-4">
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-linear-to-r hover:from-purple-500 hover:to-emerald-500 hover:text-white transition-all"
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
