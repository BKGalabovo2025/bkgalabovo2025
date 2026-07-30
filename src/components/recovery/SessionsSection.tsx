"use client";

import { onSnapshot, orderBy, query } from "firebase/firestore";
import {
  Activity,
  Check,
  ChevronDown,
  Clock,
  Info,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { getSessionsQuery, RecoverySession } from "@/lib/firebase-collections";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "ВСИЧКИ" },
  { id: "ЕДИНИЧНИ СЕСИИ", label: "ЕДИНИЧНИ" },
  { id: "КОМБИНИРАНИ СЕСИИ", label: "КОМБИНИРАНИ" },
  { id: "ТУРНИРНИ СЕСИИ", label: "ТУРНИРНИ" },
  { id: "VIP СЕСИИ", label: "VIP" },
];

export function SessionsSection() {
  const [sessions, setSessions] = useState<RecoverySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(getSessionsQuery(), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => doc.data() as RecoverySession);
        setSessions(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching sessions:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredSessions = sessions.filter((s) => {
    if (activeCategory === "all") return true;
    return s.category === activeCategory;
  });

  const getDurationLabel = (session: RecoverySession) => {
    const duration = session.durationMinutes || session.duration;

    // ONLY VIP sessions get the split label
    if (duration === 45 && session.sessionType === "VIP") {
      return "15 мин + 30 мин";
    }
    return `${duration} мин`;
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-sm text-zinc-500">Зареждане на програми...</p>
      </div>
    );
  }

  return (
    <section id="pricing" className="scroll-mt-32 bg-zinc-950 px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <p className="mb-4 bg-linear-to-r from-purple-400 to-emerald-400 bg-clip-text text-[11px] font-bold tracking-[0.4em] text-transparent uppercase">
            Цени и услуги (EURO)
          </p>
          <h2 className="text-4xl font-light tracking-tight md:text-5xl">
            Професионални <span className="text-zinc-500">програми</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
            Разгледайте пълния списък с възстановителни процедури. Кликнете
            върху програма за повече детайли.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "rounded-full px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all",
                activeCategory === cat.id
                  ? "bg-linear-to-r from-purple-500 to-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* List View */}
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group overflow-hidden rounded-3xl border transition-all duration-500",
                expandedId === session.id
                  ? "border-emerald-500/30 bg-zinc-900 shadow-2xl ring-1 shadow-emerald-500/5 ring-emerald-500/10"
                  : "border-white/5 bg-zinc-900/40 hover:border-white/10 hover:bg-zinc-900/60"
              )}
            >
              {/* Header / Summary */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === session.id ? null : session.id)
                }
                className="flex w-full flex-col justify-between gap-6 px-8 py-7 text-left md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h3
                      className={cn(
                        "text-xl font-medium transition-colors",
                        expandedId === session.id
                          ? "bg-linear-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent"
                          : "text-zinc-200 group-hover:text-white"
                      )}
                    >
                      {session.name}
                    </h3>
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                      {session.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
                      <Clock size={14} className="text-emerald-500/40" />
                      <span>{getDurationLabel(session)}</span>
                    </div>
                    {session.athleteCount > 1 && (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
                        <Users size={14} className="text-emerald-500/40" />
                        <span>{session.athleteCount} състезатели</span>
                      </div>
                    )}
                    {session.numberOfDays > 1 && (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
                        <Activity size={14} className="text-emerald-500/40" />
                        <span>{session.numberOfDays} дни</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-10 md:justify-end">
                  <div className="text-3xl font-light text-zinc-300">
                    <span className="bg-linear-to-r from-purple-400 to-emerald-400 bg-clip-text font-bold text-transparent">
                      {session.price}
                    </span>
                    <span className="ml-1 text-lg text-zinc-600">€</span>
                  </div>
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-full border transition-all duration-500",
                      expandedId === session.id
                        ? "border-transparent bg-linear-to-r from-purple-500 to-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "border-white/5 bg-white/5 text-zinc-500 group-hover:border-white/10 group-hover:text-zinc-300"
                    )}
                  >
                    <ChevronDown
                      size={20}
                      className={cn(
                        "transition-transform duration-500",
                        expandedId === session.id && "rotate-180"
                      )}
                    />
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              <div
                className={cn(
                  "grid transition-all duration-500 ease-in-out",
                  expandedId === session.id
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-white/5 px-8 pt-4 pb-10">
                    <div className="mt-4 grid grid-cols-1 gap-12 md:grid-cols-2">
                      {/* Left Side: Info */}
                      <div className="space-y-10">
                        <div>
                          <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                            <Info size={12} /> Описание на сесията
                          </h4>
                          <p className="text-sm leading-relaxed font-light text-zinc-400">
                            {session.description}
                          </p>
                        </div>

                        {session.zones && session.zones.length > 0 && (
                          <div>
                            <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                              <Target size={12} /> Целеви зони
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(new Set(session.zones || [])).map(
                                (zone, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded-xl border border-white/5 bg-zinc-800 px-4 py-1.5 text-[10px] font-medium tracking-widest text-zinc-300 uppercase"
                                  >
                                    {zone}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Side: Benefits & Stats */}
                      <div className="space-y-10">
                        {session.benefits && session.benefits.length > 0 && (
                          <div>
                            <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                              <Zap size={12} /> Ключови ползи
                            </h4>
                            <ul className="space-y-3.5">
                              {session.benefits.map((benefit, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-3.5 text-sm text-zinc-400"
                                >
                                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                                    <Check
                                      size={10}
                                      className="text-emerald-400"
                                    />
                                  </div>
                                  <span className="font-light">{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-6 rounded-3xl border border-white/5 bg-white/5 p-6">
                          <div className="space-y-1.5">
                            <p className="text-[9px] font-bold tracking-[0.2em] text-zinc-600 uppercase">
                              Тип процедура
                            </p>
                            <p className="text-xs font-medium text-zinc-300">
                              {session.sessionType || "Възстановяване"}
                            </p>
                          </div>
                          {session.proceduresPerDay > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-bold tracking-[0.2em] text-zinc-600 uppercase">
                                Процедури дневно
                              </p>
                              <p className="text-xs font-medium text-zinc-300">
                                {session.proceduresPerDay}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 sm:flex-row">
                      <p className="text-xs text-zinc-500 italic">
                        * Всички цени са финални и включват ползване на Hyperice
                        Normatec 3 оборудване.
                      </p>
                      <a
                        href="mailto:recoveryzonebyzm@gmail.com"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-purple-500 to-emerald-500 px-10 py-4 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:opacity-90 active:scale-95 sm:w-auto"
                      >
                        ЗАПАЗИ ЧАС СЕГА
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredSessions.length === 0 && (
            <div className="rounded-4xl border border-dashed border-white/5 bg-zinc-900/20 py-20 text-center">
              <p className="text-zinc-500 italic">
                Няма намерени сесии в тази категория.
              </p>
            </div>
          )}
        </div>

        {/* Support CTA */}
        <div className="group relative mt-24 flex flex-col items-center justify-between gap-10 overflow-hidden rounded-4xl border border-white/5 bg-zinc-900/40 p-10 md:flex-row md:p-14">
          <div className="absolute top-0 right-0 size-80 rounded-full bg-emerald-500/5 blur-[120px] transition-all duration-700 group-hover:bg-emerald-500/10" />
          <div className="relative z-10 max-w-xl text-center md:text-left">
            <h3 className="mb-4 text-2xl font-light md:text-3xl">
              Групови посещения?
            </h3>
            <p className="mb-6 text-sm leading-relaxed font-light text-zinc-500 md:text-base">
              Предлагаме преференциални условия за спортни клубове, академии и
              организирани групи над 5 човека.
            </p>
            <p className="text-sm font-medium text-zinc-200">
              Търсите партньорство или имате въпроси?
            </p>
          </div>
          <a
            href="#contact"
            className="relative z-10 shrink-0 rounded-2xl bg-emerald-500 px-10 py-5 text-xs font-bold text-white shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-95"
          >
            СВЪРЖЕТЕ СЕ С НАС
          </a>
        </div>
      </div>
    </section>
  );
}
