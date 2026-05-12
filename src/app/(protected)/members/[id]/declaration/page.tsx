"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { formatFullName } from "@/lib/utils";

const InformedConsentPage = () => {
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
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold uppercase tracking-widest">
            ДЕКЛАРАЦИЯ
          </h1>
          <h2 className="text-base font-bold uppercase mt-1">
            За информирано съгласие
          </h2>
        </div>

        <div className="space-y-4 text-[10.5pt] leading-relaxed text-justify">
          <p>
            Долуподписаният/ата
            ...............................................................................................................................................
          </p>
          <p>
            ЕГН: ...................................................., телефон
            за връзка:
            ...................................................................................
          </p>

          <div className="mt-4 text-left">
            В качеството си на:
            <div className="mt-2 ml-6 space-y-1">
              <p>☐ Лично (за пълнолетни лица)</p>
              <p>
                ☐ Родител / Настойник на: <strong>{fullName}</strong>, ЕГН:{" "}
                <strong>
                  {member.egn || "...................................."}
                </strong>
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <p className="font-bold">ДЕКЛАРИРАМ, ЧЕ:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Запознат/а съм и приемам Правилника за вътрешния ред на
                „Бадминтон клуб Гълъбово“.
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

          <div className="mt-16 flex justify-between items-end">
            <div>
              <p>Дата: ........................ г.</p>
              <p>Гр. Гълъбово</p>
            </div>
            <div className="text-center">
              <p>
                Декларатор: ....................................................
              </p>
              <p className="text-[9pt]">(подпис)</p>
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

export default InformedConsentPage;
