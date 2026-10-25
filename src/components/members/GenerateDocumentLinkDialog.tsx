"use client";

import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  MessageCircle,
  RefreshCw,
  Share2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { createDocumentRequestAction } from "@/lib/actions/document-requests";
import { formatFullName } from "@/lib/utils";
import { DOCUMENT_TITLES, DocumentType } from "@/types/document-request.types";
import { Member } from "@/types/member.types";

interface GenerateDocumentLinkDialogProps {
  member: Member;
  documentType: DocumentType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated?: () => void;
}

export function GenerateDocumentLinkDialog({
  member,
  documentType,
  open,
  onOpenChange,
  onGenerated,
}: GenerateDocumentLinkDialogProps) {
  const { idToken, getFreshToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const memberName = formatFullName(member);
  const documentTitle = DOCUMENT_TITLES[documentType] || "Документ";

  // Use refs to prevent infinite re-render loops from callback prop changes
  const onGeneratedRef = useRef(onGenerated);
  useEffect(() => {
    onGeneratedRef.current = onGenerated;
  }, [onGenerated]);

  const hasGeneratedRef = useRef(false);
  const currentKey = `${member.id}-${documentType}`;
  const lastKeyRef = useRef<string>("");

  const generateLink = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const token = idToken || (await getFreshToken());
      if (!token) {
        setErrorMessage(
          "Грешка при оторизация. Моля, презаредете страницата или влезте отново."
        );
        setLoading(false);
        return;
      }

      const res = await createDocumentRequestAction({
        memberId: member.id,
        documentType,
        idToken: token,
      });

      if (res.success && res.data) {
        const origin =
          typeof window !== "undefined"
            ? window.location.origin
            : "https://bkgalabovo2025.vercel.app";
        const fullUrl = `${origin}/sign/${res.data.token}`;
        setGeneratedUrl(fullUrl);
        hasGeneratedRef.current = true;
        lastKeyRef.current = currentKey;

        // Notify parent safely without re-triggering this effect
        if (onGeneratedRef.current) {
          onGeneratedRef.current();
        }
      } else {
        setErrorMessage(res.error || "Грешка при генериране на линк.");
      }
    } catch (err) {
      console.error("Error generating link:", err);
      setErrorMessage("Възникна непредвидена грешка при създаване на линка.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setGeneratedUrl(null);
      setErrorMessage(null);
      setCopied(false);
      hasGeneratedRef.current = false;
      lastKeyRef.current = "";
      return;
    }

    // Only auto-generate once per open session or when documentType changes
    if (!hasGeneratedRef.current || lastKeyRef.current !== currentKey) {
      generateLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member.id, documentType]);

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      toast.success("Линкът е копиран в клипборда!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Неуспешно копиране. Моля, копирайте ръчно.");
    }
  };

  const shareText = `Здравейте! Изпращам Ви линк за онлайн попълване и подписване на „${documentTitle}” за ${memberName} в Бадминтон клуб Гълъбово: ${
    generatedUrl || ""
  }`;

  const handleViberShare = () => {
    if (!generatedUrl) return;
    const viberUrl = `viber://forward?text=${encodeURIComponent(shareText)}`;
    window.open(viberUrl, "_blank");
  };

  const handleWhatsAppShare = () => {
    if (!generatedUrl) return;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-4 sm:p-5 bg-white">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7.5 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <LinkIcon className="size-4" />
            </span>
            <DialogTitle className="text-base sm:text-lg font-bold text-zinc-950">
              Линк за онлайн подписване
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-500 pt-0.5">
            Изпратете този линк на родителя за попълване и подпис от телефон или
            компютър.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2.5 space-y-3">
          {/* Document & Member pill */}
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Документ:</span>
              <span className="font-semibold text-zinc-900">
                {documentTitle}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Състезател:</span>
              <span className="font-semibold text-zinc-900">{memberName}</span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="size-8 animate-spin text-zinc-900" />
              <p className="text-xs text-zinc-500">
                Генериране на сигурен криптографски токен...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-3 text-center">
              <div className="flex items-center justify-center gap-2 text-rose-700 text-xs font-semibold">
                <AlertCircle className="size-4" />
                <span>{errorMessage}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateLink}
                className="rounded-xl border-rose-300 text-rose-800 hover:bg-rose-100 text-xs"
              >
                <RefreshCw className="size-3.5 mr-1.5" />
                Опитай отново
              </Button>
            </div>
          ) : generatedUrl ? (
            <div className="space-y-4">
              {/* URL Input and Copy */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Линк за споделяне
                </label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={generatedUrl}
                    className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs font-mono select-all"
                  />
                  <Button
                    type="button"
                    onClick={handleCopy}
                    className="h-11 px-4 rounded-xl bg-zinc-950 text-white shrink-0 hover:bg-zinc-800"
                  >
                    {copied ? (
                      <Check className="size-4 text-emerald-400" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Direct Messenger Share Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Бързо изпращане
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleViberShare}
                    className="h-11 rounded-xl border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800 text-xs font-semibold gap-2"
                  >
                    <MessageCircle className="size-4" />
                    Viber
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleWhatsAppShare}
                    className="h-11 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 text-xs font-semibold gap-2"
                  >
                    <Share2 className="size-4" />
                    WhatsApp
                  </Button>
                </div>
              </div>

              {/* Open in new tab & validity */}
              <div className="pt-2 flex justify-between items-center text-[11px] text-zinc-500">
                <span>Валидност: 14 дни</span>
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-zinc-900 hover:underline"
                >
                  Отвори линка <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
