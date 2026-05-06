"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { formatFullName } from "@/lib/utils";

const DeclarationPage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading } = useMemberProfile(memberId);

  if (loading) return <div className="p-8">Зареждане...</div>;
  if (!member) return <div className="p-8">Членът не е намерен.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white min-h-screen">
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
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20"
        >
          <Printer className="mr-2 h-4 w-4" /> Принтирай
        </Button>
      </div>

      {/* Printable Area */}
      <div className="print-area space-y-6 text-slate-900 text-justify leading-relaxed">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-black uppercase tracking-widest">
            Декларация
          </h1>
          <h2 className="text-lg font-bold text-slate-600 uppercase tracking-wider mt-1">
            За информирано съгласие
          </h2>
        </div>

        <p className="text-lg">
          Долуподписаният/ата
          ....................................................................................................,
        </p>
        <p className="text-lg">
          ЕГН: ...................................................., телефон за
          връзка: ...........................................,
        </p>
        <div className="mt-6 text-lg">
          В качеството си на:
          <div className="mt-2 ml-4 space-y-2">
            <p>[ ] Лично (за пълнолетни лица)</p>
            <p>
              [ ] Родител / Настойник на:{" "}
              <strong>{formatFullName(member)}</strong>, ЕГН:
              ....................................................
            </p>
          </div>
        </div>

        <div className="my-12 space-y-6">
          <p className="font-bold text-lg">ДЕКЛАРИРАМ, ЧЕ:</p>
          <ol className="list-decimal pl-6 space-y-4 text-lg">
            <li>
              Запознат/а съм и приемам Правилника за вътрешния ред на
              &quot;Бадминтон клуб Гълъбово&quot;.
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
        </div>

        <div className="mt-24 flex justify-between text-lg">
          <div>
            <p>Дата: ........................ г.</p>
            <p>Гр. Гълъбово</p>
          </div>
          <div className="text-center">
            <p>Декларатор: ........................................</p>
            <p className="text-sm text-slate-500">(подпис)</p>
          </div>
        </div>
      </div>

      {/* Global styles for printing to hide everything else */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
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
            width: 100%;
            padding: 40px;
          }
        }
      `,
        }}
      />
    </div>
  );
};

export default DeclarationPage;
