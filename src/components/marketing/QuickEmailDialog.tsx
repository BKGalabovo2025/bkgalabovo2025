"use client";

import { Loader2, Mail, Send } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  isTemplateForSender,
  MarketingRecipient,
  MarketingTemplate,
} from "@/types/marketing.types";

interface QuickEmailDialogProps {
  recipients: MarketingRecipient[];
  templates: MarketingTemplate[];
  isOpen: boolean;
  onClose: () => void;
  idToken?: string | null;
  siteId?: string;
  onSuccess?: () => void;
}

export function QuickEmailDialog({
  recipients,
  templates,
  isOpen,
  onClose,
  idToken,
  siteId = "bkgalabovo",
  onSuccess,
}: QuickEmailDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [senderProfile, setSenderProfile] = useState<
    "bkgalabovo" | "recoveryzone"
  >(siteId === "recoveryzone" ? "recoveryzone" : "bkgalabovo");
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const singleRecipient = recipients.length === 1 ? recipients[0] : null;

  // Filter templates strictly by the chosen sender profile
  const availableTemplates = useMemo(() => {
    return templates.filter((t: MarketingTemplate) =>
      isTemplateForSender(t, senderProfile)
    );
  }, [templates, senderProfile]);

  // Personalize message for preview
  const getPersonalizedText = (text: string, r?: MarketingRecipient | null) => {
    if (!r) return text;
    return text
      .replace(/{ИМЕ}/g, r.name)
      .replace(/{ДЕТЕ}/g, r.childName || r.name)
      .replace(/{СЪБИТИЕ}/g, "Клубно събитие")
      .replace(/{ДАТА}/g, new Date().toLocaleDateString("bg-BG"))
      .replace(/{ЧАС}/g, "18:00 ч.")
      .replace(
        /{ЛОКАЦИЯ}/g,
        senderProfile === "recoveryzone"
          ? "Спортна зала „Енергетик“ - Recovery Zone by ZM"
          : 'Спортна зала „Енергетик"'
      )
      .replace(
        /{ЛИНК_АНКЕТА}/g,
        "https://bkgalabovo2025.vercel.app/feedback/sample"
      );
  };

  useEffect(() => {
    if (selectedTemplateId) {
      const tmpl = availableTemplates.find(
        (t: MarketingTemplate) => t.id === selectedTemplateId
      );
      if (tmpl) {
        setSubject(tmpl.subject || tmpl.title);
        setMessageText(
          singleRecipient
            ? getPersonalizedText(tmpl.messageText, singleRecipient)
            : tmpl.messageText
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateId, availableTemplates]);

  const handleSenderProfileChange = (
    newSender: "bkgalabovo" | "recoveryzone"
  ) => {
    setSenderProfile(newSender);
    setSelectedTemplateId("");
    if (newSender === "recoveryzone") {
      setSubject("Известие от Recovery Zone by ZM");
      setMessageText(
        singleRecipient
          ? `Здравейте, ${singleRecipient.name}!\n\nПишем Ви от центъра за възстановяване Recovery Zone by ZM във връзка с...`
          : "Здравейте, {ИМЕ}!\n\nПишем Ви от центъра за възстановяване Recovery Zone by ZM във връзка с..."
      );
    } else {
      setSubject("Известие от БК Гълъбово");
      setMessageText(
        singleRecipient
          ? `Здравейте, ${singleRecipient.name}!\n\nПишем Ви от Бадминтон Клуб Гълъбово във връзка с...`
          : "Здравейте, {ИМЕ}!\n\nПишем Ви от Бадминтон Клуб Гълъбово във връзка с..."
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplateId("");
      const initialSender: "bkgalabovo" | "recoveryzone" =
        singleRecipient?.siteId === "recoveryzone" || siteId === "recoveryzone"
          ? "recoveryzone"
          : "bkgalabovo";
      setSenderProfile(initialSender);

      if (initialSender === "recoveryzone") {
        setSubject("Известие от Recovery Zone by ZM");
        setMessageText(
          singleRecipient
            ? `Здравейте, ${singleRecipient.name}!\n\nПишем Ви от Recovery Zone by ZM във връзка с...`
            : "Здравейте, {ИМЕ}!\n\nПишем Ви от Recovery Zone by ZM във връзка с..."
        );
      } else if (singleRecipient) {
        setSubject("Известие от БК Гълъбово");
        setMessageText(
          `Здравейте, ${singleRecipient.name}!\n\nПишем Ви от Бадминтон Клуб Гълъбово във връзка с...`
        );
      } else {
        setSubject("Клубно съобщение");
        setMessageText(
          "Здравейте, {ИМЕ}!\n\nПишем Ви от Бадминтон Клуб Гълъбово във връзка с..."
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, recipients]);

  const validRecipients = recipients.filter((r) => Boolean(r.email));

  const handleSendViaServer = async () => {
    if (validRecipients.length === 0) {
      toast.error(
        "Нито един от избраните получатели няма въведен имейл адрес."
      );
      return;
    }
    if (!subject.trim()) {
      toast.error("Моля, въведете тема на имейла.");
      return;
    }
    if (!messageText.trim()) {
      toast.error("Моля, въведете текст на съобщението.");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/marketing/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          recipients: validRecipients.map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            childName: r.childName,
            phone: r.phone,
          })),
          subject: subject.trim(),
          messageText: messageText.trim(),
          templateTitle:
            templates.find((t) => t.id === selectedTemplateId)?.title ||
            "Директен имейл",
          siteId,
          senderProfile,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const senderLabel =
          senderProfile === "recoveryzone"
            ? "Recovery Zone by ZM"
            : "БК Гълъбово";
        toast.success(
          data.message ||
            `Успешно изпратени ${validRecipients.length} имейла от пощата на ${senderLabel}!`
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.error || "Грешка при изпращането на имейлите.");
      }
    } catch (err) {
      console.error("Failed to send email via server:", err);
      toast.error("Сървърна грешка при изпращане на имейл.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Mail className="size-5" />
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
              {singleRecipient
                ? `Изпращане на официален имейл до ${singleRecipient.name}`
                : `Изпращане на официален имейл до ${recipients.length} получатели`}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-500">
            {singleRecipient ? (
              <span>
                Имейл адрес:{" "}
                <strong>{singleRecipient.email || "Няма въведен имейл"}</strong>
              </span>
            ) : (
              <span>
                Валидни имейл адреси: {validRecipients.length} от{" "}
                {recipients.length} избрани.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Sender Identity Selector */}
          <div className="space-y-1.5">
            <Label
              htmlFor="quick-email-sender"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              Изпрати от официалната поща на: *
            </Label>
            <Select
              value={senderProfile}
              onValueChange={(v) =>
                handleSenderProfileChange(v as "bkgalabovo" | "recoveryzone")
              }
            >
              <SelectTrigger
                id="quick-email-sender"
                name="quick-email-sender"
                className="h-10 rounded-xl text-xs font-semibold"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="bkgalabovo">
                  🏸 Бадминтон Клуб Гълъбово (Клубна поща)
                </SelectItem>
                <SelectItem value="recoveryzone">
                  🌿 Recovery Zone by ZM (Поща за възстановяване)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Select Filtered strictly by Sender Profile */}
          {availableTemplates.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="quick-email-template"
                  className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
                >
                  Шаблони за{" "}
                  {senderProfile === "recoveryzone"
                    ? "Recovery Zone by ZM"
                    : "БК Гълъбово"}{" "}
                  ({availableTemplates.length})
                </Label>
                <span className="text-[10px] text-zinc-400">
                  {senderProfile === "recoveryzone"
                    ? "🌿 Само за възстановяване"
                    : "🏸 Само за клубни дейности"}
                </span>
              </div>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              >
                <SelectTrigger
                  id="quick-email-template"
                  name="quick-email-template"
                  className="h-10 rounded-xl text-xs font-medium"
                >
                  <SelectValue placeholder="-- Изберете готов шаблон --" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availableTemplates.map((tmpl: MarketingTemplate) => (
                    <SelectItem
                      key={tmpl.id}
                      value={tmpl.id}
                      className="text-xs"
                    >
                      {tmpl.title} {tmpl.subject ? `(${tmpl.subject})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-1.5">
            <Label
              htmlFor="quick-email-subject"
              className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
            >
              Тема на имейла *
            </Label>
            <Input
              id="quick-email-subject"
              name="quick-email-subject"
              placeholder="напр. Информация за предстоящ клубен лагер"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          {/* Message Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="quick-email-body"
                className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
              >
                Текст на съобщението *
              </Label>
              <span className="text-[10px] text-zinc-400">
                Поддържа: {"{ИМЕ}"}, {"{ДЕТЕ}"}, {"{ДАТА}"}, {"{ЧАС}"}
              </span>
            </div>
            <Textarea
              id="quick-email-body"
              name="quick-email-body"
              rows={7}
              placeholder="Въведете съдържанието на Вашия имейл..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="font-sans text-xs leading-relaxed"
              required
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSending}
            className="text-xs"
          >
            Отказ
          </Button>

          {/* Direct Send via Server Option ONLY */}
          <Button
            type="button"
            onClick={handleSendViaServer}
            disabled={isSending || validRecipients.length === 0}
            className={`h-10 gap-2 rounded-xl px-5 text-xs font-bold text-white shadow-md transition-all ${
              senderProfile === "recoveryzone"
                ? "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-500 dark:shadow-none"
                : "bg-blue-600 shadow-blue-200 hover:bg-blue-500 dark:shadow-none"
            }`}
            title="Изпраща дизайнерски брандиран имейл директно от официалния сървър"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            <span>
              {senderProfile === "recoveryzone"
                ? `Изпрати от Recovery Zone (${validRecipients.length})`
                : `Изпрати от БК Гълъбово (${validRecipients.length})`}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
