"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import { Site } from "@/types/site.types";

import {
  Trophy,
  Target,
  Users,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  ArrowRight,
  Clock,
  Printer,
  Info,
  ChevronDown,
} from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/icons/social-icons";
import { motion, AnimatePresence } from "framer-motion";
import { formatEventDateRange } from "@/lib/date-utils";
import { PublicEventCard } from "@/components/shared/schedule/PublicEventCard";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";

type EventSlot = {
  id: string;
  title: string;
  startTime: string | Date;
  endTime: string | Date;
  isCancelled?: boolean;
  description?: string;
  location?: string;
};

const activities = [
  {
    icon: Trophy,
    title: "Участие в състезания от Държавния спортен календар (ДСК)",
    desc: "СНЦ „Бадминтон клуб Гълъбово“ участва активно със своите състезатели и членове във всички официални състезания от Държавния спортен календар (ДСК) на Българската Федерация Бадминтон. Това дава възможност на нашите таланти да премерят сили с най-добрите в страната, да трупат безценен състезателен опит и да прославят клуба и град Гълъбово.",
  },
  {
    icon: Users,
    title: "Провеждане на спортни демонстрации и партньорства",
    desc: "С цел популяризиране на спорта сред най-малките, клубът организира открити спортни демонстрации в град Гълъбово. Развиваме активни партньорства с местните училища и детски градини, за да покажем на децата красотата на бадминтона и да ги привлечем към активния и здравословен начин на живот от ранна възраст.",
  },
  {
    icon: CalendarDays,
    title: "Организиране на летни спортни лагери",
    desc: "Един от акцентите в годишната ни програма е провеждането на специализирани летни спортни лагери за членовете на клуба. Тези лагери съчетават интензивни тренировки извън стандартната зала с активности, които засилват екипния дух и приятелството в общността ни. (Забележка: Летните лагери са официална част от нашия актуален спортен график и календар за сезона).",
  },
  {
    icon: Target,
    title: "Организиране на турнири",
    desc: "Турнири от Национална верига „Млади таланти“ турнири от Национална верига по бадминтон, турнири за всички възрасти – от деца до ветерани, любители , както и вътрешни клубни турнири и Общински турнири.",
  },
];

