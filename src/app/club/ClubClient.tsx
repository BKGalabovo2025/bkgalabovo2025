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
  Menu,
  X,
} from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/icons/social-icons";
import { motion, AnimatePresence } from "framer-motion";
import { formatEventDateRange } from "@/lib/date-utils";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const EventCard = ({
    event,
    groupIdx,
    i,
  }: {
    event: EventSlot;
    groupIdx: number;
    i: number;
  }) => {
    const [expanded, setExpanded] = useState(false);

    const handlePrint = () => {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <html>
          <head>
            <title>Принтиране на събитие - ${event.title}</title>
            <style>
              body { font-family: sans-serif; padding: 2rem; color: #333; }
              h1 { color: #000; }
              .meta { color: #666; margin-bottom: 2rem; }
              .desc { white-space: pre-wrap; line-height: 1.6; }
            </style>
          </head>
          <body>
            <h1>${event.title}</h1>
            <div class="meta">
              <p><strong>Дата и час:</strong> ${formatEventDateRange(event.startTime, event.endTime)}</p>
              <p><strong>Локация:</strong> ${event.location || 'Спортна зала „Енергетик"'}</p>
            </div>
            <div class="desc">${event.description || "Няма допълнителна информация."}</div>
            <script>window.print(); window.setTimeout(() => window.close(), 500);</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    };

    const displayTime = formatEventDateRange(event.startTime, event.endTime);

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: groupIdx * 0.05 + i * 0.04 }}
        className={`group border rounded-2xl overflow-hidden transition-all duration-300 ${
          event.isCancelled
            ? "bg-black/40 border-rose-900/30 opacity-80"
            : "bg-black/70 border-zinc-800 hover:border-blue-700/50 hover:bg-black hover:shadow-[0_0_20px_rgba(30,58,138,0.12)]"
        }`}
      >
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-start gap-5">
            <div
              className={`w-1 h-12 mt-1 sm:mt-0 rounded-full shrink-0 ${event.isCancelled ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"}`}
            />
            <div>
              <div className="flex items-center gap-3">
                <p
                  className={`text-white font-bold text-base tracking-tight ${event.isCancelled ? "line-through text-zinc-400" : ""}`}
                >
                  {event.title}
                </p>
                {event.isCancelled && (
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-rose-500/20 text-rose-400 px-2.5 py-1 rounded-md border border-rose-500/30">
                    Отменена
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-zinc-300 text-[13px]">
                  <Clock size={14} className="text-blue-400" />
                  {displayTime}
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400 text-[13px]">
                  <MapPin size={14} className="text-blue-400" />
                  {event.location || 'Спортна зала „Енергетик"'}
                </span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4 sm:mt-0 ml-6 sm:ml-0">
            <button
              onClick={handlePrint}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-2"
              title="Принтирай"
            >
              <Printer size={18} />
            </button>

            {event.description && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-blue-400/80 hover:text-blue-300 text-[13px] font-medium transition-colors"
              >
                <Info size={16} />
                Бележка
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                />
              </button>
            )}

            {!event.isCancelled && (
              <Link
                href="/club#contacts"
                className="flex items-center gap-1.5 text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors group-hover:gap-2 ml-2"
              >
                Запиши се
                <ChevronRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            )}
          </div>
        </div>

        <AnimatePresence>
          {expanded && event.description && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-5 pt-2 ml-6 sm:ml-10">
                <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-900/20">
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden selection:bg-blue-400 selection:text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-blue-400/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 relative overflow-hidden rounded-lg bg-white/5 p-1 border border-blue-400/50 shadow-[0_0_10px_rgba(30,58,138,0.5)]">
              <Image
                src="/logo.png"
                alt="Logo"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <span className="font-medium text-sm text-white">БК ГЪЛЪБОВО</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            <a href="#about" className="hover:text-blue-400 transition-colors">
              За Клуба
            </a>
            <a
              href="#activities"
              className="hover:text-blue-400 transition-colors"
            >
              Дейности
            </a>
            <Link
              href="/club/catalog"
              className="hover:text-blue-400 transition-colors"
            >
              Услуги
            </Link>
            <a
              href="#schedule"
              className="hover:text-blue-400 transition-colors"
            >
              График
            </a>
            <a
              href="#contacts"
              className="hover:text-blue-400 transition-colors"
            >
              Контакти
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-medium uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              Портал
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-black/95 backdrop-blur-xl border-t border-blue-900/30 mt-4 -mx-6 px-6"
            >
              <div className="flex flex-col gap-6 py-6 text-sm font-bold uppercase tracking-widest text-zinc-300">
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-blue-400"
                >
                  За Клуба
                </a>
                <a
                  href="#activities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-blue-400"
                >
                  Дейности
                </a>
                <Link
                  href="/club/catalog"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-blue-400"
                >
                  Услуги
                </Link>
                <a
                  href="#schedule"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-blue-400"
                >
                  График
                </a>
                <a
                  href="#contacts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-blue-400"
                >
                  Контакти
                </a>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-zinc-500 hover:text-white pt-4 border-t border-blue-900/30"
                >
                  Обратно към Портала
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

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
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            СНЦ „Бадминтон клуб Гълъбово“ — официален бадминтон клуб в град
            Гълъбово. Тренировки, турнири и приятелска спортна атмосфера за
            всички.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="#contacts"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-blue-400 hover:bg-blue-600 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(30,58,138,0.6)] hover:shadow-[0_0_30px_rgba(30,58,138,0.9)] hover:-translate-y-1"
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
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4 drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]">
              За Клуба & Мисия
            </p>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight">
              Развитие и популяризиране на{" "}
              <span className="font-bold text-white">бадминтона</span> в
              Гълъбово
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* About text */}
            <div className="space-y-6">
              <p className="text-zinc-400 text-lg leading-relaxed">
                СНЦ „Бадминтон клуб Гълъбово“ е сдружение с нестопанска цел,
                създадено през 2014 г. Нашата основна цел е да създадем
                професионална и същевременно приятелска среда за развитие на
                този динамичен спорт.
              </p>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Клубът организира регулярни тренировки за всички възрастови
                групи – деца, юноши, възрастни и ветерани. Гордеем се с нашата
                общност, която не спира да расте и да постига спортни върхове.
              </p>
            </div>

            {/* Mission Card */}
            <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/10 border border-blue-500/20 p-8 md:p-10 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-400/20 transition-colors duration-700" />

              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                  <Target size={24} />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-white uppercase">
                  Мисия
                </h3>
              </div>

              <p className="text-zinc-300 text-md leading-relaxed relative z-10">
                Извън спортните постижения, нашата най-важна мисия е да държим
                младото поколение активно и здраво. Чрез бадминтона осигуряваме
                сигурна среда за децата – далеч от застоялия живот пред
                телефоните, затлъстяването и пороците на съвременното общество
                (като алкохол и наркотици). Вярваме, че спортът изгражда
                физическа дисциплина, възпитава характер, борбеност и екипен
                дух.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section id="activities" className="py-24 px-6 bg-black/40 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4">
              Официален Статус
            </p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight">
              Нашите Дейности
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activities.map((act, i) => (
              <motion.div
                key={act.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-black/80 border border-zinc-800 rounded-3xl p-8 hover:border-blue-400 hover:bg-black transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(30,58,138,0.15)] relative overflow-hidden glassmorphism"
              >
                <div className="absolute inset-0 bg-linear-to-br from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="h-14 w-14 bg-black border border-blue-400/30 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-400 group-hover:text-white transition-all duration-500 shadow-[0_0_10px_rgba(30,58,138,0.2)] group-hover:shadow-[0_0_20px_rgba(30,58,138,0.8)] relative z-10">
                  <act.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 relative z-10">
                  {act.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                  {act.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Call to Action */}
      <section className="py-32 px-6 bg-linear-to-b from-blue-950/20 to-zinc-950 relative overflow-hidden my-12 border-y border-blue-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10 bg-black/60 p-12 md:p-16 rounded-4xl border border-blue-400/20 backdrop-blur-xl shadow-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4 bg-blue-400/10 inline-block px-3 py-1 rounded-full">
            Каталог
          </p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-white uppercase">
            Нашите Услуги и Тренировки
          </h2>
          <p className="text-zinc-300 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
            Разгледайте пълния списък с предлагани групови и индивидуални
            тренировки, наеми на кортове, абонаменти, спортна екипировка и
            възстановяване.
          </p>
          <Link
            href="/club/catalog"
            className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-1 group"
          >
            Разгледай нашите услуги
            <ArrowRight
              size={20}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </section>

      {/* Schedule 7 days */}
      <section id="schedule" className="py-24 px-6 bg-zinc-950 relative">
        <div className="absolute right-0 top-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4">
                График
              </p>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight">
                Предстоящи Тренировки и Събития
              </h2>
              <p className="text-zinc-300 mt-2">През следващите 7 дни</p>
            </div>
            <Link
              href="/club/schedule"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-400 hover:text-blue-400 transition-colors hover:drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]"
            >
              Пълен Календар <ArrowRight size={16} />
            </Link>
          </div>

          <div className="bg-black/80 border border-zinc-800 rounded-3xl p-8 md:p-12 glassmorphism">
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
                      <div className="flex-1 h-px bg-zinc-800" />
                    </div>

                    {/* Events for this date */}
                    <div className="space-y-3">
                      {events.map((event, i) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          groupIdx={groupIdx}
                          i={i}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center">
                <CalendarDays size={48} className="text-zinc-800 mb-4" />
                <p className="text-zinc-300 text-lg">
                  Няма въведени тренировки за следващите 7 дни.
                </p>
                <p className="text-zinc-600 text-sm mt-2">
                  Очаквайте обновяване на седмичната програма.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Facilities Carousel */}
      <section className="py-24 px-6 bg-black/60 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4 drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]">
              База
            </p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
              Къде тренираме
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
              Разполагаме със съвременна и напълно оборудвана спортна база.{" "}
              <strong className="text-white">Спортна зала „Енергетик“</strong>{" "}
              предлага:
            </p>
            <ul className="space-y-4 mb-12">
              {[
                "6 изцяло оборудвани корта за бадминтон",
                "Трибуни за състезатели и зрители",
                "Модерна конферентна зала",
                "Просторни съблекални",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 shrink-0 h-5 w-5 rounded-full bg-blue-400/20 flex items-center justify-center border border-blue-400/50">
                    <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(30,58,138,0.8)]" />
                  </div>
                  <span className="text-zinc-300 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Carousel */}
          <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl group">
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
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
              {hallImages.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Отиди на снимка ${i + 1}`}
                  onClick={() => setActiveImage(i)}
                  className="p-3 touch-manipulation flex items-center justify-center group"
                >
                  <div
                    className={`h-2 transition-all duration-300 rounded-full group-hover:bg-white/60 ${i === activeImage ? "w-8 bg-blue-400 shadow-[0_0_8px_rgba(30,58,138,0.9)]" : "w-2 bg-white/30"}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contacts & Social */}
      <section id="contacts" className="py-24 px-6 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-16">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4">
                Свържете се с нас
              </p>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-8">
                Контакти и Локация
              </h2>

              <div className="space-y-6 mb-12">
                <div className="bg-black/80 border border-zinc-800 p-6 rounded-2xl flex items-start gap-4 hover:border-blue-400/50 transition-colors">
                  <div className="h-10 w-10 bg-blue-400/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">
                      Спортна база / Място на тренировките
                    </p>
                    <p className="text-zinc-400 text-sm">
                      {clubSite?.address ||
                        "Спортна зала „Енергетик“, ул. „Александър Стамболийски“ 41"}
                    </p>
                  </div>
                </div>

                <div className="bg-black/80 border border-zinc-800 p-6 rounded-2xl flex items-start gap-4 hover:border-blue-400/50 transition-colors">
                  <div className="h-10 w-10 bg-blue-400/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">
                      Телефон за връзка
                    </p>
                    <p className="text-zinc-400 text-sm">Официален телефон</p>
                    <a
                      href={`tel:${clubSite?.phone || "+359899829923"}`}
                      className="text-blue-400 font-bold mt-1 inline-block hover:underline"
                    >
                      {clubSite?.phone || "+359 899 82 99 23"}
                    </a>
                  </div>
                </div>

                <div className="bg-black/80 border border-zinc-800 p-6 rounded-2xl flex items-start gap-4 hover:border-blue-400/50 transition-colors">
                  <div className="h-10 w-10 bg-blue-400/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <Mail size={20} />
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

            <div className="bg-black/80 border border-zinc-800 rounded-3xl p-6 md:p-10 flex flex-col justify-center relative overflow-hidden glassmorphism">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-[80px] pointer-events-none" />
              <h3 className="text-2xl font-light text-white mb-8 relative z-10">
                Последвайте ни в мрежите
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                {clubSite?.facebook && (
                  <a
                    href={clubSite.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-blue-500 hover:bg-black transition-all group shadow-none hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  >
                    <div className="text-zinc-300 group-hover:text-blue-500 transition-colors">
                      <FacebookIcon size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">
                      Facebook Страница
                    </span>
                  </a>
                )}
                {clubSite?.facebookGroup && (
                  <a
                    href={clubSite.facebookGroup}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-blue-400 hover:bg-black transition-all group shadow-none hover:shadow-[0_0_15px_rgba(96,165,250,0.3)]"
                  >
                    <div className="text-zinc-300 group-hover:text-blue-400 transition-colors">
                      <Users size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">
                      Facebook Група
                    </span>
                  </a>
                )}
                {clubSite?.instagram && (
                  <a
                    href={clubSite.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-pink-500 hover:bg-black transition-all group shadow-none hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                  >
                    <div className="text-zinc-300 group-hover:text-pink-500 transition-colors">
                      <InstagramIcon size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">
                      Instagram
                    </span>
                  </a>
                )}
                {clubSite?.youtube && (
                  <a
                    href={clubSite.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-red-500 hover:bg-black transition-all group shadow-none hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  >
                    <div className="text-zinc-300 group-hover:text-red-500 transition-colors">
                      <YoutubeIcon size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">
                      YouTube
                    </span>
                  </a>
                )}

                {!clubSite?.facebook &&
                  !clubSite?.facebookGroup &&
                  !clubSite?.instagram &&
                  !clubSite?.youtube && (
                    <p className="text-zinc-500 text-sm col-span-2 text-center py-4">
                      Очаквайте скоро нашите социални мрежи.
                    </p>
                  )}
              </div>

              {/* Instagram Feed Widget (Lazy Loaded) */}
              <div
                ref={widgetRef}
                className="mt-8 overflow-hidden rounded-2xl relative w-full min-h-[400px]"
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
      <footer className="px-8 py-8 border-t border-zinc-900 bg-black flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-blue-400 rounded-xl flex items-center justify-center">
            <Trophy size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-zinc-400 uppercase">
            СНЦ „Бадминтон Клуб Гълъбово“
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          © {new Date().getFullYear()} Всички права запазени
        </span>
      </footer>
    </div>
  );
}
