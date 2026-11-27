import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Политика за поверителност | БК Гълъбово & Recovery Zone",
  description:
    "Информация за обработването и защитата на лични данни съгласно Регламент (ЕС) 2016/679 (GDPR).",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
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
            Политика за поверителност и защита на личните данни (GDPR)
          </h1>
          <p className="text-sm text-zinc-400">
            Последна актуализация: 27 ноември 2026 г.
          </p>
        </div>

        <section className="space-y-2 text-sm leading-relaxed text-zinc-300">
          <h2 className="text-lg font-semibold text-white">
            1. Администратор на лични данни
          </h2>
          <p>
            Администратор на личните данни е{" "}
            <strong>СНЦ „Бадминтон Клуб Гълъбово“</strong> (вкл. дейността на{" "}
            <strong>Recovery Zone by ZM</strong>), със седалище гр. Гълъбово,
            Спортна зала „Енергетик“. За въпроси относно личните данни можете да
            се свържете с нас на{" "}
            <a
              href="mailto:bkgalabovo2014@gmail.com"
              className="text-blue-400 underline"
            >
              bkgalabovo2014@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-zinc-300">
          <h2 className="text-lg font-semibold text-white">
            2. Какви данни събираме и на какво правно основание
          </h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Данни за членове, състезатели и родители:</strong> три
              имена, дата на раждане, телефон, имейл, адрес, родителски контакти
              и електронни подписи на декларации/командировъчни (чл. 6, ал. 1,
              б. „б“ и „в“ от GDPR; за непълнолетни лица — със съгласие на
              родител/настойник по чл. 8 от GDPR).
            </li>
            <li>
              <strong>Специални категории данни (чл. 9 от GDPR):</strong>{" "}
              медицински свидетелства, бележки за травми и отсъствия по
              здравословни причини — обработват се единствено за гарантиране на
              безопасното участие в тренировки, лагери и състезания на база
              изрично съгласие и нормативни спортни изисквания.
            </li>
            <li>
              <strong>Запитвания и резервации (Recovery Zone / Клуб):</strong>{" "}
              име, телефон, имейл, избрана услуга/час — за отговор на запитване
              и изпълнение на заявена услуга.
            </li>
          </ul>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-zinc-300">
          <h2 className="text-lg font-semibold text-white">
            3. Срокове на съхранение
          </h2>
          <p>
            Данните на активни членове се съхраняват за срока на членството и до
            5 години след прекратяването му за счетоводни/нормативни цели
            (съгласно Закона за счетоводството). Запитвания от публични форми се
            съхраняват до 12 месеца, а системните резервни копия — до 30 дни.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-zinc-300">
          <h2 className="text-lg font-semibold text-white">
            4. Вашите права по GDPR
          </h2>
          <p>
            Имате право на достъп, корекция, изтриване („право да бъдете
            забравени“), ограничаване на обработването, преносимост на данните и
            възражение, както и право да подадете жалба до{" "}
            <strong>
              Комисията за защита на личните данни (КЗЛД, www.cpdp.bg)
            </strong>
            .
          </p>
        </section>

        <div className="flex flex-wrap gap-4 border-t border-zinc-800 pt-6 text-xs text-zinc-400">
          <Link href="/terms" className="text-blue-400 hover:underline">
            Общи условия →
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
