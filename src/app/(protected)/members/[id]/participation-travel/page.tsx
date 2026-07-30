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
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold uppercase">
              ДЕКЛАРАЦИЯ — СЪГЛАСИЕ
            </h1>
            <h2 className="mt-1 text-base font-bold uppercase">
              ЗА УЧАСТИЕ И ПЪТУВАНЕ
            </h2>
          </div>

          <div className="space-y-4 text-[11pt] leading-snug">
            <p className="font-bold">Долуподписаните:</p>

            <div className="space-y-5">
              <div>
                <p>
                  1. Баща:
                  ....................................................................................................................................................................
                </p>
                <p className="mt-1 ml-4 text-[9pt] text-slate-500 italic">
                  / име, презиме, фамилия по документ за самоличност /
                </p>
                <p className="mt-2">
                  Жител на гр./с.:
                  ..................................................................................
                  Тел.: .....................................................
                </p>
              </div>

              <div>
                <p>
                  2. Майка:
                  ..................................................................................................................................................................
                </p>
                <p className="mt-1 ml-4 text-[9pt] text-slate-500 italic">
                  / име, презиме, фамилия по документ за самоличност /
                </p>
                <p className="mt-2">
                  Жител на гр./с.:
                  ..................................................................................
                  Тел.: .....................................................
                </p>
              </div>
            </div>

            <p className="pt-6 text-center font-bold">
              ДЕКЛАРИРАМЕ, че като родители и законни представители на:
            </p>

            <div className="space-y-3 py-4">
              <p className="flex min-h-8 items-center justify-center border-b border-dotted border-slate-400 text-center text-lg font-bold">
                {fullName}
              </p>
              <p className="text-center text-[9pt] italic">
                / трите имена на детето /
              </p>

              <div className="flex gap-8 pt-2">
                <p className="flex-1">
                  с дата на раждане:{" "}
                  <strong>
                    {member.dateOfBirth
                      ? new Date(member.dateOfBirth).toLocaleDateString("bg-BG")
                      : "...................................."}
                  </strong>
                </p>
                <p className="flex-1">
                  Роден/а в гр./с.: ........................................
                </p>
              </div>
              <p className="pt-2">
                Живущ:{" "}
                <strong>
                  {member.address ||
                    "...................................................................................................."}
                </strong>
              </p>
            </div>

            <p className="pt-6 font-bold uppercase">СМЕ СЪГЛАСНИ:</p>
            <p className="text-justify">
              той/тя да тренира бадминтон, да пътува и участва на всички спортни
              мероприятия и състезания на „Бадминтон клуб Гълъбово&quot; град
              Гълъбово, с превоз, предоставен от клуба.
            </p>
            <p className="text-justify">
              Известно ни е, че за декларирани от нас неверни данни носим
              наказателна отговорност по чл. 313 от Наказателния кодекс.
            </p>

            <div className="mt-8 flex items-baseline justify-between px-4">
              <p>Дата: .........................</p>
              <p>град Гълъбово</p>
            </div>

            <div className="mt-8">
              <p className="mb-4 font-bold">ДЕКЛАРАТОРИ:</p>
              <div className="grid grid-cols-2 gap-16">
                <div className="space-y-2">
                  {existingSignatureUrl ? (
                    <div className="flex min-h-12 items-end justify-center border-b border-dotted border-slate-400 pb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={existingSignatureUrl}
                        alt="Подпис на родител 1"
                        className="h-14 w-auto object-contain"
                        // eslint-disable-next-line react/forbid-dom-props
                        style={{ mixBlendMode: "multiply" }}
                      />
                    </div>
                  ) : (
                    <p>
                      1. ....................................................
                    </p>
                  )}
                  <p className="text-[9pt] italic">/подпис на бащата/</p>
                </div>
                <div className="space-y-2">
                  <p>2. ....................................................</p>
                  <p className="text-[9pt] italic">/подпис на майката/</p>
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
