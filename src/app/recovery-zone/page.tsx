import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SessionsSection } from "@/components/recovery/SessionsSection";
import { TeamSection } from "@/components/recovery/TeamSection";
import {
  ArrowLeft,
  Mail,
  ChevronDown,
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

  const attachments = site.attachments || [];
  const contraindications = site.contraindications || [];

  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="group">
            <div className="h-10 w-40 relative overflow-hidden bg-white/5 rounded-xl p-1.5 transition-all hover:scale-105 active:scale-95 border border-white/10 group-hover:bg-white/10">
              <Image
                src="/1.png"
                alt="Recovery Zone by ZM"
                fill
                sizes="100vw"
                priority
                className="object-contain"
              />
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-12 text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-400">
            <a
              href="#info"
              className="hover:text-emerald-400 transition-colors"
            >
              Информация
            </a>
            <a
              href="#pricing"
              className="hover:text-emerald-400 transition-colors"
            >
              Каталог Възстановяване
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
            className="px-6 py-3 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-linear-to-r hover:from-purple-500 hover:to-emerald-500 hover:text-white transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            Резервирай
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[150px] rounded-full" />
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
                <span className="bg-linear-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
                  най-доброто.
                </span>
              </h1>
              <p className="text-zinc-400 text-lg md:text-xl max-w-lg mb-12 font-light leading-relaxed">
                Открий силата на динамичната компресия с Normatec 3. Ускори
                възстановяването, намали умората и се върни в играта по-силен.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <a
                  href="#pricing"
                  className="w-full sm:w-auto px-12 py-6 bg-linear-to-r from-purple-500 to-emerald-500 hover:opacity-90 text-white rounded-2xl text-xs font-bold transition-all shadow-2xl shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-3"
                >
                  ВИЖ ПРОГРАМИТЕ <ChevronDown size={16} />
                </a>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-tr from-purple-500/20 to-emerald-500/20 blur-[100px] rounded-full group-hover:from-purple-500/30 group-hover:to-emerald-500/30 transition-all duration-1000" />
              <div className="relative aspect-square md:aspect-video rounded-6xl overflow-hidden border border-white/5 shadow-2xl bg-zinc-900">
                <Image
                  src="/1.png"
                  alt="Recovery Zone by ZM"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="object-contain p-12 transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
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

      {/* Information Hub */}
      <section id="info" className="py-32 px-6 scroll-mt-32">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-32 text-center">
            <p className="text-[10px] uppercase tracking-[0.4em] bg-linear-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-6 font-bold">
              ИНФОРМАЦИЯ
            </p>
            <h2 className="text-5xl md:text-7xl font-light tracking-tight mb-8">
              Твоето тяло <br />{" "}
              <span className="text-zinc-500 italic">
                заслужава най-доброто
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            {/* Left Column: Story & Mission */}
            <div className="lg:col-span-7 space-y-24">
              <div className="relative group p-10 md:p-16 rounded-6xl bg-zinc-900/40 border border-white/5 overflow-hidden transition-all duration-700 hover:bg-zinc-900/60">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full" />
                <h3 className="text-3xl font-light mb-12 text-white flex items-center gap-4">
                  <span className="h-px w-12 bg-purple-500/50" />
                  Мисия и История
                </h3>
                <div className="prose prose-invert max-w-none">
                  {site.teamIntro ? (
                    <div className="space-y-8">
                      {site.teamIntro.split("\n\n").map((paragraph, pIdx) => (
                        <p
                          key={pIdx}
                          className="text-zinc-400 text-lg font-light leading-relaxed"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-lg font-light leading-relaxed">
                      От личен опит към споделена мисия. Ние вярваме, че
                      качественото възстановяване е ключът към дълготрайното
                      здраве и високите постижения.
                    </p>
                  )}
                </div>
              </div>

              {/* Technology Showcase */}
              <div className="space-y-16">
                <h3 className="text-3xl font-light text-white flex items-center gap-4 px-4">
                  <span className="h-px w-12 bg-emerald-500/50" />
                  Технологии и Оборудване
                </h3>
                <div className="grid grid-cols-1 gap-12">
                  {attachments.map((item, idx) => (
                    <div
                      key={idx}
                      className="group relative flex flex-col md:flex-row gap-10 p-8 rounded-5xl bg-zinc-900/30 border border-white/5 hover:border-emerald-500/20 transition-all duration-500"
                    >
                      <div className="w-full md:w-64 h-64 relative rounded-4xl overflow-hidden shrink-0 border border-white/5">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="100vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                      <div className="flex-1 py-4">
                        <h4 className="text-xl font-medium text-white mb-4">
                          {item.name}
                        </h4>
                        <p className="text-zinc-500 text-sm mb-8 font-light leading-relaxed group-hover:text-zinc-400 transition-colors">
                          {item.desc}
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {item.points.map((point, pIdx) => (
                            <li
                              key={pIdx}
                              className="flex items-center gap-3 text-xs text-zinc-400 font-light"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: FAQ & Safety */}
            <div className="lg:col-span-5 space-y-12">
              {/* FAQ Section */}
              <div className="p-10 md:p-12 rounded-6xl bg-zinc-900/40 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />
                <div className="flex items-center gap-4 mb-10">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Info size={24} />
                  </div>
                  <h3 className="text-2xl font-light">
                    Често задавани въпроси
                  </h3>
                </div>

                <div className="space-y-8">
                  {(site.faqs && site.faqs.length > 0
                    ? site.faqs
                    : [
                        {
                          q: "Колко често мога да ползвам Normatec?",
                          a: "Можете да използвате системата ежедневно. За оптимални резултати препоръчваме сесии от 15 до 45 минути след тренировка.",
                        },
                        {
                          q: "Боли ли процедурата?",
                          a: "В никакъв случай. Динамичната компресия наподобява приятен, дълбок масаж. Можете да регулирате интензивността сами.",
                        },
                        {
                          q: "Кога е най-добре да се прави?",
                          a: "Най-голям ефект има веднага след физическо натоварване, но е отлично и вечер за релакс и подобряване на съня.",
                        },
                      ]
                  ).map((faq, idx) => (
                    <div key={idx} className="group cursor-default">
                      <p className="text-sm font-medium text-white mb-3 group-hover:text-emerald-400 transition-colors">
                        {faq.q}
                      </p>
                      <p className="text-xs text-zinc-500 font-light leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety / Contraindications */}
              <div className="p-10 md:p-12 rounded-6xl bg-zinc-900/40 border border-white/5 relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full" />
                <div className="flex items-center gap-4 mb-10">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-light">
                      Важна информация и Безопасност
                    </h3>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mt-1">
                      Противопоказания
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {contraindications.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all"
                    >
                      <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-500 transition-all">
                        <span className="text-[10px] text-amber-500 group-hover:text-white font-bold">
                          {idx + 1}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed font-light hover:text-zinc-300 transition-colors">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Offer Card */}
              <div className="p-12 rounded-6xl bg-linear-to-br from-purple-500/10 to-emerald-500/10 border border-emerald-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-r from-purple-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <h4 className="text-xl font-light mb-6 text-white">
                  Член на БК Гълъбово?
                </h4>
                <p className="text-zinc-500 text-sm mb-8 font-light leading-relaxed">
                  Използвайте Вашия специален промо код за 50% отстъпка при
                  първото посещение.
                </p>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <code className="text-emerald-400 font-black tracking-widest">
                    BKGALABOVO
                  </code>
                  <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 text-[10px] font-bold">
                    50%
                  </div>
                </div>
              </div>
            </div>
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

      {/* Contact Section */}
      <section
        id="contact"
        className="py-32 px-6 relative bg-zinc-950 scroll-mt-32"
      >
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
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-linear-to-r group-hover:from-purple-500 group-hover:to-emerald-500 group-hover:text-white transition-all">
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
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-linear-to-r group-hover:from-purple-500 group-hover:to-emerald-500 group-hover:text-white transition-all">
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
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-linear-to-r group-hover:from-purple-500 group-hover:to-emerald-500 group-hover:text-white transition-all">
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
                  className="w-full flex items-center justify-center gap-3 px-10 py-6 bg-linear-to-r from-purple-500 to-emerald-500 hover:opacity-90 text-white rounded-2xl text-sm font-bold transition-all shadow-2xl shadow-emerald-500/30"
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
          <div className="flex items-center">
            <div className="h-10 w-40 relative overflow-hidden">
              <Image
                src="/1.png"
                alt="Recovery Zone by ZM"
                fill
                sizes="100vw"
                className="object-contain"
              />
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
