"use client";

import React from "react";

import { useClubFeeServices } from "@/hooks/useClubFeeServices";
import { isMatchingParticipation } from "@/lib/services-fees";
import { cn, getValidAvatarUrl } from "@/lib/utils";

export interface OfficialDocumentRendererProps {
  slug?: string;
  title?: string;
  category?: string;
  headerType?: "official_club" | "none";
  addressee?: string | null;
  salutation?: string | null;
  applicantLayout?:
    "none" | "parent_for_child" | "two_parents_and_child" | "school_note";
  bodyText?: string;
  closingLocation?: string;
  pageCount?: number;

  // Data values
  memberName?: string;
  memberFirstName?: string | null;
  memberMiddleName?: string | null;
  memberLastName?: string | null;
  memberBirthDate?: string | null;
  memberEGN?: string | null;
  memberBirthPlace?: string | null;
  memberAddress?: string | null;
  memberClass?: string | null;
  memberSchool?: string | null;
  avatarUrl?: string | null;

  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  parentAddress?: string | null;

  fatherName?: string | null;
  fatherCity?: string | null;
  fatherPhone?: string | null;
  fatherEGN?: string | null;

  motherName?: string | null;
  motherCity?: string | null;
  motherPhone?: string | null;
  motherEGN?: string | null;

  participationType?: string | null;
  tournamentName?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;

  documentNumber?: string | null;
  documentDate?: string | null;

  // Signatures
  parentSignatureDataUrl?: string | null;
  secondParentSignatureDataUrl?: string | null;
  memberSignatureDataUrl?: string | null;
  presidentSignatureDataUrl?: string | null;

  parentSignedAt?: string | null;
  presidentSignedAt?: string | null;

  isPrintMode?: boolean;
}

