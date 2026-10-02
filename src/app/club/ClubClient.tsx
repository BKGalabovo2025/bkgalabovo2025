"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Shield,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/icons/social-icons";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicEventCard } from "@/components/shared/schedule/PublicEventCard";
import { Translate } from "@/components/shared/Translate";
import { Button } from "@/components/ui/button";
import { Site } from "@/types/site.types";

type EventSlot = {
  id: string;
  title: string;
  startTime: string | Date;
  endTime: string | Date;
  type?: string;
  isTournament?: boolean;
  isCancelled?: boolean;
  description?: string;
  location?: string;
  tournamentUrl?: string | null;
  tournamentId?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: "pdf" | "word" | "excel" | "other" | null;
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

type ScheduleFilter = "all" | "trainings" | "tournaments" | "events";

const isCompetitionEvent = (e: EventSlot) =>
  Boolean(e.isTournament) ||
  e.type === "competition" ||
  Boolean(e.tournamentUrl) ||
  Boolean(e.tournamentId);

const isClubEvent = (e: EventSlot) =>
  !isCompetitionEvent(e) &&
  (e.type === "camp" || e.type === "event" || e.type === "other");

const isTrainingEvent = (e: EventSlot) =>
  !isCompetitionEvent(e) && (e.type === "training" || !e.type);

export default function ClubClient({
  schedule = [],
  hallImages = [],
  clubSite,
}: {
  schedule?: EventSlot[];
  trainings?: EventSlot[];
  tournaments?: EventSlot[];
  hallImages?: string[];
  clubSite?: Site | null;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<ScheduleFilter>("all");
  const widgetRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Filter events for next 7 days for the club preview
  const next7DaysEvents = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOf7Days = new Date(now);
    endOf7Days.setDate(now.getDate() + 7);
    endOf7Days.setHours(23, 59, 59, 999);

    return schedule.filter((event) => {
      const eventStart = new Date(event.startTime);
      const eventEnd = event.endTime ? new Date(event.endTime) : eventStart;
      return eventEnd >= startOfDay && eventStart <= endOf7Days;
    });
  }, [schedule]);

  const trainingsCount = next7DaysEvents.filter(isTrainingEvent).length;
  const tournamentsCount = next7DaysEvents.filter(isCompetitionEvent).length;
  const eventsCount = next7DaysEvents.filter(isClubEvent).length;

  // Synchronize tab with URL hash (#tournaments vs #schedule vs #events)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkHash = () => {
        if (window.location.hash === "#tournaments") {
          setActiveTab("tournaments");
        } else if (window.location.hash === "#events") {
          setActiveTab("events");
        } else if (window.location.hash === "#trainings") {
          setActiveTab("trainings");
        } else if (window.location.hash === "#schedule") {
          setActiveTab("all");
        }
      };
      checkHash();
      window.addEventListener("hashchange", checkHash);
      return () => window.removeEventListener("hashchange", checkHash);
    }
  }, []);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsMapVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "250px" }
    );

    if (mapRef.current) {
      observer.observe(mapRef.current);
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

  const displayedEvents = next7DaysEvents.filter((event) => {
    if (activeTab === "trainings") return isTrainingEvent(event);
    if (activeTab === "tournaments") return isCompetitionEvent(event);
    if (activeTab === "events") return isClubEvent(event);
    return true;
  });

  const getHeaderInfo = () => {
    switch (activeTab) {
      case "trainings":
        return {
          title: "График на Тренировките",
          subtitle: "Тренировъчна програма за следващите 7 дни",
        };
      case "tournaments":
        return {
          title: "Спортен Календар и Турнири",
          subtitle: "Предстоящи състезания и турнири за следващите 7 дни",
        };
      case "events":
        return {
          title: "Лагери и Клубни Събития",
          subtitle: "Специализирани лагери и събития за следващите 7 дни",
        };
      case "all":
      default:
        return {
          title: "Календар и Клубни Дейности",
          subtitle:
            "Всички предстоящи тренировки, турнири и клубни събития за следващите 7 дни",
        };
    }
  };

  const getEmptyState = () => {
    switch (activeTab) {
      case "tournaments":
        return {
          title: "Няма предстоящи състезания или турнири за следващите 7 дни.",
          subtitle:
            "Прегледайте пълния календар за по-нататъшни турнири и наредби.",
        };
      case "trainings":
        return {
          title: "Няма предстоящи тренировки за следващите 7 дни.",
          subtitle: "Следете страницата или прегледайте пълния календар.",
        };
      case "events":
        return {
          title:
            "Няма предстоящи лагери или клубни събития за следващите 7 дни.",
          subtitle: "Прегледайте пълния календар за бъдещи инициативи.",
        };
      case "all":
      default:
        return {
          title: "Няма предстоящи събития за следващите 7 дни.",
          subtitle: "Прегледайте пълния календар за цялостния график на клуба.",
        };
    }
  };

  // Group events by date label
  const groupedEvents = displayedEvents.reduce(
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
    {} as Record<string, EventSlot[]>
  );

  const groups = Object.entries(groupedEvents);
  const isSpecialLabel = (label: string) =>
    label === "Днес" || label === "Утре";

  return (
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 font-sans text-white selection:bg-blue-400 selection:text-white">
      {/* Nav */}
      <PublicNav clubSite={clubSite} />

      {/* Hero Section - Fullscreen Attention-Grabbing First Impression */}
      <section className="relative flex h-dvh min-h-dvh w-full flex-col items-center justify-center overflow-hidden px-4 pt-14 pb-8 sm:px-6 sm:pt-16">
        <div className="absolute inset-0">
          <Image
            src="/bk-hero.webp"
            alt="БК Гълъбово"
            fill
            sizes="100vw"
            className="object-cover opacity-45"
            priority
          />
          {/* Rich Dark gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-b from-black/70 via-zinc-950/75 to-zinc-950" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 m-auto flex max-w-5xl flex-col items-center justify-center text-center"
        >
          <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-blue-400/50 bg-black/80 px-3.5 py-1.5 text-xs font-semibold tracking-widest text-blue-400 uppercase shadow-[0_0_20px_rgba(30,58,138,0.4)] sm:mb-5 sm:px-4 sm:py-2">
            <Trophy size={14} className="animate-pulse text-amber-400" />
            Основан 2014 г.
          </div>

          <h1 className="mx-auto mb-6 max-w-4xl text-3xl font-black tracking-tight uppercase leading-1.1 sm:mb-8 sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block sm:inline">Страстта към </span>
            <span className="text-blue-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.75)]">
              Бадминтона
            </span>
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none mx-auto">
            <a
              href="#contacts"
              className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold tracking-widest text-white uppercase shadow-[0_0_25px_rgba(30,58,138,0.7)] transition-all hover:-translate-y-1 hover:bg-blue-500 hover:shadow-[0_0_35px_rgba(59,130,246,0.9)] sm:px-9 sm:py-4 sm:text-sm"
            >
              Стани Член{" "}
              <ChevronRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
            <a
              href="#schedule"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-black/80 px-6 py-3.5 text-xs font-bold tracking-widest text-white uppercase transition-all hover:-translate-y-1 hover:border-blue-400 hover:bg-black hover:shadow-[0_0_20px_rgba(30,58,138,0.4)] sm:px-9 sm:py-4 sm:text-sm"
            >
              График и Тренировки
            </a>
          </div>
        </motion.div>
      </section>

      {/* About & Mission */}
      <section
        id="about"
        className="relative scroll-mt-14 bg-zinc-950 px-4 py-5 sm:scroll-mt-16 sm:p-6"
      >
        {/* Glow effect */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[800px] -translate-1/2 rounded-full bg-blue-500/5 blur-[120px]" />

        <div className="relative z-10 m-auto max-w-5xl">
          <div className="mb-4 text-center sm:mb-5">
            <p className="mb-1 text-[10px] font-bold tracking-[0.4em] text-blue-400 uppercase drop-shadow-[0_0_8px_rgba(30,58,138,0.8)] sm:text-[11px]">
              За Клуба & Мисия
            </p>
            <h2 className="text-2xl font-light tracking-tight sm:text-3xl">
              Развитие и популяризиране на{" "}
              <span className="bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text font-bold text-transparent">
                бадминтона
              </span>{" "}
              в Гълъбово
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2">
            {/* Card 1: About Club */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="group/card relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/60 bg-black/40 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/60 hover:bg-zinc-950/70 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] sm:rounded-3xl sm:p-6"
            >
              <div className="pointer-events-none absolute top-0 right-0 size-48 rounded-full bg-blue-400/5 blur-[60px] transition-all duration-500 group-hover/card:bg-blue-400/20 group-hover/card:scale-125" />

              <div className="relative z-10 flex flex-col space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-2 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)] transition-all duration-300 group-hover/card:border-blue-400 group-hover/card:bg-blue-600 group-hover/card:text-white group-hover/card:shadow-[0_0_20px_rgba(59,130,246,0.5)] sm:size-11">
                    <Shield size={20} />
                  </div>
                  <h3 className="text-xs font-bold tracking-widest text-white uppercase sm:text-sm">
                    За Клуба
                  </h3>
                </div>

                <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                  <Translate
                    bg={
                      <>
                        СНЦ „Бадминтон клуб Гълъбово“ е сдружение с нестопанска
                        цел, създадено през{" "}
                        <span className="font-semibold text-white">
                          2014 г.
                        </span>{" "}
                        Нашата основна цел е да създадем професионална и
                        същевременно приятелска среда за развитие на този
                        динамичен спорт.
                      </>
                    }
                    en={
                      <>
                        The non-profit association &quot;Badminton Club
                        Galabovo&quot; was established in{" "}
                        <span className="font-semibold text-white">2014</span>.
                        Our main goal is to create a professional and friendly
                        environment for the development of this dynamic sport.
                      </>
                    }
                  />
                </p>

                <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                  Клубът организира регулярни тренировки за всички възрастови
                  групи –{" "}
                  <span className="font-medium text-white">
                    деца, юноши, възрастни и ветерани
                  </span>
                  . Гордеем се с нашата общност, която не спира да расте и да
                  постига спортни върхове.
                </p>
              </div>
            </motion.div>

            {/* Card 2: Mission */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="group/card relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/60 bg-black/40 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/60 hover:bg-zinc-950/70 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] sm:rounded-3xl sm:p-6"
            >
              <div className="pointer-events-none absolute top-0 right-0 size-48 rounded-full bg-indigo-400/5 blur-[60px] transition-all duration-500 group-hover/card:bg-indigo-400/20 group-hover/card:scale-125" />

              <div className="relative z-10 flex flex-col space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-2 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)] transition-all duration-300 group-hover/card:border-blue-400 group-hover/card:bg-blue-600 group-hover/card:text-white group-hover/card:shadow-[0_0_20px_rgba(59,130,246,0.5)] sm:size-11">
                    <Target size={20} />
                  </div>
                  <h3 className="text-xs font-bold tracking-widest text-white uppercase sm:text-sm">
                    Нашата Мисия
                  </h3>
                </div>

                <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                  Извън спортните постижения, нашата най-важна мисия е да държим
                  младото поколение активно и здраво. Чрез бадминтона
                  осигуряваме сигурна среда за децата – далеч от застоялия живот
                  пред телефоните, затлъстяването и пороците на съвременното
                  общество (като алкохол и наркотици). Вярваме, че спортът
                  изгражда физическа дисциплина, възпитава характер, борбеност и
                  екипен дух.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section
        id="activities"
        className="relative scroll-mt-14 px-4 py-5 sm:scroll-mt-16 sm:p-6"
      >
        {/* Glow effect */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[800px] -translate-1/2 rounded-full bg-indigo-500/5 blur-[120px]" />

        <div className="relative z-10 m-auto max-w-5xl">
          <div className="mb-4 text-center sm:mb-5">
            <h2 className="text-2xl font-light tracking-tight sm:text-3xl">
              Нашите Дейности
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2">
            {activities.map((act, i) => (
              <motion.div
                key={act.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group/item relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/60 bg-black/40 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/60 hover:bg-zinc-950/70 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] sm:p-5"
              >
                <div className="pointer-events-none absolute top-0 right-0 size-48 rounded-full bg-blue-400/5 blur-[60px] transition-all duration-500 group-hover/item:bg-blue-400/20 group-hover/item:scale-125" />

                <div className="relative z-10 flex items-start gap-3 sm:gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/80 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.1)] transition-all duration-500 group-hover/item:border-blue-400 group-hover/item:bg-blue-600 group-hover/item:text-white group-hover/item:shadow-[0_0_20px_rgba(59,130,246,0.5)] sm:size-11">
                    <act.icon size={20} />
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-bold tracking-wide text-white sm:text-base">
                      {act.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                      {act.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Call to Action */}
      <section className="relative px-4 py-5 sm:p-6">
        {/* Glow effect */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[800px] -translate-1/2 rounded-full bg-blue-500/5 blur-[120px]" />

        <div className="relative z-10 m-auto max-w-4xl text-center">
          <p className="mb-1 text-[10px] font-bold tracking-[0.4em] text-blue-400 uppercase drop-shadow-[0_0_8px_rgba(30,58,138,0.8)] sm:text-[11px]">
            Каталог
          </p>
          <h2 className="mb-4 text-2xl font-light tracking-tight sm:text-3xl md:mb-6">
            Нашите Услуги и Тренировки
          </h2>

          <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-black/40 p-4 shadow-xl backdrop-blur-xl transition-colors duration-700 hover:border-zinc-700/80 sm:rounded-3xl sm:p-6 md:p-7">
            <div className="pointer-events-none absolute top-0 left-0 size-64 rounded-full bg-blue-400/5 blur-[80px] transition-colors duration-700 group-hover:bg-blue-400/10" />

            <div className="relative z-10 flex flex-col items-center">
              <p className="m-auto mb-5 max-w-2xl text-xs font-light leading-relaxed text-zinc-300 sm:text-sm md:mb-6 md:text-base">
                Разгледайте пълния списък с предлагани групови и индивидуални
                тренировки, наеми на кортове, абонаменти, спортна екипировка и
                възстановяване.
              </p>

              <Link
                href="/club/catalog"
                className="group/btn inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold tracking-widest text-white uppercase shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-0.5 hover:bg-blue-500 sm:gap-3 sm:rounded-2xl sm:px-8 sm:py-3 sm:text-xs"
              >
                Разгледай нашите услуги
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover/btn:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule & Tournaments */}
      <section
        id="schedule"
        className="relative scroll-mt-14 px-4 py-5 sm:scroll-mt-16 sm:p-6"
      >
        <div
          id="tournaments"
          className="pointer-events-none relative -top-28"
        />
        <div className="pointer-events-none absolute top-1/2 right-0 size-[500px] translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="relative z-10 m-auto max-w-4xl">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:mb-5 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-light tracking-tight sm:text-3xl">
                {getHeaderInfo().title}
              </h2>
              <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                {getHeaderInfo().subtitle}
              </p>
            </div>
            <Link
              href={
                activeTab === "all"
                  ? "/club/schedule"
                  : `/club/schedule?tab=${activeTab}`
              }
              className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-blue-400 uppercase transition-colors hover:text-blue-300 hover:drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]"
            >
              Пълен Календар <ArrowRight size={14} />
            </Link>
          </div>

          {/* Segmented Filter Switcher */}
          <div className="mb-4 flex items-center sm:mb-5">
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-800/80 bg-black/60 p-1 shadow-lg backdrop-blur-xl sm:rounded-2xl sm:p-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all duration-300 sm:rounded-xl sm:px-3.5 sm:py-2 ${
                  activeTab === "all"
                    ? "bg-zinc-100 text-zinc-950 shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>Всички</span>
                <span
                  className={`py-0.2 rounded-full px-1.5 text-[10px] font-extrabold ${
                    activeTab === "all"
                      ? "bg-zinc-300 text-zinc-900"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {next7DaysEvents.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("trainings")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all duration-300 sm:rounded-xl sm:px-3.5 sm:py-2 ${
                  activeTab === "trainings"
                    ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>🏸 Тренировки</span>
                <span
                  className={`py-0.2 rounded-full px-1.5 text-[10px] font-extrabold ${
                    activeTab === "trainings"
                      ? "bg-white/20 text-white"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {trainingsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tournaments")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all duration-300 sm:rounded-xl sm:px-3.5 sm:py-2 ${
                  activeTab === "tournaments"
                    ? "bg-amber-500 font-black text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>🏆 Състезания</span>
                <span
                  className={`py-0.2 rounded-full px-1.5 text-[10px] font-extrabold ${
                    activeTab === "tournaments"
                      ? "bg-zinc-950/20 font-black text-zinc-950"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {tournamentsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("events")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all duration-300 sm:rounded-xl sm:px-3.5 sm:py-2 ${
                  activeTab === "events"
                    ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>⛺ Лагери</span>
                <span
                  className={`py-0.2 rounded-full px-1.5 text-[10px] font-extrabold ${
                    activeTab === "events"
                      ? "bg-white/20 text-white"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {eventsCount}
                </span>
              </button>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-black/40 p-4 backdrop-blur-xl transition-colors duration-700 hover:border-zinc-700/80 sm:rounded-3xl sm:p-5 md:p-6">
            <div className="pointer-events-none absolute right-0 bottom-0 size-64 rounded-full bg-indigo-500/5 blur-[80px] transition-colors duration-700 group-hover:bg-indigo-400/10" />

            <div className="relative z-10">
              {displayedEvents.length > 0 ? (
                <div className="space-y-6 md:space-y-8">
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
                    {getEmptyState().title}
                  </p>
                  <p className="text-md mt-2 text-zinc-500">
                    {getEmptyState().subtitle}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contacts, Hall & Location */}
      <section
        id="contacts"
        className="relative scroll-mt-14 px-4 py-5 sm:scroll-mt-16 sm:p-6"
      >
        <div id="hall" className="pointer-events-none relative -top-28" />
        {/* Glow effect */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[800px] -translate-1/2 rounded-full bg-blue-500/5 blur-[120px]" />

        <div className="relative z-10 m-auto max-w-5xl">
          <div className="mb-4 text-center sm:mb-5">
            <p className="mb-1 text-[10px] font-bold tracking-[0.4em] text-blue-400 uppercase drop-shadow-[0_0_8px_rgba(30,58,138,0.8)] sm:text-[11px]">
              Спортна База & Контакти
            </p>
            <h2 className="text-2xl font-light tracking-tight sm:text-3xl">
              Къде тренираме и Контакти
            </h2>
          </div>

          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Card: Facilities & Training Venue */}
            <div className="group/card relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-black/40 p-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] sm:rounded-3xl sm:p-6 md:p-7">
              <div className="pointer-events-none absolute top-0 right-0 size-64 rounded-full bg-blue-400/5 blur-[80px] transition-colors duration-700 group-hover/card:bg-blue-400/10" />

              <div className="relative z-10 grid grid-cols-1 items-center gap-5 md:grid-cols-2 md:gap-7">
                <div className="text-center md:text-left">
                  <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
                    <div className="flex size-7 items-center justify-center rounded-lg border border-blue-400/30 bg-blue-500/10 text-blue-400">
                      <Trophy size={14} />
                    </div>
                    <h3 className="text-xs font-bold tracking-widest text-white uppercase sm:text-sm">
                      Къде тренираме
                    </h3>
                  </div>
                  <p className="mb-3 text-xs font-light leading-relaxed text-zinc-300 sm:mb-4 sm:text-sm">
                    Разполагаме със съвременна и напълно оборудвана спортна
                    база.{" "}
                    <strong className="font-semibold text-white">
                      Спортна зала „Енергетик“
                    </strong>{" "}
                    предлага:
                  </p>
                  <ul className="mx-auto max-w-lg space-y-2 text-left md:mx-0 sm:space-y-2.5">
                    {[
                      "6 изцяло оборудвани корта за бадминтон",
                      "Трибуни за състезатели и зрители",
                      "Модерна конферентна зала",
                      "Просторни съблекални",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <div className="flex size-4.5 shrink-0 items-center justify-center rounded-full border border-blue-400/40 bg-blue-400/10">
                          <div className="size-1.5 rounded-full bg-blue-400" />
                        </div>
                        <span className="text-xs font-medium text-zinc-300 sm:text-sm">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Carousel inside the card */}
                <div className="group/carousel relative aspect-video overflow-hidden rounded-xl border border-zinc-800/80 bg-black/60 shadow-xl sm:rounded-2xl">
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
                        priority
                        sizes="(max-width: 768px) 100vw, 500px"
                        className="aspect-video object-cover"
                        style={{ aspectRatio: "16 / 9" }}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Controls */}
                  <div className="absolute inset-0 flex items-center justify-between p-3 opacity-0 transition-opacity duration-300 group-hover/carousel:opacity-100">
                    <button
                      onClick={prevImage}
                      aria-label="Предишна снимка"
                      className="flex size-8 items-center justify-center rounded-full border border-blue-400/50 bg-black/70 text-blue-400 shadow-[0_0_12px_rgba(30,58,138,0.5)] backdrop-blur-md transition-all hover:bg-blue-400 hover:text-white sm:size-9"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={nextImage}
                      aria-label="Следваща снимка"
                      className="flex size-8 items-center justify-center rounded-full border border-blue-400/50 bg-black/70 text-blue-400 shadow-[0_0_12px_rgba(30,58,138,0.5)] backdrop-blur-md transition-all hover:bg-blue-400 hover:text-white sm:size-9"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* Indicators */}
                  <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
                    {hallImages.map((_, i) => (
                      <button
                        key={i}
                        aria-label={`Отиди на снимка ${i + 1}`}
                        onClick={() => setActiveImage(i)}
                        className="group/btn touch-manipulation p-1"
                      >
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 group-hover/btn:bg-white/90 ${i === activeImage ? "w-6 bg-blue-400 shadow-[0_0_8px_rgba(30,58,138,0.9)]" : "w-1.5 bg-white/70"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:gap-5">
              {/* Card 1: Contact Information */}
              <div className="group/card relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/60 bg-black/40 p-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] sm:rounded-3xl sm:p-5">
                <div className="pointer-events-none absolute top-0 right-0 size-48 rounded-full bg-blue-400/5 blur-[60px] transition-all duration-500 group-hover/card:bg-blue-400/15" />

                <div className="relative z-10 flex h-full flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 transition-colors hover:border-blue-400/40 sm:p-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-400/10 text-blue-400 sm:size-10 sm:rounded-xl">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="mb-0.5 text-xs font-medium text-white sm:text-sm">
                        Спортна база / Място на тренировките
                      </p>
                      <p className="text-xs leading-relaxed text-zinc-400">
                        {clubSite?.address ||
                          "Спортна зала „Енергетик“, ул. „Александър Стамболийски“ 41, гр. Гълъбово"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 transition-colors hover:border-blue-400/40 sm:p-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-400/10 text-blue-400 sm:size-10 sm:rounded-xl">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="mb-0.5 text-xs font-medium text-white sm:text-sm">
                        Телефон за връзка
                      </p>
                      <p className="text-[11px] text-zinc-400 sm:text-xs">
                        Официален телефон
                      </p>
                      <a
                        href={`tel:${clubSite?.phone || "+359899829923"}`}
                        className="mt-0.5 inline-block text-sm font-bold text-blue-400 hover:underline sm:text-base"
                      >
                        {clubSite?.phone || "+359 899 82 99 23"}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 transition-colors hover:border-blue-400/40 sm:p-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-400/10 text-blue-400 sm:size-10 sm:rounded-xl">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="mb-0.5 text-xs font-medium text-white sm:text-sm">
                        Имейл
                      </p>
                      <a
                        href={`mailto:${clubSite?.email || "bk_galabovo@abv.bg"}`}
                        className="text-xs break-all text-zinc-400 transition-colors hover:text-blue-400 sm:text-sm"
                      >
                        {clubSite?.email || "bk_galabovo@abv.bg"}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Google Maps Location */}
              <div className="group/card relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/60 bg-black/40 p-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] sm:rounded-3xl sm:p-5">
                <div className="pointer-events-none absolute top-0 right-0 size-48 rounded-full bg-blue-400/5 blur-[60px] transition-all duration-500 group-hover/card:bg-blue-400/15" />

                <div className="relative z-10 flex h-full flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg border border-blue-400/30 bg-blue-500/10 text-blue-400">
                        <Navigation size={14} />
                      </div>
                      <h3 className="text-xs font-bold tracking-widest text-white uppercase sm:text-sm">
                        Google Maps Локация
                      </h3>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                      42.1428° N, 25.8680° E
                    </span>
                  </div>

                  {/* Interactive Google Map Embed (Lazy Loaded) */}
                  <div
                    ref={mapRef}
                    className="relative h-36 w-full overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/70 shadow-inner sm:h-40"
                  >
                    {isMapVisible ? (
                      <iframe
                        title="Google Maps - Бадминтон Клуб Гълъбово"
                        src="https://maps.google.com/maps?q=42.1427576,25.8680232&hl=bg&z=17&output=embed"
                        className="size-full border-0 contrast-105"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-zinc-900/40">
                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                          <MapPin size={14} className="text-blue-500" />
                          <span>Локация: Спортна зала „Енергетик“</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Address info and Navigation Button */}
                  <div className="flex flex-col justify-between gap-2.5 pt-1 sm:flex-row sm:items-center">
                    <div className="text-left">
                      <p className="text-xs font-semibold text-white">
                        Бадминтон Клуб Гълъбово
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Спортна зала „Енергетик“, ул. „Ал. Стамболийски“ 41
                      </p>
                    </div>

                    <a
                      href="https://www.google.com/maps/place/%D0%91%D0%B0%D0%B4%D0%BC%D0%B8%D0%BD%D1%82%D0%BE%D0%BD+%D0%9A%D0%BB%D1%83%D0%B1+%D0%93%D1%8A%D0%BB%D1%8A%D0%B1%D0%BE%D0%B2%D0%BE/@42.1427576,25.8680232,19z"
                      target="_blank"
                      rel="noreferrer"
                      className="group/btn inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-600/20 px-3.5 py-2 text-xs font-bold text-blue-300 transition-all hover:border-blue-400 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                    >
                      <MapPin
                        size={13}
                        className="text-blue-400 group-hover/btn:text-white"
                      />
                      <span>Навигация</span>
                      <ExternalLink
                        size={12}
                        className="opacity-70 group-hover/btn:opacity-100"
                      />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Channels Card */}
            <div className="group/card relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-black/40 p-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-zinc-700/80 sm:rounded-3xl sm:p-5">
              <div className="pointer-events-none absolute top-0 right-0 size-64 rounded-full bg-blue-400/5 blur-[80px] transition-colors duration-700 group-hover/card:bg-blue-400/10" />

              <div className="relative z-10 mb-3 flex flex-col justify-between gap-1.5 sm:mb-3.5 sm:flex-row sm:items-center">
                <h3 className="text-xs font-bold tracking-widest text-white uppercase sm:text-sm">
                  Последвайте ни в социалните мрежи
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Официални клубни канали
                </span>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                <a
                  href={
                    clubSite?.facebook ||
                    "https://www.facebook.com/badmintongalabovo/"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="group/social flex items-center gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-2.5 transition-all hover:border-blue-500 hover:bg-black hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] sm:rounded-2xl sm:p-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors group-hover/social:border-blue-500/30 group-hover/social:bg-blue-500/10 group-hover/social:text-blue-500 sm:size-9">
                    <FacebookIcon size={16} />
                  </div>
                  <span className="text-xs font-medium text-zinc-300 transition-colors group-hover/social:text-white">
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
                  className="group/social flex items-center gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-2.5 transition-all hover:border-blue-400 hover:bg-black hover:shadow-[0_0_15px_rgba(96,165,250,0.3)] sm:rounded-2xl sm:p-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors group-hover/social:border-blue-400/30 group-hover/social:bg-blue-400/10 group-hover/social:text-blue-400 sm:size-9">
                    <Users size={16} />
                  </div>
                  <span className="text-xs font-medium text-zinc-300 transition-colors group-hover/social:text-white">
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
                  className="group/social flex items-center gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-2.5 transition-all hover:border-pink-500 hover:bg-black hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] sm:rounded-2xl sm:p-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors group-hover/social:border-pink-500/30 group-hover/social:bg-pink-500/10 group-hover/social:text-pink-500 sm:size-9">
                    <InstagramIcon size={16} />
                  </div>
                  <span className="text-xs font-medium text-zinc-300 transition-colors group-hover/social:text-white">
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
                  className="group/social flex items-center gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-2.5 transition-all hover:border-red-500 hover:bg-black hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] sm:rounded-2xl sm:p-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors group-hover/social:border-red-500/30 group-hover/social:bg-red-500/10 group-hover/social:text-red-500 sm:size-9">
                    <YoutubeIcon size={16} />
                  </div>
                  <span className="text-xs font-medium text-zinc-300 transition-colors group-hover/social:text-white">
                    YouTube
                  </span>
                </a>
              </div>
            </div>

            {/* Instagram Feed Widget (Lazy Loaded) */}
            <div
              ref={widgetRef}
              className="relative z-10 min-h-60 w-full overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/50 sm:rounded-3xl"
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
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Callout Section */}
      <section className="relative px-4 py-5 sm:p-6">
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-linear-to-r from-blue-950/40 via-zinc-900/60 to-indigo-950/40 p-4 shadow-xl backdrop-blur-xl sm:rounded-3xl sm:p-6 md:p-7">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="flex items-center justify-center gap-1 text-amber-400 sm:justify-start">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-3.5 fill-amber-400 text-amber-400 sm:size-4"
                    />
                  ))}
                  <span className="ml-1.5 text-[11px] font-bold text-blue-300 sm:text-xs">
                    5.0 / 5.0 Оценка от родители
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  Какво споделят родителите и децата?
                </h3>
                <p className="max-w-xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
                  Прочетете реалните мнения и впечатления за летните лагери,
                  турнири и тренировъчния процес в БК Гълъбово.
                </p>
              </div>

              <Button
                asChild
                className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 sm:rounded-2xl sm:px-6 sm:py-3 sm:text-xs"
              >
                <Link href="/club/reviews" className="flex items-center gap-2">
                  <span>Вижте всички отзиви</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter clubSite={clubSite} />
    </main>
  );
}
