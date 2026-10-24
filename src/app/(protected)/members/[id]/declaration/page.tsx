"use client";

import { useParams } from "next/navigation";

import { GenericDeclarationPage } from "@/components/members/generic-declaration-page";

const InformedConsentPage = () => {
  const params = useParams();
  const memberId = params.id as string;

  return (
    <GenericDeclarationPage
      memberId={memberId}
      prefix="signedDeclaration"
      dialogTitle="Подпис на Декларация"
      dialogDescriptionFn={(fullName) =>
        `Подпис за Декларация за информирано съгласие на ${fullName}`
      }
    >
      {({ member, fullName, existingSignatureUrl, displayDate }) => (
        <>
          <div className="mb-4 text-center">
            <h1 className="text-xl font-bold tracking-[0.25em] text-slate-950 uppercase">
              Д Е К Л А Р А Ц И Я
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-800 uppercase tracking-wider">
              За информирано съгласие и обработване на лични данни
            </p>
          </div>

          {/* Structured Administrative Declarant Data Box */}
          <div className="mb-4 rounded-md border border-slate-300 bg-slate-50/70 p-3 text-[9pt] print:border-slate-400 print:bg-transparent">
            <div className="space-y-2">
              <div className="grid grid-cols-[190px_1fr] items-baseline gap-2">
                <span className="font-bold text-slate-900 uppercase tracking-wide">
                  Долуподписаният/ата:
                </span>
                <span className="border-b border-dotted border-slate-500 pb-0.5 font-medium text-slate-950">
                  {member.parentName ? (
                    <strong className="text-slate-950">
                      {member.parentName}
                    </strong>
                  ) : (
                    <span className="text-slate-400 italic">
                      / трите имена по документ за самоличност /
                    </span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-[190px_1fr] items-baseline gap-2">
                  <span className="font-bold text-slate-900">
                    ЕГН / Дата на раждане:
                  </span>
                  <span className="border-b border-dotted border-slate-500 pb-0.5">
                    {member.egn ? (
                      <strong className="text-slate-950">{member.egn}</strong>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-baseline gap-2">
                  <span className="font-bold text-slate-900">
                    Тел. за връзка:
                  </span>
                  <span className="border-b border-dotted border-slate-500 pb-0.5">
                    {member.parentPhone || member.phone ? (
                      <strong className="text-slate-950">
                        {member.parentPhone || member.phone}
                      </strong>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[190px_1fr] items-baseline gap-2 border-t border-slate-200 pt-1.5 print:border-slate-300">
                <span className="font-bold text-slate-900 uppercase tracking-wide">
                  В качеството си на:
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block size-3.5 rounded-xs border border-slate-600 text-center text-[8pt] leading-none"></span>
                    <span>
                      Лично (за пълнолетни лица / състезатели над 18 навършени
                      години)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="inline-block size-3.5 rounded-xs border border-slate-600 text-center text-[8pt] font-bold leading-none">
                      ✓
                    </span>
                    <span>
                      Родител / Настойник на състезателя:{" "}
                      <strong className="font-bold text-slate-950">
                        {fullName}
                      </strong>
                      {member.dateOfBirth && (
                        <span className="ml-2 text-slate-700">
                          (роден/а на:{" "}
                          <strong>
                            {new Date(member.dateOfBirth).toLocaleDateString(
                              "bg-BG"
                            )}{" "}
                            г.
                          </strong>
                          )
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Declarative Clauses */}
          <div className="space-y-2 text-justify text-[9pt] leading-relaxed">
            <p className="font-bold tracking-wider text-slate-950 uppercase">
              ДЕКЛАРИРАМ, ЧЕ:
            </p>
            <ol className="list-decimal space-y-1.5 pl-5 text-[8.5pt] leading-normal">
              <li>
                <strong>Правилник за вътрешния ред:</strong> Запознат/а съм и
                приемам без възражения Правилника за вътрешния ред на СНЦ
                „Бадминтон клуб Гълъбово“, като се задължавам аз / моето дете да
                спазваме спортната дисциплина и установения тренировъчен график.
              </li>
              <li>
                <strong>Доброволно участие:</strong> Доброволно и по собствено
                желание заявявам участието си / участието на моето дете в
                учебно-тренировъчния процес, спортните лагери и състезателната
                дейност на клуба.
              </li>
              <li>
                <strong>Осведоменост за рисковете:</strong> Запознат/а съм с
                естеството на спорта бадминтон и възможните рискове от физически
                натоварвания и спортни травми, съпътстващи системната спортна
                активност.
              </li>
              <li>
                <strong>Здравословно състояние:</strong> Удостоверявам, че аз /
                моето дете е клинично здраво/здрав, преминало е предсъстезателен
                медицински преглед и няма установени медицински противопоказания
                за извършване на интензивни физически упражнения и
                спортно-състезателна дейност.
              </li>
              <li>
                <strong>Защита на личните данни (GDPR):</strong> Давам своето
                изрично и информирано съгласие СНЦ „Бадминтон клуб Гълъбово“ да
                съхранява и обработва предоставените лични данни (мои и на
                детето ми) съгласно изискванията на Регламент (ЕС) 2016/679
                (GDPR) и ЗЗЛД, единствено за нуждите на картотекирането,
                легитимацията пред БФБ и ММС.
              </li>
              <li>
                <strong>Медийно отразяване:</strong> Съгласен/на съм клубът да
                заснема фото- и видеоматериали по време на тренировки и турнири
                с участието на мен / моето дете и да ги публикува с цел
                отразяване и популяризиране на дейността.
              </li>
            </ol>
          </div>

          {/* Institutional Closing & Signature Block */}
          <div className="mt-8 flex items-end justify-between font-serif text-[9pt]">
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">гр. Гълъбово</p>
              <div className="w-36 border-b border-slate-700 pb-0.5">
                <span className="font-medium">Дата: {displayDate} г.</span>
              </div>
            </div>

            <div className="min-w-64 text-center">
              <p className="mb-2 font-bold tracking-wider text-slate-950 uppercase text-[9pt]">
                ДЕКЛАРАТОР:
              </p>
              {existingSignatureUrl ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={existingSignatureUrl}
                    alt="Електронен подпис"
                    className="mx-auto h-11 w-auto object-contain mix-blend-multiply"
                  />
                  <div className="mt-1 w-48 border-b border-slate-700" />
                </div>
              ) : (
                <div className="pt-8 w-48 mx-auto border-b border-slate-700" />
              )}
              <p className="mt-1 text-[8pt] text-slate-600">
                / {member.parentName || "подпис на декларатора"} /
              </p>
            </div>
          </div>
        </>
      )}
    </GenericDeclarationPage>
  );
};

export default InformedConsentPage;
