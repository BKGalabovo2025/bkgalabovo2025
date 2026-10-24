"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import {
  ChairpersonSignatureControl,
  ChairpersonSignatureLine,
} from "@/components/shared/members/ChairpersonSignatureControl";
import { ClubOfficialDocumentHeader } from "@/components/shared/members/ClubOfficialDocumentHeader";
import { Button } from "@/components/ui/button";
import { useChairpersonSignature } from "@/hooks/useChairpersonSignature";
import { useClubFeeServices } from "@/hooks/useClubFeeServices";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { formatFullName } from "@/lib/utils";

const InternalRulesPage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading } = useMemberProfile(memberId);
  const chairperson = useChairpersonSignature();
  const { feeOptions } = useClubFeeServices();
  const [docDate, setDocDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const displayDate = docDate
    ? new Date(docDate).toLocaleDateString("bg-BG")
    : new Date().toLocaleDateString("bg-BG");

  if (loading) return <div className="p-8">Зареждане...</div>;
  if (!member) return <div className="p-8">Членът не е намерен.</div>;

  const fullName = formatFullName(member);

  const handleBack = () => {
    const hasHistory =
      typeof window !== "undefined" &&
      ((window.history.state && window.history.state.idx > 0) ||
        (window.history.length > 1 &&
          document.referrer &&
          document.referrer.includes(window.location.host)));

    if (hasHistory) {
      router.back();
    } else {
      router.push(`/members/${memberId}?tab=documents`);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-4 md:p-8">
      {/* Non-printable header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button
          variant="outline"
          onClick={handleBack}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 size-4" /> Назад
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {/* Interactive Date Picker */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs">
            <span className="text-[11px] font-medium text-zinc-500">Дата:</span>
            <input
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-900 focus:outline-none cursor-pointer"
            />
          </div>

          <ChairpersonSignatureControl {...chairperson} />
          <span className="hidden text-xs text-slate-500 sm:inline">
            (2 стр. А4)
          </span>
          <Button
            onClick={() => window.print()}
            className="rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800"
          >
            <Printer className="mr-2 size-4" /> Принтирай
          </Button>
        </div>
      </div>

      {/* Printable Area - Exactly 2 Pages */}
      <div className="print-area font-serif text-slate-900 leading-snug text-justify">
        {/* ================= PAGE 1 ================= */}
        <div className="page-sheet page-1">
          <ClubOfficialDocumentHeader
            documentKey="internalRules"
            overrideDate={displayDate}
          />

          <div className="mb-3 text-center">
            <h1 className="text-base font-bold uppercase tracking-wider">
              ВЪТРЕШЕН ПРАВИЛНИК
            </h1>
            <p className="text-xs font-bold text-slate-700">
              НА СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО” град ГЪЛЪБОВО
            </p>
          </div>

          <div className="space-y-2.5 text-[9pt] leading-snug">
            <section>
              <h2 className="mb-0.5 font-bold underline text-[9.5pt]">
                I. Общи положения
              </h2>
              <div className="space-y-0.5">
                <p>
                  1. Настоящият правилник урежда членството, правата,
                  задълженията и взаимодействията между членовете, родителите,
                  треньорите и ръководството на СНЦ „Бадминтон клуб Гълъбово”.
                </p>
                <p>
                  2. Всеки нов член и негов родител/настойник задължително се
                  запознават с вътрешните правила преди започване на
                  тренировките.
                </p>
                <p>
                  3. Членството е доброволно и открито за всички, които желаят
                  да тренират бадминтон в клуба.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-0.5 font-bold underline text-[9.5pt]">
                II. Членство и документи
              </h2>
              <div className="space-y-0.5">
                <p>4. За да стане член на клуба, лицето предоставя:</p>
                <ul className="ml-4 space-y-0.5">
                  <li>- Молба за членство по образец на клуба;</li>
                  <li>
                    - Медицинско свидетелство за липса на противопоказания за
                    спорт;
                  </li>
                  <li>
                    - Заплащане на абонамент в срок от 1-во до 10-то число на
                    текущия месец.
                  </li>
                </ul>
                <p>
                  5. При неплащане в срок, членството се счита за временно
                  прекратено до уреждане на задължението.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-0.5 font-bold underline text-[9.5pt]">
                III. Финансови условия (от 01.01.2026 г.)
              </h2>
              <div className="space-y-0.5">
                <p>6. Членските вноски са както следва:</p>
                <div className="ml-4 grid grid-cols-2 gap-x-4 py-0.5">
                  {feeOptions.map((fee) => (
                    <p key={fee.id}>
                      ☐ {fee.name} ( {fee.price} {fee.currency} )
                    </p>
                  ))}
                </div>
                <p>7. Отстъпки и бонуси:</p>
                <ul className="ml-4 space-y-0.5">
                  <li>
                    - Второ и следващо дете от едно семейство ползва
                    преференциален семеен абонамент (за 2 деца или 2+ деца).
                  </li>
                  <li>
                    - При провеждане на повече тренировки от предвидените в
                    месеца (за редовен месечен абонамент), цената остава
                    фиксирана — допълнителните тренировки са клубен бонус.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-0.5 font-bold underline text-[9.5pt]">
                IV. Тренировъчен процес
              </h2>
              <div className="space-y-0.5">
                <p>
                  8. Тренировките са с продължителност 1 ч. и 30 мин. и
                  включват: загрявка, общофизически упражнения, техническа
                  подготовка, свободна игра и заключително разтягане.
                </p>
                <p>
                  9. Осигуряват се минимум 8 тренировки месечно. Графикът за
                  всеки месец се публикува предварително на информационните
                  табла и интернет страницата на клуба.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-4 text-center text-[7.5pt] text-slate-400 print:block">
            Страница 1 от 2 &bull; СНЦ „Бадминтон клуб Гълъбово”
          </div>
        </div>

        {/* Explicit page break between page 1 and page 2 */}
        <div className="page-break my-8 border-b-2 border-dashed border-slate-300 print:m-0 print:border-none" />

        {/* ================= PAGE 2 ================= */}
        <div className="page-sheet page-2 pt-2">
          {/* Header of Page 2 */}
          <div className="mb-3 flex items-center justify-between border-b border-slate-400 pb-1 text-[8pt] text-slate-600 font-sans">
            <span className="font-semibold uppercase tracking-wider">
              СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО”
            </span>
            <span>ВЪТРЕШЕН ПРАВИЛНИК (продължение) — Стр. 2 от 2</span>
          </div>

          <div className="space-y-2.5 text-[9pt] leading-snug">
            <section>
              <h2 className="mb-0.5 font-bold underline text-[9.5pt]">
                V. Права и задължения на трениращите
              </h2>
              <div className="space-y-0.5">
                <p>10. Всеки член е длъжен:</p>
                <ul className="ml-4 space-y-0.5">
                  <li>- Да изпълнява стриктно инструкциите на треньора;</li>
                  <li>
                    - Да идва в приличен спортен вид и подходящо облекло. Чисти
                    маратонки/гуменки, използвани единствено за залата, са
                    абсолютно задължителни.
                  </li>
                  <li>
                    - Да спазва висока дисциплина — без излишни разговори,
                    мобилни телефони и закъснения;
                  </li>
                  <li>
                    - Да не консумира храна преди или по време на тренировка
                    (разрешена е само вода при нужда).
                  </li>
                </ul>
                <p className="mt-1">11. Родителите са длъжни:</p>
                <ul className="ml-4 space-y-0.5">
                  <li>
                    - Да подкрепят дисциплината и установените правила на клуба;
                  </li>
                  <li>
                    - Да осигуряват редовно присъствие на децата на тренировките
                    и състезанията;
                  </li>
                  <li>
                    - Да уведомяват своевременно треньора при отсъствие или
                    здравословни проблеми.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-0.5 font-bold underline text-[9.5pt]">
                VI. Състезания и клубни дейности
              </h2>
              <div className="space-y-0.5">
                <p>
                  12. Задължителни състезания за картотекирани спортисти:
                  Зонални първенства; Държавни лични и отборни първенства.
                </p>
                <p>
                  13. По желание: национални турнири, спортни лагери и контролни
                  срещи.
                </p>
                <p>14. Клубът осигурява:</p>
                <ul className="ml-4 space-y-0.5">
                  <li>- Пера и ракети за тренировка на новите членове;</li>
                  <li>
                    - Клубна екипировка за картотекирани състезатели или членове
                    с над 6 месеца участие и без задължения. При прекратяване на
                    членството, предоставената екипировка се връща в добро
                    състояние, освен ако не е закупена лично;
                  </li>
                  <li>
                    - Треньорско присъствие, транспорт и нощувки при държавни
                    първенства.
                  </li>
                </ul>
                <p>
                  15. Клубът не поема ангажимент за разходи и треньорско
                  присъствие за турнири извън официалния клубен календар.
                </p>
              </div>
            </section>

            <div className="grid grid-cols-2 items-start gap-x-4">
              <section>
                <h2 className="mb-0.5 font-bold underline text-[9.5pt]">
                  VII. Етика и дисциплина
                </h2>
                <div className="space-y-0.5 text-[8.5pt]">
                  <p>
                    16. Забранява се грубо поведение или обиди към съотборници
                    или съперници.
                  </p>
                  <p>
                    17. При нарушаване на реда треньорът може да наложи
                    наказания — допълнителни упражнения, отстраняване от
                    тренировка или спиране от състезания.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="mb-0.5 font-bold underline text-[9.5pt]">
                  VIII. Отговорности
                </h2>
                <div className="space-y-0.5 text-[8.5pt]">
                  <p>
                    18. Треньорът и клубът не носят отговорност при: травми
                    поради неспазване на указания; приети храни преди
                    тренировка; скрити здравословни проблеми.
                  </p>
                </div>
              </section>
            </div>

            <section>
              <h2 className="mb-0.5 font-bold underline text-[9.5pt]">
                IX. Заключителни разпоредби
              </h2>
              <p className="text-[8.5pt]">
                19. Всеки член получава екземпляр от правилника и се подписва,
                че е запознат с него и го приема. 20. Правилникът може да бъде
                променян по решение на Управителния съвет на клуба.
              </p>
            </section>
          </div>

          {/* Signatures on bottom of Page 2 */}
          <div className="mt-4 border-t border-slate-300 pt-2 text-[8.5pt]">
            <p className="mb-2">
              Дата: {displayDate} г. | Място: спортна зала „Енергетик“, град
              Гълъбово
            </p>
            {/* Institutional Signatures Block */}
            <div className="mt-5 border-t border-slate-300 pt-3 text-[8pt]">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="font-bold uppercase tracking-wider text-slate-900 text-[8pt]">
                    Родител / Настойник:
                  </p>
                  <div className="pt-7 w-full border-b border-slate-700" />
                  <p className="text-[7.5pt] text-slate-500 italic">
                    / име, фамилия и подпис /
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold uppercase tracking-wider text-slate-900 text-[8pt]">
                    Състезател / Член:
                  </p>
                  <div className="pt-7 w-full border-b border-slate-700" />
                  <p className="text-[7.5pt] font-semibold text-slate-950">
                    / {fullName} /
                  </p>
                </div>

                <div className="space-y-1 text-right flex flex-col items-end">
                  <p className="font-bold uppercase tracking-wider text-slate-900 text-[8pt]">
                    Председател на УС:
                  </p>
                  <ChairpersonSignatureLine
                    isApplied={chairperson.isApplied}
                    signatureUrl={chairperson.signatureUrl}
                    caption="/ Мира Петрова Георгиева /"
                    align="right"
                  />
                </div>
              </div>

              <div className="mt-2 text-right text-[7pt] text-slate-400 italic">
                Правилникът е приет на Общо събрание на СНЦ „Бадминтон клуб
                Гълъбово“. Последна редакция: 01.01.2026 г.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 15mm 10mm 15mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
            height: 0 !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .page-sheet {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `,
        }}
      />
    </div>
  );
};

export default InternalRulesPage;
