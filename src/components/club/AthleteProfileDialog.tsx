"use client";

import {
  Check,
  Copy,
  GraduationCap,
  MapPin,
  Share2,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { getValidImageSrc } from "@/components/club/ShareAthleteDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TeamMemberForCard } from "@/lib/athlete-card-generator";

interface AthleteProfileDialogProps {
  member: TeamMemberForCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AthleteProfileDialog({
  member,
  open,
  onOpenChange,
}: AthleteProfileDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!member) return null;

  const isCompetitor =
    member.skillLevel === "advanced" || member.skillLevel === "professional";
  const levelText = isCompetitor ? "Състезател" : "Любител";
  const ageGroup = member.ageGroupDisplay || "Мъже/Жени";
  const tournaments = member.tournaments || [];
  const validAvatar = getValidImageSrc(member.avatarUrl);

  const athleteName =
    member.name?.trim() ||
    [member.firstName, member.middleName, member.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Състезател";

  const profilePath = `/club/team?athlete=${member.id}`;
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://bkgalabovo2025.vercel.app";
  const shareUrl = `${baseUrl}${profilePath}`;

  const copyToClipboard = async () => {
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
        if (!success) throw new Error("Copy failed");
      }
      setCopied(true);
      toast.success("Линкът към профила е копиран!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Неуспешно копиране на линка.");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${athleteName} | БК Гълъбово`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    await copyToClipboard();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl sm:max-w-3xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-white [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 [&>button:last-child]:z-20 [&>button:last-child]:rounded-full [&>button:last-child]:bg-white/80 [&>button:last-child]:p-1.5 [&>button:last-child]:text-slate-700 [&>button:last-child]:backdrop-blur-md [&>button:last-child]:hover:bg-slate-200 dark:[&>button:last-child]:bg-black/60 dark:[&>button:last-child]:text-zinc-200 dark:[&>button:last-child]:hover:bg-zinc-800">
        <div className="grid max-h-[90dvh] grid-cols-1 overflow-y-auto md:grid-cols-2 md:overflow-hidden">
          {/* Left: Full uncropped photo */}
          <div className="relative flex min-h-64 items-center justify-center bg-slate-100 p-3 sm:min-h-80 md:min-h-105 dark:bg-zinc-900">
            {validAvatar ? (
              <div className="relative h-72 w-full sm:h-88 md:h-full md:min-h-100">
                <Image
                  src={validAvatar}
                  alt={athleteName}
                  fill
                  unoptimized={
                    validAvatar.startsWith("data:") ||
                    validAvatar.includes("/api/upload")
                  }
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="rounded-xl object-contain"
                />
              </div>
            ) : (
              <div className="flex size-32 items-center justify-center rounded-2xl bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600">
                <UserIcon className="size-16" />
              </div>
            )}
          </div>

          {/* Right: Full Athlete Details */}
          <div className="flex flex-col justify-between p-5 sm:p-6 md:max-h-[90dvh] md:overflow-y-auto">
            <div className="space-y-4">
              <DialogHeader className="pr-8 text-left">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase ${
                      isCompetitor
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    }`}
                  >
                    {levelText}
                  </span>
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {ageGroup}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                  {athleteName}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Пълен профил и участия в турнири на {athleteName}
                </DialogDescription>
              </DialogHeader>

              {member.educationInstitution && (
                <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
                  <GraduationCap className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span className="leading-snug font-medium">
                    {member.educationInstitution}
                  </span>
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    Състезания и турнири
                  </span>
                  <span className="text-slate-500 dark:text-zinc-400">
                    {tournaments.length}
                  </span>
                </div>

                {tournaments.length === 0 ? (
                  <p className="text-sm text-slate-500 italic dark:text-zinc-500">
                    В подготовка за турнири
                  </p>
                ) : (
                  <ul className="custom-scrollbar max-h-56 space-y-2 overflow-y-auto pr-1">
                    {tournaments.map((t, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:text-sm dark:bg-zinc-900 dark:text-zinc-300"
                      >
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span className="leading-snug wrap-break-word">
                          {t}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Footer Share Actions */}
            <div className="mt-5 flex items-center gap-2 border-t border-slate-200 pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>{copied ? "Линкът е копиран" : "Копирай линк"}</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Share2 className="size-3.5" />
                <span>Сподели</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
