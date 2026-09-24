/* eslint-disable react/forbid-dom-props, sonarjs/cognitive-complexity, sonarjs/no-nested-conditional */
"use client";

import {
  ArrowLeft,
  ArrowRight,
  Award,
  Baby,
  Calendar,
  Check,
  CheckCircle2,
  Crown,
  Download,
  FileDown,
  FileText,
  Info,
  Languages,
  Leaf,
  Loader2,
  Palette,
  Printer,
  QrCode,
  RefreshCw,
  Sliders,
  Sparkles,
  Ticket,
  Trophy,
  Users,
  Wand2,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
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
  generateCertificateAiBackgroundBatchAction,
  getAiApiStatusAction,
  translateBulgarianPromptAction,
} from "@/lib/actions/certificate-ai-actions";
import { AiApiStatus } from "@/lib/ai/certificate-ai-service";
import {
  CertificateExportResolution,
  exportCertificatePdf,
  exportCertificatePng,
  exportTwoPageCertificatePdf,
  printCertificate,
} from "@/lib/certificate-export-helpers";
import { certificateTemplateService } from "@/services/certificate-template-service";
import {
  AwardRank,
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

import {
  CertificateBacksidePreview,
  CertificateDocumentPreview,
} from "./CertificateDocumentPreview";

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
    title: "AI Prompt Studio",
    icon: Wand2,
    desc: "Тип, аудитория & AI фон",
  },
  {
    id: 2,
    title: "Адаптивен Layout",
    icon: Sparkles,
    desc: "Ориентация, рамка & цветове",
  },
  {
    id: 3,
    title: "Гръб & Специфики",
    icon: FileText,
    desc: "Двустранност & ваучери",
  },
  {
    id: 4,
    title: "Подписи & Партньори",
    icon: Users,
    desc: "Институции, печати & спонсори",
  },
  {
    id: 5,
    title: "Преглед & Запис",
    icon: CheckCircle2,
    desc: "Заглавие, тест & запис",
  },
];

interface GeneratedBatchVariant {
  imageUrl: string;
  providerUsed: string;
  variantIndex: number;
  note?: string;
}

