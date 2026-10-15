"use client";

import {
  Check,
  Copy,
  ExternalLink,
  Mail,
  MessageCircle,
  Share2,
  Smartphone,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getCertificateShareLinks,
  shareCertificateViaWeb,
} from "@/lib/certificate-export-helpers";
import { IssuedCertificate } from "@/types/certificates";

interface ShareCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: IssuedCertificate | null;
}

export function ShareCertificateDialog({
  open,
  onOpenChange,
  certificate,
}: ShareCertificateDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!certificate) return null;

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://bkgalabovo2025.vercel.app";
  const verificationUrl = `${origin}/cert/${certificate.id}`;

  const shareData = {
    recipientName: certificate.recipient.name,
    serialNumber: certificate.serialNumber,
    title: certificate.visualSnapshot?.templateTitle || "Официален сертификат",
    verificationUrl,
  };

  const links = getCertificateShareLinks(shareData);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    toast.success("Линкът за верификация е копиран!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWebShare = async () => {
    const success = await shareCertificateViaWeb(shareData);
    if (success) {
      toast.success("Споделено успешно!");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-md flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:right-4">
        {/* Fixed Sticky Header */}
        <div className="shrink-0 border-b border-zinc-100 bg-zinc-50/50 p-4 sm:p-5 pr-12 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
              <Share2 className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white line-clamp-1">
                Дигитално споделяне
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 truncate">
                № {certificate.serialNumber} • {certificate.recipient.name}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 min-h-0">
          {/* Recipient summary card */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              {shareData.title}
            </p>
            <p className="text-sm font-black text-zinc-900 dark:text-white">
              {certificate.recipient.name}
            </p>
            {certificate.recipient.institution && (
              <p className="text-xs text-zinc-500">
                {certificate.recipient.institution}
              </p>
            )}
          </div>

          {/* Quick Copy Link Box */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Линк за публична верификация & преглед:
            </span>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={verificationUrl}
                className="h-10 flex-1 truncate rounded-xl border border-zinc-200 bg-white px-3 font-mono text-xs text-zinc-700 select-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="h-10 shrink-0 rounded-xl border-zinc-200 px-3 text-xs font-bold dark:border-zinc-800"
              >
                {copied ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied ? "Копирано" : "Копирай"}
              </Button>
            </div>
          </div>

          {/* Social and Messaging Channels */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Директно изпращане до родители / състезател:
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Viber */}
              <a
                href={links.viberUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-purple-50/80 p-3 text-xs font-bold text-purple-700 transition-all hover:bg-purple-100 hover:shadow-xs dark:border-purple-900/40 dark:bg-purple-950/40 dark:text-purple-300"
              >
                <Smartphone className="size-4 text-purple-600" />
                <span>Viber</span>
              </a>

              {/* WhatsApp */}
              <a
                href={links.whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100 hover:shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <MessageCircle className="size-4 text-emerald-600" />
                <span>WhatsApp</span>
              </a>

              {/* Email */}
              <a
                href={links.emailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50/80 p-3 text-xs font-bold text-blue-700 transition-all hover:bg-blue-100 hover:shadow-xs dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300"
              >
                <Mail className="size-4 text-blue-600" />
                <span>Имейл</span>
              </a>

              {/* Web Share API */}
              <button
                type="button"
                onClick={handleWebShare}
                className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs font-bold text-zinc-800 transition-all hover:bg-zinc-100 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <Share2 className="size-4 text-zinc-600" />
                <span>Сподели...</span>
              </button>
            </div>
          </div>
        </div>

        {/* Fixed Sticky Footer */}
        <div className="shrink-0 flex items-center justify-between gap-2.5 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:px-6 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <a
            href={verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            <ExternalLink className="size-3.5" />
            <span className="hidden sm:inline">Отвори публичната страница</span>
            <span className="sm:hidden">Преглед</span>
          </a>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 sm:h-10 rounded-xl px-4 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Затвори
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
