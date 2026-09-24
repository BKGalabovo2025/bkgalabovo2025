"use client";

import {
  Check,
  Copy,
  Download,
  GraduationCap,
  Loader2,
  Medal,
  MessageCircle,
  QrCode,
  Share2,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FacebookIcon, InstagramIcon } from "@/components/icons/social-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CardFormat,
  generateAthleteCardBlob,
  TeamMemberForCard,
} from "@/lib/athlete-card-generator";

interface ShareAthleteDialogProps {
  member: TeamMemberForCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function getValidImageSrc(src: string | undefined | null) {
  if (!src) return "";
  let cleanSrc = src.replace(/\\/g, "/");
  if (cleanSrc.startsWith("public/")) cleanSrc = cleanSrc.substring(6);
  if (cleanSrc.startsWith("/public/")) cleanSrc = cleanSrc.substring(7);
  if (
    cleanSrc.startsWith("http://") ||
    cleanSrc.startsWith("https://") ||
    cleanSrc.startsWith("/")
  )
    return cleanSrc;
  return `/${cleanSrc}`;
}

export function ShareAthleteDialog({
  member,
  open,
  onOpenChange,
}: ShareAthleteDialogProps) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const memberQuery = member ? `?athlete=${member.id}` : "";
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://bkgalabovo2025.vercel.app";
  const shareUrl = `${baseUrl}/club/team${memberQuery}`;