// Curated Luxury Color Palettes
const CURATED_PALETTES = [
  {
    id: "royal_gold",
    name: "Кралско синьо & Злато",
    text: "#FFFFFF",
    accent: "#F59E0B",
  },
  {
    id: "luxury_dark",
    name: "Тъмен Луксозен Гланц",
    text: "#F8FAFC",
    accent: "#D97706",
  },
  {
    id: "emerald_spa",
    name: "Изумруд & Спа Уелнес",
    text: "#ECFDF5",
    accent: "#10B981",
  },
  {
    id: "sports_energetic",
    name: "Спортно Синьо & Червено",
    text: "#FFFFFF",
    accent: "#EF4444",
  },
  {
    id: "classic_navy",
    name: "Чисто Бяло & Тъмен Текст",
    text: "#0F172A",
    accent: "#2563EB",
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

  // Mode: AI Prompt Engine (Default - starts from blank sheet!) vs Manual Design
  const [wizardMode, setWizardMode] = useState<
    "ai_prompt_engine" | "manual_design"
  >("ai_prompt_engine");

  // AI Generation & Status State
  const [aiStatus, setAiStatus] = useState<AiApiStatus | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [batchVariants, setBatchVariants] = useState<GeneratedBatchVariant[]>(
    []
  );
  const [batchOffset, setBatchOffset] = useState(0);

  // Step 1: Document Type & Basic Info (Starts clean!)
  const [type, setType] = useState<CertificateType>("award");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TemplateStatus>("approved");
  const [defaultValidityDays, setDefaultValidityDays] = useState<number>(180);
  const [defaultTotalSessions, setDefaultTotalSessions] = useState<number>(3);

  // Step 2: Intelligent Bulgarian Prompt Builder Fields
  const [targetAudience, setTargetAudience] = useState<
    "kids" | "adults_pro" | "wellness"
  >("kids");
  const [aiStyleMode, setAiStyleMode] = useState<
    "abstract_luxury" | "sport_illustration"
  >("abstract_luxury");
  const [eventName, setEventName] = useState(
    "Турнир по Бадминтон „Гълъбово 2026“"
  );
  const [eventLocation, setEventLocation] = useState(
    "Спортна зала „Енергетик“, гр. Гълъбово"
  );
  const [eventRank, setEventRank] = useState("1-во място");
  const [customTheme, setCustomTheme] = useState("");
  const [bulgarianPrompt, setBulgarianPrompt] = useState("");
  const [englishPromptPreview, setEnglishPromptPreview] = useState<
    string | null
  >(null);
  const [showEnglishPreviewModal, setShowEnglishPreviewModal] = useState(false);

  // Step 2 & 3: Visual & Adaptive Layout
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
  const [customTextColor, setCustomTextColor] = useState<string>("");
  const [customAccentColor, setCustomAccentColor] = useState<string>("");

  // Adaptive Layout Element Toggles & Advanced Features
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [customQrUrl, setCustomQrUrl] = useState<string>("");
  const [showSeal, setShowSeal] = useState<boolean>(true);
  const [sealStyle, setSealStyle] = useState<
    "laurel" | "rackets_crest" | "monogram" | "custom_upload"
  >("laurel");
  const [customSealUrl, setCustomSealUrl] = useState<string>("");
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showSponsors, setShowSponsors] = useState<boolean>(true);
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(10);

  // Backside (Гръб на двустранен документ)
  const [includeBackside, setIncludeBackside] = useState<boolean>(false);
  const [backsideStyle, setBacksideStyle] = useState<
    "coach_message" | "tournament_protocol"
  >("coach_message");
  const [backsideTitle, setBacksideTitle] = useState("");
  const [backsideMessage, setBacksideMessage] = useState("");
  const [backsideSignatory, setBacksideSignatory] = useState("");

  // Voucher Details
  const [voucherServiceType, setVoucherServiceType] = useState<string>(
    "Месечна такса тренировки"
  );
  const [voucherValue, setVoucherValue] = useState<string>("50 лв.");
  const [voucherPromoCode, setVoucherPromoCode] = useState<string>("");
  const [voucherExpiryDate, setVoucherExpiryDate] = useState<string>("");

  const [extraFreeSessions, setExtraFreeSessions] = useState<number>(2);
  const [contactPhone, setContactPhone] = useState<string>(
    "0899 38 83 38 / 0899 82 99 23"
  );

  // Step 4: Signatories & Honors & Sponsors
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryTitle, setSignatoryTitle] = useState("");
  const [coSignatoryName, setCoSignatoryName] = useState("");
  const [coSignatoryTitle, setCoSignatoryTitle] = useState("");
  const [badgeText, setBadgeText] = useState("1-ВО МЯСТО");
  const [hideRank, setHideRank] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [selectedSponsorIds, setSelectedSponsorIds] = useState<string[]>([]);

  // Export testing states in Step 5
  const [exportResolution, setExportResolution] =
    useState<CertificateExportResolution>("ultra_300dpi");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingBacksidePdf, setIsExportingBacksidePdf] = useState(false);
  const [isExportingDoublePdf, setIsExportingDoublePdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  // Helper to compile Bulgarian prompt automatically
  const compiledBulgarianPrompt = useMemo(() => {
    const orientWord =
      orientation === "landscape"
        ? "хоризонтален формат пейзаж (16:9)"
        : "вертикален формат портрет (3:4)";

    if (targetAudience === "kids") {
      let p =
        aiStyleMode === "abstract_luxury"
          ? `Весел абстрактен спортен арт фон за детска бадминтон грамота (${orientWord}), ярки сияйни цветове, златно сияние, меки геометрични спортни вълни, БЕЗ човешки лица и БЕЗ букви, абсолютно чист празен център за текст`
          : `Празничен илюстрован спортен фон за детска бадминтон грамота (${orientWord}), весели динамични силуети на пера, ракети, конфети и искри, анимационен стил, чист център за текст без надписи`;
      if (eventName) p += `, състезание „${eventName}“`;
      if (eventLocation) p += `, проведено в ${eventLocation}`;
      if (eventRank && !hideRank) p += `, отличие за ${eventRank}`;
      if (customTheme) p += `, визуален детайл: ${customTheme}`;
      return p;
    }

    if (targetAudience === "adults_pro") {
      let p =
        aiStyleMode === "abstract_luxury"
          ? `Елегантен абстрактен луксозен спортен фон за официална грамота (${orientWord}), кралско тъмносиньо и полирано злато, фини геометрични линии на корт, копринен блясък, БЕЗ човешки фигури, БЕЗ лица и БЕЗ букви, кристално чист център за официална типография`
          : `Престижен илюстрован фон за официална бадминтон грамота (${orientWord}), стилизиран златен трофей, динамичен силует на бадминтонист в движение, корт, луксозен гланц, празен център за текст без никакви букви`;
      if (eventName) p += `, турнир „${eventName}“`;
      if (eventLocation) p += `, гр. ${eventLocation}`;
      if (eventRank && !hideRank) p += `, отличие за ${eventRank}`;
      if (customTheme) p += `, детайл: ${customTheme}`;
      return p;
    }

    // Wellness / Recovery Zone
    let p = `Луксозен уелнес и спа фон за възстановителен ваучер (${orientWord}), изумрудено зелено, топло полирано злато, минималистични дзен елементи, чисто и просторно платно без надписи`;
    if (customTheme) p += `, акцент: ${customTheme}`;
    return p;
  }, [
    orientation,
    targetAudience,
    aiStyleMode,
    eventName,
    eventLocation,
    eventRank,
    hideRank,
    customTheme,
  ]);

  // Keep prompt field in sync initially
  useEffect(() => {
    if (!bulgarianPrompt || bulgarianPrompt.trim().length === 0) {
      setBulgarianPrompt(compiledBulgarianPrompt);
    }
  }, [compiledBulgarianPrompt, bulgarianPrompt]);

  // Initialize or Reset
  useEffect(() => {
    if (!isOpen) return;

    // Check AI status
    getAiApiStatusAction().then((s) => {
      if (s) setAiStatus(s);
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
      setCustomTextColor(vc.customTextColor || "");
      setCustomAccentColor(vc.customAccentColor || "");
      setShowQrCode(vc.showQrCode ?? true);
      setCustomQrUrl(vc.customQrUrl || "");
      setShowSeal(vc.showSeal ?? true);
      setSealStyle(vc.sealStyle || "laurel");
      setCustomSealUrl(vc.customSealUrl || "");
      setShowSignatures(vc.showSignatures ?? true);
      setShowSponsors(vc.showSponsors ?? true);
      setWatermarkOpacity(vc.watermarkOpacity ?? 10);

      // Backside & AI style
      setIncludeBackside(vc.includeBackside ?? false);
      setBacksideStyle(vc.backsideStyle || "coach_message");
      setBacksideTitle(vc.backsideTitle || "");
      setBacksideMessage(vc.backsideMessage || "");
      setBacksideSignatory(vc.backsideSignatory || "");
      if (vc.aiStyleMode) setAiStyleMode(vc.aiStyleMode);

      // Voucher
      if (vc.voucherServiceType) setVoucherServiceType(vc.voucherServiceType);
      if (vc.voucherValue) setVoucherValue(vc.voucherValue);
      if (vc.voucherPromoCode) setVoucherPromoCode(vc.voucherPromoCode);
      if (vc.voucherExpiryDate) setVoucherExpiryDate(vc.voucherExpiryDate);

      setExtraFreeSessions(vc.extraFreeSessions ?? 2);
      setContactPhone(vc.contactPhone || "0899 38 83 38 / 0899 82 99 23");

      setSignatoryName(vc.signatoryName || "");
      setSignatoryTitle(vc.signatoryTitle || "");
      setCoSignatoryName(vc.coSignatoryName || "");
      setCoSignatoryTitle(vc.coSignatoryTitle || "");
      setBadgeText(vc.badgeText || "1-ВО МЯСТО");
      setHideRank(!vc.showBadge);
      setCustomNotes(vc.customNotes || "");
      setSelectedSponsorIds(vc.selectedSponsorIds || []);

      if (vc.targetAudience) setTargetAudience(vc.targetAudience);
      if (vc.promptBulgarian) setBulgarianPrompt(vc.promptBulgarian);
      if (vc.eventName) setEventName(vc.eventName);
      if (vc.eventLocation) setEventLocation(vc.eventLocation);
    } else {
      // Starts CLEAN from a blank sheet!
      setCurrentStep(1);
      setWizardMode("ai_prompt_engine");
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
      setBatchVariants([]);
      setBatchOffset(0);
      setOverlayOpacity(25);
      setTextColorMode("auto");
      setCustomTextColor("");
      setCustomAccentColor("");
      setShowQrCode(true);
      setCustomQrUrl("");
      setShowSeal(true);
      setSealStyle("laurel");
      setCustomSealUrl("");
      setShowSignatures(true);
      setShowSponsors(true);
      setWatermarkOpacity(10);

      // Backside & AI style
      setIncludeBackside(false);
      setBacksideStyle("coach_message");
      setBacksideTitle("");
      setBacksideMessage("");
      setBacksideSignatory("");
      setAiStyleMode("abstract_luxury");

      // Voucher
      setVoucherServiceType("Месечна такса тренировки");
      setVoucherValue("50 лв.");
      setVoucherPromoCode("");
      setVoucherExpiryDate("");

      setTargetAudience(siteId === "recoveryzone" ? "wellness" : "kids");
      setEventName("Турнир по Бадминтон „Гълъбово 2026“");
      setEventLocation("Спортна зала „Енергетик“, гр. Гълъбово");
      setEventRank("1-во място");
      setCustomTheme("");
      setBulgarianPrompt("");
      setEnglishPromptPreview(null);

      setExtraFreeSessions(2);
      setContactPhone("0899 38 83 38 / 0899 82 99 23");

      setSignatoryName("");
      setSignatoryTitle("Председател");
      setCoSignatoryName("");
      setCoSignatoryTitle("");
      setBadgeText("1-ВО МЯСТО");
      setHideRank(false);
      setCustomDate("");
      setCustomNotes("");
      setSelectedSponsorIds([]); // Опционално, нито един не е предварително включен
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
      if (siteId === "recoveryzone") setTargetAudience("wellness");
    } else if (selectedType === "award") {
      setLayoutTemplate("official_award");
      setBadgeText("1-ВО МЯСТО");
    } else {
      setLayoutTemplate("classic_certificate");
      setBadgeText("СЕРТИФИКАТ ЗА УЧАСТИЕ");
    }
  };

  // Quick Addition to Prompt
  const handleAppendPromptPhrase = (phrase: string) => {
    const trimmed = (bulgarianPrompt || compiledBulgarianPrompt).trim();
    if (!trimmed.includes(phrase)) {
      const base = trimmed.endsWith(",")
        ? trimmed.slice(0, -1).trim()
        : trimmed;
      setBulgarianPrompt(`${base}, ${phrase}`);
    }
  };

  // Preview English Translation
  const handleTranslateBulgarianPrompt = async () => {
    const textToTranslate = bulgarianPrompt.trim() || compiledBulgarianPrompt;
    setIsTranslating(true);
    try {
      const res = await translateBulgarianPromptAction({
        bulgarianPrompt: textToTranslate,
        targetAudience,
        documentType: type,
        orientation,
      });
      setEnglishPromptPreview(res.englishPrompt);
      setShowEnglishPreviewModal(true);
      toast.success("Промптът е преведен и оптимизиран за AI моделите!");
    } catch (err) {
      console.error(err);
      toast.error("Неуспешен превод на промпта.");
    } finally {
      setIsTranslating(false);
    }
  };

  // 1-Click AI Generation (Single Variant)
  const handleGenerateSingleAiBackground = async () => {
    setIsGeneratingAi(true);
    try {
      const promptToUse = bulgarianPrompt.trim() || compiledBulgarianPrompt;
      const res = await generateCertificateAiBackgroundAction(
        siteId,
        promptToUse,
        targetAudience,
        orientation,
        0
      );

      if (!res.success || !res.imageUrl) {
        toast.error(res.error || "Неуспешно генериране на фон.");
        return;
      }

      setAiBackgroundUrl(res.imageUrl);
      setLayoutMode("custom_ai_background");
      toast.success("Успешно генериран единичен AI фон!");
    } catch (err) {
      console.error(err);
      toast.error("Възникна непредвидена грешка при AI генерацията.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Batch Generation (3 Variants in Parallel)
  const handleGenerateBatchVariants = async (isNewBatch = false) => {
    setIsGeneratingBatch(true);
    const newOffset = isNewBatch ? batchOffset + 3 : batchOffset;
    if (isNewBatch) setBatchOffset(newOffset);

    try {
      const promptToUse = bulgarianPrompt.trim() || compiledBulgarianPrompt;
      const results = await generateCertificateAiBackgroundBatchAction(
        siteId,
        promptToUse,
        orientation,
        3,
        newOffset
      );

      const validVariants: GeneratedBatchVariant[] = results
        .filter((r) => r.success && r.imageUrl)
        .map((r, i) => ({
          imageUrl: r.imageUrl!,
          providerUsed: r.providerUsed,
          variantIndex: r.variantIndex ?? i,
          note: r.note,
        }));

      if (validVariants.length === 0) {
        toast.error(
          "AI моделът не успя да върне вариации. Моля, опитайте отново."
        );
        return;
      }

      setBatchVariants(validVariants);
      // Auto-select the first variant
      setAiBackgroundUrl(validVariants[0].imageUrl);
      setLayoutMode("custom_ai_background");
      toast.success(
        `Генерирани ${validVariants.length} визуални варианта! Изберете най-подходящия.`
      );
    } catch (err) {
      console.error(err);
      toast.error("Грешка при партидната AI генерация.");
    } finally {
      setIsGeneratingBatch(false);
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

  // Export Tests
  const handleTestPrint = () => {
    printCertificate();
  };

  const handleTestExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const fileName = `${title.trim() || "шаблон-лице"}.pdf`;
      const ok = await exportCertificatePdf(
        "printable-certificate",
        fileName,
        orientation
      );
      if (ok) {
        toast.success("PDF документът (Лице) е изтеглен успешно!");
      } else {
        toast.error("Неуспешно генериране на PDF.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при експорт на PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleTestExportBacksidePdf = async () => {
    setIsExportingBacksidePdf(true);
    try {
      const fileName = `${title.trim() || "шаблон-гръб"}.pdf`;
      const ok = await exportCertificatePdf(
        "printable-certificate-back",
        fileName,
        orientation
      );
      if (ok) {
        toast.success("PDF документът (Гръб) е изтеглен успешно!");
      } else {
        toast.error("Неуспешно генериране на PDF за гръб.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при експорт на PDF за гръб.");
    } finally {
      setIsExportingBacksidePdf(false);
    }
  };

  const handleTestExportDoublePdf = async () => {
    setIsExportingDoublePdf(true);
    try {
      const fileName = `${title.trim() || "шаблон-двустранен"}-двустранен.pdf`;
      const ok = await exportTwoPageCertificatePdf(
        "printable-certificate",
        "printable-certificate-back",
        fileName,
        orientation
      );
      if (ok) {
        toast.success(
          "Комбинираният 2-страничен PDF (Лице + Гръб) е изтеглен успешно!"
        );
      } else {
        toast.error("Неуспешно генериране на 2-страничен PDF.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при експорт на 2-страничен PDF.");
    } finally {
      setIsExportingDoublePdf(false);
    }
  };

  const handleTestExportPng = async () => {
    setIsExportingPng(true);
    try {
      const fileName = `${title.trim() || "шаблон-документ"}.png`;
      const ok = await exportCertificatePng(
        "printable-certificate",
        fileName,
        exportResolution
      );
      if (ok) {
        toast.success(
          exportResolution === "ultra_300dpi"
            ? "Ultra HD 300 DPI PNG изображението е изтеглено!"
            : "Standard Web HD PNG изображението е изтеглено!"
        );
      } else {
        toast.error("Неуспешно генериране на PNG.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при експорт на PNG.");
    } finally {
      setIsExportingPng(false);
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
        signatoryName: signatoryName.trim() || "Димитър Иванов",
        signatoryTitle: signatoryTitle.trim() || "Председател",
        coSignatoryName: coSignatoryName.trim() || undefined,
        coSignatoryTitle: coSignatoryTitle.trim() || undefined,
        showBadge: !hideRank,
        badgeText: hideRank ? undefined : badgeText || undefined,
        customNotes: customNotes || undefined,
        layoutTemplate,
        extraFreeSessions: type === "voucher" ? extraFreeSessions : undefined,
        contactPhone: contactPhone || undefined,
        layoutMode,
        aiBackgroundUrl: aiBackgroundUrl || undefined,
        overlayOpacity,
        textColorMode,
        customTextColor: customTextColor || undefined,
        customAccentColor: customAccentColor || undefined,
        showQrCode,
        customQrUrl: customQrUrl.trim() || undefined,
        showSeal,
        sealStyle,
        customSealUrl: customSealUrl.trim() || undefined,
        showSignatures,
        showSponsors,
        watermarkOpacity,
        targetAudience,
        promptBulgarian: bulgarianPrompt || undefined,
        promptEnglish: englishPromptPreview || undefined,
        eventName: eventName || undefined,
        eventLocation: eventLocation || undefined,
        contentAlignment: "center",

        // Backside & AI style
        includeBackside,
        backsideStyle,
        backsideTitle: backsideTitle.trim() || undefined,
        backsideMessage: backsideMessage.trim() || undefined,
        backsideSignatory: backsideSignatory.trim() || undefined,
        aiStyleMode,

        // Voucher details
        voucherServiceType: type === "voucher" ? voucherServiceType : undefined,
        voucherValue: type === "voucher" ? voucherValue : undefined,
        voucherPromoCode: type === "voucher" ? voucherPromoCode : undefined,
        voucherExpiryDate: type === "voucher" ? voucherExpiryDate : undefined,
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
      signatoryName: signatoryName || "Име на Председател / Треньор",
      signatoryTitle: signatoryTitle || "Длъжност",
      coSignatoryName,
      coSignatoryTitle,
      showBadge: !hideRank,
      badgeText: hideRank ? undefined : badgeText,
      customNotes,
      layoutTemplate,
      extraFreeSessions,
      contactPhone,
      layoutMode,
      aiBackgroundUrl,
      overlayOpacity,
      textColorMode,
      customTextColor,
      customAccentColor,
      showQrCode,
      customQrUrl,
      showSeal,
      sealStyle,
      customSealUrl,
      showSignatures,
      showSponsors,
      watermarkOpacity,
      includeBackside,
      backsideStyle,
      backsideTitle,
      backsideMessage,
      backsideSignatory,
      aiStyleMode,
      voucherServiceType,
      voucherValue,
      voucherPromoCode,
      voucherExpiryDate,
    },
    serialNumber: "BKG-2026-LIVE",
    recipientName: "Александър Иванов Петров",
    recipientInstitution: "СУ „Васил Левски“ • Гълъбово",
    rank: (badgeText === "2-РО МЯСТО"
      ? "2nd"
      : badgeText === "3-ТО МЯСТО"
        ? "3rd"
        : "1st") as AwardRank,
    eventTitle: eventName,
    eventLocation,
    eventDate: customDate || new Date().toLocaleDateString("bg-BG"),
    totalSessions: defaultTotalSessions,
    sponsors,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[94vh] max-w-[96vw] flex-col gap-0 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 p-0 shadow-2xl xl:max-w-7xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* Header with Mode Switcher & Stepper */}
        <div className="shrink-0 border-b border-zinc-200 bg-white/95 px-6 py-3.5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DialogTitle className="flex items-center gap-2 text-lg font-black text-zinc-900 dark:text-white">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-linear-to-tr from-amber-500 to-amber-400 text-white shadow-md">
                    <Sparkles className="size-4" />
                  </span>
                  <span>
                    {templateToEdit
                      ? "Редактиране на Шаблон (Wizard)"
                      : "Интелигентен Генератор на Документи"}
                  </span>
                </DialogTitle>

                {/* Mode Selector Pill */}
                <div className="flex items-center rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setWizardMode("ai_prompt_engine");
                      setLayoutMode("custom_ai_background");
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      wizardMode === "ai_prompt_engine"
                        ? "bg-white text-purple-700 shadow-xs dark:bg-zinc-900 dark:text-purple-300"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <Wand2 className="size-3.5" />
                    AI Промпт Генератор (Празен лист)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWizardMode("manual_design");
                      setLayoutMode("standard_html");
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      wizardMode === "manual_design"
                        ? "bg-white text-blue-700 shadow-xs dark:bg-zinc-900 dark:text-blue-300"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <Palette className="size-3.5" />
                    Ръчен Векторен Дизайн
                  </button>
                </div>
              </div>
              <DialogDescription className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Започнете от празен лист с български AI промпт или
                персонализирайте векторно адаптивно оформление.
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
                    className={`flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : isCompleted
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`flex size-4.5 items-center justify-center rounded-full text-[10px] font-black ${
                        isActive
                          ? "bg-white text-blue-600"
                          : isCompleted
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                      }`}
                    >
                      {isCompleted ? "✓" : step.id}
                    </span>
                    <StepIcon className="hidden size-3 sm:inline" />
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dual Pane Body: Left Controls (Step View) + Right Live Document Canvas */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
          {/* LEFT: STEP FORMS (5 cols) */}
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
                      Започва се от ПРАЗЕН лист – без твърдо заковани
                      изображения. Вие задавате контекста.
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
                        За състезания, лагери, турнири и призови класирания.
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
                      placeholder="напр. Официална Грамота за 1-во място или Бонус Ваучер за Тренировки"
                      className="rounded-xl border-zinc-200 font-medium dark:border-zinc-800"
                      autoFocus
                    />

                    {/* Quick Title Chips */}
                    <div className="space-y-1 pt-1">
                      <Label className="text-[10px] font-semibold text-zinc-500">
                        Бързи готови заглавия:
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Грамота за 1-во място — Шампион",
                          "Грамота за спортен принос & феърплей",
                          "Сертификат за завършено ниво по бадминтон",
                          "Подаръчен ваучер за тренировки",
                        ].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTitle(t)}
                            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            + {t}
                          </button>
                        ))}
                      </div>
                    </div>
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
                      placeholder="Кратко описание кога се издава този документ..."
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

              {/* STEP 2: INTELLIGENT AI PROMPT STUDIO (BULGARIAN PROMPT BUILDER & BATCH VARIATIONS) */}
              {currentStep === 2 && (
                <div className="space-y-5 duration-200 animate-in fade-in">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-zinc-900 uppercase dark:text-white">
                      <Wand2 className="size-4 text-purple-600" />
                      2. Интелигентен Конструктор на Промпт
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Работите изцяло на БЪЛГАРСКИ език. AI генерира чисто
                      графично платно без вграден текст, а векторният слой
                      наслагва клубните данни.
                    </p>
                  </div>

                  {/* Informative Banner: Free Engine vs Gemini/OpenAI */}
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5">
                        <Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <div className="space-y-1">
                          <span className="font-bold">
                            ⚡ Вграден Безплатен AI Engine (FLUX Neural):
                          </span>
                          <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                            Работи автоматично без настройки. За още по-висока
                            детайлност можете да добавите безплатен ключ за
                            Google Gemini Imagen 3 от{" "}
                            <a
                              href="https://aistudio.google.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold underline"
                            >
                              aistudio.google.com
                            </a>{" "}
                            във Вашия{" "}
                            <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[10px] dark:bg-blue-900">
                              .env.local
                            </code>
                            .
                          </p>
                        </div>
                      </div>
                      {(aiStatus?.provider === "gemini" ||
                        aiStatus?.provider === "both") && (
                        <Badge
                          variant="outline"
                          className="shrink-0 bg-white text-[10px] font-bold text-emerald-700 dark:bg-zinc-900 dark:text-emerald-300"
                        >
                          🟢 Gemini Imagen 3 Активен
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* 1. Target Audience Selector */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">
                      Целева аудитория на документа:
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetAudience("kids");
                          setBulgarianPrompt("");
                        }}
                        className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition-all ${
                          targetAudience === "kids"
                            ? "border-amber-500 bg-amber-50 font-bold text-amber-900 ring-2 ring-amber-500/25 dark:bg-amber-950/40 dark:text-amber-200"
                            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                        }`}
                      >
                        <Baby className="size-5 text-amber-500" />
                        <span className="text-xs font-bold">👶 За Деца</span>
                        <span className="text-[10px] text-zinc-500">
                          Ярки цветове & радост
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetAudience("adults_pro");
                          setBulgarianPrompt("");
                        }}
                        className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition-all ${
                          targetAudience === "adults_pro"
                            ? "border-blue-500 bg-blue-50 font-bold text-blue-900 ring-2 ring-blue-500/25 dark:bg-blue-950/40 dark:text-blue-200"
                            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                        }`}
                      >
                        <Crown className="size-5 text-blue-600" />
                        <span className="text-xs font-bold">
                          🏆 Професионалисти
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Лукс, тъмносиньо & злато
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetAudience("wellness");
                          setBulgarianPrompt("");
                        }}
                        className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition-all ${
                          targetAudience === "wellness"
                            ? "border-emerald-500 bg-emerald-50 font-bold text-emerald-900 ring-2 ring-emerald-500/25 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                        }`}
                      >
                        <Leaf className="size-5 text-emerald-600" />
                        <span className="text-xs font-bold">
                          🌿 Уелнес & Спа
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Изумруд & дзен релакс
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 1.1 AI Visual Style Mode (Абстрактен лукс vs Спортна илюстрация) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">
                      Визуален стил на генерацията:
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAiStyleMode("abstract_luxury");
                          setBulgarianPrompt("");
                        }}
                        className={`flex items-center justify-center gap-2 rounded-2xl border p-2.5 text-xs font-bold transition-all ${
                          aiStyleMode === "abstract_luxury"
                            ? "border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/25 dark:bg-amber-950/40 dark:text-amber-200"
                            : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        <Sparkles className="size-4 text-amber-500" />✨
                        Абстрактен луксозен фон (без хора & текст)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAiStyleMode("sport_illustration");
                          setBulgarianPrompt("");
                        }}
                        className={`flex items-center justify-center gap-2 rounded-2xl border p-2.5 text-xs font-bold transition-all ${
                          aiStyleMode === "sport_illustration"
                            ? "border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-500/25 dark:bg-blue-950/40 dark:text-blue-200"
                            : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        <Trophy className="size-4 text-blue-500" />
                        🏸 Спортна илюстрация с елементи
                      </button>
                    </div>
                  </div>

                  {/* 2. Event & Competition Context Details */}
                  <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <span className="text-xs font-black tracking-wider text-zinc-700 uppercase dark:text-zinc-300">
                      Детайли за състезанието и събитието:
                    </span>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold">
                          Име на състезанието
                        </Label>
                        <Input
                          value={eventName}
                          onChange={(e) => {
                            setEventName(e.target.value);
                            setBulgarianPrompt("");
                          }}
                          placeholder="напр. Коледен турнир 2026"
                          className="h-9 rounded-xl text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold">
                          Място / Град
                        </Label>
                        <Input
                          value={eventLocation}
                          onChange={(e) => {
                            setEventLocation(e.target.value);
                            setBulgarianPrompt("");
                          }}
                          placeholder="напр. гр. Гълъбово"
                          className="h-9 rounded-xl text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold">
                          Класиране / Отличие
                        </Label>
                        <Input
                          value={eventRank}
                          onChange={(e) => {
                            setEventRank(e.target.value);
                            setBulgarianPrompt("");
                          }}
                          placeholder="напр. 1-во място, Шампион"
                          className="h-9 rounded-xl text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold">
                          Специална тема / Детайли
                        </Label>
                        <Input
                          value={customTheme}
                          onChange={(e) => {
                            setCustomTheme(e.target.value);
                            setBulgarianPrompt("");
                          }}
                          placeholder="напр. добави златен кант и малко снежинки"
                          className="h-9 rounded-xl text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Generated & Editable Bulgarian Prompt Textarea */}
                  <div className="space-y-2.5 rounded-2xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900/50 dark:bg-purple-950/20">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs font-black text-purple-900 dark:text-purple-300">
                        <Sparkles className="size-3.5 text-purple-600" />
                        Генериран Промпт на БЪЛГАРСКИ ЕЗИК (Можете да го
                        редактирате):
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setBulgarianPrompt(compiledBulgarianPrompt)
                        }
                        className="h-6 text-[10px] text-purple-700 hover:bg-purple-100 dark:text-purple-300"
                        title="Възстанови автоматично сглобения промпт"
                      >
                        <RefreshCw className="mr-1 size-3" />
                        Презареди
                      </Button>
                    </div>

                    <Textarea
                      value={bulgarianPrompt || compiledBulgarianPrompt}
                      onChange={(e) => setBulgarianPrompt(e.target.value)}
                      rows={3}
                      className="rounded-xl border-purple-200 bg-white text-xs leading-relaxed dark:border-purple-800 dark:bg-zinc-900"
                      placeholder="Системата сглобява промпта тук. Можете да добавите ваши думи..."
                    />

                    {/* Quick Prompt Enhancers (1-click chips) */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold tracking-wider text-purple-800 uppercase dark:text-purple-300">
                        Бързи визуални добавки с 1 клик:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "добави фин златен кант и блясък",
                          "добави малко снежинки и зимна атмосфера",
                          "динамични огнени волани и скорост",
                          "геометрични тънки линии на корт",
                          "минималистичен луксозен гланц",
                          "дзен лотос и бамбук спа естетика",
                        ].map((phrase) => (
                          <button
                            key={phrase}
                            type="button"
                            onClick={() => handleAppendPromptPhrase(phrase)}
                            className="rounded-lg border border-purple-200 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-purple-800 transition-colors hover:bg-purple-100 dark:border-purple-800 dark:bg-zinc-900 dark:text-purple-200"
                          >
                            + {phrase}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTranslateBulgarianPrompt}
                        disabled={isTranslating}
                        className="gap-1.5 rounded-xl border-purple-200 text-xs font-bold text-purple-800 hover:bg-purple-100 dark:border-purple-800 dark:text-purple-300"
                      >
                        {isTranslating ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Languages className="size-3.5" />
                        )}
                        👁️ Преглед на преведения AI промпт (English)
                      </Button>

                      {englishPromptPreview && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          ✓ Готов английски превод
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4. Generation Buttons: 3 Variants in Parallel + Quick 1 Variant */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        onClick={() => handleGenerateBatchVariants(false)}
                        disabled={isGeneratingBatch || isGeneratingAi}
                        className="gap-2 rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 py-5 text-xs font-black text-white shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700"
                      >
                        {isGeneratingBatch ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Генериране на 3 варианта...
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-4" />✨ Генерирай 3
                            варианта (Партида)
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleGenerateBatchVariants(true)}
                        disabled={isGeneratingBatch || isGeneratingAi}
                        className="gap-2 rounded-2xl border-purple-200 py-5 text-xs font-bold text-purple-900 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-200"
                      >
                        <RefreshCw className="size-4" />
                        🔄 Нова партида (Офсет #{batchOffset + 3})
                      </Button>
                    </div>

                    <div className="flex items-center justify-end pt-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateSingleAiBackground}
                        disabled={isGeneratingBatch || isGeneratingAi}
                        className="h-7 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      >
                        {isGeneratingAi ? (
                          <Loader2 className="mr-1 size-3 animate-spin" />
                        ) : (
                          <Wand2 className="mr-1 size-3" />
                        )}
                        ⚡ Бърз 1 вариант (Единичен тест)
                      </Button>
                    </div>

                    {/* 3 Selectable Visual Variant Cards */}
                    {batchVariants.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <Label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                          Изберете фон от последната партида:
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          {batchVariants.map((variant, idx) => {
                            const isSelected =
                              aiBackgroundUrl === variant.imageUrl;
                            return (
                              <button
                                key={`${variant.imageUrl}-${idx}`}
                                type="button"
                                onClick={() => {
                                  setAiBackgroundUrl(variant.imageUrl);
                                  setLayoutMode("custom_ai_background");
                                  toast.success(`Избран Вариант #${idx + 1}`);
                                }}
                                className={`group relative aspect-video overflow-hidden rounded-xl border text-left transition-all ${
                                  isSelected
                                    ? "border-purple-600 ring-2 ring-purple-600/50"
                                    : "border-zinc-200 opacity-75 hover:opacity-100 dark:border-zinc-800"
                                }`}
                              >
                                <Image
                                  src={variant.imageUrl}
                                  alt={`Вариант ${idx + 1}`}
                                  fill
                                  sizes="160px"
                                  className="object-cover transition-transform group-hover:scale-105"
                                  unoptimized
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                                <div className="absolute inset-x-1 bottom-1 flex items-center justify-between text-[10px] font-bold text-white">
                                  <span>Вариант #{idx + 1}</span>
                                  {isSelected && (
                                    <span className="flex size-4 items-center justify-center rounded-full bg-purple-600 text-[10px]">
                                      ✓
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Custom Image Upload Fallback */}
                    <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
                      <Label className="mb-1.5 block text-[11px] font-semibold text-zinc-500">
                        Или качете собствено изображение за фон:
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
                </div>
              )}

              {/* STEP 3: ADAPTIVE LAYOUT (LANDSCAPE VS PORTRAIT & SEALS & PALETTES) */}
              {currentStep === 3 && (
                <div className="space-y-5 duration-200 animate-in fade-in">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-zinc-900 uppercase dark:text-white">
                      <Sliders className="size-4 text-blue-600" />
                      3. Интелигентно Адаптивно Оформление
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Елементите се пренареждат динамично според формата, за да
                      не застъпват арт фона.
                    </p>
                  </div>

                  {/* Orientation Switcher */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">
                      Ориентация на документа:
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOrientation("landscape")}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                          orientation === "landscape"
                            ? "border-blue-600 bg-blue-50/70 font-bold ring-2 ring-blue-600/30 dark:bg-blue-950/40"
                            : "border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        <div className="h-6 w-9 shrink-0 rounded-sm border-2 border-current" />
                        <div>
                          <span className="block text-xs font-black">
                            Landscape (Пейзаж 16:9)
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            Лого вляво, спонсори долу в линия, подписи един до
                            друг
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrientation("portrait")}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                          orientation === "portrait"
                            ? "border-blue-600 bg-blue-50/70 font-bold ring-2 ring-blue-600/30 dark:bg-blue-950/40"
                            : "border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        <div className="h-9 w-6 shrink-0 rounded-sm border-2 border-current" />
                        <div>
                          <span className="block text-xs font-black">
                            Portrait (Портрет 3:4)
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            Лого центрирано най-горе, вертикален баланс,
                            спонсори в мрежа
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Golden Digital Seal Styles & Custom Upload */}
                  <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs font-black text-zinc-800 uppercase dark:text-zinc-200">
                        <Award className="size-3.5 text-amber-500" />
                        Официален Дигитален Печат:
                      </Label>
                      <button
                        type="button"
                        onClick={() => setShowSeal(!showSeal)}
                        className={`text-[11px] font-bold ${
                          showSeal ? "text-emerald-600" : "text-zinc-400"
                        }`}
                      >
                        {showSeal ? "Включен ✓" : "Изключен ✕"}
                      </button>
                    </div>

                    {showSeal && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSealStyle("laurel");
                              setCustomSealUrl("");
                            }}
                            className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center text-[10px] font-bold transition-all ${
                              sealStyle === "laurel" && !customSealUrl
                                ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/25 dark:bg-amber-950/40 dark:text-amber-200"
                                : "border-zinc-200 dark:border-zinc-800"
                            }`}
                          >
                            <span className="text-base">🏅</span>
                            <span>Лавров печат</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSealStyle("rackets_crest");
                              setCustomSealUrl("");
                            }}
                            className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center text-[10px] font-bold transition-all ${
                              sealStyle === "rackets_crest" && !customSealUrl
                                ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/25 dark:bg-amber-950/40 dark:text-amber-200"
                                : "border-zinc-200 dark:border-zinc-800"
                            }`}
                          >
                            <span className="text-base">🏸</span>
                            <span>Герб с ракети</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSealStyle("monogram");
                              setCustomSealUrl("");
                            }}
                            className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center text-[10px] font-bold transition-all ${
                              sealStyle === "monogram" && !customSealUrl
                                ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/25 dark:bg-amber-950/40 dark:text-amber-200"
                                : "border-zinc-200 dark:border-zinc-800"
                            }`}
                          >
                            <span className="text-base">👑</span>
                            <span>Монограм БКГ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSealStyle("custom_upload")}
                            className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center text-[10px] font-bold transition-all ${
                              sealStyle === "custom_upload" ||
                              Boolean(customSealUrl)
                                ? "border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/25 dark:bg-blue-950/40 dark:text-blue-200"
                                : "border-zinc-200 dark:border-zinc-800"
                            }`}
                          >
                            <span className="text-base">📤</span>
                            <span>Собствен PNG</span>
                          </button>
                        </div>

                        {/* Custom PNG Seal Upload */}
                        {(sealStyle === "custom_upload" || customSealUrl) && (
                          <div className="rounded-xl border border-dashed border-zinc-300 p-2.5 dark:border-zinc-700">
                            <Label className="mb-1 block text-[11px] font-medium text-zinc-500">
                              Качете прозрачен PNG печат (300 DPI):
                            </Label>
                            <UniversalMediaUpload
                              label=""
                              storageFolder="certificate-seals"
                              value={customSealUrl}
                              onChange={(url) => {
                                if (url) {
                                  setCustomSealUrl(url);
                                  setSealStyle("custom_upload");
                                }
                              }}
                              accept="image/png,image/webp"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Curated Luxury Color Palettes */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">
                      Готови луксозни цветови палитри:
                    </Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {CURATED_PALETTES.map((pal) => (
                        <button
                          key={pal.id}
                          type="button"
                          onClick={() => {
                            setCustomTextColor(pal.text);
                            setCustomAccentColor(pal.accent);
                            toast.success(`Приложена палитра „${pal.name}“`);
                          }}
                          className="flex items-center gap-2 rounded-xl border border-zinc-200 p-2 text-left text-xs font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850"
                        >
                          <div className="flex gap-1">
                            <span
                              className="size-3.5 rounded-full border border-black/10 shadow-xs"
                              style={{ backgroundColor: pal.text }}
                            />
                            <span
                              className="size-3.5 rounded-full border border-black/10 shadow-xs"
                              style={{ backgroundColor: pal.accent }}
                            />
                          </div>
                          <span className="truncate text-[11px]">
                            {pal.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Element Visibility Toggles */}
                  <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <Label className="text-xs font-black tracking-wider text-zinc-700 uppercase dark:text-zinc-300">
                      Включени графични компоненти:
                    </Label>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowQrCode(!showQrCode)}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-bold transition-all ${
                          showQrCode
                            ? "border-blue-500 bg-blue-50/60 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                            : "border-zinc-200 text-zinc-400 dark:border-zinc-800"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <QrCode className="size-3.5" />
                          Дигитален QR код
                        </span>
                        <span>{showQrCode ? "✓" : "✕"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowSignatures(!showSignatures)}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-bold transition-all ${
                          showSignatures
                            ? "border-blue-500 bg-blue-50/60 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                            : "border-zinc-200 text-zinc-400 dark:border-zinc-800"
                        }`}
                      >
                        <span>✍️ Официални подписи</span>
                        <span>{showSignatures ? "✓" : "✕"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowSponsors(!showSponsors)}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-bold transition-all ${
                          showSponsors
                            ? "border-emerald-500 bg-emerald-50/60 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "border-zinc-200 text-zinc-400 dark:border-zinc-800"
                        }`}
                      >
                        <span>🤝 Лента със спонсори</span>
                        <span>{showSponsors ? "✓" : "✕"}</span>
                      </button>

                      <div className="flex flex-col justify-center px-1">
                        <Label className="flex justify-between text-[11px] font-bold">
                          <span>Воден знак сила:</span>
                          <span className="text-zinc-500">
                            {watermarkOpacity}%
                          </span>
                        </Label>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="2"
                          value={watermarkOpacity}
                          onChange={(e) =>
                            setWatermarkOpacity(Number(e.target.value))
                          }
                          className="w-full cursor-pointer accent-amber-500"
                        />
                      </div>
                    </div>

                    {/* Custom QR URL Input if QR is enabled */}
                    {showQrCode && (
                      <div className="pt-2">
                        <Label className="text-[11px] font-medium text-zinc-500">
                          Персонализиран линк за QR кода (по избор):
                        </Label>
                        <Input
                          value={customQrUrl}
                          onChange={(e) => setCustomQrUrl(e.target.value)}
                          placeholder="По подразбиране: /cert/{сериен_номер}"
                          className="h-8 rounded-xl font-mono text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Contrast Scrim & Text Color Customization */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
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
                        Цвят на текста
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

              {/* STEP 4: SIGNATORIES & HONORS & SPONSORS */}
              {currentStep === 4 && (
                <div className="space-y-5 duration-200 animate-in fade-in">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-zinc-900 uppercase dark:text-white">
                      <Users className="size-4 text-blue-500" />
                      4. Подписващи Лица & Партньори
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Изберете бърза длъжност, а имената на хората и
                      институциите изписвате свободно на ръка.
                    </p>
                  </div>

                  {/* Quick Preset Pills for Signatories (ROLES ONLY!) */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-zinc-500">
                      Бързи длъжности за попълване:
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Треньор",
                        "Директор",
                        "Управител",
                        "Председател",
                        "Главен съдия",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSignatoryTitle(preset)}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary Signatory */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">
                        Длъжност (Главно лице)
                      </Label>
                      <Input
                        value={signatoryTitle}
                        onChange={(e) => setSignatoryTitle(e.target.value)}
                        placeholder="напр. Председател или Треньор"
                        className="rounded-xl font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">
                        Име на лицето (попълва се на ръка)
                      </Label>
                      <Input
                        value={signatoryName}
                        onChange={(e) => setSignatoryName(e.target.value)}
                        placeholder="напр. Димитър Иванов"
                        className="rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  {/* Co-Signatory (For Official Awards) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">
                        Втора длъжност (по избор)
                      </Label>
                      <Input
                        value={coSignatoryTitle}
                        onChange={(e) => setCoSignatoryTitle(e.target.value)}
                        placeholder="напр. Директор на СУ"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">
                        Име (Второ лице)
                      </Label>
                      <Input
                        value={coSignatoryName}
                        onChange={(e) => setCoSignatoryName(e.target.value)}
                        placeholder="напр. Иванка Георгиева"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Badge Text & Honors */}
                  <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold">
                        Отличие / Бадж на документа:
                      </Label>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        <input
                          type="checkbox"
                          checked={hideRank}
                          onChange={(e) => setHideRank(e.target.checked)}
                          className="size-3.5 rounded accent-blue-600"
                        />
                        <span>Скрий класирането (само грамота за участие)</span>
                      </label>
                    </div>

                    {!hideRank && (
                      <div className="space-y-2">
                        <Input
                          value={badgeText}
                          onChange={(e) => setBadgeText(e.target.value)}
                          placeholder="напр. 1-ВО МЯСТО или ШАМПИОН"
                          className="rounded-xl text-xs font-bold tracking-wider uppercase"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "1-ВО МЯСТО",
                            "2-РО МЯСТО",
                            "3-ТО МЯСТО",
                            "ШАМПИОН",
                            "ФЕЪРПЛЕЙ",
                            "НАЙ-ДОБЪР СЕРВИС",
                            "ОФИЦИАЛНО ОТЛИЧИЕ",
                          ].map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setBadgeText(b)}
                              className="rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Custom Date Field */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs font-bold">
                      <Calendar className="size-3.5 text-zinc-500" />
                      Дата на документа (по избор):
                    </Label>
                    <Input
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      placeholder={`По подразбиране: днешна дата (${new Date().toLocaleDateString("bg-BG")}) или напр. „15-16 Март 2026 г.“`}
                      className="rounded-xl text-xs"
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

                    {/* Backside Configuration (Двустранна грамота) */}
                    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1.5 text-xs font-black text-zinc-900 uppercase dark:text-white">
                          <span>📜 Гръб на документа (двустранен печат)</span>
                        </Label>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                          <input
                            type="checkbox"
                            checked={includeBackside}
                            onChange={(e) =>
                              setIncludeBackside(e.target.checked)
                            }
                            className="size-4 rounded accent-blue-600"
                          />
                          <span>
                            {includeBackside ? "Включен гръб ✓" : "Само лице"}
                          </span>
                        </label>
                      </div>

                      {includeBackside && (
                        <div className="space-y-3 pt-1">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setBacksideStyle("coach_message")}
                              className={`rounded-xl border p-2 text-center text-xs font-bold transition-all ${
                                backsideStyle === "coach_message"
                                  ? "border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/25 dark:bg-amber-950/40 dark:text-amber-200"
                                  : "border-zinc-200 text-zinc-600 dark:border-zinc-800"
                              }`}
                            >
                              ✍️ Треньорско послание & автограф
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setBacksideStyle("tournament_protocol")
                              }
                              className={`rounded-xl border p-2 text-center text-xs font-bold transition-all ${
                                backsideStyle === "tournament_protocol"
                                  ? "border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-500/25 dark:bg-blue-950/40 dark:text-blue-200"
                                  : "border-zinc-200 text-zinc-600 dark:border-zinc-800"
                              }`}
                            >
                              📋 Турнирен протокол & статистика
                            </button>
                          </div>

                          {backsideStyle === "coach_message" && (
                            <div className="space-y-1.5">
                              <Label className="text-[11px] font-bold">
                                Текст на посланието от треньора / ръководството:
                              </Label>
                              <Textarea
                                value={backsideMessage}
                                onChange={(e) =>
                                  setBacksideMessage(e.target.value)
                                }
                                rows={3}
                                placeholder="Скъпи състезателю, твоят устрем, дисциплина и постоянство в залата са истинското вдъхновение за целия клуб..."
                                className="rounded-xl text-xs"
                              />
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold">
                              Подписващо лице за гърба (по избор):
                            </Label>
                            <Input
                              value={backsideSignatory}
                              onChange={(e) =>
                                setBacksideSignatory(e.target.value)
                              }
                              placeholder="напр. Главен треньор / Председател на съдийската колегия"
                              className="rounded-xl text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Voucher Specific Fields */}
                    {type === "voucher" && (
                      <div className="space-y-3 rounded-2xl border border-amber-300/50 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
                        <Label className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase dark:text-amber-200">
                          <Ticket className="size-4" />
                          Специфични детайли за Ваучера:
                        </Label>

                        {/* Service Category */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">
                            Валиден за услуга / стока:
                          </Label>
                          <Input
                            value={voucherServiceType}
                            onChange={(e) =>
                              setVoucherServiceType(e.target.value)
                            }
                            placeholder="напр. Месечна такса тренировки"
                            className="rounded-xl bg-white text-xs dark:bg-zinc-900"
                          />
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {[
                              "Месечна такса тренировки",
                              "Индивидуална тренировка с треньор",
                              "Клубна екипировка/ракета",
                              "Свободна игра на корт",
                            ].map((svc) => (
                              <button
                                key={svc}
                                type="button"
                                onClick={() => setVoucherServiceType(svc)}
                                className="rounded-lg border border-amber-300/60 bg-white px-2 py-0.5 text-[10px] font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-zinc-900 dark:text-amber-200"
                              >
                                + {svc}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Value, Code & Expiry */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold">
                              Стойност:
                            </Label>
                            <Input
                              value={voucherValue}
                              onChange={(e) => setVoucherValue(e.target.value)}
                              placeholder="напр. 50 лв. или 20%"
                              className="rounded-xl bg-white text-xs dark:bg-zinc-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold">
                              Промокод / Код:
                            </Label>
                            <Input
                              value={voucherPromoCode}
                              onChange={(e) =>
                                setVoucherPromoCode(e.target.value)
                              }
                              placeholder="напр. BKG-SUMMER"
                              className="rounded-xl bg-white font-mono text-xs uppercase dark:bg-zinc-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold">
                              Валиден до:
                            </Label>
                            <Input
                              value={voucherExpiryDate}
                              onChange={(e) =>
                                setVoucherExpiryDate(e.target.value)
                              }
                              placeholder="напр. 31.12.2026 г."
                              className="rounded-xl bg-white text-xs dark:bg-zinc-900"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW, TEST PRINT/EXPORT & FINAL SAVE */}
              {currentStep === 5 && (
                <div className="space-y-5 duration-200 animate-in fade-in">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-zinc-900 uppercase dark:text-white">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      5. Преглед, Тест & Запис
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Можете да тествате как изглежда печатът или изтеглянето
                      преди финалния запис.
                    </p>
                  </div>

                  {/* Summary Parameter Badges */}
                  <div className="space-y-2.5 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-900/80">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-500">Заглавие:</span>
                      <span className="font-black text-zinc-900 dark:text-white">
                        {title || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-500">
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
                      <span className="font-bold text-zinc-500">
                        Ориентация:
                      </span>
                      <span className="font-bold">
                        {orientation === "landscape"
                          ? "Landscape (Пейзаж 16:9)"
                          : "Portrait (Портрет 3:4)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-500">AI Фон:</span>
                      <span className="font-bold">
                        {aiBackgroundUrl
                          ? "✅ Генериран AI фон"
                          : "Стандартна векторна рамка"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-500">
                        Печат & Воден знак:
                      </span>
                      <span className="font-bold">
                        {sealStyle} • {watermarkOpacity}%
                      </span>
                    </div>
                  </div>

                  {/* Resolution Toggle for Professional Printing */}
                  <div className="space-y-1.5 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <Label className="text-xs font-bold">
                      Резолюция на експортираните файлове:
                    </Label>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setExportResolution("standard")}
                        className={`rounded-xl border p-2 text-center text-xs font-bold transition-all ${
                          exportResolution === "standard"
                            ? "border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                            : "border-zinc-200 text-zinc-500 dark:border-zinc-800"
                        }`}
                      >
                        ⚡ Standard (Web HD)
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportResolution("ultra_300dpi")}
                        className={`rounded-xl border p-2 text-center text-xs font-bold transition-all ${
                          exportResolution === "ultra_300dpi"
                            ? "border-purple-600 bg-purple-50 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200"
                            : "border-zinc-200 text-zinc-500 dark:border-zinc-800"
                        }`}
                      >
                        🖨️ Ultra HD 300 DPI (Печатница)
                      </button>
                    </div>
                  </div>

                  {/* Quick Test Actions: Print, PDF, PNG */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                      Тестови действия за проверка на качеството:
                    </Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestPrint}
                        className="gap-1.5 rounded-xl border-zinc-200 text-xs font-bold dark:border-zinc-800"
                      >
                        <Printer className="size-3.5" />
                        Печат (A4)
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestExportPdf}
                        disabled={isExportingPdf}
                        className="gap-1.5 rounded-xl border-zinc-200 text-xs font-bold dark:border-zinc-800"
                      >
                        {isExportingPdf ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <FileDown className="size-3.5" />
                        )}
                        Тест PDF (Лице)
                      </Button>

                      {includeBackside && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestExportBacksidePdf}
                            disabled={isExportingBacksidePdf}
                            className="gap-1.5 rounded-xl border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-200"
                          >
                            {isExportingBacksidePdf ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <FileDown className="size-3.5" />
                            )}
                            Тест PDF (Гръб)
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestExportDoublePdf}
                            disabled={isExportingDoublePdf}
                            className="col-span-2 gap-1.5 rounded-xl border-purple-300 bg-purple-50/50 text-xs font-bold text-purple-950 sm:col-span-1 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-200"
                          >
                            {isExportingDoublePdf ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="size-3.5 text-purple-600" />
                            )}
                            2-страничен PDF
                          </Button>
                        </>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestExportPng}
                        disabled={isExportingPng}
                        className="gap-1.5 rounded-xl border-zinc-200 text-xs font-bold dark:border-zinc-800"
                      >
                        {isExportingPng ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Download className="size-3.5" />
                        )}
                        Тест PNG
                      </Button>
                    </div>
                  </div>

                  {/* Main Save & Activate Button */}
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-12 w-full gap-2 rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-600 text-sm font-black text-white shadow-xl shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700"
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

          {/* RIGHT: LIVE INTERACTIVE PREVIEW CANVAS (7 cols) */}
          <div className="flex flex-col items-center justify-center overflow-y-auto bg-zinc-100 p-4 sm:p-6 lg:col-span-7 lg:p-8 xl:col-span-7 dark:bg-zinc-950/80">
            <div className="flex w-full max-w-4xl flex-col items-center space-y-3">
              <div className="flex w-full items-center justify-between px-2 text-xs font-bold text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                  Интерактивен Преглед в Реално Време
                  {includeBackside && " (Двустранен: Лице + Гръб)"}
                </span>
                <span className="font-mono text-[10px] tracking-wider uppercase">
                  {orientation} • {layoutTemplate}
                </span>
              </div>

              {/* Document Canvas (Split Screen if Backside Enabled) */}
              {includeBackside ? (
                <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-2">
                  <div className="space-y-1.5">
                    <span className="block text-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                      📄 Лице (Front)
                    </span>
                    <CertificateDocumentPreview
                      data={previewData}
                      className="shadow-2xl transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="block text-center text-xs font-bold text-amber-500">
                      📜 Гръб (Backside)
                    </span>
                    <CertificateBacksidePreview
                      data={previewData}
                      className="shadow-2xl transition-all duration-300"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex w-full items-center justify-center transition-all duration-300">
                  <CertificateDocumentPreview
                    data={previewData}
                    className="shadow-2xl transition-all duration-300"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* English AI Prompt Preview Modal */}
        <Dialog
          open={showEnglishPreviewModal}
          onOpenChange={setShowEnglishPreviewModal}
        >
          <DialogContent className="max-w-lg rounded-3xl border-zinc-200 p-6 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                <Languages className="size-4 text-purple-600" />
                <span>Преведен Английски Промпт за AI Модела</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Това е оптимизираният английски текст, който системата изпраща
                към Imagen 3 / FLUX задкулисно:
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {englishPromptPreview || "—"}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setShowEnglishPreviewModal(false)}
                className="rounded-xl text-xs font-bold"
              >
                Разбрах
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