export function OfficialDocumentRenderer({
  slug = "membershipApplication",
  title,
  headerType = "official_club",
  addressee,
  salutation,
  applicantLayout = "none",
  bodyText,
  closingLocation = "гр. Гълъбово",

  memberName = "",
  memberFirstName,
  memberMiddleName,
  memberLastName,
  memberBirthDate,
  memberEGN,
  memberBirthPlace = "гр. Гълъбово",
  memberAddress,
  memberClass,
  memberSchool = "СУ „Васил Левски“",
  avatarUrl,

  parentName,
  parentPhone,
  parentEmail,
  parentAddress,

  fatherName,
  fatherCity,
  fatherPhone,
  fatherEGN,

  motherName,
  motherCity,
  motherPhone,
  motherEGN,

  participationType = "Месечен абонамент – 1 дете (20 EUR)",
  tournamentName,
  dateFrom,
  dateTo,

  documentNumber,
  documentDate,

  parentSignatureDataUrl,
  secondParentSignatureDataUrl,
  memberSignatureDataUrl,
  presidentSignatureDataUrl,
  parentSignedAt,
  presidentSignedAt,

  isPrintMode = false,
}: OfficialDocumentRendererProps) {
  const formattedDate =
    documentDate ||
    new Date().toLocaleDateString("bg-BG").replace(/\s*г\.?$/, "");

  const formattedBirthDate = memberBirthDate
    ? new Date(memberBirthDate)
        .toLocaleDateString("bg-BG")
        .replace(/\s*г\.?$/, "")
    : null;

  const { feeOptions } = useClubFeeServices();

  // Render the official letterhead matching the PDF originals
  const renderHeader = () => {
    if (
      headerType === "none" &&
      slug !== "schoolRelease" &&
      slug !== "schoolAbsence"
    ) {
      return null;
    }

    return (
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Logo & Institution info */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/LOGO.webp"
              alt="Бадминтон клуб Гълъбово"
              className="shrink-0 object-contain size-18"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/icons/LOGO.jpg";
              }}
            />
            <div className="font-serif text-[8.5pt] leading-tight text-slate-900">
              <p className="font-bold text-slate-950">
                СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“
              </p>
              <p className="italic text-slate-800">
                гр. Гълъбово, п.к 6280, обл. Стара Загора, ул. &bdquo;Иван
                Вазов&ldquo; №22
              </p>
              <p className="text-slate-850">
                тел: <span className="font-semibold">+359 899 82 99 23</span>{" "}
                &ndash; Мира Георгиева
              </p>
              <p className="text-slate-850">
                e-mail:{" "}
                <span className="font-sans text-slate-950 font-medium">
                  bk_galabovo@abv.bg
                </span>
              </p>
            </div>
          </div>

          {/* Document registration index (without unnecessary time) */}
          {documentNumber && (
            <div className="shrink-0 text-right font-sans text-xs">
              <div className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 print:border-slate-400 print:bg-transparent">
                <div className="text-[6pt] font-bold uppercase text-slate-500">
                  Рег. индекс
                </div>
                <div className="font-mono text-[9pt] font-bold text-slate-950">
                  № {documentNumber}
                </div>
                <div className="text-[7pt] text-slate-600">
                  {formattedDate} г.
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-2.5 border-b-2 border-slate-900" />
      </div>
    );
  };

  // 1. УЧЕНИЧЕСКА БЕЛЕЖКА ЗА ЗАНИМАЛНЯ (1 страница А4)
  if (slug === "schoolRelease") {
    return (
      <div
        className={cn(
          "mx-auto max-w-[210mm] bg-white p-6 font-serif text-slate-900 leading-relaxed",
          isPrintMode ? "p-0" : "shadow-xs border border-slate-200 rounded-2xl"
        )}
      >
        {renderHeader()}

        <div className="my-8 flex justify-end">
          <div className="w-[50%] text-left font-serif text-sm">
            <p className="font-bold">До ДИРЕКТОРА на</p>
            <p className="border-b border-slate-900 pb-0.5 font-medium">
              {memberSchool || "______________________________________"}
            </p>
            <p className="border-b border-slate-900 pb-0.5 mt-1">&nbsp;</p>
          </div>
        </div>

        <div className="my-6">
          <p className="font-bold text-base">Госпо/дин/жо Директор ,</p>
        </div>

        <div className="my-6 space-y-4 text-justify text-sm leading-relaxed">
          <p className="indent-6">
            Моля, да бъде освободен/а/ от занималня учени/кът/чката{" "}
            <span className="font-bold underline">
              {memberName ||
                "__________________________________________________"}
            </span>{" "}
            от{" "}
            <span className="font-bold underline">
              {memberClass || "_____"}
            </span>{" "}
            клас на повереното Ви училище.
          </p>

          <p className="indent-6">
            Същ/ият/ата е включен/а/ в представителния отбор по бадминтон на{" "}
            <strong>„Бадминтон клуб Гълъбово” гр.Гълъбово</strong> и като
            състезател ще вземе участие в тренировъчния процес за предстоящите
            турнири и първенства.
          </p>
        </div>

        <div className="mt-20 pt-8 flex items-end justify-between text-sm">
          <div>
            <p className="italic">гр. Гълъбово</p>
          </div>
          <div className="text-right space-y-1">
            <p className="font-bold">Председател: Мира Георгиева</p>
            {presidentSignatureDataUrl ? (
              <div className="flex justify-end py-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={presidentSignatureDataUrl}
                  alt="Подпис на Председателя"
                  className="h-10 max-w-30 object-contain"
                />
              </div>
            ) : (
              <p className="border-b border-slate-900 w-44 inline-block">
                &nbsp;
              </p>
            )}
            <p className="italic text-xs">/“Бадминтон клуб Гълъбово“/</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. УЧЕНИЧЕСКА БЕЛЕЖКА ЗА УЧЕБНИ ЗАНЯТИЯ (1 страница А4)
  if (slug === "schoolAbsence") {
    return (
      <div
        className={cn(
          "mx-auto max-w-[210mm] bg-white p-6 font-serif text-slate-900 leading-relaxed",
          isPrintMode ? "p-0" : "shadow-xs border border-slate-200 rounded-2xl"
        )}
      >
        {renderHeader()}

        <div className="my-8 flex justify-end">
          <div className="w-[50%] text-left font-serif text-sm">
            <p className="font-bold">До ДИРЕКТОРА на</p>
            <p className="border-b border-slate-900 pb-0.5 font-medium">
              {memberSchool || "______________________________________"}
            </p>
            <p className="border-b border-slate-900 pb-0.5 mt-1">&nbsp;</p>
          </div>
        </div>

        <div className="my-6">
          <p className="font-bold text-base">Госпо/дин/жо Директор ,</p>
        </div>

        <div className="my-6 space-y-4 text-justify text-sm leading-relaxed">
          <p className="indent-6">
            Молим да бъде освободен/а/ от учебни занятия учени/кът/чката{" "}
            <span className="font-bold underline">
              {memberName ||
                "__________________________________________________"}
            </span>{" "}
            от{" "}
            <span className="font-bold underline">
              {memberClass || "_____"}
            </span>{" "}
            клас на повереното Ви училище за времето от{" "}
            <span className="font-bold underline">
              {dateFrom || "___________"}
            </span>{" "}
            до{" "}
            <span className="font-bold underline">
              {dateTo || "_____________"}
            </span>
            .
          </p>

          <p className="indent-6">
            Същ/ият/ата е включен/а/ в представителния отбор по бадминтон на{" "}
            <strong>„Бадминтон клуб Гълъбово” гр.Гълъбово</strong> и като
            състезател ще вземе участие в{" "}
            <span className="font-bold underline">
              {tournamentName ||
                "предстоящо спортно първенство / турнир по бадминтон"}
            </span>
            .
          </p>
        </div>

        <div className="mt-20 pt-8 flex items-end justify-between text-sm">
          <div>
            <p className="italic">гр. Гълъбово</p>
          </div>
          <div className="text-right space-y-1">
            <p className="font-bold uppercase">ПРЕДСЕДАТЕЛ :</p>
            {presidentSignatureDataUrl ? (
              <div className="flex justify-end py-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={presidentSignatureDataUrl}
                  alt="Подпис на Председателя"
                  className="h-10 max-w-30 object-contain"
                />
              </div>
            ) : (
              <p className="border-b border-slate-900 w-44 inline-block">
                &nbsp;
              </p>
            )}
            <p className="italic text-xs">/М.Георгиева/</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. ДЕКЛАРАЦИЯ — СЪГЛАСИЕ ЗА УЧАСТИЕ И ПЪТУВАНЕ (1 страница А4)
  if (slug === "travelDeclaration") {
    return (
      <div
        className={cn(
          "mx-auto max-w-[210mm] bg-white p-6 font-serif text-slate-900 leading-snug",
          isPrintMode ? "p-0" : "shadow-xs border border-slate-200 rounded-2xl"
        )}
      >
        <div className="mb-6 text-center">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-950">
            ДЕКЛАРАЦИЯ — СЪГЛАСИЕ ЗА УЧАСТИЕ И ПЪТУВАНЕ
          </h2>
        </div>

        <div className="space-y-3 text-xs leading-normal">
          <p className="font-bold">Долуподписаните:</p>

          {/* 1. Баща */}
          <div className="space-y-1">
            <p>
              1. Баща:{" "}
              <span className="font-semibold underline">
                {fatherName ||
                  parentName ||
                  "...................................................................................................................................................."}
              </span>
            </p>
            <p className="text-[8pt] text-slate-600 pl-4">
              / име, презиме, фамилия по документ за самоличност /
            </p>
            <div className="flex justify-between pl-4">
              <p>
                Жител на гр./с.:{" "}
                <span className="font-semibold underline">
                  {fatherCity ||
                    parentAddress ||
                    ".................................................................................."}
                </span>
              </p>
              <p>
                Тел.:{" "}
                <span className="font-semibold underline">
                  {fatherPhone ||
                    parentPhone ||
                    "....................................................."}
                </span>
              </p>
            </div>
          </div>

          {/* 2. Майка */}
          <div className="space-y-1 pt-1">
            <p>
              2. Майка:{" "}
              <span className="font-semibold underline">
                {motherName ||
                  "...................................................................................................................................................."}
              </span>
            </p>
            <p className="text-[8pt] text-slate-600 pl-4">
              / име, презиме, фамилия по документ за самоличност /
            </p>
            <div className="flex justify-between pl-4">
              <p>
                Жител на гр./с.:{" "}
                <span className="font-semibold underline">
                  {motherCity ||
                    ".................................................................................."}
                </span>
              </p>
              <p>
                Тел.:{" "}
                <span className="font-semibold underline">
                  {motherPhone ||
                    "....................................................."}
                </span>
              </p>
            </div>
          </div>

          {/* ДЕКЛАРИРАМЕ ЗА ДЕТЕТО */}
          <div className="pt-3 text-center">
            <p className="font-bold uppercase tracking-wide">
              ДЕКЛАРИРАМЕ, че като родители и законни представители на:
            </p>
            <p className="mt-1.5 text-sm font-bold underline">
              {memberName ||
                "...................................................................................................................................................."}
            </p>
            <p className="text-[8pt] text-slate-600">
              / трите имена на детето /
            </p>
          </div>

          <div className="flex justify-between pt-1">
            <p>
              с ЕГН:{" "}
              <span className="font-semibold underline">
                {memberEGN ||
                  "........................................................................"}
              </span>
            </p>
            <p>
              Роден/а в гр./с.:{" "}
              <span className="font-semibold underline">
                {memberBirthPlace ||
                  "........................................................"}
              </span>
            </p>
          </div>

          <p>
            Живущ:{" "}
            <span className="font-semibold underline">
              {memberAddress ||
                parentAddress ||
                "...................................................................................................................................................."}
            </span>
          </p>

          {/* СЪГЛАСИЕ И ЧЛ. 313 НК */}
          <div className="pt-2 space-y-2 text-justify">
            <p className="indent-4 font-bold">
              СМЕ СЪГЛАСНИ той/тя да тренира бадминтон, да пътува и участва на
              всички спортни мероприятия и състезания на „Бадминтон клуб
              Гълъбово“ град Гълъбово, с превоз, предоставен от клуба.
            </p>
            <p className="indent-4 text-justify">
              Известно ни е, че за декларирани от нас неверни данни носим
              наказателна отговорност по чл. 313 от Наказателния кодекс.
            </p>
          </div>

          {/* ПОДПИСИ */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <p>
                Дата: <span className="font-semibold">{formattedDate} г.</span>
              </p>
              <p>град Гълъбово</p>
            </div>

            <p className="font-bold uppercase">ДЕКЛАРАТОРИ:</p>

            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>1.</span>
                  {parentSignatureDataUrl ? (
                    <div className="inline-block border-b border-slate-900 pb-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={parentSignatureDataUrl}
                        alt="Подпис"
                        className="h-9 max-w-30 object-contain inline"
                      />
                      <span className="text-[8pt] text-slate-700 ml-2 font-sans font-bold">
                        (Електронно подписан)
                      </span>
                    </div>
                  ) : (
                    <span className="border-b border-slate-900 w-64 inline-block">
                      &nbsp;
                    </span>
                  )}
                </div>
                <span className="text-xs italic">/подпис на бащата/</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>2.</span>
                  {secondParentSignatureDataUrl ? (
                    <div className="inline-block border-b border-slate-900 pb-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={secondParentSignatureDataUrl}
                        alt="Подпис"
                        className="h-9 max-w-30 object-contain inline"
                      />
                      <span className="text-[8pt] text-slate-700 ml-2 font-sans font-bold">
                        (Електронно подписан)
                      </span>
                    </div>
                  ) : (
                    <span className="border-b border-slate-900 w-64 inline-block">
                      &nbsp;
                    </span>
                  )}
                </div>
                <span className="text-xs italic">/подпис на майката/</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. ИНСТРУКТАЖ ЗА БЕЗОПАСНО ПЪТУВАНЕ (1 страница А4)
  if (slug === "safetyInstruction") {
    const items = [
      "На състезателите се забранява да пътуват сами от и до мястото на състезанието.",
      "При неразположение или нужда по време на пътуването, да се уведоми своевременно ръководителя / треньора / на групата.",
      "Състезателите се придвижват организирано в група, под ръководството на ръководителя / треньора /.",
      "Забранява се отделянето от групата без изричното разрешение на ръководителя / треньора /.",
      "Не се разрешава храненето в превозното средство без разрешението на ръководителя / треньора / и шофьора.",
      "Ръководителя / треньора / на групата се качва последен и слиза първи от превозното средство.",
      "Състезателите поддържат добри взаимоотношения в дух на спортсменство и колегиалност с участващите в състезанието състезатели от други отбори.",
      "Забранява се носенето и използването на пиротехнически средства.",
      "Забранява се употребата на алкохол, цигари и упойващи вещества.",
      "По време на пътуването и състезанието да се спазват точно указанията на треньора.",
      "С поведението си състезателите – участници в състезанието са длъжни да не уронват престижа и авторитета на клуба.",
      "С настоящия инструктаж да се запознаят, срещу подпис в заявката-формуляр преди пътуването, всички състезатели – участници в състезанието.",
    ];

    return (
      <div
        className={cn(
          "mx-auto max-w-[210mm] bg-white p-6 font-serif text-slate-900 leading-snug",
          isPrintMode ? "p-0" : "shadow-xs border border-slate-200 rounded-2xl"
        )}
      >
        <div className="mb-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950">
            ИНСТРУКТАЖ
          </h2>
          <h3 className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-900">
            ЗА БЕЗОПАСНО ПЪТУВАНЕ И ПРОВЕЖДАНЕ НА СПОРТНО СЪСТЕЗАНИЕ
          </h3>
          <p className="mt-0.5 text-xs font-bold">2026 г.</p>
        </div>

        <div className="space-y-1.5 text-[8.5pt] leading-tight text-justify">
          {items.map((text, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="font-bold text-slate-900 shrink-0">
                ☑ {idx + 1}.
              </span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Запознат с инструктажа */}
        <div className="mt-5 pt-3 border-t border-slate-200 text-xs space-y-2.5">
          <p className="font-bold">Запознат с инструктажа:</p>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Родител:</span>
                <span className="font-semibold underline">
                  {parentName ||
                    "................................................................................................................................"}
                </span>
                {parentSignatureDataUrl && (
                  <span className="inline-block ml-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={parentSignatureDataUrl}
                      alt="Подпис на родител"
                      className="h-7 max-w-25 object-contain inline"
                    />
                  </span>
                )}
              </div>
            </div>
            <p className="text-[7.5pt] text-slate-500 pl-16">
              /име , фамилия , подпис/
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Състезател:</span>
                <span className="font-semibold underline">
                  {memberName ||
                    "................................................................................................................................"}
                </span>
                {memberSignatureDataUrl && (
                  <span className="inline-block ml-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={memberSignatureDataUrl}
                      alt="Подпис на състезател"
                      className="h-7 max-w-25 object-contain inline"
                    />
                  </span>
                )}
              </div>
            </div>
            <p className="text-[7.5pt] text-slate-500 pl-16">
              /име , фамилия , подпис/
            </p>
          </div>

          <div className="pt-2 flex justify-between items-end">
            <div className="space-y-1">
              <p>
                Дата: <span className="font-semibold">{formattedDate} г.</span>
              </p>
              <p>Място: гр. Гълъбово</p>
            </div>

            <div className="text-right space-y-0.5">
              <p className="font-bold uppercase text-xs">УТВЪРДИЛ:</p>
              <p className="font-bold text-xs">Председател: Мира Георгиева</p>
              {presidentSignatureDataUrl ? (
                <div className="flex justify-end py-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={presidentSignatureDataUrl}
                    alt="Подпис"
                    className="h-8 max-w-[110px] object-contain"
                  />
                </div>
              ) : null}
              <p className="italic text-[8.5pt]">„Бадминтон клуб Гълъбово“</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. ВЪТРЕШЕН ПРАВИЛНИК (ТОЧНО 2 СТРАНИЦИ А4)
  if (slug === "internalRules") {
    return (
      <div
        className={cn(
          "mx-auto max-w-[210mm] bg-white font-serif text-slate-900 leading-snug",
          isPrintMode ? "" : "shadow-xs border border-slate-200 rounded-2xl p-6"
        )}
      >
        {/* СТРАНИЦА 1 ОТ 2 */}
        <div className="p-4 print:p-0 min-h-[270mm] flex flex-col justify-between">
          <div>
            <div className="mb-4 text-center">
              <h2 className="text-base font-bold uppercase tracking-wide text-slate-950">
                ВЪТРЕШЕН ПРАВИЛНИК
              </h2>
              <p className="text-xs font-bold uppercase text-slate-800">
                НА СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО” град ГЪЛЪБОВО
              </p>
            </div>

            <div className="space-y-2 text-[8pt] sm:text-[8.5pt] leading-tight text-justify">
              <section>
                <h3 className="font-bold">I. Общи положения</h3>
                <p>
                  1. Настоящият правилник урежда членството, правата,
                  задълженията и взаимодействията между членовете, родителите,
                  треньорите и ръководството на СНЦ „Бадминтон клуб Гълъбово”.
                </p>
                <p>
                  2. Всеки нов член и негов родител/настойник задължително се
                  запознават с вътрешните правила.
                </p>
                <p>
                  3. Членството е доброволно и открито за всички, които желаят
                  да тренират бадминтон в клуба.
                </p>
              </section>

              <section>
                <h3 className="font-bold">II. Членство и документи</h3>
                <p>4. За да стане член на клуба, лицето предоставя:</p>
                <p className="pl-3">- Молба за членство;</p>
                <p className="pl-3">- Медицинско свидетелство;</p>
                <p className="pl-3">
                  - Заплащане на абонамент в срок от 1-во до 10-то число на
                  текущия месец.
                </p>
                <p>
                  5. При неплащане в срок, членството се счита за временно
                  прекратено до уреждане на задължението.
                </p>
              </section>

              <section>
                <h3 className="font-bold">
                  III. Финансови условия (от 01.01.2026 г.)
                </h3>
                <p>6. Членствата са както следва:</p>
                <div className="pl-3 grid grid-cols-2 gap-1 py-0.5">
                  {feeOptions.map((fee) => (
                    <p key={fee.id}>
                      ☐ {fee.name} ( {fee.price} {fee.currency} )
                    </p>
                  ))}
                </div>
                <p>7. Отстъпки:</p>
                <p className="pl-3">
                  - Второ и следващо дете от едно семейство ползва семеен
                  абонамент 2 деца или 2+ деца.
                </p>
                <p className="pl-3">
                  - При участие в повече тренировки от предвидените в месеца
                  (само за месечен абонамент), цената остава фиксирана
                  (допълнителните тренировки са бонус).
                </p>
              </section>

              <section>
                <h3 className="font-bold">IV. Тренировъчен процес</h3>
                <p>
                  8. Тренировките са с продължителност 1 ч. и 30 мин. и
                  включват: загрявка, физически упражнения, техническа
                  подготовка, свободна игра и разтягане.
                </p>
                <p>
                  9. Минимум 8 тренировки месечно. Графикът за всеки месец се
                  публикува предварително.
                </p>
              </section>

              <section>
                <h3 className="font-bold">
                  V. Права и задължения на трениращите
                </h3>
                <p>10. Всеки член е длъжен:</p>
                <p className="pl-3">- Да спазва инструкциите на треньора;</p>
                <p className="pl-3">
                  - Да идва в приличен спортен вид и подходящо облекло.
                  Маратонки/гуменки , които се използват само за залата са
                  задължителни.
                </p>
                <p className="pl-3">
                  - Да спазва дисциплина – без излишни разговори, мобилни
                  телефони, закъснения;
                </p>
                <p className="pl-3">
                  - Да не консумира храна преди/по време на тренировка (само
                  вода при нужда).
                </p>
                <p>11. Родителите са длъжни:</p>
                <p className="pl-3">
                  - Да подкрепят дисциплината и правилата на клуба;
                </p>
                <p className="pl-3">
                  - Да осигуряват присъствие на децата на тренировките и
                  състезанията, когато е необходимо;
                </p>
                <p className="pl-3">
                  - Да уведомяват треньора при отсъствие или здравословни
                  проблеми.
                </p>
              </section>

              <section>
                <h3 className="font-bold">VI. Състезания и клубни дейности</h3>
                <p>12. Задължителни състезания за картотекирани спортисти:</p>
                <p className="pl-3">- Зонални първенства;</p>
                <p className="pl-3">- Държавни лични и отборни първенства.</p>
                <p>
                  13. По желание: национални турнири, лагери, контролни срещи.
                </p>
                <p>14. Клубът осигурява:</p>
                <p className="pl-3">
                  - Пера и ракети за тренировка на новите членове;
                </p>
                <p className="pl-3">
                  - Клубна екипировка за картотекирани състезатели или членове с
                  над 6 месеца участие и без задължения.
                </p>
              </section>
            </div>
          </div>

          <div className="pt-2 text-right text-[7pt] text-slate-400 border-t border-slate-200">
            Стр. 1 от 2
          </div>
        </div>

        {/* Разделител за печат: нова страница */}
        <div className="page-break my-6 border-b-2 border-dashed border-slate-300 print:hidden" />

        {/* СТРАНИЦА 2 ОТ 2 */}
        <div className="p-4 print:p-0 min-h-[270mm] flex flex-col justify-between print:break-before-page">
          <div>
            <div className="space-y-3 text-[8.5pt] sm:text-[9pt] leading-relaxed text-justify">
              <section>
                <p>
                  При прекратяване на членството, предоставената клубна
                  екипировка се връща в добро състояние на клуба, освен ако не е
                  закупена лично от състезателя/родителя.
                </p>
                <p className="pl-3">
                  - Треньорско присъствие, транспорт и нощувки при държавни
                  лични и отборни първенства.
                </p>
                <p>
                  15. Клубът не поема ангажимент за треньорско присъствие и
                  разходи за турнири, които не са включени в спортния календар
                  на клуба за текущата година.
                </p>
              </section>

              <section>
                <h3 className="font-bold">VII. Етика и дисциплина</h3>
                <p>
                  16. Забранява се умишлено нараняване или грубо поведение към
                  съотборници или други състезатели.
                </p>
                <p>
                  17. При нарушаване на дисциплината треньорът може да наложи
                  наказания – допълнителни упражнения, временно отстраняване от
                  тренировка или лишаване от участие в състезания.
                </p>
              </section>

              <section>
                <h3 className="font-bold">VIII. Отговорности</h3>
                <p>18. Треньорът и клубът не носят отговорност при:</p>
                <p className="pl-3">
                  - Травми, настъпили поради неспазване на указанията;
                </p>
                <p className="pl-3">
                  - Приети храни преди или по време на тренировка;
                </p>
                <p className="pl-3">- Скриване на здравословни проблеми.</p>
              </section>

              <section>
                <h3 className="font-bold">IX. Заключителни разпоредби</h3>
                <p>
                  19. Всеки член получава екземпляр от правилника и се подписва,
                  че е запознат с него.
                </p>
                <p>
                  20. Правилникът може да бъде променян от Управителния съвет.
                </p>
              </section>
            </div>
          </div>

          {/* Долна част на страница 2: Редакция, Дата, Място и 3 Подписа */}
          <div className="pt-6 border-t border-slate-300 text-xs space-y-3">
            <p className="font-bold">Последна редакция: 01 януари 2026 г.</p>

            <div className="flex justify-between items-center text-xs">
              <p>
                Дата: <span className="font-semibold">{formattedDate} г.</span>
              </p>
              <p>Място: спортна зала „Енергетик“ град Гълъбово</p>
            </div>

            <p className="font-bold uppercase tracking-wide text-xs pt-1">
              Подписват:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Родител/настойник:</span>
                <div className="w-[70%] border-b border-slate-900 pb-0.5 text-right font-semibold">
                  {parentSignatureDataUrl ? (
                    <div className="flex justify-end items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={parentSignatureDataUrl}
                        alt="Подпис"
                        className="h-7 max-w-25 object-contain inline"
                      />
                      <span className="text-[7.5pt] font-sans font-bold text-slate-700">
                        ({parentName || "Подписан"})
                      </span>
                    </div>
                  ) : (
                    <span>
                      {parentName ||
                        "...................................................................................."}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Състезател:</span>
                <div className="w-[70%] border-b border-slate-900 pb-0.5 text-right font-semibold">
                  {memberSignatureDataUrl ? (
                    <div className="flex justify-end items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={memberSignatureDataUrl}
                        alt="Подпис"
                        className="h-7 max-w-25 object-contain inline"
                      />
                      <span className="text-[7.5pt] font-sans font-bold text-slate-700">
                        ({memberName || "Подписан"})
                      </span>
                    </div>
                  ) : (
                    <span>
                      {memberName ||
                        "...................................................................................."}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Председател: Мира Петрова Георгиева</span>
                <div className="w-[50%] border-b border-slate-900 pb-0.5 text-right font-semibold">
                  {presidentSignatureDataUrl ? (
                    <div className="flex justify-end items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={presidentSignatureDataUrl}
                        alt="Подпис"
                        className="h-8 max-w-[110px] object-contain inline"
                      />
                      <span className="text-[7.5pt] font-sans font-bold text-slate-700">
                        (Мира Георгиева)
                      </span>
                    </div>
                  ) : (
                    <span>
                      ............................................................
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 text-right text-[7pt] text-slate-400">
              Стр. 2 от 2
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. МОЛБА ЗА ЧЛЕНСТВО (1 страница А4)
  if (slug === "membershipApplication") {
    return (
      <div
        className={cn(
          "mx-auto max-w-[210mm] bg-white p-6 font-serif text-slate-900 leading-snug",
          isPrintMode ? "p-0" : "shadow-xs border border-slate-200 rounded-2xl"
        )}
      >
        {renderHeader()}

        <div className="mb-3 text-center">
          <h2 className="text-base font-bold uppercase tracking-[0.2em] text-slate-950">
            М О Л Б А
          </h2>
          <p className="text-xs font-semibold uppercase text-slate-800">
            за членство в СНЦ „Бадминтон клуб Гълъбово“ град Гълъбово
          </p>
        </div>

        {/* Адресат */}
        <div className="mb-3 flex justify-end">
          <div className="w-[55%] text-left text-xs leading-tight">
            <p className="font-bold text-slate-950 uppercase">ДО</p>
            <p className="font-bold text-slate-950">ПРЕДСЕДАТЕЛЯ НА</p>
            <p className="font-bold text-slate-950">
              СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“
            </p>
            <p className="font-medium text-slate-800">ГРАД ГЪЛЪБОВО</p>
          </div>
        </div>

        {/* Структуриран блок ОТ / ЗА */}
        <div className="mb-3 rounded-md border border-slate-300 bg-slate-50/70 p-2 text-xs">
          <div className="grid grid-cols-[45px_1fr] items-baseline gap-x-2 gap-y-1">
            <span className="font-bold text-slate-900">ОТ:</span>
            <span className="border-b border-dotted border-slate-500 pb-0.5 text-slate-950">
              {parentName ? (
                <>
                  <strong className="font-bold">{parentName}</strong>
                  {parentAddress ? `, ${parentAddress}` : ""}
                  {parentPhone ? `, тел.: ${parentPhone}` : ""}
                  {parentEmail ? `, e-mail: ${parentEmail}` : ""}
                </>
              ) : (
                <span className="text-slate-500 italic">
                  (трите имена на родителя/настойника, адрес, тел., e-mail)
                </span>
              )}
            </span>

            <span className="font-bold text-slate-900">ЗА:</span>
            <span className="border-b border-dotted border-slate-500 pb-0.5 text-slate-950">
              <strong className="font-bold text-slate-950">
                {memberName ||
                  "...................................................................................."}
              </strong>
              {formattedBirthDate ? ` (род. ${formattedBirthDate} г.)` : ""}
              <span className="ml-2 text-[7.5pt] text-slate-600 italic">
                (състезател / член на клуба)
              </span>
            </span>
          </div>
        </div>

        {/* Същински текст */}
        <div className="space-y-2.5 text-xs leading-relaxed text-justify">
          <p className="font-bold text-slate-950">
            Уважаема госпожо Председател,
          </p>

          <p className="indent-4">
            Моля, да приемете горепосочения кандидат{" "}
            <strong className="underline underline-offset-2">
              {memberName ||
                "........................................................"}
            </strong>{" "}
            за редовен член на СНЦ „Бадминтон клуб Гълъбово“, считано от{" "}
            <span className="font-bold">{formattedDate} г.</span>
          </p>

          {/* Форма на участие с чисти отметки */}
          <div className="rounded-md border border-slate-300 bg-slate-50/70 p-2.5 text-xs">
            <p className="font-bold uppercase text-[8pt] text-slate-950">
              ИЗБИРАМ/Е СЛЕДНАТА ФОРМА НА УЧАСТИЕ:
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-xs">
              {feeOptions.map((opt) => {
                const isSelected =
                  isMatchingParticipation(participationType, opt.label) ||
                  isMatchingParticipation(participationType, opt.radioLabel) ||
                  isMatchingParticipation(participationType, opt.name);
                return (
                  <div key={opt.id} className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center size-3.5 rounded-xs border text-[8pt] font-bold",
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-400 bg-white text-transparent"
                      )}
                    >
                      ✓
                    </span>
                    <span
                      className={
                        isSelected
                          ? "font-bold text-slate-950"
                          : "text-slate-700"
                      }
                    >
                      {opt.radioLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Декларации */}
          <div className="space-y-1.5 text-xs text-justify">
            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-900">☑</span>
              <span>
                Декларирам, че съм подробно запознат/а с Вътрешния правилник на
                СНЦ „Бадминтон клуб Гълъбово“, приемам неговите клаузи и се
                задължавам аз и моето дете стриктно да го спазваме.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-900">☑</span>
              <span>
                Запознат/а съм, че при евентуално прекратяване на членството се
                подава писмена молба по образец и се връща цялата предоставена
                клубна материална база и състезателна екипировка (ако има
                предоставена такава).
              </span>
            </div>
          </div>
        </div>

        {/* Подпис */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-end text-xs">
          <div>
            <p>Спортна зала „Енергетик“, град Гълъбово</p>
            <p className="mt-1">
              Дата: <span className="font-semibold">{formattedDate} г.</span>
            </p>
          </div>

          <div className="text-right">
            <p className="font-bold">Родител / Настойник:</p>
            {parentSignatureDataUrl ? (
              <div className="flex justify-end items-center gap-2 py-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={parentSignatureDataUrl}
                  alt="Подпис"
                  className="h-9 max-w-30 object-contain inline"
                />
                <span className="text-[7.5pt] font-sans font-bold text-slate-700">
                  (Електронно подписан)
                </span>
              </div>
            ) : (
              <p className="border-b border-slate-900 w-48 inline-block mt-2">
                &nbsp;
              </p>
            )}
            <p className="text-[7.5pt] text-slate-600 italic">/подпис/</p>
          </div>
        </div>
      </div>
    );
  }

  // 7. ДЕКЛАРАЦИЯ ЗА ИНФОРМИРАНО СЪГЛАСИЕ (1 страница А4)
  if (slug === "signedDeclaration") {
    return (
      <div
        className={cn(
          "mx-auto max-w-[210mm] bg-white p-6 font-serif text-slate-900 leading-snug",
          isPrintMode ? "p-0" : "shadow-xs border border-slate-200 rounded-2xl"
        )}
      >
        {renderHeader()}

        <div className="mb-4 text-center">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-950">
            ДЕКЛАРАЦИЯ
          </h2>
          <h3 className="text-xs font-bold uppercase text-slate-800">
            За информирано съгласие
          </h3>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-justify">
          <p>
            В качеството си на: Родител / Настойник на:{" "}
            <strong className="underline underline-offset-2">
              {memberName ||
                "...................................................................................."}
            </strong>
            {formattedBirthDate
              ? `, дата на раждане: ${formattedBirthDate} г.`
              : ""}
          </p>

          <p className="font-bold uppercase tracking-wide">ДЕКЛАРИРАМ, ЧЕ:</p>

          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              Запознат/а съм и приемам Правилника за вътрешния ред на „Бадминтон
              клуб Гълъбово”.
            </li>
            <li>
              Доброволно желая аз / моето дете да участва в тренировъчния и
              състезателен процес на клуба.
            </li>
            <li>
              Запознат/а съм с рисковете от травми и наранявания, съпътстващи
              спортната дейност.
            </li>
            <li>
              Декларирам, че аз / моето дете е клинично здраво/здрав и няма
              медицински противопоказания за практикуване на спорт.
            </li>
            <li>
              Давам съгласието си за събиране, съхранение и обработка на личните
              ми данни / данните на моето дете от клуба, съгласно изискванията
              на ЗЗЛД и GDPR, единствено за целите на тренировъчната и
              спортно-състезателната дейност.
            </li>
            <li>
              Давам съгласието си клубът да прави снимки и видеоклипове по време
              на тренировки и състезания с цел популяризиране на дейността.
            </li>
          </ol>

          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end">
            <div>
              <p>Място: гр. Гълъбово</p>
              <p className="mt-1">
                Дата: <span className="font-semibold">{formattedDate} г.</span>
              </p>
              <p className="text-[8pt] text-slate-600 mt-1">
                СНЦ „Бадминтон клуб Гълъбово”
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold">Декларатор (Родител):</p>
              {parentSignatureDataUrl ? (
                <div className="flex justify-end items-center gap-2 py-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={parentSignatureDataUrl}
                    alt="Подпис"
                    className="h-9 max-w-30 object-contain inline"
                  />
                  <span className="text-[7.5pt] font-sans font-bold text-slate-700">
                    (Електронно подписан)
                  </span>
                </div>
              ) : (
                <p className="border-b border-slate-900 w-48 inline-block mt-2">
                  &nbsp;
                </p>
              )}
              <p className="text-[7.5pt] text-slate-600 italic">/подпис/</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 8. КАРТОН НА СЪСТЕЗАТЕЛЯ (БФБадминтон) - ТОЧНО КОПИЕ 1:1 (2 карти на лист А4)
  if (slug === "athleteCard" || slug === "competitorCard") {
    const renderSingleCompetitorCard = () => {
      const parts = (memberName || "").trim().split(/\s+/);
      const displayFirst = memberFirstName || parts[0] || "";
      const displayMiddle =
        memberMiddleName ||
        (parts.length > 2 ? parts.slice(1, -1).join(" ") : "");
      const displayLast =
        memberLastName || (parts.length > 1 ? parts[parts.length - 1] : "");

      return (
        <div className="border border-slate-400 bg-white p-3 font-serif text-slate-900 leading-tight">
          {/* Top Section: Photo and Centered Title */}
          <div className="flex items-start justify-between gap-4 mb-3">
            {/* Снимка 3x4 */}
            <div className="h-28 w-22 shrink-0 border border-slate-700 bg-slate-50 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getValidAvatarUrl(avatarUrl)}
                  alt={memberName}
                  className="object-cover size-full"
                />
              ) : (
                <span className="text-[10pt] font-serif text-slate-400 italic">
                  Снимка
                </span>
              )}
            </div>

            {/* Заглавие */}
            <div className="flex-1 text-center pr-6 pt-1">
              <h1 className="text-base sm:text-lg font-bold tracking-tight uppercase text-slate-950">
                БЪЛГАРСКА ФЕДЕРАЦИЯ БАДМИНТОН
              </h1>
              <h2 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-900 mt-0.5">
                КАРТОН НА СЪСТЕЗАТЕЛЯ
              </h2>
            </div>
          </div>

          {/* Info Block: Club (Left) and Athlete (Right) */}
          <div className="grid grid-cols-12 gap-x-4 text-[9pt] mb-3">
            {/* Club Column */}
            <div className="col-span-5 space-y-2">
              <div>
                <p className="border-b border-dotted border-slate-800 font-bold text-[9.5pt] pb-0.5">
                  Бадминтон клуб Гълъбово
                </p>
                <p className="text-[7pt] text-slate-600 italic">/клуб/</p>
              </div>
              <div>
                <p className="border-b border-dotted border-slate-800 text-[9pt] pb-0.5">
                  гр. Гълъбово
                </p>
                <p className="text-[7pt] text-slate-600 italic">гр.</p>
              </div>
              <div className="pt-1">
                <div className="flex items-end justify-between border-b border-dotted border-slate-800 pb-0.5">
                  <span className="text-[8.5pt]">Председател:</span>
                  <span className="font-semibold text-[8.5pt]">
                    Мира Георгиева
                  </span>
                </div>
                <p className="text-[7pt] text-slate-600 italic">
                  /Подпис, печат/
                </p>
              </div>
            </div>

            {/* Athlete Column */}
            <div className="col-span-7 space-y-1.5 pl-2 border-l border-slate-200">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[8.5pt] whitespace-nowrap">Име:</span>
                <span className="flex-1 border-b border-dotted border-slate-800 font-bold text-[9.5pt] px-1 truncate">
                  {displayFirst}
                </span>
                <span className="text-[8.5pt] whitespace-nowrap">бащино:</span>
                <span className="flex-1 border-b border-dotted border-slate-800 font-bold text-[9.5pt] px-1 truncate">
                  {displayMiddle || "........................"}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-[8.5pt] whitespace-nowrap">фамилия:</span>
                <span className="flex-1 border-b border-dotted border-slate-800 font-bold text-[9.5pt] px-1 truncate">
                  {displayLast}
                </span>
                <span className="text-[8.5pt] whitespace-nowrap">ЕГН:</span>
                <span className="min-w-24 border-b border-dotted border-slate-800 font-bold text-[9.5pt] px-1 tracking-wider text-center">
                  {memberEGN || "........................"}
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[8.5pt] whitespace-nowrap">Адрес:</span>
                  <span className="flex-1 border-b border-dotted border-slate-800 text-[8.5pt] px-1 truncate">
                    {memberAddress ||
                      "...................................................................................."}
                  </span>
                </div>
                <p className="text-[7pt] text-slate-600 italic pl-11">
                  /Град, ул. № вх. ап./
                </p>
              </div>
            </div>
          </div>

          {/* Table (6 columns x 2 rows) */}
          <div className="w-full">
            <table className="w-full border-collapse border border-slate-900 text-[7pt] leading-tight">
              <thead>
                <tr className="divide-x divide-slate-900 border-b border-slate-900">
                  {[...Array(6)].map((_, i) => (
                    <th
                      key={i}
                      className="w-1/6 p-1 text-left font-normal space-y-0.5 bg-slate-50/50"
                    >
                      <p className="font-bold text-[7.5pt]">Мед. преглед</p>
                      <p>Дата..........</p>
                      <p>Периодичен</p>
                      <div className="pt-1.5 flex justify-between items-end">
                        <span>Подпис..........</span>
                        <span className="italic text-[6pt]">печат</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="divide-x divide-slate-900">
                  {[...Array(6)].map((_, i) => (
                    <td
                      key={i}
                      className="w-1/6 p-1 align-top space-y-0.5 h-16"
                    >
                      <p className="font-bold text-[7.5pt]">Заверка за</p>
                      <p className="font-bold text-[7.5pt]">Правоучастие</p>
                      <p>Дата..........</p>
                      <p>Въз. група</p>
                      <div className="pt-1 flex justify-between items-end">
                        <span>Председател..........</span>
                        <span className="italic text-[6pt]">печат</span>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div
        className={cn(
          "mx-auto max-w-[210mm] bg-white font-serif text-slate-900",
          isPrintMode
            ? "p-0"
            : "shadow-xs border border-slate-200 rounded-2xl p-4"
        )}
      >
        {renderSingleCompetitorCard()}

        <div className="my-3 flex items-center justify-center gap-2 text-slate-400 text-[8pt] print:my-2">
          <span>✂</span>
          <div className="h-px flex-1 border-t border-dashed border-slate-300" />
          <span className="uppercase tracking-widest text-[7pt]">
            Линия за изрязване (2 карти на лист А4)
          </span>
          <div className="h-px flex-1 border-t border-dashed border-slate-300" />
          <span>✂</span>
        </div>

        {renderSingleCompetitorCard()}
      </div>
    );
  }

  // 9. ДОГОВОР ЗА СПОРТИСТИ С АМАТЬОРСКИ СТАТУТ (2 страници А4)
  if (slug === "amateurContract") {
    return (
      <div
        className={cn(
          "mx-auto max-w-[210mm] bg-white font-serif text-slate-900 leading-snug",
          isPrintMode ? "" : "shadow-xs border border-slate-200 rounded-2xl p-6"
        )}
      >
        {/* СТРАНИЦА 1 ОТ 2 */}
        <div className="p-4 print:p-0 min-h-[270mm] flex flex-col justify-between">
          <div>
            <div className="mb-4 text-center">
              <h2 className="text-base font-bold uppercase tracking-[0.2em] text-slate-950">
                Д О Г О В О Р
              </h2>
              <p className="text-xs font-semibold text-slate-800">
                / за спортисти с аматьорски статут /
              </p>
            </div>

            <div className="space-y-3 text-[8.5pt] leading-tight text-justify">
              <p className="indent-4">
                Днес, <span className="font-semibold">{formattedDate} г.</span>{" "}
                в гр. Гълъбово между „Бадминтон клуб Гълъбово” и лицето:
              </p>
              <p className="font-bold border-b border-dotted border-slate-800 pb-0.5 text-center text-[9.5pt]">
                {memberName ||
                  "...................................................................................................................................................."}
              </p>
              <p className="text-right text-[8pt] text-slate-700 italic">
                представляван/а от лицата:
              </p>

              <div className="space-y-1.5 pl-2">
                <p>
                  1. Баща:{" "}
                  <span className="font-semibold underline">
                    {fatherName ||
                      parentName ||
                      "...................................................................................................................................................."}
                  </span>
                </p>
                <p>
                  2. Майка:{" "}
                  <span className="font-semibold underline">
                    {motherName ||
                      "...................................................................................................................................................."}
                  </span>
                </p>
              </div>

              <p className="indent-4">
                наричан/а за по-кратко „Състезател”, се сключи настоящият
                договор, чиято цел е уреждането на отношенията между „Бадминтон
                клуб Гълъбово” и „Състезателят” за периода от една година от
                деня на подписването на настоящия договор.
              </p>

              <div className="pt-2">
                <h3 className="font-bold uppercase tracking-wide text-xs text-slate-950 mb-1">
                  ЗАДЪЛЖЕНИЯ И ПРАВА НА СТРАНИТЕ
                </h3>
                <h4 className="font-bold text-[9pt] text-slate-900 mb-1.5">
                  I. „БАДМИНТОН КЛУБ ГЪЛЪБОВО”:
                </h4>
                <ul className="space-y-1.5 pl-2">
                  <li>
                    - „Бадминтон клуб Гълъбово” се задължава да предоставя
                    необходимата методическа помощ и условия за провеждането на
                    тренировъчна дейност на „Състезателя”, да го картотекира в
                    БФБадминтон и да му предостави по този начин възможност да
                    участва в прояви от календара на БФБ / вътрешен и
                    международен/.
                  </li>
                  <li>
                    - „Бадминтон клуб Гълъбово” се задължава да защитава
                    интересите на „Състезателя” пред БФБадминтон, пред
                    Националния треньор, Националния Селекционер и пред
                    средствата за масово осведомяване.
                  </li>
                  <li>
                    - „Бадминтон клуб Гълъбово” няма право да извършва действия
                    или бездействия, които водят до накърняване на интересите и
                    уронване на престижа на „Състезателя”.
                  </li>
                  <li>
                    - „Бадминтон клуб Гълъбово” има право да продава или отдава
                    състезателните права на „Състезателя” в съответствие с
                    наредбите на БФБадминтон, с неговото и на родителите му
                    знание.
                  </li>
                  <li>
                    - „Бадминтон клуб Гълъбово” има право да използва
                    „Състезателя” във всички прояви от календара на БФБадминтон
                    / вътрешни и международни/ за срока, посочен в този договор
                    в съответствие в наредбата, одобрена от БФБадминтон.
                  </li>
                  <li>
                    - „Бадминтон клуб Гълъбово” има право за използва
                    „Състезателя” и името му за реклама на „Бадминтон клуб
                    Гълъбово” и на дейността му за периода, в който договора е
                    валиден със знанието и съгласието на „Състезателя”.
                  </li>
                  <li>
                    - „Бадминтон клуб Гълъбово” има право да премира
                    „Състезателя” за постигнати резултати с решение на треньора,
                    Председателя или Управителния съвет на „Бадминтон клуб
                    Гълъбово”.
                  </li>
                  <li>
                    - „Бадминтон клуб Гълъбово” има право да прекрати
                    едностранно договора със „Състезателя” при неизпълнение на
                    неговите задължения, уронване престижа на „Бадминтон клуб
                    Гълъбово” или неспазване правилата, установени и изискуеми в
                    „Бадминтон клуб Гълъбово” и БФБадминтон.
                  </li>
                </ul>
              </div>

              <div className="pt-1">
                <h4 className="font-bold text-[9pt] text-slate-900 mb-1">
                  II. „СЪСТЕЗАТЕЛЯТ”
                </h4>
                <ul className="space-y-1.5 pl-2">
                  <li>
                    - „Състезателят” се задължава да участва редовно в
                    тренировъчния процес, с необходимата сериозност и
                    дисциплинираност, изискана от ръководителите на „Бадминтон
                    клуб Гълъбово”.
                  </li>
                  <li>
                    - „Състезателят” се задължава да вземе участие в спортните
                    прояви определени от „Бадминтон клуб Гълъбово”, като се
                    задължава да го направи по възможно най-добрия отговорен
                    начин.
                  </li>
                  <li>
                    - „Състезателят” се задължава да информира „Бадминтон клуб
                    Гълъбово” своевременно за заболявания и контузии.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-2 text-right text-[7pt] text-slate-400 border-t border-slate-200">
            Стр. 1 от 2
          </div>
        </div>

        {/* Разделител за печат */}
        <div className="page-break my-6 border-b-2 border-dashed border-slate-300 print:hidden" />

        {/* СТРАНИЦА 2 ОТ 2 */}
        <div className="p-4 print:p-0 min-h-[270mm] flex flex-col justify-between print:break-before-page">
          <div>
            <div className="space-y-2.5 text-[8.5pt] leading-tight text-justify">
              <ul className="space-y-1.5 pl-2">
                <li>
                  - „Състезателят” се задължава да информира „Бадминтон клуб
                  Гълъбово” за всичко, което касае спортно-състезателната му
                  дейност в този клуб и в националните отбори, ако бъде повикан
                  в тях.
                </li>
                <li>
                  - „Състезателят” се задължава да брани на първо място
                  интересите на „Бадминтон клуб Гълъбово” , в съответствие с
                  политиката му и с негово знание по всички въпроси, които
                  касаят „Бадминтон клуб Гълъбово”.
                </li>
                <li>
                  - „Състезателят” се задължава да внася в срок членския си
                  внос, определен от „Бадминтон клуб Гълъбово”.
                </li>
                <li>
                  - „Състезателят” няма право да уронва престижа на „Бадминтон
                  клуб Гълъбово” , като извършва действия или бездействия, които
                  могат да доведат до нежелани последствия за „Бадминтон клуб
                  Гълъбово” или за лица, които членуват или са
                  ръководители/треньори, председателя, управителен съвет в
                  „Бадминтон клуб Гълъбово”.
                </li>
                <li>
                  - „Състезателят” има право да изисква от „Бадминтон клуб
                  Гълъбово” нужната му информация, свързана с неговото участие в
                  тренировъчно-състезателния процес.
                </li>
                <li>
                  - „Състезателят” има право да получава поущрителни награди от
                  „Бадминтон клуб Гълъбово” за постигнати резултати определени
                  от треньора, Председателя и Управителния съвет на „Бадминтон
                  клуб Гълъбово”.
                </li>
                <li>
                  - „Състезателят” има право да иска съдействие от „Бадминтон
                  клуб Гълъбово” по въпроси, касаещи неговата подготовка,
                  участието му в състезанията и участието в националните отбори.
                </li>
                <li>
                  - „Състезателят” има право да получи помощ от „Бадминтон клуб
                  Гълъбово” в спорове с БФБ във връзка с наложените му
                  дисциплинарни или други наказания.
                </li>
                <li>
                  - „Състезателят” има право да прекрати едностранно договора
                  при неспазване на задълженията на „Бадминтон клуб Гълъбово”,
                  посочени по-горе или ако „Бадминтон клуб Гълъбово” не защитава
                  неговите интереси пред необходимите институции.
                </li>
              </ul>

              <div className="pt-2">
                <h4 className="font-bold uppercase tracking-wide text-xs text-slate-950 mb-1.5">
                  ДОПЪЛНИТЕЛНИ РАЗПОРЕДБИ
                </h4>
                <ul className="space-y-1.5 pl-2">
                  <li>
                    - Застраховките на състезателя се правят от самия него в
                    срок, избран от него и за продължителност, за която той
                    прецени, като „Бадминтон клуб Гълъбово” не носи отговорност
                    за липсата на застраховка при настъпване на болест,
                    контузии, и други застрахователни събития, по време на
                    състезания и тренировки.
                  </li>
                  <li>
                    - Този договор се прекратява автоматично при настъпването на
                    следните събития:
                    <div className="pl-4 pt-1 space-y-0.5">
                      <p>
                        1. При промяна на местоживеенето на „Състезателя” , но
                        при изрично негово настояване.
                      </p>
                      <p>
                        2. При прекратяване на състезателната дейност на
                        „Състезателят”.
                      </p>
                    </div>
                  </li>
                  <li>
                    - Този договор се сключва за срок от една година и съдържа
                    уговорката, че действието му се подновява автоматично за
                    следващ период от една година, освен някоя от страните не
                    отправи писмено предизвестие до другата, в срок от една
                    седмица, считано от датата, на която изтича срока на
                    договора.
                  </li>
                  <li>
                    - Настоящият договор се изготвя в два еднообразни
                    екземпляра, по един за всяка страна.
                  </li>
                  <li>
                    - Споровете, не посочени в този договор се решават според
                    Наредбите и Правилниците на БФБадминтон.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Подписи на стр. 2 */}
          <div className="pt-6 border-t border-slate-300 text-xs">
            <div className="grid grid-cols-2 gap-8 items-end">
              <div>
                <p className="font-bold">„Бадминтон клуб Гълъбово”</p>
                <div className="mt-2 flex items-center gap-2">
                  <span>Председател:</span>
                  {presidentSignatureDataUrl ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={presidentSignatureDataUrl}
                        alt="Подпис"
                        className="h-8 max-w-[110px] object-contain inline"
                      />
                      <span className="text-[7.5pt] font-sans font-bold text-slate-700 ml-1">
                        (Мира Георгиева)
                      </span>
                    </div>
                  ) : (
                    <span className="font-semibold">Мира Георгиева</span>
                  )}
                </div>
              </div>

              <div className="space-y-4 text-right">
                <div>
                  <div className="border-b border-slate-900 pb-0.5 font-semibold">
                    {memberSignatureDataUrl ? (
                      <div className="flex justify-end items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={memberSignatureDataUrl}
                          alt="Подпис"
                          className="h-7 max-w-25 object-contain inline"
                        />
                        <span className="text-[7.5pt] font-sans font-bold text-slate-700">
                          ({memberName || "Подписан"})
                        </span>
                      </div>
                    ) : (
                      <span>
                        {memberName ||
                          "...................................................."}
                      </span>
                    )}
                  </div>
                  <p className="text-[7.5pt] text-slate-600 italic">
                    / име на състезателя, подпис /
                  </p>
                </div>

                <div>
                  <div className="border-b border-slate-900 pb-0.5 font-semibold">
                    {parentSignatureDataUrl ? (
                      <div className="flex justify-end items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={parentSignatureDataUrl}
                          alt="Подпис"
                          className="h-7 max-w-25 object-contain inline"
                        />
                        <span className="text-[7.5pt] font-sans font-bold text-slate-700">
                          ({parentName || fatherName || "Подписан"})
                        </span>
                      </div>
                    ) : (
                      <span>
                        {parentName ||
                          fatherName ||
                          "...................................................."}
                      </span>
                    )}
                  </div>
                  <p className="text-[7.5pt] text-slate-600 italic">
                    / име на родителя, подпис /
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 text-right text-[7pt] text-slate-400">
              Стр. 2 от 2
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 10. МОЛБА ЗА КАРТОТЕКИРАНЕ (ПЪЛНОЛЕТЕН) (1 страница А4)
  if (slug === "licenseApplicationAdult") {
    return (
      <div
        className={cn(
          "mx-auto max-w-[210mm] bg-white p-8 font-serif text-slate-900 leading-relaxed",
          isPrintMode ? "p-0" : "shadow-xs border border-slate-200 rounded-2xl"
        )}
      >
        <div className="my-6 flex justify-end">
          <div className="w-[50%] text-left text-xs leading-tight font-serif">
            <p className="font-bold text-slate-950">До Председателя</p>
            <p className="font-bold text-slate-950">
              На „Бадминтон клуб Гълъбово”
            </p>
            <p className="font-medium text-slate-800">гр. Гълъбово</p>
          </div>
        </div>

        <div className="my-8 text-center">
          <h2 className="text-xl font-bold uppercase tracking-[0.25em] text-slate-950">
            М О Л Б А
          </h2>
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-800">
            от
          </p>
        </div>

        <div className="my-6 space-y-1 text-center">
          <p className="border-b border-dotted border-slate-800 font-bold text-sm pb-1">
            {memberName ||
              "................................................................................................................................"}
          </p>
          <p className="border-b border-dotted border-slate-800 font-bold text-xs pb-1">
            {memberEGN
              ? `ЕГН: ${memberEGN}`
              : "ЕГН: ...................................................."}
            {memberAddress
              ? `, адрес: ${memberAddress}`
              : ", адрес: ........................................................................"}
          </p>
          <p className="text-[7.5pt] text-slate-600 italic">
            / трите имена , ЕГН , адрес /
          </p>
        </div>

        <div className="my-10 space-y-4 text-justify text-sm leading-relaxed">
          <p className="font-bold">Уважаеми г-н/г-жо Председател,</p>
          <p className="indent-6">
            моля да бъда картотекиран/а/, като състезател на{" "}
            <strong>„БАДМИНТОН КЛУБ ГЪЛЪБОВО”</strong> гр. Гълъбово за{" "}
            {new Date().getFullYear()} г.
          </p>
        </div>

        <div className="mt-24 pt-8 flex items-end justify-between text-xs">
          <div className="space-y-1">
            <p>{formattedDate} г.</p>
            <p>гр. Гълъбово</p>
          </div>

          <div className="text-right space-y-1">
            <p className="font-bold">С уважение:</p>
            {memberSignatureDataUrl ? (
              <div className="flex justify-end items-center gap-2 py-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={memberSignatureDataUrl}
                  alt="Подпис"
                  className="h-9 max-w-30 object-contain inline"
                />
                <span className="text-[7.5pt] font-sans font-bold text-slate-700">
                  ({memberName})
                </span>
              </div>
            ) : (
              <p className="border-b border-slate-900 w-48 inline-block mt-2">
                &nbsp;
              </p>
            )}
            <p className="text-[7.5pt] text-slate-600 italic">
              / име, фамилия, подпис /
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 11. МОЛБА ЗА КАРТОТЕКИРАНЕ НА ДЕТЕ (ОТ РОДИТЕЛИ) (1 страница А4)
  if (
    slug === "licenseApplicationMinor" ||
    (slug === "licenseApplication" &&
      memberBirthDate &&
      new Date().getFullYear() - new Date(memberBirthDate).getFullYear() < 18)
  ) {
    return (
      <div
        className={cn(
          "mx-auto max-w-[210mm] bg-white p-8 font-serif text-slate-900 leading-relaxed",
          isPrintMode ? "p-0" : "shadow-xs border border-slate-200 rounded-2xl"
        )}
      >
        <div className="my-6 flex justify-end">
          <div className="w-[50%] text-left text-xs leading-tight font-serif uppercase">
            <p className="font-bold text-slate-950">ДО</p>
            <p className="font-bold text-slate-950">ПРЕДСЕДАТЕЛЯ</p>
            <p className="font-bold text-slate-950">
              НА „БАДМИНТОН КЛУБ ГЪЛЪБОВО”
            </p>
            <p className="font-medium text-slate-800">ГР. ГЪЛЪБОВО</p>
          </div>
        </div>

        <div className="my-6 text-center">
          <h2 className="text-xl font-bold uppercase tracking-[0.25em] text-slate-950">
            М О Л Б А
          </h2>
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-800">
            ОТ
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold">1.</span>
              <span className="flex-1 border-b border-dotted border-slate-800 pb-0.5 font-semibold">
                {fatherName || parentName
                  ? `${fatherName || parentName}${fatherEGN ? `, ЕГН: ${fatherEGN}` : ""}${fatherCity || parentAddress ? `, ${fatherCity || parentAddress}` : ""}`
                  : "................................................................................................................................................"}
              </span>
            </div>
            <p className="text-[7.5pt] text-slate-600 italic pl-5">
              /трите имена , ЕГН , адрес на родител /
            </p>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold">2.</span>
              <span className="flex-1 border-b border-dotted border-slate-800 pb-0.5 font-semibold">
                {motherName
                  ? `${motherName}${motherEGN ? `, ЕГН: ${motherEGN}` : ""}${motherCity ? `, ${motherCity}` : ""}`
                  : "................................................................................................................................................"}
              </span>
            </div>
            <p className="text-[7.5pt] text-slate-600 italic pl-5">
              /трите имена , ЕГН , адрес на родител /
            </p>
          </div>
        </div>

        <div className="my-8 space-y-3 text-justify text-xs leading-relaxed">
          <p className="font-bold">
            Уважаеми/а г-н/г-жо Председател, молим синът ни /дъщеря ни/
          </p>
          <p className="border-b border-dotted border-slate-800 pb-1 font-bold text-sm text-center">
            {memberName ||
              "................................................................................................................................"}
          </p>
          <p className="indent-6">
            да бъде картотекиран/а/, като състезател на{" "}
            <strong>„БАДМИНТОН КЛУБ ГЪЛЪБОВО”</strong> гр. Гълъбово за{" "}
            {new Date().getFullYear()} г.
          </p>
        </div>

        <div className="mt-16 pt-6 flex items-end justify-between text-xs">
          <div className="space-y-1">
            <p>{formattedDate} г.</p>
            <p>гр. Гълъбово</p>
          </div>

          <div className="text-right space-y-3">
            <p className="font-bold">С уважение:</p>
            <div className="flex items-center justify-end gap-2">
              <span>1.</span>
              {parentSignatureDataUrl ? (
                <div className="border-b border-slate-900 pb-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={parentSignatureDataUrl}
                    alt="Подпис"
                    className="h-7 max-w-25 object-contain inline"
                  />
                  <span className="text-[7.5pt] font-sans font-bold text-slate-700 ml-1">
                    ({parentName || fatherName || "Баща"})
                  </span>
                </div>
              ) : (
                <span className="border-b border-slate-900 w-44 inline-block">
                  &nbsp;
                </span>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <span>2.</span>
              {secondParentSignatureDataUrl ? (
                <div className="border-b border-slate-900 pb-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={secondParentSignatureDataUrl}
                    alt="Подпис"
                    className="h-7 max-w-25 object-contain inline"
                  />
                  <span className="text-[7.5pt] font-sans font-bold text-slate-700 ml-1">
                    ({motherName || "Майка"})
                  </span>
                </div>
              ) : (
                <span className="border-b border-slate-900 w-44 inline-block">
                  &nbsp;
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 12. Диспачер за пълнолетен при licenseApplication
  if (slug === "licenseApplication") {
    return (
      <OfficialDocumentRenderer
        slug="licenseApplicationAdult"
        title={title}
        headerType={headerType}
        addressee={addressee}
        salutation={salutation}
        applicantLayout={applicantLayout}
        bodyText={bodyText}
        closingLocation={closingLocation}
        memberName={memberName}
        memberFirstName={memberFirstName}
        memberMiddleName={memberMiddleName}
        memberLastName={memberLastName}
        memberBirthDate={memberBirthDate}
        memberEGN={memberEGN}
        memberBirthPlace={memberBirthPlace}
        memberAddress={memberAddress}
        memberClass={memberClass}
        memberSchool={memberSchool}
        avatarUrl={avatarUrl}
        parentName={parentName}
        parentPhone={parentPhone}
        parentEmail={parentEmail}
        parentAddress={parentAddress}
        fatherName={fatherName}
        fatherCity={fatherCity}
        fatherPhone={fatherPhone}
        fatherEGN={fatherEGN}
        motherName={motherName}
        motherCity={motherCity}
        motherPhone={motherPhone}
        motherEGN={motherEGN}
        participationType={participationType}
        tournamentName={tournamentName}
        dateFrom={dateFrom}
        dateTo={dateTo}
        documentNumber={documentNumber}
        documentDate={documentDate}
        parentSignatureDataUrl={parentSignatureDataUrl}
        secondParentSignatureDataUrl={secondParentSignatureDataUrl}
        memberSignatureDataUrl={memberSignatureDataUrl}
        presidentSignatureDataUrl={presidentSignatureDataUrl}
        parentSignedAt={parentSignedAt}
        presidentSignedAt={presidentSignedAt}
        isPrintMode={isPrintMode}
      />
    );
  }

  // 13. ДРУГИ ИЛИ ПЕРСОНАЛИЗИРАНИ ДОКУМЕНТИ (Универсален рендер)
  return (
    <div
      className={cn(
        "mx-auto max-w-[210mm] bg-white p-6 font-serif text-slate-900 leading-relaxed",
        isPrintMode ? "p-0" : "shadow-xs border border-slate-200 rounded-2xl"
      )}
    >
      {renderHeader()}

      {title && (
        <div className="mb-4 text-center">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-950">
            {title}
          </h2>
        </div>
      )}

      {addressee && (
        <div className="mb-4 flex justify-end">
          <div className="w-[50%] text-left text-xs whitespace-pre-line font-bold">
            {addressee}
          </div>
        </div>
      )}

      {salutation && (
        <div className="my-3">
          <p className="font-bold text-sm">{salutation}</p>
        </div>
      )}

      {applicantLayout === "parent_for_child" && (
        <div className="mb-4 rounded-md border border-slate-300 bg-slate-50/70 p-2 text-xs">
          <div className="grid grid-cols-[45px_1fr] items-baseline gap-x-2 gap-y-1">
            <span className="font-bold text-slate-900">ОТ:</span>
            <span className="border-b border-dotted border-slate-500 pb-0.5 text-slate-950">
              {parentName ||
                "...................................................................................."}
            </span>

            <span className="font-bold text-slate-900">ЗА:</span>
            <span className="border-b border-dotted border-slate-500 pb-0.5 text-slate-950 font-bold">
              {memberName ||
                "...................................................................................."}
            </span>
          </div>
        </div>
      )}

      <div className="my-4 space-y-3 text-xs leading-relaxed text-justify whitespace-pre-line">
        {bodyText || "Съдържание на документа..."}
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end text-xs">
        <div>
          <p>{closingLocation}</p>
          <p className="mt-1">
            Дата: <span className="font-semibold">{formattedDate} г.</span>
          </p>
        </div>

        <div className="text-right">
          <p className="font-bold">Подпис:</p>
          {parentSignatureDataUrl ? (
            <div className="flex justify-end items-center gap-2 py-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={parentSignatureDataUrl}
                alt="Подпис"
                className="h-9 max-w-30 object-contain inline"
              />
              <span className="text-[7.5pt] font-sans font-bold text-slate-700">
                (Подписан)
              </span>
            </div>
          ) : (
            <p className="border-b border-slate-900 w-44 inline-block mt-2">
              &nbsp;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
