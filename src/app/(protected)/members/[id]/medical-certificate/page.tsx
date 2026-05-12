"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { formatFullName } from "@/lib/utils";

const MedicalCertificatePage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading } = useMemberProfile(memberId);

  if (loading) return <div className="p-8">Зареждане...</div>;
  if (!member) return <div className="p-8">Членът не е намерен.</div>;

  const fullName = formatFullName(member);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white min-h-screen font-serif">
      {/* Non-printable header */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад
        </Button>
        <Button
          onClick={() => window.print()}
          className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl shadow-lg"
        >
          <Printer className="mr-2 h-4 w-4" /> Принтирай
        </Button>
      </div>

      <div className="print-area text-slate-900">
        {/* Document Header with From/To */}
        <div className="flex justify-between items-start mb-12 text-[11pt]">
          <div className="max-w-[45%]">
            <p className="font-bold uppercase mb-1">ОТ:</p>
            <div className="border-b border-slate-400 w-full min-h-12 mb-1"></div>
            <p className="text-[8pt] text-slate-500 italic leading-tight">
              (печат на лечебното заведение, име на лекар и изх. номер)
            </p>
          </div>

          <div className="text-right max-w-[45%]">
            <p className="font-bold uppercase mb-1">ДО:</p>
            <p className="font-bold">СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“</p>
            <p className="uppercase">град Гълъбово</p>
          </div>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-2xl font-bold uppercase tracking-widest border-b-2 border-slate-950 inline-block pb-1">
            МЕДИЦИНСКО СВИДЕТЕЛСТВО
          </h1>
        </div>

        <div className="space-y-12 text-[12pt] leading-relaxed">
          <div className="space-y-4">
            <p className="font-bold uppercase text-center text-lg">
              УДОСТОВЕРЯВАМ, ЧЕ:
            </p>
            <div className="pt-2 space-y-1">
              <p className="text-center border-b border-slate-400 min-h-8 flex items-end justify-center font-bold text-xl px-4 italic">
                {fullName}
              </p>
              <p className="text-[10pt] text-center italic text-slate-500">
                / име, презиме, фамилия на състезателя /
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-6 py-2">
            <p className="text-lg">
              с ЕГН:{" "}
              <strong>
                {member.egn || "...................................."}
              </strong>
            </p>
          </div>

          <div className="bg-slate-50 p-10 rounded-xl border border-slate-100 text-center shadow-sm">
            <p className="text-xl font-medium leading-relaxed italic text-slate-800">
              „Лицето е клинично здраво и може да спортува активно, да участва в
              тренировъчния и състезателния процес на Бадминтон клуб Гълъбово.“
            </p>
          </div>

          <div className="mt-16 flex justify-between items-end px-8 pt-8">
            <div className="space-y-1">
              <p>Дата: .........................</p>
              <p>Гр. Гълъбово</p>
            </div>

            <div className="text-center space-y-3">
              <div className="border-b border-slate-400 w-72 min-h-12 flex items-end justify-center"></div>
              <p className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                ПОДПИС И ПЕЧАТ НА ЛЕКАРЯ
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center text-[8pt] text-slate-400 border-t border-slate-100 pt-3">
          <p>
            СНЦ „Бадминтон клуб Гълъбово“ — Административна документация — 2026
            г.
          </p>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm 25mm;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `,
        }}
      />
    </div>
  );
};

export default MedicalCertificatePage;
