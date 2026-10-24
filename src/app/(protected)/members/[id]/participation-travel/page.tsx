"use client";

import { useParams } from "next/navigation";

import { GenericDeclarationPage } from "@/components/members/generic-declaration-page";

const ParticipationTravelPage = () => {
  const params = useParams();
  const memberId = params.id as string;

  return (
    <GenericDeclarationPage
      memberId={memberId}
      prefix="travelDeclaration"
      dialogTitle="Подпис на Декларация за пътуване"
      dialogDescriptionFn={(fullName) =>
        `Подпис за Декларация — Съгласие за участие и пътуване за ${fullName}`
      }
    >
      {({ member, fullName, existingSignatureUrl }) => (
        <>
          <div className="mb-3 text-center">
            <h1 className="text-xl font-bold tracking-[0.25em] text-slate-950 uppercase">
              Д Е К Л А Р А Ц И Я – С Ъ Г Л А С И Е
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-800 uppercase tracking-wider">
              За организирано пътуване и участие в спортно-състезателни
              мероприятия
            </p>
          </div>

          {/* Structured Parents / Legal Representatives Box */}
          <div className="mb-3 rounded-md border border-slate-300 bg-slate-50/70 p-3 text-[8.5pt] print:border-slate-400 print:bg-transparent">
            <p className="mb-2 font-bold tracking-wider text-slate-950 uppercase text-[8.5pt]">
              ДОЛУПОДПИСАНИТЕ РОДИТЕЛИ / ЗАКОННИ ПРЕДСТАВИТЕЛИ:
            </p>
            <div className="grid grid-cols-2 gap-4">
              {/* 1. Баща */}
              <div className="space-y-1.5 border-r border-slate-200 pr-3 print:border-slate-300">
                <p className="font-bold text-slate-900">1. БАЩА:</p>
                <div>
                  <span className="text-[7.5pt] text-slate-500 uppercase">
                    Трите имена:
                  </span>
                  <div className="border-b border-dotted border-slate-500 pb-0.5 font-medium">
                    {member.fatherName ? (
                      <strong className="text-slate-950">
                        {member.fatherName}
                      </strong>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[7.5pt] text-slate-500 uppercase">
                      Гр. / с.:
                    </span>
                    <div className="border-b border-dotted border-slate-500 pb-0.5">
                      {member.fatherCity ? (
                        <span>{member.fatherCity}</span>
                      ) : (
                        <span>&nbsp;</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[7.5pt] text-slate-500 uppercase">
                      Тел. за връзка:
                    </span>
                    <div className="border-b border-dotted border-slate-500 pb-0.5">
                      {member.fatherPhone ? (
                        <strong className="text-slate-950">
                          {member.fatherPhone}
                        </strong>
                      ) : (
                        <span>&nbsp;</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Майка */}
              <div className="space-y-1.5 pl-1">
                <p className="font-bold text-slate-900">2. МАЙКА:</p>
                <div>
                  <span className="text-[7.5pt] text-slate-500 uppercase">
                    Трите имена:
                  </span>
                  <div className="border-b border-dotted border-slate-500 pb-0.5 font-medium">
                    {member.motherName || member.parentName ? (
                      <strong className="text-slate-950">
                        {member.motherName || member.parentName}
                      </strong>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[7.5pt] text-slate-500 uppercase">
                      Гр. / с.:
                    </span>
                    <div className="border-b border-dotted border-slate-500 pb-0.5">
                      {member.motherCity || member.address ? (
                        <span>{member.motherCity || member.address}</span>
                      ) : (
                        <span>&nbsp;</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[7.5pt] text-slate-500 uppercase">
                      Тел. за връзка:
                    </span>
                    <div className="border-b border-dotted border-slate-500 pb-0.5">
                      {member.motherPhone || member.parentPhone ? (
                        <strong className="text-slate-950">
                          {member.motherPhone || member.parentPhone}
                        </strong>
                      ) : (
                        <span>&nbsp;</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Athlete Identification Box */}
          <div className="mb-3 rounded-md border border-slate-300 bg-slate-50/70 p-2.5 text-[8.5pt] print:border-slate-400 print:bg-transparent">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-900 uppercase">
                В качеството ни на родители и законни представители на:
              </span>
              <span className="flex-1 border-b border-slate-700 pb-0.5 text-center text-[10pt] font-black text-slate-950">
                {fullName}
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-2 text-[8pt] text-slate-700">
              <div>
                Дата на раждане:{" "}
                <strong className="text-slate-950">
                  {member.dateOfBirth
                    ? `${new Date(member.dateOfBirth).toLocaleDateString("bg-BG")} г.`
                    : "_______________"}
                </strong>
              </div>
              <div>
                Месторождение:{" "}
                <span className="border-b border-dotted border-slate-400 pb-0.5">
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </span>
              </div>
              <div>
                Постоянен адрес:{" "}
                <strong className="text-slate-950">
                  {member.address || "гр. Гълъбово"}
                </strong>
              </div>
            </div>
          </div>

          {/* Legal Declarative Clauses */}
          <div className="space-y-2 text-justify text-[8.5pt] leading-relaxed">
            <p className="font-bold tracking-wider text-slate-950 uppercase text-[9pt]">
              ДЕКЛАРИРАМЕ НАСТОЯЩОТО СИ ИЗРИЧНО СЪГЛАСИЕ:
            </p>
            <p>
              Детето ни да провежда системни учебно-тренировъчни занимания по
              бадминтон, да бъде включвано в състава на представителните отбори
              на СНЦ „Бадминтон клуб Гълъбово“ и да взема участие във всички
              спортни лагери, държавни първенства и турнири от календара на БФБ.
            </p>
            <p>
              Да пътува организирано в страната и чужбина с осигурен или одобрен
              от клуба транспорт (лицензиран обществен или специализиран
              превозвач, клубен автомобил), под непрекъснатия надзор, контрол и
              отговорност на треньорския щаб и определените от клуба
              придружители.
            </p>
            <p className="text-[8pt] text-slate-700 italic">
              Известна ни е наказателната отговорност по чл. 313 от Наказателния
              кодекс на Република България за потвърждаване на неистина или
              затаяване на истина в писмена декларация.
            </p>
          </div>

          {/* Formal Institutional Closing & Signatures */}
          <div className="mt-6 flex items-end justify-between font-serif text-[8.5pt]">
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">гр. Гълъбово</p>
              <div className="w-36 border-b border-slate-700 pb-0.5">
                <span className="font-medium">
                  Дата: {new Date().toLocaleDateString("bg-BG")} г.
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold tracking-wider text-slate-950 uppercase text-right text-[8.5pt]">
                ДЕКЛАРАТОРИ:
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div className="min-w-36 text-center">
                  <div className="pt-8 w-full border-b border-slate-700" />
                  <p className="mt-1 text-[7.5pt] text-slate-600">
                    1. /подпис на бащата/
                  </p>
                </div>
                <div className="min-w-36 text-center">
                  {existingSignatureUrl ? (
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={existingSignatureUrl}
                        alt="Подпис"
                        className="mx-auto h-10 w-auto object-contain mix-blend-multiply"
                      />
                      <div className="mt-1 w-full border-b border-slate-700" />
                    </div>
                  ) : (
                    <div className="pt-8 w-full border-b border-slate-700" />
                  )}
                  <p className="mt-1 text-[7.5pt] text-slate-600">
                    2. / {member.parentName || "подпис на майката"} /
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </GenericDeclarationPage>
  );
};

export default ParticipationTravelPage;
