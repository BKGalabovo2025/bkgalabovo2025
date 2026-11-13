"use client";

import { ArrowLeft, Calendar, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { ClubOfficialDocumentHeader } from "@/components/shared/members/ClubOfficialDocumentHeader";
import { Button } from "@/components/ui/button";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { formatFullName } from "@/lib/utils";

const MedicalCertificatePage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading } = useMemberProfile(memberId);
  const [docDate, setDocDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [clinicName, setClinicName] = useState<string>("");
  const [doctorName, setDoctorName] = useState<string>("");
  const [city, setCity] = useState<string>("гр. Гълъбово");

  const displayDate = docDate
    ? new Date(docDate).toLocaleDateString("bg-BG")
    : new Date().toLocaleDateString("bg-BG");

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 p-8 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
        Зареждане...
      </div>
    );
  }
  if (!member) {
    return (
      <div className="min-h-screen bg-zinc-100 p-8 text-rose-600 dark:bg-zinc-950 dark:text-rose-400">
        Членът не е намерен.
      </div>
    );
  }

  const fullName = formatFullName(member);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/members/${memberId}/documents`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-4 md:p-8 dark:bg-zinc-950 print:min-h-0 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        {/* Compact PageHeader */}
        <PageHeader
          title="Медицинско свидетелство"
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Членове", href: "/members" },
            { label: fullName, href: `/members/${memberId}` },
            { label: "Документи", href: `/members/${memberId}/documents` },
            { label: "Медицинско свидетелство" },
          ]}
          className="print:hidden"
        />

        {/* Non-printable toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-xs backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            <ArrowLeft className="mr-2 size-4" /> Назад
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {/* Interactive Date Picker */}
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800">
              <Calendar className="size-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Дата:
              </span>
              <input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="cursor-pointer rounded bg-transparent text-xs font-semibold text-zinc-900 focus:outline-none dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <Button
              size="sm"
              onClick={() => window.print()}
              className="rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Printer className="mr-2 size-4" /> Принтирай
            </Button>
          </div>
        </div>

        {/* Inline Editable Fields Bar */}
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-3.5 shadow-xs sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900/95 print:hidden">
          <div className="space-y-1">
            <label
              htmlFor="clinicName"
              className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
            >
              Лечебно заведение / Клиника
            </label>
            <input
              id="clinicName"
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="напр. МБАЛ / ДКЦ..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="doctorName"
              className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
            >
              Лекар (име / рег. №)
            </label>
            <input
              id="doctorName"
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="напр. д-р Иванов..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="city"
              className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
            >
              Град / село
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="гр. Гълъбово"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        <div className="print-area relative rounded-2xl bg-white p-6 font-serif text-slate-900 shadow-sm md:p-10 print:rounded-none print:p-0 print:shadow-none">
          <ClubOfficialDocumentHeader
            documentKey="medicalCertificate"
            overrideDate={displayDate}
          />

          {/* Medical Issuer Block */}
          <div className="mb-6 flex items-start justify-between text-xs">
            <div className="w-[55%]">
              <p className="mb-1 font-bold uppercase">
                ИЗДАДЕНО ОТ ЛЕЧЕБНО ЗАВЕДЕНИЕ:
              </p>
              <div className="mb-1 min-h-10 w-full border-b border-dotted border-slate-400 pb-1 text-sm font-semibold text-slate-900">
                {clinicName || doctorName ? (
                  <div className="space-y-0.5">
                    {clinicName && <p>{clinicName}</p>}
                    {doctorName && (
                      <p className="text-xs font-normal text-slate-700">
                        Лекар: {doctorName}
                      </p>
                    )}
                  </div>
                ) : (
                  "\u00A0"
                )}
              </div>
              <p className="text-[8pt] leading-tight text-slate-500 italic">
                (наименование на лечебното заведение, име на лекар, рег./изх.
                номер)
              </p>
            </div>

            <div className="max-w-[40%] text-right">
              <p className="mb-1 font-bold uppercase">ЗА ПРЕДСТАВЯНЕ ПРЕД:</p>
              <p className="font-bold">СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“</p>
              <p className="text-slate-600">град Гълъбово</p>
            </div>
          </div>

          <div className="mb-6 text-center">
            <h1 className="inline-block border-b-2 border-slate-950 pb-1 text-xl font-bold tracking-widest uppercase">
              МЕДИЦИНСКО СВИДЕТЕЛСТВО
            </h1>
          </div>

          <div className="space-y-6 text-[11pt] leading-relaxed">
            <div className="space-y-2">
              <p className="text-center text-base font-bold uppercase tracking-wider">
                УДОСТОВЕРЯВАМ, ЧЕ:
              </p>
              <div className="space-y-1 pt-1">
                <p className="flex min-h-8 items-end justify-center border-b border-slate-400 px-4 text-center text-lg font-bold italic">
                  {fullName}
                </p>
                <p className="text-center text-[9pt] text-slate-500 italic">
                  / име, презиме, фамилия на състезателя /
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-6 py-1 text-base">
              <p>
                с дата на раждане:{" "}
                <strong>
                  {member.dateOfBirth
                    ? new Date(member.dateOfBirth).toLocaleDateString("bg-BG")
                    : "_______________"}
                </strong>
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 text-center shadow-xs">
              <p className="text-lg leading-relaxed font-medium text-slate-900 italic">
                &bdquo;Лицето е клинично здраво и няма медицински
                противопоказания за активно практикуване на бадминтон, участие в
                тренировъчния процес и състезания на Бадминтон клуб
                Гълъбово.&ldquo;
              </p>
            </div>

            <div className="mt-8 flex items-end justify-between px-2 pt-4">
              <div className="space-y-1.5 text-xs font-serif">
                <div>
                  Дата:{" "}
                  <span className="inline-block min-w-32 border-b border-slate-700 pb-0.5 font-medium">
                    {displayDate}
                  </span>{" "}
                  г.
                </div>
                <div>
                  Гр. / с.:{" "}
                  <span className="inline-block min-w-28 border-b border-slate-700 pb-0.5 font-medium">
                    {city || "\u00A0"}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-center">
                <div className="w-64 border-b border-slate-700 pt-8"></div>
                <p className="text-[8.5pt] font-bold tracking-wider text-slate-800 uppercase">
                  ПОДПИС И ПЕЧАТ НА ЛЕКАРЯ
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-2 text-center text-[8pt] text-slate-400">
            <p>
              СНЦ „Бадминтон клуб Гълъбово“ — Административна документация —{" "}
              {new Date().getFullYear()} г.
            </p>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
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
            font-size: 11pt !important;
            line-height: 1.4 !important;
          }
        }
      `,
        }}
      />
    </div>
  );
};

export default MedicalCertificatePage;