  // Generate QR code when member changes
  useEffect(() => {
    if (!member) {
      setQrCodeDataUrl("");
      return;
    }

    let isMounted = true;
    QRCode.toDataURL(shareUrl, {
      margin: 1,
      width: 180,
      color: {
        dark: "#090d16",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (isMounted) setQrCodeDataUrl(url);
      })
      .catch((err) => {
        console.warn("Failed to generate QR code:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [member, shareUrl]);

  if (!member) return null;

  const isCompetitor =
    member.skillLevel === "advanced" || member.skillLevel === "professional";
  const levelText = isCompetitor ? "Състезател" : "Любител";
  const ageGroup = member.ageGroupDisplay || "Мъже/Жени";
  const tournaments = member.tournaments || [];

  const shareTitle = `Дигитална карта на ${member.name} | БК Гълъбово`;
  const shareText = `Вижте профила и турнирните участия на ${member.name} (${levelText}, ${ageGroup}) в СНЦ Бадминтон Клуб Гълъбово! 🏸🏆`;

  // 1. Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Връзката към профила е копирана!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Неуспешно копиране на връзката");
    }
  };

  // 2. Facebook Share
  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(fbUrl, "_blank", "width=600,height=500,noopener,noreferrer");
  };

  // 3. Viber Share
  const handleShareViber = () => {
    const viberUrl = `viber://forward?text=${encodeURIComponent(
      `${shareText}\n${shareUrl}`
    )}`;
    window.open(viberUrl, "_blank");
  };

  // 4. WhatsApp Share
  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText} ${shareUrl}`
    )}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  // 5. Download Branded Card for Instagram (Story / Post)
  const handleDownloadCard = async (format: CardFormat) => {
    const isStory = format === "story";
    if (isStory) setIsGeneratingStory(true);
    else setIsGeneratingPost(true);

    try {
      const blob = await generateAthleteCardBlob(member, format);
      const filename = `kartichka-${member.firstName || "athlete"}-${
        member.lastName || ""
      }-${format}.png`
        .toLowerCase()
        .replace(/\s+/g, "-");

      // Check if mobile device supports native file share directly into Instagram/apps
      const file = new File([blob], filename, { type: "image/png" });
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: shareTitle,
            text: shareText,
          });
          toast.success("Картичката е готова за споделяне!");
          return;
        } catch (shareErr) {
          // If user cancelled or failed, fall back to file download
          if ((shareErr as Error)?.name !== "AbortError") {
            console.warn("Native file share fallback to download:", shareErr);
          }
        }
      }

      // Download file to device
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast.success(
        isStory
          ? "Картичката за Instagram Story е свалена с Ultra-HD качество!"
          : "Картичката за Instagram Post е свалена с Ultra-HD качество!"
      );
    } catch (err) {
      console.error("Error generating athlete card:", err);
      toast.error("Възникна грешка при генерирането на картичката.");
    } finally {
      setIsGeneratingStory(false);
      setIsGeneratingPost(false);
    }
  };

  // 6. Generic Mobile Share
  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          toast.error("Неуспешно споделяне");
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto border-blue-500/20 bg-zinc-950 p-6 text-white shadow-2xl backdrop-blur-2xl sm:p-8 dark:border-blue-500/20 dark:bg-zinc-950">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-blue-400 uppercase">
            <Share2 className="size-4" />
            <span>Официална карта за споделяне</span>
          </div>
          <DialogTitle className="text-2xl font-light text-white">
            Сподели{" "}
            <span className="font-semibold text-blue-400">{member.name}</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-400">
            Изтеглете или споделете профила на състезателя във Facebook,
            Instagram, Viber или WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {/* 🏸 Digital Card Preview */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-linear-to-b from-blue-950/40 via-zinc-900/60 to-black p-6 shadow-[0_0_40px_rgba(30,58,138,0.2)]">
          <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 size-48 rounded-full bg-blue-600/10 blur-3xl" />

          {/* Card Top Brand */}
          <div className="relative mb-5 flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative size-10 overflow-hidden rounded-xl border border-blue-500/30 bg-blue-950/60 p-1">
                <Image
                  src="/icons/badge-option-3-light-squircle.png"
                  alt="БК Гълъбово"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div>
                <p className="text-xs font-bold tracking-wider text-white uppercase">
                  БК Гълъбово
                </p>
                <p className="text-[10px] tracking-widest text-blue-400 uppercase">
                  Школа за шампиони
                </p>
              </div>
            </div>

            <div className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-300">
              {ageGroup}
            </div>
          </div>

          {/* Athlete Avatar & Main Details */}
          <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="relative size-28 shrink-0 overflow-hidden rounded-2xl border-2 border-blue-500/40 bg-zinc-900 shadow-xl shadow-blue-950/50 sm:size-32">
              {member.avatarUrl ? (
                <Image
                  src={getValidImageSrc(member.avatarUrl)}
                  alt={member.name}
                  fill
                  unoptimized
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-zinc-900 text-zinc-700">
                  <UserIcon className="size-14" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-white">
                {member.name}
              </h3>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    isCompetitor
                      ? "border border-blue-500/30 bg-blue-500/20 text-blue-300"
                      : "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  <Medal className="size-3.5" />
                  {levelText}
                </span>

                <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs text-zinc-300">
                  Група: {ageGroup}
                </span>
              </div>

              {/* School / Kindergarten */}
              {member.educationInstitution && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 sm:justify-start">
                  <GraduationCap className="size-4 shrink-0 text-blue-400" />
                  <span className="font-medium text-zinc-300">
                    {member.educationInstitution}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tournaments List Section */}
          <div className="mt-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-blue-400 uppercase">
                <Trophy className="size-3.5" />
                Участия в Турнири ({tournaments.length})
              </p>
              {tournaments.length > 0 && (
                <span className="text-[11px] text-zinc-500">Пълен списък</span>
              )}
            </div>

            {tournaments.length === 0 ? (
              <p className="py-2 text-center text-xs text-zinc-500 italic">
                В момента състезателят се подготвя за предстоящи турнири.
              </p>
            ) : (
              <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                {tournaments.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg bg-zinc-900/50 px-2.5 py-1.5 text-xs text-zinc-300"
                  >
                    <span className="size-1.5 rounded-full bg-blue-500" />
                    <span className="truncate">{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live QR Code preview */}
          {qrCodeDataUrl && (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-950/20 p-3">
              <div className="flex items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-white p-1">
                  <Image
                    src={qrCodeDataUrl}
                    alt="QR Код"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">
                    Директен достъп до профила
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Сканирайте с телефон за пълни данни
                  </p>
                </div>
              </div>
              <QrCode className="size-5 text-blue-400" />
            </div>
          )}
        </div>

        {/* 📲 Social Share Actions */}
        <div className="space-y-4 pt-2">
          <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
            Изберете платформа за споделяне
          </p>

          {/* Main 1-Click Platforms */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Facebook */}
            <button
              onClick={handleShareFacebook}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-blue-600/30 bg-blue-600/10 p-3.5 text-blue-400 transition-all hover:bg-blue-600/20 hover:text-white"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                <FacebookIcon size={20} />
              </div>
              <span className="text-xs font-semibold">Facebook</span>
            </button>

            {/* Instagram Story HD */}
            <button
              onClick={() => handleDownloadCard("story")}
              disabled={isGeneratingStory}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-pink-500/30 bg-pink-500/10 p-3.5 text-pink-400 transition-all hover:bg-pink-500/20 hover:text-white disabled:opacity-50"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-tr from-amber-500 via-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/30">
                {isGeneratingStory ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <InstagramIcon size={20} />
                )}
              </div>
              <span className="text-xs font-semibold">IG Story</span>
            </button>

            {/* Viber */}
            <button
              onClick={handleShareViber}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-purple-600/30 bg-purple-600/10 p-3.5 text-purple-400 transition-all hover:bg-purple-600/20 hover:text-white"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30">
                <MessageCircle className="size-5" />
              </div>
              <span className="text-xs font-semibold">Viber</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-emerald-600/30 bg-emerald-600/10 p-3.5 text-emerald-400 transition-all hover:bg-emerald-600/20 hover:text-white"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                <MessageCircle className="size-5" />
              </div>
              <span className="text-xs font-semibold">WhatsApp</span>
            </button>
          </div>

          {/* Secondary Actions: Instagram Post & Copy Link */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => handleDownloadCard("square")}
              disabled={isGeneratingPost}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs font-medium text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
            >
              {isGeneratingPost ? (
                <Loader2 className="size-4 animate-spin text-pink-400" />
              ) : (
                <Download className="size-4 text-pink-400" />
              )}
              <span>Свали за IG Пост (1:1 HD)</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs font-medium text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-800"
            >
              {copied ? (
                <Check className="size-4 text-emerald-400" />
              ) : (
                <Copy className="size-4 text-blue-400" />
              )}
              <span>
                {copied ? "Копирано в клипборда!" : "Копирай директен линк"}
              </span>
            </button>
          </div>

          {/* Native Mobile Share Button */}
          <button
            onClick={handleNativeShare}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:from-blue-500 hover:to-blue-400 active:scale-95"
          >
            <Share2 className="size-4" />
            <span>Сподели през мобилно устройство</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
