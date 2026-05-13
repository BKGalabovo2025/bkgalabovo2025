import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SessionsSection } from "@/components/recovery/SessionsSection";
import { TeamSection } from "@/components/recovery/TeamSection";
import {
  Activity,
  ArrowLeft,
  Check,
  Mail,
  ChevronDown,
  Wind,
  Heart,
  Flame,
  ShieldCheck,
  Info,
  MapPin,
  Clock,
  Zap,
} from "lucide-react";
import { getSiteById } from "@/services/site-service";
import { DaySchedule } from "@/types/site.types";

export const metadata: Metadata = {
  title: "Recovery Zone by ZM | Професионално Възстановяване",
  description:
    "Възстановете се по-бързо с най-съвременната технология Hyperice Normatec 3. Професионално решение за спортисти и активни хора.",
};

const iconMap: Record<string, any> = {
  Wind,
  Heart,
  ShieldCheck,
  Flame,
  Activity,
  Info,
};

function formatSchedule(day?: DaySchedule) {
  if (!day || !day.isOpen) return "Затворено";
  return `${day.open} – ${day.close}`;
}

export default async function RecoveryZonePage() {
  const site = await getSiteById("recoveryzone");

  if (!site) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Обектът не е намерен</h1>
          <Link href="/" className="text-emerald-500 hover:underline">
            Обратно към началната страница
          </Link>
        </div>
      </div>
    );
  }

  const benefits = site.benefits || [];
  const attachments = site.attachments || [];
  const contraindications = site.contraindications || [];

  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="h-12 w-12 relative overflow-hidden rounded-2xl bg-white/5 p-2 transition-all group-hover:bg-white/10 group-hover:scale-105 active:scale-95">
              <Image
                src="/RECOVERY%20ZM%20ZONE%20BADMINTON.png"
                alt="Logo"
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight">
                {site.name || "Recovery Zone"}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">
                by ZM
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-12 text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-400">
            <a
              href="#about"
              className="hover:text-emerald-400 transition-colors"
            >
              За нас
            </a>
            <a
              href="#pricing"
              className="hover:text-emerald-400 transition-colors"
            >
              Цени
            </a>
            <a
              href="#team"
              className="hover:text-emerald-400 transition-colors"
            >
              Екип
            </a>
            <a
              href="#contact"
              className="hover:text-emerald-400 transition-colors"
            >
              Контакт
            </a>
          </div>

          <a
            href={`mailto:${site.email || "recoveryzonebyzm@gmail.com"}`}
            className="px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-2xl shadow-white/10"
          >
            Резервирай
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[150px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                  Професионално оборудване от Hyperice
                </span>
              </div>
              <h1 className="text-6xl md:text-8xl font-light tracking-tight mb-10 leading-[0.9] text-white">
                Твоето тяло <br />
                <span className="text-zinc-500 italic">заслужава</span> <br />
                <span className="text-emerald-400">най-доброто.</span>
              </h1>
              <p className="text-zinc-400 text-lg md:text-xl max-w-lg mb-12 font-light leading-relaxed">
                Открий силата на динамичната компресия с Normatec 3. Ускори
                възстановяването, намали умората и се върни в играта по-силен.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <a
                  href="#pricing"
                  className="w-full sm:w-auto px-12 py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-xs font-bold transition-all shadow-2xl shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-3"
                >
                  ВИЖ ПРОГРАМИТЕ <ChevronDown size={16} />
                </a>
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full border-2 border-black bg-zinc-800 overflow-hidden"
                    >
                      <Image
                        src={`https://i.pravatar.cc/150?u=${i + 10}`}
                        alt="User"
                        width={40}
                        height={40}
                      />
                    </div>
                  ))}
                  <div className="h-10 px-4 rounded-full border-2 border-black bg-zinc-900 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-emerald-400">
                      +100 ДОВОЛНИ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-1000" />
              <div className="relative aspect-square md:aspect-video rounded-6xl overflow-hidden border border-white/5 shadow-2xl">
                <Image
                  src="/recovery-hero.webp"
                  alt="Recovery Hero"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10 right-10 p-8 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
                      <Zap size={24} />
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">
                        Hyperice Normatec 3
                      </p>
                      <p className="text-zinc-400 text-xs">
                        Официален партньор в твоето възстановяване.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section id="about" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = iconMap[benefit.icon] || Info;
              return (
                <div
                  key={idx}
                  className="group p-10 rounded-5xl bg-zinc-900/40 border border-white/5 hover:border-emerald-500/30 hover:bg-zinc-900 transition-all duration-500"
                >
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-emerald-400 mb-8 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-xl group-hover:shadow-emerald-500/20">
                    <Icon size={28} />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-4">
                    {benefit.title}
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed font-light group-hover:text-zinc-400 transition-colors">
                    {benefit.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Attachments Showcase */}
      <section className="py-32 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 mb-6 font-bold">
              Технологии
            </p>
            <h2 className="text-5xl md:text-6xl font-light tracking-tight">
              Персонализирана <br />{" "}
              <span className="text-zinc-500 italic">компресия за теб</span>
            </h2>
          </div>

          <div className="space-y-32">
            {attachments.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col lg:flex-row items-center gap-20",
                  idx % 2 === 1 && "lg:flex-row-reverse"
                )}
              >
                <div className="flex-1 w-full relative group">
                  <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] rounded-full group-hover:bg-emerald-500/10 transition-all duration-700" />
                  <div className="relative aspect-square md:aspect-4/3 rounded-6xl overflow-hidden border border-white/5">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                  </div>
                </div>
                <div className="flex-1 max-w-xl">
                  <h3 className="text-4xl font-light mb-8 text-white">
                    {item.name}
                  </h3>
                  <p className="text-zinc-500 text-lg mb-10 font-light leading-relaxed">
                    {item.desc}
                  </p>
                  <ul className="space-y-6">
                    {item.points.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-center gap-4 group">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <Check size={14} />
                        </div>
                        <span className="text-sm text-zinc-300 font-light">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Sessions Component */}
      <SessionsSection />

      {/* Dynamic Team Section */}
      <TeamSection
        therapists={site.therapists || []}
        teamIntro={site.teamIntro || ""}
      />

      {/* Contraindications */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto p-12 md:p-20 rounded-6xl bg-zinc-900/40 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full" />

          <div className="flex items-center gap-4 mb-12">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Info size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-light">Важна информация</h2>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">
                Противопоказания
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contraindications.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group"
              >
                <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-500 transition-all">
                  <span className="text-[10px] text-amber-500 group-hover:text-white font-bold">
                    {idx + 1}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-light group-hover:text-zinc-200 transition-colors">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 px-6 relative bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 mb-6 font-bold">
                Контакт
              </p>
              <h2 className="text-5xl md:text-7xl font-light tracking-tight mb-10 leading-[0.95]">
                Свържете се <br />
                <span className="text-emerald-400">с нас</span>
              </h2>
              <p className="text-zinc-500 text-lg mb-12 font-light leading-relaxed">
                Търсите партньорство, имате въпроси или искате да запазите час?
                Ние сме тук, за да помогнем.
              </p>

              <div className="space-y-10">
                <div className="flex items-center gap-6 group">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-1">
                      Имейл
                    </p>
                    <a
                      href={`mailto:${site.email || "recoveryzonebyzm@gmail.com"}`}
                      className="text-lg font-medium text-zinc-200 hover:text-emerald-400 transition-colors"
                    >
                      {site.email || "recoveryzonebyzm@gmail.com"}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-6 group">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-1">
                      Работно време
                    </p>
                    <div className="text-zinc-200 space-y-1">
                      {site.schedule ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 text-sm font-light">
                          <div className="flex justify-between border-b border-white/5 py-2">
                            <span className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
                              Понеделник
                            </span>
                            <span>{formatSchedule(site.schedule.monday)}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 py-2">
                            <span className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
                              Вторник
                            </span>
                            <span>{formatSchedule(site.schedule.tuesday)}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 py-2">
                            <span className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
                              Сряда
                            </span>
                            <span>
                              {formatSchedule(site.schedule.wednesday)}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 py-2">
                            <span className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
                              Четвъртък
                            </span>
                            <span>
                              {formatSchedule(site.schedule.thursday)}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 py-2">
                            <span className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
                              Петък
                            </span>
                            <span>{formatSchedule(site.schedule.friday)}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 py-2">
                            <span className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
                              Събота
                            </span>
                            <span>
                              {formatSchedule(site.schedule.saturday)}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 py-2">
                            <span className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
                              Неделя
                            </span>
                            <span>{formatSchedule(site.schedule.sunday)}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium">
                            Пон – Пет: 09:00 – 20:00
                          </p>
                          <p className="text-sm font-medium">
                            Съб – Нед: 10:00 – 18:00
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 group">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-1">
                      Локация
                    </p>
                    <p className="text-lg font-medium text-zinc-200">
                      {site.address || "България"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full" />
              <div className="relative bg-zinc-900/40 border border-white/5 rounded-6xl p-10 md:p-16 h-full flex flex-col justify-center">
                <h3 className="text-2xl font-light mb-6">
                  Готови ли сте за рестарт?
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-10 font-light">
                  Натиснете бутона по-долу, за да изпратите имейл и да запазите
                  Вашата сесия. Ще се свържем с Вас възможно най-скоро за
                  потвърждение.
                </p>
                <a
                  href={`mailto:${site.email || "recoveryzonebyzm@gmail.com"}`}
                  className="w-full flex items-center justify-center gap-3 px-10 py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-sm font-bold transition-all shadow-2xl shadow-emerald-500/30"
                >
                  ЗАПАЗИ ЧАС СЕГА
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-12 border-t border-white/5 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 relative overflow-hidden rounded-xl bg-white/5 p-1.5">
              <Image
                src="/RECOVERY%20ZM%20ZONE%20BADMINTON.png"
                alt="Logo"
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider">
                {site.name || "Recovery Zone"}
              </span>
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                by ZM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-8 text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-700">
            <span>{site.address || "България"}</span>
            <span className="hidden sm:inline">|</span>
            <span>© {new Date().getFullYear()}</span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-emerald-500 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Обратно към портала
          </Link>
        </div>
      </footer>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