export default function ClubClient({
  schedule,
  hallImages = [],
  clubSite,
}: {
  schedule: EventSlot[];
  hallImages?: string[];
  clubSite?: Site | null;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsWidgetVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );

    if (widgetRef.current) {
      observer.observe(widgetRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % hallImages.length);
  };

  const prevImage = () => {
    setActiveImage(
      (prev) => (prev - 1 + hallImages.length) % hallImages.length
    );
  };

  // Group events by date label
  const groupedEvents = schedule.reduce(
    (acc, event) => {
      const date = new Date(event.startTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      let label: string;
      if (date >= today && date < tomorrow) {
        label = "Днес";
      } else if (
        date >= tomorrow &&
        date < new Date(tomorrow.getTime() + 86400000)
      ) {
        label = "Утре";
      } else {
        label = date.toLocaleDateString("bg-BG", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        // Capitalize first letter
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }

      if (!acc[label]) acc[label] = [];
      acc[label].push(event);
      return acc;
    },
    {} as Record<string, typeof schedule>
  );

  const groups = Object.entries(groupedEvents);
  const isSpecialLabel = (label: string) =>
    label === "Днес" || label === "Утре";

  return (
    <main className="min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden selection:bg-blue-400 selection:text-white">
      {/* Nav */}
      <PublicNav clubSite={clubSite} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0">
          <Image
            src="/bk-hero.png"
            alt="БК Гълъбово"
            fill
            sizes="100vw"
            className="object-cover opacity-40"
            priority
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-zinc-950/80 to-zinc-950" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-6xl mx-auto px-6 text-center mt-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/80 border border-blue-400/50 rounded-full text-blue-400 text-xs font-medium uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(30,58,138,0.3)]">
            <Trophy size={14} className="animate-pulse" />
            Основан 2014 г.
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter max-w-4xl mx-auto leading-[1.05] mb-6 uppercase">
            Страстта
            <br />
            към{" "}
            <span className="text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]">
              Бадминтона
            </span>
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="#contacts"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(30,58,138,0.6)] hover:shadow-[0_0_30px_rgba(30,58,138,0.9)] hover:-translate-y-1"
            >
              Стани Член{" "}
              <ChevronRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>
            <a
              href="#schedule"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-black/80 hover:bg-black text-white border border-zinc-800 hover:border-blue-400 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(30,58,138,0.3)]"
            >
              График и Тренировки
            </a>
          </div>
        </motion.div>
      </section>

      {/* About & Mission */}
      <section id="about" className="py-24 px-6 bg-zinc-950 relative">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4 drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]">
              За Клуба & Мисия
            </p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight">
              Развитие и популяризиране на{" "}
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                бадминтона
              </span>{" "}
              в Гълъбово
            </h2>
          </div>

          <div className="bg-black/40 border border-zinc-800/50 p-8 md:p-14 rounded-[3rem] backdrop-blur-xl relative overflow-hidden group hover:border-zinc-700/80 transition-colors duration-700">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-400/10 transition-colors duration-700" />

            <div className="space-y-8 text-center md:text-left relative z-10">
              <p className="text-zinc-300 text-lg md:text-xl font-light leading-relaxed">
                СНЦ „Бадминтон клуб Гълъбово“ е сдружение с нестопанска цел,
                създадено през{" "}
                <span className="text-white font-medium">2014 г.</span> Нашата
                основна цел е да създадем професионална и същевременно
                приятелска среда за развитие на този динамичен спорт.
              </p>

              <div className="w-16 h-px bg-gradient-to-r from-blue-500 to-transparent mx-auto md:mx-0" />

              <p className="text-zinc-400 text-lg leading-relaxed">
                Клубът организира регулярни тренировки за всички възрастови
                групи –{" "}
                <span className="text-zinc-200">
                  деца, юноши, възрастни и ветерани
                </span>
                . Гордеем се с нашата общност, която не спира да расте и да
                постига спортни върхове.
              </p>
            </div>

            <div className="mt-16 pt-12 border-t border-zinc-800/50 relative z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 px-4 rounded-full border border-zinc-800/80 p-3 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <Target className="w-6 h-6 text-blue-400" />
              </div>

              <div className="text-center mt-6">
                <h3 className="text-2xl font-bold tracking-widest text-white uppercase mb-6">
                  Мисия
                </h3>
                <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl mx-auto">
                  Извън спортните постижения, нашата най-важна мисия е да държим
                  младото поколение активно и здраво. Чрез бадминтона
                  осигуряваме сигурна среда за децата – далеч от застоялия живот
                  пред телефоните, затлъстяването и пороците на съвременното
                  общество (като алкохол и наркотици). Вярваме, че спортът
                  изгражда физическа дисциплина, възпитава характер, борбеност и
                  екипен дух.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section id="activities" className="py-24 px-6 relative">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight">
              Нашите Дейности
            </h2>
          </div>

          <div className="bg-black/40 border border-zinc-800/50 p-8 md:p-14 rounded-[3rem] backdrop-blur-xl relative overflow-hidden group hover:border-zinc-700/80 transition-colors duration-700">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-400/10 transition-colors duration-700" />

            <div className="space-y-12 relative z-10">
              {activities.map((act, i) => (
                <motion.div
                  key={act.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group/item relative"
                >
                  <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                    <div className="h-14 w-14 shrink-0 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover/item:bg-blue-400 group-hover/item:text-white group-hover/item:border-blue-400 transition-all duration-500">
                      <act.icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-3 tracking-wide">
                        {act.title}
                      </h3>
                      <p className="text-zinc-400 text-lg leading-relaxed">
                        {act.desc}
                      </p>
                    </div>
                  </div>
                  {/* Divider except for last item */}
                  {i !== activities.length - 1 && (
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mt-12" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Call to Action */}
      <section className="py-24 px-6 relative">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4 drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]">
            Каталог
          </p>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-16">
            Нашите Услуги и Тренировки
          </h2>

          <div className="bg-black/40 border border-zinc-800/50 p-8 md:p-16 rounded-[3rem] backdrop-blur-xl relative overflow-hidden group hover:border-zinc-700/80 transition-colors duration-700 shadow-2xl">
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-400/10 transition-colors duration-700" />

            <div className="relative z-10 flex flex-col items-center">
              <p className="text-zinc-300 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto mb-12">
                Разгледайте пълния списък с предлагани групови и индивидуални
                тренировки, наеми на кортове, абонаменти, спортна екипировка и
                възстановяване.
              </p>

              <Link
                href="/club/catalog"
                className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-1 group/btn"
              >
                Разгледай нашите услуги
                <ArrowRight
                  size={20}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule 7 days */}
      <section id="schedule" className="py-24 px-6 relative">
        <div className="absolute right-0 top-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight">
                Предстоящи Тренировки и Събития
              </h2>
              <p className="text-zinc-400 mt-4 text-lg">
                През следващите 7 дни
              </p>
            </div>
            <Link
              href="/club/schedule"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors hover:drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]"
            >
              Пълен Календар <ArrowRight size={16} />
            </Link>
          </div>

          <div className="bg-black/40 border border-zinc-800/50 p-8 md:p-14 rounded-[3rem] backdrop-blur-xl relative overflow-hidden group hover:border-zinc-700/80 transition-colors duration-700">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-400/10 transition-colors duration-700" />

            <div className="relative z-10">
              {schedule.length > 0 ? (
                <div className="space-y-10">
                  {groups.map(([dateLabel, events], groupIdx) => (
                    <motion.div
                      key={dateLabel}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: groupIdx * 0.07 }}
                    >
                      {/* Date Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <span
                          className={`text-xs font-bold uppercase tracking-[0.35em] px-3 py-1 rounded-full ${
                            isSpecialLabel(dateLabel)
                              ? "bg-blue-600/20 text-blue-300 border border-blue-600/40"
                              : "text-zinc-400"
                          }`}
                        >
                          {dateLabel}
                        </span>
                        <div className="flex-1 h-px bg-zinc-800/50" />
                      </div>

                      {/* Events for this date */}
                      <div className="space-y-3">
                    {events.map((event, i) => (
                      <PublicEventCard
                        key={event.id}
                        event={event as any}
                        groupIdx={groupIdx}
                        i={i}
                        showAdminLinks={false}
                      />
                    ))}
                  </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center">
                  <CalendarDays size={48} className="text-zinc-700 mb-6" />
                  <p className="text-zinc-300 text-xl font-light">
                    Няма въведени тренировки за следващите 7 дни.
                  </p>
                  <p className="text-zinc-500 text-md mt-2">
                    Очаквайте обновяване на седмичната програма.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Carousel */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight">
              Къде тренираме
            </h2>
          </div>

          <div className="bg-black/40 border border-zinc-800/50 p-8 md:p-14 rounded-[3rem] backdrop-blur-xl relative overflow-hidden group hover:border-zinc-700/80 transition-colors duration-700 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-400/10 transition-colors duration-700" />

            <div className="grid grid-cols-1 gap-12 items-center relative z-10">
              <div className="text-center md:text-left">
                <p className="text-zinc-300 text-lg md:text-xl font-light leading-relaxed mb-8">
                  Разполагаме със съвременна и напълно оборудвана спортна база.{" "}
                  <strong className="text-white font-medium">
                    Спортна зала „Енергетик“
                  </strong>{" "}
                  предлага:
                </p>
                <ul className="space-y-4 mb-12 max-w-lg mx-auto md:mx-0 text-left">
                  {[
                    "6 изцяло оборудвани корта за бадминтон",
                    "Трибуни за състезатели и зрители",
                    "Модерна конферентна зала",
                    "Просторни съблекални",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 shrink-0 h-5 w-5 rounded-full bg-blue-400/10 flex items-center justify-center border border-blue-400/30">
                        <div className="h-2 w-2 rounded-full bg-blue-400" />
                      </div>
                      <span className="text-zinc-300 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Carousel inside the card */}
              <div className="relative aspect-video bg-black/60 rounded-3xl overflow-hidden border border-zinc-800/80 shadow-2xl group/carousel">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={hallImages[activeImage]}
                      alt="Спортна зала Енергетик"
                      fill
                      sizes="(max-width: 896px) 100vw, 896px"
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Controls */}
                <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={prevImage}
                    aria-label="Предишна снимка"
                    className="h-10 w-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-blue-400 hover:text-white border border-blue-400/50 hover:bg-blue-400 transition-all shadow-[0_0_15px_rgba(30,58,138,0.5)]"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    aria-label="Следваща снимка"
                    className="h-10 w-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-blue-400 hover:text-white border border-blue-400/50 hover:bg-blue-400 transition-all shadow-[0_0_15px_rgba(30,58,138,0.5)]"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Indicators */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                  {hallImages.map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Отиди на снимка ${i + 1}`}
                      onClick={() => setActiveImage(i)}
                      className="touch-manipulation group/btn p-3"
                    >
                      <div
                        className={`h-2 transition-all duration-300 rounded-full group-hover/btn:bg-white/90 ${i === activeImage ? "w-8 bg-blue-400 shadow-[0_0_8px_rgba(30,58,138,0.9)]" : "w-2 bg-white/70"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contacts & Social */}
      <section id="contacts" className="py-24 px-6 relative">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4 drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]">
              Свържете се с нас
            </p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight">
              Контакти и Локация
            </h2>
          </div>

          <div className="flex flex-col gap-12">
            <div className="bg-black/40 border border-zinc-800/50 p-8 md:p-14 rounded-[3rem] backdrop-blur-xl relative overflow-hidden group hover:border-zinc-700/80 transition-colors duration-700 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-400/10 transition-colors duration-700" />

              <div className="space-y-6 relative z-10">
                <div className="bg-zinc-950/50 border border-zinc-800/80 p-6 rounded-3xl flex items-start gap-4 hover:border-blue-400/50 transition-colors">
                  <div className="h-12 w-12 bg-blue-400/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-400/20">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">
                      Спортна база / Място на тренировките
                    </p>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {clubSite?.address ||
                        "Спортна зала „Енергетик“, ул. „Александър Стамболийски“ 41"}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-950/50 border border-zinc-800/80 p-6 rounded-3xl flex items-start gap-4 hover:border-blue-400/50 transition-colors">
                  <div className="h-12 w-12 bg-blue-400/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-400/20">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">
                      Телефон за връзка
                    </p>
                    <p className="text-zinc-400 text-sm">Официален телефон</p>
                    <a
                      href={`tel:${clubSite?.phone || "+359899829923"}`}
                      className="text-blue-400 font-bold text-lg mt-1 inline-block hover:underline"
                    >
                      {clubSite?.phone || "+359 899 82 99 23"}
                    </a>
                  </div>
                </div>

                <div className="bg-zinc-950/50 border border-zinc-800/80 p-6 rounded-3xl flex items-start gap-4 hover:border-blue-400/50 transition-colors">
                  <div className="h-12 w-12 bg-blue-400/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-400/20">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Имейл</p>
                    <a
                      href={`mailto:${clubSite?.email || "bk_galabovo@abv.bg"}`}
                      className="text-zinc-400 text-sm hover:text-blue-400 transition-colors break-all"
                    >
                      {clubSite?.email || "bk_galabovo@abv.bg"}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/40 border border-zinc-800/50 p-8 md:p-14 rounded-[3rem] backdrop-blur-xl relative overflow-hidden group hover:border-zinc-700/80 transition-colors duration-700 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-400/10 transition-colors duration-700" />
              <h3 className="text-3xl font-light text-white mb-10 relative z-10 text-center">
                Последвайте ни в мрежите
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                {clubSite?.facebook && (
                  <a
                    href={clubSite.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 p-5 bg-zinc-950/50 border border-zinc-800/80 rounded-3xl hover:border-blue-500 hover:bg-black transition-all shadow-none hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] group/social"
                  >
                    <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-300 group-hover/social:bg-blue-500/10 group-hover/social:text-blue-500 transition-colors border border-zinc-800 group-hover/social:border-blue-500/30">
                      <FacebookIcon size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 group-hover/social:text-white transition-colors text-lg">
                      Facebook
                    </span>
                  </a>
                )}
                {clubSite?.facebookGroup && (
                  <a
                    href={clubSite.facebookGroup}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 p-5 bg-zinc-950/50 border border-zinc-800/80 rounded-3xl hover:border-blue-400 hover:bg-black transition-all shadow-none hover:shadow-[0_0_20px_rgba(96,165,250,0.3)] group/social"
                  >
                    <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-300 group-hover/social:bg-blue-400/10 group-hover/social:text-blue-400 transition-colors border border-zinc-800 group-hover/social:border-blue-400/30">
                      <Users size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 group-hover/social:text-white transition-colors text-lg">
                      Група
                    </span>
                  </a>
                )}
                {clubSite?.instagram && (
                  <a
                    href={clubSite.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 p-5 bg-zinc-950/50 border border-zinc-800/80 rounded-3xl hover:border-pink-500 hover:bg-black transition-all shadow-none hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] group/social"
                  >
                    <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-300 group-hover/social:bg-pink-500/10 group-hover/social:text-pink-500 transition-colors border border-zinc-800 group-hover/social:border-pink-500/30">
                      <InstagramIcon size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 group-hover/social:text-white transition-colors text-lg">
                      Instagram
                    </span>
                  </a>
                )}
                {clubSite?.youtube && (
                  <a
                    href={clubSite.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 p-5 bg-zinc-950/50 border border-zinc-800/80 rounded-3xl hover:border-red-500 hover:bg-black transition-all shadow-none hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] group/social"
                  >
                    <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-300 group-hover/social:bg-red-500/10 group-hover/social:text-red-500 transition-colors border border-zinc-800 group-hover/social:border-red-500/30">
                      <YoutubeIcon size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 group-hover/social:text-white transition-colors text-lg">
                      YouTube
                    </span>
                  </a>
                )}

                {!clubSite?.facebook &&
                  !clubSite?.facebookGroup &&
                  !clubSite?.instagram &&
                  !clubSite?.youtube && (
                    <p className="text-zinc-400 text-sm col-span-2 text-center py-4">
                      Очаквайте скоро нашите социални мрежи.
                    </p>
                  )}
              </div>

              {/* Instagram Feed Widget (Lazy Loaded) */}
              <div
                ref={widgetRef}
                className="mt-12 overflow-hidden rounded-3xl relative w-full min-h-[400px] bg-zinc-950/50 border border-zinc-800/80 z-10"
              >
                {isWidgetVisible && (
                  <>
                    <Script
                      src="https://elfsightcdn.com/platform.js"
                      strategy="lazyOnload"
                    />
                    <div
                      className="elfsight-app-38429d6c-a19f-4a06-97e0-33126f15eb84"
                      data-elfsight-app-lazy
                    ></div>
                    <div
                      className="elfsight-app-026b377a-abc3-4a27-9a45-85779cc6e70e"
                      data-elfsight-app-lazy
                    ></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter clubSite={clubSite} />
    </main>
  );
}
