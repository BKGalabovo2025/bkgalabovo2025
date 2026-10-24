"use client";

import { useParams } from "next/navigation";

import { GenericDeclarationPage } from "@/components/members/generic-declaration-page";
import {
  ChairpersonSignatureControl,
  ChairpersonSignatureLine,
} from "@/components/shared/members/ChairpersonSignatureControl";
import { useChairpersonSignature } from "@/hooks/useChairpersonSignature";

const SafetyInstructionPage = () => {
  const params = useParams();
  const memberId = params.id as string;
  const chairperson = useChairpersonSignature();

  return (
    <GenericDeclarationPage
      memberId={memberId}
      prefix="safetyDeclaration"
      dialogTitle="Подпис на Инструктаж"
      dialogDescriptionFn={(fullName) =>
        `Подпис за Инструктаж за безопасност на ${fullName}`
      }
      extraToolbarActions={<ChairpersonSignatureControl {...chairperson} />}
    >
      {({ fullName, existingSignatureUrl, displayDate }) => (
        <>
          <div className="mb-3 text-center">
            <h1 className="text-xl font-bold tracking-[0.25em] text-slate-950 uppercase">
              И Н С Т Р У К Т А Ж
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-800 uppercase tracking-wider">
              За безопасно пътуване, ред, дисциплина и опазване здравето на
              спортистите
            </p>
            <p className="mt-0.5 text-[8pt] text-slate-500 italic">
              (при провеждане на учебно-тренировъчни лагери, турнири и официални
              състезания)
            </p>
          </div>

          <div className="space-y-2 text-justify text-[8.5pt] leading-normal">
            <p className="text-[8pt] text-slate-700 italic border-b border-slate-200 pb-1">
              Настоящият инструктаж урежда задължителните норми за поведение,
              транспортна безопасност и опазване живота и здравето на
              състезателите от СНЦ „Бадминтон клуб Гълъбово“.
            </p>

            <ol className="list-decimal space-y-1 pl-4 text-[8pt] leading-snug">
              <li>
                <strong>Организирано придвижване:</strong> Състезателите пътуват
                организирано в група под прякото ръководство на дежурния треньор
                или упълномощения водач на групата.
              </li>
              <li>
                <strong>Забрана за самостоятелно пътуване:</strong> Категорично
                се забранява самостоятелно придвижване на непълнолетни
                състезатели без изрично писмено разрешение от родителите и
                ръководството.
              </li>
              <li>
                <strong>Ред и безопасност в превозното средство:</strong>{" "}
                Задължително е поставянето на предпазните колани по време на
                движение. Забранява се ставане от местата, движение по пътеката
                и нарушаване на спокойствието на водача.
              </li>
              <li>
                <strong>Качване и слизане:</strong> Слизането от превозното
                средство се извършва само след пълното му спиране на
                определените паркинги, като треньорът слиза пръв и се качва
                последен след проверка на групата.
              </li>
              <li>
                <strong>Забрана за самоволно отделяне:</strong> Абсолютно се
                забранява напускането на спортната зала, хотела или базата без
                знанието и изричното разрешение на треньора.
              </li>
              <li>
                <strong>Здравословно състояние:</strong> При всяко
                неразположение, признак на преумора, травма или инцидент,
                състезателят е длъжен незабавно да уведоми треньора или
                медицинското лице.
              </li>
              <li>
                <strong>Спортен морал и уважение:</strong> Всички състезатели са
                длъжни да проявяват спортсменство, взаимно уважение, да пазят
                клубната материална база и с поведението си да не уронват
                престижа на клуба.
              </li>
              <li>
                <strong>Абсолютни забрани:</strong> Категорично се забранява
                внасянето и употребата на пиротехника, алкохол, цигари,
                наркотични и допингови субстанции, както и опасни предмети.
              </li>
              <li>
                <strong>Изпълнение на указанията:</strong> Всички разпореждания
                на треньорския щаб по отношение на спортния и възстановителен
                режим са абсолютно задължителни.
              </li>
            </ol>

            <p className="border-t border-slate-200 pt-1.5 text-[8pt] text-slate-800 font-medium italic">
              С подписите си по-долу удостоверяваме, че сме запознати с
              изискванията на настоящия инструктаж, разбираме значението му и
              поемаме задължението за стриктното му спазване.
            </p>

            {/* Structured Executive Signature Table */}
            <div className="mt-4 rounded-md border border-slate-300 bg-slate-50/70 p-2.5 text-[8pt] print:border-slate-400 print:bg-transparent">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="font-bold text-slate-900 uppercase">
                    1. Състезател:
                  </span>
                  <div className="mt-1 flex items-baseline justify-between border-b border-slate-700 pb-0.5">
                    <strong className="text-slate-950">{fullName}</strong>
                    <span className="text-[7pt] text-slate-500 italic">
                      / подпис /
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-900 uppercase">
                    2. Родител / Настойник:
                  </span>
                  <div className="mt-1 flex items-baseline justify-between border-b border-slate-700 pb-0.5">
                    {existingSignatureUrl ? (
                      <div className="relative inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={existingSignatureUrl}
                          alt="Подпис"
                          className="h-7 w-auto object-contain mix-blend-multiply"
                        />
                      </div>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                    <span className="text-[7pt] text-slate-500 italic">
                      / подпис /
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Closing institutional block */}
            <div className="mt-5 flex items-end justify-between font-serif text-[8.5pt]">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-900">гр. Гълъбово</p>
                <div className="w-36 border-b border-slate-700 pb-0.5">
                  <span className="font-medium">Дата: {displayDate} г.</span>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold tracking-wider text-slate-950 uppercase text-[8pt]">
                  УТВЪРДИЛ:
                </p>
                <p className="text-[8.5pt] font-bold text-slate-900 mb-1">
                  Председател на СНЦ „Бадминтон клуб Гълъбово“
                </p>
                <div className="flex justify-end">
                  <ChairpersonSignatureLine
                    isApplied={chairperson.isApplied}
                    signatureUrl={chairperson.signatureUrl}
                    caption="/ Мира Георгиева /"
                    align="right"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </GenericDeclarationPage>
  );
};

export default SafetyInstructionPage;
