"use client";

import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TeamMemberForCard } from "@/lib/athlete-card-generator";

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

  if (!member) return null;

  const profilePath = `/club/team?athlete=${member.id}`;
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://bkgalabovo2025.vercel.app";
  const shareUrl = `${baseUrl}${profilePath}`;

  const athleteName =
    member.name?.trim() ||
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    "Състезател";

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
        if (!success) {
          throw new Error("Copy command failed");
        }
      }
      setCopied(true);
      toast.success("Линкът е копиран!");
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
      <DialogContent className="flex w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl sm:max-w-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-white [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 [&>button:last-child]:rounded-full [&>button:last-child]:p-1.5 [&>button:last-child]:text-slate-500 [&>button:last-child]:hover:bg-slate-100 [&>button:last-child]:hover:text-slate-900 dark:[&>button:last-child]:text-zinc-400 dark:[&>button:last-child]:hover:bg-zinc-800 dark:[&>button:last-child]:hover:text-white">
        <DialogHeader className="border-b border-slate-200 bg-slate-50/80 px-4 py-3.5 pr-12 text-left dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
            <Share2 className="size-3.5" />
            <span>Споделяне на профил</span>
          </div>
          <DialogTitle className="mt-0.5 text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-white">
            {athleteName}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
            Копирайте директния линк или го споделете
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 p-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs break-all text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {shareUrl}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              <span>{copied ? "Копирано" : "Копирай линк"}</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Share2 className="size-3.5" />
              <span>Сподели</span>
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
      </DialogContent>
    </Dialog>
  );
}
