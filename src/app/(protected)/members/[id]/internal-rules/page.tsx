"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { formatFullName } from "@/lib/utils";

const InternalRulesPage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading } = useMemberProfile(memberId);

  if (loading) return <div className="p-8">Зареждане...</div>;
  if (!member) return <div className="p-8">Членът не е намерен.</div>;

  const fullName = formatFullName(member);

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-4 md:p-6">
      {/* Non-printable header */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 size-4" /> Назад
        </Button>
        <Button
          onClick={() => window.print()}
          className="rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800"
        >
          <Printer className="mr-2 size-4" /> Принтирай
        </Button>
      </div>

      {/* Printable Area */}
      <div className="print-area leading-1.15 text-justify font-serif text-slate-900">
        <div className="mb-3 text-center">
          <h1 className="mb-0.5 text-base font-bold uppercase">
            ВЪТРЕШЕН ПРАВИЛНИК
          </h1>
          <p className="text-sm font-bold">
            НА СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО” град ГЪЛЪБОВО
          </p>
        </div>

        <div className="space-y-1.5 text-[8.8pt]">
          <section>
            <h2 className="mb-0.5 font-bold underline">I. Общи положения</h2>
            <div className="space-y-0.5">
              <p>
                1. Настоящият правилник урежда членството, правата, задълженията
                и взаимодействията между членовете, родителите, треньорите и
                ръководството на СНЦ „Бадминтон клуб Гълъбово”.
              </p>
              <p>
                2. Всеки нов член и негов родител/настойник задължително се
                запознават с вътрешните правила.
              </p>
              <p>
                3. Членството е доброволно и открито за всички, които желаят да
                тренират бадминтон в клуба.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-0.5 font-bold underline">
              II. Членство и документи
            </h2>
            <div className="space-y-0.5">
              <p>4. За да стане член на клуба, лицето предоставя:</p>
              <ul className="ml-4">
                <li>- Молба за членство;</li>
                <li>- Медицинско свидетелство;</li>
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
            <h2 className="mb-0.5 font-bold underline">
              III. Финансови условия (от 01.01.2026 г.)
            </h2>
            <div className="space-y-0.5">
              <p>6. Членствата са както следва:</p>
              <div className="ml-4 grid grid-cols-2 gap-x-4">
                <p>☐ Месечен абонамент - едно дете ( 20 EUR )</p>
                <p>☐ Месечен абонамент - 2 деца ( 30 EUR )</p>
                <p>☐ Месечен абонамент - 2+ деца ( 40 EUR )</p>
                <p>☐ Единично посещение ( 3 EUR )</p>
              </div>
              <p>7. Отстъпки:</p>
              <ul className="ml-4">
                <li>
                  - Второ и следващо дете от едно семейство ползва семеен
                  абонамент 2 деца или 2+ деца.
                </li>
                <li>
                  - При участие в повече тренировки от предвидените в месеца
                  (само за месечен абонамент), цената остава фиксирана
                  (допълнителните тренировки са бонус).
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-0.5 font-bold underline">
              IV. Тренировъчен процес
            </h2>
            <div className="space-y-0.5">
              <p>
                8. Тренировките са с продължителност 1 ч. и 30 мин. и включват:
                загрявка, физически упражнения, техническа подготовка, свободна
                игра и разтягане.
              </p>
              <p>
                9. Минимум 8 тренировки месечно. Графикът за всеки месец се
                публикува предварително.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-0.5 font-bold underline">
              V. Права и задължения на трениращите
            </h2>
            <div className="space-y-0.5">
              <p>10. Всеки член е длъжен:</p>
              <ul className="ml-4">
                <li>- Да спазва инструкциите на треньора;</li>
                <li>
                  - Да идва в приличен спортен вид и подходящо облекло.
                  Маратонки/гуменки , които се използват само за залата са
                  задължителни.
                </li>
                <li>
                  - Да спазва дисциплина – без излишни разговори, мобилни
                  телефони, закъснения;
                </li>
                <li>
                  - Да не консумира храна преди/по време на тренировка (само
                  вода при нужда).
                </li>
              </ul>
              <p>11. Родителите са длъжни:</p>
              <ul className="ml-4">
                <li>- Да подкрепят дисциплината и правилата на клуба;</li>
                <li>
                  - Да осигуряват присъствие на децата на тренировките и
                  състезанията, когато е необходимо;
                </li>
                <li>
                  - Да уведомяват треньора при отсъствие или здравословни
                  проблеми.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-0.5 font-bold underline">
              VI. Състезания и клубни дейности
            </h2>
            <div className="space-y-0.5">
              <p>
                12. Задължителни състезания за картотекирани спортисти: Зонални
                първенства; Държавни лични и отборни първенства.
              </p>
              <p>
                13. По желание: национални турнири, лагери, контролни срещи.
              </p>
              <p>14. Клубът осигурява:</p>
              <ul className="ml-4">
                <li>- Пера и ракети за тренировка на новите членове;</li>
                <li>
                  - Клубна екипировка за картотекирани състезатели или членове с
                  над 6 месеца участие и без задължения. При прекратяване на
                  членството, предоставената клубна екипировка се връща в добро
                  състояние на клуба, освен ако не е закупена лично от
                  състезателя/родителя.
                </li>
                <li>
                  - Треньорско присъствие, транспорт и нощувки при държавни
                  лични и отборни първенства.
                </li>
              </ul>
              <p>
                15. Клубът не поема ангажимент за треньорско присъствие и
                разходи за турнири, които не са включени в спортния календар на
                клуба за текущата година.
              </p>
            </div>
          </section>

          <div className="grid grid-cols-2 items-start gap-x-6">
            <section>
              <h2 className="mb-0.5 font-bold underline">
                VII. Етика и дисциплина
              </h2>
              <div className="space-y-0.5">
                <p>
                  16. Забранява се умишлено нараняване или грубо поведение към
                  съотборници или други състезатели.
                </p>
                <p>
                  17. При нарушаване на дисциплината треньорът може да наложи
                  наказания – допълнителни упражнения, временно отстраняване от
                  тренировка или лишаване от участие в състезания.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-0.5 font-bold underline">VIII. Отговорности</h2>
              <div className="space-y-0.5">
                <p>
                  18. Треньорът и клубът не носят отговорност при: Травми,
                  настъпили поради неспазване на указанията; Приети храни преди
                  или по време на тренировка; Скриване на здравословни проблеми.
                </p>
              </div>
            </section>
          </div>

          <section>
            <h2 className="mb-0.5 font-bold underline">
              IX. Заключителни разпоредби
            </h2>
            <div className="space-y-0.5">
              <p>
                19. Всеки член получава екземпляр от правилника и се подписва,
                че е запознат с него. 20. Правилникът може да бъде променян от
                Управителния съвет.
              </p>
            </div>
          </section>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-2 text-[9pt]">
          <p className="mb-2">
            Дата:
            .........................................................................
            Място: спортна зала „Енергетик“ град Гълъбово
          </p>
          <p className="mb-2 font-bold">Подписват:</p>

          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="w-32 shrink-0">Родител/настойник:</span>
              <span className="min-h-5 flex-1 border-b border-dotted border-slate-400"></span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="w-32 shrink-0">Състезател:</span>
              <span className="min-h-5 flex-1 border-b border-dotted border-slate-400">
                <strong>{fullName}</strong>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="w-32 shrink-0">Председател:</span>
              <div className="flex flex-1 items-baseline justify-between border-b border-dotted border-slate-400">
                <span>
                  Мира Петрова Георгиева
                  ....................................................
                </span>
                <span className="text-[7pt] text-slate-400 italic">
                  Последна редакция: 01 януари 2026 г.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 10mm 15mm;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `,
        }}
      />
    </div>
  );
};

export default InternalRulesPage;
