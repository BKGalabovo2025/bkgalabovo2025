"use client";

import { ArrowLeft, Loader2, PenLine, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { SignatureDialog } from "@/components/members/signature-dialog";
import { ClubOfficialDocumentHeader } from "@/components/shared/members/ClubOfficialDocumentHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { updateMemberAction } from "@/lib/actions/members";
import { formatFullName } from "@/lib/utils";
import { Member } from "@/types";

type DeclarationPrefix =
  "signedDeclaration" | "travelDeclaration" | "safetyDeclaration";

interface GenericDeclarationPageProps {
  memberId: string;
  dialogTitle: string;
  dialogDescriptionFn: (fullName: string) => string;
  prefix: DeclarationPrefix;
  extraToolbarActions?: React.ReactNode;
  children: (props: {
    member: Member;
    fullName: string;
    existingSignatureUrl: string | null;
    displayDate: string;
  }) => React.ReactNode;
}

export const GenericDeclarationPage = ({
  memberId,
  dialogTitle,
  dialogDescriptionFn,
  prefix,
  extraToolbarActions,
  children,
}: GenericDeclarationPageProps) => {
  const router = useRouter();
  const { member, loading, refetch } = useMemberProfile(memberId);
  const { idToken } = useAuth();
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [docDate, setDocDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const displayDate = docDate
    ? new Date(docDate).toLocaleDateString("bg-BG")
    : new Date().toLocaleDateString("bg-BG");

  if (loading) return <div className="p-8">Зареждане...</div>;
  if (!member) return <div className="p-8">Членът не е намерен.</div>;

  const fullName = formatFullName(member);
  const existingSignatureUrl =
    signatureUrl ||
    ((member as Record<string, unknown>)[`${prefix}SignatureUrl`] as
      string | null) ||
    ((member as Record<string, unknown>)[`${prefix}Url`] as string | null) ||
    (prefix === "safetyDeclaration"
      ? ((member as Record<string, unknown>).safetyInstructionUrl as
          string | null) ||
        ((member as Record<string, unknown>).safetyInstructionSignatureUrl as
          string | null)
      : null) ||
    null;

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

  const handleSignatureSave = async (file: File) => {
    if (!idToken) {
      toast.error("Грешка при оторизация");
      return;
    }
    setIsSaving(true);
    try {
      // Преобразуваме файла в Base64 string, за да го запазим директно в базата данни (Firestore),
      // вместо да използваме Firebase Storage (за да избегнем платен план).
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let booleanField = "";
      if (prefix === "signedDeclaration") booleanField = "hasSignedDeclaration";
      else if (prefix === "travelDeclaration")
        booleanField = "hasTravelDeclaration";
      else if (prefix === "safetyDeclaration")
        booleanField = "hasSafetyDeclaration";

      const updates: Record<string, unknown> = {
        [`${prefix}SignatureUrl`]: url,
        [`${prefix}HandedAt`]: new Date().toISOString(),
      };
      if (booleanField) updates[booleanField] = true;

      const result = await updateMemberAction(memberId, idToken, updates);

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
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-4 font-serif md:p-8">
      {/* Non-printable header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button
          variant="outline"
          onClick={handleBack}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 size-4" /> Назад
        </Button>

        <div className="flex flex-wrap items-center gap-2">
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

          {extraToolbarActions}
          <Button
            variant="outline"
            onClick={() => setSignatureOpen(true)}
            disabled={isSaving}
            className="rounded-xl border-zinc-200 text-[10px] font-medium tracking-widest text-zinc-700 uppercase transition-all hover:border-zinc-950 hover:bg-zinc-50"
          >
            {isSaving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <PenLine className="mr-2 size-4" strokeWidth={1.5} />
            )}
            {existingSignatureUrl
              ? "Смени подписа"
              : "Добави електронен подпис"}
          </Button>
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
          documentKey={
            prefix === "safetyDeclaration" ? "safetyInstruction" : prefix
          }
          overrideDate={displayDate}
        />
        {children({ member, fullName, existingSignatureUrl, displayDate })}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 15mm 10mm 15mm;
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
            font-size: 10pt !important;
            line-height: 1.35 !important;
          }
        }
      `,
        }}
      />

      <SignatureDialog
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onSave={handleSignatureSave}
        title={dialogTitle}
        description={dialogDescriptionFn(fullName)}
      />
    </div>
  );
};
