import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SessionsSection } from "@/components/recovery/SessionsSection";
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
  Waves,
  MapPin,
  Clock,
  Package,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Recovery Zone by ZM | Професионален Лимфен Дренаж",
  description:
    "Възстановете се по-бързо с най-съвременните технологии Hyperice Normatec 3. Професионален лимфен дренаж в София.",
};

const benefits = [
  {
    icon: Wind,
    title: "Ускорен дренаж",
    desc: "Ефективно изчистване на метаболитните отпадъци и натрупаната умора в мускулите.",
  },
  {
    icon: Heart,
    title: "Подобрена циркулация",
    desc: "Стимулира притока на кислород и хранителни вещества до тъканите за по-бързо регенериране.",
  },
  {
    icon: ShieldCheck,
    title: "Превенция на контузии",
    desc: "Поддържа еластичността на мускулатурата и намалява сковаността след натоварване.",
  },
  {
    icon: Flame,
    title: "Пълна релаксация",
    desc: "Успокоява тялото и ума, подобрявайки качеството на Вашата почивка и сън.",
  },
];

const attachments = [
  {
    name: "Приставки за КРАКА",
    image: "/legs.webp",
    desc: "Основата на всяко пълноценно възстановяване. Обхваща целите крака – от стъпалата и глезените през прасците до бедрата.",
    points: [
      "Ефективна при „тежки крака“",
      "Бързо изчистване след мач/тренировка",
      "Намалява отоците от стоене прав",
    ],
  },
  {
    name: "Приставка за ТАЗ",
    image: "/pelvis.webp",
    desc: "Ключова зона за мобилността. Обхваща долната част на гърба, таза и седалищните мускули.",
    points: [
      "Облекчава напрежението в кръста",
      "Отпуска стегнатите тъкани",
      "Подобрява обхвата на движение",
    ],
  },
  {
    name: "Приставки за РЪЦЕ",
    image: "/arm.png",
    desc: "Цялостно възстановяване за горната част на тялото. Обхваща китките, предмишниците, бицепсите и раменете.",
    points: [
      "Намалява умората от мишка/клавиатура",
      "Незаменима за тенисисти и плувци",
      "Облекчава ставите при стрес",
    ],
  },
];

const contraindications = [
  "Остра дълбока венозна тромбоза (ДВТ) или история на кръвни съсиреци",
  "Тежка сърдечно-съдова недостатъчност или сериозни сърдечни заболявания",
  "Белодробен едем (вода в белите дробове)",
  "Активни инфекции или възпаления в зоните на приложение",
  "Налични фрактури или тежки травми, които не са напълно зараснали",
  "Злокачествени заболявания (тумори) в областта на компресията",
  "Бременност (за приставката за Таз) - консултация с лекар за крака/ръце",
  "Силно изразени разширени вени с рани или чувствителна кожа",
];

const equipment = [
  { name: "2 Компресора", desc: "Професионални системи Normatec 3" },
  { name: "2 Приставки за крака", desc: "Комплекти ляв + десен крак" },
  { name: "1 Приставка за ръце", desc: "Лява + дясна (заедно или поотделно)" },
  { name: "1 Приставка за таз", desc: "За ядрото и мобилността" },
  { name: "2 Шезлонга & Масички", desc: "Пълен комфорт по време на сесия" },
  { name: "Разтегателно легло", desc: "За таз или специфични нужди" },
  { name: "Индивидуални подложки", desc: "Максимална хигиена за всеки клиент" },
  { name: "Вода - комплимент", desc: "Хидратация за по-добър дренаж" },
];

