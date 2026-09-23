/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional, @typescript-eslint/no-unused-vars, sonarjs/unused-import */
"use client";

import {
  Check,
  CheckCircle2,
  Loader2,
  Paintbrush,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { UniversalMediaUpload } from "@/components/shared/media/UniversalMediaUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  getFrameStyleLabel,
  LayoutMode,
  Orientation,
  SponsorPartner,
  TemplateStatus,
  TextColorMode,
  VisualConfig,
} from "@/types/certificates";

import { CertificateDocumentPreview } from "./CertificateDocumentPreview";

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: "bkgalabovo" | "recoveryzone";
  template: CertificateTemplate | null;
  sponsors: SponsorPartner[];
  onSaved: () => Promise<void>;
}

export function TemplateEditorDialog({
  open,
  onOpenChange,
  siteId,
  template,
  sponsors,
  onSaved,
}: TemplateEditorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CertificateType>("award");
  const [status, setStatus] = useState<TemplateStatus>("approved");
  const [defaultValidityDays, setDefaultValidityDays] = useState<number>(180);
  const [defaultTotalSessions, setDefaultTotalSessions] = useState<number>(5);

  // Visual Config State
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("classic_gold");
  const [signatoryName, setSignatoryName] = useState("Димитър Иванов");
  const [signatoryTitle, setSignatoryTitle] = useState(
    "Председател на БК Гълъбово"
  );
  const [badgeText, setBadgeText] = useState("ОФИЦИАЛНО ОТЛИЧИЕ");
  const [customNotes, setCustomNotes] = useState("");
  const [selectedSponsorIds, setSelectedSponsorIds] = useState<string[]>([]);

  // AI Background & Overlay State
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("standard_html");
  const [aiBackgroundUrl, setAiBackgroundUrl] = useState<string>("");
  const [overlayOpacity, setOverlayOpacity] = useState<number>(20);
  const [textColorMode, setTextColorMode] = useState<TextColorMode>("auto");

  // AI Prompt Studio State
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    "kids_badminton_award"
  );
  const [customPromptText, setCustomPromptText] = useState<string>(
    () => CERTIFICATE_PROMPT_RECIPES[0]?.basePrompt || ""
  );
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiApiStatus, setAiApiStatus] = useState<AiApiStatus | null>(null);
  const [variantIndex, setVariantIndex] = useState<number>(0);
  const [isAiGeneratedActive, setIsAiGeneratedActive] =
    useState<boolean>(false);

  // Fetch AI API status on mount
  useEffect(() => {
    let isMounted = true;
    getAiApiStatusAction()
      .then((status) => {
        if (isMounted) setAiApiStatus(status);
      })
      .catch((err) => console.error("Could not fetch AI API status:", err));
    return () => {
      isMounted = false;
    };
  }, [open]);

  // Initialize form when template opens
  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description || "");
      setType(template.type);
      setStatus(template.status);
      setDefaultValidityDays(template.defaultValidityDays || 180);
      setDefaultTotalSessions(template.defaultTotalSessions || 5);

      const vc = template.visualConfig;
      setOrientation(vc.orientation || "landscape");
      setFrameStyle(vc.frameStyle || "classic_gold");
      setSignatoryName(vc.signatoryName || "Димитър Иванов");
      setSignatoryTitle(vc.signatoryTitle || "Председател на БК Гълъбово");
      setBadgeText(vc.badgeText || "ОФИЦИАЛНО ОТЛИЧИЕ");
      setCustomNotes(vc.customNotes || "");
      setSelectedSponsorIds(vc.selectedSponsorIds || []);

      setLayoutMode(vc.layoutMode || "standard_html");
      setAiBackgroundUrl(vc.aiBackgroundUrl || "");
      setOverlayOpacity(vc.overlayOpacity ?? 20);
      setTextColorMode(vc.textColorMode || "auto");
      setIsAiGeneratedActive(Boolean(vc.aiBackgroundUrl));
      setVariantIndex(0);
    } else {
      // Defaults for new template
      const isRz = siteId === "recoveryzone";
      setTitle(
        isRz ? "Нов Ваучер за Възстановяване" : "Нова Официална Грамота"
      );
      setDescription("");
      setType(isRz ? "voucher" : "award");
      setStatus("approved");
      setDefaultValidityDays(isRz ? 90 : 180);
      setDefaultTotalSessions(isRz ? 5 : 1);

      setOrientation("landscape");
      setFrameStyle(isRz ? "luxury_dark" : "classic_gold");
      setSignatoryName(isRz ? "Здравко Мутафчиев" : "Димитър Иванов");
      setSignatoryTitle(
        isRz ? "Recovery Zone by ZM" : "Председател на БК Гълъбово"
      );
      setBadgeText(isRz ? "GIFT VOUCHER" : "ОФИЦИАЛНО ОТЛИЧИЕ");
      setCustomNotes("");
      setSelectedSponsorIds(
        sponsors.filter((s) => s.isActive).map((s) => s.id)
      );

      setLayoutMode("custom_ai_background");
      setAiBackgroundUrl("");
      setOverlayOpacity(20);
      setTextColorMode("auto");
      const defaultRecipe = isRz
        ? "recovery_wellness_voucher"
        : "kids_badminton_award";
      setSelectedRecipeId(defaultRecipe);
      const rec = CERTIFICATE_PROMPT_RECIPES.find(
        (r) => r.id === defaultRecipe
      );
      if (rec) setCustomPromptText(rec.basePrompt);
      setIsAiGeneratedActive(false);
      setVariantIndex(0);
    }
  }, [template, siteId, sponsors, open]);

  const toggleSponsorSelection = (sponsorId: string) => {
    setSelectedSponsorIds((prev) =>
      prev.includes(sponsorId)
        ? prev.filter((id) => id !== sponsorId)
        : [...prev, sponsorId]
    );
  };

  const handleSelectAllSponsors = () => {
    if (selectedSponsorIds.length === sponsors.length) {
      setSelectedSponsorIds([]);
    } else {
      setSelectedSponsorIds(sponsors.map((s) => s.id));
    }
  };

  // Active AI Recipe
  const activeRecipe =
    CERTIFICATE_PROMPT_RECIPES.find((r) => r.id === selectedRecipeId) ||
    CERTIFICATE_PROMPT_RECIPES[0];

  const handleDirectAiGenerate = async (isRetry = false) => {
    try {
      setIsGeneratingAi(true);
      const nextVariant = isRetry ? variantIndex + 1 : 0;
      const promptToUse = customPromptText.trim() || activeRecipe.basePrompt;
      toast.info(
        isRetry
          ? `AI модулът генерира нов вариант #${nextVariant + 1}...`
          : "AI агентът генерира нов визуален фон за грамотата..."
      );
      const res = await generateCertificateAiBackgroundAction(
        siteId,
        promptToUse,
        selectedRecipeId,
        orientation,
        nextVariant
      );

      if (res.success && res.imageUrl) {
        setAiBackgroundUrl(res.imageUrl);
        setVariantIndex(nextVariant);
        setIsAiGeneratedActive(true);
        if (res.note) {
          toast.success(res.note);
        } else {
          toast.success(
            isRetry
              ? `Вариант #${nextVariant + 1} е готов и приложен в Live Preview!`
              : "AI фонът беше приложен успешно в Live Preview!"
          );
        }
      } else {
        toast.error(res.error || "Неуспешна AI генерация на фон.");
      }
    } catch (err) {
      console.error("Грешка при AI генерация:", err);
      toast.error("Възникна грешка при свързване с AI модула.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Моля, въведете заглавие на шаблона.");
      return;
    }

    try {
      setIsSubmitting(true);
      const visualConfig: VisualConfig = {
        orientation,
        frameStyle,
        layoutTemplate: "official_award",
        themeColor: frameStyle === "luxury_dark" ? "#09090B" : "#1E3A8A",
        secondaryColor: frameStyle === "luxury_dark" ? "#EAB308" : "#D97706",
        backgroundColor: frameStyle === "luxury_dark" ? "#18181B" : "#FFFFFF",
        signatoryName: signatoryName.trim(),
        signatoryTitle: signatoryTitle.trim(),
        showBadge: Boolean(badgeText.trim()),
        badgeText: badgeText.trim() || undefined,
        customNotes: customNotes.trim() || undefined,
        selectedSponsorIds,

        // AI Background & Overlay
        layoutMode,
        aiBackgroundUrl: aiBackgroundUrl.trim() || undefined,
        overlayOpacity,
        textColorMode,
        contentAlignment: "center",
      };

      const payload: CertificateTemplateCreateInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        status,
        visualConfig,
        defaultValidityDays:
          type === "voucher" ? Number(defaultValidityDays) : undefined,
        defaultTotalSessions:
          type === "voucher" ? Number(defaultTotalSessions) : undefined,
      };

      if (template) {
        await certificateTemplateService.updateTemplate(
          template.id,
          payload,
          siteId
        );
        toast.success(`Шаблонът "${title}" беше обновен успешно.`);
      } else {
        await certificateTemplateService.createTemplate(siteId, payload);
        toast.success(`Шаблонът "${title}" беше създаден успешно.`);
      }

      onOpenChange(false);
      await onSaved();
    } catch (error) {
      console.error("Грешка при запис на шаблон:", error);
      toast.error("Възникна грешка при запазването на шаблона.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview Data
  const previewVisualConfig: VisualConfig = {
    orientation,
    frameStyle,
    layoutTemplate: "official_award",
    themeColor: frameStyle === "luxury_dark" ? "#09090B" : "#1E3A8A",
    secondaryColor: frameStyle === "luxury_dark" ? "#EAB308" : "#D97706",
    backgroundColor: frameStyle === "luxury_dark" ? "#18181B" : "#FFFFFF",
    signatoryName,
    signatoryTitle,
    showBadge: Boolean(badgeText.trim()),
    badgeText,
    customNotes,
    selectedSponsorIds,
    layoutMode,
    aiBackgroundUrl,
    overlayOpacity,
    textColorMode,
    contentAlignment: "center",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto rounded-3xl border-zinc-200 p-6 dark:border-zinc-800">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white">
                {template ? "Редактиране на Шаблон" : "Нов Шаблон за Документ"}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Конфигурирайте визуален стил, рамка или AI генериран фон с
                предварителен преглед в реално време.
              </DialogDescription>
            </div>

            <Badge
              variant="outline"
              className={`rounded-xl border px-3 py-1 text-xs font-bold ${
                status === "approved"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
              }`}
            >
              {status === "approved"
                ? "✅ Одобрен (Approved)"
                : "📝 Чернова (Draft)"}
            </Badge>
          </div>
        </DialogHeader>

        {/* 2-Column Split: Left Controls / Right Live Preview */}
        <div className="grid grid-cols-1 gap-6 pt-2 lg:grid-cols-12">
          {/* LEFT: Controls Form (5 cols) */}
          <form
            onSubmit={handleSubmit}
            id="template-editor-form"
            className="space-y-4 lg:col-span-5"
          >
            {/* Title & Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Заглавие на шаблона <span className="text-red-500">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="напр. Грамота за 1-во място"
                className="h-9 rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Тип документ
                </Label>
                <Select
                  value={type}
                  onValueChange={(val) => setType(val as CertificateType)}
                >
                  <SelectTrigger className="h-9 rounded-xl border-zinc-200 text-xs dark:border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                    <SelectItem value="award">🏆 Грамота</SelectItem>
                    <SelectItem value="voucher">🎟️ Ваучер</SelectItem>
                    <SelectItem value="certificate">📜 Сертификат</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Ориентация
                </Label>
                <Select
                  value={orientation}
                  onValueChange={(val) => setOrientation(val as Orientation)}
                >
                  <SelectTrigger className="h-9 rounded-xl border-zinc-200 text-xs dark:border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                    <SelectItem value="landscape">🖼️ Пейзаж</SelectItem>
                    <SelectItem value="portrait">📄 Портрет</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Статус
                </Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as TemplateStatus)}
                >
                  <SelectTrigger className="h-9 rounded-xl border-zinc-200 text-xs dark:border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                    <SelectItem value="approved">✅ Одобрен</SelectItem>
                    <SelectItem value="draft">📝 Чернова</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* VISUAL DESIGN MODE SWITCHER */}
            <div className="space-y-2 rounded-2xl border border-indigo-200/70 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/30 p-3.5 dark:border-indigo-900/60 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-zinc-900">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-black text-indigo-950 dark:text-indigo-200">
                  <Sparkles className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                  Визуален Дизайн & Фон
                </Label>
                <Badge
                  variant="outline"
                  className="border-indigo-300 bg-white/90 text-[10px] font-bold text-indigo-800 dark:bg-zinc-900 dark:text-indigo-300"
                >
                  {layoutMode === "custom_ai_background"
                    ? "🪄 AI Пълен Фон"
                    : "🎨 HTML/CSS Рамка"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setLayoutMode("standard_html")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2 text-xs font-bold transition-all ${
                    layoutMode === "standard_html"
                      ? "border-indigo-500 bg-white text-indigo-800 shadow-xs dark:bg-zinc-900 dark:text-indigo-200"
                      : "border-transparent bg-transparent text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-900/60"
                  }`}
                >
                  <Paintbrush className="size-3.5" />
                  HTML/CSS Рамка
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutMode("custom_ai_background")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2 text-xs font-bold transition-all ${
                    layoutMode === "custom_ai_background"
                      ? "border-transparent bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs"
                      : "border-transparent bg-transparent text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-900/60"
                  }`}
                >
                  <Wand2 className="size-3.5" />
                  Custom AI Фон
                </button>
              </div>
            </div>

            {/* CONDITIONAL CONTROLS BASED ON LAYOUT MODE */}
            {layoutMode === "custom_ai_background" ? (
              <div className="space-y-4 rounded-2xl border border-purple-200/60 bg-purple-50/30 p-3.5 dark:border-purple-900/40 dark:bg-purple-950/15">
                {/* 1. DIRECT AI GENERATOR STUDIO */}
                <div className="space-y-3 rounded-xl border border-purple-200/80 bg-white p-3.5 shadow-2xs dark:border-purple-900/60 dark:bg-zinc-900/90">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-black text-purple-900 dark:text-purple-200">
                      <Sparkles className="size-4 text-purple-600 dark:text-purple-400" />
                      Директен AI Генератор на Фон
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="border-purple-200 bg-purple-50 text-[10px] font-bold text-purple-700 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                      >
                        {orientation === "landscape"
                          ? "🖼️ Пейзаж (16:9)"
                          : "📄 Портрет (3:4)"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      >
                        {aiApiStatus?.activeModelName || "FLUX Neural AI"}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Изберете тематичен стил или въведете описание. AI агентът ще
                    генерира уникален визуален фон с чист празен център за
                    текста на грамотата.
                  </p>

                  {/* Theme Selector */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      Стил / Тематика на документа
                    </Label>
                    <Select
                      value={selectedRecipeId}
                      onValueChange={(val) => {
                        setSelectedRecipeId(val);
                        const r = CERTIFICATE_PROMPT_RECIPES.find(
                          (rec) => rec.id === val
                        );
                        if (r) {
                          setCustomPromptText(r.basePrompt);
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 rounded-xl border-zinc-200 bg-zinc-50 text-xs dark:border-zinc-700 dark:bg-zinc-800/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {CERTIFICATE_PROMPT_RECIPES.map((r) => (
                          <SelectItem
                            key={r.id}
                            value={r.id}
                            className="text-xs font-medium"
                          >
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Editable AI Prompt Textarea */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Промпт за AI генерация (можете да го редактирате)
                      </Label>
                      <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                        Празен център за текст
                      </span>
                    </div>
                    <textarea
                      value={customPromptText}
                      onChange={(e) => setCustomPromptText(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-purple-200 bg-purple-50/40 p-2.5 text-xs leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none dark:border-purple-900/60 dark:bg-zinc-950 dark:text-zinc-200"
                      placeholder="Опишете визуалните елементи на фона..."
                    />
                  </div>

                  {/* Generation Actions: Generate / Retry / Remove */}
                  {isAiGeneratedActive || aiBackgroundUrl ? (
                    <div className="space-y-2.5 rounded-xl border border-purple-200/70 bg-purple-50/50 p-2.5 dark:border-purple-900/50 dark:bg-purple-950/30">
                      <div className="flex items-center justify-between px-1">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-purple-900 dark:text-purple-200">
                          <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
                          Генериран вариант #{variantIndex + 1}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                          Приложен в Live Preview
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleDirectAiGenerate(true)}
                          disabled={isGeneratingAi}
                          className="h-9 rounded-xl border-purple-300 bg-white text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-50 dark:border-purple-800 dark:bg-zinc-900 dark:text-purple-300 dark:hover:bg-purple-950/50"
                        >
                          {isGeneratingAi ? (
                            <>
                              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                              Генериране...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="mr-1.5 size-3.5 text-purple-600 dark:text-purple-400" />
                              🔄 Генерирай друг вариант
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setAiBackgroundUrl("");
                            setIsAiGeneratedActive(false);
                            toast.info("Фонът беше премахнат.");
                          }}
                          disabled={isGeneratingAi}
                          className="h-9 rounded-xl border-red-200 bg-white text-xs font-bold text-red-600 shadow-2xs hover:bg-red-50 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="mr-1.5 size-3.5" />
                          Премахни фона
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleDirectAiGenerate(false)}
                      disabled={isGeneratingAi}
                      className="h-10 w-full rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-xs font-bold text-white shadow-md transition-all hover:from-purple-700 hover:to-blue-700"
                    >
                      {isGeneratingAi ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          AI агентът генерира визуален фон...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 size-4 text-yellow-300" />✨
                          Генерирай фон с AI
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* 2. OPTIONAL: UPLOAD CUSTOM DESIGNER BACKGROUND */}
                <div className="space-y-1.5 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Или качи собствен файл за фон (по избор)
                    </Label>
                    <span className="text-[10px] text-zinc-400">
                      PNG / JPG / WebP
                    </span>
                  </div>
                  <UniversalMediaUpload
                    id="template-ai-bg-upload"
                    value={aiBackgroundUrl}
                    onChange={(url) => {
                      setAiBackgroundUrl(url);
                      setIsAiGeneratedActive(true);
                      toast.success("Фонът е качен успешно!");
                    }}
                    storageFolder="certificate-backgrounds"
                    accept="image/*"
                    label="Качи файл за фон"
                    description="Препоръчително съотношение: A4 или 16:9 Landscape (1920x1080)"
                  />
                </div>

                {/* 4. OVERLAY OPACITY & TEXT CONTRAST */}
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Затъмняване (Overlay)
                      </Label>
                      <span className="font-mono text-[10px] font-bold text-purple-600">
                        {overlayOpacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={70}
                      step={5}
                      value={overlayOpacity}
                      onChange={(e) =>
                        setOverlayOpacity(Number(e.target.value))
                      }
                      className="h-1.5 w-full cursor-pointer rounded-lg bg-zinc-200 accent-purple-600 dark:bg-zinc-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      Контраст на текста
                    </Label>
                    <Select
                      value={textColorMode}
                      onValueChange={(val) =>
                        setTextColorMode(val as TextColorMode)
                      }
                    >
                      <SelectTrigger className="h-8 rounded-lg text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="light" className="text-xs">
                          ⚪ Светъл текст (за тъмен фон)
                        </SelectItem>
                        <SelectItem value="dark" className="text-xs">
                          ⚫ Тъмен текст (за светъл фон)
                        </SelectItem>
                        <SelectItem value="auto" className="text-xs">
                          ⚡ Автоматичен
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              /* STANDARD HTML/CSS CONTROLS */
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Стил на рамката
                </Label>
                <Select
                  value={frameStyle}
                  onValueChange={(val) => setFrameStyle(val as FrameStyle)}
                >
                  <SelectTrigger className="h-9 rounded-xl border-zinc-200 text-xs dark:border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                    <SelectItem value="classic_gold">
                      🏆 Classic Gold
                    </SelectItem>
                    <SelectItem value="modern_minimal">
                      ✨ Modern Minimal
                    </SelectItem>
                    <SelectItem value="sport_champion">
                      🏸 Sport Champion
                    </SelectItem>
                    <SelectItem value="luxury_dark">💎 Luxury Dark</SelectItem>
                    <SelectItem value="voucher_ticket">
                      🎟️ Voucher Ticket
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Signatory Name & Title */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Подписващ (Име)
                </Label>
                <Input
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="h-9 rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Длъжност
                </Label>
                <Input
                  value={signatoryTitle}
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  className="h-9 rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
                />
              </div>
            </div>

            {/* Badge text */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Текст на значката (Badge)
              </Label>
              <Input
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="напр. ОФИЦИАЛНО ОТЛИЧИЕ"
                className="h-9 rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
              />
            </div>

            {/* Custom Notes / Default Narrative */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Стандартен описателен текст
              </Label>
              <Textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="За отлични спортни резултати, отдаденост и спортсменски дух..."
                rows={2}
                className="rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
              />
            </div>

            {/* If voucher: validity & sessions */}
            {type === "voucher" && (
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-amber-200/50 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                    Валидност (дни)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={defaultValidityDays}
                    onChange={(e) =>
                      setDefaultValidityDays(Number(e.target.value))
                    }
                    className="h-8 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                    Брой процедури / сесии
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={defaultTotalSessions}
                    onChange={(e) =>
                      setDefaultTotalSessions(Number(e.target.value))
                    }
                    className="h-8 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            {/* Sponsor Selector [x] */}
            <div className="space-y-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Включени спонсори в долния колонтитул
                </Label>
                <button
                  type="button"
                  onClick={handleSelectAllSponsors}
                  className="text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                >
                  {selectedSponsorIds.length === sponsors.length
                    ? "Откажи всички"
                    : "Маркирай всички"}
                </button>
              </div>

              <div className="max-h-24 space-y-1.5 overflow-y-auto pr-1">
                {sponsors.length === 0 ? (
                  <p className="text-[11px] text-zinc-400 italic">
                    Няма регистрирани спонсори в таб „Партньори & Спонсори“.
                  </p>
                ) : (
                  sponsors.map((sp) => {
                    const isSelected = selectedSponsorIds.includes(sp.id);
                    return (
                      <label
                        key={sp.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-2 text-xs transition-colors ${
                          isSelected
                            ? "border-blue-300 bg-white dark:border-blue-700 dark:bg-zinc-900"
                            : "border-transparent bg-transparent hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSponsorSelection(sp.id)}
                            className="size-3.5 rounded border-zinc-300 text-blue-600"
                          />
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {sp.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          {sp.category}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </form>

          {/* RIGHT: Real-time Live Preview (7 cols) */}
          <div className="flex flex-col items-center justify-start rounded-3xl border border-zinc-200/60 bg-zinc-100/70 p-4 lg:col-span-7 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex w-full items-center justify-between pb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-zinc-500 uppercase">
                <Sparkles className="size-3.5 text-amber-500" />
                Live Preview (Реално време)
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-lg text-[10px]">
                  {orientation === "landscape" ? "🖼️ Пейзаж" : "📄 Портрет"}
                </Badge>
                {layoutMode === "custom_ai_background" ? (
                  <Badge
                    variant="outline"
                    className="rounded-lg border-purple-300 bg-purple-50 text-[10px] text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                  >
                    🪄 AI Динамичен Слой
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-lg text-[10px]">
                    {getFrameStyleLabel(frameStyle)}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex w-full items-center justify-center overflow-hidden py-2">
              <div className="scale-0.8 sm:scale-0.9 origin-top transform transition-all">
                <CertificateDocumentPreview
                  data={{
                    siteId,
                    type,
                    title,
                    visualConfig: previewVisualConfig,
                    serialNumber: `${siteId === "recoveryzone" ? "RZ" : "BKG"}-2026-DEMO`,
                    sponsors,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-2xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
          >
            Отказ
          </Button>
          <Button
            type="submit"
            form="template-editor-form"
            disabled={isSubmitting}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-xs font-bold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Запазване...
              </>
            ) : template ? (
              "Запази промените"
            ) : (
              "Създай шаблон"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
