/* eslint-disable sonarjs/no-nested-conditional, sonarjs/cognitive-complexity */
"use client";

import confetti from "canvas-confetti";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Handshake,
  ImageIcon,
  Loader2,
  Maximize2,
  Plus,
  QrCode,
  School,
  ShieldCheck,
  Sparkles,
  Ticket,
  Upload,
  User,
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

interface UploadVoucherTabProps {
  siteId: "bkgalabovo" | "recoveryzone";
  sponsors: SponsorPartner[];
  onIssuedSuccess: () => Promise<void>;
  onSwitchToRegistry: () => void;
}

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
    : "/icons/badge-option-3-light-squircle.png";

  // --- Document File State ---
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "image">("pdf");
  const [remoteFileUrl, setRemoteFileUrl] = useState<string | null>(null);

  // --- Details State ---
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

  // --- Recipient State ---
  const [recipientMode, setRecipientMode] = useState<"manual" | "member">(
    "manual"
  );
  const [recipientName, setRecipientName] = useState("");
  const [recipientInstitution, setRecipientInstitution] = useState(
    "СУ „Христо Ботев“, гр. Гълъбово"
  );
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // --- Branding State ---
  const [clubLogoUrl, setClubLogoUrl] = useState(defaultClubLogo);
  const [institutionLogoUrl, setInstitutionLogoUrl] = useState<string | null>(
    null
  );
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

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

  const [selectedSponsorIds, setSelectedSponsorIds] = useState<string[]>(() =>
    sponsors.filter((s) => s.isActive).map((s) => s.id)
  );
  const [additionalPartnerLogos, setAdditionalPartnerLogos] = useState<
    Array<{ name: string; logoUrl: string }>
  >([]);

  // --- Loading / Submission State ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedSuccessCert, setIssuedSuccessCert] =
    useState<IssuedCertificate | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // File Inputs Refs
  const voucherFileInputRef = useRef<HTMLInputElement>(null);
  const institutionLogoInputRef = useRef<HTMLInputElement>(null);
  const clubLogoInputRef = useRef<HTMLInputElement>(null);
  const partnerLogoInputRef = useRef<HTMLInputElement>(null);

  // Preset Institutions
  const PRESET_INSTITUTIONS = [
    "СУ „Христо Ботев“, гр. Гълъбово",
    "ДГ „Радост“, гр. Гълъбово",
    "ОУ „Св. Паисий Хилендарски“, гр. Гълъбово",
    "ПГЕТ „Г. С. Раковски“, гр. Гълъбово",
    "ДГ „Енергетиче“, гр. Гълъбово",
    "Община Гълъбово",
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

  // Filtered members for quick pick
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members.slice(0, 8);
    const q = memberSearch.toLowerCase();
    return members.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.phone?.includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

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

    if (file.size > 25 * 1024 * 1024) {
      toast.error("Файлът е твърде голям! Максималният размер е 25MB.");
      return;
    }

    setUploadedFile(file);
    setFileType(isPdf ? "pdf" : "image");
    setRemoteFileUrl(null); // Will upload upon submit or immediately

    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);
    toast.success(`Избран е файл: ${file.name}`);
  };

  // Upload institution logo
  const handleInstitutionLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading("Качване на лого на институцията...", {
        id: "inst-upload",
      });
      const path = `sites/${siteId}/certificates/branding/inst_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const url = await uploadFile(path, file, idToken);
      setInstitutionLogoUrl(url);
      toast.success("Логото на институцията е качено успешно!", {
        id: "inst-upload",
      });
    } catch (err) {
      console.error(err);
      toast.error("Грешка при качване на логото.", { id: "inst-upload" });
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

  // Member selection
  const handleSelectMember = (member: { id: string; name: string }) => {
    setSelectedMemberId(member.id);
    setRecipientName(member.name);
    setMemberSearch("");
    toast.success(`Избран състезател: ${member.name}`);
  };

  // Toggle partner sponsor from list
  const toggleSponsor = (sponsorId: string) => {
    setSelectedSponsorIds((prev) =>
      prev.includes(sponsorId)
        ? prev.filter((id) => id !== sponsorId)
        : [...prev, sponsorId]
    );
  };

  // Dynamically update sessions count & sync with purpose text
  const handleSelectSessions = (num: number) => {
    setTotalSessions(num);
    const sessionWord =
      num === 1 ? "безплатна тренировка" : "безплатни тренировки";
    const defaultSport = isRecoveryZone
      ? "възстановителна процедура"
      : "по бадминтон";

    const leadingSessionRegex = /^\d+\s+безплатн[аи]\s+тренировк[аи]/i;

    if (leadingSessionRegex.test(purpose.trim())) {
      setPurpose(purpose.replace(leadingSessionRegex, `${num} ${sessionWord}`));
    } else if (
      !purpose.trim() ||
      purpose.includes("тренировк") ||
      purpose.includes("тренировки")
    ) {
      setPurpose(`${num} ${sessionWord} ${defaultSport}`);
    } else {
      setPurpose(`${num} ${sessionWord} ${defaultSport} – ${purpose.trim()}`);
    }
  };

  // Execute Issuance
  const handleIssueVoucher = async () => {
    if (!uploadedFile && !remoteFileUrl) {
      toast.error(
        "Моля, качете файл на ваучера / документа (PDF или изображение)!"
      );
      voucherFileInputRef.current?.click();
      return;
    }

    if (!recipientName.trim()) {
      toast.error("Моля, въведете или изберете име на детето / получателя!");
      return;
    }

    if (!purpose.trim()) {
      toast.error("Моля, посочете за какво е ваучерът / документът!");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Upload voucher file if not uploaded yet
      let finalFileUrl = remoteFileUrl;
      if (!finalFileUrl && uploadedFile) {
        toast.loading("Качване на документа в защитено хранилище...", {
          id: "issuing",
        });
        const safeName = uploadedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `sites/${siteId}/certificates/vouchers/${Date.now()}_${safeName}`;
        finalFileUrl = await uploadFile(path, uploadedFile, idToken);
        setRemoteFileUrl(finalFileUrl);
      }

      toast.loading("Генериране на електронен валидатор и QR код...", {
        id: "issuing",
      });

      // 2. Prepare partners logos
      const activeSponsorObjects = sponsors
        .filter((s) => selectedSponsorIds.includes(s.id))
        .map((s) => ({
          name: s.name,
          logoUrl: s.logoUrl,
          websiteUrl: s.websiteUrl,
        }));

      const allPartnerLogos = [
        ...activeSponsorObjects,
        ...additionalPartnerLogos,
      ];

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

      const input: IssueCertificateInput = {
        templateId: "uploaded_voucher",
        type: docType,
        recipient: {
          memberId: selectedMemberId || undefined,
          name: recipientName.trim(),
          institution: recipientInstitution.trim() || undefined,
        },
        details: {
          voucherServiceType: purpose.trim(),
          eventTitle: purpose.trim(),
          totalSessions: docType === "voucher" ? totalSessions || 8 : undefined,
          validUntil: validUntilIso,
        },
        uploadedDocument: {
          fileUrl: finalFileUrl || "",
          fileType,
          fileName: uploadedFile?.name,
          fileSize: uploadedFile?.size,
        },
        branding: {
          clubLogoUrl: clubLogoUrl || defaultClubLogo,
          institutionLogoUrl: institutionLogoUrl || undefined,
          partnerLogos:
            allPartnerLogos.length > 0 ? allPartnerLogos : undefined,
        },
      };

      const issued = await certificateIssuanceService.issueCertificate(
        siteId,
        input
      );

      toast.success(
        `Документ № ${issued.serialNumber} е издаден и валидиран успешно!`,
        { id: "issuing" }
      );

      // Trigger celebration
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {
        // confetti fallback
      }

      setIssuedSuccessCert(issued);
      await onIssuedSuccess();
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
    }
  };

  // Copy Direct Link
  const handleCopyDirectLink = () => {
    if (!issuedSuccessCert) return;
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const url = `${origin}/cert/${issuedSuccessCert.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Директният линк за проверка е копиран в клипборда!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Reset form for next voucher
  const handleResetForNext = () => {
    setUploadedFile(null);
    setFilePreviewUrl(null);
    setRemoteFileUrl(null);
    setRecipientName("");
    setSelectedMemberId(null);
    setIssuedSuccessCert(null);
    if (voucherFileInputRef.current) {
      voucherFileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-200/80 bg-linear-to-br from-blue-900 via-indigo-900 to-zinc-950 p-6 text-white shadow-xl dark:border-blue-900/60 sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3.5 py-1 text-xs font-bold text-blue-200 backdrop-blur-md">
            <Sparkles className="size-3.5 text-amber-300" />
            <span>Нов универсален модул за ваучери и грамоти</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            Качване на готов ваучер с електронна валидация
          </h2>

          <p className="text-xs leading-relaxed text-blue-100/90 sm:text-sm">
            Качете готов дизайн (PDF или снимка), посочете името на детето и
            образователната институция. Системата автоматично издава уникален
            сериен номер, защитен QR код и директен линк с пълна клубна система
            за отчитане на тренировките и присъствията.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-48 size-80 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      {/* 2. Main Issuance Layout: Left Form + Right Live Preview */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Data Entry & Upload (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* STEP 1: Upload Ready Voucher */}
          <Card className="space-y-4 rounded-3xl border-zinc-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Upload className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    1. Качете готов ваучер / документ
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Поддържани формати: PDF, PNG, JPG, WEBP (до 25MB)
                  </p>
                </div>
              </div>

              {uploadedFile && (
                <Badge className="bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <Check className="mr-1 size-3" /> Качен
                </Badge>
              )}
            </div>

            {/* Dropzone */}
            <input
              ref={voucherFileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={handleVoucherFileChange}
              className="hidden"
            />

            {!uploadedFile ? (
              <button
                type="button"
                onClick={() => voucherFileInputRef.current?.click()}
                className="group flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center transition-all hover:border-blue-400 hover:bg-blue-50/40 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-blue-700"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-zinc-400 shadow-sm transition-transform group-hover:scale-110 group-hover:text-blue-600 dark:bg-zinc-900 dark:text-zinc-500">
                  <Upload className="size-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Натиснете за избор на файл или го пуснете тук
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    PDF документ или качествено графично изображение
                  </p>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      {fileType === "pdf" ? (
                        <FileText className="size-6" />
                      ) : (
                        <ImageIcon className="size-6" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-xs font-bold text-zinc-900 dark:text-white">
                        {uploadedFile.name}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                        {fileType === "pdf" ? "PDF Документ" : "Изображение"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => voucherFileInputRef.current?.click()}
                      className="h-8 rounded-xl text-xs"
                    >
                      Смени
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setUploadedFile(null);
                        setFilePreviewUrl(null);
                        setRemoteFileUrl(null);
                        if (voucherFileInputRef.current) {
                          voucherFileInputRef.current.value = "";
                        }
                      }}
                      className="size-8 rounded-xl text-zinc-400 hover:text-red-500"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Live Document Visualizer Box */}
                {previewUrl && (
                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950/5 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center justify-between pb-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <Eye className="size-4 text-blue-600" />
                        Визуализация на документа:
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsDocumentModalOpen(true)}
                          className="h-7 gap-1 rounded-lg text-[11px]"
                        >
                          <Maximize2 className="size-3" />
                          Цял екран
                        </Button>
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-7 items-center gap-1 rounded-lg bg-zinc-100 px-2 text-[11px] font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          <ExternalLink className="size-3" />
                          Нов таб
                        </a>
                      </div>
                    </div>

                    {fileType === "pdf" ? (
                      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-inner dark:border-zinc-800">
                        <iframe
                          src={previewUrl}
                          title="PDF Преглед"
                          className="h-80 w-full border-0"
                        />
                      </div>
                    ) : (
                      <div className="flex max-h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900 p-2 dark:border-zinc-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Качен документ"
                          className="max-h-76 w-auto rounded-lg object-contain shadow-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* STEP 2: Recipient Child & Educational Institution */}
          <Card className="space-y-4 rounded-3xl border-zinc-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <User className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    2. Получател & Образователна институция
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Име на детето / ученика и училище, детска градина или школа
                  </p>
                </div>
              </div>

              {/* Mode switch */}
              <div className="flex items-center rounded-xl bg-zinc-100 p-0.5 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => setRecipientMode("manual")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
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
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    recipientMode === "member"
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-500"
                  }`}
                >
                  От клуба ({members.length})
                </button>
              </div>
            </div>

            {/* Recipient Name Field */}
            {recipientMode === "member" ? (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Изберете състезател / член от клуба
                </Label>
                <Input
                  placeholder="Търсене по име на дете..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="h-9 rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
                />
                <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                  {filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMember(m)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                        selectedMemberId === m.id
                          ? "bg-blue-50 font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                          : "hover:bg-zinc-100 text-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      <span>{m.name}</span>
                      {m.ageGroup && (
                        <span className="text-[10px] text-zinc-400">
                          {m.ageGroup}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Име на детето / получателя{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="напр. Александър Георгиев Иванов"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="h-10 rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
                />
              </div>
            )}

            {/* Educational Institution Field */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Образователна институция / Училище / Детска градина
                </Label>
                <span className="text-[10px] text-zinc-400">
                  Показва се върху документа
                </span>
              </div>
              <Input
                placeholder="напр. СУ „Христо Ботев“, гр. Гълъбово"
                value={recipientInstitution}
                onChange={(e) => setRecipientInstitution(e.target.value)}
                className="h-10 rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
              />

              {/* Quick Preset Buttons for Institutions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {PRESET_INSTITUTIONS.map((inst) => (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setRecipientInstitution(inst)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                  >
                    {inst}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* STEP 3: Document Purpose & Attendance Details */}
          <Card className="space-y-4 rounded-3xl border-zinc-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
                <Ticket className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  3. За какво е този ваучер / документ
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Услуга, брой безплатни тренировки и срок за ползване
                </p>
              </div>
            </div>

            {/* Document Type Selector */}
            <div className="grid grid-cols-3 gap-2">
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
                  className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all ${
                    docType === t.id
                      ? "border-blue-600 bg-blue-50/60 font-bold text-blue-900 shadow-xs dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200"
                      : "border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                  }`}
                >
                  <span className="text-xs font-bold">{t.label}</span>
                  <span className="text-[10px] text-zinc-400">{t.desc}</span>
                </button>
              ))}
            </div>

            {/* Purpose input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                За какво е предназначен (Описание на услугата / Отличието){" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="напр. 8 безплатни тренировки по бадминтон"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="h-10 rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
              />

              {/* Quick Preset Buttons for Purposes */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {presetPurposes.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPurpose(p)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-400">
                💡 Текстът се обновява автоматично спрямо броя тренировки, като
                можете свободно да допишете допълнителен текст (напр. повод,
                награда или училище).
              </p>
            </div>

            {/* Attendance & Session settings (If Voucher) */}
            {docType === "voucher" && (
              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Брой безплатни тренировки
                    </Label>
                    <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                      {totalSessions}{" "}
                      {totalSessions === 1 ? "тренировка" : "тренировки"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[1, 2, 4, 8, 10, 12, 14].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSelectSessions(num)}
                        className={`min-w-8 flex-1 rounded-xl border py-1.5 text-xs font-bold transition-all ${
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

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Срок на валидност
                    </Label>
                    <span className="text-[10px] font-bold text-zinc-500">
                      {validityMode === "custom_date"
                        ? `до ${new Date(customExpiryDate).toLocaleDateString("bg-BG")}`
                        : validityMode === "30"
                          ? "30 дни (1 месец)"
                          : "60 дни (2 месеца)"}
                    </span>
                  </div>

                  {/* 3 Quick Options: 30 days, 60 days, exact date */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setValidityMode("30")}
                      className={`rounded-xl border py-2 text-center text-xs font-bold transition-all ${
                        validityMode === "30"
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs dark:bg-blue-950/60 dark:text-blue-300"
                          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                      }`}
                    >
                      30 дни (1 м.)
                    </button>
                    <button
                      type="button"
                      onClick={() => setValidityMode("60")}
                      className={`rounded-xl border py-2 text-center text-xs font-bold transition-all ${
                        validityMode === "60"
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs dark:bg-blue-950/60 dark:text-blue-300"
                          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                      }`}
                    >
                      60 дни (2 м.)
                    </button>
                    <button
                      type="button"
                      onClick={() => setValidityMode("custom_date")}
                      className={`rounded-xl border py-2 text-center text-xs font-bold transition-all ${
                        validityMode === "custom_date"
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs dark:bg-blue-950/60 dark:text-blue-300"
                          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                      }`}
                    >
                      📅 Точна дата
                    </button>
                  </div>

                  {/* Date Picker if custom_date is selected */}
                  {validityMode === "custom_date" && (
                    <div className="pt-1.5">
                      <Input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={customExpiryDate}
                        onChange={(e) => setCustomExpiryDate(e.target.value)}
                        className="h-9 rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* STEP 4: Logos & Branding (Club, Institution, Partners) */}
          <Card className="space-y-5 rounded-3xl border-zinc-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                <Handshake className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  4. Логота и институционално брандиране
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Лого на клуба, герб на институцията и спонсори / партньори
                </p>
              </div>
            </div>

            {/* 3 Columns for 3 Types of Logos */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Club Logo */}
              <div className="space-y-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  🛡️ Лого на клуба
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white p-1 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <Image
                      src={clubLogoUrl}
                      alt="Club Logo"
                      width={44}
                      height={44}
                      className="size-full object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="space-y-1">
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
                      className="h-7 rounded-lg text-[11px]"
                    >
                      Качи друго
                    </Button>
                    <p className="text-[10px] text-zinc-400">
                      {isRecoveryZone ? "Recovery Zone" : "БК Гълъбово 2025"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Educational Institution Logo */}
              <div className="space-y-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  🏛️ Герб / Лого на институцията
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white p-1 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    {institutionLogoUrl ? (
                      <Image
                        src={institutionLogoUrl}
                        alt="Institution Logo"
                        width={44}
                        height={44}
                        className="size-full object-contain"
                        unoptimized
                      />
                    ) : (
                      <School className="size-6 text-zinc-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      ref={institutionLogoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleInstitutionLogoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => institutionLogoInputRef.current?.click()}
                        className="h-7 rounded-lg text-[11px]"
                      >
                        {institutionLogoUrl ? "Смени лого" : "Качи лого"}
                      </Button>
                      {institutionLogoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setInstitutionLogoUrl(null)}
                          className="h-7 px-2 text-[11px] text-zinc-400 hover:text-red-500"
                        >
                          Премахни
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Училище или община
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Partners & Sponsors Checklist */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  🤝 Партньори и Спонсори (включени във ваучера)
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
                  <Plus className="mr-1 size-3" /> Добави ново партньорско лого
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {sponsors.map((s) => {
                  const isChecked = selectedSponsorIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSponsor(s.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                        isChecked
                          ? "border-blue-500 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-950/40"
                          : "border-zinc-200 bg-white opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
                      }`}
                    >
                      <div className="relative size-6 shrink-0 rounded-md bg-white p-0.5 shadow-xs">
                        <Image
                          src={s.logoUrl}
                          alt={s.name}
                          width={24}
                          height={24}
                          className="size-full object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="line-clamp-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        {s.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Render custom additional logos */}
              {additionalPartnerLogos.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {additionalPartnerLogos.map((pl, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="gap-1.5 rounded-xl border-purple-300 bg-purple-50 py-1 text-xs text-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
                    >
                      <Image
                        src={pl.logoUrl}
                        alt="p"
                        width={14}
                        height={14}
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

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleIssueVoucher}
              className="h-14 w-full rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-1.01 hover:from-blue-700 hover:to-indigo-800"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  Генериране и валидиране на документа...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 size-5" />
                  Издай и валидирай документ
                </>
              )}
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Electronic Card (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                Електронен преглед в реално време
              </span>
              <Badge
                variant="outline"
                className="rounded-lg border-emerald-300 bg-emerald-50 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                ● Live Verification
              </Badge>
            </div>

            {/* Electronic Voucher Pass Card */}
            <Card className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-linear-to-b from-white to-zinc-50/80 p-6 shadow-xl dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
              {/* Header Logos Row */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-xs dark:border-zinc-800">
                    <Image
                      src={clubLogoUrl}
                      alt="Club"
                      width={36}
                      height={36}
                      className="size-full object-contain"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-900 dark:text-white">
                      {isRecoveryZone ? "Recovery Zone by ZM" : "БК Гълъбово"}
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      Официален клубен издател
                    </p>
                  </div>
                </div>

                {institutionLogoUrl && (
                  <div className="relative size-9 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-xs dark:border-zinc-800">
                    <Image
                      src={institutionLogoUrl}
                      alt="Inst"
                      width={32}
                      height={32}
                      className="size-full object-contain"
                      unoptimized
                      onError={() => setInstitutionLogoUrl(null)}
                    />
                  </div>
                )}
              </div>

              {/* Main Voucher Info */}
              <div className="space-y-4 py-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                    {docType === "voucher"
                      ? "Клубен Ваучер"
                      : docType === "award"
                        ? "Официална Грамота"
                        : "Клубен Сертификат"}
                  </span>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                    {recipientName || "Име на детето..."}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {recipientInstitution || "Образователна институция"}
                  </p>
                </div>

                {/* Purpose Badge */}
                <div className="rounded-2xl border border-amber-200/80 bg-linear-to-r from-amber-50 to-orange-50/60 p-3.5 dark:border-amber-900/60 dark:from-amber-950/40 dark:to-zinc-900">
                  <div className="flex items-center gap-2">
                    <Ticket className="size-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      {purpose || "Цел на ваучера..."}
                    </span>
                  </div>

                  {docType === "voucher" && (
                    <div className="mt-2.5 flex items-center justify-between border-t border-amber-200/60 pt-2 text-[11px] text-amber-900 dark:border-amber-900/50 dark:text-amber-300">
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
                              ? "30 дни (1 месец)"
                              : "60 дни (2 месеца)"}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Document Thumbnail / Live Preview */}
                {previewUrl ? (
                  <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-100/50 p-2 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center justify-between px-2 pt-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <FileCheck className="size-3.5 text-emerald-600" />
                        Визуализация на документа:
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDocumentModalOpen(true)}
                        className="h-6 gap-1 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700"
                      >
                        <Maximize2 className="size-3" />
                        Цял екран
                      </Button>
                    </div>

                    {fileType === "image" ? (
                      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800">
                        <Image
                          src={previewUrl}
                          alt="Voucher Preview"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-inner dark:border-zinc-800">
                        <iframe
                          src={`${previewUrl}#toolbar=0`}
                          title="PDF Preview"
                          className="h-64 w-full border-0"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between px-1 text-[10px] text-zinc-500">
                      <span className="truncate">
                        {uploadedFile?.name || "Дигитален ваучер"}
                      </span>
                      {uploadedFile?.size ? (
                        <span>
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-24 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/30">
                    <Upload className="mb-1 size-5 opacity-40" />
                    <span>Все още не е качен файл</span>
                  </div>
                )}

                {/* Electronic QR Code Watermark */}
                <div className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-950">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">
                      Електронна валидация
                    </div>
                    <div className="font-mono text-xs font-black text-zinc-800 dark:text-zinc-200">
                      {isRecoveryZone ? "RZ-2026-XXXX" : "BKG-2026-XXXX"}
                    </div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      ✓ Автоматичен QR & присъствен дневник
                    </p>
                  </div>

                  <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white p-1 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <QrCode className="size-full text-zinc-800 dark:text-zinc-200" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* 3. Post-Issue Celebratory Modal */}
      {issuedSuccessCert && (
        <Dialog
          open={!!issuedSuccessCert}
          onOpenChange={(open) => {
            if (!open) setIssuedSuccessCert(null);
          }}
        >
          <DialogContent className="max-w-md rounded-3xl border-zinc-200 p-6 dark:border-zinc-800">
            <DialogHeader className="text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-md shadow-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2 className="size-8" />
              </div>
              <DialogTitle className="mt-3 text-xl font-black text-zinc-900 dark:text-white">
                Документът е издаден успешно!
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Заверен с електронен сериен номер и активен за отчитане на
                тренировките
              </DialogDescription>
            </DialogHeader>

            {/* Serial & QR card */}
            <div className="space-y-4 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-zinc-400 uppercase">
                  Сериен номер на документа
                </div>
                <div className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">
                  {issuedSuccessCert.serialNumber}
                </div>
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {issuedSuccessCert.recipient.name}
                </div>
              </div>

              {/* QR Image */}
              {issuedSuccessCert.qrCodeDataUrl && (
                <div className="flex justify-center">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-xs dark:border-zinc-800">
                    <Image
                      src={issuedSuccessCert.qrCodeDataUrl}
                      alt="Verification QR"
                      width={140}
                      height={140}
                      className="size-36 object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Direct Verification Link Box */}
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900">
                <input
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/cert/${issuedSuccessCert.id}`
                      : `/cert/${issuedSuccessCert.id}`
                  }
                  className="w-full bg-transparent px-2 font-mono text-[11px] text-zinc-600 outline-none dark:text-zinc-300"
                />
                <Button
                  size="sm"
                  onClick={handleCopyDirectLink}
                  className="h-8 shrink-0 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
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
            <div className="flex items-center justify-center gap-2 pt-1">
              <a
                href={`viber://forward?text=${encodeURIComponent(
                  `Официален ваучер № ${issuedSuccessCert.serialNumber} за ${issuedSuccessCert.recipient.name}: ` +
                    (typeof window !== "undefined"
                      ? `${window.location.origin}/cert/${issuedSuccessCert.id}`
                      : "")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-purple-50 px-3 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300"
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
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                <span>💬 WhatsApp</span>
              </a>

              <a
                href={`/cert/${issuedSuccessCert.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-zinc-100 px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <ExternalLink className="size-3" />
                <span>Отвори страницата</span>
              </a>
            </div>

            <DialogFooter className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={handleResetForNext}
                className="rounded-xl text-xs font-bold"
              >
                <Plus className="mr-1.5 size-3.5" />
                Издай следващ ваучер
              </Button>

              <Button
                onClick={() => {
                  setIssuedSuccessCert(null);
                  onSwitchToRegistry();
                }}
                className="rounded-xl bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Към регистъра на издадените
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 4. Fullscreen Document View Modal */}
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
