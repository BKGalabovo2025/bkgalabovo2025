/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional */
"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
  Wand2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { UniversalMediaUpload } from "@/components/shared/media/UniversalMediaUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  generateCertificateAiBackgroundAction,
  getAiApiStatusAction,
} from "@/lib/actions/certificate-ai-actions";
import { AiApiStatus } from "@/lib/ai/certificate-ai-service";
import { CERTIFICATE_PROMPT_RECIPES } from "@/lib/ai/certificate-prompts";
import { certificateTemplateService } from "@/services/certificate-template-service";
import {
  CertificateTemplate,
  CertificateTemplateCreateInput,
  CertificateType,
  FrameStyle,
  LayoutMode,
  LayoutTemplate,
  Orientation,
  SponsorPartner,
  TemplateStatus,
  TextColorMode,
  VisualConfig,
} from "@/types/certificates";

import { CertificateDocumentPreview } from "./CertificateDocumentPreview";

export interface TemplateWizardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: "bkgalabovo" | "recoveryzone";
  templateToEdit?: CertificateTemplate | null;
  sponsors: SponsorPartner[];
  onSaved: () => void;
}

const WIZARD_STEPS = [
  {
    id: 1,
    title: "Тип & Данни",
    icon: Trophy,
    desc: "Тип документ и заглавие",
  },
  { id: 2, title: "AI Фон & Визия", icon: Wand2, desc: "Ориентация и платно" },
  {
    id: 3,
    title: "Премиум Layout",
    icon: Sparkles,
    desc: "Canva-style подредба",
  },
  {
    id: 4,
    title: "Подписи & Партньори",
    icon: Users,
    desc: "Институции и лица",
  },
  {
    id: 5,
    title: "Преглед & Запис",
    icon: CheckCircle2,
    desc: "Финална активация",
  },
];

