"use client";

import { ArrowLeft, Calendar, Loader2, PenLine, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { SignatureDialog } from "@/components/members/signature-dialog";
import {
  ChairpersonSignatureControl,
  ChairpersonSignatureLine,
} from "@/components/shared/members/ChairpersonSignatureControl";
import { ClubOfficialDocumentHeader } from "@/components/shared/members/ClubOfficialDocumentHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useChairpersonSignature } from "@/hooks/useChairpersonSignature";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { updateMemberAction } from "@/lib/actions/members";
import { formatFullName } from "@/lib/utils";

const LicenseApplicationPage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading, refetch } = useMemberProfile(memberId);
  const { idToken, getFreshToken } = useAuth();
  const chairperson = useChairpersonSignature();

  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formType, setFormType] = useState<"minor" | "adult">("minor");

  // Auto-detect if minor or adult after member loads
  useEffect(() => {
    if (!member?.dateOfBirth) return;
    const birthYear = new Date(member.dateOfBirth).getFullYear();
    const currentYear = new Date().getFullYear();
    setFormType(currentYear - birthYear < 18 ? "minor" : "adult");
  }, [member?.dateOfBirth]);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const displayDate = useMemo(() => {
    if (!selectedDate) return new Date().toLocaleDateString("bg-BG");
    const parts = selectedDate.split("-");
    if (parts.length === 3) {
      return `${parseInt(parts[2], 10)}.${parseInt(parts[1], 10)}.${parts[0]}`;
    }
    return new Date().toLocaleDateString("bg-BG");
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 p-8 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
        Зареждане...
      </div>
    );
  }
  if (!member) {
    return (
      <div className="min-h-screen bg-zinc-100 p-8 text-rose-600 dark:bg-zinc-950 dark:text-rose-400">
        Членът не е намерен.
      </div>
    );
  }

  const fullName = formatFullName(member);
  const existingSignatureUrl =
    signatureUrl ||
    member.licenseApplicationSignatureUrl ||
    member.licenseApplicationUrl ||
    null;
  const yearStr = selectedDate
    ? selectedDate.split("-")[0]
    : new Date().getFullYear().toString();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/members/${memberId}/documents`);
    }
  };

  const handleSignatureSave = async (file: File) => {
    setIsSaving(true);
    try {
      const token = idToken || (await getFreshToken());
      if (!token) {
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
      const result = await updateMemberAction(memberId, token, {
        licenseApplicationSignatureUrl: url,
        licenseApplicationHandedAt: nowIso,
        hasLicenseApplication: true,
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
    <div className="min-h-screen bg-zinc-100 p-4 md:p-8 dark:bg-zinc-950 print:min-h-0 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        {/* Compact PageHeader */}
        <PageHeader
          title="Молба за картотекиране"
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Членове", href: "/members" },
            { label: fullName, href: `/members/${memberId}` },
            { label: "Документи", href: `/members/${memberId}/documents` },
            { label: "Молба за картотекиране" },
          ]}
          className="print:hidden"
        />

        {/* Non-printable toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-xs backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            <ArrowLeft className="mr-2 size-4" /> Назад
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <Calendar className="size-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                Дата:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="cursor-pointer rounded bg-transparent font-medium text-zinc-900 outline-none dark:bg-zinc-800 dark:text-zinc-100"
                title="Редактирай датата на молбата"
              />
            </div>

            {/* Toggle between minor and adult form */}
            <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800">
              <button
                type="button"
                onClick={() => setFormType("minor")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  formType === "minor"
                    ? "bg-white text-zinc-950 shadow-xs font-bold dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                Непълнолетно дете (от родители)
              </button>
              <button
                type="button"
                onClick={() => setFormType("adult")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  formType === "adult"
                    ? "bg-white text-zinc-950 shadow-xs font-bold dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                Пълнолетен състезател
              </button>
            </div>

            <ChairpersonSignatureControl {...chairperson} />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSignatureOpen(true)}
              disabled={isSaving}
              className="rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              {isSaving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <PenLine className="mr-2 size-4" />
              )}
              {existingSignatureUrl ? "Подписан" : "Подпиши"}
            </Button>

            <Button
              size="sm"
              onClick={() => window.print()}
              className="rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Printer className="mr-2 size-4" /> Принтирай
            </Button>
          </div>
        </div>

        {/* Printable Area - Exactly 1 Page A4 */}
        <div className="print-area rounded-2xl bg-white p-6 font-serif leading-relaxed text-slate-900 shadow-sm md:p-10 print:rounded-none print:p-0 print:shadow-none">
          <ClubOfficialDocumentHeader
            documentKey="licenseApplication"
            overrideDate={displayDate}
          />
          {formType === "minor" ? (
            // ================= МОЛБА ЗА КАРТОТЕКИРАНЕ (ОТ РОДИТЕЛИ) =================
            <div>
              <div className="my-6 flex justify-end">
                <div className="w-[50%] space-y-0.5 text-left text-xs uppercase leading-tight">
                  <p className="font-bold text-slate-950">ДО</p>
                  <p className="font-bold text-slate-950">ПРЕДСЕДАТЕЛЯ</p>
                  <p className="font-bold text-slate-950">
                    НА „БАДМИНТОН КЛУБ ГЪЛЪБОВО”
                  </p>
                  <p className="font-medium text-slate-800">ГР. ГЪЛЪБОВО</p>
                </div>
              </div>

              <div className="my-8 text-center">
                <h1 className="text-2xl font-bold tracking-[0.3em] text-slate-950 uppercase">
                  М О Л Б А
                </h1>
                <p className="mt-3 text-sm font-bold tracking-wider text-slate-800 uppercase">
                  ОТ
                </p>
              </div>

              <div className="my-6 space-y-4 text-xs">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-sm">1.</span>
                    <span className="flex-1 border-b border-dotted border-slate-800 pb-0.5 font-semibold text-[10pt]">
                      {member.fatherName || member.parentName ? (
                        <>
                          <strong className="font-bold">
                            {member.fatherName || member.parentName}
                          </strong>
                          {member.fatherEGN ? `, ЕГН: ${member.fatherEGN}` : ""}
                          {member.fatherCity || member.address
                            ? `, адрес: ${member.fatherCity || member.address}`
                            : ""}
                        </>
                      ) : (
                        "\u00A0"
                      )}
                    </span>
                  </div>
                  <p className="pl-6 text-[7.5pt] text-slate-600 italic">
                    /трите имена , ЕГН , адрес на родител /
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-sm">2.</span>
                    <span className="flex-1 border-b border-dotted border-slate-800 pb-0.5 font-semibold text-[10pt]">
                      {member.motherName ? (
                        <>
                          <strong className="font-bold">
                            {member.motherName}
                          </strong>
                          {member.motherEGN ? `, ЕГН: ${member.motherEGN}` : ""}
                          {member.motherCity
                            ? `, адрес: ${member.motherCity}`
                            : ""}
                        </>
                      ) : (
                        "\u00A0"
                      )}
                    </span>
                  </div>
                  <p className="pl-6 text-[7.5pt] text-slate-600 italic">
                    /трите имена , ЕГН , адрес на родител /
                  </p>
                </div>
              </div>

              <div className="my-10 space-y-4 text-justify text-sm leading-relaxed">
                <p className="font-bold">
                  Уважаеми/а г-н/г-жо Председател, молим синът ни /дъщеря ни/
                </p>
                <p className="border-b border-dotted border-slate-800 pb-1 text-center font-bold text-base text-slate-950">
                  {fullName}
                </p>
                <p className="indent-6">
                  да бъде картотекиран/а/, като състезател на{" "}
                  <strong>„БАДМИНТОН КЛУБ ГЪЛЪБОВО”</strong> гр. Гълъбово за{" "}
                  <span className="font-bold">{yearStr} г.</span>
                </p>
              </div>

              <div className="mt-28 flex items-end justify-between pt-8 text-xs">
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold">{displayDate} г.</span>
                  </p>
                  <p>гр. Гълъбово</p>
                </div>

                <div className="space-y-4 text-right">
                  <p className="font-bold">С уважение:</p>
                  {existingSignatureUrl && (
                    <div className="flex justify-end">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={existingSignatureUrl}
                        alt="Подпис на родител"
                        className="h-9 max-w-36 object-contain mix-blend-multiply"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <span>1.</span>
                    <span className="inline-block w-52 border-b border-slate-900 pb-0.5 text-center font-semibold">
                      {member.parentName || member.fatherName || "\u00A0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span>2.</span>
                    <span className="inline-block w-52 border-b border-slate-900 pb-0.5 text-center font-semibold">
                      {member.motherName || "\u00A0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // ================= МОЛБА ЗА КАРТОТЕКИРАНЕ (ПЪЛНОЛЕТЕН) =================
            <div>
              <div className="my-6 flex justify-end">
                <div className="w-[50%] space-y-0.5 text-left text-xs leading-tight">
                  <p className="font-bold text-slate-950">До Председателя</p>
                  <p className="font-bold text-slate-950">
                    На „Бадминтон клуб Гълъбово”
                  </p>
                  <p className="font-medium text-slate-800">гр. Гълъбово</p>
                </div>
              </div>

              <div className="my-8 text-center">
                <h1 className="text-2xl font-bold tracking-[0.3em] text-slate-950 uppercase">
                  М О Л Б А
                </h1>
                <p className="mt-3 text-sm font-bold tracking-wider text-slate-800 uppercase">
                  от
                </p>
              </div>

              <div className="my-6 space-y-1.5 text-center">
                <p className="border-b border-dotted border-slate-800 pb-1 text-base font-bold text-slate-950">
                  {fullName}
                </p>
                <p className="border-b border-dotted border-slate-800 pb-1 text-sm font-semibold">
                  {member.egn
                    ? `ЕГН: ${member.egn}`
                    : "ЕГН: ______________________"}
                  {member.address
                    ? `, адрес: ${member.address}`
                    : ", адрес: ________________________________"}
                </p>
                <p className="text-[7.5pt] text-slate-600 italic">
                  /трите имена , ЕГН , адрес /
                </p>
              </div>

              <div className="my-10 space-y-4 text-justify text-sm leading-relaxed">
                <p className="font-bold">Уважаеми г-н/г-жо Председател,</p>
                <p className="indent-6">
                  моля да бъда картотекиран/а/, като състезател на{" "}
                  <strong>„БАДМИНТОН КЛУБ ГЪЛЪБОВО”</strong> гр. Гълъбово за{" "}
                  <span className="font-bold">{yearStr} г.</span>
                </p>
              </div>

              <div className="mt-32 flex items-end justify-between pt-8 text-xs">
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold">{displayDate} г.</span>
                  </p>
                  <p>гр. Гълъбово</p>
                </div>

                <div className="space-y-2 text-right">
                  <p className="font-bold">С уважение:</p>
                  {existingSignatureUrl && (
                    <div className="flex justify-end">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={existingSignatureUrl}
                        alt="Подпис на състезателя"
                        className="h-9 max-w-36 object-contain mix-blend-multiply"
                      />
                    </div>
                  )}
                  <div className="inline-block w-56 border-b border-slate-900 pb-0.5 text-center font-semibold">
                    {fullName}
                  </div>
                  <p className="text-[7.5pt] text-slate-600 italic">
                    /име,фамилия,подпис/
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chairperson Acceptance Block */}
          <div className="mt-10 border-t border-slate-200 pt-4 text-xs flex items-end justify-between">
            <span className="text-slate-600 italic">
              Приел молбата (Председател на СК):
            </span>
            <ChairpersonSignatureLine
              isApplied={chairperson.isApplied}
              signatureUrl={chairperson.signatureUrl}
              caption="/ Мира Георгиева /"
              align="right"
            />
          </div>
        </div>
      </div>

      <SignatureDialog
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onSave={handleSignatureSave}
        title="Електронен подпис – Молба за картотекиране"
        description={`Начертайте електронния подпис за ${fullName} (или родител/настойник).`}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 20mm 15mm 20mm;
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
          }
        }
      `,
        }}
      />
    </div>
  );
};

export default LicenseApplicationPage;
