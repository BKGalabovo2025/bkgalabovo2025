"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/icons/social-icons";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicEventCard } from "@/components/shared/schedule/PublicEventCard";
import { Site } from "@/types/site.types";

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
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 font-sans text-white selection:bg-blue-400 selection:text-white">
      {/* Nav */}
      <PublicNav clubSite={clubSite} />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center pt-16">
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
          className="relative z-10 mx-auto mt-20 max-w-6xl px-6 text-center"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/50 bg-black/80 px-4 py-2 text-xs font-medium tracking-widest text-blue-400 uppercase shadow-[0_0_15px_rgba(30,58,138,0.3)]">
            <Trophy size={14} className="animate-pulse" />
            Основан 2014 г.
          </div>
          <h1 className="leading-1.05 mx-auto mb-6 max-w-4xl text-5xl font-black tracking-tighter uppercase md:text-8xl">
            Страстта
            <br />
            към{" "}
            <span className="text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]">
              Бадминтона
            </span>
          </h1>

          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <a
              href="#contacts"
              className="group flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold tracking-widest text-white uppercase shadow-[0_0_20px_rgba(30,58,138,0.6)] transition-all hover:-translate-y-1 hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(30,58,138,0.9)]"
            >
              Стани Член{" "}
              <ChevronRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
            <a
              href="#schedule"
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-black/80 px-8 py-4 text-sm font-bold tracking-widest text-white uppercase transition-all hover:-translate-y-1 hover:border-blue-400 hover:bg-black hover:shadow-[0_0_15px_rgba(30,58,138,0.3)]"
            >
              График и Тренировки
            </a>
          </div>
        </motion.div>
      </section>

      {/* About & Mission */}
      <section id="about" className="relative bg-zinc-950 px-6 py-24">
        {/* Glow effect */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[800px] -translate-1/2 rounded-full bg-blue-500/5 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-[11px] font-bold tracking-[0.4em] text-blue-400 uppercase drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]">
              За Клуба & Мисия
            </p>
            <h2 className="text-4xl font-light tracking-tight md:text-5xl">
              Развитие и популяризиране на{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text font-bold text-transparent">
                бадминтона
              </span>{" "}
              в Гълъбово
            </h2>
          </div>

          <div className="group relative overflow-hidden rounded-6xl border border-zinc-800/50 bg-black/40 p-8 backdrop-blur-xl transition-colors duration-700 hover:border-zinc-700/80 md:p-14">
            <div className="pointer-events-none absolute top-0 right-0 size-64 rounded-full bg-blue-400/5 blur-[80px] transition-colors duration-700 group-hover:bg-blue-400/10" />

            <div className="relative z-10 space-y-8 text-center md:text-left">
              <p className="text-lg leading-relaxed font-light text-zinc-300 md:text-xl">
                СНЦ „Бадминтон клуб Гълъбово“ е сдружение с нестопанска цел,
                създадено през{" "}
                <span className="font-medium text-white">2014 г.</span> Нашата
                основна цел е да създадем професионална и същевременно
                приятелска среда за развитие на този динамичен спорт.
              </p>

              <div className="mx-auto h-px w-16 bg-gradient-to-r from-blue-500 to-transparent md:mx-0" />

              <p className="text-lg leading-relaxed text-zinc-400">
                Клубът организира регулярни тренировки за всички възрастови
                групи –{" "}
                <span className="text-zinc-200">
                  деца, юноши, възрастни и ветерани
                </span>
                . Гордеем се с нашата общност, която не спира да расте и да
                постига спортни върхове.
              </p>
            </div>

            <div className="relative z-10 mt-16 border-t border-zinc-800/50 pt-12">
              <div className="absolute top-0 left-1/2 -translate-1/2 rounded-full border border-zinc-800/80 bg-zinc-950 p-3 px-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <Target className="size-6 text-blue-400" />
              </div>

              <div className="mt-6 text-center">
                <h3 className="mb-6 text-2xl font-bold tracking-widest text-white uppercase">
                  Мисия
                </h3>
                <p className="mx-auto max-w-3xl text-lg leading-relaxed text-zinc-400">
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
      <section id="activities" className="relative px-6 py-24">
        {/* Glow effect */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[800px] -translate-1/2 rounded-full bg-indigo-500/5 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-light tracking-tight md:text-5xl">
              Нашите Дейности
            </h2>
          </div>

          <div className="group relative overflow-hidden rounded-6xl border border-zinc-800/50 bg-black/40 p-8 backdrop-blur-xl transition-colors duration-700 hover:border-zinc-700/80 md:p-14">
            <div className="pointer-events-none absolute right-0 bottom-0 size-64 rounded-full bg-indigo-500/5 blur-[80px] transition-colors duration-700 group-hover:bg-indigo-400/10" />

            <div className="relative z-10 space-y-12">
              {activities.map((act, i) => (
                <motion.div
                  key={act.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group/item relative"
                >
                  <div className="flex flex-col items-start gap-6 md:flex-row md:gap-8">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-950/80 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all duration-500 group-hover/item:border-blue-400 group-hover/item:bg-blue-400 group-hover/item:text-white">
                      <act.icon size={24} />
                    </div>
                    <div>
                      <h3 className="mb-3 text-xl font-bold tracking-wide text-white">
                        {act.title}
                      </h3>
                      <p className="text-lg leading-relaxed text-zinc-400">
                        {act.desc}
                      </p>
                    </div>
                  </div>
                  {/* Divider except for last item */}
                  {i !== activities.length - 1 && (
                    <div className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Call to Action */}
      <section className="relative px-6 py-24">
        {/* Glow effect */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[800px] -translate-1/2 rounded-full bg-blue-500/5 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mb-4 text-[11px] font-bold tracking-[0.4em] text-blue-400 uppercase drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]">
            Каталог
          </p>
          <h2 className="mb-16 text-4xl font-light tracking-tight md:text-5xl">
            Нашите Услуги и Тренировки
          </h2>

          <div className="group relative overflow-hidden rounded-6xl border border-zinc-800/50 bg-black/40 p-8 shadow-2xl backdrop-blur-xl transition-colors duration-700 hover:border-zinc-700/80 md:p-16">
            <div className="pointer-events-none absolute top-0 left-0 size-64 rounded-full bg-blue-400/5 blur-[80px] transition-colors duration-700 group-hover:bg-blue-400/10" />

            <div className="relative z-10 flex flex-col items-center">
              <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed font-light text-zinc-300 md:text-xl">
                Разгледайте пълния списък с предлагани групови и индивидуални
                тренировки, наеми на кортове, абонаменти, спортна екипировка и
                възстановяване.
              </p>

              <Link
                href="/club/catalog"
                className="group/btn inline-flex items-center gap-3 rounded-2xl bg-blue-600 px-10 py-5 font-bold tracking-widest text-white uppercase shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1 hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]"
              >
                Разгледай нашите услуги
                <ArrowRight
                  size={20}
                  className="transition-transform group-hover/btn:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule 7 days */}
      <section id="schedule" className="relative px-6 py-24">
        <div className="pointer-events-none absolute top-1/2 right-0 size-[500px] translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h2 className="text-4xl font-light tracking-tight md:text-5xl">
                Предстоящи Тренировки и Събития
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                През следващите 7 дни
              </p>
            </div>
            <Link
              href="/club/schedule"
              className="inline-flex items-center gap-2 text-sm font-bold tracking-widest text-blue-400 uppercase transition-colors hover:text-blue-300 hover:drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]"
            >
              Пълен Календар <ArrowRight size={16} />
            </Link>
          </div>

          <div className="group relative overflow-hidden rounded-6xl border border-zinc-800/50 bg-black/40 p-8 backdrop-blur-xl transition-colors duration-700 hover:border-zinc-700/80 md:p-14">
            <div className="pointer-events-none absolute right-0 bottom-0 size-64 rounded-full bg-indigo-500/5 blur-[80px] transition-colors duration-700 group-hover:bg-indigo-400/10" />

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
                      <div className="mb-4 flex items-center gap-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold tracking-[0.35em] uppercase ${
                            isSpecialLabel(dateLabel)
                              ? "border border-blue-600/40 bg-blue-600/20 text-blue-300"
                              : "text-zinc-400"
                          }`}
                        >
                          {dateLabel}
                        </span>
                        <div className="h-px flex-1 bg-zinc-800/50" />
                      </div>

                      {/* Events for this date */}
                      <div className="space-y-3">
                        {events.map((event, i) => (
                          <PublicEventCard
                            key={event.id}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                <div className="flex flex-col items-center py-12 text-center">
                  <CalendarDays size={48} className="mb-6 text-zinc-700" />
                  <p className="text-xl font-light text-zinc-300">
                    Няма въведени тренировки за следващите 7 дни.
                  </p>
                  <p className="text-md mt-2 text-zinc-500">
                    Очаквайте обновяване на седмичната програма.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Carousel */}
      <section className="relative px-6 py-24">
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-light tracking-tight md:text-5xl">
              Къде тренираме
            </h2>
          </div>

          <div className="group relative overflow-hidden rounded-6xl border border-zinc-800/50 bg-black/40 p-8 shadow-2xl backdrop-blur-xl transition-colors duration-700 hover:border-zinc-700/80 md:p-14">
            <div className="pointer-events-none absolute top-0 right-0 size-64 rounded-full bg-blue-400/5 blur-[80px] transition-colors duration-700 group-hover:bg-blue-400/10" />

            <div className="relative z-10 grid grid-cols-1 items-center gap-12">
              <div className="text-center md:text-left">
                <p className="mb-8 text-lg leading-relaxed font-light text-zinc-300 md:text-xl">
                  Разполагаме със съвременна и напълно оборудвана спортна база.{" "}
                  <strong className="font-medium text-white">
                    Спортна зала „Енергетик“
                  </strong>{" "}
                  предлага:
                </p>
                <ul className="mx-auto mb-12 max-w-lg space-y-4 text-left md:mx-0">
                  {[
                    "6 изцяло оборудвани корта за бадминтон",
                    "Трибуни за състезатели и зрители",
                    "Модерна конферентна зала",
                    "Просторни съблекални",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/10">
                        <div className="size-2 rounded-full bg-blue-400" />
                      </div>
                      <span className="font-medium text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Carousel inside the card */}
              <div className="group/carousel relative aspect-video overflow-hidden rounded-3xl border border-zinc-800/80 bg-black/60 shadow-2xl">
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
                <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 transition-opacity duration-300 group-hover/carousel:opacity-100">
                  <button
                    onClick={prevImage}
                    aria-label="Предишна снимка"
                    className="flex size-10 items-center justify-center rounded-full border border-blue-400/50 bg-black/60 text-blue-400 shadow-[0_0_15px_rgba(30,58,138,0.5)] backdrop-blur-md transition-all hover:bg-blue-400 hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    aria-label="Следваща снимка"
                    className="flex size-10 items-center justify-center rounded-full border border-blue-400/50 bg-black/60 text-blue-400 shadow-[0_0_15px_rgba(30,58,138,0.5)] backdrop-blur-md transition-all hover:bg-blue-400 hover:text-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Indicators */}
                <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
                  {hallImages.map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Отиди на снимка ${i + 1}`}
                      onClick={() => setActiveImage(i)}
                      className="group/btn touch-manipulation p-3"
                    >
                      <div
                        className={`h-2 rounded-full transition-all duration-300 group-hover/btn:bg-white/90 ${i === activeImage ? "w-8 bg-blue-400 shadow-[0_0_8px_rgba(30,58,138,0.9)]" : "w-2 bg-white/70"}`}
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
      <section id="contacts" className="relative px-6 py-24">
        {/* Glow effect */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[800px] -translate-1/2 rounded-full bg-blue-500/5 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-[11px] font-bold tracking-[0.4em] text-blue-400 uppercase drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]">
              Свържете се с нас
            </p>
            <h2 className="text-4xl font-light tracking-tight md:text-5xl">
              Контакти и Локация
            </h2>
          </div>

          <div className="flex flex-col gap-12">
            <div className="group relative overflow-hidden rounded-6xl border border-zinc-800/50 bg-black/40 p-8 shadow-2xl backdrop-blur-xl transition-colors duration-700 hover:border-zinc-700/80 md:p-14">
              <div className="pointer-events-none absolute top-0 right-0 size-64 rounded-full bg-blue-400/5 blur-[80px] transition-colors duration-700 group-hover:bg-blue-400/10" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-start gap-4 rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-6 transition-colors hover:border-blue-400/50">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-blue-400">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-white">
                      Спортна база / Място на тренировките
                    </p>
                    <p className="text-sm leading-relaxed text-zinc-400">
                      {clubSite?.address ||
                        "Спортна зала „Енергетик“, ул. „Александър Стамболийски“ 41"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-6 transition-colors hover:border-blue-400/50">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-blue-400">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-white">
                      Телефон за връзка
                    </p>
                    <p className="text-sm text-zinc-400">Официален телефон</p>
                    <a
                      href={`tel:${clubSite?.phone || "+359899829923"}`}
                      className="mt-1 inline-block text-lg font-bold text-blue-400 hover:underline"
                    >
                      {clubSite?.phone || "+359 899 82 99 23"}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-6 transition-colors hover:border-blue-400/50">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-blue-400">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-white">Имейл</p>
                    <a
                      href={`mailto:${clubSite?.email || "bk_galabovo@abv.bg"}`}
                      className="text-sm break-all text-zinc-400 transition-colors hover:text-blue-400"
                    >
                      {clubSite?.email || "bk_galabovo@abv.bg"}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-6xl border border-zinc-800/50 bg-black/40 p-8 shadow-2xl backdrop-blur-xl transition-colors duration-700 hover:border-zinc-700/80 md:p-14">
              <div className="pointer-events-none absolute top-0 right-0 size-64 rounded-full bg-blue-400/5 blur-[80px] transition-colors duration-700 group-hover:bg-blue-400/10" />
              <h3 className="relative z-10 mb-10 text-center text-3xl font-light text-white">
                Последвайте ни в мрежите
              </h3>
              <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <a
                  href={
                    clubSite?.facebook ||
                    "https://www.facebook.com/badmintongalabovo/"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="group/social flex items-center gap-4 rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-5 shadow-none transition-all hover:border-blue-500 hover:bg-black hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors group-hover/social:border-blue-500/30 group-hover/social:bg-blue-500/10 group-hover/social:text-blue-500">
                    <FacebookIcon size={24} />
                  </div>
                  <span className="text-lg font-medium text-zinc-300 transition-colors group-hover/social:text-white">
                    Facebook
                  </span>
                </a>

                <a
                  href={
                    clubSite?.facebookGroup ||
                    "https://www.facebook.com/groups/645571089477573/?ref=pages_profile_groups_tab&source_id=261837657240190"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="group/social flex items-center gap-4 rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-5 shadow-none transition-all hover:border-blue-400 hover:bg-black hover:shadow-[0_0_20px_rgba(96,165,250,0.3)]"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors group-hover/social:border-blue-400/30 group-hover/social:bg-blue-400/10 group-hover/social:text-blue-400">
                    <Users size={24} />
                  </div>
                  <span className="text-lg font-medium text-zinc-300 transition-colors group-hover/social:text-white">
                    Група
                  </span>
                </a>

                <a
                  href={
                    clubSite?.instagram ||
                    "https://www.instagram.com/badminton.galabovo/"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="group/social flex items-center gap-4 rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-5 shadow-none transition-all hover:border-pink-500 hover:bg-black hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors group-hover/social:border-pink-500/30 group-hover/social:bg-pink-500/10 group-hover/social:text-pink-500">
                    <InstagramIcon size={24} />
                  </div>
                  <span className="text-lg font-medium text-zinc-300 transition-colors group-hover/social:text-white">
                    Instagram
                  </span>
                </a>

                <a
                  href={
                    clubSite?.youtube ||
                    "https://www.youtube.com/channel/UCkwXJM3aWkNrcDh5aIyCPRw"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="group/social flex items-center gap-4 rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-5 shadow-none transition-all hover:border-red-500 hover:bg-black hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors group-hover/social:border-red-500/30 group-hover/social:bg-red-500/10 group-hover/social:text-red-500">
                    <YoutubeIcon size={24} />
                  </div>
                  <span className="text-lg font-medium text-zinc-300 transition-colors group-hover/social:text-white">
                    YouTube
                  </span>
                </a>
              </div>

              {/* Instagram Feed Widget (Lazy Loaded) */}
              <div
                ref={widgetRef}
                className="relative z-10 mt-12 min-h-100 w-full overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/50"
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