export default function RecoveryZonePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30 selection:text-emerald-200 scroll-smooth">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Portal
        </Link>

        <div className="flex items-center gap-4">
          <div className="h-14 w-14 relative overflow-hidden rounded-xl bg-white/5 p-1 shadow-lg shadow-emerald-500/10 transition-transform hover:scale-110">
            <Image
              src="/RECOVERY%20ZM%20ZONE%20BADMINTON.png"
              alt="Recovery Zone Logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="hidden sm:flex flex-col border-l border-white/10 pl-5">
            <span className="font-bold text-xs tracking-[0.2em] uppercase text-emerald-500">
              Recovery Zone
            </span>
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.3em]">
              by ZM
            </span>
          </div>
        </div>

        <a
          href="#contact"
          className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
        >
          ЗАПАЗИ ЧАС
        </a>
      </nav>

      {/* Hero Section as a Super Card */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative group">
          {/* Main Card Container */}
          <div className="relative min-h-[80vh] rounded-6xl border border-white/5 overflow-hidden flex flex-col justify-end p-10 md:p-20 shadow-2xl shadow-emerald-500/10 bg-zinc-900/50 backdrop-blur-sm">
            {/* Background Layer (Clean & Minimal) */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-radial-[at_50%_50%] from-emerald-500/10 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 max-w-4xl space-y-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-bold uppercase tracking-[0.3em]">
                <Activity size={12} className="animate-pulse" />
                Твоят личен рестарт
              </div>

              <div className="space-y-10">
                <div className="h-1.5 w-24 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />

                <div className="space-y-6">
                  <h1 className="text-5xl md:text-8xl font-light tracking-tight leading-[0.9] text-white">
                    Recovery Zone <br />
                    <span className="text-emerald-400 font-medium">by ZM</span>
                  </h1>
                  <p className="text-zinc-300 text-lg md:text-2xl max-w-2xl leading-relaxed font-light italic">
                    Професионалната зона за възстановяване, оборудвана с
                    лидерите в света на лимфния дренаж —{" "}
                    <span className="text-white font-medium italic-none">
                      Normatec 3 от Hyperice
                    </span>
                    .
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-5 pt-4">
                <a
                  href="#contact"
                  className="flex items-center gap-3 px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-xl shadow-emerald-500/20 group/btn"
                >
                  ЗАПАЗИ ЧАС{" "}
                  <ArrowLeft
                    size={16}
                    className="rotate-180 group-hover/btn:translate-x-1 transition-transform"
                  />
                </a>
                <a
                  href="#technology"
                  className="flex items-center gap-3 px-10 py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-sm font-bold transition-all border border-white/5 backdrop-blur-md"
                >
                  НАУЧИ ПОВЕЧЕ <ChevronDown size={16} />
                </a>
              </div>
            </div>
          </div>

          {/* Decorative Glows */}
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
        </div>
      </section>

      {/* Intro Tech Section */}
      <section id="technology" className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="aspect-square rounded-6xl bg-zinc-900 border border-white/5 overflow-hidden relative group">
                <Image
                  src="/recovery-hero.png"
                  alt="Normatec 3 Technology"
                  fill
                  className="object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10 right-10">
                  <div className="h-1 w-20 bg-emerald-500 mb-6" />
                  <h3 className="text-2xl font-light mb-4">Pulse Технология</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Патентована система за динамична въздушна компресия, която
                    имитира естествената работа на мускулите.
                  </p>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full" />
            </div>

            <div className="space-y-10">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 mb-4 font-bold">
                  Технологията
                </p>
                <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-tight mb-8">
                  Защо да изберете <br />
                  <span className="text-emerald-400">Normatec 3?</span>
                </h2>
                <p className="text-zinc-400 text-lg leading-relaxed font-light">
                  Системата активира естествените процеси в тялото, като
                  ускорява движението на течностите и подпомага тъканите да се
                  регенерират по-ефективно.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {benefits.map((b) => (
                  <div key={b.title} className="space-y-4 group">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <b.icon size={18} />
                    </div>
                    <h4 className="text-sm font-bold tracking-wider uppercase text-zinc-200">
                      {b.title}
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-light">
                      {b.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Attachments Section */}
      <section className="py-32 px-6 bg-zinc-900/20 relative border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 mb-4 font-bold">
              Зони на въздействие
            </p>
            <h2 className="text-4xl md:text-6xl font-light tracking-tight">
              Специализирани <span className="text-zinc-500">приставки</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {attachments.map((a) => (
              <div
                key={a.name}
                className="bg-zinc-900 border border-white/5 rounded-5xl overflow-hidden hover:border-emerald-500/30 transition-all duration-500 group flex flex-col"
              >
                <div className="h-64 relative overflow-hidden bg-zinc-800">
                  <Image
                    src={a.image}
                    alt={a.name}
                    fill
                    className="object-cover opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all duration-1000"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                  <div className="absolute bottom-6 left-8">
                    <h3 className="text-xl font-medium text-white">{a.name}</h3>
                  </div>
                </div>

                <div className="p-8 grow flex flex-col">
                  <p className="text-zinc-500 text-xs leading-relaxed mb-8 font-light italic">
                    {a.desc}
                  </p>
                  <ul className="space-y-4 mt-auto">
                    {a.points.map((p, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-[11px] text-zinc-400 group-hover:text-zinc-200 transition-colors"
                      >
                        <Check
                          size={14}
                          className="text-emerald-500 shrink-0 mt-0.5"
                        />
                        <span className="font-light">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Sessions */}
      <SessionsSection />

      {/* Events & Partnership Section */}
      <section className="py-32 px-6 relative bg-zinc-900/40 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 mb-6 font-bold">
                Събития & Партньорство
              </p>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-tight mb-8">
                Ние идваме <br />
                <span className="text-emerald-400">при Вас!</span>
              </h2>
              <div className="space-y-6 text-zinc-400 text-sm font-light leading-relaxed">
                <p>
                  Посещаваме турнирите от{" "}
                  <span className="text-white font-medium">
                    Национална верига по Бадминтон
                  </span>{" "}
                  и обслужваме клиенти в базата на{" "}
                  <span className="text-white font-medium">
                    Бадминтон клуб Гълъбово
                  </span>
                  .
                </p>
                <p>
                  Можем да присъстваме и на Вашето спортно събитие! Ако искате
                  да осигурите професионално възстановяване за Вашите
                  състезатели, свържете се с нас.
                </p>
              </div>

              <div className="mt-12">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-bold transition-all border border-white/5"
                >
                  Търсите партньорство?{" "}
                  <ArrowLeft size={16} className="rotate-180" />
                </a>
              </div>
            </div>

            <div className="bg-zinc-950/60 rounded-6xl border border-white/5 p-10 md:p-12">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-200 mb-8 flex items-center gap-3">
                <Package size={18} className="text-emerald-500" /> Цялостно
                оборудване
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {equipment.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <p className="text-[11px] font-bold text-zinc-100">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-8 border-t border-white/5">
                <p className="text-[10px] text-zinc-500 italic leading-relaxed">
                  * Разполагаме с рекламни материали, ценови листи,
                  информационни табели и всичко необходимо за професионално
                  представяне на Вашето събитие.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preparation Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-6xl p-12 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 mb-6 font-bold">
                  Подготовка
                </p>
                <h2 className="text-4xl font-light tracking-tight mb-8 leading-tight">
                  Какво да очаквате <br />
                  <span className="text-zinc-500">и как да се облечете?</span>
                </h2>
                <div className="space-y-8">
                  <div className="flex gap-6 items-start">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Waves size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-2">
                        Усещане
                      </h4>
                      <p className="text-xs text-zinc-500 leading-relaxed font-light">
                        Като дълбок, приятен масаж чрез вълни от въздушна
                        компресия. Интензивността е напълно контролируема според
                        вашия комфорт.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-2">
                        Облекло
                      </h4>
                      <p className="text-xs text-zinc-500 leading-relaxed font-light">
                        Препоръчваме чист спортен екип — клин, дълги чорапи,
                        долнище на анцуг или тениска с дълъг ръкав.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950/40 backdrop-blur-sm border border-white/5 rounded-3xl p-8 md:p-10">
                <div className="flex items-center gap-3 text-amber-500 mb-6">
                  <Info size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Важно
                  </span>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed font-light mb-6">
                  Избягвайте дънки, твърди материи, дрехи с остри ципове или
                  обемни бижута. Те могат да бъдат неудобни под налягане и да
                  повредят маншетите.
                </p>
                <div className="h-px bg-white/5 my-8" />
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest leading-loose">
                  * Ние осигуряваме всичко необходимо за вашето удобство по
                  време на сесията.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety / Contraindications */}
      <section className="py-32 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] uppercase tracking-[0.4em] text-amber-500 mb-4 font-bold">
              Безопасност
            </p>
            <h2 className="text-4xl font-light tracking-tight">
              Противопоказания
            </h2>
            <p className="mt-4 text-zinc-500 text-sm font-light">
              Моля, запознайте се с условията, при които употребата на Normatec
              3 не се препоръчва.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
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
                      href="mailto:recoveryzonebyzm@gmail.com"
                      className="text-lg font-medium text-zinc-200 hover:text-emerald-400 transition-colors"
                    >
                      recoveryzonebyzm@gmail.com
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
                      <p className="text-sm font-medium">
                        Пон – Пет: 09:00 – 20:00
                      </p>
                      <p className="text-sm font-medium">
                        Съб – Нед: 10:00 – 18:00
                      </p>
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
                      България
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
                  href="mailto:recoveryzonebyzm@gmail.com"
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
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
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
                Recovery Zone
              </span>
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                by ZM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-8 text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-700">
            <span>България</span>
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
