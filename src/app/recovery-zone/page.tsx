import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  ArrowLeft,
  Check,
  Clock,
  Mail,
  ChevronDown,
  Wind,
  Zap,
  Heart,
  Flame,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Recovery Zone by ZM | Професионален Лимфен Дренаж",
  description:
    "Възстановете се по-бързо с най-съвременните технологии Hyperice Normatec 3. Професионален лимфен дренаж в София.",
};

const benefits = [
  {
    icon: Zap,
    title: "Ускорено възстановяване",
    desc: "Намалява времето за почивка между тренировките. Видими резултати след първата сесия.",
  },
  {
    icon: Heart,
    title: "Подобрено кръвообращение",
    desc: "Стимулира лимфната система и притока на кислород до мускулите.",
  },
  {
    icon: Wind,
    title: "Намалява възпаленията",
    desc: "Помага за по-бързото отшумяване на мускулната треска и отоците.",
  },
  {
    icon: Flame,
    title: "Повишена гъвкавост",
    desc: "Подобрява обхвата на движение в ставите и еластичността на тъканите.",
  },
];

const attachments = [
  {
    name: "Крака",
    image: "/legs.webp",
    desc: "Пълно покритие от глезена до бедрото. Идеална за бегачи, колоездачи и всякакви спортисти.",
  },
  {
    name: "Ръце",
    image: "/arm.png",
    desc: "От китката до рамото. Перфектна за тенис, бадминтон и силови спортове.",
  },
  {
    name: "Таз и ханш",
    image: "/pelvis.webp",
    desc: "Целево въздействие върху глутеусите и тазобедрената зона.",
  },
];

const faqs = [
  {
    q: "Какво представлява сесията с Normatec 3?",
    a: "Normatec 3 използва динамична въздушна компресия за масаж на крайниците. Специалните маншети се надуват и изпускат последователно, имитирайки естественото движение на лимфата в тялото.",
  },
  {
    q: "Какви са основните ползи?",
    a: "Ускорено възстановяване след тренировка, намаляване на отоците и мускулната умора, подобрено кръвообращение и лимфен дренаж, намалени болки в краката.",
  },
  {
    q: "Как да се облека за сесията?",
    a: "Носете удобни, не много дебели дрехи. Маншетите се поставят върху дрехата. Можете да носите клин, чорапогащи или тесен панталон под маншетите за крака.",
  },
  {
    q: "Кога не трябва да се използва Normatec 3?",
    a: "При остра дълбока венозна тромбоза, тежка сърдечно-съдова недостатъчност, активни инфекции, незараснали фрактури в зоната на приложение или злокачествени заболявания в зоната на компресия.",
  },
];

export default function RecoveryZonePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} />
          Portal
        </Link>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <span className="font-medium text-sm">Recovery Zone</span>
          <span className="text-zinc-600 text-sm">by ZM</span>
        </div>
        <a
          href="mailto:recoveryzonebyzm@gmail.com"
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-medium transition-all"
        >
          Запази час
        </a>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0">
          <Image
            src="/recovery-hero.png"
            alt="Recovery Zone"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/10 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-32">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium uppercase tracking-widest mb-8">
            <Activity size={12} />
            Hyperice Normatec 3
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight max-w-3xl leading-[1.05] mb-6">
            Професионален
            <br />
            лимфен дренаж
            <br />
            <span className="text-emerald-400">за твоето тяло</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mb-12 leading-relaxed">
            Възстановете се по-бързо с технологията на Hyperice Normatec 3.
            Научно обоснована терапия с видими резултати още след първата сесия.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:recoveryzonebyzm@gmail.com"
              className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-sm font-medium transition-all active:scale-95"
            >
              Запази час <ArrowLeft size={16} className="rotate-180" />
            </a>
            <a
              href="#benefits"
              className="flex items-center gap-2 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-sm font-medium transition-all"
            >
              Разгледай <ChevronDown size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-[11px] uppercase tracking-[0.4em] text-emerald-400 mb-4">Ползи</p>
            <h2 className="text-4xl font-light tracking-tight">
              Научно обоснована
              <span className="text-zinc-500"> терапия</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 group hover:border-emerald-600/30 hover:bg-zinc-900/80 transition-all duration-300"
              >
                <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all duration-300">
                  <b.icon size={20} strokeWidth={1.5} />
                </div>
                <h3 className="font-medium text-white mb-3">{b.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Attachments */}
      <section className="py-32 px-6 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-[11px] uppercase tracking-[0.4em] text-emerald-400 mb-4">Приставки</p>
            <h2 className="text-4xl font-light tracking-tight">
              Три зони на
              <span className="text-zinc-500"> въздействие</span>
            </h2>
            <p className="text-zinc-500 mt-4 max-w-lg">
              Normatec 3 разполага с три вида маншети — за крака, ръце и таз.
              Комбинирайте ги за цялостно възстановяване.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {attachments.map((a) => (
              <div
                key={a.name}
                className="group bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-emerald-600/30 transition-all duration-300"
              >
                <div className="h-56 relative overflow-hidden bg-zinc-800">
                  <Image
                    src={a.image}
                    alt={a.name}
                    fill
                    className="object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                </div>
                <div className="p-8">
                  <h3 className="text-lg font-medium text-white mb-3">{a.name}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <p className="text-[11px] uppercase tracking-[0.4em] text-emerald-400 mb-4">FAQ</p>
            <h2 className="text-4xl font-light tracking-tight">Чести въпроси</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-emerald-600/20 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="h-6 w-6 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-3">{faq.q}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="py-24 px-6 bg-amber-950/20 border-y border-amber-900/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.4em] text-amber-400 mb-4">Важно</p>
          <h2 className="text-3xl font-light mb-6">Противопоказания</h2>
          <p className="text-zinc-400 mb-8">
            Normatec 3 е безопасна за мнозинството хора, но не се препоръчва при:
          </p>
          <ul className="space-y-3 text-zinc-400 text-sm">
            {[
              "Остра дълбока венозна тромбоза (ДВТ) или история на кръвни съсиреци",
              "Тежка сърдечно-съдова недостатъчност",
              "Белодробен едем",
              "Активни инфекции или възпаления в засегнатата зона",
              "Незараснали фрактури или тежки травми",
              "Злокачествени заболявания в областта на компресията",
              "Бременност (за приставката за таз)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="h-1.5 w-1.5 bg-amber-400 rounded-full mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-zinc-500 italic">
            Ако имате медицинско състояние, за което не сте сигурни, консултирайте
            се с вашия лекар преди сесията.
          </p>
        </div>
      </section>

      {/* Contact & CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] uppercase tracking-[0.4em] text-emerald-400 mb-6">Контакт</p>
          <h2 className="text-5xl font-light tracking-tight mb-6">
            Готов/а за
            <br />
            <span className="text-emerald-400">първата сесия?</span>
          </h2>
          <p className="text-zinc-500 mb-12 max-w-md mx-auto">
            Свържете се с нас, за да запазите час или да зададете въпрос.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="mailto:recoveryzonebyzm@gmail.com"
              className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-sm font-medium transition-all active:scale-95"
            >
              <Mail size={16} />
              recoveryzonebyzm@gmail.com
            </a>
          </div>
          <div className="flex justify-center gap-8 text-zinc-600 text-sm">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              Пон–Пет: 09:00–20:00
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} />
              Съб–Нед: 10:00–18:00
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-400">Recovery Zone by ZM</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-zinc-700">
          © {new Date().getFullYear()} Recovery Zone by ZM
        </span>
        <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
          ← Обратно към портала
        </Link>
      </footer>
    </div>
  );
}
