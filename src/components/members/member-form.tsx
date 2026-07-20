"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Member } from "@/types/member.types";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Save, X, ArrowRight, ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";

import { MemberFormStep1 } from "./MemberFormStep1";
import { MemberFormStep2 } from "./MemberFormStep2";
import { MemberFormStep3 } from "./MemberFormStep3";

import { MemberFormSchema, MemberFormValues } from "./member-form-types";

interface MemberFormProps {
  onSave: (data: MemberFormValues) => Promise<void>;
  onClose: () => void;
  initialData?: Partial<Member>;
}

const ensureDateString = (val: unknown): string | undefined => {
  if (!val) return undefined;
  if (typeof val === "string") return val.split("T")[0];
  if (typeof (val as { toDate?: () => Date })?.toDate === "function") {
    return (val as { toDate: () => Date }).toDate().toISOString().split("T")[0];
  }
  if (val instanceof Date) return val.toISOString().split("T")[0];
  return String(val);
};

export const MemberForm = ({
  onSave,
  onClose,
  initialData,
}: MemberFormProps) => {
  const [step, setStep] = useState(1);
  const { activeBranch } = useAppStore();

  const safeInitialData = { ...initialData } as Record<string, unknown>;

  if (safeInitialData.dateOfBirth) {
    safeInitialData.dateOfBirth = ensureDateString(safeInitialData.dateOfBirth);
  }
  if (safeInitialData.registrationDate) {
    safeInitialData.registrationDate = ensureDateString(
      safeInitialData.registrationDate
    );
  }

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(MemberFormSchema),
    defaultValues: {
      siteId: activeBranch,
      firstName: "",
      middleName: "",
      lastName: "",
      educationInstitution: "",
      dateOfBirth: undefined,
      registrationDate: undefined,
      gender: "male",
      phone: "",
      email: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      apparelSize: "",
      status: "active",
      notes: "",
      healthConditionNotes: "",
      avatarUrl: "",
      showOnPublicTeam: false,
      familyId: undefined,
      skillLevel: undefined,
      hasSignedDeclaration: false,
      hasMedicalCertificate: false,
      isLicensed: false,
      isClubMember:
        (safeInitialData.isClubMember as boolean | undefined) ??
        safeInitialData.memberType === "regular",
      isRecoveryMember:
        (safeInitialData.isRecoveryMember as boolean | undefined) ??
        (safeInitialData.memberType === "recovery" ||
          activeBranch === "recoveryzone"),
      isGuest:
        (safeInitialData.isGuest as boolean | undefined) ??
        safeInitialData.memberType === "guest",
      memberType: activeBranch === "recoveryzone" ? "recovery" : "regular",
      ...safeInitialData,
    },
  });

  const {
    formState: { isSubmitting },
    trigger,
    watch,
  } = form;

  const isClubMember = watch("isClubMember");
  const isRecoveryMember = watch("isRecoveryMember");
  const isGuest = watch("isGuest");
  const isRecoveryBranch = activeBranch === "recoveryzone";

  const isGuestOnly = isGuest && !isClubMember && !isRecoveryMember;

  // Calculate total steps
  const totalSteps = isGuestOnly ? 2 : 3;

  const handleNextStep = async () => {
    let isValid = false;

    if (step === 1) {
      isValid = await trigger([
        "firstName",
        "middleName",
        "lastName",
        "dateOfBirth",
        "gender",
      ]);
    } else if (step === 2) {
      isValid = await trigger([
        "phone",
        "email",
        "address",
        "emergencyContactName",
        "emergencyContactPhone",
      ]);
    }

    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (data: MemberFormValues) => {
    // Determine primary memberType for backward compatibility
    if (data.isClubMember) {
      data.memberType = "regular";
    } else if (data.isRecoveryMember) {
      data.memberType = "recovery";
    } else if (data.isGuest) {
      data.memberType = "guest";
    }

    await onSave(data);
  };

  return (
    <Form {...form}>
      <form
        aria-label="member-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full flex-col"
      >
        {/* STEP PROGRESS BAR */}
        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
          <div
            className="h-full bg-zinc-950 transition-all duration-300 dark:bg-zinc-50"
            // eslint-disable-next-line react/forbid-dom-props
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        <div className="min-h-100 flex-1 space-y-6 sm:space-y-8">
          <MemberFormStep1
            form={form}
            isActive={step === 1}
            isRecoveryBranch={isRecoveryBranch}
          />
          <MemberFormStep2 form={form} isActive={step === 2} />
          <MemberFormStep3 form={form} isActive={step === 3} />
        </div>

        {/* НАВИГАЦИОННИ БУТОНИ */}
        <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-6 dark:border-zinc-900">
          <div>
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="flex h-11 items-center gap-2 rounded-xl border-zinc-200 px-6 text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase hover:bg-zinc-50 sm:h-12 sm:text-[11px]"
              >
                <ArrowLeft className="size-4" strokeWidth={1.5} /> Назад
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex h-11 items-center gap-2 rounded-xl border-zinc-200 px-6 text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase hover:bg-zinc-50 sm:h-12 sm:text-[11px]"
              >
                <X className="size-4" strokeWidth={1.5} /> Отказ
              </Button>
            )}
          </div>

          <div>
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleNextStep();
                }}
                disabled={isSubmitting}
                className="flex h-11 items-center gap-2 rounded-xl bg-zinc-950 px-8 text-[10px] font-medium tracking-[0.2em] text-white uppercase hover:bg-zinc-900 sm:h-12 sm:text-[11px]"
              >
                Напред <ArrowRight className="size-4" strokeWidth={1.5} />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-8 text-[10px] font-medium tracking-[0.2em] text-white uppercase hover:bg-emerald-600 sm:h-12 sm:text-[11px]"
              >
                <Save className="size-4" strokeWidth={1.5} />{" "}
                {initialData && Object.keys(initialData).length > 0
                  ? "Запазване"
                  : "Създаване"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
};
