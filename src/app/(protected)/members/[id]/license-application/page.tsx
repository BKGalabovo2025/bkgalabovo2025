"use client";

import { ArrowLeft, Calendar, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { formatFullName } from "@/lib/utils";

const LicenseApplicationPage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading } = useMemberProfile(memberId);

  // Auto-detect if minor or adult based on date of birth
  const isMinorDefault = (() => {
    if (!member?.dateOfBirth) return true;
    const birthYear = new Date(member.dateOfBirth).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear < 18;
  })();

  const [formType, setFormType] = useState<"minor" | "adult">(
    isMinorDefault ? "minor" : "adult"
  );

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const displayDate = useMemo(() => {
    if (!selectedDate) return new Date().toLocaleDateString("bg-BG");
    const parts = selectedDate.split("-");
    if (parts.length === 3) {
      return `${parseInt(parts[2], 10)}.${parseInt(parts[1], 10)}.${parts[0]}`;
    }
    return new Date().toLocaleDateString("bg-BG");
  }, [selectedDate]);

  if (loading) return <div className="p-8">Зареждане...</div>;
  if (!member) return <div className="p-8">Членът не е намерен.</div>;

  const fullName = formatFullName(member);
  const yearStr = selectedDate
    ? selectedDate.split("-")[0]
    : new Date().getFullYear().toString();

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
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-4 md:p-12">
      {/* Non-printable header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button
          variant="outline"
          onClick={handleBack}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 size-4" /> Назад
        </Button>

        {/* Date Selector */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
          <Calendar className="size-3.5 text-slate-500" />
          <span className="font-semibold text-slate-600">Дата:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent font-medium text-slate-900 outline-none cursor-pointer"
            title="Редактирай датата на молбата"
          />
        </div>

        {/* Toggle between minor and adult form */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setFormType("minor")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              formType === "minor"
                ? "bg-white text-slate-950 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-950"
            }`}
          >
            Непълнолетно дете (от родители)
          </button>
          <button
            type="button"
            onClick={() => setFormType("adult")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              formType === "adult"
                ? "bg-white text-slate-950 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-950"
            }`}
          >
            Пълнолетен състезател
          </button>
        </div>

        <Button
          onClick={() => window.print()}
          className="rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800"
        >
          <Printer className="mr-2 size-4" /> Принтирай
        </Button>
      </div>

      {/* Printable Area - Exactly 1 Page A4 */}
      <div className="print-area font-serif text-slate-900 leading-relaxed">
        {formType === "minor" ? (
          // ================= МОЛБА ЗА КАРТОТЕКИРАНЕ (ОТ РОДИТЕЛИ) =================
          <div>
            <div className="my-6 flex justify-end">
              <div className="w-[50%] space-y-0.5 text-left text-xs uppercase leading-tight">
                <p className="font-bold text-slate-950">ДО</p>
                <p className="font-bold text-slate-950">ПРЕДСЕДАТЕЛЯ</p>
                <p className="font-bold text-slate-950">
                  НА „БАДМИНТОН КЛУБ ГЪЛЪБОВО”
                </p>
                <p className="font-medium text-slate-800">ГР. ГЪЛЪБОВО</p>
              </div>
            </div>

            <div className="my-8 text-center">
              <h1 className="text-2xl font-bold tracking-[0.3em] text-slate-950 uppercase">
                М О Л Б А
              </h1>
              <p className="mt-3 text-sm font-bold tracking-wider text-slate-800 uppercase">
                ОТ
              </p>
            </div>

            <div className="my-6 space-y-4 text-xs">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-sm">1.</span>
                  <span className="flex-1 border-b border-dotted border-slate-800 pb-0.5 font-semibold text-[10pt]">
                    {member.fatherName || member.parentName ? (
                      <>
                        <strong className="font-bold">
                          {member.fatherName || member.parentName}
                        </strong>
                        {member.fatherEGN ? `, ЕГН: ${member.fatherEGN}` : ""}
                        {member.fatherCity || member.address
                          ? `, адрес: ${member.fatherCity || member.address}`
                          : ""}
                      </>
                    ) : (
                      "\u00A0"
                    )}
                  </span>
                </div>
                <p className="pl-6 text-[7.5pt] text-slate-600 italic">
                  /трите имена , ЕГН , адрес на родител /
                </p>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-sm">2.</span>
                  <span className="flex-1 border-b border-dotted border-slate-800 pb-0.5 font-semibold text-[10pt]">
                    {member.motherName ? (
                      <>
                        <strong className="font-bold">
                          {member.motherName}
                        </strong>
                        {member.motherEGN ? `, ЕГН: ${member.motherEGN}` : ""}
                        {member.motherCity
                          ? `, адрес: ${member.motherCity}`
                          : ""}
                      </>
                    ) : (
                      "\u00A0"
                    )}
                  </span>
                </div>
                <p className="pl-6 text-[7.5pt] text-slate-600 italic">
                  /трите имена , ЕГН , адрес на родител /
                </p>
              </div>
            </div>

            <div className="my-10 space-y-4 text-justify text-sm leading-relaxed">
              <p className="font-bold">
                Уважаеми/а г-н/г-жо Председател, молим синът ни /дъщеря ни/
              </p>
              <p className="border-b border-dotted border-slate-800 pb-1 text-center font-bold text-base text-slate-950">
                {fullName}
              </p>
              <p className="indent-6">
                да бъде картотекиран/а/, като състезател на{" "}
                <strong>„БАДМИНТОН КЛУБ ГЪЛЪБОВО”</strong> гр. Гълъбово за{" "}
                <span className="font-bold">{yearStr} г.</span>
              </p>
            </div>

            <div className="mt-28 flex items-end justify-between pt-8 text-xs">
              <div className="space-y-1">
                <p>
                  <span className="font-semibold">{displayDate} г.</span>
                </p>
                <p>гр. Гълъбово</p>
              </div>

              <div className="space-y-4 text-right">
                <p className="font-bold">С уважение:</p>
                <div className="flex items-center justify-end gap-2">
                  <span>1.</span>
                  <span className="inline-block w-52 border-b border-slate-900 pb-0.5 text-center font-semibold">
                    {member.parentName || member.fatherName || "\u00A0"}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span>2.</span>
                  <span className="inline-block w-52 border-b border-slate-900 pb-0.5 text-center font-semibold">
                    {member.motherName || "\u00A0"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // ================= МОЛБА ЗА КАРТОТЕКИРАНЕ (ПЪЛНОЛЕТЕН) =================
          <div>
            <div className="my-6 flex justify-end">
              <div className="w-[50%] space-y-0.5 text-left text-xs leading-tight">
                <p className="font-bold text-slate-950">До Председателя</p>
                <p className="font-bold text-slate-950">
                  На „Бадминтон клуб Гълъбово”
                </p>
                <p className="font-medium text-slate-800">гр. Гълъбово</p>
              </div>
            </div>

            <div className="my-8 text-center">
              <h1 className="text-2xl font-bold tracking-[0.3em] text-slate-950 uppercase">
                М О Л Б А
              </h1>
              <p className="mt-3 text-sm font-bold tracking-wider text-slate-800 uppercase">
                от
              </p>
            </div>

            <div className="my-6 space-y-1.5 text-center">
              <p className="border-b border-dotted border-slate-800 pb-1 text-base font-bold text-slate-950">
                {fullName}
              </p>
              <p className="border-b border-dotted border-slate-800 pb-1 text-sm font-semibold">
                {member.egn
                  ? `ЕГН: ${member.egn}`
                  : "ЕГН: ______________________"}
                {member.address
                  ? `, адрес: ${member.address}`
                  : ", адрес: ________________________________"}
              </p>
              <p className="text-[7.5pt] text-slate-600 italic">
                /трите имена , ЕГН , адрес /
              </p>
            </div>

            <div className="my-10 space-y-4 text-justify text-sm leading-relaxed">
              <p className="font-bold">Уважаеми г-н/г-жо Председател,</p>
              <p className="indent-6">
                моля да бъда картотекиран/а/, като състезател на{" "}
                <strong>„БАДМИНТОН КЛУБ ГЪЛЪБОВО”</strong> гр. Гълъбово за{" "}
                <span className="font-bold">{yearStr} г.</span>
              </p>
            </div>

            <div className="mt-32 flex items-end justify-between pt-8 text-xs">
              <div className="space-y-1">
                <p>
                  <span className="font-semibold">{displayDate} г.</span>
                </p>
                <p>гр. Гълъбово</p>
              </div>

              <div className="space-y-2 text-right">
                <p className="font-bold">С уважение:</p>
                <div className="inline-block w-56 border-b border-slate-900 pb-0.5 text-center font-semibold">
                  {fullName}
                </div>
                <p className="text-[7.5pt] text-slate-600 italic">
                  /име,фамилия,подпис/
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 20mm 15mm 20mm;
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
        }
      `,
        }}
      />
    </div>
  );
};

export default LicenseApplicationPage;
