"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, PenLine, Loader2 } from "lucide-react";
import { formatFullName } from "@/lib/utils";
import { useState } from "react";
import { SignatureDialog } from "@/components/members/signature-dialog";
import { uploadFile } from "@/lib/client-storage";
import { updateMemberAction } from "@/lib/actions/members";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

const InformedConsentPage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading, refetch } = useMemberProfile(memberId);
  const { idToken } = useAuth();
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (loading) return <div className="p-8">Зареждане...</div>;
  if (!member) return <div className="p-8">Членът не е намерен.</div>;

  const fullName = formatFullName(member);
  const existingSignatureUrl =
    signatureUrl ||
    ((member as Record<string, unknown>).signedDeclarationSignatureUrl as
      | string
      | null) ||
    null;

  const handleSignatureSave = async (file: File) => {
    if (!idToken) {
      toast.error("Грешка при оторизация");
      return;
    }
    setIsSaving(true);
    try {
      const path = `signatures/${memberId}/signedDeclaration.png`;
      const url = await uploadFile(path, file, idToken);

      const result = await updateMemberAction(memberId, idToken, {
        signedDeclarationSignatureUrl: url,
        hasSignedDeclaration: true,
        signedDeclarationHandedAt: new Date().toISOString(),
      });

      if (result.success) {
        setSignatureUrl(url);
        toast.success("Подписът е запазен успешно!");
        if (refetch) refetch();
        router.refresh();
      } else {
        toast.error("Грешка при запазване на подписа");
      }
    } catch (err) {
      console.error("Signature save error:", err);
      toast.error("Грешка при качване на подписа");
    } finally {
      setIsSaving(false);
    }
  };

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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSignatureOpen(true)}
            disabled={isSaving}
            className="rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-950 transition-all font-medium text-[10px] uppercase tracking-widest"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PenLine className="mr-2 h-4 w-4" strokeWidth={1.5} />
            )}
            {existingSignatureUrl
              ? "Смени подписа"
              : "Добави електронен подпис"}
          </Button>
          <Button
            onClick={() => window.print()}
            className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl shadow-lg"
          >
            <Printer className="mr-2 h-4 w-4" /> Принтирай
          </Button>
        </div>
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
                „Бадминтон клуб Гълъбово&quot;.
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
            <div className="text-center relative min-w-[200px]">
              {existingSignatureUrl ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={existingSignatureUrl}
                    alt="Електронен подпис"
                    className="h-16 w-auto mx-auto object-contain"
                    style={{ mixBlendMode: "multiply" }}
                  />
                  <div className="border-b border-slate-400 mt-1" />
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

      <SignatureDialog
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onSave={handleSignatureSave}
        title="Подпис на Декларация"
        description={`Подпис за Декларация за информирано съгласие на ${fullName}`}
      />
    </div>
  );
};

export default InformedConsentPage;
