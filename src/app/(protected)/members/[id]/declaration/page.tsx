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
      {({ member, fullName, existingSignatureUrl }) => (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-xl font-bold tracking-widest uppercase">
              ДЕКЛАРАЦИЯ
            </h1>
            <h2 className="mt-1 text-base font-bold uppercase">
              За информирано съгласие
            </h2>
          </div>

          <div className="space-y-4 text-justify text-[10.5pt] leading-relaxed">
            <p>
              Долуподписаният/ата
              ...............................................................................................................................................
            </p>
            <p>
              дата на раждане:
              ...................................................., телефон за
              връзка:
              ...................................................................................
            </p>

            <div className="mt-4 text-left">
              В качеството си на:
              <div className="mt-2 ml-6 space-y-1">
                <p>☐ Лично (за пълнолетни лица)</p>
                <p>
                  ☐ Родител / Настойник на: <strong>{fullName}</strong>, дата на
                  раждане:{" "}
                  <strong>
                    {member.dateOfBirth
                      ? new Date(member.dateOfBirth).toLocaleDateString("bg-BG")
                      : "...................................."}
                  </strong>
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <p className="font-bold">ДЕКЛАРИРАМ, ЧЕ:</p>
              <ol className="list-decimal space-y-2 pl-6">
                <li>
                  Запознат/а съм и приемам Правилника за вътрешния ред на
                  „Бадминтон клуб Гълъбово&quot;.
                </li>
                <li>
                  Доброволно желая аз / моето дете да участва в тренировъчния и
                  състезателен процес на клуба.
                </li>
                <li>
                  Запознат/а съм с рисковете от травми и наранявания,
                  съпътстващи спортната дейност.
                </li>
                <li>
                  Декларирам, че аз / моето дете е клинично здраво/здрав и няма
                  медицински противопоказания за практикуване на спорт.
                </li>
                <li>
                  Давам съгласието си за събиране, съхранение и обработка на
                  личните ми данни / данните на моето дете от клуба, съгласно
                  изискванията на ЗЗЛД и GDPR, единствено за целите на
                  тренировъчната и спортно-състезателната дейност.
                </li>
                <li>
                  Давам съгласието си клубът да прави снимки и видеоклипове по
                  време на тренировки и състезания с цел популяризиране на
                  дейността.
                </li>
              </ol>
            </div>

            <div className="mt-16 flex items-end justify-between">
              <div>
                <p>Дата: ........................ г.</p>
                <p>Гр. Гълъбово</p>
              </div>
              <div className="relative min-w-50 text-center">
                {existingSignatureUrl ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={existingSignatureUrl}
                      alt="Електронен подпис"
                      className="mx-auto h-16 w-auto object-contain"
                      // eslint-disable-next-line react/forbid-dom-props
                      style={{ mixBlendMode: "multiply" }}
                    />
                    <div className="mt-1 border-b border-slate-400" />
                  </div>
                ) : (
                  <p>
                    Декларатор:
                    ....................................................
                  </p>
                )}
                <p className="text-[9pt]">(подпис)</p>
              </div>
            </div>
          </div>
        </>
      )}
    </GenericDeclarationPage>
  );
};

export default InformedConsentPage;