export function TemplateWizardDialog({
  isOpen,
  onClose,
  siteId,
  templateToEdit,
  sponsors,
  onSaved,
}: TemplateWizardDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // AI Generation State
  const [aiStatus, setAiStatus] = useState<AiApiStatus | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(
    "Deep royal blue and dark gold sports diploma background with luxury glowing badminton court lines, blank empty center"
  );

  // Step 1: Document Type & Basic Info (Starts clean!)
  const [type, setType] = useState<CertificateType>("award");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TemplateStatus>("approved");
  const [defaultValidityDays, setDefaultValidityDays] = useState<number>(180);
  const [defaultTotalSessions, setDefaultTotalSessions] = useState<number>(3);

  // Step 2 & 3: Visual & Layout
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(
    "custom_ai_background"
  );
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("classic_gold");
  const [layoutTemplate, setLayoutTemplate] =
    useState<LayoutTemplate>("official_award");
  const [aiBackgroundUrl, setAiBackgroundUrl] = useState<string>("");
  const [overlayOpacity, setOverlayOpacity] = useState<number>(25);
  const [textColorMode, setTextColorMode] = useState<TextColorMode>("auto");
  const [extraFreeSessions, setExtraFreeSessions] = useState<number>(2);
  const [contactPhone, setContactPhone] = useState<string>(
    "0899 38 83 38 / 0899 82 99 23"
  );

  // Step 4: Signatories & Honors & Sponsors
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryTitle, setSignatoryTitle] = useState("");
  const [coSignatoryName, setCoSignatoryName] = useState("");
  const [coSignatoryTitle, setCoSignatoryTitle] = useState("");
  const [badgeText, setBadgeText] = useState("ОФИЦИАЛНО ОТЛИЧИЕ");
  const [customNotes, setCustomNotes] = useState("");
  const [selectedSponsorIds, setSelectedSponsorIds] = useState<string[]>([]);

  // Initialize or Reset
  useEffect(() => {
    if (!isOpen) return;

    // Check AI status
    getAiApiStatusAction().then((status) => {
      if (status) {
        setAiStatus(status);
      }
    });

    if (templateToEdit) {
      setType(templateToEdit.type);
      setTitle(templateToEdit.title);
      setDescription(templateToEdit.description || "");
      setStatus(templateToEdit.status);
      setDefaultValidityDays(templateToEdit.defaultValidityDays || 180);
      setDefaultTotalSessions(templateToEdit.defaultTotalSessions || 3);

      const vc = templateToEdit.visualConfig;
      setOrientation(vc.orientation || "landscape");
      setLayoutMode(vc.layoutMode || "custom_ai_background");
      setFrameStyle(vc.frameStyle || "classic_gold");
      setLayoutTemplate(
        vc.layoutTemplate ||
          (templateToEdit.type === "voucher"
            ? "sports_voucher"
            : "official_award")
      );
      setAiBackgroundUrl(vc.aiBackgroundUrl || "");
      setOverlayOpacity(vc.overlayOpacity ?? 25);
      setTextColorMode(vc.textColorMode || "auto");
      setExtraFreeSessions(vc.extraFreeSessions ?? 2);
      setContactPhone(vc.contactPhone || "0899 38 83 38 / 0899 82 99 23");

      setSignatoryName(vc.signatoryName || "");
      setSignatoryTitle(vc.signatoryTitle || "");
      setCoSignatoryName(vc.coSignatoryName || "");
      setCoSignatoryTitle(vc.coSignatoryTitle || "");
      setBadgeText(vc.badgeText || "ОФИЦИАЛНО ОТЛИЧИЕ");
      setCustomNotes(vc.customNotes || "");
      setSelectedSponsorIds(vc.selectedSponsorIds || []);
    } else {
      // Starts CLEAN without placeholder defaults!
      setCurrentStep(1);
      setType("award");
      setTitle("");
      setDescription("");
      setStatus("approved");
      setDefaultValidityDays(180);
      setDefaultTotalSessions(siteId === "recoveryzone" ? 1 : 2);

      setOrientation("landscape");
      setLayoutMode("custom_ai_background");
      setFrameStyle("classic_gold");
      setLayoutTemplate(
        siteId === "recoveryzone" ? "recovery_voucher" : "official_award"
      );
      setAiBackgroundUrl("");
      setOverlayOpacity(25);
      setTextColorMode("auto");
      setExtraFreeSessions(2);
      setContactPhone("0899 38 83 38 / 0899 82 99 23");

      setSignatoryName(
        siteId === "recoveryzone" ? "Здравко Маринов" : "Димитър Иванов"
      );
      setSignatoryTitle(
        siteId === "recoveryzone" ? "Управител & Терапевт" : "Председател на УС"
      );
      setCoSignatoryName("");
      setCoSignatoryTitle("");
      setBadgeText("ОФИЦИАЛНО ОТЛИЧИЕ");
      setCustomNotes("");
      setSelectedSponsorIds(
        sponsors.filter((s) => s.isActive).map((s) => s.id)
      );
    }
  }, [isOpen, templateToEdit, siteId, sponsors]);

  // Handle Type Change with smart suggested layout
  const handleSelectType = (
    selectedType: CertificateType,
    initialBadge?: string
  ) => {
    setType(selectedType);
    if (initialBadge) setBadgeText(initialBadge);

    if (selectedType === "voucher") {
      setLayoutTemplate(
        siteId === "recoveryzone" ? "recovery_voucher" : "sports_voucher"
      );
      setBadgeText("БОНУС ВАУЧЕР");
    } else if (selectedType === "award") {
      setLayoutTemplate("official_award");
      setBadgeText("1-ВО МЯСТО");
    } else {
      setLayoutTemplate("classic_certificate");
      setBadgeText("СЕРТИФИКАТ ЗА УЧАСТИЕ");
    }
  };

  // AI Background Generator Action
  const handleGenerateAiBackground = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await generateCertificateAiBackgroundAction(
        siteId,
        aiPrompt,
        undefined,
        orientation,
        0
      );

      if (!res.success || !res.imageUrl) {
        toast.error(res.error || "Неуспешно генериране на фон.");
        return;
      }

      setAiBackgroundUrl(res.imageUrl);
      setLayoutMode("custom_ai_background");
      toast.success(
        res.providerUsed === "procedural_vector"
          ? "Генериран HD фон за платното (Готов за надграждане)!"
          : "Успешно генериран AI фон от Gemini Imagen 3!"
      );
    } catch (err) {
      console.error(err);
      toast.error("Възникна непредвидена грешка при AI генерацията.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Navigation Validation
  const canProceedNext = () => {
    if (currentStep === 1) {
      return title.trim().length >= 3;
    }
    return true;
  };

  const handleNextStep = () => {
    if (!canProceedNext()) {
      toast.error("Моля, попълнете заглавие на шаблона (минимум 3 символа).");
      return;
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Save Template Action
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Заглавието на шаблона е задължително!");
      setCurrentStep(1);
      return;
    }

    setIsSaving(true);
    try {
      const visualConfig: VisualConfig = {
        orientation,
        themeColor: siteId === "recoveryzone" ? "#064E3B" : "#1E3A8A",
        secondaryColor: siteId === "recoveryzone" ? "#10B981" : "#D97706",
        backgroundColor: "#FFFFFF",
        frameStyle,
        selectedSponsorIds,
        signatoryName,
        signatoryTitle,
        coSignatoryName: coSignatoryName || undefined,
        coSignatoryTitle: coSignatoryTitle || undefined,
        showBadge: Boolean(badgeText),
        badgeText: badgeText || undefined,
        customNotes: customNotes || undefined,
        layoutTemplate,
        extraFreeSessions: type === "voucher" ? extraFreeSessions : undefined,
        contactPhone: contactPhone || undefined,
        layoutMode,
        aiBackgroundUrl: aiBackgroundUrl || undefined,
        overlayOpacity,
        textColorMode,
        contentAlignment: "center",
      };

      const payload: CertificateTemplateCreateInput = {
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        visualConfig,
        defaultValidityDays:
          type === "voucher" ? defaultValidityDays : undefined,
        defaultTotalSessions:
          type === "voucher" ? defaultTotalSessions : undefined,
      };

      if (templateToEdit?.id) {
        await certificateTemplateService.updateTemplate(
          templateToEdit.id,
          payload,
          siteId
        );
        toast.success("Шаблонът е обновен успешно!");
      } else {
        await certificateTemplateService.createTemplate(siteId, payload);
        toast.success("Новият шаблон е създаден и активиран успешно!");
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Грешка при записване на шаблона.");
    } finally {
      setIsSaving(false);
    }
  };

  // Live Preview Object Construction
  const previewData = {
    siteId,
    type,
    title: title || "Предварителен Преглед на Документа",
    visualConfig: {
      orientation,
      themeColor: siteId === "recoveryzone" ? "#064E3B" : "#1E3A8A",
      secondaryColor: siteId === "recoveryzone" ? "#10B981" : "#D97706",
      backgroundColor: "#FFFFFF",
      frameStyle,
      selectedSponsorIds,
      signatoryName,
      signatoryTitle,
      coSignatoryName,
      coSignatoryTitle,
      showBadge: Boolean(badgeText),
      badgeText,
      customNotes,
      layoutTemplate,
      extraFreeSessions,
      contactPhone,
      layoutMode,
      aiBackgroundUrl,
      overlayOpacity,
      textColorMode,
    },
    serialNumber: "BKG-2026-LIVE",
    recipientName: "Александър Иванов Петров",
    recipientInstitution: "СУ „Васил Левски“ • Гълъбово",
    rank: "1st" as const,
    eventTitle: "Пролетен Турнир по Бадминтон „Гълъбово 2026“",
    totalSessions: defaultTotalSessions,
    sponsors,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[94vh] max-w-[96vw] flex-col gap-0 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 p-0 shadow-2xl xl:max-w-7xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* Header with Stepper */}
        <div className="shrink-0 border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-xl font-black text-zinc-900 dark:text-white">
                <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow-md">
                  <Sparkles className="size-5" />
                </span>
                <span>
                  {templateToEdit
                    ? "Редактиране на Шаблон (Wizard)"
                    : "Нов Шаблон за Документ (Wizard)"}
                </span>
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Създайте изящен документ с Canva-style визия, персонализиран AI
                фон и динамични векторни слоеве.
              </DialogDescription>
            </DialogHeader>

            {/* Stepper Progress Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {WIZARD_STEPS.map((step) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (step.id < currentStep || canProceedNext()) {
                        setCurrentStep(step.id);
                      }
                    }}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : isCompleted
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`flex size-5 items-center justify-center rounded-full text-[10px] font-black ${
                        isActive
                          ? "bg-white text-blue-600"
                          : isCompleted
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                      }`}
                    >
                      {isCompleted ? "✓" : step.id}
                    </span>
                    <StepIcon className="hidden size-3.5 sm:inline" />
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dual Pane Body: Left Controls (Step View) + Right Live Document Canvas */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
          {/* LEFT: STEP FORMS (5 cols on lg, 4 on xl) */}
          <div className="flex flex-col justify-between space-y-6 overflow-y-auto border-r border-zinc-200 bg-white p-5 sm:p-6 lg:col-span-5 xl:col-span-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="space-y-6">
              {/* STEP 1: TYPE & BASIC INFO */}
              {currentStep === 1 && (
                <div className="space-y-5 duration-200 animate-in fade-in">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-zinc-900 uppercase dark:text-white">
                      <Trophy className="size-4 text-amber-500" />
                      1. Изберете Тип Документ
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Формата започва на чисто. Изберете типа отличие, което
                      желаете да конфигурирате.
                    </p>
                  </div>

                  {/* 4 Visual Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectType("award", "1-ВО МЯСТО")}
                      className={`rounded-2xl border p-3.5 text-left transition-all ${
                        type === "award"
                          ? "border-amber-500 bg-amber-50/60 shadow-md ring-2 ring-amber-500/30 dark:bg-amber-950/30"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <span className="mb-1 block text-2xl">🏆</span>
                      <span className="block text-xs font-black text-zinc-900 dark:text-white">
                        Спортна Грамота
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                        За състезания, лагери, турнири и класирания.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectType("certificate", "СЕРТИФИКАТ")
                      }
                      className={`rounded-2xl border p-3.5 text-left transition-all ${
                        type === "certificate"
                          ? "border-blue-500 bg-blue-50/60 shadow-md ring-2 ring-blue-500/30 dark:bg-blue-950/30"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <span className="mb-1 block text-2xl">📜</span>
                      <span className="block text-xs font-black text-zinc-900 dark:text-white">
                        Официален Сертификат
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                        Спортна квалификация и тренировъчни часове.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectType("voucher", "БОНУС ВАУЧЕР")
                      }
                      className={`rounded-2xl border p-3.5 text-left transition-all ${
                        type === "voucher"
                          ? "border-emerald-500 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/30 dark:bg-emerald-950/30"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <span className="mb-1 block text-2xl">🎟️</span>
                      <span className="block text-xs font-black text-zinc-900 dark:text-white">
                        Подаръчен Ваучер
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                        Безплатни тренировки или възстановяване.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectType("award", "СПЕЦИАЛНО ОТЛИЧИЕ")
                      }
                      className={`rounded-2xl border p-3.5 text-left transition-all ${
                        badgeText === "СПЕЦИАЛНО ОТЛИЧИЕ" && type === "award"
                          ? "border-purple-500 bg-purple-50/60 shadow-md ring-2 ring-purple-500/30 dark:bg-purple-950/30"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <span className="mb-1 block text-2xl">⭐</span>
                      <span className="block text-xs font-black text-zinc-900 dark:text-white">
                        Почетно Отличие
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                        Индивидуални заслуги, феърплей и принос.
                      </span>
                    </button>
                  </div>

                  {/* Title (Starts empty) */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="templateTitle"
                      className="flex items-center justify-between text-xs font-bold"
                    >
                      <span>Заглавие на шаблона *</span>
                      <span className="text-[11px] font-normal text-zinc-400">
                        {title.length}/60 символа
                      </span>
                    </Label>
                    <Input
                      id="templateTitle"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="напр. Официална Грамота за Шампион 2026 или Ваучер за Безплатни Тренировки"
                      className="rounded-xl border-zinc-200 font-medium dark:border-zinc-800"
                      autoFocus
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="templateDesc" className="text-xs font-bold">
                      Вътрешно описание (по избор)
                    </Label>
                    <Textarea
                      id="templateDesc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Кратко описание за треньорите кога и как се връчва този документ..."
                      className="resize-none rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
                    />
                  </div>

                  {/* Status & Voucher Options */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">
                        Статус на шаблона
                      </Label>
                      <Select
                        value={status}
                        onValueChange={(val) =>
                          setStatus(val as TemplateStatus)
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="approved">
                            ✅ Одобрен за издаване
                          </SelectItem>
                          <SelectItem value="draft">
                            📝 Чернова (Draft)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {type === "voucher" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">
                          Брой сесии / тренировки
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={defaultTotalSessions}
                          onChange={(e) =>
                            setDefaultTotalSessions(Number(e.target.value) || 1)
                          }
                          className="rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: AI BACKGROUND & CANVAS */}
              {currentStep === 2 && (
                <div className="space-y-5 duration-200 animate-in fade-in">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-zinc-900 uppercase dark:text-white">
                      <Wand2 className="size-4 text-purple-500" />
                      2. AI Генератор на Фон & Ориентация
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      AI създава САМО чистото графично платно без букви.
                      Текстовете се наслагват от нашия векторни слой.
                    </p>
                  </div>

                  {/* Orientation Cards */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">
                      Ориентация на листа
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOrientation("landscape")}
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                          orientation === "landscape"
                            ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/30 dark:bg-blue-950/30"
                            : "border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        <div className="h-6 w-9 shrink-0 rounded-sm border-2 border-current" />
                        <div>
                          <span className="block text-xs font-black">
                            Landscape (16:9 / A4)
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            Хоризонтално
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrientation("portrait")}
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                          orientation === "portrait"
                            ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/30 dark:bg-blue-950/30"
                            : "border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        <div className="h-9 w-6 shrink-0 rounded-sm border-2 border-current" />
                        <div>
                          <span className="block text-xs font-black">
                            Portrait (3:4 / A4)
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            Вертикално
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Mode: AI vs HTML Border */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Тип фон</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={
                          layoutMode === "custom_ai_background"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setLayoutMode("custom_ai_background")}
                        className="gap-2 rounded-xl text-xs font-bold"
                      >
                        <Sparkles className="size-3.5" />
                        AI Пълен Фон
                      </Button>
                      <Button
                        type="button"
                        variant={
                          layoutMode === "standard_html" ? "default" : "outline"
                        }
                        onClick={() => setLayoutMode("standard_html")}
                        className="gap-2 rounded-xl text-xs font-bold"
                      >
                        <ImageIcon className="size-3.5" />
                        Векторна Рамка
                      </Button>
                    </div>
                  </div>

                  {/* AI Generation Box */}
                  {layoutMode === "custom_ai_background" && (
                    <div className="space-y-3 rounded-2xl border border-purple-200 bg-purple-50/40 p-4 dark:border-purple-900/50 dark:bg-purple-950/20">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-black text-purple-900 dark:text-purple-300">
                          <Sparkles className="size-3.5 text-purple-600" />
                          Студио за AI Промптове (Gemini Imagen 3)
                        </span>
                        {aiStatus && (
                          <Badge
                            variant="outline"
                            className="bg-white text-[10px] dark:bg-zinc-900"
                          >
                            🟢 Live API
                          </Badge>
                        )}
                      </div>

                      {/* Quick Prompt Pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {CERTIFICATE_PROMPT_RECIPES.slice(0, 4).map(
                          (recipe) => (
                            <button
                              key={recipe.id}
                              type="button"
                              onClick={() => setAiPrompt(recipe.basePrompt)}
                              className="rounded-lg border border-purple-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold transition-colors hover:bg-purple-100 dark:border-purple-800 dark:bg-zinc-900 dark:hover:bg-purple-900/50"
                            >
                              {recipe.name}
                            </button>
                          )
                        )}
                      </div>

                      <Textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={2}
                        className="resize-none rounded-xl border-purple-200 bg-white text-xs dark:border-purple-800 dark:bg-zinc-900"
                        placeholder="Опишете стила на фона..."
                      />

                      <Button
                        type="button"
                        onClick={handleGenerateAiBackground}
                        disabled={isGeneratingAi}
                        className="w-full gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700"
                      >
                        {isGeneratingAi ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Генериране на чисто платно...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="size-4" />
                            1-Click Генерирай / Регенерирай Фон
                          </>
                        )}
                      </Button>

                      {/* Fallback Custom Upload */}
                      <div className="border-t border-purple-200/60 pt-2 dark:border-purple-900/60">
                        <Label className="mb-1.5 block text-[11px] font-semibold text-zinc-500">
                          Или качете собствен арт фон:
                        </Label>
                        <UniversalMediaUpload
                          label=""
                          storageFolder="certificate-backgrounds"
                          value={aiBackgroundUrl}
                          onChange={(url) => {
                            if (url) {
                              setAiBackgroundUrl(url);
                              setLayoutMode("custom_ai_background");
                            }
                          }}
                          accept="image/*"
                        />
                      </div>
                    </div>
                  )}

                  {/* Contrast & Scrim Slider */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <Label className="flex justify-between text-xs font-bold">
                        <span>Затъмнение / Контраст</span>
                        <span className="text-zinc-500">{overlayOpacity}%</span>
                      </Label>
                      <input
                        type="range"
                        min="0"
                        max="70"
                        step="5"
                        value={overlayOpacity}
                        onChange={(e) =>
                          setOverlayOpacity(Number(e.target.value))
                        }
                        className="w-full cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">
                        Цвят на текстовете
                      </Label>
                      <Select
                        value={textColorMode}
                        onValueChange={(val) =>
                          setTextColorMode(val as TextColorMode)
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="auto">
                            Автоматичен (Auto)
                          </SelectItem>
                          <SelectItem value="light">⚪ Светъл текст</SelectItem>
                          <SelectItem value="dark">⚫ Тъмен текст</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PREMIUM CANVA LAYOUT */}
              {currentStep === 3 && (
                <div className="space-y-5 duration-200 animate-in fade-in">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-zinc-900 uppercase dark:text-white">
                      <Sparkles className="size-4 text-amber-500" />
                      3. Избор на Премиум Layout (Подредба)
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Изберете структурен дизайн за съдържанието, вградените
                      векторни илюстрации и акцентните блокове.
                    </p>
                  </div>

                  {/* 4 Layout Cards */}
                  <div className="space-y-2.5">
                    {/* Option A: Sports Voucher */}
                    <button
                      type="button"
                      onClick={() => setLayoutTemplate("sports_voucher")}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        layoutTemplate === "sports_voucher"
                          ? "border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/30 dark:bg-amber-950/30"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏸</span>
                          <div>
                            <span className="block text-sm font-black text-zinc-900 dark:text-white">
                              Спортен Ваучер / Флаер
                            </span>
                            <span className="text-xs text-zinc-500">
                              Цветни карета, акцентен блок „+ [ X ] БЕЗПЛАТНИ
                              ТРЕНИРОВКИ“, телефон и детски бадминтон арт.
                            </span>
                          </div>
                        </div>
                        {layoutTemplate === "sports_voucher" && (
                          <CheckCircle2 className="size-5 shrink-0 text-amber-600" />
                        )}
                      </div>
                    </button>

                    {/* Option B: Official Award */}
                    <button
                      type="button"
                      onClick={() => setLayoutTemplate("official_award")}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        layoutTemplate === "official_award"
                          ? "border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-500/30 dark:bg-blue-950/30"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏆</span>
                          <div>
                            <span className="block text-sm font-black text-zinc-900 dark:text-white">
                              Официална Грамота
                            </span>
                            <span className="text-xs text-zinc-500">
                              Двойни подписи (директор & председател),
                              институция, училище, лавров венец и официален
                              печат.
                            </span>
                          </div>
                        </div>
                        {layoutTemplate === "official_award" && (
                          <CheckCircle2 className="size-5 shrink-0 text-blue-600" />
                        )}
                      </div>
                    </button>

                    {/* Option C: Recovery Zone Voucher */}
                    <button
                      type="button"
                      onClick={() => setLayoutTemplate("recovery_voucher")}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        layoutTemplate === "recovery_voucher"
                          ? "border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/30 dark:bg-emerald-950/30"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💎</span>
                          <div>
                            <span className="block text-sm font-black text-zinc-900 dark:text-white">
                              Луксозен Ваучер Recovery Zone
                            </span>
                            <span className="text-xs text-zinc-500">
                              Тъмен/изумруден/златен изглед за масажи и
                              процедури Normatec, zen спа естетика.
                            </span>
                          </div>
                        </div>
                        {layoutTemplate === "recovery_voucher" && (
                          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                        )}
                      </div>
                    </button>

                    {/* Option D: Classic Certificate */}
                    <button
                      type="button"
                      onClick={() => setLayoutTemplate("classic_certificate")}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        layoutTemplate === "classic_certificate"
                          ? "border-purple-500 bg-purple-50/50 shadow-md ring-2 ring-purple-500/30 dark:bg-purple-950/30"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📜</span>
                          <div>
                            <span className="block text-sm font-black text-zinc-900 dark:text-white">
                              Официален Сертификат
                            </span>
                            <span className="text-xs text-zinc-500">
                              Спортна сертификация, постигнати стандарти и
                              сериен номер.
                            </span>
                          </div>
                        </div>
                        {layoutTemplate === "classic_certificate" && (
                          <CheckCircle2 className="size-5 shrink-0 text-purple-600" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Extra Layout Fields */}
                  {layoutTemplate === "sports_voucher" && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">
                          Брой безплатни тренировки
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={extraFreeSessions}
                          onChange={(e) =>
                            setExtraFreeSessions(Number(e.target.value) || 2)
                          }
                          className="rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">
                          Телефон за връзка
                        </Label>
                        <Input
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="напр. 0899 38 83 38"
                          className="rounded-xl font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: SIGNATORIES & SPONSORS */}
              {currentStep === 4 && (
                <div className="space-y-5 duration-200 animate-in fade-in">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-zinc-900 uppercase dark:text-white">
                      <Users className="size-4 text-blue-500" />
                      4. Подписващи Лица & Партньори
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Определете официалните лица и изберете кои институции и
                      спонсори да присъстват във футера.
                    </p>
                  </div>

                  {/* Primary Signatory */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">
                        Главно подписващо лице
                      </Label>
                      <Input
                        value={signatoryName}
                        onChange={(e) => setSignatoryName(e.target.value)}
                        placeholder="напр. Димитър Иванов"
                        className="rounded-xl font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Длъжност</Label>
                      <Input
                        value={signatoryTitle}
                        onChange={(e) => setSignatoryTitle(e.target.value)}
                        placeholder="напр. Председател на УС"
                        className="rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  {/* Co-Signatory (For Official Awards) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">
                        Второ подписващо лице (по избор)
                      </Label>
                      <Input
                        value={coSignatoryName}
                        onChange={(e) => setCoSignatoryName(e.target.value)}
                        placeholder="напр. Иванка Георгиева"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">
                        Длъжност (Второ лице)
                      </Label>
                      <Input
                        value={coSignatoryTitle}
                        onChange={(e) => setCoSignatoryTitle(e.target.value)}
                        placeholder="напр. Директор на СУ"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Badge Text */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">
                      Текст на почетната значка / бадж
                    </Label>
                    <Input
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="напр. ШАМПИОН, 1-ВО МЯСТО или ОФИЦИАЛНО ОТЛИЧИЕ"
                      className="rounded-xl text-xs font-bold tracking-wider uppercase"
                    />
                  </div>

                  {/* Sponsors Checklist */}
                  <div className="space-y-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold">
                        Активни Партньори & Спонсори във футера
                      </Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedSponsorIds(sponsors.map((s) => s.id))
                          }
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          Избери всички
                        </button>
                        <span className="text-zinc-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedSponsorIds([])}
                          className="text-[11px] text-zinc-500 hover:underline"
                        >
                          Премахни всички
                        </button>
                      </div>
                    </div>

                    <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto pr-1">
                      {sponsors.map((sp) => {
                        const isChecked = selectedSponsorIds.includes(sp.id);
                        return (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() => {
                              setSelectedSponsorIds((prev) =>
                                isChecked
                                  ? prev.filter((id) => id !== sp.id)
                                  : [...prev, sp.id]
                              );
                            }}
                            className={`flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all ${
                              isChecked
                                ? "border-blue-500 bg-blue-50/50 font-bold dark:bg-blue-950/30"
                                : "border-zinc-200 opacity-60 dark:border-zinc-800"
                            }`}
                          >
                            <div
                              className={`flex size-4 items-center justify-center rounded border ${
                                isChecked
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-zinc-300 dark:border-zinc-700"
                              }`}
                            >
                              {isChecked && <Check className="size-3" />}
                            </div>
                            <span className="truncate text-xs">{sp.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & SAVE */}
              {currentStep === 5 && (
                <div className="space-y-5 duration-200 animate-in fade-in">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-zinc-900 uppercase dark:text-white">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      5. Преглед & Финална Активация
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Проверете настройките вдясно. Всичко е готово за запис и
                      мигновено издаване на документи.
                    </p>
                  </div>

                  {/* Summary Parameter Badges */}
                  <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500">
                        Заглавие:
                      </span>
                      <span className="text-xs font-black text-zinc-900 dark:text-white">
                        {title || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500">
                        Тип документ:
                      </span>
                      <Badge variant="outline" className="text-xs font-bold">
                        {type === "award"
                          ? "🏆 Грамота"
                          : type === "voucher"
                            ? "🎟️ Ваучер"
                            : "📜 Сертификат"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500">
                        Layout модел:
                      </span>
                      <Badge variant="secondary" className="text-xs font-bold">
                        {layoutTemplate}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500">
                        Ориентация:
                      </span>
                      <span className="text-xs font-bold">
                        {orientation === "landscape"
                          ? "Landscape (Хоризонтално)"
                          : "Portrait (Вертикално)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500">
                        AI Фон:
                      </span>
                      <span className="text-xs font-bold">
                        {aiBackgroundUrl
                          ? "✅ Активен генериран фон"
                          : "Стандартен HTML"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500">
                        Избрани спонсори:
                      </span>
                      <span className="text-xs font-bold">
                        {selectedSponsorIds.length} бр.
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-sm font-black text-white shadow-xl shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="size-5 animate-spin" />
                        Запазване на шаблона...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-5" />
                        Запази & Активирай Шаблона
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Stepper Footer Controls (Назад / Напред) */}
            <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="gap-1.5 rounded-xl text-xs font-bold"
              >
                <ArrowLeft className="size-4" />
                Назад
              </Button>

              <span className="text-xs font-bold text-zinc-400">
                Стъпка {currentStep} от 5
              </span>

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canProceedNext()}
                  className="gap-1.5 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
                >
                  Напред
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-1.5 rounded-xl bg-emerald-600 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700"
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Запази
                </Button>
              )}
            </div>
          </div>

          {/* RIGHT: LIVE INTERACTIVE PREVIEW CANVAS (7 cols on lg) */}
          <div className="flex flex-col items-center justify-center overflow-y-auto bg-zinc-100 p-4 sm:p-6 lg:col-span-7 lg:p-8 xl:col-span-7 dark:bg-zinc-950/80">
            <div className="flex w-full max-w-3xl flex-col items-center space-y-3">
              <div className="flex w-full items-center justify-between px-2 text-xs font-bold text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                  Интерактивен Преглед в Реално Време
                </span>
                <span className="font-mono text-[10px] tracking-wider uppercase">
                  {orientation} • {layoutTemplate}
                </span>
              </div>

              {/* Document Canvas */}
              <div className="flex w-full items-center justify-center transition-all duration-300">
                <CertificateDocumentPreview
                  data={previewData}
                  className="shadow-2xl transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
