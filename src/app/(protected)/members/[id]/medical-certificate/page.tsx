"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useMemberProfile } from "@/hooks/useMemberProfile";
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
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-4 font-serif md:p-8">
      {/* Non-printable header */}
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 size-4" /> Назад
        </Button>
        <Button
          onClick={() => window.print()}
          className="rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800"
        >
          <Printer className="mr-2 size-4" /> Принтирай
        </Button>
      </div>

      <div className="print-area text-slate-900">
        {/* Document Header with From/To */}
        <div className="mb-12 flex items-start justify-between text-[11pt]">
          <div className="max-w-[45%]">
            <p className="mb-1 font-bold uppercase">ОТ:</p>
            <div className="mb-1 min-h-12 w-full border-b border-slate-400"></div>
            <p className="text-[8pt] leading-tight text-slate-500 italic">
              (печат на лечебното заведение, име на лекар и изх. номер)
            </p>
          </div>

          <div className="max-w-[45%] text-right">
            <p className="mb-1 font-bold uppercase">ДО:</p>
            <p className="font-bold">СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“</p>
            <p className="uppercase">град Гълъбово</p>
          </div>
        </div>

        <div className="mb-16 text-center">
          <h1 className="inline-block border-b-2 border-slate-950 pb-1 text-2xl font-bold tracking-widest uppercase">
            МЕДИЦИНСКО СВИДЕТЕЛСТВО
          </h1>
        </div>

        <div className="space-y-12 text-[12pt] leading-relaxed">
          <div className="space-y-4">
            <p className="text-center text-lg font-bold uppercase">
              УДОСТОВЕРЯВАМ, ЧЕ:
            </p>
            <div className="space-y-1 pt-2">
              <p className="flex min-h-8 items-end justify-center border-b border-slate-400 px-4 text-center text-xl font-bold italic">
                {fullName}
              </p>
              <p className="text-center text-[10pt] text-slate-500 italic">
                / име, презиме, фамилия на състезателя /
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-6 py-2">
            <p className="text-lg">
              с дата на раждане:{" "}
              <strong>
                {member.dateOfBirth
                  ? new Date(member.dateOfBirth).toLocaleDateString("bg-BG")
                  : "...................................."}
              </strong>
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-10 text-center shadow-sm">
            <p className="text-xl leading-relaxed font-medium text-slate-800 italic">
              „Лицето е клинично здраво и може да спортува активно, да участва в
              тренировъчния и състезателния процес на Бадминтон клуб Гълъбово.“
            </p>
          </div>

          <div className="mt-16 flex items-end justify-between px-8 pt-8">
            <div className="space-y-1">
              <p>Дата: .........................</p>
              <p>Гр. Гълъбово</p>
            </div>

            <div className="space-y-3 text-center">
              <div className="flex min-h-12 w-72 items-end justify-center border-b border-slate-400"></div>
              <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                ПОДПИС И ПЕЧАТ НА ЛЕКАРЯ
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20 border-t border-slate-100 pt-3 text-center text-[8pt] text-slate-400">
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
