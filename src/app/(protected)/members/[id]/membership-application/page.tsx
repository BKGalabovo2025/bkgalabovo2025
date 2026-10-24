"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { MemberDocumentShell } from "@/components/shared/members/MemberDocumentShell";
import { useClubFeeServices } from "@/hooks/useClubFeeServices";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { isMatchingParticipation } from "@/lib/services-fees";
import { formatFullName } from "@/lib/utils";

const MembershipApplicationPage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading } = useMemberProfile(memberId);
  const { feeOptions } = useClubFeeServices();

  const initialPlan =
    ((member as Record<string, unknown>)?.participationType as string) ||
    "Месечен абонамент – 1 дете (20 EUR)";
  const [selectedPlan, setSelectedPlan] = useState<string>(initialPlan);

  if (loading) return <div className="p-8">Зареждане...</div>;
  if (!member) return <div className="p-8">Членът не е намерен.</div>;

  const fullName = formatFullName(member);
  const today = new Date().toLocaleDateString("bg-BG");

  const signatureUrl =
    member.membershipApplicationUrl ||
    member.membershipApplicationSignatureUrl ||
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

  return (
    <MemberDocumentShell
      documentKey="membershipApplication"
      onBack={handleBack}
      documentSubtitle='за членство в СНЦ „Бадминтон клуб Гълъбово" град Гълъбово'
      fullName={fullName}
      today={today}
      parentName={member.parentName}
      parentPhone={member.parentPhone}
      parentEmail={member.parentEmail}
      parentAddress={member.address}
      signatureUrl={signatureUrl}
    >
      <div className="space-y-4 text-xs leading-relaxed text-justify font-serif">
        <p className="font-serif font-bold text-slate-900 text-[10.5pt]">
          Уважаема госпожо Председател,
        </p>

        <p className="indent-6">
          Моля, да приемете горепосочения кандидат{" "}
          <strong className="text-slate-950 font-bold underline underline-offset-4">
            {fullName}
          </strong>{" "}
          за редовен член на СНЦ „Бадминтон клуб Гълъбово“, считано от{" "}
          <span className="inline-block min-w-32 border-b border-slate-700 pb-0.5 text-center font-bold text-slate-950">
            {today}
          </span>{" "}
          г.
        </p>

        <div className="my-3 rounded-md border border-slate-300 bg-slate-50/70 p-3 text-xs print:border-slate-400 print:bg-transparent">
          <p className="font-bold tracking-wider text-slate-950 uppercase text-[8.5pt]">
            Избирам/е следната форма на участие:
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {feeOptions.map((opt) => {
              const isSelected =
                isMatchingParticipation(selectedPlan, opt.label) ||
                isMatchingParticipation(selectedPlan, opt.radioLabel) ||
                isMatchingParticipation(selectedPlan, opt.name);
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedPlan(opt.radioLabel)}
                  className="flex items-center gap-2 cursor-pointer print:cursor-default"
                >
                  <span
                    className={`inline-flex items-center justify-center size-3.5 rounded-xs border border-slate-700 text-center text-[8pt] font-bold ${
                      isSelected
                        ? "bg-slate-900 text-white"
                        : "bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span
                    className={
                      isSelected ? "font-bold text-slate-950" : "text-slate-700"
                    }
                  >
                    {opt.radioLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-block size-3.5 rounded-xs border border-slate-600 text-center text-[8pt] font-bold">
              ✓
            </span>
            <span className="text-justify leading-normal">
              Декларирам, че съм подробно запознат/а с Вътрешния правилник на
              СНЦ „Бадминтон клуб Гълъбово“, приемам неговите клаузи и се
              задължавам аз и моето дете стриктно да го спазваме.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-block size-3.5 rounded-xs border border-slate-600 text-center text-[8pt] font-bold">
              ✓
            </span>
            <span className="text-justify leading-normal">
              Запознат/а съм, че при евентуално прекратяване на членството се
              подава писмена молба по образец и се връща цялата предоставена
              клубна материална база и състезателна екипировка.
            </span>
          </div>
        </div>
      </div>
    </MemberDocumentShell>
  );
};

export default MembershipApplicationPage;
