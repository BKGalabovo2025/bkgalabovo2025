"use client";

import {
  AlertTriangle,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Users,
} from "lucide-react";
import React from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarketingChannel, MarketingRecipient } from "@/types/marketing.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: MarketingChannel;
  recipients: MarketingRecipient[];
  messageText: string;
  emailSubject?: string;
  onConfirm: () => void;
  isSending: boolean;
}

export function MassSendConfirmationDialog({
  open,
  onOpenChange,
  channel,
  recipients,
  messageText,
  emailSubject,
  onConfirm,
  isSending,
}: Props) {
  const count = recipients.length;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-3xl p-6 sm:max-w-lg">
        <AlertDialogHeader className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-black text-zinc-950 dark:text-white">
                Потвърждение за изпращане
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-zinc-500">
                Прегледайте детайлите преди да стартирате кампанията
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary Pills */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Канал
              </span>
              <div className="flex items-center gap-1.5 text-xs font-black text-zinc-800 dark:text-zinc-200">
                {channel === "whatsapp" && (
                  <MessageCircle className="size-4 text-emerald-600" />
                )}
                {channel === "viber" && (
                  <Phone className="size-4 text-purple-600" />
                )}
                {channel === "sms" && (
                  <MessageSquare className="size-4 text-blue-600" />
                )}
                {channel === "email" && (
                  <Mail className="size-4 text-rose-600" />
                )}
                <span className="uppercase">{channel}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Получатели
              </span>
              <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400">
                <Users className="size-4" />
                <span>
                  {count} {count === 1 ? "член" : "членове"}
                </span>
              </div>
            </div>
          </div>

          {/* Email Subject if Email */}
          {channel === "email" && emailSubject && (
            <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-[10px] font-bold text-zinc-400">
                Тема:{" "}
              </span>
              <strong className="text-zinc-800 dark:text-zinc-200">
                {emailSubject}
              </strong>
            </div>
          )}

          {/* Recipients Sample List */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
              Списък на избраните получатели ({count}):
            </span>
            <ScrollArea className="h-24 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex flex-wrap gap-1.5">
                {recipients.map((r) => (
                  <Badge
                    key={r.id}
                    variant="outline"
                    className="rounded-lg border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {r.name}
                    {r.childName && ` (${r.childName})`}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Message Preview Box */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
              Текст на съобщението:
            </span>
            <div className="max-h-24 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs whitespace-pre-wrap text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              {messageText}
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel
            disabled={isSending}
            className="rounded-xl border-zinc-200 text-xs font-bold"
          >
            Отказ
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSending}
            className="rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Изпращане...
              </>
            ) : (
              <>
                <Send className="mr-1.5 size-3.5" />
                Потвърди и изпрати ({count})
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
