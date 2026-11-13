"use client";

import {
  Check,
  Copy,
  Download,
  ExternalLink,
  GraduationCap,
  Loader2,
  Medal,
  MessageCircle,
  Share2,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
  ) {
    return cleanSrc;
  }
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

  const profilePath = member ? `/club/team?athlete=${member.id}` : "/club/team";
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://bkgalabovo2025.vercel.app";
  const shareUrl = `${baseUrl}${profilePath}`;

  useEffect(() => {
    if (!member) {
      setQrCodeDataUrl("");
      return;
    }

    let isMounted = true;
    QRCode.toDataURL(shareUrl, {
      margin: 1,
      width: 160,
      color: {
        dark: "#0f172a",
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

  const athleteName =
    member.name?.trim() ||
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    "Състезател";

  const shareTitle = `${athleteName} | Бадминтон клуб Гълъбово`;
  const shareText = `Профил и турнирни участия на ${athleteName} (${levelText}, ${ageGroup}) в БК Гълъбово`;

  const copyToClipboard = async (silent = false) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!success) {
          throw new Error("Copy command failed");
        }
      }
      setCopied(true);
      if (!silent) {
        toast.success("Връзката към профила е копирана!");
      }
      setTimeout(() => setCopied(false), 2500);
      return true;
    } catch {
      if (!silent) {
        toast.error("Неуспешно копиране на връзката.");
      }
      return false;
    }
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(fbUrl, "_blank", "width=600,height=500,noopener,noreferrer");
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText} ${shareUrl}`
    )}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleShareViber = async () => {
    await copyToClipboard(true);
    const viberUrl = `viber://forward?text=${encodeURIComponent(
      `${shareText}\n${shareUrl}`
    )}`;
    window.open(viberUrl, "_blank", "noopener,noreferrer");
    toast.success("Връзката е копирана и готова за Viber.");
  };

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
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  };

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
          if ((shareErr as Error)?.name !== "AbortError") {
            console.warn("Native file share fallback to download:", shareErr);
          }
        }
      }

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
          ? "Картичката за IG Story (9:16) е изтеглена!"
          : "Картичката за IG Пост (1:1) е изтеглена!"
      );
    } catch (err) {
      console.error("Error generating athlete card:", err);
      toast.error("Грешка при генерирането на картичката.");
    } finally {
      setIsGeneratingStory(false);
      setIsGeneratingPost(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl sm:max-w-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-white [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 [&>button:last-child]:rounded-full [&>button:last-child]:p-1.5 [&>button:last-child]:text-slate-500 [&>button:last-child]:hover:bg-slate-100 [&>button:last-child]:hover:text-slate-900 dark:[&>button:last-child]:text-zinc-400 dark:[&>button:last-child]:hover:bg-zinc-800 dark:[&>button:last-child]:hover:text-white">
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-5 py-4 pr-12 text-left dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
            <Share2 className="size-3.5" />
            <span>Споделяне на профил</span>
          </div>
          <DialogTitle className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {athleteName}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
            Директен публичен URL и брандирана картичка на състезателя
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
          {/* 1. Compact Profile Summary + QR */}
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800">
              {member.avatarUrl ? (
                <Image
                  src={getValidImageSrc(member.avatarUrl)}
                  alt={athleteName}
                  fill
                  unoptimized
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-slate-400 dark:text-zinc-500">
                  <UserIcon className="size-7" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    isCompetitor
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                  }`}
                >
                  <Medal className="size-3" />
                  {levelText}
                </span>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {ageGroup}
                </span>
              </div>

              {member.educationInstitution && (
                <p className="flex items-center gap-1.5 truncate text-xs text-slate-600 dark:text-zinc-400">
                  <GraduationCap className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span className="truncate">
                    {member.educationInstitution}
                  </span>
                </p>
              )}
            </div>

            {qrCodeDataUrl && (
              <div
                className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xs dark:border-zinc-700"
                title="QR код към профила"
              >
                <Image
                  src={qrCodeDataUrl}
                  alt="QR код"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {/* 2. Tournaments Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                <Trophy className="size-3.5" />
                <span>Участия в Турнири ({tournaments.length})</span>
              </p>
            </div>
            {tournaments.length === 0 ? (
              <p className="text-xs text-slate-500 italic dark:text-zinc-500">
                Предстоящи участия в турнири.
              </p>
            ) : (
              <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
                {tournaments.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
                    <span className="leading-snug wrap-break-word">{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Direct URL Bar */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
              Директен URL адрес
            </p>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                {profilePath}
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(false)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>{copied ? "Копирано" : "Копирай директен линк"}</span>
              </button>
              <Link
                href={profilePath}
                onClick={() => onOpenChange(false)}
                title="Отвори URL страницата"
                className="inline-flex size-8.5 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* 4. Share & Download Actions */}
          <div className="space-y-2.5 border-t border-slate-200 pt-3 dark:border-zinc-800">
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleShareFacebook}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-slate-700 transition-colors hover:border-blue-500/40 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
              >
                <FacebookIcon size={18} />
                <span className="text-[11px] font-semibold">Facebook</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-slate-700 transition-colors hover:border-emerald-500/40 hover:bg-emerald-50 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
              >
                <MessageCircle className="size-4.5" />
                <span className="text-[11px] font-semibold">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleShareViber}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-slate-700 transition-colors hover:border-purple-500/40 hover:bg-purple-50 hover:text-purple-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-purple-950/40 dark:hover:text-purple-300"
              >
                <MessageCircle className="size-4.5" />
                <span className="text-[11px] font-semibold">Viber</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Share2 className="size-4.5" />
                <span className="text-[11px] font-semibold">Още</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDownloadCard("story")}
                disabled={isGeneratingStory}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {isGeneratingStory ? (
                  <Loader2 className="size-3.5 animate-spin text-pink-500" />
                ) : (
                  <InstagramIcon size={14} />
                )}
                <span>IG Story (9:16)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadCard("square")}
                disabled={isGeneratingPost}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {isGeneratingPost ? (
                  <Loader2 className="size-3.5 animate-spin text-pink-500" />
                ) : (
                  <Download className="size-3.5 text-pink-500" />
                )}
                <span>IG Пост (1:1)</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
