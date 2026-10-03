/* eslint-disable sonarjs/no-nested-conditional, sonarjs/cognitive-complexity */
"use client";

import confetti from "canvas-confetti";
import {
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Handshake,
  ImageIcon,
  ListPlus,
  Loader2,
  Maximize2,
  Plus,
  Printer,
  ShieldCheck,
  Sparkles,
  Square,
  Ticket,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useMembers } from "@/hooks/useMembers";
import { certificateIssuanceService } from "@/services/certificate-issuance-service";
import { uploadFile } from "@/services/storage-service";
import {
  CertificateType,
  IssueCertificateInput,
  IssuedCertificate,
  SponsorPartner,
} from "@/types/certificates";

interface CachedVoucherTemplate {
  filePreviewUrl?: string | null;
  remoteFileUrl?: string | null;
  fileName?: string;
  fileType?: "pdf" | "image";
  docType?: CertificateType;
  purpose?: string;
  totalSessions?: number;
  validityMode?: "30" | "60" | "custom_date";
  customExpiryDate?: string;
  recipientInstitution?: string;
  clubLogoUrl?: string;
  selectedSponsorIds?: string[];
  additionalPartnerLogos?: Array<{ name: string; logoUrl: string }>;
}

function readTemplateCache(siteId: string): CachedVoucherTemplate | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`bkg_cached_voucher_template_${siteId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeTemplateCache(
  siteId: string,
  data: Partial<CachedVoucherTemplate>
): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readTemplateCache(siteId) || {};
    const updated = { ...existing, ...data };
    localStorage.setItem(
      `bkg_cached_voucher_template_${siteId}`,
      JSON.stringify(updated)
    );
  } catch {
    // ignore quota
  }
}

interface UploadVoucherTabProps {
  siteId: "bkgalabovo" | "recoveryzone";
  sponsors: SponsorPartner[];
  onIssuedSuccess: () => Promise<void>;
  onSwitchToRegistry: () => void;
}

type IssuanceTargetMode = "single" | "club_multi" | "class_list";

export function UploadVoucherTab({
  siteId,
  sponsors,
  onIssuedSuccess,
  onSwitchToRegistry,
}: UploadVoucherTabProps) {
  const { idToken } = useAuth();
  const { members } = useMembers();

  const isRecoveryZone = siteId === "recoveryzone";
  const defaultClubLogo = isRecoveryZone
    ? "/recovery-zone/rz-icon-square.png"
    : "/icons/LOGO.webp";

  // --- Persistent Cache Restoration State ---
  const [isRestoredFromCache, setIsRestoredFromCache] = useState(false);

  // --- Document File State (Шаблон) ---
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "image">("pdf");
  const [remoteFileUrl, setRemoteFileUrl] = useState<string | null>(null);

  // --- Details State (Шаблон) ---
  const [docType, setDocType] = useState<CertificateType>("voucher");
  const [purpose, setPurpose] = useState("8 безплатни тренировки по бадминтон");
  const [totalSessions, setTotalSessions] = useState<number>(8);
  const [validityMode, setValidityMode] = useState<"30" | "60" | "custom_date">(
    "60"
  );
  const [customExpiryDate, setCustomExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().split("T")[0];
  });
  const [recipientInstitution, setRecipientInstitution] = useState(
    'Второ ОУ "Христо Ботев" град Гълъбово'
  );

  // --- Branding State (Шаблон) ---
  const [clubLogoUrl, setClubLogoUrl] = useState(defaultClubLogo);
  const [selectedSponsorIds, setSelectedSponsorIds] = useState<string[]>(() =>
    sponsors.filter((s) => s.isActive).map((s) => s.id)
  );
  const [additionalPartnerLogos, setAdditionalPartnerLogos] = useState<
    Array<{ name: string; logoUrl: string }>
  >([]);

  // Hydrate template from local cache on mount
  React.useEffect(() => {
    const cached = readTemplateCache(siteId);
    if (cached) {
      if (cached.filePreviewUrl) setFilePreviewUrl(cached.filePreviewUrl);
      if (cached.remoteFileUrl) setRemoteFileUrl(cached.remoteFileUrl);
      if (cached.fileType) setFileType(cached.fileType);
      if (cached.docType) setDocType(cached.docType);
      if (cached.purpose) setPurpose(cached.purpose);
      if (cached.totalSessions) setTotalSessions(cached.totalSessions);
      if (cached.validityMode) setValidityMode(cached.validityMode);
      if (cached.customExpiryDate) setCustomExpiryDate(cached.customExpiryDate);
      if (cached.recipientInstitution)
        setRecipientInstitution(cached.recipientInstitution);
      if (cached.clubLogoUrl) setClubLogoUrl(cached.clubLogoUrl);
      if (cached.selectedSponsorIds)
        setSelectedSponsorIds(cached.selectedSponsorIds);
      if (cached.additionalPartnerLogos)
        setAdditionalPartnerLogos(cached.additionalPartnerLogos);
      if (cached.filePreviewUrl || cached.remoteFileUrl) {
        setIsRestoredFromCache(true);
      }
    }
  }, [siteId]);

  // --- Active Studio Step (1: Създай шаблон -> 2: Издай за деца) ---
  const [activeStep, setActiveStep] = useState<"template" | "issue">(
    "template"
  );

  // --- Recipient Issuance Modes ---
  const [targetMode, setTargetMode] = useState<IssuanceTargetMode>("single");

  // Mode 1: Single Recipient
  const [recipientMode, setRecipientMode] = useState<"manual" | "member">(
    "manual"
  );
  const [recipientName, setRecipientName] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Mode 2: Club Multi Selection
  const [selectedClubMemberIds, setSelectedClubMemberIds] = useState<string[]>(
    []
  );
  const [clubMemberSearch, setClubMemberSearch] = useState("");

  // Mode 3: Class List (Bulk Text)
  const [classListText, setClassListText] = useState("");

  // --- Submission & Batch State ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [issuedSuccessCert, setIssuedSuccessCert] =
    useState<IssuedCertificate | null>(null);
  const [batchResults, setBatchResults] = useState<IssuedCertificate[]>([]);
  const [isBatchResultsOpen, setIsBatchResultsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  // File Inputs Refs
  const voucherFileInputRef = useRef<HTMLInputElement>(null);
  const clubLogoInputRef = useRef<HTMLInputElement>(null);
  const partnerLogoInputRef = useRef<HTMLInputElement>(null);

  // Preset Institutions
  const PRESET_INSTITUTIONS = [
    'Второ ОУ "Христо Ботев" град Гълъбово',
    'СУ "Васил Левски" град Гълъбово',
    'ДГ "Радост" град Гълъбово',
    'ДГ "Наталия" град Гълъбово',
  ];

  // Dynamic Preset Purposes
  const presetPurposes = useMemo(() => {
    const sessionWord =
      totalSessions === 1 ? "безплатна тренировка" : "безплатни тренировки";
    return [
      `${totalSessions} ${sessionWord} по бадминтон`,
      "1 месец безплатни тренировки за начинаещи",
      "Участие в летен бадминтон лагер",
      "Пакет „Шампион“ – 12 тренировки",
      "Награда за отлично представяне в училище",
      "Безплатна възстановителна сесия (Recovery Zone)",
    ];
  }, [totalSessions]);

  // Preview URL memo
  const previewUrl = useMemo(() => {
    if (filePreviewUrl) return filePreviewUrl;
    if (remoteFileUrl) return remoteFileUrl;
    if (uploadedFile) {
      try {
        return URL.createObjectURL(uploadedFile);
      } catch {
        return null;
      }
    }
    return null;
  }, [filePreviewUrl, remoteFileUrl, uploadedFile]);

  // Clear template cache helper
  const handleClearTemplateCache = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`bkg_cached_voucher_template_${siteId}`);
    }
    setUploadedFile(null);
    setFilePreviewUrl(null);
    setRemoteFileUrl(null);
    setIsRestoredFromCache(false);
    toast.info("Кешът на шаблона е изчистен.");
  };

  // Proceed from Template Creation to Issuance Step
  const handleProceedToIssuance = () => {
    if (!uploadedFile && !remoteFileUrl && !previewUrl) {
      toast.warning(
        "Моля, първо качете документ (ваучер, грамота или сертификат)!"
      );
      return;
    }

    // Save template configuration to local cache
    writeTemplateCache(siteId, {
      filePreviewUrl: filePreviewUrl || remoteFileUrl,
      remoteFileUrl,
      fileType,
      docType,
      purpose,
      totalSessions,
      validityMode,
      customExpiryDate,
      recipientInstitution,
      clubLogoUrl,
      selectedSponsorIds,
      additionalPartnerLogos,
    });

    toast.success(
      `Шаблонът за ${recipientInstitution || "събитието"} е готов и запазен в локалния кеш! Зареден е табът за издаване.`
    );
    setActiveStep("issue");
  };

  // Filtered members for single pick
  const filteredSingleMembers = useMemo(() => {
    if (!memberSearch.trim()) return members.slice(0, 8);
    const q = memberSearch.toLowerCase();
    return members.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.phone?.includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  // Filtered members for multi pick
  const filteredMultiMembers = useMemo(() => {
    if (!clubMemberSearch.trim()) return members;
    const q = clubMemberSearch.toLowerCase();
    return members.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.ageGroup?.toLowerCase().includes(q) ||
        m.phone?.includes(q)
    );
  }, [members, clubMemberSearch]);

  const toggleSelectClubMember = (id: string) => {
    setSelectedClubMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllClubMembers = () => {
    setSelectedClubMemberIds(filteredMultiMembers.map((m) => m.id));
  };

  const handleClearAllClubMembers = () => {
    setSelectedClubMemberIds([]);
  };

  // Parsed class list names from textarea
  const parsedClassListNames = useMemo(() => {
    return classListText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length >= 2);
  }, [classListText]);

  // Handle voucher file selection
  const handleVoucherFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    const isImg =
      file.type.startsWith("image/") ||
      /\.(png|jpe?g|webp)$/i.test(file.name.toLowerCase());

    if (!isPdf && !isImg) {
      toast.error(
        "Невалиден формат! Моля, качете PDF или изображение (PNG, JPG, WEBP)."
      );
      return;
    }

    // Vercel Hobby план ограничава до 4.5MB per request — запазваме буфер
    if (file.size > 4 * 1024 * 1024) {
      toast.error(
        "Файлът е твърде голям! Максималният размер е 4 MB (ограничение на сървъра)."
      );
      return;
    }

    setUploadedFile(file);
    const chosenType = isPdf ? "pdf" : "image";
    setFileType(chosenType);
    setFilePreviewUrl(URL.createObjectURL(file));
    setRemoteFileUrl(null);
    setIsRestoredFromCache(false);
    toast.success(`Избран е файл: ${file.name}`);

    // If small enough (< 5MB), convert to data URL for persistent cache
    if (file.size < 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        writeTemplateCache(siteId, {
          filePreviewUrl: dataUrl,
          fileType: chosenType,
          fileName: file.name,
          docType,
          purpose,
          totalSessions,
          validityMode,
          customExpiryDate,
          recipientInstitution,
          clubLogoUrl,
          selectedSponsorIds,
          additionalPartnerLogos,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload custom club logo
  const handleClubLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading("Качване на клубно лого...", { id: "club-upload" });
      const path = `sites/${siteId}/certificates/branding/club_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const url = await uploadFile(path, file, idToken);
      setClubLogoUrl(url);
      toast.success("Клубното лого е качено успешно!", { id: "club-upload" });
    } catch (err) {
      console.error(err);
      toast.error("Грешка при качване на клубно лого.", { id: "club-upload" });
    }
  };

  // Upload custom partner logo
  const handlePartnerLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading("Качване на партньорско лого...", { id: "partner-upload" });
      const path = `sites/${siteId}/certificates/branding/partner_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const url = await uploadFile(path, file, idToken);
      const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setAdditionalPartnerLogos((prev) => [...prev, { name, logoUrl: url }]);
      toast.success("Партньорското лого е добавено!", { id: "partner-upload" });
    } catch (err) {
      console.error(err);
      toast.error("Грешка при качване на партньорско лого.", {
        id: "partner-upload",
      });
    }
  };

  // Toggle sponsor selection
  const toggleSponsor = (id: string) => {
    setSelectedSponsorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle single member selection
  const handleSelectMember = (m: (typeof members)[0]) => {
    setSelectedMemberId(m.id);
    setRecipientName(m.name || "");
  };

  // Handle number of sessions pick
  const handleSelectSessions = (num: number) => {
    setTotalSessions(num);
    const sessionWord =
      num === 1 ? "безплатна тренировка" : "безплатни тренировки";
    const defaultSport = "по бадминтон";

    if (
      !purpose ||
      purpose.includes("безплатни тренировки") ||
      purpose.includes("безплатна тренировка") ||
      purpose.includes("тренировки")
    ) {
      setPurpose(`${num} ${sessionWord} ${defaultSport}`);
    } else {
      setPurpose(`${num} ${sessionWord} ${defaultSport} – ${purpose.trim()}`);
    }
  };

  // Core helper to issue certificate for a single child
  const issueSingleRecipient = async (
    recipient: { name: string; memberId?: string },
    finalFileUrl: string,
    allPartnerLogos: Array<{
      name: string;
      logoUrl: string;
      websiteUrl?: string;
    }>,
    validUntilIso?: string
  ): Promise<IssuedCertificate> => {
    const input: IssueCertificateInput = {
      templateId: "uploaded_voucher",
      type: docType,
      recipient: {
        memberId: recipient.memberId,
        name: recipient.name.trim(),
        institution: recipientInstitution.trim() || undefined,
      },
      details: {
        voucherServiceType: purpose.trim(),
        eventTitle: purpose.trim(),
        totalSessions: docType === "voucher" ? totalSessions || 8 : undefined,
        validUntil: validUntilIso,
      },
      uploadedDocument: {
        fileUrl: finalFileUrl,
        fileType,
        fileName: uploadedFile?.name,
        fileSize: uploadedFile?.size,
      },
      branding: {
        clubLogoUrl: clubLogoUrl || defaultClubLogo,
        institutionLogoUrl: undefined,
        partnerLogos: allPartnerLogos.length > 0 ? allPartnerLogos : undefined,
      },
    };

    return await certificateIssuanceService.issueCertificate(siteId, input);
  };

  // Execute Issuance (Single or Batch)
  const handleExecuteIssuance = async () => {
    if (!uploadedFile && !remoteFileUrl && !previewUrl) {
      toast.error(
        "Моля, качете файл на ваучера / документа (PDF или изображение) в Стъпка 1!"
      );
      voucherFileInputRef.current?.click();
      return;
    }

    if (!purpose.trim()) {
      toast.error("Моля, посочете за какво е ваучерът / документът!");
      return;
    }

    // Determine list of recipients to issue for
    type RecipientItem = { name: string; memberId?: string };
    const recipientsToIssue: RecipientItem[] = [];

    if (targetMode === "single") {
      if (!recipientName.trim()) {
        toast.error("Моля, въведете или изберете име на детето / получателя!");
        return;
      }
      recipientsToIssue.push({
        name: recipientName.trim(),
        memberId: selectedMemberId || undefined,
      });
    } else if (targetMode === "club_multi") {
      if (selectedClubMemberIds.length === 0) {
        toast.error("Моля, отбележете поне едно дете от клуба за издаване!");
        return;
      }
      const selectedMembers = members.filter((m) =>
        selectedClubMemberIds.includes(m.id)
      );
      for (const m of selectedMembers) {
        if (m.name?.trim()) {
          recipientsToIssue.push({ name: m.name.trim(), memberId: m.id });
        }
      }
    } else if (targetMode === "class_list") {
      if (parsedClassListNames.length === 0) {
        toast.error("Моля, въведете поне едно име в списъка за класа!");
        return;
      }
      for (const name of parsedClassListNames) {
        recipientsToIssue.push({ name: name.trim() });
      }
    }

    if (recipientsToIssue.length === 0) {
      toast.error("Няма валидни получатели за издаване.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Upload file if needed, or fallback to filePreviewUrl / previewUrl
      let finalFileUrl = remoteFileUrl;
      if (!finalFileUrl && uploadedFile) {
        try {
          toast.loading("Качване на документа в защитено хранилище...", {
            id: "issuing",
          });
          const safeName = uploadedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `sites/${siteId}/certificates/vouchers/${Date.now()}_${safeName}`;
          finalFileUrl = await uploadFile(path, uploadedFile, idToken);
          setRemoteFileUrl(finalFileUrl);
        } catch (uploadErr) {
          console.warn(
            "Storage upload notice (using local voucher canvas):",
            uploadErr
          );
          if (filePreviewUrl || previewUrl) {
            finalFileUrl = (filePreviewUrl || previewUrl) as string;
          } else {
            throw uploadErr;
          }
        }
      }

      if (!finalFileUrl && (filePreviewUrl || previewUrl)) {
        finalFileUrl = (filePreviewUrl || previewUrl) as string;
      }

      if (!finalFileUrl) {
        throw new Error("Неуспешно качване на документа.");
      }

      // 2. Prepare partners logos
      const activeSponsorObjects = sponsors
        .filter((s) => selectedSponsorIds.includes(s.id))
        .map((s) => ({
          name: s.name,
          logoUrl: s.logoUrl,
          websiteUrl: s.websiteUrl,
        }));

      const rawPartnerLogos = [
        ...activeSponsorObjects,
        ...additionalPartnerLogos,
      ];

      const seenPartnerNames = new Set<string>();
      const allPartnerLogos: Array<{
        name: string;
        logoUrl: string;
        websiteUrl?: string;
      }> = [];

      for (const p of rawPartnerLogos) {
        const norm = p.name.trim().toLowerCase();
        if (norm && !seenPartnerNames.has(norm)) {
          seenPartnerNames.add(norm);
          allPartnerLogos.push({
            name: p.name.trim(),
            logoUrl: p.logoUrl || "",
            websiteUrl:
              "websiteUrl" in p
                ? (p as { websiteUrl?: string }).websiteUrl
                : undefined,
          });
        }
      }

      // 3. Prepare valid until date
      let validUntilIso: string | undefined;
      if (docType === "voucher") {
        if (validityMode === "custom_date" && customExpiryDate) {
          const customD = new Date(customExpiryDate);
          customD.setHours(23, 59, 59, 999);
          validUntilIso = customD.toISOString();
        } else {
          const days = validityMode === "30" ? 30 : 60;
          const expDate = new Date();
          expDate.setDate(expDate.getDate() + days);
          validUntilIso = expDate.toISOString();
        }
      }

      // 4. Sequential generation of individual certificates
      const issuedResults: IssuedCertificate[] = [];
      const total = recipientsToIssue.length;

      for (let i = 0; i < total; i++) {
        const item = recipientsToIssue[i];
        setBatchProgress({ current: i + 1, total });
        toast.loading(
          total === 1
            ? "Генериране на електронен валидатор и QR код..."
            : `Издаване на ваучер ${i + 1} от ${total} (${item.name})...`,
          { id: "issuing" }
        );

        const issued = await issueSingleRecipient(
          item,
          finalFileUrl,
          allPartnerLogos,
          validUntilIso
        );
        issuedResults.push(issued);
      }

      // Success celebration
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {
        // Ignored
      }

      await onIssuedSuccess();

      if (total === 1) {
        setIssuedSuccessCert(issuedResults[0]);
        toast.success(
          `Документ № ${issuedResults[0].serialNumber} е издаден и валидиран успешно!`,
          { id: "issuing" }
        );
      } else {
        setBatchResults(issuedResults);
        setIsBatchResultsOpen(true);
        toast.success(
          `Успешно бяха издадени ${total} персонални ваучера с уникални QR кодове!`,
          { id: "issuing" }
        );
      }
    } catch (error) {
      console.error("Грешка при издаване на ваучер:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Възникна грешка при издаването на документа.",
        { id: "issuing" }
      );
    } finally {
      setIsSubmitting(false);
      setBatchProgress(null);
    }
  };

  // Copy Direct Link
  const handleCopyDirectLink = (certId: string) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const url = `${origin}/cert/${certId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Линкът за проверка е копиран!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Reset for next
  const handleResetForNext = () => {
    setIssuedSuccessCert(null);
    setRecipientName("");
    setSelectedMemberId(null);
    setSelectedClubMemberIds([]);
    setClassListText("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* ===================================================================== */}
      {/* 2-STEP STUDIO WORKFLOW: 1. Създай шаблон -> 2. Издай за децата        */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-xl border border-zinc-200 bg-zinc-100/90 p-1 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setActiveStep("template")}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-3 text-xs font-bold transition-all ${
            activeStep === "template"
              ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-800 dark:text-white"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <FileText className="size-3.5 shrink-0" />
          <span>1. 🎨 Създай шаблон на документа</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!uploadedFile && !remoteFileUrl && !previewUrl) {
              toast.warning(
                "Моля, първо качете документ (ваучер или грамота) в Стъпка 1."
              );
            }
            setActiveStep("issue");
          }}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-3 text-xs font-bold transition-all ${
            activeStep === "issue"
              ? "bg-white text-emerald-600 shadow-xs dark:bg-zinc-800 dark:text-emerald-400"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Users className="size-3.5 shrink-0" />
          <span>2. 👥 Издай за деца по шаблона</span>
          {(uploadedFile || remoteFileUrl) && (
            <span className="ml-1 inline-flex size-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-3.5 lg:grid-cols-12">
        {/* LEFT COLUMN: 2 STAGES (7 cols) */}
        <div className="space-y-3 sm:space-y-3.5 lg:col-span-7">
          {/* ================================================================= */}
          {/* СТЪПКА 1: СЪЗДАВАНЕ НА ШАБЛОНА НА ДОКУМЕНТА                       */}
          {/* ================================================================= */}
          {activeStep === "template" && (
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                  Стъпка 1: Настройка на шаблона за събитието
                </span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  Основа за кампанията
                </Badge>
              </div>

              {/* Cache status banner */}
              {isRestoredFromCache && (filePreviewUrl || remoteFileUrl) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50/80 p-2.5 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      <strong>Зареден от локалния кеш:</strong> Документът и
                      настройките са запазени.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setActiveStep("issue")}
                      className="h-6.5 rounded-lg bg-emerald-600 px-2.5 text-[10px] font-bold text-white hover:bg-emerald-700"
                    >
                      Към издаване ➔
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearTemplateCache}
                      className="h-6.5 rounded-lg px-2 text-[10px] text-zinc-500 hover:text-red-500"
                    >
                      Изчисти
                    </Button>
                  </div>
                </div>
              )}

              {/* 1.1 Upload Document */}
              <Card className="space-y-2.5 rounded-xl sm:rounded-2xl border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    <Upload className="size-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-white">
                      1. Качете готов ваучер / документ
                    </h3>
                    <p className="text-[10px] text-zinc-500">
                      Поддържани формати: PDF, PNG, JPG, WEBP (до 4MB)
                    </p>
                  </div>
                </div>

                {!uploadedFile && !remoteFileUrl && !filePreviewUrl ? (
                  <div
                    onClick={() => voucherFileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/60 p-4 text-center transition-colors hover:border-blue-500 hover:bg-blue-50/40 dark:border-zinc-700 dark:bg-zinc-950/60"
                  >
                    <input
                      ref={voucherFileInputRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleVoucherFileChange}
                      className="hidden"
                    />
                    <div className="mb-1.5 flex size-9 items-center justify-center rounded-xl bg-white shadow-xs dark:bg-zinc-800">
                      <FileText className="size-4.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Кликнете за избор на файл
                    </span>
                    <span className="mt-0.5 text-[10px] text-zinc-400">
                      Дизайн на ваучера, грамотата или благодарствения лист
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-2 sm:p-2.5 dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {fileType === "pdf" ? (
                            <FileText className="size-4" />
                          ) : (
                            <ImageIcon className="size-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block wrap-break-word text-xs font-bold text-zinc-900 dark:text-white">
                            {uploadedFile?.name ||
                              (isRestoredFromCache
                                ? "Запазен в кеша документ"
                                : "Качен файл на документа")}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {fileType === "pdf"
                              ? "PDF Документ"
                              : "Изображение"}
                            {uploadedFile &&
                              ` • ${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`}
                            {isRestoredFromCache &&
                              !uploadedFile &&
                              " • запазен локално"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          ref={voucherFileInputRef}
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          onChange={handleVoucherFileChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => voucherFileInputRef.current?.click()}
                          className="h-7 rounded-lg text-xs font-semibold px-2.5"
                        >
                          Смени
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleClearTemplateCache}
                          className="size-7 rounded-lg text-zinc-400 hover:text-red-500"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Live Visualizer Box */}
                    {previewUrl && (
                      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950/5 p-2 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-center justify-between pb-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          <span className="flex items-center gap-1">
                            <Eye className="size-3.5 text-blue-600" />
                            Визуализация:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsDocumentModalOpen(true)}
                              className="h-6 gap-1 rounded-md text-[10px] px-2"
                            >
                              <Maximize2 className="size-2.5" />
                              Цял екран
                            </Button>
                            <a
                              href={previewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-6 items-center gap-1 rounded-md bg-zinc-100 px-2 text-[10px] font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
                            >
                              <ExternalLink className="size-2.5" />
                              Нов таб
                            </a>
                          </div>
                        </div>

                        {fileType === "pdf" ? (
                          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-inner dark:border-zinc-800">
                            <iframe
                              src={previewUrl}
                              title="PDF Преглед"
                              className="h-56 sm:h-64 w-full border-0"
                            />
                          </div>
                        ) : (
                          <div className="flex max-h-60 w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-900 p-1.5 dark:border-zinc-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrl}
                              alt="Качен документ"
                              className="max-h-56 w-auto rounded object-contain shadow-md"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* 1.2 Educational Institution */}
              <Card className="space-y-2 rounded-xl sm:rounded-2xl border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                    <User className="size-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-white">
                      2. Образователна институция / Училище / Детска градина
                    </h3>
                    <p className="text-[10px] text-zinc-500">
                      Показва се върху документа и определя училищната
                      принадлежност
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Input
                    placeholder='напр. Второ ОУ "Христо Ботев" град Гълъбово'
                    value={recipientInstitution}
                    onChange={(e) => setRecipientInstitution(e.target.value)}
                    className="h-8.5 rounded-lg border-zinc-200 text-xs font-semibold dark:border-zinc-800"
                  />

                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {PRESET_INSTITUTIONS.map((inst) => (
                      <button
                        key={inst}
                        type="button"
                        onClick={() => setRecipientInstitution(inst)}
                        className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold transition-all ${
                          recipientInstitution === inst
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs dark:border-blue-600 dark:bg-blue-950/60 dark:text-blue-300"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                        }`}
                      >
                        {inst}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* 1.3 Purpose, Sessions, Validity */}
              <Card className="space-y-2.5 rounded-xl sm:rounded-2xl border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
                    <Ticket className="size-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-white">
                      3. За какво е този ваучер / документ
                    </h3>
                    <p className="text-[10px] text-zinc-500">
                      Услуга, брой безплатни тренировки и срок за ползване
                    </p>
                  </div>
                </div>

                {/* Document Type Selector */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "voucher", label: "🎟️ Ваучер", desc: "С отчитане" },
                    { id: "award", label: "🏆 Грамота", desc: "За отличие" },
                    {
                      id: "certificate",
                      label: "📜 Сертификат",
                      desc: "За участие",
                    },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDocType(t.id as CertificateType)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-1.5 text-center transition-all ${
                        docType === t.id
                          ? "border-blue-600 bg-blue-50/60 font-bold text-blue-900 shadow-xs dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200"
                          : "border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                      }`}
                    >
                      <span className="text-xs font-bold">{t.label}</span>
                      <span className="text-[9px] text-zinc-400">{t.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Purpose input */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    За какво е предназначен (Описание на услугата / Отличието){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="напр. 8 безплатни тренировки по бадминтон"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="h-8.5 rounded-lg border-zinc-200 text-xs font-semibold dark:border-zinc-800"
                  />

                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {presetPurposes.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPurpose(p)}
                        className="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[9px] font-medium text-zinc-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attendance & Session settings (If Voucher) */}
                {docType === "voucher" && (
                  <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Брой тренировки
                        </Label>
                        <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                          {totalSessions}{" "}
                          {totalSessions === 1 ? "тренировка" : "тренировки"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {[1, 2, 4, 8, 10, 12, 14].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleSelectSessions(num)}
                            className={`min-w-7 flex-1 rounded-lg border py-1 text-xs font-bold transition-all ${
                              totalSessions === num
                                ? "border-amber-400 bg-amber-500 text-white shadow-xs"
                                : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Срок на валидност
                        </Label>
                        <span className="text-[10px] font-bold text-zinc-500">
                          {validityMode === "custom_date"
                            ? `до ${new Date(customExpiryDate).toLocaleDateString("bg-BG")}`
                            : validityMode === "30"
                              ? "30 дни (1 м.)"
                              : "60 дни (2 м.)"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => setValidityMode("30")}
                          className={`rounded-lg border py-1 text-center text-xs font-bold transition-all ${
                            validityMode === "30"
                              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs dark:bg-blue-950/60 dark:text-blue-300"
                              : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                          }`}
                        >
                          30 дни
                        </button>

                        <button
                          type="button"
                          onClick={() => setValidityMode("60")}
                          className={`rounded-lg border py-1 text-center text-xs font-bold transition-all ${
                            validityMode === "60"
                              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs dark:bg-blue-950/60 dark:text-blue-300"
                              : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                          }`}
                        >
                          60 дни
                        </button>

                        <button
                          type="button"
                          onClick={() => setValidityMode("custom_date")}
                          className={`rounded-lg border py-1 text-center text-xs font-bold transition-all ${
                            validityMode === "custom_date"
                              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs dark:bg-blue-950/60 dark:text-blue-300"
                              : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                          }`}
                        >
                          📅 Дата
                        </button>
                      </div>

                      {validityMode === "custom_date" && (
                        <div className="pt-1">
                          <Input
                            type="date"
                            value={customExpiryDate}
                            onChange={(e) =>
                              setCustomExpiryDate(e.target.value)
                            }
                            className="h-8 rounded-lg border-zinc-200 text-xs font-semibold dark:border-zinc-800"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {/* 1.4 Branding & Partners */}
              <Card className="space-y-2.5 rounded-xl sm:rounded-2xl border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                    <Handshake className="size-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-white">
                      4. Логота и брандиране
                    </h3>
                    <p className="text-[10px] text-zinc-500">
                      Официално лого на клуба и избрани партньори / спонсори
                    </p>
                  </div>
                </div>

                {/* Club Logo */}
                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/50">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white p-1 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <Image
                          src={clubLogoUrl}
                          alt={
                            isRecoveryZone
                              ? "RECOVERY ZONE BY ZM"
                              : "БАДМИНТОН КЛУБ ГЪЛЪБОВО"
                          }
                          width={36}
                          height={36}
                          className="size-full object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-white">
                          {isRecoveryZone
                            ? "RECOVERY ZONE BY ZM"
                            : "БАДМИНТОН КЛУБ ГЪЛЪБОВО"}
                        </h4>
                        <p className="text-[10px] text-zinc-400">
                          Официален издател
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        ref={clubLogoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleClubLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => clubLogoInputRef.current?.click()}
                        className="h-7 rounded-lg px-2.5 text-xs font-semibold"
                      >
                        Качи друго
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Partners & Sponsors Checklist */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      🤝 Партньори и Спонсори
                    </Label>
                    <input
                      ref={partnerLogoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePartnerLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => partnerLogoInputRef.current?.click()}
                      className="h-6 text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <Plus className="mr-0.5 size-3" /> Добави лого
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                    {sponsors.map((s) => {
                      const isChecked = selectedSponsorIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSponsor(s.id)}
                          className={`flex items-center gap-1.5 rounded-lg border p-1.5 text-left transition-all ${
                            isChecked
                              ? "border-blue-500 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-950/40"
                              : "border-zinc-200 bg-white opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
                          }`}
                        >
                          <div className="relative size-5 shrink-0 rounded bg-white p-0.5 shadow-xs">
                            <Image
                              src={s.logoUrl}
                              alt={s.name}
                              width={20}
                              height={20}
                              className="size-full object-contain"
                              unoptimized
                            />
                          </div>
                          <span className="wrap-break-word text-[10px] sm:text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                            {s.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {additionalPartnerLogos.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {additionalPartnerLogos.map((pl, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="gap-1 rounded-lg border-purple-300 bg-purple-50 py-0.5 text-[10px] text-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
                        >
                          <Image
                            src={pl.logoUrl}
                            alt="p"
                            width={12}
                            height={12}
                            className="rounded-full"
                            unoptimized
                          />
                          <span>{pl.name}</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Бутон за преминаване към таба за издаване */}
              <div className="pt-1">
                <Button
                  type="button"
                  size="default"
                  onClick={handleProceedToIssuance}
                  className="h-10 w-full rounded-xl bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Sparkles className="mr-1.5 size-4" />
                  🚀 Зареди шаблона & Премини към издаване за деца ➔
                </Button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* СТЪПКА 2: ИЗДАВАНЕ ЗА ДЕЦАТА ПО ШАБЛОНА                           */}
          {/* ================================================================= */}
          {activeStep === "issue" && (
            <div className="space-y-2.5 sm:space-y-3">
              {/* Активно събитие / Шаблон инфо плашка */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/60 p-2.5 sm:p-3 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                    <Ticket className="size-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                      Зареден шаблон за събитието
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white wrap-break-word">
                      {recipientInstitution || "Образователна институция"}
                    </h4>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 wrap-break-word">
                      {docType === "voucher"
                        ? `${totalSessions} безплатни тренировки • Валидност: ${
                            validityMode === "custom_date" && customExpiryDate
                              ? new Date(customExpiryDate).toLocaleDateString(
                                  "bg-BG"
                                )
                              : validityMode === "30"
                                ? "30 дни (1 месец)"
                                : "60 дни (2 месеца)"
                          }`
                        : docType === "award"
                          ? "Официална грамота за постижения"
                          : "Клубен сертификат"}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveStep("template")}
                  className="h-7 shrink-0 gap-1 rounded-lg border-emerald-300 bg-white text-[11px] font-bold text-emerald-800 hover:bg-emerald-100/60 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300"
                >
                  ✏️ Редактирай шаблона
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                  Издаване по Шаблона
                </span>
                <span className="text-[10px] text-zinc-400">
                  Генерира персонален QR код за всяко дете
                </span>
              </div>

              <Card className="space-y-3 rounded-xl sm:rounded-2xl border border-emerald-200/80 bg-white p-2.5 sm:p-3.5 shadow-xs dark:border-emerald-900/50 dark:bg-zinc-900">
                {/* Mode Selector (3 options) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Изберете начин за издаване:
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTargetMode("single")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition-all ${
                        targetMode === "single"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-200"
                          : "border-zinc-200 bg-zinc-50/60 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                      }`}
                    >
                      <User className="size-3.5 shrink-0" />
                      <span>👤 Единично дете</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetMode("club_multi")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition-all ${
                        targetMode === "club_multi"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-200"
                          : "border-zinc-200 bg-zinc-50/60 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                      }`}
                    >
                      <Users className="size-3.5 shrink-0" />
                      <span>👥 От клуба ({members.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetMode("class_list")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition-all ${
                        targetMode === "class_list"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-200"
                          : "border-zinc-200 bg-zinc-50/60 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                      }`}
                    >
                      <ListPlus className="size-3.5 shrink-0" />
                      <span>📝 Списък на класа</span>
                    </button>
                  </div>
                </div>

                {/* Mode 1 Content: Single Child */}
                {targetMode === "single" && (
                  <div className="space-y-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-2.5 sm:p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Получател (Единично дете):
                      </Label>
                      <div className="flex items-center rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
                        <button
                          type="button"
                          onClick={() => setRecipientMode("manual")}
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-all ${
                            recipientMode === "manual"
                              ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
                              : "text-zinc-500"
                          }`}
                        >
                          Ръчно
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecipientMode("member")}
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-all ${
                            recipientMode === "member"
                              ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
                              : "text-zinc-500"
                          }`}
                        >
                          От клуба ({members.length})
                        </button>
                      </div>
                    </div>

                    {recipientMode === "member" ? (
                      <div className="space-y-1.5">
                        <Input
                          placeholder="Търсене по име на дете..."
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          className="h-8 rounded-lg border-zinc-200 text-xs dark:border-zinc-800"
                        />
                        <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                          {filteredSingleMembers.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSelectMember(m)}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                                selectedMemberId === m.id
                                  ? "bg-blue-50 font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                                  : "hover:bg-zinc-100 text-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-300"
                              }`}
                            >
                              <span className="wrap-break-word font-semibold">
                                {m.name}
                              </span>
                              {m.ageGroup && (
                                <span className="text-[10px] text-zinc-400 shrink-0">
                                  {m.ageGroup}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Име на детето / получателя{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="напр. Габриела Митева"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          className="h-8.5 rounded-lg border-zinc-200 text-xs font-semibold dark:border-zinc-800"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Mode 2 Content: Club Multi-Select */}
                {targetMode === "club_multi" && (
                  <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-2.5 sm:p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Отбележете децата от клуба:
                        </Label>
                        <span className="ml-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          (Избрани: {selectedClubMemberIds.length} от{" "}
                          {members.length})
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllClubMembers}
                          className="h-6.5 text-[10px] font-bold px-2 rounded-md"
                        >
                          <CheckSquare className="mr-1 size-2.5" />
                          Всички ({filteredMultiMembers.length})
                        </Button>
                        {selectedClubMemberIds.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAllClubMembers}
                            className="h-6.5 text-[10px] text-zinc-400 hover:text-red-500 px-1.5"
                          >
                            Изчисти
                          </Button>
                        )}
                      </div>
                    </div>

                    <Input
                      placeholder="Бързо търсене по име или възраст..."
                      value={clubMemberSearch}
                      onChange={(e) => setClubMemberSearch(e.target.value)}
                      className="h-8 rounded-lg border-zinc-200 text-xs dark:border-zinc-800"
                    />

                    <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                      {filteredMultiMembers.map((m) => {
                        const isSelected = selectedClubMemberIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleSelectClubMember(m.id)}
                            className={`flex w-full items-center justify-between rounded-lg border p-1.5 sm:p-2 text-left text-xs transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-50 font-bold text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
                                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <CheckSquare className="size-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Square className="size-3.5 text-zinc-300 shrink-0" />
                              )}
                              <span className="wrap-break-word font-semibold">
                                {m.name}
                              </span>
                            </div>
                            {m.ageGroup && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 shrink-0"
                              >
                                {m.ageGroup}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mode 3 Content: Class List (Bulk Text) */}
                {targetMode === "class_list" && (
                  <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-2.5 sm:p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Списък с имена (по едно на ред):
                      </Label>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          parsedClassListNames.length > 0
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "text-zinc-400"
                        }`}
                      >
                        Разпознати: {parsedClassListNames.length} деца
                      </Badge>
                    </div>

                    <Textarea
                      rows={4}
                      placeholder={`Габриела Митева\nНикола Стоянов\nЕлена Василева\nГеорги Димитров...`}
                      value={classListText}
                      onChange={(e) => setClassListText(e.target.value)}
                      className="rounded-lg font-mono text-xs min-h-20"
                    />
                    <p className="text-[10px] text-zinc-400">
                      💡 Директно поставете списък от Excel, Word или дневник.
                      Всеки ред ще получи собствен ваучер с QR код.
                    </p>
                  </div>
                )}

                {/* FINAL ACTION BUTTON */}
                <div className="pt-1">
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleExecuteIssuance}
                    className="h-10 sm:h-10.5 w-full rounded-xl bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:scale-1.005 hover:from-emerald-700 hover:to-teal-800"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                        {batchProgress
                          ? `Издаване на ваучер ${batchProgress.current} от ${batchProgress.total}...`
                          : "Генериране и валидиране..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 size-4" />
                        {targetMode === "single"
                          ? recipientName
                            ? `🎟️ Издай ваучер за „${recipientName}“`
                            : "🎟️ Издай ваучер за това дете"
                          : targetMode === "club_multi"
                            ? `⚡ Издай ${selectedClubMemberIds.length} ваучера за децата`
                            : `⚡ Издай ${parsedClassListNames.length} персонални ваучера`}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Interactive Electronic Card (5 cols) */}
        <div className="space-y-2.5 lg:col-span-5">
          <div className="sticky top-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                Електронен преглед
              </span>
              <Badge
                variant="outline"
                className="rounded-md border-emerald-300 bg-emerald-50 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                ● Live Verification
              </Badge>
            </div>

            {/* Electronic Voucher Pass Card */}
            <Card className="overflow-hidden rounded-xl sm:rounded-2xl border border-zinc-200/90 bg-linear-to-b from-white to-zinc-50/80 p-2.5 sm:p-3.5 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
              {/* Header Logos Row */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="relative size-8 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white p-0.5 shadow-xs dark:border-zinc-800">
                    <Image
                      src={clubLogoUrl}
                      alt={
                        isRecoveryZone
                          ? "Recovery Zone by ZM"
                          : "БАДМИНТОН КЛУБ ГЪЛЪБОВО"
                      }
                      width={28}
                      height={28}
                      className="size-full object-contain"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                      {isRecoveryZone
                        ? "Recovery Zone by ZM"
                        : "БАДМИНТОН КЛУБ ГЪЛЪБОВО"}
                    </h4>
                    <p className="text-[9px] text-zinc-400">
                      Официален издател
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Voucher Info */}
              <div className="space-y-2 py-2">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                    {docType === "voucher"
                      ? "Клубен Ваучер"
                      : docType === "award"
                        ? "Официална Грамота"
                        : "Клубен Сертификат"}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white wrap-break-word">
                    {activeStep === "template"
                      ? "Име на детето (Шаблон)"
                      : targetMode === "single"
                        ? recipientName || "Име на детето..."
                        : targetMode === "club_multi"
                          ? `${selectedClubMemberIds.length} избрани деца от клуба`
                          : `${parsedClassListNames.length} деца от списъка на класа`}
                  </h3>
                  <p className="text-[11px] text-zinc-500 wrap-break-word">
                    {recipientInstitution || "Образователна институция"}
                  </p>
                </div>

                {/* Purpose Badge */}
                <div className="rounded-xl border border-amber-200/80 bg-linear-to-r from-amber-50 to-orange-50/60 p-2 dark:border-amber-900/60 dark:from-amber-950/40 dark:to-zinc-900">
                  <div className="flex items-center gap-1.5">
                    <Ticket className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-200 wrap-break-word">
                      {purpose || "Цел на ваучера..."}
                    </span>
                  </div>

                  {docType === "voucher" && (
                    <div className="mt-1.5 flex items-center justify-between border-t border-amber-200/60 pt-1.5 text-[10px] text-amber-900 dark:border-amber-900/50 dark:text-amber-300">
                      <span>
                        Оставащи:{" "}
                        <strong>
                          {totalSessions}{" "}
                          {totalSessions === 1 ? "тренировка" : "тренировки"}
                        </strong>
                      </span>
                      <span>
                        Срок:{" "}
                        <strong>
                          {validityMode === "custom_date" && customExpiryDate
                            ? `до ${new Date(customExpiryDate).toLocaleDateString("bg-BG")}`
                            : validityMode === "30"
                              ? "30 дни"
                              : "60 дни"}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Document Thumbnail / Live Preview */}
                {previewUrl ? (
                  <div className="space-y-1.5 rounded-xl border border-zinc-200 bg-zinc-100/50 p-1.5 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center justify-between px-1.5 pt-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <FileCheck className="size-3 text-emerald-600" />
                        Визуализация на документа:
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDocumentModalOpen(true)}
                        className="h-5 gap-1 px-1.5 text-[9px] font-bold text-blue-600 hover:text-blue-700"
                      >
                        <Maximize2 className="size-2.5" />
                        Увеличи
                      </Button>
                    </div>

                    <div className="relative flex aspect-video w-full max-h-40 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-900 dark:border-zinc-800">
                      {fileType === "pdf" ? (
                        <iframe
                          src={previewUrl}
                          title="PDF Preview"
                          className="size-full border-0 pointer-events-none"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt="Миниатюра"
                          className="size-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 text-center text-[11px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
                    Все още не е качен файл на документа
                  </div>
                )}
              </div>

              {/* Footer Authentic Seal */}
              <div className="border-t border-zinc-100 pt-2 dark:border-zinc-800">
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
                    <ShieldCheck className="size-3" />
                    Заверен в клубния регистър
                  </span>
                  <span>{new Date().toLocaleDateString("bg-BG")}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* DIALOG 2: SINGLE ISSUANCE SUCCESS MODAL                               */}
      {/* ===================================================================== */}
      {issuedSuccessCert && (
        <Dialog
          open={Boolean(issuedSuccessCert)}
          onOpenChange={(open) => !open && setIssuedSuccessCert(null)}
        >
          <DialogContent className="max-w-md rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <DialogHeader className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-md shadow-emerald-500/20 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="size-6" />
              </div>
              <DialogTitle className="mt-3 text-lg font-black text-zinc-900 dark:text-white">
                Документът е издаден успешно!
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Ваучерът е вписан в електронния регистър с генериран
                верификационен QR код.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-center">
              <div className="space-y-1 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <span className="font-mono text-xs font-black tracking-wider text-emerald-600 dark:text-emerald-400">
                  № {issuedSuccessCert.serialNumber}
                </span>
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {issuedSuccessCert.recipient.name}
                </div>
              </div>

              {/* QR Image */}
              {issuedSuccessCert.qrCodeDataUrl && (
                <div className="flex justify-center py-0.5">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-xs dark:border-zinc-800">
                    <Image
                      src={issuedSuccessCert.qrCodeDataUrl}
                      alt="Verification QR"
                      width={112}
                      height={112}
                      className="size-28 object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Direct Verification Link Box */}
              <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
                <input
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/cert/${issuedSuccessCert.id}`
                      : `/cert/${issuedSuccessCert.id}`
                  }
                  className="w-full min-w-0 bg-transparent px-2 font-mono text-[11px] text-zinc-600 outline-none dark:text-zinc-300"
                />
                <Button
                  size="sm"
                  onClick={() => handleCopyDirectLink(issuedSuccessCert.id)}
                  className="h-7 shrink-0 rounded-lg bg-blue-600 px-2.5 text-xs font-bold text-white hover:bg-blue-700"
                >
                  {copiedLink ? (
                    <>
                      <Check className="mr-1 size-3" />
                      Копиран
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 size-3" />
                      Копирай
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Share buttons */}
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`viber://forward?text=${encodeURIComponent(
                  `Официален ваучер № ${issuedSuccessCert.serialNumber} за ${issuedSuccessCert.recipient.name}: ` +
                    (typeof window !== "undefined"
                      ? `${window.location.origin}/cert/${issuedSuccessCert.id}`
                      : "")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-purple-50 px-2 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300"
              >
                <span>📱 Viber</span>
              </a>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Официален ваучер за ${issuedSuccessCert.recipient.name}: ` +
                    (typeof window !== "undefined"
                      ? `${window.location.origin}/cert/${issuedSuccessCert.id}`
                      : "")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-emerald-50 px-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                <span>💬 WhatsApp</span>
              </a>

              <a
                href={`/cert/${issuedSuccessCert.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-zinc-100 px-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <ExternalLink className="size-3" />
                <span className="wrap-break-word">Отвори линк</span>
              </a>
            </div>

            <DialogFooter className="grid grid-cols-2 gap-2 pt-1 sm:space-x-0">
              <Button
                variant="outline"
                onClick={handleResetForNext}
                className="h-9 rounded-xl text-xs font-bold"
              >
                <Plus className="mr-1.5 size-3.5" />
                Издай следващ
              </Button>

              <Button
                onClick={() => {
                  setIssuedSuccessCert(null);
                  onSwitchToRegistry();
                }}
                className="h-9 rounded-xl bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Към регистъра
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ===================================================================== */}
      {/* DIALOG 3: BATCH ISSUANCE RESULTS MODAL                                */}
      {/* ===================================================================== */}
      <Dialog open={isBatchResultsOpen} onOpenChange={setIsBatchResultsOpen}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-md shadow-emerald-500/20 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                  🎉 Успешно издадени {batchResults.length} ваучера!
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Институция: {recipientInstitution} • Всяко дете разполага със
                  собствен QR код и сериен номер.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* List of issued children */}
          <div className="max-h-[60vh] space-y-2 overflow-y-auto p-4 sm:p-6 overscroll-contain">
            {batchResults.map((c, idx) => (
              <div
                key={c.id || idx}
                className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {idx + 1}
                    </span>
                    <h4 className="wrap-break-word text-xs sm:text-sm font-black text-zinc-900 dark:text-white">
                      {c.recipient.name}
                    </h4>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    № {c.serialNumber}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
                  <a
                    href={`/cert/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1 rounded-xl bg-blue-50 px-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                  >
                    <ExternalLink className="size-3" />
                    <span>Преглед</span>
                  </a>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyDirectLink(c.id)}
                    className="h-8 gap-1 rounded-xl text-xs font-semibold"
                  >
                    <Copy className="size-3" />
                    <span>Копирай</span>
                  </Button>

                  <a
                    href={`/cert/${c.id}?print=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1 rounded-xl bg-zinc-100 px-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <Printer className="size-3" />
                    <span>Печат</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-100/90 px-6 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/90">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetForNext}
              className="h-9 rounded-xl text-xs font-bold"
            >
              <Plus className="mr-1.5 size-3.5" />
              Издай за други деца
            </Button>

            <Button
              type="button"
              onClick={() => {
                setIsBatchResultsOpen(false);
                onSwitchToRegistry();
              }}
              className="h-9 rounded-xl bg-zinc-900 px-4 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Към регистъра
              <ChevronRight className="ml-1 size-3.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* DIALOG 4: FULLSCREEN DOCUMENT PREVIEW                                 */}
      {/* ===================================================================== */}
      {previewUrl && (
        <Dialog
          open={isDocumentModalOpen}
          onOpenChange={setIsDocumentModalOpen}
        >
          <DialogContent className="max-w-4xl rounded-3xl p-4 sm:p-6">
            <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
              <div>
                <DialogTitle className="text-base font-bold">
                  {uploadedFile?.name || "Преглед на документа"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  {fileType === "pdf" ? "PDF Документ" : "Графично изображение"}
                </DialogDescription>
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="mr-6 inline-flex h-8 items-center gap-1.5 rounded-xl bg-zinc-100 px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <ExternalLink className="size-3.5" />
                <span>Отвори в нов таб</span>
              </a>
            </DialogHeader>

            <div className="mt-4 flex max-h-[75vh] w-full items-center justify-center overflow-auto rounded-2xl bg-zinc-100 p-2 dark:bg-zinc-950">
              {fileType === "pdf" ? (
                <iframe
                  src={previewUrl}
                  title="PDF Fullscreen"
                  className="h-[70vh] w-full rounded-xl border border-zinc-200 bg-white"
                />
              ) : (
                <div className="flex w-full items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Документ"
                    className="max-h-[70vh] w-auto rounded-xl object-contain shadow-md"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
