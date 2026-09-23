/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional, sonarjs/no-nested-template-literals, @typescript-eslint/no-unused-vars, sonarjs/no-unused-vars, sonarjs/no-dead-store, sonarjs/unused-import */
"use client";

import confetti from "canvas-confetti";
import {
  Award,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Printer,
  Search,
  Share2,
  Sparkles,
  Ticket,
  Trophy,
  User,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMembers } from "@/hooks/useMembers";
import { certificateIssuanceService } from "@/services/certificate-issuance-service";
import {
  AwardRank,
  CertificateTemplate,
  CertificateType,
  getCertificateTypeLabel,
  getRankLabel,
  IssueCertificateInput,
  IssuedCertificate,
  SponsorPartner,
} from "@/types/certificates";

import { CertificateDocumentPreview } from "./CertificateDocumentPreview";

interface IssueDocumentTabProps {
  siteId: "bkgalabovo" | "recoveryzone";
  templates: CertificateTemplate[];
  sponsors: SponsorPartner[];
  preselectedTemplateId?: string | null;
  onIssuedSuccess: () => Promise<void>;
  onSwitchToRegistry: () => void;
}

export function IssueDocumentTab({
  siteId,
  templates,
  sponsors,
  preselectedTemplateId,
  onIssuedSuccess,
  onSwitchToRegistry,
}: IssueDocumentTabProps) {
  const { members, loading: loadingMembers } = useMembers();

  // Approved templates only
  const approvedTemplates = useMemo(
    () => templates.filter((t) => t.status === "approved"),
    [templates]
  );

  // Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    if (preselectedTemplateId) return preselectedTemplateId;
    return approvedTemplates[0]?.id || "";
  });

  const activeTemplate = useMemo(
    () =>
      templates.find((t) => t.id === selectedTemplateId) ||
      approvedTemplates[0],
    [templates, approvedTemplates, selectedTemplateId]
  );

  // Recipient Mode: "member" vs "manual"
  const [recipientMode, setRecipientMode] = useState<"member" | "manual">(
    "member"
  );
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Recipient Fields
  const [recipientName, setRecipientName] = useState("");
  const [recipientInstitution, setRecipientInstitution] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  // Details: Award
  const [awardRank, setAwardRank] = useState<AwardRank>("1st");
  const [nomination, setNomination] = useState("");
  const [eventTitle, setEventTitle] = useState(
    "Турнир по Бадминтон „Гълъбово 2026“"
  );
  const [eventDate, setEventDate] = useState(
    new Date().toLocaleDateString("bg-BG")
  );
  const [eventLocation, setEventLocation] = useState(
    "Спортен Комплекс „Енергетик“, гр. Гълъбово"
  );

  // Details: Voucher
  const [voucherSessions, setVoucherSessions] = useState<number>(5);
  const [voucherValidityDays, setVoucherValidityDays] = useState<number>(180);

  // Details: Certificate
  const [skillsSummary, setSkillsSummary] = useState("");
  const [hoursTrained, setHoursTrained] = useState<number>(20);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedSuccessDoc, setIssuedSuccessDoc] =
    useState<IssuedCertificate | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filtered members for autocomplete
  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return members.slice(0, 6);
    const q = memberSearchQuery.toLowerCase();
    return members
      .filter((m) => {
        const full = `${m.firstName} ${m.lastName}`.toLowerCase();
        const inst = (m.educationInstitution || "").toLowerCase();
        return full.includes(q) || inst.includes(q);
      })
      .slice(0, 8);
  }, [members, memberSearchQuery]);

  const handleSelectMember = (m: (typeof members)[0]) => {
    setSelectedMemberId(m.id);
    const fullName = `${m.firstName} ${m.lastName}`.trim();
    setRecipientName(fullName);
    setRecipientInstitution(m.educationInstitution || "");
    setRecipientEmail(m.email || "");
    setRecipientPhone(m.phone || "");
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate) {
      toast.error("Моля, изберете одобрен шаблон.");
      return;
    }
    if (!recipientName.trim()) {
      toast.error("Моля, въведете име на получателя.");
      return;
    }

    try {
      setIsSubmitting(true);

      let validUntil: string | undefined;
      if (activeTemplate.type === "voucher") {
        const expDate = new Date();
        expDate.setDate(
          expDate.getDate() + (Number(voucherValidityDays) || 180)
        );
        validUntil = expDate.toISOString();
      }

      const input: IssueCertificateInput = {
        templateId: activeTemplate.id,
        type: activeTemplate.type,
        recipient: {
          memberId:
            recipientMode === "member" && selectedMemberId
              ? selectedMemberId
              : undefined,
          name: recipientName.trim(),
          institution: recipientInstitution.trim() || undefined,
          email: recipientEmail.trim() || undefined,
          phone: recipientPhone.trim() || undefined,
        },
        details: {
          // Award
          rank: activeTemplate.type === "award" ? awardRank : undefined,
          nomination:
            activeTemplate.type === "award"
              ? nomination.trim() || undefined
              : undefined,
          eventTitle:
            activeTemplate.type === "award"
              ? eventTitle.trim() || undefined
              : undefined,
          eventDate:
            activeTemplate.type === "award"
              ? eventDate.trim() || undefined
              : undefined,
          eventLocation:
            activeTemplate.type === "award"
              ? eventLocation.trim() || undefined
              : undefined,

          // Voucher
          totalSessions:
            activeTemplate.type === "voucher"
              ? Number(voucherSessions) || 1
              : undefined,
          validUntil,

          // Certificate
          skillsSummary:
            activeTemplate.type === "certificate"
              ? skillsSummary.trim() || undefined
              : undefined,
          hoursTrained:
            activeTemplate.type === "certificate"
              ? Number(hoursTrained) || undefined
              : undefined,
        },
      };

      const newCert = await certificateIssuanceService.issueCertificate(
        siteId,
        input
      );

      // Trigger Confetti!
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (confettiErr) {
        // Fallback silently if confetti fails
      }

      setIssuedSuccessDoc(newCert);
      await onIssuedSuccess();
    } catch (error) {
      console.error("Грешка при издаване на документ:", error);
      toast.error("Възникна грешка при издаването на документа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const publicUrl = issuedSuccessDoc
    ? `${window.location.origin}/cert/${issuedSuccessDoc.id}`
    : "";

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast.success("Линкът към документа е копиран в клипборда!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWebShare = async () => {
    if (!publicUrl || !issuedSuccessDoc) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${activeTemplate?.title || "Документ"} - ${issuedSuccessDoc.recipient.name}`,
          text: `Официален клубен документ № ${issuedSuccessDoc.serialNumber} за ${issuedSuccessDoc.recipient.name}`,
          url: publicUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-6">
      {/* If no approved templates exist */}
      {approvedTemplates.length === 0 ? (
        <Card className="flex min-h-75 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Award className="size-10 text-amber-500" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            Няма одобрени шаблони за издаване
          </h3>
          <p className="max-w-md text-xs text-zinc-500">
            За да издадете грамота или ваучер, първо одобрете поне един шаблон в
            раздел „Шаблони (Конструктор)“.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT: Issuance Form (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <Card className="space-y-5 rounded-3xl border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                  <Printer className="size-4 text-blue-600" />
                  <span>Издаване на Персонален Документ</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Попълнете данните за получателя и параметрите на документа.
                </p>
              </div>

              <form onSubmit={handleIssueSubmit} className="space-y-4">
                {/* 1. Template Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Избор на одобрен шаблон{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={(val) => setSelectedTemplateId(val)}
                  >
                    <SelectTrigger className="h-10 rounded-2xl border-zinc-200 text-xs dark:border-zinc-800">
                      <SelectValue placeholder="Изберете шаблон" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                      {approvedTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {getCertificateTypeLabel(t.type)}: {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Recipient Mode Selector */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Получател на документа{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex rounded-xl bg-zinc-100 p-0.5 dark:bg-zinc-800">
                      <button
                        type="button"
                        onClick={() => setRecipientMode("member")}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                          recipientMode === "member"
                            ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-900 dark:text-white"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        👤 Картотека
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecipientMode("manual");
                          setSelectedMemberId(null);
                        }}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                          recipientMode === "manual"
                            ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-900 dark:text-white"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        ✏️ Външен участник
                      </button>
                    </div>
                  </div>

                  {/* Autocomplete Member Search */}
                  {recipientMode === "member" && (
                    <div className="space-y-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                      <div className="relative">
                        <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
                        <Input
                          placeholder="Търсене на състезател/член..."
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          className="h-8 rounded-xl border-zinc-200 bg-white pl-8 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                        />
                      </div>

                      {/* Member list chips */}
                      <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
                        {loadingMembers ? (
                          <div className="flex items-center justify-center p-3 text-xs text-zinc-400">
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                            Зареждане на членове...
                          </div>
                        ) : filteredMembers.length === 0 ? (
                          <p className="p-2 text-center text-[11px] text-zinc-400 italic">
                            Няма съвпадащи състезатели.
                          </p>
                        ) : (
                          filteredMembers.map((m) => {
                            const isSelected = selectedMemberId === m.id;
                            const fullName =
                              `${m.firstName} ${m.lastName}`.trim();
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleSelectMember(m)}
                                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors ${
                                  isSelected
                                    ? "bg-blue-600 font-bold text-white"
                                    : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                }`}
                              >
                                <div>
                                  <div>{fullName}</div>
                                  {m.educationInstitution && (
                                    <div
                                      className={`text-[10px] ${
                                        isSelected
                                          ? "text-blue-100"
                                          : "text-zinc-400"
                                      }`}
                                    >
                                      {m.educationInstitution}
                                    </div>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="size-3.5 shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recipient Details Inputs */}
                  <div className="space-y-2.5 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        Трите имена на получателя
                      </Label>
                      <Input
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="напр. Георги Иванов Иванов"
                        className="h-9 rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        Училище / Детска градина / Клуб
                      </Label>
                      <Input
                        value={recipientInstitution}
                        onChange={(e) =>
                          setRecipientInstitution(e.target.value)
                        }
                        placeholder="напр. СУ „Васил Левски“ • гр. Гълъбово"
                        className="h-9 rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Type-Specific Parameters */}
                {activeTemplate?.type === "award" && (
                  <div className="space-y-3 rounded-2xl border border-amber-200/50 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <Trophy className="size-3.5 text-amber-600" />
                      <span>Параметри на Грамотата</span>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                        Класиране / Отличие
                      </Label>
                      <Select
                        value={awardRank}
                        onValueChange={(val) => setAwardRank(val as AwardRank)}
                      >
                        <SelectTrigger className="h-8 rounded-xl border-amber-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="1st">
                            🥇 I-во Място (Шампион)
                          </SelectItem>
                          <SelectItem value="2nd">
                            🥈 II-ро Място (Вицешампион)
                          </SelectItem>
                          <SelectItem value="3rd">
                            🥉 III-то Място (Бронзов медал)
                          </SelectItem>
                          <SelectItem value="participant">
                            🎗️ Грамота за Участие
                          </SelectItem>
                          <SelectItem value="honorable">
                            ⭐ Почетна Грамота
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                        Турнир / Събитие
                      </Label>
                      <Input
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="h-8 rounded-xl border-amber-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                        Повод / Номинация (по избор)
                      </Label>
                      <Input
                        value={nomination}
                        onChange={(e) => setNomination(e.target.value)}
                        placeholder="напр. Най-перспективен млад състезател"
                        className="h-8 rounded-xl border-amber-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                )}

                {activeTemplate?.type === "voucher" && (
                  <div className="space-y-3 rounded-2xl border border-teal-200/50 bg-teal-50/50 p-3.5 dark:border-teal-900/40 dark:bg-teal-950/20">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-200">
                      <Ticket className="size-3.5 text-teal-600" />
                      <span>Параметри на Ваучера</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-teal-900 dark:text-teal-300">
                          Брой процедури / сесии
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={voucherSessions}
                          onChange={(e) =>
                            setVoucherSessions(Number(e.target.value))
                          }
                          className="h-8 rounded-xl border-teal-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-teal-900 dark:text-teal-300">
                          Срок на валидност (дни)
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={voucherValidityDays}
                          onChange={(e) =>
                            setVoucherValidityDays(Number(e.target.value))
                          }
                          className="h-8 rounded-xl border-teal-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTemplate?.type === "certificate" && (
                  <div className="space-y-3 rounded-2xl border border-blue-200/50 bg-blue-50/50 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                      <Award className="size-3.5 text-blue-600" />
                      <span>Параметри на Сертификата</span>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-blue-900 dark:text-blue-300">
                        Обучителни часове
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={hoursTrained}
                        onChange={(e) =>
                          setHoursTrained(Number(e.target.value))
                        }
                        className="h-8 rounded-xl border-blue-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-black text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Генериране на QR код & Издаване...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 size-4" />
                        Издай официален документ
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* RIGHT: Live Preview (7 cols) */}
          <div className="flex flex-col items-center justify-start space-y-4 lg:col-span-7">
            <div className="flex w-full items-center justify-between px-1">
              <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-zinc-500 uppercase">
                <Sparkles className="size-3.5 text-amber-500" />
                Визуализация в реално време
              </span>
              <span className="text-xs font-medium text-zinc-400">
                Сериен номер ще се генерира автоматично при запис
              </span>
            </div>

            <div className="flex w-full items-center justify-center rounded-3xl border border-zinc-200/80 bg-zinc-100/70 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              {activeTemplate ? (
                <div className="scale-0.85 sm:scale-0.95 origin-top transform transition-all">
                  <CertificateDocumentPreview
                    data={{
                      siteId,
                      type: activeTemplate.type,
                      title: activeTemplate.title,
                      visualConfig: activeTemplate.visualConfig,
                      serialNumber: `${siteId === "recoveryzone" ? "RZ" : "BKG"}-2026-LIVE`,
                      recipientName: recipientName || "Иван Петров Димитров",
                      recipientInstitution:
                        recipientInstitution ||
                        "СУ „Васил Левски“ • гр. Гълъбово",
                      rank: awardRank,
                      nomination,
                      eventTitle,
                      eventDate,
                      eventLocation,
                      totalSessions: voucherSessions,
                      sponsors,
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal upon issuance */}
      <Dialog
        open={Boolean(issuedSuccessDoc)}
        onOpenChange={(open) => {
          if (!open) {
            setIssuedSuccessDoc(null);
            onSwitchToRegistry();
          }
        }}
      >
        <DialogContent className="max-w-lg space-y-4 rounded-3xl border-zinc-200 p-6 text-center dark:border-zinc-800">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="size-8" />
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white">
              Документът е издаден успешно!
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Уникалният сериен номер и QR код бяха генерирани и записани в
              официалния регистър.
            </DialogDescription>
          </div>

          {issuedSuccessDoc && (
            <div className="space-y-3 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-500">
                  Сериен номер:
                </span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">
                  {issuedSuccessDoc.serialNumber}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-500">Получател:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {issuedSuccessDoc.recipient.name}
                </span>
              </div>

              {/* QR Code preview */}
              {issuedSuccessDoc.qrCodeDataUrl && (
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="rounded-xl border border-zinc-200 bg-white p-2 shadow-xs">
                    <Image
                      src={issuedSuccessDoc.qrCodeDataUrl}
                      alt="QR код за верификация"
                      width={120}
                      height={120}
                      className="size-28 object-contain"
                      style={{ width: "auto", height: "auto" }}
                      unoptimized
                    />
                  </div>
                  <span className="mt-1 font-mono text-[10px] text-zinc-400">
                    {publicUrl}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Social Share & Copy Buttons */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="h-10 rounded-2xl border-zinc-200 text-xs font-bold dark:border-zinc-800"
              >
                {copiedLink ? (
                  <>
                    <Check className="mr-1.5 size-3.5 text-emerald-600" />
                    Копирано!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-3.5" />
                    Копирай линк
                  </>
                )}
              </Button>

              <Button
                onClick={handleWebShare}
                className="h-10 rounded-2xl bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                <Share2 className="mr-1.5 size-3.5" />
                Сподели (Share)
              </Button>
            </div>

            {/* Direct Messenger Buttons */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <a
                href={`viber://forward?text=${encodeURIComponent(`Официален документ от БК Гълъбово: ${publicUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300"
              >
                <span>📱 Viber</span>
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Официален клубен документ: ${publicUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                <span>💬 WhatsApp</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
              >
                <span>📘 Facebook</span>
              </a>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              onClick={() => {
                setIssuedSuccessDoc(null);
                onSwitchToRegistry();
              }}
              className="w-full rounded-2xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
            >
              Към регистъра с издадени документи
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
