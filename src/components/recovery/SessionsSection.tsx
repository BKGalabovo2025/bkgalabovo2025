"use client";

import { useEffect, useState } from "react";
import { getSessionsQuery, RecoverySession } from "@/lib/firebase-collections";
import { onSnapshot, query, orderBy } from "firebase/firestore";
import {
  Activity,
  Clock,
  Users,
  ChevronDown,
  Check,
  Target,
  Zap,
  Info,
} from "lucide-react";
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
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-zinc-500 text-sm">Зареждане на програми...</p>
      </div>
    );
  }

  return (
    <section id="pricing" className="py-32 px-6 bg-zinc-950 scroll-mt-32">
      <div className="max-w-4xl mx-auto">
        <div className="mb-16 text-center">
          <p className="text-[11px] uppercase tracking-[0.4em] bg-linear-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-4 font-bold">
            Цени и услуги (EURO)
          </p>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight">
            Професионални <span className="text-zinc-500">програми</span>
          </h2>
          <p className="mt-4 text-zinc-500 text-sm max-w-xl mx-auto">
            Разгледайте пълния списък с възстановителни процедури. Кликнете
            върху програма за повече детайли.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-5 py-2.5 rounded-full text-[10px] font-bold tracking-widest transition-all uppercase",
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
                "group rounded-3xl border transition-all duration-500 overflow-hidden",
                expandedId === session.id
                  ? "bg-zinc-900 border-emerald-500/30 ring-1 ring-emerald-500/10 shadow-2xl shadow-emerald-500/5"
                  : "bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900/60"
              )}
            >
              {/* Header / Summary */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === session.id ? null : session.id)
                }
                className="w-full px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                      {session.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] uppercase tracking-wider font-medium">
                      <Clock size={14} className="text-emerald-500/40" />
                      <span>{getDurationLabel(session)}</span>
                    </div>
                    {session.athleteCount > 1 && (
                      <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] uppercase tracking-wider font-medium">
                        <Users size={14} className="text-emerald-500/40" />
                        <span>{session.athleteCount} състезатели</span>
                      </div>
                    )}
                    {session.numberOfDays > 1 && (
                      <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] uppercase tracking-wider font-medium">
                        <Activity size={14} className="text-emerald-500/40" />
                        <span>{session.numberOfDays} дни</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-10">
                  <div className="text-3xl font-light text-zinc-300">
                    <span className="bg-linear-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent font-bold">
                      {session.price}
                    </span>
                    <span className="text-zinc-600 text-lg ml-1">€</span>
                  </div>
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center border transition-all duration-500",
                      expandedId === session.id
                        ? "bg-linear-to-r from-purple-500 to-emerald-500 border-transparent text-white shadow-lg shadow-emerald-500/20"
                        : "bg-white/5 border-white/5 text-zinc-500 group-hover:text-zinc-300 group-hover:border-white/10"
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
                  <div className="px-8 pb-10 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
                      {/* Left Side: Info */}
                      <div className="space-y-10">
                        <div>
                          <h4 className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-4 flex items-center gap-2">
                            <Info size={12} /> Описание на сесията
                          </h4>
                          <p className="text-sm text-zinc-400 leading-relaxed font-light">
                            {session.description}
                          </p>
                        </div>

                        {session.zones && session.zones.length > 0 && (
                          <div>
                            <h4 className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-4 flex items-center gap-2">
                              <Target size={12} /> Целеви зони
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(new Set(session.zones || [])).map((zone, idx) => (
                                <span
                                  key={idx}
                                  className="px-4 py-1.5 rounded-xl bg-zinc-800 text-[10px] text-zinc-300 border border-white/5 uppercase tracking-widest font-medium"
                                >
                                  {zone}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Side: Benefits & Stats */}
                      <div className="space-y-10">
                        {session.benefits && session.benefits.length > 0 && (
                          <div>
                            <h4 className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-4 flex items-center gap-2">
                              <Zap size={12} /> Ключови ползи
                            </h4>
                            <ul className="space-y-3.5">
                              {session.benefits.map((benefit, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-3.5 text-sm text-zinc-400"
                                >
                                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
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

                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 grid grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-bold">
                              Тип процедура
                            </p>
                            <p className="text-xs text-zinc-300 font-medium">
                              {session.sessionType || "Възстановяване"}
                            </p>
                          </div>
                          {session.proceduresPerDay > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-bold">
                                Процедури дневно
                              </p>
                              <p className="text-xs text-zinc-300 font-medium">
                                {session.proceduresPerDay}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <p className="text-zinc-500 text-xs italic">
                        * Всички цени са финални и включват ползване на Hyperice
                        Normatec 3 оборудване.
                      </p>
                      <a
                        href="mailto:recoveryzonebyzm@gmail.com"
                        className="w-full sm:w-auto px-10 py-4 bg-linear-to-r from-purple-500 to-emerald-500 hover:opacity-90 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
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
            <div className="py-20 text-center bg-zinc-900/20 rounded-4xl border border-dashed border-white/5">
              <p className="text-zinc-500 italic">
                Няма намерени сесии в тази категория.
              </p>
            </div>
          )}
        </div>

        {/* Support CTA */}
        <div className="mt-24 p-10 md:p-14 rounded-4xl bg-zinc-900/40 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full group-hover:bg-emerald-500/10 transition-all duration-700" />
          <div className="max-w-xl text-center md:text-left relative z-10">
            <h3 className="text-2xl md:text-3xl font-light mb-4">
              Групови посещения?
            </h3>
            <p className="text-zinc-500 text-sm md:text-base leading-relaxed mb-6 font-light">
              Предлагаме преференциални условия за спортни клубове, академии и
              организирани групи над 5 човека.
            </p>
            <p className="text-zinc-200 text-sm font-medium">
              Търсите партньорство или имате въпроси?
            </p>
          </div>
          <a
            href="#contact"
            className="relative z-10 px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-xs font-bold transition-all shrink-0 shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            СВЪРЖЕТЕ СЕ С НАС
          </a>
        </div>
      </div>
    </section>
  );
}
