"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, PenLine, Loader2 } from "lucide-react";
import { formatFullName } from "@/lib/utils";
import { useState } from "react";
import { SignatureDialog } from "@/components/members/signature-dialog";
import { uploadFile } from "@/services/storage-service";
import { updateMemberAction } from "@/lib/actions/members";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

const SafetyInstructionPage = () => {
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
    ((member as Record<string, unknown>).safetyInstructionSignatureUrl as
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
      const path = `signatures/${memberId}/safetyInstruction.png`;
      const url = await uploadFile(path, file, idToken);

      const result = await updateMemberAction(memberId, idToken, {
        safetyInstructionSignatureUrl: url,
        hasSafetyInstruction: true,
        safetyInstructionHandedAt: new Date().toISOString(),
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
        <div className="text-center mb-10">
          <h1 className="text-xl font-bold uppercase">ИНСТРУКТАЖ</h1>
          <h2 className="text-base font-bold uppercase mt-1 leading-tight">
            ЗА БЕЗОПАСНО ПЪТУВАНЕ И ПРОВЕЖДАНЕ НА СПОРТНО СЪСТЕЗАНИЕ
          </h2>
          <p className="mt-2 text-lg font-bold">20.......... г.</p>
        </div>

        <div className="space-y-4 text-[10.5pt] leading-snug text-justify">
          <div className="space-y-2">
            <p>
              ☑ 1. На състезателите се забранява да пътуват сами от и до мястото
              на състезанието.
            </p>
            <p>
              ☑ 2. При неразположение или нужда по време на пътуването, да се
              уведоми своевременно ръководителя / треньора / на групата.
            </p>
            <p>
              ☑ 3. Състезателите се придвижват организирано в група, под
              ръководството на ръководителя / треньора /.
            </p>
            <p>
              ☑ 4. Забранява се отделянето от групата без изричното разрешение
              на ръководителя / треньора /.
            </p>
            <p>
              ☑ 5. Не се разрешава храненето в превозното средство без
              разрешението на ръководителя / треньора / и шофьора.
            </p>
            <p>
              ☑ 6. Ръководителя / треньора / на групата се качва последен и
              слиза първи от превозното средство.
            </p>
            <p>
              ☑ 7. Състезателите поддържат добри взаимоотношения в дух на
              спортсменство и колегиалност с участващите в състезанието
              състезатели от други отбори.
            </p>
            <p>
              ☑ 8. Забранява се носенето и използването на пиротехнически
              средства.
            </p>
            <p>
              ☑ 9. Забранява се употребата на алкохол, цигари и упойващи
              вещества.
            </p>
            <p>
              ☑ 10. По време на пътуването и състезанието да се спазват точно
              указанията на треньора.
            </p>
            <p>
              ☑ 11. С поведението си състезателите – участници в състезанието са
              длъжни да не уронват престижа и авторитета на клуба.
            </p>
            <p>
              ☑ 12. С настоящия инструктаж да се запознаят, срещу подпис в
              заявката-формуляр преди пътуването, всички състезатели – участници
              в състезанието.
            </p>
          </div>

          <div className="mt-12 space-y-8 pt-8 border-t border-slate-100">
            <div className="flex items-baseline gap-4">
              <span className="shrink-0 w-28 font-bold">Родител:</span>
              <div className="flex-1 border-b border-dotted border-slate-400 min-h-8 flex items-end justify-center pb-1">
                {existingSignatureUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={existingSignatureUrl}
                    alt="Подпис на родител"
                    className="h-14 w-auto object-contain"
                    style={{ mixBlendMode: "multiply" }}
                  />
                ) : (
                  <span className="text-[10pt] text-slate-400 italic">
                    / име, фамилия, подпис /
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="shrink-0 w-28 font-bold">Състезател:</span>
              <div className="flex-1 border-b border-dotted border-slate-400 min-h-8 flex items-end px-4 gap-6">
                <strong className="text-lg">{fullName}</strong>
                <span className="text-[10pt] text-slate-400 italic">
                  / име, фамилия, подпис /
                </span>
              </div>
            </div>
          </div>

          <div className="mt-16 flex justify-between px-4">
            <p>Дата: .........................</p>
            <p>Място: гр. Гълъбово</p>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-50">
            <p className="font-bold uppercase mb-2">УТВЪРДИЛ:</p>
            <div className="space-y-1">
              <p className="text-lg font-bold">Председател: Мира Георгиева</p>
              <p className="text-slate-600 italic">
                „Бадминтон клуб Гълъбово&quot;
              </p>
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

      <SignatureDialog
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onSave={handleSignatureSave}
        title="Подпис на Инструктаж"
        description={`Подпис за Инструктаж за безопасност на ${fullName}`}
      />
    </div>
  );
};

export default SafetyInstructionPage;
