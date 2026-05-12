"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { formatFullName } from "@/lib/utils";

const ParticipationTravelPage = () => {
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
        <div className="text-center mb-10">
          <h1 className="text-xl font-bold uppercase">ДЕКЛАРАЦИЯ — СЪГЛАСИЕ</h1>
          <h2 className="text-base font-bold uppercase mt-1">
            ЗА УЧАСТИЕ И ПЪТУВАНЕ
          </h2>
        </div>

        <div className="space-y-6 text-[11pt] leading-relaxed">
          <p className="font-bold">Долуподписаните:</p>

          <div className="space-y-5">
            <div>
              <p>
                1. Баща:
                ....................................................................................................................................................................
              </p>
              <p className="text-[9pt] text-slate-500 italic ml-4 mt-1">
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
              <p className="text-[9pt] text-slate-500 italic ml-4 mt-1">
                / име, презиме, фамилия по документ за самоличност /
              </p>
              <p className="mt-2">
                Жител на гр./с.:
                ..................................................................................
                Тел.: .....................................................
              </p>
            </div>
          </div>

          <p className="font-bold pt-6 text-center">
            ДЕКЛАРИРАМЕ, че като родители и законни представители на:
          </p>

          <div className="space-y-3 py-4">
            <p className="text-center border-b border-dotted border-slate-400 min-h-8 font-bold text-lg flex items-center justify-center">
              {fullName}
            </p>
            <p className="text-[9pt] text-center italic">
              / трите имена на детето /
            </p>

            <div className="flex gap-8 pt-2">
              <p className="flex-1">
                с ЕГН:{" "}
                <strong>
                  {member.egn || "...................................."}
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
            мероприятия и състезания на „Бадминтон клуб Гълъбово“ град Гълъбово,
            с превоз, предоставен от клуба.
          </p>
          <p className="text-justify">
            Известно ни е, че за декларирани от нас неверни данни носим
            наказателна отговорност по чл. 313 от Наказателния кодекс.
          </p>

          <div className="mt-16 flex justify-between items-baseline px-4">
            <p>Дата: .........................</p>
            <p>град Гълъбово</p>
          </div>

          <div className="mt-12">
            <p className="font-bold mb-6">ДЕКЛАРАТОРИ:</p>
            <div className="grid grid-cols-2 gap-16">
              <div className="space-y-2">
                <p>1. ....................................................</p>
                <p className="text-[9pt] italic">/подпис на бащата/</p>
              </div>
              <div className="space-y-2">
                <p>2. ....................................................</p>
                <p className="text-[9pt] italic">/подпис на майката/</p>
              </div>
            </div>
          </div>
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
            padding: 15mm 20mm;
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

export default ParticipationTravelPage;
