"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { MemberDocumentShell } from "@/components/shared/members/MemberDocumentShell";
import { useAuth } from "@/context/auth-context";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { updateMemberAction } from "@/lib/actions/members";
import { formatFullName } from "@/lib/utils";

const TerminationRequestPage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading, refetch } = useMemberProfile(memberId);
  const { idToken } = useAuth();
  const [localSignatureUrl, setLocalSignatureUrl] = useState<string | null>(
    null
  );

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
  const today = new Date().toLocaleDateString("bg-BG");

  const signatureUrl =
    localSignatureUrl ||
    member.terminationRequestUrl ||
    member.terminationRequestSignatureUrl ||
    null;

  const handleSaveSignature = async (file: File) => {
    if (!idToken) {
      toast.error("Грешка при оторизация");
      return;
    }
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const nowIso = new Date().toISOString();
    const result = await updateMemberAction(memberId, idToken, {
      hasTerminationRequest: true,
      terminationRequestHandedAt: nowIso,
      terminationRequestUrl: url,
      terminationRequestSignatureUrl: url,
    });
    if (result.success) {
      setLocalSignatureUrl(url);
      toast.success("Подписът е запазен успешно!");
      if (refetch) refetch();
      router.refresh();
    } else {
      toast.error("Грешка при запазване на подписа");
    }
  };

  return (
    <MemberDocumentShell
      memberId={memberId}
      documentKey="terminationRequest"
      documentSubtitle='за прекратяване на членство в СНЦ „Бадминтон клуб Гълъбово" град Гълъбово'
      fullName={fullName}
      today={today}
      parentName={member.parentName}
      parentPhone={member.parentPhone}
      parentEmail={member.parentEmail}
      parentAddress={member.address}
      signatureUrl={signatureUrl}
      onSaveSignature={handleSaveSignature}
      signatureDialogTitle="Подпис на Молба за прекратяване"
    >
      {({ displayDate }) => (
        <div className="space-y-4 text-xs leading-relaxed text-justify font-serif">
          <p className="font-serif font-bold text-slate-900 text-[10.5pt]">
            Уважаема госпожо Председател,
          </p>

          <p className="indent-6">
            Моля, на основание действащия Вътрешен правилник на клуба, да бъде
            прекратено членството на{" "}
            <strong className="text-slate-950 font-bold underline underline-offset-4">
              {fullName}
            </strong>{" "}
            в СНЦ „Бадминтон клуб Гълъбово“, считано от{" "}
            <span className="inline-block min-w-32 border-b border-slate-700 pb-0.5 text-center font-bold text-slate-950">
              {displayDate}
            </span>{" "}
            г.
          </p>

          <div className="my-3 rounded-md border border-slate-300 bg-slate-50/70 p-3 text-xs print:border-slate-400 print:bg-transparent">
            <p className="font-bold tracking-wider text-slate-950 uppercase text-[8.5pt]">
              Декларирам следните обстоятелства:
            </p>
            <div className="mt-2 space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-block size-3.5 rounded-xs border border-slate-600 text-center text-[8pt] font-bold">
                  ✓
                </span>
                <span>
                  Всички текущи финансови задължения и членски вноски към клуба
                  са напълно уредени и заплатени към датата на подаване на
                  настоящата молба;
                </span>
              </div>

              <div className="border-t border-slate-200 pt-2 print:border-slate-300">
                <p className="mb-1 font-bold text-slate-900">
                  Предаване и отчитане на предоставената клубна екипировка:
                </p>
                <div className="ml-4 space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="inline-block size-3.5 rounded-xs border border-slate-600 text-center text-[8pt]"></span>
                    <span>
                      Официален тренировъчен анцуг (горнище + долнище), размер:
                    </span>
                    <span className="inline-block min-w-28 border-b border-slate-700 pb-0.5"></span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="inline-block size-3.5 rounded-xs border border-slate-600 text-center text-[8pt]"></span>
                    <span>Клубни състезателни фланелки:</span>
                    <span className="inline-flex items-center gap-3">
                      <span className="flex items-center gap-1">☐ бяла</span>
                      <span className="flex items-center gap-1">☐ синя</span>
                      <span className="flex items-center gap-1">☐ друга</span>
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 pt-1">
                    <span className="mt-0.5 inline-block size-3.5 rounded-xs border border-slate-600 text-center text-[8pt]"></span>
                    <span>
                      Цялата предоставена клубна материална база е върната в
                      пълен комплект и добро експлоатационно състояние.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MemberDocumentShell>
  );
};

export default TerminationRequestPage;
