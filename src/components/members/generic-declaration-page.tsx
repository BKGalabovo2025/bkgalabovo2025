"use client";

import { Loader2, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { PrintableDocumentShell } from "@/components/members/documents/PrintableDocumentShell";
import { SignatureDialog } from "@/components/members/signature-dialog";
import { ClubOfficialDocumentHeader } from "@/components/shared/members/ClubOfficialDocumentHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { updateMemberAction } from "@/lib/actions/members";
import { formatFullName } from "@/lib/utils";
import { Member } from "@/types";
import {
  DOCUMENT_NUMBER_LABELS,
  DocumentNumberKey,
} from "@/types/document-number.types";

type DeclarationPrefix =
  "signedDeclaration" | "travelDeclaration" | "safetyDeclaration";

interface GenericDeclarationPageProps {
  memberId: string;
  dialogTitle: string;
  dialogDescriptionFn: (fullName: string) => string;
  prefix: DeclarationPrefix;
  documentTitle?: string;
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
  documentTitle,
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

  if (loading) {
    return (
      <div className="p-8 text-sm text-zinc-600 dark:text-zinc-400">
        Зареждане...
      </div>
    );
  }
  if (!member) {
    return (
      <div className="p-8 text-sm text-zinc-600 dark:text-zinc-400">
        Членът не е намерен.
      </div>
    );
  }

  const fullName = formatFullName(member);
  const documentKey: DocumentNumberKey =
    prefix === "safetyDeclaration" ? "safetyInstruction" : prefix;
  const resolvedTitle = documentTitle ?? DOCUMENT_NUMBER_LABELS[documentKey];

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

      const nowIso = new Date().toISOString();
      const updates: Record<string, unknown> = {
        [`${prefix}SignatureUrl`]: url,
        [`${prefix}HandedAt`]: nowIso,
      };
      if (booleanField) updates[booleanField] = true;
      if (prefix === "safetyDeclaration") {
        updates.hasSafetyInstruction = true;
        updates.safetyInstructionSignatureUrl = url;
        updates.safetyInstructionHandedAt = nowIso;
      }

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
    <>
      <PrintableDocumentShell
        memberId={memberId}
        memberName={fullName}
        documentTitle={resolvedTitle}
        dateValue={docDate}
        onDateChange={setDocDate}
        printPageMargin="10mm 15mm 10mm 15mm"
        printFontSize="10pt"
        printLineHeight="1.35"
        printAreaClassName="font-serif"
        toolbarActions={
          <>
            {extraToolbarActions}
            <Button
              type="button"
              variant="outline"
              onClick={() => setSignatureOpen(true)}
              disabled={isSaving}
              className="h-9 rounded-xl border-zinc-200 text-[10px] font-medium tracking-widest text-zinc-700 uppercase transition-all hover:border-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
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
          </>
        }
      >
        <ClubOfficialDocumentHeader
          documentKey={documentKey}
          overrideDate={displayDate}
        />
        {children({ member, fullName, existingSignatureUrl, displayDate })}
      </PrintableDocumentShell>

      <SignatureDialog
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onSave={handleSignatureSave}
        title={dialogTitle}
        description={dialogDescriptionFn(fullName)}
      />
    </>
  );
};
