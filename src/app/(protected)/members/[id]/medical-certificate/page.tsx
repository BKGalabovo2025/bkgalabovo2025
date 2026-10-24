"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

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
  const displayDate = docDate
    ? new Date(docDate).toLocaleDateString("bg-BG")
    : new Date().toLocaleDateString("bg-BG");

  if (loading) return <div className="p-8">Зареждане...</div>;
  if (!member) return <div className="p-8">Членът не е намерен.</div>;

  const fullName = formatFullName(member);

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
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-4 font-serif md:p-8">
      {/* Non-printable header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button
          variant="outline"
          onClick={handleBack}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 size-4" /> Назад
        </Button>
        <div className="flex items-center gap-2">
          {/* Interactive Date Picker */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs">
            <span className="text-[11px] font-medium text-zinc-500">Дата:</span>
            <input
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-900 focus:outline-none cursor-pointer"
            />
          </div>

          <Button
            onClick={() => window.print()}
            className="rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800"
          >
            <Printer className="mr-2 size-4" /> Принтирай
          </Button>
        </div>
      </div>

      <div className="print-area relative text-slate-900">
        <ClubOfficialDocumentHeader
          documentKey="medicalCertificate"
          overrideDate={displayDate}
        />

        {/* Medical Issuer Block */}
        <div className="mb-6 flex items-start justify-between text-xs">
          <div className="max-w-[55%]">
            <p className="mb-1 font-bold uppercase">
              ИЗДАДЕНО ОТ ЛЕЧЕБНО ЗАВЕДЕНИЕ:
            </p>
            <div className="mb-1 min-h-10 w-full border-b border-dotted border-slate-400"></div>
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
              &bdquo;Лицето е клинично здраво и няма медицински противопоказания
              за активно практикуване на бадминтон, участие в тренировъчния
              процес и състезания на Бадминтон клуб Гълъбово.&ldquo;
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
                <span className="inline-block min-w-28 border-b border-slate-700 pb-0.5"></span>
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
