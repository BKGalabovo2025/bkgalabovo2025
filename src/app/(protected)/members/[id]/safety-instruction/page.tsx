"use client";

import { useParams } from "next/navigation";

import { GenericDeclarationPage } from "@/components/members/generic-declaration-page";

const SafetyInstructionPage = () => {
  const params = useParams();
  const memberId = params.id as string;

  return (
    <GenericDeclarationPage
      memberId={memberId}
      prefix="safetyDeclaration"
      dialogTitle="Подпис на Инструктаж"
      dialogDescriptionFn={(fullName) =>
        `Подпис за Инструктаж за безопасност на ${fullName}`
      }
    >
      {({ fullName, existingSignatureUrl }) => (
        <>
          <div className="mb-10 text-center">
            <h1 className="text-xl font-bold uppercase">ИНСТРУКТАЖ</h1>
            <h2 className="mt-1 text-base leading-tight font-bold uppercase">
              ЗА БЕЗОПАСНО ПЪТУВАНЕ И ПРОВЕЖДАНЕ НА СПОРТНО СЪСТЕЗАНИЕ
            </h2>
            <p className="mt-2 text-lg font-bold">20.......... г.</p>
          </div>

          <div className="space-y-4 text-justify text-[10.5pt] leading-snug">
            <div className="space-y-2">
              <p>
                ☑ 1. На състезателите се забранява да пътуват сами от и до
                мястото на състезанието.
              </p>
              <p>
                ☑ 2. При неразположение или нужда по време на пътуването, да се
                уведоми своевременно ръководителя / треньора / на групата.
              </p>
              <p>
                ☑ 3. Състезателите се придвижват организирано в група, под
                ръководството на ръководителя / треньора /.
              </p>
              <p>
                ☑ 4. Забранява се отделянето от групата без изричното разрешение
                на ръководителя / треньора /.
              </p>
              <p>
                ☑ 5. Не се разрешава храненето в превозното средство без
                разрешението на ръководителя / треньора / и шофьора.
              </p>
              <p>
                ☑ 6. Ръководителя / треньора / на групата се качва последен и
                слиза първи от превозното средство.
              </p>
              <p>
                ☑ 7. Състезателите поддържат добри взаимоотношения в дух на
                спортсменство и колегиалност с участващите в състезанието
                състезатели от други отбори.
              </p>
              <p>
                ☑ 8. Забранява се носенето и използването на пиротехнически
                средства.
              </p>
              <p>
                ☑ 9. Забранява се употребата на алкохол, цигари и упойващи
                вещества.
              </p>
              <p>
                ☑ 10. По време на пътуването и състезанието да се спазват точно
                указанията на треньора.
              </p>
              <p>
                ☑ 11. С поведението си състезателите – участници в състезанието
                са длъжни да не уронват престижа и авторитета на клуба.
              </p>
              <p>
                ☑ 12. С настоящия инструктаж да се запознаят, срещу подпис в
                заявката-формуляр преди пътуването, всички състезатели –
                участници в състезанието.
              </p>
            </div>

            <div className="mt-8 space-y-6 border-t border-slate-100 pt-6">
              <div className="flex items-baseline gap-4">
                <span className="w-28 shrink-0 font-bold">Родител:</span>
                <div className="flex min-h-8 flex-1 items-end justify-center border-b border-dotted border-slate-400 pb-1">
                  {existingSignatureUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={existingSignatureUrl}
                      alt="Подпис на родител"
                      className="h-14 w-auto object-contain"
                      // eslint-disable-next-line react/forbid-dom-props
                      style={{ mixBlendMode: "multiply" }}
                    />
                  ) : (
                    <span className="text-[10pt] text-slate-400 italic">
                      / име, фамилия, подпис /
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="w-28 shrink-0 font-bold">Състезател:</span>
                <div className="flex min-h-8 flex-1 items-end gap-6 border-b border-dotted border-slate-400 px-4">
                  <strong className="text-lg">{fullName}</strong>
                  <span className="text-[10pt] text-slate-400 italic">
                    / име, фамилия, подпис /
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between px-4">
              <p>Дата: .........................</p>
              <p>Място: гр. Гълъбово</p>
            </div>

            <div className="mt-8 border-t border-slate-50 pt-4">
              <p className="mb-2 font-bold uppercase">УТВЪРДИЛ:</p>
              <div className="space-y-1">
                <p className="text-lg font-bold">Председател: Мира Георгиева</p>
                <p className="text-slate-600 italic">
                  „Бадминтон клуб Гълъбово&quot;
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </GenericDeclarationPage>
  );
};

export default SafetyInstructionPage;
