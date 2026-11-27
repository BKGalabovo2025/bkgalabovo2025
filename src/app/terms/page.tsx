import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Общи условия | БК Гълъбово & Recovery Zone",
  description:
    "Общи условия за ползване на дигиталния портал на СНЦ „Бадминтон Клуб Гълъбово“ и Recovery Zone by ZM.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-zinc-950 px-4 py-20 text-zinc-100 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-4xl space-y-8 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-10">
        <div className="space-y-3 border-b border-zinc-800 pb-6">
          <Link
            href="/"
            className="inline-flex text-xs font-semibold tracking-wider text-blue-400 uppercase hover:underline"
          >
            ← Към началната страница
          </Link>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Общи условия за ползване
          </h1>
          <p className="text-sm text-zinc-400">
            Последна актуализация: 27 ноември 2026 г.
          </p>
        </div>

        <section className="space-y-2 text-sm leading-relaxed text-zinc-300">
          <h2 className="text-lg font-semibold text-white">
            1. Общи положения
          </h2>
          <p>
            Настоящите Общи условия уреждат правилата за ползване на уеб
            платформата, Родителския портал, онлайн декларациите и системата за
            резервации на <strong>СНЦ „Бадминтон Клуб Гълъбово“</strong> и{" "}
            <strong>Recovery Zone by ZM</strong>.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-zinc-300">
          <h2 className="text-lg font-semibold text-white">
            2. Членство, тренировки и резервации
          </h2>
          <p>
            Записването за тренировки, лагери, турнири и процедури за
            възстановяване подлежи на потвърждение от екипа на клуба. При
            участие на непълнолетни лица всички декларации и съгласия се подават
            и подписват от родител или законен настойник.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-zinc-300">
          <h2 className="text-lg font-semibold text-white">
            3. Поверителност и бисквитки
          </h2>
          <p>
            Обработването на лични данни се извършва при спазване на{" "}
            <Link href="/privacy-policy" className="text-blue-400 underline">
              Политиката за поверителност
            </Link>{" "}
            и действащото европейско и българско законодателство.
          </p>
        </section>

        <div className="flex flex-wrap gap-4 border-t border-zinc-800 pt-6 text-xs text-zinc-400">
          <Link
            href="/privacy-policy"
            className="text-blue-400 hover:underline"
          >
            Политика за поверителност →
          </Link>
          <Link href="/club" className="hover:text-white">
            БК Гълъбово
          </Link>
          <Link href="/recovery-zone" className="hover:text-white">
            Recovery Zone
          </Link>
        </div>
      </div>
    </main>
  );
}
