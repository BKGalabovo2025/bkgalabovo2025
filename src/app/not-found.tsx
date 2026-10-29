import { ArrowLeft, Calendar, Home, Search, Trophy } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-zinc-950 p-6 text-center text-zinc-100">
      <div className="relative flex w-full max-w-lg flex-col items-center overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -top-24 size-48 rounded-full bg-primary/20 blur-3xl" />

        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-primary shadow-inner">
          <Search className="size-9 opacity-80" strokeWidth={1.5} />
        </div>

        <span className="mb-2 text-xs font-semibold tracking-widest text-primary uppercase">
          Грешка 404
        </span>

        <h1 className="mb-3 text-2xl sm:text-3xl font-light text-white">
          Страницата не е намерена
        </h1>

        <p className="mb-8 max-w-sm text-xs sm:text-sm leading-relaxed text-zinc-400">
          Търсената от вас страница, събитие или турнир не съществува, била е
          преместена или достъпът до нея временно се обновява.
        </p>

        <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-3 text-xs font-medium tracking-wider text-zinc-950 uppercase transition-all hover:bg-zinc-200"
          >
            <Home className="size-4" strokeWidth={1.5} />
            Начало
          </Link>

          <Link
            href="/tournaments"
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs font-medium tracking-wider text-zinc-200 uppercase transition-all hover:bg-zinc-800 hover:text-white"
          >
            <Trophy className="size-4 text-amber-400" strokeWidth={1.5} />
            Турнири
          </Link>

          <Link
            href="/club/schedule"
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs font-medium tracking-wider text-zinc-200 uppercase transition-all hover:bg-zinc-800 hover:text-white"
          >
            <Calendar className="size-4 text-blue-400" strokeWidth={1.5} />
            График
          </Link>

          <Link
            href="/club"
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs font-medium tracking-wider text-zinc-200 uppercase transition-all hover:bg-zinc-800 hover:text-white"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Клубен портал
          </Link>
        </div>
      </div>
    </div>
  );
}
