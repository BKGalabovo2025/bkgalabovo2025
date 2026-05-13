import Image from "next/image";
import { Therapist } from "@/types/site.types";
import { Phone } from "lucide-react";

interface TeamSectionProps {
  therapists: Therapist[];
  teamIntro: string;
}

export function TeamSection({ therapists, teamIntro }: TeamSectionProps) {
  if (!therapists || therapists.length === 0) return null;

  return (
    <section
      id="team"
      className="py-32 px-6 bg-zinc-950 relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 mb-6 font-bold">
              Нашият Екип
            </p>
            <h2 className="text-5xl md:text-7xl font-light tracking-tight mb-10 leading-[0.95]">
              Хора със <br />
              <span className="text-emerald-400">споделена мисия</span>
            </h2>
            <div className="space-y-6 text-zinc-400 text-lg font-light leading-relaxed whitespace-pre-wrap">
              {teamIntro ||
                "Ние сме активни хора, които вярват в силата на правилното възстановяване."}
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
                    src={member.image || "/placeholder-avatar.png"}
                    alt={member.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <h3 className="text-2xl font-medium text-zinc-100 mb-2">
                  {member.name}
                </h3>
                <p className="text-emerald-400 text-xs uppercase tracking-widest font-bold mb-6">
                  {member.role || "Терапевт"}
                </p>
                <p className="text-zinc-500 text-sm font-light leading-relaxed mb-8">
                  {member.bio}
                </p>

                <div className="flex items-center gap-4">
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-emerald-500 hover:text-white transition-all"
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
